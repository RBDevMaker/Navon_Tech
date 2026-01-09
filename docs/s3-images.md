# S3 Image Integration Guide

This document explains how images are managed and optimized in the Tech Company Platform.

## Architecture Overview

```
User Request → CloudFront CDN → S3 Bucket → Optimized Images
                    ↓
              Lambda@Edge (Optional)
              Image Optimization
```

## Image Storage Structure

```
s3-bucket/
├── public/
│   ├── hero/
│   ├── solutions/
│   ├── partners/
│   └── icons/
├── employee/
│   ├── profiles/
│   ├── projects/
│   └── resources/
└── uploads/
    ├── careers/
    └── temp/
```

## Image Optimization

### Responsive Images
The platform automatically serves different image sizes based on device:
- **Thumbnail**: 300px width
- **Medium**: 768px width  
- **Large**: 1200px width
- **Original**: Full resolution

### Format Optimization
- **WebP**: Modern browsers (Chrome, Firefox, Safari 14+)
- **JPEG**: Fallback for older browsers
- **PNG**: For images requiring transparency

## Usage Examples

### Basic Image Display
```jsx
import OptimizedImage from '../components/OptimizedImage';

<OptimizedImage
  src="hero/cloud-infrastructure.jpg"
  alt="Cloud Infrastructure"
  size="large"
/>
```

### Responsive Image with Custom Sizes
```jsx
<OptimizedImage
  src="solutions/serverless.jpg"
  alt="Serverless Architecture"
  className="solution-image"
  loading="lazy"
/>
```

### Private Employee Images
```jsx
// For employee-only content
const [imageUrl, setImageUrl] = useState('');

useEffect(() => {
  s3Service.getPrivateImageUrl('employee/profiles/john-doe.jpg')
    .then(setImageUrl);
}, []);

<img src={imageUrl} alt="Employee Profile" />
```

## Environment Configuration

### Required Environment Variables
```bash
# Frontend (.env)
REACT_APP_S3_BASE_URL=https://d1234567890.cloudfront.net
REACT_APP_S3_BUCKET_NAME=tech-company-images-prod

# Backend (SAM template)
S3_BUCKET=tech-company-images-prod
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

### CloudFront Configuration
```yaml
# CloudFront distribution for image optimization
Distribution:
  DistributionConfig:
    Origins:
      - DomainName: !GetAtt ImagesBucket.RegionalDomainName
        Id: S3Origin
        S3OriginConfig:
          OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OriginAccessIdentity}"
    DefaultCacheBehavior:
      TargetOriginId: S3Origin
      ViewerProtocolPolicy: redirect-to-https
      CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingOptimized
```

## Image Upload Workflow

### For Employees (Authenticated)
```jsx
const handleImageUpload = async (file) => {
  try {
    const imageKey = await s3Service.uploadImage(file, 'employee/uploads');
    console.log('Image uploaded:', imageKey);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### For Public Content (Admin Only)
```jsx
const uploadPublicImage = async (file, category) => {
  const imageKey = await s3Service.uploadImage(file, `public/${category}`);
  
  // Update content in DynamoDB
  await apiService.updateContent({
    type: 'image',
    category,
    imageKey,
    url: s3Service.getImageUrl(imageKey)
  });
};
```

## Performance Optimization

### Lazy Loading
All images use lazy loading by default:
```jsx
<OptimizedImage
  src="large-image.jpg"
  loading="lazy" // Default behavior
  alt="Description"
/>
```

### Preloading Critical Images
For above-the-fold images:
```jsx
<OptimizedImage
  src="hero-image.jpg"
  loading="eager"
  alt="Hero Image"
/>
```

### Image Compression
- **JPEG**: 85% quality for photos
- **WebP**: 80% quality for modern browsers
- **PNG**: Optimized with pngquant for icons

## Security Considerations

### Public Images
- Stored in `public/` folder
- Accessible via CloudFront
- No authentication required

### Private Images
- Stored in `employee/` folder
- Require presigned URLs
- Expire after 1 hour by default

### Upload Restrictions
```javascript
// File validation
const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
};
```

## Monitoring and Analytics

### CloudWatch Metrics
- Image request count
- Cache hit ratio
- Error rates
- Data transfer costs

### Cost Optimization
- Use appropriate image sizes
- Implement proper caching headers
- Monitor S3 storage classes
- Regular cleanup of unused images

## Troubleshooting

### Common Issues

1. **Images not loading**
   - Check CORS configuration
   - Verify CloudFront distribution
   - Confirm S3 bucket permissions

2. **Slow image loading**
   - Enable CloudFront caching
   - Use appropriate image sizes
   - Implement lazy loading

3. **Upload failures**
   - Check file size limits
   - Verify authentication
   - Confirm S3 permissions

### Debug Commands
```bash
# Test S3 access
aws s3 ls s3://tech-company-images-prod/

# Check CloudFront cache
aws cloudfront get-distribution --id E1234567890ABC

# Monitor Lambda@Edge logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/us-east-1
```