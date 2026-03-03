# AWS SES Domain Verification - Squarespace Version

## Step 1: Get DKIM Records from AWS SES

1. Go to **AWS SES Console**: https://console.aws.amazon.com/ses/
2. Click **Identities** in the left menu
3. Click on **navontech.com**
4. Find the **"DomainKeys Identified Mail (DKIM)"** section
5. You'll see 3 CNAME records - keep this page open!

Each record looks like:
```
Name: abc123._domainkey.navontech.com
Type: CNAME
Value: abc123.dkim.amazonses.com
```

**Write down or screenshot these 3 records!**

---

## Step 2: Add Records to Squarespace

### 2.1 Sign into Squarespace
1. Go to: https://www.squarespace.com/
2. Click **Log In** (top right)
3. Enter your email and password
4. Click **Log In**

### 2.2 Access Your Domain Settings
1. In the Squarespace dashboard, click **Settings** (left menu)
2. Click **Domains**
3. Click on **navontech.com**
4. Click **DNS Settings** or **Advanced Settings**

### 2.3 Add First DKIM Record

1. Look for **"Custom Records"** or **"Add Record"** button
2. Click it
3. You'll see a form with these fields:

**Record Type:**
- Select **CNAME** from the dropdown

**Host:**
- Look at your AWS record: `abc123._domainkey.navontech.com`
- Copy ONLY the part before `.navontech.com`
- Enter: `abc123._domainkey`
- **Important**: Don't include `.navontech.com` - Squarespace adds it automatically

**Data (or Value or Points To):**
- Copy the ENTIRE value from AWS
- Enter: `abc123.dkim.amazonses.com`
- Make sure you include `.amazonses.com` at the end

**Priority:** (if shown)
- Leave blank or use default

**TTL:** (if shown)
- Leave as default (usually 3600)

4. Click **Save** or **Add**

### 2.4 Add Second DKIM Record

1. Click **Add Record** again
2. Type: **CNAME**
3. Host: Enter the second DKIM name (without .navontech.com)
4. Data: Enter the second DKIM value (complete)
5. Click **Save**

### 2.5 Add Third DKIM Record

1. Click **Add Record** again
2. Type: **CNAME**
3. Host: Enter the third DKIM name (without .navontech.com)
4. Data: Enter the third DKIM value (complete)
5. Click **Save**

---

## Step 3: Verify Records Were Added

1. In Squarespace DNS Settings, scroll through your records
2. You should see 3 new CNAME records
3. Each should have `._domainkey` in the Host field
4. Each should point to `.dkim.amazonses.com`

---

## Step 4: Wait for Verification

### 4.1 DNS Propagation
- Typical time: 15-30 minutes
- Maximum: Up to 72 hours
- Squarespace is usually fast (15-20 minutes)

### 4.2 Check AWS SES
1. Go back to AWS SES Console
2. Click **Identities**
3. Click **navontech.com**
4. Look at DKIM status:
   - **Pending** (yellow) = Still waiting
   - **Successful** (green) = Verified! ✅
   - **Failed** (red) = Check your records

### 4.3 Refresh Every 5 Minutes
- Wait 5 minutes
- Refresh the AWS page
- Check status
- Repeat until "Successful"

---

## Troubleshooting

### Common Squarespace Issues:

**Issue 1: Can't find DNS Settings**
- Try: Settings > Domains > navontech.com > DNS Settings
- Or: Settings > Domains > navontech.com > Advanced Settings
- Or: Settings > Advanced > External DNS

**Issue 2: Records not saving**
- Make sure Host doesn't include `.navontech.com`
- Make sure Data includes full `.amazonses.com`
- Try using a different browser
- Clear browser cache

**Issue 3: DKIM stays "Pending"**
- Wait at least 30 minutes
- Check records in Squarespace are correct
- Use DNS checker: https://mxtoolbox.com/SuperTool.aspx
- Enter: `abc._domainkey.navontech.com` (your actual DKIM name)
- Should show CNAME pointing to `.amazonses.com`

---

## Important Notes

### Squarespace DNS vs External DNS

**If your domain uses Squarespace DNS:**
- Follow the steps above
- Add records in Squarespace dashboard

**If your domain uses External DNS (like GoDaddy):**
- You'll see a message saying "This domain uses external DNS"
- You need to add records at your DNS provider (GoDaddy, Cloudflare, etc.)
- Check where your nameservers point to

**To check nameservers:**
1. Go to: https://www.whatsmydns.net/
2. Select "NS" from dropdown
3. Enter: navontech.com
4. Click Search
5. Look at the results - they'll show your nameserver provider

---

## Example: What Your Records Should Look Like

In Squarespace, you should see something like:

| Type  | Host                    | Data                              |
|-------|-------------------------|-----------------------------------|
| CNAME | abc123._domainkey       | abc123.dkim.amazonses.com         |
| CNAME | def456._domainkey       | def456.dkim.amazonses.com         |
| CNAME | ghi789._domainkey       | ghi789.dkim.amazonses.com         |

(Your actual values will be different random strings)

---

## After Verification

Once DKIM shows "Successful" in AWS:

✅ Domain is verified
✅ Can send from any @navontech.com email
✅ Emails will be authenticated
✅ Ready to request production access

**Next:** Send production access request using `docs/ses-production-access-response.md`

---

## Quick Links

- **Squarespace Login**: https://www.squarespace.com/
- **AWS SES Console**: https://console.aws.amazon.com/ses/
- **DNS Checker**: https://mxtoolbox.com/SuperTool.aspx
- **Squarespace DNS Help**: https://support.squarespace.com/hc/en-us/articles/205812378

Good luck! 🚀
