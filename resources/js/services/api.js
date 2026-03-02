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
            window.location.href = '/login';
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
    getSuggested: () => api.get('/users/suggested'),
    getNotificationPreferences: () => api.get('/user/notification-preferences'),
    updateNotificationPreferences: (data) => api.put('/user/notification-preferences', data),
    getAnalytics: () => api.get('/user/analytics'),
    exportData: () => api.get('/user/export-data'),
    deleteAccount: (data) => api.delete('/user/account', { data }),
};

// Trending API
export const trendingAPI = {
    getHashtags: (params = {}) => api.get('/trending/hashtags', { params }),
    getPosts: (params = {}) => api.get('/trending/posts', { params }),
};

// Bookmarks API
export const bookmarksAPI = {
    getBookmarks: (page = 1) => api.get('/bookmarks', { params: { page } }),
    addBookmark: (postId) => api.post(`/posts/${postId}/bookmark`),
    removeBookmark: (postId) => api.delete(`/posts/${postId}/bookmark`),
};

// Posts API
export const postsAPI = {
    getFeed: (page = 1) => api.get('/posts', { params: { page } }),
    getSuggestedPosts: () => api.get('/posts/suggested'),
    getPost: (postId) => api.get(`/posts/${postId}`),
    createPost: (data) => api.post('/posts', data),
    updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
    deletePost: (postId) => api.delete(`/posts/${postId}`),
    likePost: (postId) => api.post(`/posts/${postId}/like`),
    unlikePost: (postId) => api.delete(`/posts/${postId}/unlike`),
    sharePost: (postId) => api.post(`/posts/${postId}/share`),
    votePoll: (postId, pollOptionId) => api.post(`/posts/${postId}/polls/vote`, { poll_option_id: pollOptionId }),
};

// Comments API
export const commentsAPI = {
    getComments: (postId, page = 1) => api.get(`/posts/${postId}/comments`, { params: { page } }),
    createComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
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

// Communities API
export const communityAPI = {
    getAll: (params = {}) => api.get('/communities', { params }),
    getById: (id) => api.get(`/communities/${id}`),
    create: (data) => api.post('/communities', data),
    update: (id, data) => api.put(`/communities/${id}`, data),
    delete: (id) => api.delete(`/communities/${id}`),
    join: (id) => api.post(`/communities/${id}/join`),
    leave: (id) => api.delete(`/communities/${id}/leave`),
    getPosts: (id, params = {}) => api.get(`/communities/${id}/posts`, { params }),
    submitPost: (communityId, data) => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
        return api.post(`/communities/${communityId}/posts`, data, config);
    },
    getPendingPosts: (communityId) => api.get(`/communities/${communityId}/posts/pending`),
    approvePost: (communityId, postId) => api.post(`/communities/${communityId}/posts/${postId}/approve`),
    rejectPost: (communityId, postId) => api.post(`/communities/${communityId}/posts/${postId}/reject`),
};

// Conversations API
export const conversationsAPI = {
    getConversations: (page = 1) => api.get('/conversations', { params: { page } }),
    getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
    getConversationByUsername: (username) => api.get(`/conversations/by-username/${username}`),
};

// Messages API (longer timeout for file uploads so Supabase upload can complete)
export const messagesAPI = {
    sendMessage: (data) => api.post('/messages', data, { timeout: 130000 }),
    updateMessage: (messageId, data) => api.patch(`/messages/${messageId}`, data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
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

// Stories API
export const storiesAPI = {
    getList: () => api.get('/stories'),
    create: (formData) => {
        const config = formData instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
        return api.post('/stories', formData, config);
    },
    getOne: (storyId) => api.get(`/stories/${storyId}`),
    view: (storyId) => api.post(`/stories/${storyId}/view`),
};

// Push Subscriptions API
export const pushAPI = {
    subscribe: (subscription) => api.post('/user/push-subscription', subscription),
    unsubscribe: (endpoint) => api.delete('/user/push-subscription', { data: { endpoint } }),
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
