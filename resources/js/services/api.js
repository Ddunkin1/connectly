import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Read token from auth-storage (Zustand persist) - single source of truth
function getAuthToken() {
    try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.token ?? null;
    } catch {
        return null;
    }
}

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor - Add auth token to requests and handle FormData
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // If FormData, remove Content-Type to let browser set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            const path = typeof window !== 'undefined' ? window.location.pathname || '' : '';
            window.location.href = path.startsWith('/admin') ? '/admin/login' : '/login';
            return Promise.reject(error);
        }

        if (error.response?.status === 403 && error.response?.data?.code === 'account_banned') {
            const data = error.response.data;
            try {
                localStorage.setItem('connectly_account_banned', JSON.stringify({
                    reasonCode: data.reason_code ?? null,
                    banMessage: data.ban_message ?? null,
                    moderationEventId: data.moderation_event_id ?? null,
                    appealToken: data.appeal_token ?? null,
                }));
            } catch { /* ignore */ }
            useAuthStore.getState().logout();
            window.location.href = '/account-banned';
        }

        return Promise.reject(error);
    }
);

// Two-factor API
export const twoFactorAPI = {
    getStatus: () => api.get('/two-factor/status'),
    setup: () => api.post('/two-factor/setup'),
    confirm: (code) => api.post('/two-factor/confirm', { code }),
    disable: (password) => api.post('/two-factor/disable', { password }),
    challenge: (code) => api.post('/two-factor/challenge', { code }),
};

// Auth API
export const authAPI = {
    register: (data) => api.post('/register', data),
    login: (data) => api.post('/login', data),
    logout: () => api.post('/logout'),
    getUser: () => api.get('/user'),
    resendVerification: () => api.post('/email/verification-notification'),
    forgotPassword: (data) => api.post('/forgot-password', data),
    resetPassword: (data) => api.post('/reset-password', data),
};

// User API
export const userAPI = {
    getProfile: (userId) => api.get(`/users/${userId}/profile`),
    getUserPosts: (userId, page = 1) => api.get(`/users/${userId}/posts`, { params: { page } }),
    getUserCommunities: (userId) => api.get(`/users/${userId}/communities`),
    getConnections: () => api.get('/user/connections'),
    updateProfile: (data) => {
        // Handle FormData - POST with _method=PUT because PHP doesn't parse multipart on PUT
        const config = data instanceof FormData
            ? { headers: { 'Content-Type': undefined } }
            : {};
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            return api.post('/user/profile', data, config);
        }
        return api.put('/user/profile', data, config);
    },
    uploadProfilePicture: (data) => {
        // Handle FormData - don't set Content-Type, let browser set it with boundary
        const config = data instanceof FormData
            ? { headers: { 'Content-Type': undefined } }
            : {};
        return api.post('/user/profile-picture', data, config);
    },
    getProfilePictureHistory: () => api.get('/user/profile-picture-history'),
    getCoverImageHistory: () => api.get('/user/cover-image-history'),
    getSuggested: () => api.get('/users/suggested'),
    getNotificationPreferences: () => api.get('/user/notification-preferences'),
    updateNotificationPreferences: (data) => api.put('/user/notification-preferences', data),
    getAnalytics: () => api.get('/user/analytics'),
    exportData: () => api.get('/user/export-data'),
    heartbeat: () => api.post('/user/heartbeat'),
    completeOnboarding: () => api.post('/user/onboarding-complete'),
    deleteAccount: (data) => api.delete('/user/account', { data }),
};

// Trending API
export const trendingAPI = {
    getHashtags: (params = {}) => api.get('/trending/hashtags', { params }),
    getPosts: (params = {}) => api.get('/trending/posts', { params }),
    getHashtagPosts: (tag, page = 1) => api.get('/trending/hashtag-posts', { params: { tag, page } }),
};

// Bookmarks API
export const bookmarksAPI = {
    getBookmarks: (page = 1) => api.get('/bookmarks', { params: { page } }),
    addBookmark: (postId) => api.post(`/posts/${postId}/bookmark`),
    removeBookmark: (postId) => api.delete(`/posts/${postId}/bookmark`),
};

// Posts API
export const postsAPI = {
    getFeed: (page = 1, sort = 'for_you') => api.get('/posts', { params: { page, sort } }),
    getSuggestedPosts: () => api.get('/posts/suggested'),
    getPost: (postId) => api.get(`/posts/${postId}`),
    createPost: (data) => api.post('/posts', data),
    updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
    deletePost: (postId) => api.delete(`/posts/${postId}`),
    likePost: (postId) => api.post(`/posts/${postId}/like`),
    unlikePost: (postId) => api.delete(`/posts/${postId}/unlike`),
    sharePost: (postId) => api.post(`/posts/${postId}/share`),
    votePoll: (postId, pollOptionId) => api.post(`/posts/${postId}/polls/vote`, { poll_option_id: pollOptionId }),
    trackView: (postId) => api.post(`/posts/${postId}/view`),
    getAnalytics: (postId) => api.get(`/posts/${postId}/analytics`),
};

// Comments API
export const commentsAPI = {
    getComments: (postId, page = 1) => api.get(`/posts/${postId}/comments`, { params: { page } }),
    createComment: (postId, data) => {
        if (data instanceof FormData) {
            return api.post(`/posts/${postId}/comments`, data, { headers: { 'Content-Type': undefined } });
        }
        return api.post(`/posts/${postId}/comments`, data);
    },
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
    pinComment: (commentId) => api.post(`/comments/${commentId}/pin`),
    unpinComment: (commentId) => api.post(`/comments/${commentId}/unpin`),
    likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
    unlikeComment: (commentId) => api.delete(`/comments/${commentId}/unlike`),
};

// Profile comments API (comments on a user's profile)
export const profileCommentsAPI = {
    getComments: (userId, page = 1) => api.get(`/users/${userId}/profile-comments`, { params: { page } }),
    createComment: (userId, data) => api.post(`/users/${userId}/profile-comments`, data),
    updateComment: (commentId, data) => api.put(`/profile-comments/${commentId}`, data),
    hideComment: (commentId) => api.post(`/profile-comments/${commentId}/hide`),
    unhideComment: (commentId) => api.post(`/profile-comments/${commentId}/unhide`),
    deleteComment: (commentId) => api.delete(`/profile-comments/${commentId}`),
};

// Follow API (now sends friend requests)
export const followAPI = {
    follow: (userId) => api.post(`/users/${userId}/follow`),
    unfollow: (userId) => api.delete(`/users/${userId}/unfollow`),
};

// Block API
export const blocksAPI = {
    getBlockedUsers: (page = 1) => api.get('/blocks', { params: { page } }),
    blockUser: (userId) => api.post(`/users/${userId}/block`),
    unblockUser: (userId) => api.delete(`/users/${userId}/block`),
    getBlockStatus: (userId) => api.get(`/users/${userId}/block-status`),
};

// Friend Requests API
export const friendRequestAPI = {
    getFriendRequests: () => api.get('/friend-requests'),
    sendFriendRequest: (userId) => api.post(`/users/${userId}/friend-request`),
    acceptFriendRequest: (friendRequestId) => api.post(`/friend-requests/${friendRequestId}/accept`),
    rejectFriendRequest: (friendRequestId) => api.post(`/friend-requests/${friendRequestId}/reject`),
    cancelFriendRequest: (friendRequestId) => api.delete(`/friend-requests/${friendRequestId}`),
};

// Search API
export const searchAPI = {
    search: (query, type = 'all') => api.get('/search', { params: { q: query, type } }),
    suggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
};

// Reports API
export const reportsAPI = {
    submitReport: (data) => api.post('/reports', data),
    getReportStatus: (reportableType, reportableId) =>
        api.get('/reports/status', { params: { reportable_type: reportableType, reportable_id: reportableId } }),
};

/** Formal warnings: view linked post, delete post, appeal */
export const moderationAPI = {
    getWarningEvent: (eventId) => api.get(`/warning-events/${eventId}`),
    submitWarningAppeal: (data) => api.post('/warning-appeals', data),
};

// Communities API
export const communityAPI = {
    getAll: (params = {}) => api.get('/communities', { params }),
    getById: (id) => api.get(`/communities/${id}`),
    create: (data) => api.post('/communities', data),
    update: (id, data) => api.put(`/communities/${id}`, data),
    delete: (id) => api.delete(`/communities/${id}`),
    join: (id) => api.post(`/communities/${id}/join`),
    cancelJoinRequest: (id) => api.delete(`/communities/${id}/join-request`),
    leave: (id) => api.delete(`/communities/${id}/leave`),
    getJoinRequests: (communityId) => api.get(`/communities/${communityId}/join-requests`),
    approveJoinRequest: (communityId, joinRequestId) => api.post(`/communities/${communityId}/join-requests/${joinRequestId}/approve`),
    rejectJoinRequest: (communityId, joinRequestId) => api.post(`/communities/${communityId}/join-requests/${joinRequestId}/reject`),
    getMembers: (communityId) => api.get(`/communities/${communityId}/members`),
    updateMemberRole: (communityId, userId, role) => api.put(`/communities/${communityId}/members/${userId}`, { role }),
    removeMember: (communityId, userId) => api.delete(`/communities/${communityId}/members/${userId}`),
    getPosts: (id, params = {}) => api.get(`/communities/${id}/posts`, { params }),
    submitPost: (communityId, data) => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
        return api.post(`/communities/${communityId}/posts`, data, config);
    },
    getPendingPosts: (communityId) => api.get(`/communities/${communityId}/posts/pending`),
    approvePost: (communityId, postId) => api.post(`/communities/${communityId}/posts/${postId}/approve`),
    rejectPost: (communityId, postId) => api.post(`/communities/${communityId}/posts/${postId}/reject`),
    getPendingInvites: (communityId) => api.get(`/communities/${communityId}/invites`),
    invite: (communityId, userId) => api.post(`/communities/${communityId}/invites`, { user_id: userId }),
    suggestInvite: (communityId, userId) => api.post(`/communities/${communityId}/invites/suggest`, { user_id: userId }),
    approveInvite: (communityId, inviteId) => api.post(`/communities/${communityId}/invites/${inviteId}/approve`),
    rejectInvite: (communityId, inviteId) => api.post(`/communities/${communityId}/invites/${inviteId}/reject`),
    acceptInvite: (communityId, inviteId) => api.post(`/communities/${communityId}/invites/${inviteId}/accept`),
    declineInvite: (communityId, inviteId) => api.post(`/communities/${communityId}/invites/${inviteId}/decline`),
};

// Conversations API
export const conversationsAPI = {
    getConversations: (page = 1) => api.get('/conversations', { params: { page } }),
    getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
    getConversationByUsername: (username) => api.get(`/conversations/by-username/${username}`),
    deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}`),
};

// Messages API (longer timeout for file uploads so Supabase upload can complete)
export const messagesAPI = {
    sendMessage: (data) => api.post('/messages', data, { timeout: 130000 }),
    updateMessage: (messageId, data) => api.patch(`/messages/${messageId}`, data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    pinMessage: (messageId) => api.post(`/messages/${messageId}/pin`),
    unpinMessage: (messageId) => api.post(`/messages/${messageId}/unpin`),
    getMessages: (conversationId, page = 1, perPage = 25) => api.get(`/conversations/${conversationId}/messages`, { params: { page, per_page: perPage } }),
    getConversationMedia: (conversationId, page = 1) => api.get(`/conversations/${conversationId}/media`, { params: { page } }),
    markAsRead: (conversationId) => api.post(`/conversations/${conversationId}/read`),
};

// Group Conversations API
export const groupConversationsAPI = {
    getList: (page = 1) => api.get('/group-conversations', { params: { page } }),
    create: (data) => api.post('/group-conversations', data),
    getOne: (id) => api.get(`/group-conversations/${id}`),
    addMembers: (groupId, memberIds) => api.post(`/group-conversations/${groupId}/members`, { member_ids: memberIds }),
    removeMember: (groupId, userId) => api.delete(`/group-conversations/${groupId}/members/${userId}`),
    setNickname: (groupId, userId, nickname) => api.put(`/group-conversations/${groupId}/members/${userId}/nickname`, { nickname }),
};

// Group Messages API
export const groupMessagesAPI = {
    send: (data) => api.post('/group-messages', data),
    update: (messageId, data) => api.patch(`/group-messages/${messageId}`, data),
    delete: (messageId) => api.delete(`/group-messages/${messageId}`),
};

// Video Calls API
export const callAPI = {
    generateToken: (conversationId) => api.post('/calls/token',   { conversation_id: conversationId }),
    initiate:      (conversationId, callType = 'video') => api.post('/calls/initiate', { conversation_id: conversationId, call_type: callType }),
    accept:        (conversationId) => api.post('/calls/accept',   { conversation_id: conversationId }),
    end:           (conversationId, status = 'ended', duration = 0) =>
                      api.post('/calls/end', { conversation_id: conversationId, status, duration }),
};

// Stories API
export const storiesAPI = {
    getList: () => api.get('/stories'),
    create: (formData) => {
        const config = formData instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
        return api.post('/stories', formData, config);
    },
    getArchived: () => api.get('/stories/archived'),
    getOne: (storyId) => api.get(`/stories/${storyId}`),
    view: (storyId) => api.post(`/stories/${storyId}/view`),
    update: (storyId, data) => api.patch(`/stories/${storyId}`, data),
    delete: (storyId) => api.delete(`/stories/${storyId}`),
};

// Notifications API
export const notificationsAPI = {
    getNotifications: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    getHighlights: () => api.get('/notifications/highlights'),
    markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.post('/notifications/read-all'),
};

export default api;
