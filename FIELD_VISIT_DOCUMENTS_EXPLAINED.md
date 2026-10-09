# Field Visit Documents - Where Do They Go?

## Overview
Field visit photos are stored **directly in the database** as compressed base64-encoded images in the `field_visits.photos` column.

## Storage Method

### Database Schema
```sql
field_visits (
  id VARCHAR(36),
  loanApplicationId VARCHAR(36),
  visitType VARCHAR(50),        -- BUSINESS, RESIDENCE, EMPLOYER, GUARANTOR, OTHER
  conductedById VARCHAR(36),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  arrivedAt DATETIME,
  completedAt DATETIME,
  findings TEXT,
  photos LONGTEXT,               -- ← JSON array of base64 image data
  createdAt DATETIME,
  updatedAt DATETIME
)
```

### Photo Format
- **Storage:** Base64-encoded JPEG data URLs stored as JSON array
- **Compression:** Images resized to max 800px (width or height) at 60% JPEG quality
- **Example format:**
```json
[
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
]
```

## Where They Appear

### 1. Customer Profile → Field Verification Tab
**Path:** Customers page → Select customer → Field Verification tab

**Who can see:**
- ✅ Compliance Officers (can log AND view visits)
- ✅ Internal Control (read-only access)
- ✅ Admin

**Features:**
- View all field visits for this customer across ALL their loan applications
- See photos, GPS coordinates, timestamps, findings
- Log new visits (CO only)

### 2. Loan Application → Compliance Review Panel
**Path:** Compliance queue → Select loan → Field Visits section

**Who can see:**
- ✅ Compliance Officers (can log AND view)
- ✅ Anyone with loan_applications:read permission

**Features:**
- View field visits for THIS specific loan application
- Also shows visits from the same customer's other applications
- Log new visits during compliance review

### 3. Internal Control Page
**Path:** Internal Control dashboard → Select loan

**Who can see:**
- ✅ Internal Control staff
- ✅ Admin

**Features:**
- Read-only view of all field visits
- Part of the loan audit trail

## Photo Upload Process

### Frontend (React)
1. User clicks "Take / Upload Photos"
2. File input accepts: `image/*` with `capture="environment"` for camera
3. JavaScript reads each file with `FileReader.readAsDataURL()`
4. Image is loaded into HTML `<Image>` element
5. Canvas resizes to max 800px dimension
6. Canvas exports as JPEG at 60% quality: `canvas.toDataURL('image/jpeg', 0.6)`
7. Base64 string added to form state array
8. On submit, array is `JSON.stringify()`'d and sent to backend

### Backend (NestJS)
1. Receives `photos: string` (JSON array as string)
2. Stores directly in MySQL `LONGTEXT` column
3. No file system storage, no S3, no separate documents table

### Display
1. Frontend reads `photos` field from API
2. Parses JSON: `JSON.parse(v.photos)`
3. Renders as `<img src={base64DataUrl} />`
4. Click opens in new tab (can be saved from there)

## Advantages

✅ **Simple:** No file storage infrastructure needed  
✅ **Embedded:** Photos travel with the field visit record  
✅ **Transactional:** Atomic saves with database transaction  
✅ **Backup:** Included in database backups  
✅ **Fast:** No external API calls for retrieval

## Limitations

⚠️ **Size:** LONGTEXT max = 4GB per row (compressed JPEGs are small, ~50-200KB each)  
⚠️ **Database bloat:** Photos increase backup size  
⚠️ **No metadata:** Can't search by photo properties  
⚠️ **Performance:** Large base64 strings in API responses (mitigated by compression)

## Recommended Usage

### Best Practices
- **Limit:** 3-5 photos per visit (enforced by UX, not validation)
- **Compression:** Already optimized (800px @ 60% JPEG)
- **Mobile:** Use `capture="environment"` to trigger camera directly
- **GPS:** Always capture GPS with photos for verification

### When to Use
- ✅ Business premises photos
- ✅ Residence verification
- ✅ Stock/inventory verification
- ✅ Guarantor verification
- ✅ Employer verification

### When NOT to Use
- ❌ Customer profile documents (use CustomerDocument system instead)
- ❌ Loan agreement PDFs (use separate document storage)
- ❌ High-resolution archival photos (these are verification snapshots)

## Alternative: CustomerDocument System

For **formal documents** (ID cards, utility bills, business registration), use the separate **CustomerDocument** system:

```typescript
// Upload to CustomerDocument
customersService.uploadDocument(customerId, documentTypeId, file)

// Stored separately with:
- File storage (S3 or local filesystem)
- Document type categorization
- Verification workflow
- Rejection/approval status
```

## Technical Files

**Schema:** `vclop-backend/prisma/schema.prisma` → `model FieldVisit`  
**API Service:** `vclop-backend/src/modules/compliance/compliance.service.ts`  
**API Controller:** `vclop-backend/src/modules/compliance/compliance.controller.ts`  
**Frontend Component:** `vclop-frontend/src/pages/customers/tabs/CustomerFieldVerificationTab.tsx`  
**Frontend Service:** `vclop-frontend/src/services/compliance.service.ts`

## Summary

**Field visit photos → Stored as compressed base64 JPEGs → In MySQL database → `field_visits.photos` column → Displayed inline in Customer Profile and Compliance Review**

No separate file storage system. Everything is database-embedded for simplicity.
