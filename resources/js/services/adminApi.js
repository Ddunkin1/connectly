import api from './api';

export const adminAPI = {
    getUserStats: () => api.get('/admin/users/stats'),
    getUsers: (params = {}) => api.get('/admin/users', { params }),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    suspendUser: (userId, data = {}) => api.post(`/admin/users/${userId}/suspend`, data),
    unsuspendUser: (userId) => api.post(`/admin/users/${userId}/unsuspend`),

    /** Download CSV (uses Bearer token). */
    exportUsersCsv: async (params = {}) => {
        const res = await api.get('/admin/users', {
            params: { ...params, export: 'csv' },
            responseType: 'blob',
        });
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
    dismissReport: (reportId) => api.post(`/admin/reports/${reportId}/dismiss`),
    markActionTaken: (reportId) => api.post(`/admin/reports/${reportId}/action-taken`),
    removePost: (reportId) => api.post(`/admin/reports/${reportId}/remove-post`),

    getSystemSettings: () => api.get('/admin/settings'),
};
