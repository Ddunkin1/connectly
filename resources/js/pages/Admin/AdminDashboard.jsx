import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('reports');

    if (!user?.role || user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="max-w-6xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>
            <div className="flex gap-4 mb-6">
                <Link
                    to="/admin/reports"
                    className={`px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'reports'
                            ? 'bg-[var(--theme-accent)] text-white'
                            : 'bg-[#252538] text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('reports')}
                >
                    Reports
                </Link>
                <Link
                    to="/admin/users"
                    className={`px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'users'
                            ? 'bg-[var(--theme-accent)] text-white'
                            : 'bg-[#252538] text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
