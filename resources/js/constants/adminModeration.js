/** Values sent to POST /admin/users/{id}/suspend */
export const SUSPEND_DURATION_OPTIONS = [
    { value: '1d', label: '24 hours' },
    { value: '3d', label: '3 days' },
    { value: '7d', label: '7 days' },
    { value: '14d', label: '14 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: '180d', label: '6 months' },
    { value: '365d', label: '12 months' },
    { value: 'indefinite', label: 'Until lifted (no auto end)' },
];
