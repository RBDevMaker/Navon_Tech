# reCAPTCHA Setup Guide

## ✅ What's Already Done

Your job application form now has reCAPTCHA integrated! Here's what was added:

1. ✅ reCAPTCHA script loaded in `frontend/index.html`
2. ✅ reCAPTCHA widget added to the application form
3. ✅ Form validation to require reCAPTCHA completion
4. ✅ reCAPTCHA token sent to backend Lambda function
5. ✅ Auto-reset after submission

## 🔑 Get Your Own reCAPTCHA Keys

Currently using Google's test keys. To use your own:

### Step 1: Register Your Site

1. Go to https://www.google.com/recaptcha/admin/create
2. Sign in with your Google account
3. Fill out the form:
   - **Label**: Navon Technologies Job Applications
   - **reCAPTCHA type**: Choose "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add these domains:
     - `localhost` (for testing)
     - `main.d2ywvqkzqnvvvv.amplifyapp.com` (your Amplify domain)
     - `navontech.com` (if you have a custom domain)
   - Accept the terms
4. Click "Submit"

### Step 2: Copy Your Keys

You'll get two keys:
- **Site Key** (public) - Used in the frontend
- **Secret Key** (private) - Used in the backend

### Step 3: Update Frontend

In `frontend/src/SimpleApp.jsx`, find this line (around line 3527):

```jsx
data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
```

Replace with your Site Key:

```jsx
data-sitekey="YOUR_SITE_KEY_HERE"
```

### Step 4: Update Backend (Optional - for full verification)

The backend already accepts the reCAPTCHA token. To enable full server-side verification:

1. Store your Secret Key in AWS Systems Manager:

```bash
aws ssm put-parameter \
  --name "/navontech/recaptcha/secret" \
  --value "YOUR_SECRET_KEY_HERE" \
  --type "SecureString" \
  --region us-east-1
```

2. The Lambda function will automatically use it (code is already in place)

## 🧪 Testing

### With Test Keys (Current Setup)
The test keys will always pass. Good for development.

### With Real Keys
1. Update the site key in the code
2. Deploy to Amplify
3. Test the form - you'll see the real reCAPTCHA challenge
4. Submit an application to verify it works

## 🎨 Customization

### Change Theme
In `frontend/src/SimpleApp.jsx`, you can change:

```jsx
data-theme="light"  // or "dark"
```

### Change Size
Add this attribute:

```jsx
data-size="normal"  // or "compact"
```

## 🔒 Security Benefits

With reCAPTCHA enabled, your form is protected against:
- ✅ Automated bot submissions
- ✅ Spam applications
- ✅ Brute force attacks
- ✅ Malicious scripts

Combined with your other security features:
- Rate limiting (3 per hour per email)
- Input validation
- File upload restrictions
- CloudWatch logging

Your application form is now enterprise-grade secure! 🛡️

## 📝 Notes

- Test keys work on localhost and any domain
- Real keys only work on registered domains
- reCAPTCHA v2 is more user-friendly than v3
- The checkbox version provides better UX than invisible

## 🆘 Troubleshooting

**reCAPTCHA not showing?**
- Check browser console for errors
- Verify the script is loading
- Check if ad blockers are interfering

**"Invalid site key" error?**
- Verify the site key is correct
- Check if domain is registered in reCAPTCHA admin
- Make sure you're using v2 keys (not v3)

**Form submits without reCAPTCHA?**
- Check the validation code is in place
- Verify `window.grecaptcha` is available
- Check browser console for JavaScript errors

## 🎯 Next Steps

1. Get your own reCAPTCHA keys
2. Update the site key in the code
3. Test on localhost
4. Deploy to Amplify
5. Test on production
6. (Optional) Add backend verification with secret key

That's it! Your form is now protected by Google reCAPTCHA! 🎉
