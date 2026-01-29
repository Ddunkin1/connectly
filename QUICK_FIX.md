# 🚨 QUICK FIX: Create Supabase Bucket

## The Problem

Your error shows: **"Bucket not Found" (404)**

The "public" bucket doesn't exist in your Supabase project. This is why uploads fail.

## The Solution (5 Minutes)

### Step 1: Go to Supabase Dashboard
- Visit: https://app.supabase.com
- Log in

### Step 2: Select Your Project
- Find project: `brytdmnqtwwdgimxplcw`
- Click on it

### Step 3: Go to Storage
- Click **"Storage"** in left sidebar
- Click **"Buckets"**

### Step 4: Create Bucket
- Click **"New bucket"** button (top right)
- Fill in:
  - **Name**: `public` (exactly, lowercase)
  - **Public bucket**: Toggle **ON** ✅ (very important!)
  - **File size limit**: Leave default (50MB)
  - **Allowed MIME types**: Leave empty
- Click **"Create bucket"**

### Step 5: Verify
- Bucket "public" appears in list
- Shows "Public" badge
- Status is active

### Step 6: Test Again
- Visit: `http://localhost:8000/api/test/supabase`
- Should now show: `"status": "success"` and `"bucket_exists": true`

---

## That's It!

After creating the bucket:
- ✅ Connection test will pass
- ✅ File uploads will work
- ✅ Posts with images/videos will upload successfully

**Total time: 2-3 minutes**

---

**Need more details?** See `CREATE_BUCKET.md`
