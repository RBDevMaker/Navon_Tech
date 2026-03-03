# How to Verify Your Domain in AWS SES with GoDaddy

## Step 1: Get DKIM Records from AWS SES

1. Go to **AWS SES Console**: https://console.aws.amazon.com/ses/
2. Make sure you're in **us-east-1** region (top right)
3. Click **Identities** in the left menu
4. Click **Create identity** button
5. Choose **Domain**
6. Enter your domain: `navontech.com`
7. Check the box: **Use a custom MAIL FROM domain** (optional but recommended)
8. Click **Create identity**

AWS will show you 3 CNAME records to add to GoDaddy:
- 3 DKIM records (for email authentication)
- 1 MAIL FROM record (optional)

**Copy these records** - you'll need them for GoDaddy!

---

## Step 2: Add DKIM Records to GoDaddy

1. Go to **GoDaddy**: https://www.godaddy.com/
2. Sign in to your account
3. Click **My Products**
4. Find your domain `navontech.com`
5. Click **DNS** button next to it

### Add Each DKIM Record:

For each of the 3 DKIM records AWS gave you:

1. Click **Add** button (or **Add New Record**)
2. Select **Type**: `CNAME`
3. **Name/Host**: Copy from AWS (it will look like: `abc123._domainkey`)
   - **Important**: Remove `.navontech.com` from the end if it's there
   - Just use the part before your domain name
   - Example: If AWS shows `abc123._domainkey.navontech.com`, just enter `abc123._domainkey`
4. **Value/Points to**: Copy the full value from AWS (ends with `.amazonses.com`)
5. **TTL**: Leave as default (or set to 600)
6. Click **Save**

Repeat for all 3 DKIM records!

---

## Step 3: Verify in AWS SES

1. Go back to **AWS SES Console**
2. Click **Identities**
3. Click on your domain `navontech.com`
4. Look for **DKIM** section
5. Status should change from "Pending" to "Successful" (takes 5-30 minutes)

**Note**: It can take up to 72 hours, but usually happens within 30 minutes.

---

## Step 4: Verify Email Address (Quick Alternative)

While waiting for domain verification, you can verify individual email addresses:

1. In **AWS SES Console**, click **Identities**
2. Click **Create identity**
3. Choose **Email address**
4. Enter: `hr@navontech.com`
5. Click **Create identity**
6. Check your email inbox
7. Click the verification link in the email from AWS

Now you can send FROM `hr@navontech.com` immediately!

---

## Troubleshooting

### DKIM Records Not Verifying?

**Common Issues:**

1. **Wrong Name/Host field**:
   - ❌ Wrong: `abc123._domainkey.navontech.com`
   - ✅ Correct: `abc123._domainkey`
   - GoDaddy automatically adds your domain name

2. **Typo in Value field**:
   - Make sure you copied the ENTIRE value from AWS
   - Should end with `.amazonses.com`

3. **DNS Propagation**:
   - Can take 5-30 minutes
   - Sometimes up to 72 hours
   - Be patient!

4. **Check DNS Records**:
   - Use this tool: https://mxtoolbox.com/SuperTool.aspx
   - Enter: `abc123._domainkey.navontech.com` (use your actual DKIM name)
   - Should show the CNAME pointing to `.amazonses.com`

---

## What Each Record Does

- **DKIM Records (3 of them)**: Prove you own the domain and authenticate your emails
- **MAIL FROM Record**: Allows you to use a custom bounce address (optional)

---

## Quick Checklist

- [ ] Created domain identity in AWS SES
- [ ] Copied all 3 DKIM records from AWS
- [ ] Added all 3 CNAME records to GoDaddy DNS
- [ ] Waited 30 minutes for DNS propagation
- [ ] Checked AWS SES - DKIM status shows "Successful"
- [ ] Verified hr@navontech.com email address
- [ ] Ready to send production access request!

---

## After Verification

Once your domain is verified:
1. ✅ You can send FROM any email @navontech.com
2. ✅ Your emails will have proper authentication
3. ✅ Better deliverability (less likely to go to spam)
4. ✅ Ready to request production access

---

## Need Help?

If you're stuck:
1. Double-check the Name/Host field (don't include your domain)
2. Make sure Value is complete and correct
3. Wait 30 minutes and refresh AWS SES page
4. Use MX Toolbox to verify DNS records are live

Good luck! 🚀
