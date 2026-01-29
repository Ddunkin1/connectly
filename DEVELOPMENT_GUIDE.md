# 🚀 Connectly - Step-by-Step Development Guide

## ✅ Completed Features (Skip These)

- ✅ Authentication (Login, Register, Logout)
- ✅ User Profiles (View, Update, Profile Picture)
- ✅ Posts (Create, Read, Update, Delete)
- ✅ Comments (Create, Read, Delete, Nested Replies)
- ✅ Likes (Like/Unlike Posts)
- ✅ Follows (Follow/Unfollow Users)
- ✅ Feed Algorithm (Posts from followed users)
- ✅ Search Functionality (Backend + Frontend)
- ✅ UI/UX Design (Header, Sidebars, Home Feed tabs, QuickChat)
- ✅ **EdgeStore Integration** - File storage for images and videos (see important note below)

---

## 📦 IMPORTANT: EdgeStore File Storage

**This project uses EdgeStore for file storage, NOT local Laravel storage.**

### What is EdgeStore?
EdgeStore is a cloud-based file storage service that handles file uploads directly from the frontend. Files are uploaded directly to EdgeStore's cloud service, and URLs are saved to the database.

### How It Works:
1. **Frontend:** User selects file → EdgeStore React component uploads directly to EdgeStore cloud
2. **EdgeStore:** Returns a URL after successful upload
3. **Frontend:** Stores URL in form state
4. **Backend:** Receives URL (not file) and saves it to database
5. **Display:** Images/videos load from EdgeStore CDN

### Key Points:
- ✅ **Already Implemented:** EdgeStore is fully set up and working
- ✅ **Post Media:** PostInput component uses EdgeStore for media uploads
- ✅ **Profile Pictures:** Registration and profile updates use EdgeStore
- ✅ **Backend:** Accepts URLs (strings), not files
- ✅ **Validation:** Backend validates URL format, not file types
- ✅ **Storage:** No need for `php artisan storage:link` or local file storage

### EdgeStore Configuration:
- **Router:** `resources/js/lib/edgestore.js` - Defines buckets (profilePictures, postMedia, coverImages)
- **Provider:** `resources/js/lib/edgestoreClient.js` - EdgeStore React provider setup
- **API Route:** `/api/edgestore/{any}` - Handles EdgeStore API requests
- **Environment:** `.env` contains `EDGE_STORE_ACCESS_KEY`, `EDGE_STORE_SECRET_KEY`, `EDGE_STORE_URL`

### When Adding New File Upload Features:
- Use EdgeStore React components (already set up)
- Upload files using `useEdgeStore()` hook
- Send URLs to backend, not files
- Backend validates URLs, not files
- See `PostInput.jsx` and `Register.jsx` for examples

**For detailed EdgeStore documentation, see:** `scope.md`

---

---

## 🎯 NEXT STEPS - Priority Order

---

## STEP 1: Add Post Media Upload ⭐ HIGHEST PRIORITY

**Why:** Users see the image icon in PostInput but can't upload media yet. This is expected functionality.

**Estimated Time:** 3-4 hours

### 📋 Step-by-Step Instructions

#### **Part A: Backend Setup (1-2 hours)**

**1.1. Update Post Request Validation**

- Open the file: `app/Http/Requests/Post/StorePostRequest.php`
- Find the `rules()` method
- Add validation for a `media` field that accepts files (images: jpeg, jpg, png, gif and videos: mp4, webm)
- Set maximum file size to 10MB (10240 KB)
- Make the field nullable since media is optional

**1.2. Update PostService**

- Open the file: `app/Services/PostService.php`
- Find the `createPost()` method
- Add logic to check if a media file exists in the request data
- If media exists, store the file in the `storage/app/public/posts/` directory
- Determine if the file is an image or video based on its MIME type
- Save the media file path to the `media_url` field in the post
- Save the media type (image or video) to the `media_type` field in the post

**1.3. Update PostResource**

- Open the file: `app/Http/Resources/PostResource.php`
- Ensure the `media_url` field returns a full URL using Laravel's Storage facade
- Make sure `media_type` is included in the response
- Import the Storage facade at the top of the file if not already imported

**1.4. Test Backend**

- Start your Laravel server using `php artisan serve`
- Use Postman or similar tool to test the POST endpoint for creating posts
- Send a POST request to `/api/posts` with:
  - Authorization header with your Bearer token
  - Form-data body with content text and a media file
- Verify the response includes `media_url` and `media_type` fields
- Check that the file was stored in the correct directory

---

#### **Part B: Frontend Setup (2 hours)**

**1.5. Update PostInput Component**

- Open the file: `resources/js/components/posts/PostInput.jsx`
- Add state variables to track the selected media file and preview
- Create a file input handler that:
  - Reads the selected file
  - Stores it in state
  - Creates a preview URL using FileReader API
- Update the form submission handler to:
  - Create a FormData object instead of regular JSON
  - Append the content text to FormData
  - Append the media file to FormData if one is selected
  - Send FormData to the API
- Update the image icon button to trigger the hidden file input when clicked
- Add a preview section that shows:
  - Image preview if the file is an image
  - Video preview if the file is a video
  - A remove button to clear the selected media before posting

**1.6. Verify PostCard Component**

- Open the file: `resources/js/components/posts/PostCard.jsx`
- Check that it already displays media if `media_url` exists
- Verify it shows images using an img tag
- Verify it shows videos using a video tag with controls
- Make sure the display looks good and is responsive

**1.7. Update API Service**

- Open the file: `resources/js/services/api.js`
- Find the `createPost` method in the `postsAPI` object
- Update it to detect if the data is FormData
- If it's FormData, set the Content-Type header to `multipart/form-data`
- Otherwise, use the default JSON headers

**1.8. Test Frontend**

- Start your development server with `npm run dev`
- Navigate to the home page (`/home`)
- Click the image icon in the PostInput component
- Select an image file from your computer
- Verify that a preview appears below the input
- Type some content in the text area
- Click the "Post" button
- Verify the post appears in the feed with the image displayed
- Test with a video file as well to ensure both work

---

### ✅ Step 1 Checklist

- [ ] Backend accepts media files in the request validation
- [ ] Files are stored in the `storage/app/public/posts/` directory
- [ ] PostResource returns full URL for media_url
- [ ] Frontend shows media preview before posting
- [ ] Frontend uploads FormData correctly
- [ ] Posts display with images/videos in the feed
- [ ] Can remove media before posting

---

## STEP 2: Build Communities Backend API ⭐ HIGH PRIORITY

**Why:** Communities page exists but uses mock data. Users expect it to work.

**Estimated Time:** 4-5 hours

### 📋 Step-by-Step Instructions

#### **Part A: Backend Setup (2-3 hours)**

**2.1. Create Community Controller**

- Run the artisan command to create a new controller: `php artisan make:controller Api/CommunityController`
- Open the created file: `app/Http/Controllers/Api/CommunityController.php`
- Add the following methods:
  - `index()` - List all communities with pagination, include creator and members count
  - `show()` - Get a single community's details, check if current user is a member
  - `store()` - Create a new community, add creator as admin member
  - `update()` - Update community details (only creator can update)
  - `destroy()` - Delete a community (only creator can delete)
  - `join()` - Add current user as a member of the community
  - `leave()` - Remove current user from community (creator cannot leave)
  - `posts()` - Get all posts from community members

**2.2. Create Form Request Classes**

- Run artisan commands to create two form request classes:
  - `php artisan make:request Community/StoreCommunityRequest`
  - `php artisan make:request Community/UpdateCommunityRequest`
- Open `StoreCommunityRequest.php` and add validation rules:
  - Name: required, string, max 255 characters, must be unique
  - Description: optional, string, max 1000 characters
  - Privacy: required, must be either "public" or "private"
- Open `UpdateCommunityRequest.php` and add validation rules:
  - Name: optional, string, max 255, unique except for current community
  - Description: optional, string, max 1000 characters
  - Privacy: optional, must be either "public" or "private"

**2.3. Create Policy**

- Run artisan command: `php artisan make:policy CommunityPolicy --model=Community`
- Open `app/Policies/CommunityPolicy.php`
- Add `update()` method that checks if user is the creator
- Add `delete()` method that checks if user is the creator
- Both methods should return true only if the user's ID matches the community's creator_id

**2.4. Add Routes**

- Open the file: `routes/api.php`
- Add routes inside the protected routes group (where auth:sanctum middleware is applied):
  - GET `/communities` - List all communities
  - GET `/communities/{community}` - Get community details
  - POST `/communities` - Create new community
  - PUT `/communities/{community}` - Update community
  - DELETE `/communities/{community}` - Delete community
  - POST `/communities/{community}/join` - Join community
  - DELETE `/communities/{community}/leave` - Leave community
  - GET `/communities/{community}/posts` - Get community posts
- Don't forget to import the CommunityController at the top of the routes file

**2.5. Test Backend**

- Use Postman or similar tool to test all endpoints:
  - GET `/api/communities` - Should return paginated list of communities
  - POST `/api/communities` - Create a test community with name, description, and privacy
  - GET `/api/communities/{id}` - Get the details of the created community
  - POST `/api/communities/{id}/join` - Join the community
  - DELETE `/api/communities/{id}/leave` - Leave the community
- Verify all responses are correct and authorization works

---

#### **Part B: Frontend Setup (2 hours)**

**2.6. Create Communities Hook**

- Create a new file: `resources/js/hooks/useCommunities.js`
- Import necessary dependencies: useQuery, useMutation, useQueryClient from React Query
- Create `useCommunities()` hook that fetches all communities with optional parameters
- Create `useCommunity(id)` hook that fetches a single community by ID
- Create `useCommunityPosts(id)` hook that fetches posts for a specific community
- Create `useCreateCommunity()` mutation hook that creates a community and shows success toast
- Create `useJoinCommunity()` mutation hook that joins a community and invalidates queries
- Create `useLeaveCommunity()` mutation hook that leaves a community and invalidates queries
- All mutation hooks should show error toasts on failure

**2.7. Add API Methods**

- Open the file: `resources/js/services/api.js`
- Add a new `communityAPI` object with methods:
  - `getAll()` - GET request to `/communities` with optional params
  - `getById()` - GET request to `/communities/{id}`
  - `create()` - POST request to `/communities` with data
  - `update()` - PUT request to `/communities/{id}` with data
  - `delete()` - DELETE request to `/communities/{id}`
  - `join()` - POST request to `/communities/{id}/join`
  - `leave()` - DELETE request to `/communities/{id}/leave`
  - `getPosts()` - GET request to `/communities/{id}/posts` with optional params

**2.8. Update Communities Page**

- Open the file: `resources/js/pages/Communities.jsx`
- Remove all mock data
- Use the `useCommunities()` hook to fetch real data
- Display loading state while fetching
- Display error state if fetch fails
- Show list of communities with their details (name, description, member count)
- Add a "Create Community" button that opens a modal or navigates to a create page
- Add join/leave buttons for each community based on membership status
- Handle join/leave actions using the mutation hooks

**2.9. Create Community Detail Page**

- Create a new file: `resources/js/pages/CommunityDetail.jsx`
- Use the `useCommunity(id)` hook to fetch community details
- Display community information: name, description, creator, member count, privacy setting
- Show a join/leave button based on membership status
- If user is the creator, show edit and delete buttons
- Use the `useCommunityPosts(id)` hook to fetch and display community posts
- Display posts using the existing PostCard component
- Handle join/leave actions using mutation hooks

**2.10. Add Route**

- Open the file: `resources/js/app.jsx`
- Import the CommunityDetail component
- Add a new route inside the protected routes: `/communities/:id`
- Make sure the route is protected and renders the CommunityDetail component

---

### ✅ Step 2 Checklist

- [ ] CommunityController created with all 8 methods
- [ ] StoreCommunityRequest created with validation rules
- [ ] UpdateCommunityRequest created with validation rules
- [ ] CommunityPolicy created with update and delete methods
- [ ] All routes added to api.php
- [ ] Backend tested with Postman - all endpoints work
- [ ] useCommunities hook created with all necessary hooks
- [ ] communityAPI methods added to api.js
- [ ] Communities page updated to use real data
- [ ] CommunityDetail page created and functional
- [ ] Join/Leave functionality works correctly
- [ ] Route added to app.jsx

---

## STEP 3: Create Profile Editing Page ⭐ MEDIUM PRIORITY

**Why:** Users need to update their profiles (bio, cover image, etc.).

**Estimated Time:** 2-3 hours

### 📋 Step-by-Step Instructions

**3.1. Create Migration for Cover Image**

- Run artisan command: `php artisan make:migration add_cover_image_to_users_table`
- Open the created migration file
- In the `up()` method, add a column to the users table:
  - Column name: `cover_image`
  - Type: string
  - Nullable: yes
  - Position: after the `profile_picture` column
- Run the migration: `php artisan migrate`

**3.2. Update UserController**

- Open the file: `app/Http/Controllers/Api/UserController.php`
- Find the `updateProfile()` method
- **IMPORTANT:** Use EdgeStore for cover image upload (NOT local storage)
- Add logic to accept `cover_image_url` (string URL) instead of file
- Save the EdgeStore URL directly to the user's `cover_image` field
- **Note:** File upload happens on frontend using EdgeStore React components
- **Reference:** See how `uploadProfilePicture()` handles EdgeStore URLs

**3.3. Create EditProfile Page**

- Create a new file: `resources/js/pages/EditProfile.jsx`
- Create a form with the following fields:
  - Name input field
  - Bio textarea with character counter (show remaining characters)
  - Location input field
  - Website input field
  - Profile Picture upload with preview (use EdgeStore - see Register.jsx for example)
  - Cover Image upload with preview (use EdgeStore `coverImages` bucket - see PostInput.jsx for example)
  - Privacy Settings toggle or select dropdown
- **IMPORTANT:** Use EdgeStore for file uploads:
  - Import `useEdgeStore` from `../../lib/edgestoreClient`
  - Use `edgestore.profilePictures.upload()` for profile picture
  - Use `edgestore.coverImages.upload()` for cover image
  - Store EdgeStore URLs in form state
  - Send URLs (not files) to backend API
- Add Save and Cancel buttons
- Use React Hook Form for form management
- Use the existing `useUpdateProfile()` hook for submission
- Show loading state while saving/uploading
- Show success/error toasts
- Navigate back to profile page on success or cancel

**3.4. Update Profile Page**

- Open the file: `resources/js/pages/Profile.jsx`
- Find the "Edit Profile" button
- Make it navigate to `/edit-profile` route
- Add display logic for cover image:
  - If cover_image exists, display it at the top of the profile
  - Make it full-width and properly sized
  - Position profile picture over the cover image if needed

**3.5. Add Route**

- Open the file: `resources/js/app.jsx`
- Import the EditProfile component
- Add a new protected route: `/edit-profile`
- Make sure it renders the EditProfile component

---

### ✅ Step 3 Checklist

- [ ] Migration created and run successfully
- [ ] UserController accepts `cover_image_url` (EdgeStore URL, not file)
- [ ] EditProfile page created with all form fields
- [ ] Profile picture upload uses EdgeStore (profilePictures bucket)
- [ ] Cover image upload uses EdgeStore (coverImages bucket)
- [ ] Profile page updated with Edit Profile button
- [ ] Cover image displays on profile page
- [ ] Route added to app.jsx
- [ ] Can update all profile fields successfully
- [ ] Cover image uploads to EdgeStore and displays correctly
- [ ] Profile picture upload still works with EdgeStore

---

## STEP 4: Implement Suggested Users ⭐ MEDIUM PRIORITY

**Why:** RightSidebar shows "Suggested Communities" but no suggested users. This helps user discovery.

**Estimated Time:** 2 hours

### 📋 Step-by-Step Instructions

**4.1. Add Suggested Users Endpoint**

- Open the file: `app/Http/Controllers/Api/UserController.php`
- Add a new method called `suggested()`
- In this method:
  - Get the current authenticated user
  - Get all user IDs that the current user is already following
  - Also exclude the current user's own ID
  - Query the User model to find users NOT in the following list
  - Include follower and following counts
  - Limit results to 10 users
  - Return the results using UserResource collection

**4.2. Add Route**

- Open the file: `routes/api.php`
- Add a new GET route: `/users/suggested`
- Make sure it's inside the protected routes group
- Point it to the `suggested` method in UserController

**4.3. Create Hook**

- Open the file: `resources/js/hooks/useUsers.js` (or create it if it doesn't exist)
- Add a new hook called `useSuggestedUsers()`
- Use React Query's `useQuery` hook
- Query key should be `['suggested-users']`
- Call the API method `userAPI.getSuggested()`
- Extract the users array from the response data

**4.4. Add API Method**

- Open the file: `resources/js/services/api.js`
- Find the `userAPI` object
- Add a new method: `getSuggested()`
- This should make a GET request to `/users/suggested`
- Return the API response

**4.5. Update RightSidebar**

- Open the file: `resources/js/components/layout/RightSidebar.jsx`
- Find the section that shows suggested users (or create it if it doesn't exist)
- Remove any mock data
- Use the `useSuggestedUsers()` hook to fetch real data
- Display the suggested users with:
  - Avatar image
  - User name
  - Username
  - Follow button (if not already following)
  - Unfollow button (if already following)
- Handle follow/unfollow actions using existing hooks
- Show loading state while fetching
- Show empty state if no suggestions available

---

### ✅ Step 4 Checklist

- [ ] Backend endpoint `suggested()` created in UserController
- [ ] Route `/users/suggested` added to api.php
- [ ] Hook `useSuggestedUsers()` created
- [ ] API method `getSuggested()` added to userAPI
- [ ] RightSidebar updated to use real data
- [ ] Suggested users display correctly
- [ ] Follow/Unfollow buttons work
- [ ] Loading and empty states handled

---

## 📅 Recommended Timeline

- **Day 1:** Complete Step 1 (Post Media Upload) - Both backend and frontend
- **Day 2:** Complete Step 2 Backend (Communities API) - All backend work
- **Day 3:** Complete Step 2 Frontend (Communities UI) - All frontend work
- **Day 4:** Complete Step 3 (Profile Editing) - Full implementation
- **Day 5:** Complete Step 4 (Suggested Users) - Full implementation

---

## 💡 Development Tips

1. **Test as you go** - Don't wait until the end to test. Test each part after completing it.
2. **Use Postman** - Test backend APIs thoroughly before connecting the frontend.
3. **Check console** - Always check browser console for errors during frontend development.
4. **Follow patterns** - Look at existing code to maintain consistency in your implementation.
5. **Commit frequently** - Make small, focused commits after completing each sub-task.
6. **Read errors carefully** - Laravel and React error messages are usually very helpful.
7. **Use existing hooks** - Check if similar hooks exist that you can use as reference.

---

## 🎯 After Completing These Steps

Once you've completed Steps 1-4, here are the next priorities:

1. **Bookmarks System** - Allow users to save posts for later viewing
2. **Hashtags System** - Make hashtags clickable and show trending hashtags
3. **Explore Page** - Create a discovery page with trending content
4. **Notifications System** - Real-time notifications for likes, comments, follows
5. **Messaging System** - Make QuickChat functional with real messages

---

## 📝 Important Notes

- **EdgeStore File Storage:** This project uses EdgeStore for ALL file uploads (images, videos, profile pictures, cover images). Files are uploaded directly from frontend to EdgeStore cloud, and URLs are saved to the database. DO NOT implement local file storage.
- All backend routes should be inside the `auth:sanctum` middleware group in `routes/api.php`
- All frontend API calls should go through `resources/js/services/api.js`
- Use React Query hooks for data fetching (follow existing patterns in the codebase)
- Use Laravel Form Requests for validation (best practice)
- Use API Resources for consistent response formatting
- **For file uploads:** Always use EdgeStore React components (`useEdgeStore` hook) and send URLs to backend, not files
- **Backend validation:** Validate URL format (string, URL), not file types
- Always test backend endpoints with Postman before connecting frontend
- Check browser console for errors when working on frontend

---

**Last Updated:** After EdgeStore integration  
**Next Review:** After completing Steps 1-4

---

## 🔗 Related Documentation

- **EdgeStore Implementation Guide:** See `scope.md` for detailed EdgeStore setup and usage
- **EdgeStore Router Config:** `resources/js/lib/edgestore.js`
- **EdgeStore Provider:** `resources/js/lib/edgestoreClient.js`
- **Example Usage:** See `PostInput.jsx` (post media) and `Register.jsx` (profile pictures)
