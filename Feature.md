# 🚀 Feature Development Plan

## 📋 Current Status Analysis

### ✅ What's Already Working

1. **Post Creation**
   - ✅ PostInput component allows creating posts with text and/or media
   - ✅ Posts are saved to database via `POST /api/posts`
   - ✅ Posts appear in Home feed (from followed users + own posts)
   - ✅ Posts appear on user profile page
   - ✅ Cache invalidation on post creation (`queryClient.invalidateQueries(['posts'])`)

2. **User Timeline**
   - ✅ User profile page shows user's own posts
   - ✅ Posts are fetched via `GET /api/users/{username}/posts`
   - ✅ PostInput appears on own profile page

3. **QuickChat UI**
   - ✅ QuickChat component exists with mock data
   - ✅ UI shows chat list with avatars and last messages
   - ✅ Route reference exists: `/messages/${username}`

### ❌ What Needs to Be Built

1. **Messaging System** - **COMPLETELY MISSING**
   - ❌ No database tables for conversations/messages
   - ❌ No backend API endpoints
   - ❌ No messages page component
   - ❌ No real message functionality

2. **Timeline Post Visibility** - **NEEDS VERIFICATION**
   - ⚠️ Need to verify posts appear immediately in own timeline after creation
   - ⚠️ May need to add optimistic updates for better UX

---

## 🎯 Feature 1: Messaging System

### Overview
Build a complete messaging system that allows users to send direct messages to each other. This includes backend API, database schema, and frontend components.

### Step-by-Step Implementation Plan

#### **Phase 1: Database Schema** 🔴 Priority: HIGH

**Step 1.1: Create Conversations Migration**
- **File**: `database/migrations/YYYY_MM_DD_HHMMSS_create_conversations_table.php`
- **Purpose**: Store conversation metadata between two users
- **Schema**:
  ```php
  - id (bigint, primary key)
  - user_one_id (bigint, foreign key -> users.id)
  - user_two_id (bigint, foreign key -> users.id)
  - last_message_at (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
  - unique(user_one_id, user_two_id) // Prevent duplicate conversations
  ```
- **Check**: Ensure migration follows Laravel conventions

**Step 1.2: Create Messages Migration**
- **File**: `database/migrations/YYYY_MM_DD_HHMMSS_create_messages_table.php`
- **Purpose**: Store individual messages within conversations
- **Schema**:
  ```php
  - id (bigint, primary key)
  - conversation_id (bigint, foreign key -> conversations.id, cascade delete)
  - sender_id (bigint, foreign key -> users.id)
  - receiver_id (bigint, foreign key -> users.id)
  - message (text)
  - is_read (boolean, default: false)
  - read_at (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
  - index(conversation_id, created_at) // For efficient message retrieval
  - index(receiver_id, is_read) // For unread count queries
  ```
- **Check**: Verify foreign key constraints and indexes

**Step 1.3: Run Migrations**
- **Action**: `php artisan migrate`
- **Check**: Verify tables created successfully in database

---

#### **Phase 2: Backend Models** 🔴 Priority: HIGH

**Step 2.1: Create Conversation Model**
- **File**: `app/Models/Conversation.php`
- **Relationships**:
  - `belongsTo(User::class, 'user_one_id')` -> `userOne`
  - `belongsTo(User::class, 'user_two_id')` -> `userTwo`
  - `hasMany(Message::class)` -> `messages`
- **Methods**:
  - `getOtherUser(User $user): User` - Get the other user in conversation
  - `getLastMessage(): ?Message` - Get most recent message
  - `markAsReadFor(User $user): void` - Mark all messages as read for user
- **Scopes**:
  - `forUser(User $user)` - Get conversations where user is participant
- **Check**: Test relationships with Tinker

**Step 2.2: Create Message Model**
- **File**: `app/Models/Message.php`
- **Relationships**:
  - `belongsTo(Conversation::class)` -> `conversation`
  - `belongsTo(User::class, 'sender_id')` -> `sender`
  - `belongsTo(User::class, 'receiver_id')` -> `receiver`
- **Scopes**:
  - `unread()` - Get unread messages
  - `forUser(User $user)` - Get messages for specific user
- **Check**: Test relationships and scopes

**Step 2.3: Update User Model**
- **File**: `app/Models/User.php`
- **Add Relationships**:
  - `hasMany(Conversation::class, 'user_one_id')` -> `conversationsAsUserOne`
  - `hasMany(Conversation::class, 'user_two_id')` -> `conversationsAsUserTwo`
  - `hasMany(Message::class, 'sender_id')` -> `sentMessages`
  - `hasMany(Message::class, 'receiver_id')` -> `receivedMessages`
- **Add Methods**:
  - `conversations()` - Get all conversations (merge user_one and user_two)
  - `unreadMessagesCount(): int` - Get count of unread messages
- **Check**: Verify relationships work correctly

---

#### **Phase 3: Backend Services** 🟡 Priority: MEDIUM

**Step 3.1: Create ConversationService**
- **File**: `app/Services/ConversationService.php`
- **Methods**:
  - `getOrCreateConversation(User $user1, User $user2): Conversation`
    - Check if conversation exists between two users
    - Create if doesn't exist
    - Return conversation
  - `getUserConversations(User $user, int $perPage = 20): LengthAwarePaginator`
    - Get all conversations for user
    - Order by last_message_at DESC
    - Include last message and unread count
  - `getConversation(User $user, int $conversationId): ?Conversation`
    - Get conversation if user is participant
    - Return null if not participant
- **Check**: Test service methods with unit tests or Tinker

**Step 3.2: Create MessageService**
- **File**: `app/Services/MessageService.php`
- **Methods**:
  - `sendMessage(Conversation $conversation, User $sender, string $message): Message`
    - Create message
    - Update conversation's last_message_at
    - Return created message
  - `getMessages(Conversation $conversation, int $perPage = 50): LengthAwarePaginator`
    - Get messages for conversation
    - Order by created_at DESC (newest first)
  - `markAsRead(Conversation $conversation, User $user): void`
    - Mark all messages in conversation as read for user
    - Update read_at timestamp
  - `getUnreadCount(User $user): int`
    - Get total unread messages count for user
- **Check**: Test all service methods

---

#### **Phase 4: Backend API - Form Requests** 🟡 Priority: MEDIUM

**Step 4.1: Create StoreMessageRequest**
- **File**: `app/Http/Requests/Message/StoreMessageRequest.php`
- **Validation Rules**:
  ```php
  - receiver_id: required|exists:users,id|different:current_user_id
  - message: required|string|max:5000
  ```
- **Check**: Test validation with invalid data

**Step 4.2: Create UpdateMessageRequest (Optional)**
- **File**: `app/Http/Requests/Message/UpdateMessageRequest.php`
- **Purpose**: For editing messages (if needed)
- **Check**: Decide if message editing is needed

---

#### **Phase 5: Backend API - Controllers** 🔴 Priority: HIGH

**Step 5.1: Create ConversationController**
- **File**: `app/Http/Controllers/Api/ConversationController.php`
- **Methods**:
  - `index(Request $request): JsonResponse`
    - Get all conversations for authenticated user
    - Use ConversationService
    - Return paginated list with last message and unread count
  - `show(Request $request, Conversation $conversation): JsonResponse`
    - Get single conversation
    - Verify user is participant
    - Mark messages as read
    - Return conversation with messages
- **Check**: Test endpoints with Postman/HTTP client

**Step 5.2: Create MessageController**
- **File**: `app/Http/Controllers/Api/MessageController.php`
- **Methods**:
  - `store(StoreMessageRequest $request): JsonResponse`
    - Get or create conversation
    - Send message via MessageService
    - Return created message
  - `index(Request $request, Conversation $conversation): JsonResponse`
    - Get messages for conversation
    - Verify user is participant
    - Return paginated messages
  - `markAsRead(Request $request, Conversation $conversation): JsonResponse`
    - Mark conversation messages as read
    - Return success response
- **Check**: Test all endpoints

**Step 5.3: Add Routes**
- **File**: `routes/api.php`
- **Add Routes**:
  ```php
  // Conversations
  Route::get('/conversations', [ConversationController::class, 'index']);
  Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
  
  // Messages
  Route::post('/messages', [MessageController::class, 'store']);
  Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
  Route::post('/conversations/{conversation}/read', [MessageController::class, 'markAsRead']);
  ```
- **Check**: Verify routes are inside `auth:sanctum` middleware group

---

#### **Phase 6: Backend API - Resources** 🟢 Priority: LOW

**Step 6.1: Create ConversationResource**
- **File**: `app/Http/Resources/ConversationResource.php`
- **Fields**:
  - id, user_one, user_two, last_message, unread_count, last_message_at, created_at
- **Check**: Test resource output

**Step 6.2: Create MessageResource**
- **File**: `app/Http/Resources/MessageResource.php`
- **Fields**:
  - id, sender, receiver, message, is_read, read_at, created_at
- **Check**: Test resource output

---

#### **Phase 7: Frontend API Service** 🟡 Priority: MEDIUM

**Step 7.1: Add API Methods**
- **File**: `resources/js/services/api.js`
- **Add Methods**:
  ```javascript
  conversationsAPI: {
    getConversations: (page = 1) => api.get(`/conversations?page=${page}`),
    getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
  },
  messagesAPI: {
    sendMessage: (data) => api.post('/messages', data),
    getMessages: (conversationId, page = 1) => api.get(`/conversations/${conversationId}/messages?page=${page}`),
    markAsRead: (conversationId) => api.post(`/conversations/${conversationId}/read`),
  },
  ```
- **Check**: Test API calls in browser console

---

#### **Phase 8: Frontend Hooks** 🟡 Priority: MEDIUM

**Step 8.1: Create useConversations Hook**
- **File**: `resources/js/hooks/useConversations.js`
- **Hooks**:
  - `useConversations()` - Get all conversations (infinite query)
  - `useConversation(conversationId)` - Get single conversation
- **Check**: Test hooks in component

**Step 8.2: Create useMessages Hook**
- **File**: `resources/js/hooks/useMessages.js`
- **Hooks**:
  - `useMessages(conversationId)` - Get messages for conversation (infinite query)
  - `useSendMessage()` - Mutation to send message
  - `useMarkAsRead()` - Mutation to mark as read
- **Check**: Test hooks

---

#### **Phase 9: Frontend Components** 🔴 Priority: HIGH

**Step 9.1: Create Messages Page**
- **File**: `resources/js/pages/Messages.jsx`
- **Features**:
  - List of conversations on left sidebar
  - Selected conversation view on right
  - Show "Select a conversation" when none selected
  - Show messages in conversation
  - Message input at bottom
- **Check**: Test UI and interactions

**Step 9.2: Create ConversationList Component**
- **File**: `resources/js/components/messages/ConversationList.jsx`
- **Features**:
  - List of conversations
  - Show avatar, name, last message preview
  - Show unread badge
  - Click to select conversation
- **Check**: Test component rendering

**Step 9.3: Create MessageThread Component**
- **File**: `resources/js/components/messages/MessageThread.jsx`
- **Features**:
  - Display messages in conversation
  - Show sender avatar and name
  - Show message timestamp
  - Scroll to bottom on new messages
  - Infinite scroll for older messages
- **Check**: Test message display and scrolling

**Step 9.4: Create MessageInput Component**
- **File**: `resources/js/components/messages/MessageInput.jsx`
- **Features**:
  - Text input for message
  - Send button
  - Character limit (5000)
  - Disable while sending
- **Check**: Test message sending

**Step 9.5: Update QuickChat Component**
- **File**: `resources/js/components/layout/QuickChat.jsx`
- **Changes**:
  - Replace mock data with real API call
  - Use `useConversations()` hook
  - Show actual unread counts
  - Navigate to `/messages/${username}` on click
- **Check**: Test QuickChat with real data

---

#### **Phase 10: Routing** 🟡 Priority: MEDIUM

**Step 10.1: Add Messages Route**
- **File**: `resources/js/app.jsx`
- **Add Route**:
  ```jsx
  <Route
    path="/messages/:username?"
    element={
      <ProtectedRoute>
        <Messages />
      </ProtectedRoute>
    }
  />
  ```
- **Check**: Test navigation to messages page

**Step 10.2: Update Profile Message Button**
- **File**: `resources/js/pages/Profile.jsx`
- **Change**: Make "Message" button navigate to `/messages/${username}`
- **Check**: Test button navigation

---

#### **Phase 11: Testing & Polish** 🟢 Priority: LOW

**Step 11.1: Test Complete Flow**
- Create conversation
- Send messages
- View conversations list
- Mark as read
- Test unread counts
- **Check**: All features work end-to-end

**Step 11.2: Add Error Handling**
- Handle API errors gracefully
- Show user-friendly error messages
- **Check**: Test error scenarios

**Step 11.3: Add Loading States**
- Show loading spinners
- Disable buttons while loading
- **Check**: UI feedback is clear

---

## 🎯 Feature 2: Timeline Post Visibility

### Overview
Ensure that when a user creates a post, it immediately appears in their own timeline/profile page.

### Current Behavior Analysis

**What Happens Now:**
1. User creates post via `PostInput` component
2. `useCreatePost` mutation runs
3. On success: `queryClient.invalidateQueries(['posts'])` is called
4. This should refresh:
   - Home feed (`['posts', 'feed']`)
   - User profile posts (`['user-posts', username]`)

**Potential Issues:**
- Cache key mismatch: Profile uses `['user-posts', username]` but invalidation uses `['posts']`
- No optimistic update: Post doesn't appear immediately

### Step-by-Step Fix Plan

#### **Step 1: Verify Cache Key Consistency** 🔴 Priority: HIGH

**Action**: Check cache keys used in hooks
- **File**: `resources/js/hooks/usePosts.js`
  - `useFeed()` uses: `['posts', 'feed']`
- **File**: `resources/js/hooks/useUsers.js`
  - `useUserPosts(username)` uses: `['user-posts', username]`

**Fix**: Update `useCreatePost` to invalidate both cache keys
- **File**: `resources/js/hooks/usePosts.js`
- **Change**:
  ```javascript
  onSuccess: (response, variables) => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['user-posts'] }); // Add this
    toast.success('Post created successfully!');
  },
  ```
- **Check**: Verify both feeds refresh after post creation

#### **Step 2: Add Optimistic Update** 🟡 Priority: MEDIUM

**Purpose**: Show post immediately in feed before API response

**Action**: Update `useCreatePost` mutation
- **File**: `resources/js/hooks/usePosts.js`
- **Add**:
  ```javascript
  onMutate: async (newPost) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts'] });
    await queryClient.cancelQueries({ queryKey: ['user-posts'] });
    
    // Snapshot previous values
    const previousFeed = queryClient.getQueryData(['posts', 'feed']);
    const previousUserPosts = queryClient.getQueryData(['user-posts', currentUser.username]);
    
    // Optimistically add post to feeds
    // (Implementation depends on API response structure)
    
    return { previousFeed, previousUserPosts };
  },
  onError: (err, newPost, context) => {
    // Rollback on error
    if (context?.previousFeed) {
      queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
    }
    if (context?.previousUserPosts) {
      queryClient.setQueryData(['user-posts', currentUser.username], context.previousUserPosts);
    }
  },
  ```
- **Check**: Post appears immediately, rolls back on error

#### **Step 3: Test Timeline Visibility** 🟢 Priority: LOW

**Test Cases**:
1. Create post from Home page → Check if appears in Home feed immediately
2. Create post from Profile page → Check if appears in Profile feed immediately
3. Navigate to own profile → Verify post appears in timeline
4. Refresh page → Verify post persists

**Check**: All test cases pass

---

## 📊 Implementation Priority Summary

### 🔴 HIGH Priority (Do First)
1. ✅ Database Schema (Conversations & Messages)
2. ✅ Backend Models (Conversation, Message, User relationships)
3. ✅ Backend Controllers (ConversationController, MessageController)
4. ✅ Frontend Components (Messages page, ConversationList, MessageThread)
5. ✅ Fix Timeline Cache Invalidation

### 🟡 MEDIUM Priority (Do Second)
1. Backend Services (ConversationService, MessageService)
2. Form Requests (StoreMessageRequest)
3. Frontend API Service & Hooks
4. QuickChat Component Update
5. Add Optimistic Updates

### 🟢 LOW Priority (Do Last)
1. API Resources (ConversationResource, MessageResource)
2. Error Handling & Loading States
3. Testing & Polish

---

## ✅ Checklist Before Starting

- [ ] Review current codebase structure
- [ ] Understand existing patterns (API structure, component structure)
- [ ] Set up testing environment
- [ ] Backup database (before migrations)
- [ ] Review Laravel documentation for relationships
- [ ] Review React Query documentation for mutations

---

## 🚀 Getting Started

1. **Start with Feature 2** (Timeline Post Visibility) - Quick fix
2. **Then move to Feature 1** (Messaging System) - Full implementation
3. **Test each phase** before moving to next
4. **Commit frequently** after each completed step

---

## 📝 Notes

- Follow existing code patterns in the codebase
- Use Laravel best practices (Form Requests, Services, Resources)
- Use React Query for data fetching and caching
- Test backend endpoints with Postman before connecting frontend
- Test frontend components in browser console
- Keep components small and focused
- Add proper error handling at each step

---

**Last Updated**: 2026-01-29
**Status**: Ready for Implementation
