# S3 Storage Setup Guide

VCLop supports both **local file storage** and **AWS S3** (or S3-compatible services) for document uploads.

## Quick Start

### 1. Choose Storage Driver

Set `STORAGE_DRIVER` in your `.env` file:

```bash
# Use local filesystem (default)
STORAGE_DRIVER=local

# OR use S3
STORAGE_DRIVER=s3
```

### 2. Configure S3 (if using S3)

Add these variables to your `.env`:

```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
```

## AWS S3 Setup

### Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**
3. **Bucket name**: Choose a unique name (e.g., `vclop-documents-prod`)
4. **Region**: Select your preferred region (e.g., `us-east-1`)
5. **Block Public Access**: Uncheck "Block all public access" (we need public read for file URLs)
6. Click **Create bucket**

### Step 2: Configure Bucket Permissions

#### Option A: Bucket Policy (Recommended)

Go to your bucket → **Permissions** → **Bucket policy** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Replace `your-bucket-name` with your actual bucket name.

#### Option B: CORS Configuration (if accessing from frontend)

Go to **Permissions** → **CORS** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add users**
3. **User name**: `vclop-s3-uploader`
4. **Access type**: Select "Programmatic access"
5. Click **Next: Permissions**
6. Choose **Attach existing policies directly**
7. Select **AmazonS3FullAccess** (or create a custom policy)
8. Click through to **Create user**
9. **Important**: Save the **Access Key ID** and **Secret Access Key**

#### Custom IAM Policy (More Secure)

Instead of `AmazonS3FullAccess`, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### Step 4: Update Environment Variables

```bash
STORAGE_DRIVER=s3
S3_BUCKET=vclop-documents-prod
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Alternative S3-Compatible Services

### DigitalOcean Spaces

DigitalOcean Spaces is S3-compatible and often cheaper than AWS S3.

1. Create a Space at [DigitalOcean](https://cloud.digitalocean.com/spaces)
2. Generate API keys in **API** → **Spaces access keys**
3. Configure:

```bash
STORAGE_DRIVER=s3
S3_BUCKET=your-space-name
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY_ID=your-spaces-key
S3_SECRET_ACCESS_KEY=your-spaces-secret
```

### MinIO (Self-Hosted)

MinIO is an open-source S3-compatible object storage server.

```bash
STORAGE_DRIVER=s3
S3_BUCKET=vclop-documents
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

### Wasabi

Wasabi is another S3-compatible service with simpler pricing.

```bash
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.wasabisys.com
S3_ACCESS_KEY_ID=your-wasabi-key
S3_SECRET_ACCESS_KEY=your-wasabi-secret
```

## Testing S3 Configuration

### 1. Install Dependencies

```bash
cd vclop-backend
npm install
```

### 2. Start the Server

```bash
npm run start:dev
```

### 3. Upload a Test File

Use the customer registration form or any file upload endpoint to test. The backend will log:

```
[StorageService] Storage driver initialized: S3 (bucket: your-bucket-name, region: us-east-1)
```

### 4. Verify File Upload

Check your S3 bucket to ensure files are being uploaded. Files will be organized in folders:
- `general/` - General uploads
- `customers/` - Customer documents
- `loans/` - Loan documents
- `compliance/` - Compliance documents

## Switching from Local to S3

### 1. Migrate Existing Files (Optional)

If you have files in `./uploads`, you can migrate them to S3:

```bash
# Use AWS CLI to sync
aws s3 sync ./uploads s3://your-bucket-name/ --acl public-read
```

### 2. Update Database URLs

If you're switching storage drivers in production, you'll need to update file URLs in the database:

```sql
-- Example: Update customer document URLs
UPDATE customer_documents
SET file_url = REPLACE(file_url, '/uploads/', 'https://your-bucket-name.s3.us-east-1.amazonaws.com/')
WHERE file_url LIKE '/uploads/%';
```

**Important**: Create a database backup before running update queries!

## Cost Considerations

### AWS S3 Pricing (as of 2024)

- **Storage**: ~$0.023/GB/month (first 50TB)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09/GB (after first 1GB free)

**Estimated monthly cost for 10,000 documents (~10GB)**:
- Storage: $0.23
- Uploads: $0.05
- Downloads: $4.00 (assuming 5,000 views)
- **Total**: ~$5/month

### DigitalOcean Spaces Pricing

- **$5/month flat rate** includes:
  - 250GB storage
  - 1TB outbound transfer
- Additional storage: $0.02/GB
- Additional transfer: $0.01/GB

**Better value for small to medium workloads!**

## Troubleshooting

### Error: "Storage driver 's3' not yet implemented"

**Solution**: Update dependencies and rebuild:

```bash
cd vclop-backend
npm install
npm run build
```

### Error: "Access Denied"

**Causes**:
1. Incorrect IAM permissions
2. Bucket policy doesn't allow public read
3. Wrong access keys

**Solution**: Verify IAM policy and bucket permissions.

### Files Upload but Return 403 on Access

**Cause**: Bucket is not configured for public read access.

**Solution**: Add bucket policy (see Step 2 above).

### Files Don't Appear in Expected Folder

**Cause**: Storage service creates folder structure automatically.

**Solution**: Files are organized by folder prefix in the key (e.g., `customers/uuid.pdf`).

## Security Best Practices

1. **Use IAM roles** instead of access keys when running on AWS EC2/ECS
2. **Enable bucket versioning** to recover deleted files
3. **Enable server-side encryption** (SSE-S3 or SSE-KMS)
4. **Set lifecycle policies** to archive old documents to Glacier
5. **Enable CloudTrail logging** for audit trails
6. **Use CloudFront CDN** for better performance and lower costs
7. **Rotate access keys** regularly (every 90 days)
8. **Use separate buckets** for different environments (dev, staging, prod)

## Performance Optimization

### Use CloudFront CDN

1. Create a CloudFront distribution pointing to your S3 bucket
2. Update `.env`:

```bash
S3_PUBLIC_URL=https://d111111abcdef8.cloudfront.net
```

This will serve files from CloudFront instead of directly from S3, improving speed and reducing costs.

### Enable S3 Transfer Acceleration

For faster uploads from distant regions:

```bash
S3_ENDPOINT=https://your-bucket-name.s3-accelerate.amazonaws.com
```

## Support

For issues or questions:
- Check the [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- Review backend logs for detailed error messages
- Contact your DevOps team for AWS account access
