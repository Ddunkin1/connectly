# Connectly – What Is Done vs What Needs to Do

This file is a checklist aligned with a typical Social Media Platform PRD.  
Product requirements: **Social_Media_Platform_PRD.docx** (same structure; update that doc manually from this file if needed).

---

## 1. Authentication

| Item | Status |
|------|--------|
| Register (name, email, username, password, bio, profile picture) | Done |
| Login / Logout | Done |
| Token-based auth (Sanctum) | Done |
| Protected routes (frontend) | Done |
| Registration error messages for deployers (VITE_API_URL, CORS) | Done |
| Email verification | Done |
| Password reset | Done |

---

## 2. Users and Profiles

| Item | Status |
|------|--------|
| View profile by username | Done |
| Edit profile (name, bio, location, website, privacy) | Done |
| Profile picture upload (Supabase) | Done |
| Cover image | Done |
| Profile timeline (user's posts) | Done |
| Suggested users | Done |

---

## 3. Follow / Connect (Friend Requests)

| Item | Status |
|------|--------|
| Send friend request (Connect) | Done |
| Accept / Reject request | Done |
| Cancel sent request | Done |
| Unfollow (connected user) | Done |
| Auto-reload and optimistic updates for connect/cancel/unfollow | Done |
| Profile shows: Connect, Request Sent + Cancel, Accept/Reject, Unfollow, Message | Done |

---

## 4. Posts

| Item | Status |
|------|--------|
| Create post (text, media, visibility public/followers) | Done |
| Feed (followed users + own posts) | Done |
| Profile timeline | Done |
| Post detail page | Done |
| Edit / Delete own post | Done |
| Post visibility indicator (public/friends) | Done |
| Share to timeline (shared_post_id, nested embed) | Done |
| Share count; like/share on embedded shared post | Done |

---

## 5. Likes

| Item | Status |
|------|--------|
| Like / Unlike post | Done |
| Like count and is_liked on post | Done |
| Optimistic updates; cache for nested shared_post | Done |
| Like on main post and on embedded shared post | Done |

---

## 6. Comments

| Item | Status |
|------|--------|
| Create comment | Done |
| Nested replies (parent_comment_id) | Done |
| Replies from API (comment.replies); show/hide replies | Done |
| Comment count; refetch after add | Done |
| Delete comment | Done |

---

## 7. Messaging

| Item | Status |
|------|--------|
| Conversations (get or create by user) | Done |
| Send message | Done |
| List messages in conversation | Done |
| Mark as read | Done |
| Messages page (ConversationList, MessageThread, MessageInput) | Done |
| QuickChat with real conversations | Done |
| Real-time (e.g. polling/WebSocket) | Needs to do (optional) |

---

## 8. Notifications

| Item | Status |
|------|--------|
| List notifications | Done |
| Unread count | Done |
| Mark as read / Read all | Done |

---

## 9. Search

| Item | Status |
|------|--------|
| Search users and posts | Done |

---

## 10. Communities

| Item | Status |
|------|--------|
| List communities | Done |
| Create / Edit / Delete community | Done |
| Join / Leave community | Done |
| Community detail and community posts | Done |

---

## 11. Deployment and Configuration

| Item | Status |
|------|--------|
| Vercel frontend (build, outputDirectory, rewrites) | Done |
| Asset paths for Vercel (no /build/ in URLs) | Done |
| CORS config for frontend origin | Done |
| DEPLOYMENT.md (VITE_API_URL, CORS, backend host) | Done |
| Deploy Laravel API and set VITE_API_URL so registration works on Vercel | Needs to do |
| Fix any remaining asset 404s (clear cache and redeploy) | Needs to do |

---

## Summary

- **Done:** Auth (including email verification and password reset), users/profiles, follow/connect, posts (create, feed, like, share, comments/replies), messaging (conversations + UI), notifications, search, communities, deployment docs and CORS.
- **Needs to do:** Deploy backend and set VITE_API_URL for registration on Vercel; fix asset 404s if any; optional: real-time messaging.
