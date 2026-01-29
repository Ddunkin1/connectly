# ⚡ QUICK FIX - Create Bucket (30 seconds)

## The Error
**"Bucket not Found"** → Uploads will fail until bucket exists

## The Fix

### Option 1: Direct Link (FASTEST)
👉 **Click here**: https://app.supabase.com/project/brytdmnqtwwdgimxplcw/storage/buckets

Then:
1. Click **"New bucket"**
2. Name: `public` (lowercase)
3. **Public bucket**: ON ✅
4. Click **"Create bucket"**
5. Done! ✅

### Option 2: Manual Steps
1. Go to: https://app.supabase.com
2. Select project: `brytdmnqtwwdgimxplcw`
3. Click: **Storage** → **Buckets** (left sidebar)
4. Click: **"New bucket"**
5. Fill:
   - Name: `public`
   - Public: **ON** ✅
6. Click: **"Create bucket"**

---

## Verify It Works
After creating, visit: `http://localhost:8000/api/test/supabase`

Should show: `"status": "success"` ✅

---

**That's it! Takes 30 seconds.**
