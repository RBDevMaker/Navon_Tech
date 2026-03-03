# AWS SES Domain Verification - SUPER DETAILED Step-by-Step

## STEP 1: Access AWS SES Console

### 1.1 Open AWS Console
1. Open your web browser
2. Go to: https://console.aws.amazon.com/
3. Sign in with your AWS account credentials
   - Enter your email or account ID
   - Enter your password
   - Click "Sign in"

### 1.2 Navigate to SES
1. Once logged in, you'll see the AWS Console home page
2. At the top, there's a search bar that says "Search for services, features..."
3. Click in that search bar
4. Type: `SES`
5. You'll see "Simple Email Service" appear in the dropdown
6. Click on "Simple Email Service"

**Alternative way:**
- Click "Services" in the top left
- Scroll down to "Customer Engagement" section
- Click "Simple Email Service"

### 1.3 Check Your Region
1. Look at the top right corner of the screen
2. You'll see a region name (like "N. Virginia" or "Ohio")
3. Click on it
4. Select **"US East (N. Virginia) us-east-1"**
5. This is important! Your Lambda functions are in us-east-1

---

## STEP 2: Create Domain Identity

### 2.1 Go to Identities
1. On the left side menu, you'll see several options
2. Look for and click **"Identities"**
3. You'll see a page that might show "No identities" or a list of existing identities

### 2.2 Start Creating Identity
1. Look for a button in the top right that says **"Create identity"**
2. It's usually orange/blue colored
3. Click that button
4. A new page will open: "Create identity"

### 2.3 Choose Domain Type
1. You'll see two radio button options:
   - ○ Email address
   - ○ Domain
2. Click the circle next to **"Domain"**
3. The circle should fill in to show it's selected: ⦿ Domain

### 2.4 Enter Your Domain
1. You'll see a text box labeled "Domain"
2. Click in that box
3. Type: `navontech.com`
4. **Important**: 
   - Do NOT include "www"
   - Do NOT include "https://"
   - Do NOT include "http://"
   - Just: `navontech.com`

### 2.5 Advanced DKIM Settings (Optional but Recommended)
1. Scroll down a bit
2. You'll see a section called "Advanced DKIM settings"
3. Click the arrow or "Expand" to open it
4. You'll see:
   - Identity type: Keep as "Easy DKIM" (default)
   - DKIM signing key length: Keep as "RSA_2048_BIT" (default)
   - Publish DNS records to Route53: Leave UNCHECKED (you're using GoDaddy)

### 2.6 Custom MAIL FROM Domain (Optional)
1. Scroll down more
2. You'll see "Custom MAIL FROM domain" section
3. You can either:
   - **Option A (Recommended)**: Check the box "Use a custom MAIL FROM domain"
     - In the subdomain box, type: `mail`
     - This will use `mail.navontech.com` for bounces
   - **Option B (Simpler)**: Leave it unchecked
     - AWS will use `amazonses.com` for bounces

### 2.7 Tags (Optional - Skip This)
1. You might see a "Tags" section
2. You can skip this - it's not needed
3. Tags are just for organization

### 2.8 Create the Identity
1. Scroll to the bottom
2. Look for the **"Create identity"** button (orange/blue)
3. Click it
4. Wait a few seconds...

---

## STEP 3: Get Your DKIM Records

### 3.1 View Your New Identity
1. After clicking "Create identity", you'll be taken to a new page
2. The page title will say: "navontech.com"
3. You'll see several tabs or sections

### 3.2 Find DKIM Records
1. Look for a section called **"DomainKeys Identified Mail (DKIM)"**
2. It might be collapsed - click to expand it
3. You'll see:
   - Status: "Pending" (with a yellow/orange icon)
   - Three CNAME records listed below

### 3.3 Understanding the DKIM Records
You'll see 3 records that look like this:

**Record 1:**
```
Name: abcdefghijklmnop._domainkey.navontech.com
Type: CNAME
Value: abcdefghijklmnop.dkim.amazonses.com
```

**Record 2:**
```
Name: qrstuvwxyz123456._domainkey.navontech.com
Type: CNAME
Value: qrstuvwxyz123456.dkim.amazonses.com
```

**Record 3:**
```
Name: 789012345abcdefg._domainkey.navontech.com
Type: CNAME
Value: 789012345abcdefg.dkim.amazonses.com
```

(Your actual values will be different random strings)

### 3.4 Copy the Records
**IMPORTANT**: You need to copy these carefully!

For each record, you need TWO pieces of information:

**The NAME (Host):**
- Copy everything BEFORE `.navontech.com`
- Example: If it shows `abcdefghijklmnop._domainkey.navontech.com`
- You only need: `abcdefghijklmnop._domainkey`
- **Remove** `.navontech.com` from the end

**The VALUE (Points to):**
- Copy the ENTIRE value
- Example: `abcdefghijklmnop.dkim.amazonses.com`
- Copy ALL of it, including `.amazonses.com` at the end

### 3.5 Prepare Your Records
Open a text editor (Notepad, TextEdit, etc.) and write down:

```
RECORD 1:
Name: [copy the part before .navontech.com]
Value: [copy the entire value]

RECORD 2:
Name: [copy the part before .navontech.com]
Value: [copy the entire value]

RECORD 3:
Name: [copy the part before .navontech.com]
Value: [copy the entire value]
```

**Keep this text file open** - you'll need it for GoDaddy!

---

## STEP 4: Add Records to GoDaddy

### 4.1 Open GoDaddy
1. Open a new browser tab
2. Go to: https://www.godaddy.com/
3. Click "Sign In" (top right)
4. Enter your GoDaddy username/email
5. Enter your password
6. Click "Sign In"

### 4.2 Go to Your Domains
1. After signing in, look for "My Products" at the top
2. Click "My Products"
3. You'll see a list of your products/services
4. Find the section called "Domains" or "All Domains"
5. Look for `navontech.com` in the list

### 4.3 Access DNS Settings
1. Next to `navontech.com`, you'll see several buttons/options
2. Look for a button that says **"DNS"** or **"Manage DNS"**
3. Click that button
4. A new page will load showing your DNS records

### 4.4 Understanding the DNS Page
You'll see a table with existing DNS records:
- Type (A, CNAME, MX, TXT, etc.)
- Name (@ or subdomain names)
- Value (IP addresses or domains)
- TTL (time to live)

**Don't delete any existing records!** You're just adding new ones.

### 4.5 Add First DKIM Record

1. Look for a button that says **"Add"** or **"Add New Record"**
2. Click it
3. A form will appear with fields:

**Type:**
- Click the dropdown
- Select **"CNAME"**

**Name (or Host):**
- Click in this box
- Look at your text file for RECORD 1
- Copy ONLY the Name part (the part BEFORE .navontech.com)
- Paste it here
- Example: `abcdefghijklmnop._domainkey`
- **DO NOT** include `.navontech.com` - GoDaddy adds it automatically!

**Value (or Points to):**
- Click in this box
- Look at your text file for RECORD 1
- Copy the ENTIRE Value
- Paste it here
- Example: `abcdefghijklmnop.dkim.amazonses.com`
- Make sure you got ALL of it!

**TTL:**
- Leave as default (usually 600 or 1 Hour)
- Or change to 600 if you want

4. Double-check everything is correct
5. Click **"Save"** or **"Add Record"**

### 4.6 Add Second DKIM Record

1. Click **"Add"** or **"Add New Record"** again
2. Type: Select **"CNAME"**
3. Name: Paste RECORD 2 Name (without .navontech.com)
4. Value: Paste RECORD 2 Value (complete)
5. TTL: Leave as default
6. Click **"Save"**

### 4.7 Add Third DKIM Record

1. Click **"Add"** or **"Add New Record"** again
2. Type: Select **"CNAME"**
3. Name: Paste RECORD 3 Name (without .navontech.com)
4. Value: Paste RECORD 3 Value (complete)
5. TTL: Leave as default
6. Click **"Save"**

### 4.8 Verify Records Were Added
1. Scroll through your DNS records
2. You should now see 3 new CNAME records
3. Each should have `._domainkey` in the name
4. Each should point to `.dkim.amazonses.com`

---

## STEP 5: Wait for Verification

### 5.1 DNS Propagation Time
1. DNS changes take time to propagate (spread across the internet)
2. Typical time: 5-30 minutes
3. Maximum time: Up to 72 hours (rare)
4. Most common: 15-20 minutes

### 5.2 Check AWS SES Status
1. Go back to your AWS SES tab
2. Click "Identities" in the left menu
3. Click on `navontech.com`
4. Look at the DKIM section
5. Status will show:
   - **"Pending"** (yellow) - Still waiting
   - **"Successful"** (green) - Verified! ✅
   - **"Failed"** (red) - Something wrong

### 5.3 Refresh to Check
1. Wait 5 minutes
2. Click the refresh button (circular arrow) in your browser
3. Check the status again
4. Repeat every 5 minutes until it shows "Successful"

---

## STEP 6: Verify Email Address (While Waiting)

While waiting for domain verification, verify your email:

### 6.1 Create Email Identity
1. In AWS SES, click "Identities"
2. Click "Create identity"
3. Select **"Email address"** (not Domain)
4. Enter: `hr@navontech.com`
5. Click "Create identity"

### 6.2 Check Your Email
1. Open your email inbox for hr@navontech.com
2. Look for an email from: `no-reply-aws@amazon.com`
3. Subject: "Amazon SES Email Address Verification Request"
4. Open the email
5. Click the verification link
6. You'll see a success page

### 6.3 Confirm Verification
1. Go back to AWS SES
2. Click "Identities"
3. Find `hr@navontech.com`
4. Status should show "Verified" (green checkmark)

---

## STEP 7: Troubleshooting

### If DKIM Status Stays "Pending" After 1 Hour:

**Check Your GoDaddy Records:**

1. Go to GoDaddy DNS page
2. Look at the 3 CNAME records you added
3. Common mistakes:

**Mistake 1: Included domain in Name**
- ❌ Wrong: `abc._domainkey.navontech.com`
- ✅ Correct: `abc._domainkey`

**Mistake 2: Missing part of Value**
- ❌ Wrong: `abc.dkim.amazonses`
- ✅ Correct: `abc.dkim.amazonses.com`

**Mistake 3: Extra spaces**
- Check for spaces before or after the values
- Remove any spaces

**Fix:** Edit the record and correct it

### Use DNS Checker Tool:

1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. In the search box, enter: `abc._domainkey.navontech.com`
   (Replace `abc` with your actual DKIM name)
3. Click "CNAME Lookup"
4. Should show: Points to `abc.dkim.amazonses.com`
5. If it shows "Not Found", your DNS isn't set up correctly

---

## SUCCESS! What's Next?

Once DKIM shows "Successful":

✅ Your domain is verified
✅ You can send FROM any @navontech.com email
✅ Your emails will be authenticated
✅ Ready to request production access

**Next Step:** Send the production access request using the template in `docs/ses-production-access-response.md`

---

## Quick Reference

**AWS SES Console:** https://console.aws.amazon.com/ses/
**GoDaddy:** https://www.godaddy.com/
**DNS Checker:** https://mxtoolbox.com/SuperTool.aspx

**Need Help?** 
- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- GoDaddy DNS Help: https://www.godaddy.com/help/manage-dns-680

Good luck! You've got this! 🚀
