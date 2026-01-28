---
name: Connectly Step-by-Step Development Guide
overview: A comprehensive, phase-by-phase development guide for completing the Connectly social media platform, with clear steps, priorities, and actionable tasks.
todos:
  - id: phase1-communities-backend
    content: "Phase 1.1: Build Communities backend API (Controller, Requests, Policy, Routes)"
    status: pending
  - id: phase1-communities-frontend
    content: "Phase 1.2: Build Communities frontend (Update page, Create detail page, Add hooks)"
    status: pending
  - id: phase1-search-backend
    content: "Phase 1.3: Implement Search backend (SearchController with multi-type search)"
    status: pending
  - id: phase1-search-frontend
    content: "Phase 1.3: Implement Search frontend (Search page, Header integration, Hooks)"
    status: pending
  - id: phase1-media-upload
    content: "Phase 1.4: Add Post Media Upload (Backend file handling, Frontend preview)"
    status: pending
  - id: phase1-profile-editing
    content: "Phase 1.5: Build Profile Editing (EditProfile page, Cover image support)"
    status: pending
  - id: phase1-suggested-users
    content: "Phase 1.6: Implement Suggested Users (Backend algorithm, Update RightSidebar)"
    status: pending
  - id: phase2-bookmarks
    content: "Phase 2.1: Build Bookmarks System (Migration, Model, Controller, Frontend)"
    status: pending
  - id: phase2-hashtags
    content: "Phase 2.2: Build Hashtags System (Controller, Trending endpoint, Frontend)"
    status: pending
  - id: phase2-explore
    content: "Phase 2.3: Create Explore Page (Backend endpoint, Frontend with tabs)"
    status: pending
  - id: phase3-notifications
    content: "Phase 3.1: Build Notifications System (Backend + Frontend, Real-time updates)"
    status: pending
  - id: phase4-messaging
    content: "Phase 4.1: Build Real-time Messaging (Backend + Frontend, Update QuickChat)"
    status: pending
  - id: phase5-email-verification
    content: "Phase 5.1: Implement Email Verification (Backend config, Frontend page)"
    status: pending
  - id: phase5-password-reset
    content: "Phase 5.2: Build Password Reset (Backend + Frontend pages)"
    status: pending
  - id: phase5-settings
    content: "Phase 5.3: Create Settings Page (Account, Privacy, Notifications, Security)"
    status: pending
  - id: phase6-optimization
    content: "Phase 6: Polish & Optimization (Performance, Error handling, Testing)"
    status: pending
isProject: false
---

# Connectly Development Guide - Step-by-Step Phases

## 🎯 Current Status Summary

**Backend Completion: ~70%**

- ✅ Authentication (Register, Login, Logout)
- ✅ User Profiles (View, Update, Profile Picture Upload)
- ✅ Posts (Create, Read, Update, Delete)
- ✅ Comments (Create, Read, Delete, Nested Replies)
- ✅ Likes (Like/Unlike Posts)
- ✅ Follows (Follow/Unfollow Users)
- ✅ Feed Algorithm (Posts from followed users)
- ⚠️ Communities (Model exists, no API endpoints)
- ❌ Search (Not implemented)
- ❌ Bookmarks (Not implemented)
- ❌ Notifications (Not implemented)
- ❌ Messaging (Not implemented)

**Frontend Completion: ~60%**

- ✅ Landing Page (with login/signup form)
- ✅ Login Page (Split layout design)
- ✅ Register Page (Multi-step with profile setup)
- ✅ Home Feed (Post feed with infinite scroll)
- ✅ Profile Page (View user profiles with posts)
- ✅ Post Detail (View post with comments)
- ⚠️ Communities Page (UI exists, uses mock data)
- ❌ Search Page (Not implemented)
- ❌ Bookmarks Page (Not implemented)
- ❌ Explore Page (Not implemented)
- ❌ Edit Profile Page (Not implemented)
- ❌ Notifications (Not implemented)
- ❌ Messages Page (Not implemented)

---

## 📋 Development Phases Overview

This guide is organized into **6 phases**, each building on the previous one. Complete each phase before moving to the next.

### Phase 1: Core Missing Features (HIGH PRIORITY)
**Goal:** Complete essential features that users expect immediately
**Estimated Time:** 2-3 weeks

### Phase 2: User Experience Enhancements (MEDIUM PRIORITY)
**Goal:** Improve user engagement and content discovery
**Estimated Time:** 1-2 weeks

### Phase 3: Social Features (MEDIUM PRIORITY)
**Goal:** Add community and discovery features
**Estimated Time:** 1-2 weeks

### Phase 4: Communication Features (MEDIUM PRIORITY)
**Goal:** Enable direct user communication
**Estimated Time:** 1-2 weeks

### Phase 5: Account Management (LOW PRIORITY)
**Goal:** Complete user account features
**Estimated Time:** 1 week

### Phase 6: Polish & Optimization (ONGOING)
**Goal:** Improve performance, security, and user experience
**Estimated Time:** Ongoing

---

## 🚀 PHASE 1: Core Missing Features

### **Step 1.1: Communities Backend API**

**Why First:** Communities are mentioned in your landing page and are a core feature users expect.

**Tasks:**

1. **Create Community Controller**
   - File: `app/Http/Controllers/Api/CommunityController.php`
   - Methods needed:
     - `index()` - List all communities (with pagination)
     - `show($community)` - Get community details
     - `store()` - Create new community (auth required)
     - `update($community)` - Update community (owner only)
     - `destroy($community)` - Delete community (owner only)
     - `join($community)` - Join community
     - `leave($community)` - Leave community
     - `posts($community)` - Get community posts

2. **Create Form Requests**
   - `app/Http/Requests/Community/StoreCommunityRequest.php`
     - Validation: name (required, string, max:255), description (nullable, string), privacy (required, in:public,private)
   - `app/Http/Requests/Community/UpdateCommunityRequest.php`
     - Same as StoreCommunityRequest but all fields optional

3. **Create Policy**
   - `app/Policies/CommunityPolicy.php`
     - `update()` - Only owner can update
     - `delete()` - Only owner can delete

4. **Add Routes**
   - Update `routes/api.php`:
     ```php
     // Communities
     Route::get('/communities', [CommunityController::class, 'index']);
     Route::get('/communities/{community}', [CommunityController::class, 'show']);
     Route::post('/communities', [CommunityController::class, 'store']);
     Route::put('/communities/{community}', [CommunityController::class, 'update']);
     Route::delete('/communities/{community}', [CommunityController::class, 'destroy']);
     Route::post('/communities/{community}/join', [CommunityController::class, 'join']);
     Route::delete('/communities/{community}/leave', [CommunityController::class, 'leave']);
     Route::get('/communities/{community}/posts', [CommunityController::class, 'posts']);
     ```

5. **Test the API**
   - Use Postman or similar to test all endpoints
   - Verify authorization works correctly
   - Test pagination

**Files to Create:**
- `app/Http/Controllers/Api/CommunityController.php`
- `app/Http/Requests/Community/StoreCommunityRequest.php`
- `app/Http/Requests/Community/UpdateCommunityRequest.php`
- `app/Policies/CommunityPolicy.php`

**Files to Update:**
- `routes/api.php`

---

### **Step 1.2: Communities Frontend**

**Tasks:**

1. **Create API Service Methods**
   - Update `resources/js/services/api.js`:
     ```javascript
     // Add to existing api object
     communityAPI: {
         getAll: (params) => api.get('/communities', { params }),
         getById: (id) => api.get(`/communities/${id}`),
         create: (data) => api.post('/communities', data),
         update: (id, data) => api.put(`/communities/${id}`, data),
         delete: (id) => api.delete(`/communities/${id}`),
         join: (id) => api.post(`/communities/${id}/join`),
         leave: (id) => api.delete(`/communities/${id}/leave`),
         getPosts: (id, params) => api.get(`/communities/${id}/posts`, { params }),
     }
     ```

2. **Create React Query Hooks**
   - File: `resources/js/hooks/useCommunities.js`
   - Hooks needed:
     - `useCommunities()` - Fetch all communities
     - `useCommunity(id)` - Fetch single community
     - `useCommunityPosts(id)` - Fetch community posts
     - `useCreateCommunity()` - Create mutation
     - `useJoinCommunity()` - Join mutation
     - `useLeaveCommunity()` - Leave mutation

3. **Update Communities Page**
   - File: `resources/js/pages/Communities.jsx`
   - Replace mock data with real API calls
   - Add "Create Community" button (opens modal)
   - Display real communities with join/leave buttons
   - Show member count and description

4. **Create Community Detail Page**
   - File: `resources/js/pages/CommunityDetail.jsx`
   - Display community info (name, description, member count)
   - Show community posts
   - Join/Leave button
   - If owner: Edit and Delete buttons

5. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/communities/:id" element={<CommunityDetail />} />
     ```

**Files to Create:**
- `resources/js/hooks/useCommunities.js`
- `resources/js/pages/CommunityDetail.jsx`

**Files to Update:**
- `resources/js/services/api.js`
- `resources/js/pages/Communities.jsx`
- `resources/js/app.jsx`

---

### **Step 1.3: Search Functionality**

**Why Important:** Users need to find content, people, and communities.

**Backend Tasks:**

1. **Create Search Controller**
   - File: `app/Http/Controllers/Api/SearchController.php`
   - Method: `search(Request $request)`
   - Query parameter: `q` (search query)
   - Optional parameter: `type` (users, posts, communities, hashtags, all)
   - Search logic:
     - Users: Search by name, username, bio
     - Posts: Search by content
     - Communities: Search by name, description
     - Hashtags: Search by name
   - Return paginated results

2. **Add Route**
   - Update `routes/api.php`:
     ```php
     Route::get('/search', [SearchController::class, 'search']);
     ```

**Frontend Tasks:**

1. **Create Search Page**
   - File: `resources/js/pages/Search.jsx`
   - Search input at top
   - Tabs for filtering by type (All, Users, Posts, Communities, Hashtags)
   - Display results in sections
   - Empty state when no results

2. **Create Search Hook**
   - File: `resources/js/hooks/useSearch.js`
   - Hook: `useSearch(query, type)`

3. **Update Header**
   - File: `resources/js/components/layout/Header.jsx`
   - Make search bar functional
   - On submit, navigate to `/search?q={query}`

4. **Add API Method**
   - Update `resources/js/services/api.js`:
     ```javascript
     searchAPI: {
         search: (query, type = 'all') => api.get('/search', { params: { q: query, type } }),
     }
     ```

5. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/search" element={<Search />} />
     ```

**Files to Create:**
- `app/Http/Controllers/Api/SearchController.php`
- `resources/js/pages/Search.jsx`
- `resources/js/hooks/useSearch.js`

**Files to Update:**
- `routes/api.php`
- `resources/js/components/layout/Header.jsx`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

### **Step 1.4: Post Media Upload**

**Why Important:** Users expect to upload images/videos with posts.

**Backend Tasks:**

1. **Update StorePostRequest**
   - File: `app/Http/Requests/Post/StorePostRequest.php`
   - Add validation for `media` field:
     ```php
     'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,mp4,webm', 'max:10240'], // 10MB max
     ```

2. **Update PostService**
   - File: `app/Services/PostService.php`
   - In `createPost()` method:
     - Check if media file exists in request
     - Use `MediaService` to store file
     - Save media URL and type to post
     - Store in `storage/app/public/posts/`

3. **Update PostResource**
   - File: `app/Http/Resources/PostResource.php`
   - Ensure `media_url` returns full URL (use `Storage::url()`)

**Frontend Tasks:**

1. **Update PostInput Component**
   - File: `resources/js/components/posts/PostInput.jsx`
   - Add file input (hidden, triggered by image/video button)
   - Add image preview before posting
   - Show selected file name
   - Upload file as FormData
   - Display preview thumbnail

2. **Update PostCard Component**
   - File: `resources/js/components/posts/PostCard.jsx`
   - Display media if `media_url` exists
   - Show image or video player based on `media_type`
   - Add lightbox for images (optional)

**Files to Update:**
- `app/Http/Requests/Post/StorePostRequest.php`
- `app/Services/PostService.php`
- `app/Http/Resources/PostResource.php`
- `resources/js/components/posts/PostInput.jsx`
- `resources/js/components/posts/PostCard.jsx`

---

### **Step 1.5: Profile Editing**

**Why Important:** Users need to update their profiles.

**Backend Tasks:**

1. **Add Cover Image Support**
   - Create migration: `php artisan make:migration add_cover_image_to_users_table`
   - Add `cover_image` column (nullable string)
   - Update `UserController@updateProfile` to handle cover image upload

2. **Verify UpdateProfile Works**
   - File: `app/Http/Controllers/Api/UserController.php`
   - Ensure `updateProfile()` handles all fields (bio, location, website, privacy_settings)

**Frontend Tasks:**

1. **Create Edit Profile Page**
   - File: `resources/js/pages/EditProfile.jsx`
   - Form fields:
     - Name
     - Bio (with character counter)
     - Location
     - Website
     - Profile Picture (with preview)
     - Cover Image (with preview)
     - Privacy Settings (public/private toggle)
   - Save button
   - Cancel button (navigate back)

2. **Update Profile Page**
   - File: `resources/js/pages/Profile.jsx`
   - Make "Edit Profile" button navigate to `/edit-profile`
   - Display cover image if exists

3. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/edit-profile" element={<EditProfile />} />
     ```

**Files to Create:**
- `database/migrations/xxxx_add_cover_image_to_users_table.php`
- `resources/js/pages/EditProfile.jsx`

**Files to Update:**
- `app/Http/Controllers/Api/UserController.php`
- `resources/js/pages/Profile.jsx`
- `resources/js/app.jsx`

---

### **Step 1.6: Suggested Users**

**Why Important:** Helps users discover new people to follow.

**Backend Tasks:**

1. **Add Suggested Users Endpoint**
   - File: `app/Http/Controllers/Api/UserController.php`
   - Method: `suggested(Request $request)`
   - Algorithm:
     - Get users not already followed
     - Prioritize users with mutual connections
     - Limit to 10 users
     - Return with follow status

2. **Add Route**
   - Update `routes/api.php`:
     ```php
     Route::get('/users/suggested', [UserController::class, 'suggested']);
     ```

**Frontend Tasks:**

1. **Update RightSidebar**
   - File: `resources/js/components/layout/RightSidebar.jsx`
   - Replace mock data with API call
   - Use `useSuggestedUsers()` hook
   - Display real users with follow buttons

2. **Create Hook**
   - File: `resources/js/hooks/useUsers.js` (or create new)
   - Add: `useSuggestedUsers()` hook

3. **Add API Method**
   - Update `resources/js/services/api.js`:
     ```javascript
     userAPI: {
         // ... existing methods
         getSuggested: () => api.get('/users/suggested'),
     }
     ```

**Files to Update:**
- `app/Http/Controllers/Api/UserController.php`
- `routes/api.php`
- `resources/js/components/layout/RightSidebar.jsx`
- `resources/js/hooks/useUsers.js`
- `resources/js/services/api.js`

---

## 🎨 PHASE 2: User Experience Enhancements

### **Step 2.1: Bookmarks System**

**Why Important:** Users want to save posts for later.

**Backend Tasks:**

1. **Create Migration**
   - Run: `php artisan make:migration create_bookmarks_table`
   - Columns: `id`, `user_id`, `post_id`, `created_at`, `updated_at`
   - Add foreign keys and unique constraint on `user_id` + `post_id`

2. **Create Bookmark Model**
   - File: `app/Models/Bookmark.php`
   - Relationships: `belongsTo(User)`, `belongsTo(Post)`

3. **Update User Model**
   - File: `app/Models/User.php`
   - Add: `bookmarks()` relationship

4. **Create Bookmark Controller**
   - File: `app/Http/Controllers/Api/BookmarkController.php`
   - Methods:
     - `store($post)` - Bookmark a post
     - `destroy($post)` - Remove bookmark
     - `index()` - Get user's bookmarks (paginated)

5. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::post('/posts/{post}/bookmark', [BookmarkController::class, 'store']);
     Route::delete('/posts/{post}/unbookmark', [BookmarkController::class, 'destroy']);
     Route::get('/user/bookmarks', [BookmarkController::class, 'index']);
     ```

**Frontend Tasks:**

1. **Create Bookmarks Page**
   - File: `resources/js/pages/Bookmarks.jsx`
   - Display bookmarked posts using PostCard component
   - Infinite scroll pagination

2. **Create Bookmarks Hook**
   - File: `resources/js/hooks/useBookmarks.js`
   - Hooks: `useBookmarks()`, `useBookmarkPost()`, `useUnbookmarkPost()`

3. **Update PostCard**
   - File: `resources/js/components/posts/PostCard.jsx`
   - Make bookmark button functional
   - Show filled icon if bookmarked

4. **Add API Methods**
   - Update `resources/js/services/api.js`:
     ```javascript
     bookmarkAPI: {
         bookmark: (postId) => api.post(`/posts/${postId}/bookmark`),
         unbookmark: (postId) => api.delete(`/posts/${postId}/unbookmark`),
         getAll: (params) => api.get('/user/bookmarks', { params }),
     }
     ```

5. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/bookmarks" element={<Bookmarks />} />
     ```

**Files to Create:**
- `database/migrations/xxxx_create_bookmarks_table.php`
- `app/Models/Bookmark.php`
- `app/Http/Controllers/Api/BookmarkController.php`
- `resources/js/pages/Bookmarks.jsx`
- `resources/js/hooks/useBookmarks.js`

**Files to Update:**
- `app/Models/User.php`
- `routes/api.php`
- `resources/js/components/posts/PostCard.jsx`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

### **Step 2.2: Hashtags System**

**Why Important:** Hashtags help users discover content.

**Backend Tasks:**

1. **Create Hashtag Controller**
   - File: `app/Http/Controllers/Api/HashtagController.php`
   - Methods:
     - `trending()` - Get trending hashtags (most used in last 7 days)
     - `show($hashtag)` - Get posts with specific hashtag
     - `search($query)` - Search hashtags by name

2. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::get('/hashtags/trending', [HashtagController::class, 'trending']);
     Route::get('/hashtags/{hashtag}', [HashtagController::class, 'show']);
     Route::get('/hashtags/search/{query}', [HashtagController::class, 'search']);
     ```

**Frontend Tasks:**

1. **Create Hashtag Page**
   - File: `resources/js/pages/Hashtag.jsx`
   - Display hashtag name and post count
   - Show posts with this hashtag
   - Follow hashtag button (optional)

2. **Update LeftSidebar**
   - File: `resources/js/components/layout/LeftSidebar.jsx`
   - Replace hardcoded trending hashtags with API call
   - Make hashtag links clickable

3. **Update PostCard**
   - File: `resources/js/components/posts/PostCard.jsx`
   - Make hashtag links navigate to `/hashtag/{tag}`

4. **Create Hashtag Hook**
   - File: `resources/js/hooks/useHashtags.js`
   - Hooks: `useTrendingHashtags()`, `useHashtagPosts(tag)`

5. **Add API Methods**
   - Update `resources/js/services/api.js`:
     ```javascript
     hashtagAPI: {
         getTrending: () => api.get('/hashtags/trending'),
         getPosts: (tag, params) => api.get(`/hashtags/${tag}`, { params }),
         search: (query) => api.get(`/hashtags/search/${query}`),
     }
     ```

6. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/hashtag/:tag" element={<Hashtag />} />
     ```

**Files to Create:**
- `app/Http/Controllers/Api/HashtagController.php`
- `resources/js/pages/Hashtag.jsx`
- `resources/js/hooks/useHashtags.js`

**Files to Update:**
- `routes/api.php`
- `resources/js/components/layout/LeftSidebar.jsx`
- `resources/js/components/posts/PostCard.jsx`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

### **Step 2.3: Explore Page**

**Why Important:** Users need a way to discover new content beyond their feed.

**Backend Tasks:**

1. **Add Explore Endpoint**
   - File: `app/Http/Controllers/Api/PostController.php` (or create ExploreController)
   - Method: `explore(Request $request)`
   - Return:
     - Trending posts (most liked in last 24 hours)
     - New posts (from users not followed)
     - Popular communities
   - Paginated results

2. **Add Route**
   - Update `routes/api.php`:
     ```php
     Route::get('/explore', [PostController::class, 'explore']);
     ```

**Frontend Tasks:**

1. **Create Explore Page**
   - File: `resources/js/pages/Explore.jsx`
   - Tabs: "Trending", "New", "Communities"
   - Display posts/communities based on selected tab
   - Infinite scroll

2. **Create Explore Hook**
   - File: `resources/js/hooks/useExplore.js`
   - Hook: `useExplore(type, params)`

3. **Add API Method**
   - Update `resources/js/services/api.js`:
     ```javascript
     exploreAPI: {
         getContent: (type, params) => api.get('/explore', { params: { type, ...params } }),
     }
     ```

4. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/explore" element={<Explore />} />
     ```

**Files to Create:**
- `resources/js/pages/Explore.jsx`
- `resources/js/hooks/useExplore.js`

**Files to Update:**
- `app/Http/Controllers/Api/PostController.php` (or create ExploreController)
- `routes/api.php`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

## 💬 PHASE 3: Social Features

### **Step 3.1: Notifications System**

**Why Important:** Users need to know when someone interacts with their content.

**Backend Tasks:**

1. **Create Migration**
   - Run: `php artisan make:migration create_notifications_table`
   - Columns: `id`, `user_id`, `type`, `notifiable_type`, `notifiable_id`, `data` (JSON), `read_at`, `created_at`, `updated_at`
   - Add indexes

2. **Create Notification Model**
   - File: `app/Models/Notification.php`
   - Relationships: `belongsTo(User)`
   - Polymorphic: `notifiable()`

3. **Create Notification Controller**
   - File: `app/Http/Controllers/Api/NotificationController.php`
   - Methods:
     - `index()` - Get user notifications (paginated)
     - `markAsRead($id)` - Mark single notification as read
     - `markAllAsRead()` - Mark all as read
     - `unreadCount()` - Get unread count

4. **Create Notification Events**
   - Create events for: PostLiked, CommentCreated, UserFollowed
   - Create listeners to create notifications

5. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::get('/notifications', [NotificationController::class, 'index']);
     Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
     Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
     Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
     ```

**Frontend Tasks:**

1. **Create Notification Bell Component**
   - File: `resources/js/components/common/NotificationBell.jsx`
   - Bell icon with badge showing unread count
   - Dropdown showing recent notifications
   - Click to navigate to notifications page

2. **Create Notifications Page**
   - File: `resources/js/pages/Notifications.jsx`
   - List all notifications
   - Mark as read on click
   - Filter by type (All, Likes, Comments, Follows)

3. **Create Notifications Hook**
   - File: `resources/js/hooks/useNotifications.js`
   - Hooks: `useNotifications()`, `useUnreadCount()`, `useMarkAsRead()`

4. **Update Header**
   - File: `resources/js/components/layout/Header.jsx`
   - Add NotificationBell component

5. **Add API Methods**
   - Update `resources/js/services/api.js`:
     ```javascript
     notificationAPI: {
         getAll: (params) => api.get('/notifications', { params }),
         markAsRead: (id) => api.put(`/notifications/${id}/read`),
         markAllAsRead: () => api.put('/notifications/read-all'),
         getUnreadCount: () => api.get('/notifications/unread-count'),
     }
     ```

6. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/notifications" element={<Notifications />} />
     ```

**Files to Create:**
- `database/migrations/xxxx_create_notifications_table.php`
- `app/Models/Notification.php`
- `app/Http/Controllers/Api/NotificationController.php`
- `app/Events/PostLiked.php` (and other events)
- `app/Listeners/CreateNotification.php` (and other listeners)
- `resources/js/components/common/NotificationBell.jsx`
- `resources/js/pages/Notifications.jsx`
- `resources/js/hooks/useNotifications.js`

**Files to Update:**
- `routes/api.php`
- `resources/js/components/layout/Header.jsx`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

## 📨 PHASE 4: Communication Features

### **Step 4.1: Real-time Messaging**

**Why Important:** Direct messaging is expected in social platforms.

**Backend Tasks:**

1. **Create Migration**
   - Run: `php artisan make:migration create_messages_table`
   - Columns: `id`, `sender_id`, `receiver_id`, `message`, `read_at`, `created_at`, `updated_at`
   - Add foreign keys and indexes

2. **Create Message Model**
   - File: `app/Models/Message.php`
   - Relationships: `belongsTo(User, 'sender_id')`, `belongsTo(User, 'receiver_id')`

3. **Create Message Controller**
   - File: `app/Http/Controllers/Api/MessageController.php`
   - Methods:
     - `index()` - Get conversations list
     - `show($user)` - Get messages with specific user
     - `store()` - Send message
     - `markAsRead($message)` - Mark message as read

4. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::get('/messages', [MessageController::class, 'index']);
     Route::get('/messages/{user}', [MessageController::class, 'show']);
     Route::post('/messages', [MessageController::class, 'store']);
     Route::put('/messages/{message}/read', [MessageController::class, 'markAsRead']);
     ```

**Frontend Tasks:**

1. **Update QuickChat Component**
   - File: `resources/js/components/layout/QuickChat.jsx`
   - Replace mock data with real API calls
   - Show real conversations
   - Send messages
   - Real-time updates (polling or WebSocket)

2. **Create Messages Page**
   - File: `resources/js/pages/Messages.jsx`
   - Full messaging interface
   - Conversation list on left
   - Chat window on right
   - Message input at bottom

3. **Create Messages Hook**
   - File: `resources/js/hooks/useMessages.js`
   - Hooks: `useConversations()`, `useMessages(userId)`, `useSendMessage()`

4. **Add API Methods**
   - Update `resources/js/services/api.js`:
     ```javascript
     messageAPI: {
         getConversations: () => api.get('/messages'),
         getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
         send: (data) => api.post('/messages', data),
         markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
     }
     ```

5. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/messages" element={<Messages />} />
     ```

**Files to Create:**
- `database/migrations/xxxx_create_messages_table.php`
- `app/Models/Message.php`
- `app/Http/Controllers/Api/MessageController.php`
- `resources/js/pages/Messages.jsx`
- `resources/js/hooks/useMessages.js`

**Files to Update:**
- `routes/api.php`
- `resources/js/components/layout/QuickChat.jsx`
- `resources/js/services/api.js`
- `resources/js/app.jsx`

---

## ⚙️ PHASE 5: Account Management

### **Step 5.1: Email Verification**

**Backend Tasks:**

1. **Configure Email**
   - Update `.env` with email settings (SMTP or Mailgun)
   - Test email sending

2. **Update AuthController**
   - File: `app/Http/Controllers/Api/AuthController.php`
   - Send verification email on registration
   - Add `verify()` method
   - Add `resend()` method

3. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])
         ->name('verification.verify');
     Route::post('/email/resend', [AuthController::class, 'resendVerification']);
     ```

**Frontend Tasks:**

1. **Create Verify Email Page**
   - File: `resources/js/pages/VerifyEmail.jsx`
   - Show verification status
   - Resend verification email button
   - Redirect to home after verification

2. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/verify-email" element={<VerifyEmail />} />
     ```

**Files to Create:**
- `resources/js/pages/VerifyEmail.jsx`

**Files to Update:**
- `app/Http/Controllers/Api/AuthController.php`
- `routes/api.php`
- `resources/js/app.jsx`

---

### **Step 5.2: Password Reset**

**Backend Tasks:**

1. **Create Password Reset Controller**
   - File: `app/Http/Controllers/Api/PasswordResetController.php`
   - Methods:
     - `forgot()` - Send reset link
     - `reset()` - Reset password with token

2. **Add Routes**
   - Update `routes/api.php`:
     ```php
     Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
     Route::post('/reset-password', [PasswordResetController::class, 'reset']);
     ```

**Frontend Tasks:**

1. **Create Forgot Password Page**
   - File: `resources/js/pages/ForgotPassword.jsx`
   - Email input
   - Submit button
   - Success message

2. **Create Reset Password Page**
   - File: `resources/js/pages/ResetPassword.jsx`
   - Token input (from URL)
   - New password input
   - Confirm password input
   - Submit button

3. **Update Login Page**
   - File: `resources/js/pages/Auth/Login.jsx`
   - Make "Forgot Password?" link functional

4. **Add Routes**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/forgot-password" element={<ForgotPassword />} />
     <Route path="/reset-password" element={<ResetPassword />} />
     ```

**Files to Create:**
- `app/Http/Controllers/Api/PasswordResetController.php`
- `resources/js/pages/ForgotPassword.jsx`
- `resources/js/pages/ResetPassword.jsx`

**Files to Update:**
- `routes/api.php`
- `resources/js/pages/Auth/Login.jsx`
- `resources/js/app.jsx`

---

### **Step 5.3: Settings Page**

**Frontend Tasks:**

1. **Create Settings Page**
   - File: `resources/js/pages/Settings.jsx`
   - Tabs: Account, Privacy, Notifications, Security
   - Account: Update name, email, username
   - Privacy: Profile visibility, who can message you
   - Notifications: Email preferences
   - Security: Change password, two-factor auth (optional)

2. **Add Backend Endpoints** (if needed)
   - Update `UserController` with settings update methods

3. **Add Route**
   - Update `resources/js/app.jsx`:
     ```javascript
     <Route path="/settings" element={<Settings />} />
     ```

**Files to Create:**
- `resources/js/pages/Settings.jsx`

**Files to Update:**
- `app/Http/Controllers/Api/UserController.php` (if needed)
- `resources/js/app.jsx`

---

## 🎨 PHASE 6: Polish & Optimization

### **Step 6.1: Performance Optimization**

**Tasks:**

1. **Image Optimization**
   - Compress images before upload
   - Generate thumbnails
   - Lazy load images in feed

2. **Code Splitting**
   - Implement React lazy loading for routes
   - Split large components

3. **Caching**
   - Implement Redis caching for frequently accessed data
   - Cache API responses on frontend

4. **Database Optimization**
   - Add indexes to frequently queried columns
   - Optimize N+1 queries

---

### **Step 6.2: Error Handling**

**Tasks:**

1. **Global Error Boundary**
   - Create error boundary component
   - Display user-friendly error messages

2. **API Error Handling**
   - Consistent error response format
   - Show toast notifications for errors

3. **Form Validation**
   - Client-side validation
   - Display validation errors clearly

---

### **Step 6.3: Testing**

**Tasks:**

1. **Backend Tests**
   - Unit tests for services
   - Feature tests for API endpoints

2. **Frontend Tests**
   - Component tests
   - Integration tests for critical flows

---

## 📝 Development Best Practices

### **Before Starting Each Phase:**

1. **Create a feature branch**
   ```bash
   git checkout -b feature/phase-1-communities
   ```

2. **Write tests first** (if doing TDD)
   - Write failing tests
   - Implement feature
   - Make tests pass

3. **Test locally**
   - Test backend with Postman/Insomnia
   - Test frontend in browser
   - Check console for errors

4. **Commit frequently**
   ```bash
   git add .
   git commit -m "feat: add communities backend API"
   ```

### **Code Quality:**

1. **Follow Laravel conventions**
   - Use Form Requests for validation
   - Use API Resources for responses
   - Use Policies for authorization

2. **Follow React best practices**
   - Use hooks for data fetching
   - Keep components small and focused
   - Use proper prop types or TypeScript

3. **Documentation**
   - Comment complex logic
   - Update README with setup instructions
   - Document API endpoints

### **Testing Checklist:**

After completing each feature:

- [ ] Backend API works correctly
- [ ] Frontend displays data correctly
- [ ] Error handling works
- [ ] Loading states work
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] No TypeScript/ESLint errors

---

## 🎯 Quick Reference: File Locations

### **Backend Files:**
- Controllers: `app/Http/Controllers/Api/`
- Models: `app/Models/`
- Requests: `app/Http/Requests/`
- Resources: `app/Http/Resources/`
- Policies: `app/Policies/`
- Services: `app/Services/`
- Routes: `routes/api.php`
- Migrations: `database/migrations/`

### **Frontend Files:**
- Pages: `resources/js/pages/`
- Components: `resources/js/components/`
- Hooks: `resources/js/hooks/`
- Services: `resources/js/services/`
- Store: `resources/js/store/`
- Routes: `resources/js/app.jsx`

---

## 🚦 Getting Started

**To begin development:**

1. **Choose a phase** (start with Phase 1)
2. **Pick a step** (start with Step 1.1)
3. **Follow the tasks** in order
4. **Test thoroughly** before moving to next step
5. **Commit your work** frequently

**Remember:** Don't skip steps. Each step builds on the previous one. Take your time and test as you go.

Good luck with your development! 🚀
