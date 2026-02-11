import api from './api';

export const adminAPI = {
    getUsers: (params = {}) => api.get('/admin/users', { params }),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
    unsuspendUser: (userId) => api.post(`/admin/users/${userId}/unsuspend`),

    getReports: (params = {}) => api.get('/admin/reports', { params }),
    dismissReport: (reportId) => api.post(`/admin/reports/${reportId}/dismiss`),
    markActionTaken: (reportId) => api.post(`/admin/reports/${reportId}/action-taken`),
    removePost: (reportId) => api.post(`/admin/reports/${reportId}/remove-post`),
};
