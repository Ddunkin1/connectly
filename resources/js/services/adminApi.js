import api from './api';

export const adminAPI = {
    getUserStats: () => api.get('/admin/users/stats'),
    getUsers: (params = {}) => api.get('/admin/users', { params }),
    getUserModeration: (userId) => api.get(`/admin/users/${userId}/moderation`),
    warnUser: (userId, data) => api.post(`/admin/users/${userId}/warn`, data),
    banUser: (userId, data = {}) => api.post(`/admin/users/${userId}/ban`, data),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    suspendUser: (userId, data = {}) => api.post(`/admin/users/${userId}/suspend`, data),
    unsuspendUser: (userId) => api.post(`/admin/users/${userId}/unsuspend`),

    /** Download CSV (uses Bearer token). */
    exportUsersCsv: async (params = {}) => {
        const res = await api.get('/admin/users', {
            params: { ...params, export: 'csv' },
            responseType: 'blob',
        });
        const contentType = res.headers?.['content-type'] ?? '';
        if (!contentType.includes('text/csv')) {
            // Backend returned an error response — decode and throw it
            const text = await res.data.text();
            let message = 'Export failed';
            try { message = JSON.parse(text)?.message ?? message; } catch { /* noop */ }
            throw new Error(message);
        }
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    getReportStats: () => api.get('/admin/reports/stats'),
    getReports: (params = {}) => api.get('/admin/reports', { params }),
    dismissReport: (reportId, data) => api.post(`/admin/reports/${reportId}/dismiss`, data),
    markActionTaken: (reportId) => api.post(`/admin/reports/${reportId}/action-taken`),
    removePost: (reportId) => api.post(`/admin/reports/${reportId}/remove-post`),
    removeProfileComment: (reportId) => api.post(`/admin/reports/${reportId}/remove-profile-comment`),

    getWarningAppeals: (page = 1) => api.get('/admin/warning-appeals', { params: { page } }),
    respondWarningAppeal: (appealId, data) => api.post(`/admin/warning-appeals/${appealId}/respond`, data),

    getBanAppeals: (page = 1) => api.get('/admin/ban-appeals', { params: { page } }),
    respondBanAppeal: (appealId, data) => api.post(`/admin/ban-appeals/${appealId}/respond`, data),

    getSystemSettings: () => api.get('/admin/settings'),
};
