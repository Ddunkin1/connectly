# Connectly UI Redesign Plan

## Reference Design Summary

The reference image depicts a dark-themed social media interface (nokoSocial) with:

- **Layout**: Three-column (left nav sidebar, center feed, right sidebar). No separate top header.
- **Colors**: Dark backgrounds (#1A1A2E, deep purple/blue), white text, light grey secondary text, purple (#8A2BE2) accents.
- **Typography**: Sans-serif, clean, modern.
- **Components**: Rounded corners throughout, outline-style Material icons, card-based post feed.

---

## 1. Design Token Changes

### Color Palette

| Token             | Current              | New (Reference)           |
| ----------------- | -------------------- | ------------------------- |
| Primary           | #359EFF (blue)       | #8B5CF6 (purple)          |
| Background (main) | #f5f7f8 (light grey) | #0F0F1A or #1A1A2E (dark) |
| Card/surface      | white                | #252538 or #2D2D44        |
| Text primary      | gray-900             | white                     |
| Text secondary    | gray-500             | gray-400                  |
| Border            | gray-200             | gray-700/800              |
| Accent hover      | blue-50              | purple-900/50             |

**Files to update:**
- resources/css/app.css: Add/override `@theme` variables for dark mode colors.

---

## 2. Layout Restructure

### Changes

1. **Remove top Header** – Integrate search into the center feed area. Logo and user move into left sidebar.
2. **Left sidebar** – Full height, sticky, dark background. Contains:
   - Logo "connectly" (text, white, bold)
   - User profile card (avatar, name, @handle)
   - Nav: Home, Explore, Notifications (badge), Messages (badge), Bookmarks, Analytics, Theme, Settings
   - "Create Post" button (purple, full width) at bottom
3. **Center** – Main content. Search bar at top, then post feed.
4. **Right sidebar** – Messages/Updates list, Friend Requests with Accept/Decline.

---

## 3. Left Sidebar Redesign

**File:** resources/js/components/layout/LeftSidebar.jsx

### Structure

1. **Logo** – "connectly" (white, bold, top).
2. **User profile card** – Dark card with avatar, name, @username.
3. **Nav items** – Home, Explore, Notifications (bell + badge), Messages (envelope + badge), Bookmarks, Analytics, Theme, Settings.
4. **Active state** – Lighter purple background + blue vertical bar on left.
5. **Create Post** – Purple button at bottom of nav.

### Nav Path Mapping

| Label         | Path             | Badge Source                    |
| ------------- | ---------------- | ------------------------------- |
| Home          | /home            | -                               |
| Explore       | /search          | -                               |
| Notifications | /notifications   | useNotifications count          |
| Messages      | /messages        | useConversations unread count   |
| Bookmarks     | /bookmarks       | -                               |
| Analytics     | /analytics       | -                               |
| Theme         | Toggle           | -                               |
| Settings      | /settings        | -                               |

---

## 4. Center Feed / Home Page Redesign

### Search Bar

- Placeholder: "Search for creators, inspirations, and projects".
- Dark background, rounded, magnifying glass icon.
- onSubmit navigates to `/search?q=...`.

### Post Cards

- Dark card: `bg-[#252538]`, `rounded-xl`, `border border-gray-700/50`.
- Header: Avatar, name, time.
- Media: Full-width, rounded corners.
- Actions: Heart (like), Comment, Share, Bookmark – white/gray icons, purple on hover/active.

---

## 5. Right Sidebar Redesign

### Structure

1. **Top** – "Create" button (purple), user avatar.
2. **Messages/Updates** – List of users with avatar, name, status.
3. **Requests** – Section titled "Requests". Cards with avatar, name, "X mutual friends", Accept (purple) and Decline (outline) buttons.

---

## 6. Component Updates

- **Button**: primary `bg-purple-500`, outline `border-purple-500 text-purple-500`
- **Avatar**: Dark background fallback
- **PostCard**: Dark card, white/gray text, purple links
- **Modal, NotificationDropdown, QuickChat**: Dark theme restyle

---

## 7. New Pages / Features

- **Bookmarks**: Route `/bookmarks` – placeholder
- **Analytics**: Route `/analytics` – placeholder
- **Theme Toggle**: localStorage, default dark
- **Settings**: Route `/settings` – placeholder

---

## 8. Implementation Order

1. Phase 1 – Theme & layout (CSS tokens, remove Header, LeftSidebar)
2. Phase 2 – Center feed (Search bar, Home, PostInput, PostCard)
3. Phase 3 – Right sidebar (Messages, Requests)
4. Phase 4 – Shared components (Button, Avatar, Modal, QuickChat)
5. Phase 5 – New pages (Bookmarks, Analytics, Settings, theme toggle)

---

## 9. Brand Name

- Keep "connectly" everywhere (replace any "nokoSocial" in reference).
- Logo text: "connectly".
