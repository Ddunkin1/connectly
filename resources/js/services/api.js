import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        const token = localStorage.getItem('auth_token');
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
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/register', data),
    login: (data) => api.post('/login', data),
    logout: () => api.post('/logout'),
    getUser: () => api.get('/user'),
};

// User API
export const userAPI = {
    getProfile: (userId) => api.get(`/users/${userId}/profile`),
    getUserPosts: (userId, page = 1) => api.get(`/users/${userId}/posts`, { params: { page } }),
    updateProfile: (data) => {
        // Handle FormData - don't set Content-Type, let browser set it with boundary
        const config = data instanceof FormData
            ? { headers: { 'Content-Type': undefined } }
            : {};
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
};

// Posts API
export const postsAPI = {
    getFeed: (page = 1) => api.get('/posts', { params: { page } }),
    getPost: (postId) => api.get(`/posts/${postId}`),
    createPost: (data) => api.post('/posts', data),
    updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
    deletePost: (postId) => api.delete(`/posts/${postId}`),
    likePost: (postId) => api.post(`/posts/${postId}/like`),
    unlikePost: (postId) => api.delete(`/posts/${postId}/unlike`),
};

// Comments API
export const commentsAPI = {
    getComments: (postId, page = 1) => api.get(`/posts/${postId}/comments`, { params: { page } }),
    createComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

// Follow API
export const followAPI = {
    follow: (userId) => api.post(`/users/${userId}/follow`),
    unfollow: (userId) => api.delete(`/users/${userId}/unfollow`),
};

// Search API
export const searchAPI = {
    search: (query, type = 'all') => api.get('/search', { params: { q: query, type } }),
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
};

// Conversations API
export const conversationsAPI = {
    getConversations: (page = 1) => api.get('/conversations', { params: { page } }),
    getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
    getConversationByUsername: (username) => api.get(`/conversations/by-username/${username}`),
};

// Messages API
export const messagesAPI = {
    sendMessage: (data) => api.post('/messages', data),
    getMessages: (conversationId, page = 1) => api.get(`/conversations/${conversationId}/messages`, { params: { page } }),
    markAsRead: (conversationId) => api.post(`/conversations/${conversationId}/read`),
};

export default api;
