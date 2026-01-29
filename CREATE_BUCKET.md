# 🔧 Create Supabase Storage Bucket - URGENT

## Problem

The connection test shows: **"Bucket not Found" (404 error)**

This means the "public" bucket doesn't exist in your Supabase project yet.

## Solution: Create the Bucket

### Step-by-Step Instructions

1. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com
   - Log in with your account

2. **Select Your Project**:
   - Find project: `brytdmnqtwwdgimxplcw` (or look for your project name)
   - Click on it to open

3. **Navigate to Storage**:
   - In the left sidebar, click **"Storage"**
   - Then click **"Buckets"** (or it may be under Storage menu)

4. **Create New Bucket**:
   - Click the **"New bucket"** button (usually top right)
   - A form will appear

5. **Fill in Bucket Details**:
   - **Name**: Type exactly: `public` (lowercase, no spaces)
   - **Public bucket**: Toggle this switch to **ON** (this is critical!)
     - This makes files publicly accessible via URL
   - **File size limit**: Leave default (50MB) or set as needed
   - **Allowed MIME types**: Leave empty (allows all file types)

6. **Create the Bucket**:
   - Click **"Create bucket"** button
   - Wait a few seconds
   - You should see "public" appear in the buckets list
   - Verify it shows a "Public" badge/indicator

7. **Verify Bucket Created**:
   - The bucket should appear in the list
   - It should show as "Public"
   - Status should be active/enabled

### Test the Connection Again

After creating the bucket:

1. **Visit**: `http://localhost:8000/api/test/supabase`
2. **Expected Result**:
   ```json
   {
     "status": "success",
     "message": "Supabase connection successful",
     "details": {
       "bucket_exists": true,
       "connection_status": "connected"
     }
   }
   ```

### If Still Not Working

1. **Check Bucket Name**: Must be exactly `public` (lowercase)
2. **Check Public Toggle**: Must be ON
3. **Wait a Few Seconds**: Sometimes takes a moment to propagate
4. **Refresh Browser**: Hard refresh (Ctrl+F5) the test page
5. **Check Supabase Project**: Make sure you're in the correct project

### Visual Guide

```
Supabase Dashboard
├── Storage (left sidebar)
    └── Buckets
        └── [New bucket button]
            └── Form:
                - Name: public
                - Public bucket: ON ✅
                - [Create bucket]
```

---

**After creating the bucket, the connection test should pass and file uploads will work!**
