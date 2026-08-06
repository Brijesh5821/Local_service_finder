import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
            <div>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Customer Portal</span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Welcome, {user?.email}</h1>
              <p className="text-slate-500 mt-1">Manage your bookings, service requests, and profile details.</p>
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
              <h3 className="font-bold text-slate-800 mb-2">Book a Service</h3>
              <p className="text-sm text-slate-500 mb-4">Find top providers and get things done around the house.</p>
              <a href="/services" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Explore Services &rarr;</a>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">Active Requests</h3>
              <p className="text-sm text-slate-500 mb-4">Track progress of your pending service requests.</p>
              <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md">0 Pending</span>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">Account Settings</h3>
              <p className="text-sm text-slate-500 mb-4">Update your password, phone number, and address information.</p>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage Settings &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
