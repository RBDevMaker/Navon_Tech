# 🚀 Deployment Checklist

## ⚠️ IMPORTANT: Deploy These Changes on Your Computer

You've made changes that require AWS deployment. Complete these steps when you're back on your computer with AWS CLI and SAM installed.

---

## 📋 Changes Made (Requiring Deployment)

### 1. **Employee Profile Persistence** ✅
   - **What**: Profiles now save to DynamoDB and persist across deployments
   - **Files Added**:
     - `backend/functions/employee-profile/index.js`
     - `backend/functions/employee-profile/package.json`
     - `frontend/src/services/profileService.js`
   - **Files Modified**:
     - `backend/template.yaml` (added EmployeeProfileFunction)
     - `frontend/src/SimpleApp.jsx` (integrated profile service)

### 2. **S3 Upload Function** ✅
   - **What**: Lambda function for uploading profile pictures and documents to S3
   - **Files Added**:
     - `backend/functions/s3-upload/index.js`
     - `backend/functions/s3-upload/package.json`
   - **Files Modified**:
     - `backend/template.yaml` (added S3UploadFunction)
     - `frontend/src/services/s3Upload.js` (updated to call Lambda)

---

## 🔧 Deployment Steps

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Install Dependencies
```bash
cd backend/functions/employee-profile
npm install

cd ../s3-upload
npm install

cd ../..
```

### Step 3: Build SAM Application
```bash
cd backend
sam build
```

### Step 4: Deploy to AWS
```bash
sam deploy
```

**Note**: If this is your first deployment or you need to reconfigure:
```bash
sam deploy --guided
```

### Step 5: Update Frontend Environment Variables
After deployment, you'll get an API Gateway URL. Update your frontend `.env` file:

```bash
cd ../frontend
```

Create or update `.env`:
```
VITE_API_BASE_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev
```

Replace `YOUR-API-ID` with the actual API Gateway ID from the deployment output.

### Step 6: Test the Deployment
1. Go to My Profile page
2. Fill out profile information
3. Upload a profile picture
4. Click "Save Changes"
5. Refresh the page - profile should persist
6. Check Team Directory - profile should appear

---

## 🎯 New API Endpoints Available After Deployment

### Profile Management
- `GET /api/profiles` - Get all employee profiles
- `GET /api/profiles/{employeeId}` - Get single profile
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/{employeeId}` - Update profile
- `DELETE /api/profiles/{employeeId}` - Delete profile

### S3 Upload
- `POST /api/upload-to-s3` - Upload files to S3 (profile pictures, documents)

---

## 📊 DynamoDB Structure

Profiles are stored with this structure:
```
PK: EMPLOYEE#{employeeId}
SK: PROFILE
```

Fields stored:
- employeeId, name, email, phone
- department, title, location
- emergencyContact, emergencyPhone
- profilePicture (S3 URL)
- salary, startDate, manager (HR-only fields)
- createdAt, updatedAt, active

---

## 🔍 Troubleshooting

### If deployment fails:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify SAM CLI version: `sam --version`
3. Check CloudFormation stack in AWS Console for errors

### If profiles don't save:
1. Check browser console for API errors
2. Verify API Gateway URL in `.env` file
3. Check Lambda logs in CloudWatch

### If S3 uploads fail:
1. Verify S3 bucket exists: `navon-tech-images`
2. Check Lambda has S3 permissions
3. Check CORS settings on S3 bucket

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] Profile saves successfully
- [ ] Profile persists after page refresh
- [ ] Profile picture uploads to S3
- [ ] Profile appears in Team Directory
- [ ] HR-only fields save correctly (when logged in as HR/Admin)
- [ ] Old profile picture deletes when uploading new one
- [ ] All profiles load in Team Directory

---

## 📝 Notes

- Profiles are stored in the existing `CompanyDataTable` DynamoDB table
- S3 bucket `navon-tech-images` is used for all uploads
- Profile pictures: `Team-Directory/profile-{employeeId}-{timestamp}.{ext}`
- Documents: `Documents/{category}/{filename}`
- Resumes: `resumes/{timestamp}-{filename}`

---

**Last Updated**: Current session
**Status**: ⏳ Pending deployment on computer with AWS CLI
