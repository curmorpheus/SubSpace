# Email Setup Guide

SubSpace can automatically email completed forms as PDFs to superintendents or other recipients. This guide will help you set up email functionality using Resend.

## Why Resend?

- Free tier includes 3,000 emails/month (perfect for most teams)
- Easy to set up and use
- Reliable delivery
- Great developer experience

## Setup Steps

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Name it "SubSpace" or similar
5. Copy the API key (starts with `re_`)

### 3. Configure Domain (Optional but Recommended)

For production use, you should verify your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `deacon.build`)
4. Add the DNS records to DNSimple:
   - **Type**: TXT
   - **Name**: `_resend`
   - **Value**: (provided by Resend)
5. Wait for verification (usually 5-15 minutes)

**For Testing**: You can use `onboarding@resend.dev` without domain verification

### 4. Update Environment Variables

Edit your `.env.local` file:

```bash
# Resend API Key (from step 2)
RESEND_API_KEY=re_your_actual_api_key_here

# From email address
# For testing: onboarding@resend.dev
# For production: forms@deacon.build
RESEND_FROM_EMAIL=forms@deacon.build
```

### 5. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 6. Test Email Functionality

1. Go to http://localhost:3000/forms/impalement-protection
2. Fill out the form
3. Sign with your mouse/finger
4. Check the "Email this form as a PDF to someone" box
5. Enter your email address
6. Submit the form
7. Check your inbox!

## Email Features

When a form is emailed, the recipient receives:

- **Subject line**: Customizable or auto-generated (e.g., "Impalement Protection Form - Job #123")
- **Email body**: HTML summary with key details
- **PDF attachment**: Complete form with all data and signature

### What the Email Contains

**Body:**
- Job number
- Submitted by (name and company)
- Date of inspection
- Number of inspections

**PDF Attachment:**
- Complete form data
- All inspection details
- Digital signature
- Timestamp of submission

## Production Deployment

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:
   ```
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=forms@deacon.build
   ```

2. Make sure your domain is verified in Resend

3. Deploy!

## Troubleshooting

### Email not sending

**Check 1**: Is your API key correct?
```bash
# .env.local should have:
RESEND_API_KEY=re_...
```

**Check 2**: Is the "from" email verified?
- For testing: use `onboarding@resend.dev`
- For production: verify your domain in Resend

**Check 3**: Check the browser console for errors

### Email goes to spam

1. Verify your domain in Resend
2. Add SPF and DKIM records (Resend provides these)
3. Use a professional "from" address (e.g., `forms@deacon.build`)

### PDF not attached

Check the browser console and server logs. The PDF generation might be failing if:
- Form data is incomplete
- Signature is missing
- Memory issues (unlikely for small forms)

## Cost

**Free Tier:**
- 3,000 emails per month
- 100 emails per day
- Perfect for most small-medium construction teams

**Paid Plans:**
- Start at $20/month for 50,000 emails
- Only needed for very active sites

## Alternative Email Providers

While Resend is recommended, SubSpace can be adapted to use:
- SendGrid
- Mailgun
- AWS SES
- Postmark

The code is in `app/api/forms/submit-and-email/route.ts`

## Support

- Resend docs: https://resend.com/docs
- Resend support: support@resend.com
