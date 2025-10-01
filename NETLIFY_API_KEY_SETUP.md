# Adding Alpha Vantage API Key to Netlify

**IMPORTANT:** Your real market data won't work on the live site until you add your API key to Netlify's environment variables.

---

## Why This is Needed

- ✅ Local development: Uses `.env.local` file (already working)
- ❌ Netlify deployment: Needs environment variables configured in Netlify dashboard
- 🔒 Security: Never commit API keys to git (`.env.local` is in `.gitignore`)

---

## Step-by-Step Instructions

### 1. Go to Netlify Dashboard

**URL:** https://app.netlify.com/

- Log in to your account
- Find your Stratford AI site
- Click on it to open site settings

### 2. Navigate to Environment Variables

- Click **"Site settings"** (in the top navigation)
- Click **"Environment variables"** (in the left sidebar under "Build & deploy")

### 3. Add Your API Key

Click **"Add a variable"** button and enter:

**Key:** `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY`
**Value:** `26SZR0LE05TXVNG6`

Click **"Create variable"**

### 4. Add Backup Variable (Optional but Recommended)

Add another variable:

**Key:** `ALPHA_VANTAGE_API_KEY`
**Value:** `26SZR0LE05TXVNG6`

Click **"Create variable"**

### 5. Trigger a New Deploy

Option A: **Automatic (Recommended)**
- Your site should auto-deploy since you just pushed to GitHub
- Wait 2-3 minutes for the build

Option B: **Manual**
- Go to **"Deploys"** tab
- Click **"Trigger deploy"** → **"Deploy site"**

---

## Verification

### After Deployment Completes:

1. **Visit your live site:** https://your-site.netlify.app
2. **Check the dashboard**
3. **Look for the "Real Market Data" widget**
4. **Should show:**
   - 🟢 Green WiFi icon ("Connected")
   - Real stock prices
   - Auto-refresh functionality

### If You See Connection Errors:

**Cause:** Environment variable not set or misspelled

**Solution:**
1. Double-check the variable name: `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY`
2. Verify the API key is correct: `26SZR0LE05TXVNG6`
3. Clear Netlify cache:
   - Go to "Site settings" → "Build & deploy" → "Build settings"
   - Click "Clear cache and retry deploy"

---

## Environment Variable Reference

### For Local Development (`.env.local`)
```bash
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=26SZR0LE05TXVNG6
ALPHA_VANTAGE_API_KEY=26SZR0LE05TXVNG6
NEXT_PUBLIC_USE_REAL_DATA=true
```

### For Netlify (Set in dashboard)
```
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY = 26SZR0LE05TXVNG6
ALPHA_VANTAGE_API_KEY = 26SZR0LE05TXVNG6
NEXT_PUBLIC_USE_REAL_DATA = true
```

---

## Security Notes

✅ **Safe to add to Netlify:**
- API keys in Netlify environment variables are secure
- Not visible in public source code
- Only accessible during build/runtime

❌ **Never do this:**
- Don't commit `.env.local` to git
- Don't hardcode API key in source files
- Don't share API key publicly

✅ **If API key is compromised:**
- Get a new key from Alpha Vantage
- Update both local `.env.local` and Netlify environment variables
- Redeploy site

---

## Current Status

- ✅ Code pushed to GitHub (commit: edbdc0e)
- ⏳ Netlify should be building now...
- ⏭️ **You need to add environment variable** (follow steps above)
- ⏭️ Redeploy after adding variable

---

## Quick Checklist

- [ ] Go to Netlify dashboard
- [ ] Navigate to Site Settings → Environment Variables
- [ ] Add `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` = `26SZR0LE05TXVNG6`
- [ ] Wait for auto-deploy or trigger manual deploy
- [ ] Visit live site and verify real data widget works
- [ ] Check browser console for any errors

---

**After completing these steps, your live site will show real market data!**
