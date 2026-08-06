import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
            <div>
              <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Admin Portal</span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Welcome, {user?.email}</h1>
              <p className="text-slate-500 mt-1">Full system management, audit logs, and platform controls.</p>
            </div>
            <button 
              onClick={logout}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors self-start md:self-auto"
            >
              Sign Out
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">User Directory</h3>
              <p className="text-sm text-slate-500 mb-4">Audit customers, service providers, and administrative staff accounts.</p>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage Users &rarr;</a>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">System Metrics</h3>
              <p className="text-sm text-slate-500 mb-4">View total uptime, database states, and active API usage logs.</p>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md">All systems operational</span>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">Security & Settings</h3>
              <p className="text-sm text-slate-500 mb-4">Configure authentication keys, platform boundaries, and limits.</p>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">System Config &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
