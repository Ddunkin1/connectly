# 🚨 Fix 500 Internal Server Errors

## Current Errors

1. **POST /api/posts** - 500 error when creating posts
2. **GET /api/users/{username}/posts** - 500 error when fetching user posts

## Root Causes

### Error 1: POST /api/posts (500)
**Cause**: The `posts.content` column in database is NOT NULL, but code allows empty content when media exists.

**Solution**: Run database migration to make `content` nullable.

### Error 2: GET /api/users/{username}/posts (500)
**Cause**: Likely related to:
- Posts with NULL content (if migration not run)
- Database constraint violations
- Query issues with relationships

**Solution**: Run migration first, then check logs.

---

## Step-by-Step Fix

### STEP 1: Run Database Migration (CRITICAL)

**Why**: The `content` column must be nullable to allow media-only posts.

**Action**:
1. Open **Laragon Terminal** (or any terminal)
2. Navigate to project:
   ```bash
   cd c:\laragon\www\connectly-app
   ```
3. Run migration:
   ```bash
   php artisan migrate
   ```

**Expected Output**:
```
Running migrations...
2024_01_29_000001_make_posts_content_nullable .......... DONE
```

**If Migration Fails**:
- Check if you have existing posts with NULL content
- If error about doctrine/dbal, the migration uses raw SQL so it should work
- Check Laravel logs: `storage/logs/laravel.log`

### STEP 2: Verify Migration Success

**Check Database**:
- Open your database tool (phpMyAdmin, MySQL Workbench, etc.)
- Check `posts` table structure
- Verify `content` column shows as `NULL` allowed

**Or use Tinker**:
```bash
php artisan tinker
```
Then:
```php
Schema::getColumnType('posts', 'content'); // Should show nullable
```

### STEP 3: Create Supabase Bucket (CRITICAL)

**Why**: File uploads fail because bucket doesn't exist.

**Action**: See `CREATE_BUCKET.md` for detailed instructions

**Quick Steps**:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Storage → Buckets
4. Click "New bucket"
5. Name: `public`
6. Toggle "Public bucket" to **ON**
7. Click "Create bucket"

### STEP 4: Clear Config Cache

```bash
php artisan config:clear
php artisan cache:clear
```

### STEP 5: Test Again

1. **Test Connection**: `http://localhost:8000/api/test/supabase`
   - Should return `"status": "success"`

2. **Test Post Creation**:
   - Select an image (no text)
   - Click Post
   - Should work now

3. **Test User Posts**:
   - Go to a user profile
   - Should load posts without error

---

## Troubleshooting

### If Migration Fails

**Error**: "Column cannot be null"
- **Solution**: Update existing NULL values first:
  ```sql
  UPDATE posts SET content = '' WHERE content IS NULL;
  ```
- Then run migration again

**Error**: "Table doesn't exist"
- **Solution**: Run all migrations:
  ```bash
  php artisan migrate:fresh
  ```
- ⚠️ **WARNING**: This will delete all data!

### If Posts Still Fail After Migration

1. **Check Laravel Logs**:
   - Open: `storage/logs/laravel.log`
   - Look for the actual error message
   - Share the error if you need help

2. **Check Database**:
   - Verify `content` column is nullable
   - Check if there are any constraint violations

3. **Test with Text Only**:
   - Try posting with text only (no image)
   - If this works, issue is with Supabase upload

### If User Posts Still Fail

1. **Check for NULL Content**:
   ```sql
   SELECT * FROM posts WHERE content IS NULL;
   ```
   - If any exist, update them:
   ```sql
   UPDATE posts SET content = '' WHERE content IS NULL;
   ```

2. **Check Laravel Logs**:
   - Look for specific error in `storage/logs/laravel.log`
   - Error will show what's failing

---

## Quick Checklist

- [ ] Run `php artisan migrate` (makes content nullable)
- [ ] Verify migration succeeded
- [ ] Create Supabase "public" bucket
- [ ] Clear config cache: `php artisan config:clear`
- [ ] Test connection: `/api/test/supabase`
- [ ] Test post creation (with image)
- [ ] Test user posts endpoint
- [ ] Check Laravel logs if still failing

---

## Expected Results After Fixes

1. ✅ Migration runs successfully
2. ✅ `content` column is nullable in database
3. ✅ Supabase bucket exists
4. ✅ Connection test returns success
5. ✅ Post creation works (with or without text)
6. ✅ User posts load without error
7. ✅ Files upload to Supabase Storage

---

**Last Updated**: After identifying 500 errors
**Status**: Ready to fix
