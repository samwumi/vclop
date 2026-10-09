# Field Visit Photos Migration Plan
## Problem: Photos Currently Stored as Base64 in Database ❌

**Current implementation:**
- Photos stored as base64 JSON array in `field_visits.photos` LONGTEXT column
- Each photo ~50-200KB as base64
- Multiple photos per visit → database bloat
- Slow API responses with large payloads
- No CDN capability
- Expensive database backups

## Solution: Store Photos as Files (Like CustomerDocument) ✅

### New Architecture

**Create new table:**
```sql
CREATE TABLE field_visit_photos (
  id VARCHAR(36) PRIMARY KEY,
  fieldVisitId VARCHAR(36) NOT NULL,
  fileKey VARCHAR(500) NOT NULL,      -- e.g. "field-visits/uuid.jpg"
  fileUrl VARCHAR(1000) NOT NULL,     -- Full URL or path
  originalName VARCHAR(255),
  mimeType VARCHAR(100),
  size INT,
  displayOrder INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (fieldVisitId) REFERENCES field_visits(id) ON DELETE CASCADE,
  INDEX idx_field_visit (fieldVisitId)
);
```

**Update FieldVisit model:**
```prisma
model FieldVisit {
  id                String              @id @default(uuid()) @db.VarChar(36)
  loanApplicationId String              @db.VarChar(36)
  visitType         String              @db.VarChar(50)
  conductedById     String?             @db.VarChar(36)
  latitude          Decimal?            @db.Decimal(10, 8)
  longitude         Decimal?            @db.Decimal(11, 8)
  arrivedAt         DateTime?
  completedAt       DateTime?
  findings          String?             @db.Text
  photos            String?             @db.LongText  // DEPRECATED - will be removed after migration
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  photoFiles        FieldVisitPhoto[]   // NEW relationship

  @@index([loanApplicationId])
  @@map("field_visits")
}

model FieldVisitPhoto {
  id            String      @id @default(uuid()) @db.VarChar(36)
  fieldVisitId  String      @db.VarChar(36)
  fileKey       String      @db.VarChar(500)
  fileUrl       String      @db.VarChar(1000)
  originalName  String?     @db.VarChar(255)
  mimeType      String?     @db.VarChar(100)
  size          Int?
  displayOrder  Int         @default(0)
  createdAt     DateTime    @default(now())
  
  fieldVisit    FieldVisit  @relation(fields: [fieldVisitId], references: [id], onDelete: Cascade)

  @@index([fieldVisitId])
  @@map("field_visit_photos")
}
```

### Backend Changes

**1. New DTO for photo upload:**
```typescript
// compliance.controller.ts
@Post('field-visits/:id/photos')
@RequirePermissions('loan_applications:compliance_review')
@UseInterceptors(FilesInterceptor('photos', 10, { limits: { fileSize: 5 * 1024 * 1024 } }))
async uploadFieldVisitPhotos(
  @Param('id', ParseUUIDPipe) visitId: string,
  @UploadedFiles() files: Express.Multer.File[],
  @CurrentUser() user: RequestUser,
) {
  return ok(await this.service.uploadFieldVisitPhotos(visitId, files, user.id));
}
```

**2. Service implementation:**
```typescript
// compliance.service.ts
async uploadFieldVisitPhotos(
  visitId: string,
  files: Express.Multer.File[],
  actorId: string,
): Promise<FieldVisitPhoto[]> {
  const visit = await this.prisma.fieldVisit.findFirst({
    where: { id: visitId },
  });
  
  if (!visit) {
    throw new ResourceNotFoundException('Field visit', visitId);
  }

  const uploaded: FieldVisitPhoto[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stored = await this.storage.storeFile(file, 'field-visits');
    
    const photo = await this.prisma.fieldVisitPhoto.create({
      data: {
        fieldVisitId: visitId,
        fileKey: stored.key,
        fileUrl: stored.url,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        size: stored.size,
        displayOrder: i,
      },
    });
    
    uploaded.push(photo);
  }

  this.audit(actorId, AuditAction.UPDATE, visit.loanApplicationId, 
    `Uploaded ${uploaded.length} photo(s) to field visit`);
  
  return uploaded;
}

async deleteFieldVisitPhoto(photoId: string, actorId: string): Promise<void> {
  const photo = await this.prisma.fieldVisitPhoto.findFirst({
    where: { id: photoId },
    include: { fieldVisit: true },
  });
  
  if (!photo) {
    throw new ResourceNotFoundException('Field visit photo', photoId);
  }

  await this.storage.deleteFile(photo.fileKey);
  await this.prisma.fieldVisitPhoto.delete({ where: { id: photoId } });
  
  this.audit(actorId, AuditAction.UPDATE, photo.fieldVisit.loanApplicationId, 
    'Deleted field visit photo');
}
```

**3. Update field visit creation:**
```typescript
// Remove photos from DTO, photos uploaded separately
async addFieldVisit(applicationId: string, dto: {
  visitType: string;
  latitude?: number;
  longitude?: number;
  arrivedAt?: string;
  completedAt?: string;
  findings?: string;
  // photos removed - use separate upload endpoint
}, actorId: string) {
  await this.assertApplication(applicationId);
  return this.prisma.fieldVisit.create({
    data: {
      loanApplicationId: applicationId,
      visitType: dto.visitType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      arrivedAt: dto.arrivedAt ? new Date(dto.arrivedAt) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      findings: dto.findings,
      conductedById: actorId,
    },
    include: {
      photoFiles: true, // Include photos in response
    },
  });
}
```

### Frontend Changes

**1. Update form to upload files instead of base64:**
```typescript
// CustomerFieldVerificationTab.tsx
const [photoFiles, setPhotoFiles] = useState<File[]>([]);

function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
  const files = Array.from(e.target.files ?? []);
  setPhotoFiles([...photoFiles, ...files]);
  e.target.value = '';
}

const logMutation = useMutation({
  mutationFn: async () => {
    // Step 1: Create field visit (without photos)
    const visit = await complianceService.addCustomerFieldVisit(customerId, {
      visitType: form.visitType,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      arrivedAt: form.arrivedAt || undefined,
      completedAt: form.completedAt || undefined,
      findings: form.findings || undefined,
    });
    
    // Step 2: Upload photos separately
    if (photoFiles.length > 0) {
      const formData = new FormData();
      photoFiles.forEach(file => formData.append('photos', file));
      await api.post(`/compliance/field-visits/${visit.id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    
    return visit;
  },
  onSuccess: () => {
    toast.success('Field visit logged');
    setForm({ visitType: 'BUSINESS', latitude: '', longitude: '', arrivedAt: '', completedAt: '', findings: '' });
    setPhotoFiles([]);
    qc.invalidateQueries({ queryKey: ['customer-field-visits', customerId] });
  },
});
```

**2. Display photos from URLs:**
```tsx
{visit.photoFiles?.map((photo) => (
  <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noopener noreferrer">
    <img 
      src={photo.fileUrl} 
      alt={photo.originalName || 'Visit photo'}
      className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80"
    />
  </a>
))}
```

### Migration Steps

**Phase 1: Add New Schema (Non-Breaking)**
1. Add `FieldVisitPhoto` model to Prisma schema
2. Run migration to create table
3. Deploy backend with new endpoints (don't remove old logic yet)

**Phase 2: Migrate Existing Data**
```sql
-- Script to extract base64 photos and save as files
-- Run once: extract all photos from field_visits.photos, 
-- convert to files, insert into field_visit_photos
-- (Complex - needs Node.js script, not pure SQL)
```

**Phase 3: Update Frontend**
4. Update forms to upload files instead of base64
5. Update display to use photoFiles relationship
6. Test thoroughly

**Phase 4: Cleanup**
7. Drop `photos` column from `field_visits` table (after confirming migration)

### Benefits

✅ **Smaller database** - No more base64 bloat  
✅ **Faster queries** - Less data to fetch  
✅ **Smaller API payloads** - Only URLs returned  
✅ **CDN ready** - Can serve from S3/CloudFront  
✅ **Better performance** - Browser caches images  
✅ **Proper file management** - Delete, resize, optimize separately  
✅ **Storage flexibility** - Local, S3, or other storage drivers

### Considerations

⚠️ **Breaking change** - Requires coordinated backend + frontend deployment  
⚠️ **Data migration** - Need to convert existing base64 photos to files  
⚠️ **Storage costs** - Will use file storage (but cheaper than DB storage)

## Recommendation

**Do this migration ASAP** before more photos are added. The current approach won't scale.

Want me to implement this?
