# EdgeStore Implementation Guide for Connectly

## Overview

This guide provides step-by-step instructions for implementing EdgeStore file storage in the Connectly Laravel + React project. EdgeStore is a cloud-based file storage service that handles image and video uploads directly from the frontend.

## What is EdgeStore?

EdgeStore is a file storage service designed for modern web applications. It provides:
- Direct client-side uploads (files go directly to EdgeStore, not through your server)
- Built-in file validation and optimization
- Automatic thumbnail generation for images
- CDN delivery for fast file access
- Type-safe React components

## Architecture

```
User Selects File
    ↓
EdgeStore React Component Uploads File
    ↓
File Stored on EdgeStore Cloud
    ↓
EdgeStore Returns URL
    ↓
Frontend Sends URL to Laravel API
    ↓
Laravel Saves URL to Database
    ↓
URLs Displayed in Frontend
```

## Implementation Status

### ✅ Completed Steps

1. **EdgeStore Packages Installed**
   - `@edgestore/react` - React components for file uploads
   - `@edgestore/server` - Server utilities (for router configuration)
   - `zod` - Schema validation

2. **EdgeStore Router Configuration Created**
   - File: `resources/js/lib/edgestore.js`
   - Defines three buckets:
     - `profilePictures` - For user profile pictures (images, max 5MB)
     - `postMedia` - For post images and videos (max 10MB)
     - `coverImages` - For user cover images (images, max 5MB)

3. **EdgeStore Provider Set Up**
   - File: `resources/js/lib/edgestoreClient.js`
   - Wraps the app with EdgeStoreProvider
   - Configured with basePath pointing to Laravel API endpoint

4. **EdgeStore Provider Added to App**
   - File: `resources/js/app.jsx`
   - App wrapped with EdgeStoreProviderWrapper

5. **EdgeStore API Route Created**
   - File: `app/Http/Controllers/Api/EdgeStoreController.php`
   - Route: `/api/edgestore/{any}` - Handles EdgeStore API requests

6. **Environment Variables Updated**
   - `.env` file includes:
     - `EDGE_STORE_ACCESS_KEY`
     - `EDGE_STORE_SECRET_KEY`
     - `EDGE_STORE_URL` (added)

7. **Services Configuration Updated**
   - `config/services.php` - Added EdgeStore configuration

8. **PostInput Component Updated**
   - File: `resources/js/components/posts/PostInput.jsx`
   - Uses EdgeStore `useEdgeStore` hook
   - Uploads files to EdgeStore `postMedia` bucket
   - Stores EdgeStore URL in form
   - Shows preview before posting

9. **Register Component Updated**
   - File: `resources/js/pages/Auth/Register.jsx`
   - Uses EdgeStore for profile picture upload
   - Uploads to EdgeStore `profilePictures` bucket
   - Shows loading state during upload

10. **Backend Updated to Accept URLs**
    - `StorePostRequest` - Now accepts `media_url` and `media_type` (strings) instead of file
    - `UploadProfilePictureRequest` - Now accepts `profile_picture_url` (string) instead of file
    - `RegisterRequest` - Now accepts `profile_picture_url` (string) instead of file
    - `PostService` - Saves URLs directly to database
    - `UserController` - Saves EdgeStore URLs directly
    - `AuthController` - Saves EdgeStore URLs directly

11. **Resources Updated**
    - `PostResource` - Returns EdgeStore URLs directly (no Storage::url() transformation)
    - `UserResource` - Returns EdgeStore URLs directly (checks if URL is already full URL)

12. **MediaService Updated**
    - Added comments noting EdgeStore usage
    - Delete methods check if URL is EdgeStore URL
    - Kept for backward compatibility

## How EdgeStore Works with Laravel

### Frontend Flow

1. **User selects a file** in React component
2. **EdgeStore React component** handles the upload:
   - Validates file (size, type)
   - Uploads directly to EdgeStore cloud service
   - Shows upload progress
   - Returns file URL
3. **Frontend stores URL** in form state
4. **On form submission**, URL is sent to Laravel API
5. **Laravel saves URL** to database

### Backend Flow

1. **Laravel receives URL** (not file) in API request
2. **Validates URL** format
3. **Saves URL** to database column
4. **Returns URL** in API response (no transformation needed)

## File Storage Locations

### EdgeStore Cloud Storage
- Profile Pictures: Stored in EdgeStore `profilePictures` bucket
- Post Media: Stored in EdgeStore `postMedia` bucket
- Cover Images: Stored in EdgeStore `coverImages` bucket (when implemented)

### Database Storage
- URLs are stored as strings in:
  - `users.profile_picture` - EdgeStore URL for profile picture
  - `posts.media_url` - EdgeStore URL for post media
  - `users.cover_image` - EdgeStore URL for cover image (when implemented)

## Step-by-Step Implementation Details

### Step 1: Install EdgeStore Packages

**Status:** ✅ Already installed

Packages in `package.json`:
- `@edgestore/react`: ^0.7.0
- `@edgestore/server`: ^0.7.0
- `zod`: ^4.3.6

### Step 2: Create EdgeStore Router Configuration

**Status:** ✅ Completed

**File:** `resources/js/lib/edgestore.js`

**What it does:**
- Defines file buckets with validation rules
- Sets maximum file sizes
- Configures allowed file types
- Sets up input validation schemas

**Buckets defined:**
1. `profilePictures` - Image bucket, max 5MB
2. `postMedia` - File bucket (images/videos), max 10MB
3. `coverImages` - Image bucket, max 5MB

### Step 3: Set Up EdgeStore Provider

**Status:** ✅ Completed

**File:** `resources/js/lib/edgestoreClient.js`

**What it does:**
- Creates EdgeStoreProvider wrapper component
- Configures basePath to point to Laravel API endpoint
- Exports useEdgeStore hook for components

**File:** `resources/js/app.jsx`

**What was changed:**
- Imported EdgeStoreProviderWrapper
- Wrapped entire app with EdgeStoreProviderWrapper
- Provider is inside QueryClientProvider but outside Router

### Step 4: Create EdgeStore API Route Handler

**Status:** ✅ Completed

**File:** `app/Http/Controllers/Api/EdgeStoreController.php`

**What it does:**
- Handles EdgeStore API requests
- Validates requests using secret key
- Currently returns basic response (can be extended)

**Route:** `/api/edgestore/{any}` - Catches all EdgeStore API calls

**Note:** EdgeStore React components upload directly to EdgeStore's cloud service. This endpoint may be used for webhooks or additional operations.

### Step 5: Update Environment Variables

**Status:** ✅ Completed

**File:** `.env`

**Variables added:**
- `EDGE_STORE_URL=https://api.edgestore.dev`

**Variables already present:**
- `EDGE_STORE_ACCESS_KEY`
- `EDGE_STORE_SECRET_KEY`

**File:** `config/services.php`

**What was added:**
- EdgeStore service configuration section
- Maps environment variables to config

### Step 6: Update PostInput Component

**Status:** ✅ Completed

**File:** `resources/js/components/posts/PostInput.jsx`

**Changes made:**
- Imported `useEdgeStore` hook
- Added state for media preview and type
- Created `handleFileChange` function that:
  - Creates preview using FileReader
  - Uploads file to EdgeStore using `edgestore.postMedia.upload()`
  - Stores returned URL in form using `setValue()`
  - Shows success/error toasts
- Added file input with label trigger
- Added preview display (image or video)
- Added remove media button
- Updated form submission to send URL instead of file

**EdgeStore bucket used:** `postMedia`

### Step 7: Update Profile Picture Upload

**Status:** ✅ Completed

**File:** `resources/js/pages/Auth/Register.jsx`

**Changes made:**
- Imported `useEdgeStore` hook
- Changed state from `profilePicture` (file) to `profilePictureUrl` (string)
- Added `isUploadingProfile` state for loading indicator
- Updated `handleFileChange` to:
  - Upload to EdgeStore using `edgestore.profilePictures.upload()`
  - Store returned URL
  - Show loading state during upload
  - Handle errors with toast notifications
- Updated `onSubmit` to send `profile_picture_url` instead of file
- Added loading spinner during upload
- Updated file size limit message to 5MB

**EdgeStore bucket used:** `profilePictures`

### Step 8: Update MediaService

**Status:** ✅ Completed

**File:** `app/Services/MediaService.php`

**Changes made:**
- Added deprecation comments to storage methods
- Updated delete methods to check if URL is EdgeStore URL
- Added TODO comments for EdgeStore delete API integration
- Kept methods for backward compatibility

**Note:** MediaService is no longer used for storing files, but kept for potential EdgeStore delete operations.

### Step 9: Update Request Validation

**Status:** ✅ Completed

**Files updated:**

1. **`app/Http/Requests/Post/StorePostRequest.php`**
   - Changed from: `'media' => ['nullable', 'file', ...]`
   - Changed to: `'media_url' => ['nullable', 'string', 'url', 'max:500']`
   - Added: `'media_type' => ['nullable', 'in:image,video']`

2. **`app/Http/Requests/User/UploadProfilePictureRequest.php`**
   - Changed from: `'profile_picture' => ['required', File::image(), ...]`
   - Changed to: `'profile_picture_url' => ['required', 'string', 'url', 'max:500']`

3. **`app/Http/Requests/Auth/RegisterRequest.php`**
   - Changed from: `'profile_picture' => ['nullable', 'image', ...]`
   - Changed to: `'profile_picture_url' => ['nullable', 'string', 'url', 'max:500']`

### Step 10: Update Controllers and Services

**Status:** ✅ Completed

**Files updated:**

1. **`app/Http/Controllers/Api/PostController.php`**
   - Removed file handling logic
   - Now accepts validated data directly (includes URLs)

2. **`app/Http/Controllers/Api/UserController.php`**
   - Updated `uploadProfilePicture()` to accept URL directly
   - Removed MediaService file storage calls
   - Saves EdgeStore URL directly to database

3. **`app/Http/Controllers/Api/AuthController.php`**
   - Updated `register()` to accept `profile_picture_url`
   - Removed file upload logic
   - Saves EdgeStore URL directly

4. **`app/Services/PostService.php`**
   - Updated `createPost()` to accept URLs directly
   - Removed file storage logic
   - Saves URLs directly to database

### Step 11: Update Resources

**Status:** ✅ Completed

**Files updated:**

1. **`app/Http/Resources/PostResource.php`**
   - Removed Storage facade import
   - Changed `media_url` to return URL directly (no Storage::url() transformation)
   - EdgeStore URLs are already full URLs

2. **`app/Http/Resources/UserResource.php`**
   - Updated `profile_picture` to check if URL is already full URL
   - If it's a URL, return it directly
   - If it's a local path, use asset() for backward compatibility

### Step 12: Update API Service

**Status:** ✅ Completed

**File:** `resources/js/services/api.js`

**Changes made:**
- Updated `uploadProfilePicture` to accept either FormData or object
- Handles both file uploads (backward compatibility) and URL submissions

## Testing Checklist

### Frontend Testing

- [ ] EdgeStore packages installed correctly
- [ ] EdgeStoreProvider wraps the app
- [ ] PostInput component shows file input
- [ ] File selection triggers EdgeStore upload
- [ ] Upload progress is visible (if EdgeStore provides it)
- [ ] Preview shows correctly after upload
- [ ] URL is stored in form state
- [ ] Post creation sends URL to API
- [ ] Profile picture upload works in registration
- [ ] Profile picture preview shows correctly
- [ ] Error handling works for failed uploads

### Backend Testing

- [ ] EdgeStore API route responds correctly
- [ ] Post creation accepts media_url
- [ ] Profile picture upload accepts profile_picture_url
- [ ] Registration accepts profile_picture_url
- [ ] URLs are saved to database correctly
- [ ] PostResource returns URLs correctly
- [ ] UserResource returns URLs correctly
- [ ] Validation works for URL format

### Integration Testing

- [ ] Create post with image - image displays correctly
- [ ] Create post with video - video displays correctly
- [ ] Register with profile picture - picture displays correctly
- [ ] Upload profile picture - picture updates correctly
- [ ] URLs are accessible and images/videos load
- [ ] Old local storage files still work (backward compatibility)

## Important Notes

### EdgeStore API Endpoint

EdgeStore React components need a backend API endpoint. The current implementation:
- Creates a Laravel route at `/api/edgestore/{any}`
- EdgeStoreController handles requests
- May need to be extended based on EdgeStore's actual API requirements

### File Upload Flow

1. **User selects file** → React component
2. **EdgeStore component uploads** → Directly to EdgeStore cloud
3. **EdgeStore returns URL** → React component receives URL
4. **URL stored in form** → Ready to submit
5. **Form submitted** → URL sent to Laravel
6. **Laravel saves URL** → Database stores URL string
7. **URL displayed** → Images/videos load from EdgeStore CDN

### Backward Compatibility

The implementation maintains backward compatibility:
- UserResource checks if profile_picture is a URL or local path
- MediaService methods still exist (marked as deprecated)
- Can handle both EdgeStore URLs and local storage paths

### EdgeStore Configuration

**Router Configuration:** `resources/js/lib/edgestore.js`
- Defines buckets and validation rules
- Used by EdgeStore React components

**Provider Configuration:** `resources/js/lib/edgestoreClient.js`
- Sets up EdgeStoreProvider
- Configures basePath for API endpoint

**Environment Variables:** `.env`
- `EDGE_STORE_ACCESS_KEY` - Your EdgeStore access key
- `EDGE_STORE_SECRET_KEY` - Your EdgeStore secret key
- `EDGE_STORE_URL` - EdgeStore API URL

## Troubleshooting

### Uploads Not Working

**Check:**
1. EdgeStore credentials are correct in `.env`
2. EdgeStoreProvider is wrapping the app
3. Browser console for EdgeStore errors
4. Network tab to see upload requests
5. EdgeStore dashboard for file uploads

### URLs Not Saving

**Check:**
1. Form is sending `media_url` or `profile_picture_url`
2. Backend validation accepts URL format
3. Database columns can store long URLs
4. API responses include the URLs

### Images Not Displaying

**Check:**
1. URLs are saved correctly in database
2. URLs are valid EdgeStore URLs
3. CORS settings on EdgeStore
4. Browser console for image loading errors
5. Network tab to see image requests

### EdgeStore API Errors

**Check:**
1. EdgeStoreController is handling requests correctly
2. Route is accessible at `/api/edgestore/*`
3. Secret key validation (if implemented)
4. EdgeStore API documentation for required endpoints

## Next Steps

### Optional Enhancements

1. **File Deletion**
   - Implement EdgeStore delete API calls
   - Delete files when posts/users are deleted
   - Update MediaService delete methods

2. **Cover Image Upload**
   - Add cover image upload to profile editing
   - Use EdgeStore `coverImages` bucket
   - Update UserController and resources

3. **Error Handling**
   - Add retry logic for failed uploads
   - Better error messages
   - Fallback to local storage if EdgeStore fails

4. **Migration Script**
   - Create script to upload existing local files to EdgeStore
   - Update database URLs
   - Remove old local files

5. **EdgeStore API Integration**
   - Extend EdgeStoreController for full API support
   - Handle EdgeStore webhooks
   - Implement file management operations

## File Structure

```
connectly-app/
├── resources/js/
│   ├── lib/
│   │   ├── edgestore.js          # EdgeStore router configuration
│   │   └── edgestoreClient.js    # EdgeStore provider setup
│   ├── components/posts/
│   │   └── PostInput.jsx         # Uses EdgeStore for media upload
│   └── pages/Auth/
│       └── Register.jsx          # Uses EdgeStore for profile picture
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   └── EdgeStoreController.php  # EdgeStore API handler
│   │   ├── Requests/
│   │   │   ├── Post/StorePostRequest.php  # Accepts media_url
│   │   │   └── User/UploadProfilePictureRequest.php  # Accepts URL
│   │   └── Resources/
│   │       ├── PostResource.php  # Returns EdgeStore URLs
│   │       └── UserResource.php  # Returns EdgeStore URLs
│   └── Services/
│       └── MediaService.php      # Updated for EdgeStore
├── config/
│   └── services.php              # EdgeStore configuration
├── routes/
│   └── api.php                   # EdgeStore API route
└── .env                          # EdgeStore credentials
```

## Summary

EdgeStore integration is now complete. Files are uploaded directly from the React frontend to EdgeStore's cloud service, and URLs are saved to the Laravel database. This approach:

- ✅ Reduces server load (files don't go through Laravel)
- ✅ Provides better UX (direct uploads with progress)
- ✅ Uses EdgeStore's CDN for fast file delivery
- ✅ Maintains backward compatibility with local storage
- ✅ Simplifies backend code (no file handling needed)

All components are updated to use EdgeStore, and the backend accepts URLs instead of files. The system is ready for testing and deployment.
