import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { downloadCSV } from '../utils/csvExporter';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  IndianRupee,
  Search,
  AlertTriangle,
  Trash2,
  Shield,
  Power,
  PowerOff,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Tag,
  Plus,
  Edit2,
  Eye,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  X,
  Download
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Categories CRUD modal states
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', category_name: '', description: '', icon: '' });
  const [categoryFormError, setCategoryFormError] = useState('');

  // Moderation & Filter states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [serviceSearch, setServiceSearch] = useState('');

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, bookingsData, servicesData, categoriesData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUsers(),
        adminService.getBookings(),
        adminService.getServices(),
        adminService.getCategories()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBookings(bookingsData);
      setServices(servicesData);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle User Status Toggle (Suspend / Activate)
  const handleToggleUserStatus = async (targetUser) => {
    const isCurrentlySuspended = targetUser.status === 'suspended' || targetUser.is_active === false;
    const actionText = isCurrentlySuspended ? 'activate' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ₹{actionText} the user account for ${targetUser.full_name || targetUser.email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
      const newIsActive = isCurrentlySuspended ? true : false;
      
      await adminService.updateUserStatus(targetUser._id, {
        status: newStatus,
        is_active: newIsActive
      });

      // Update state locally
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, status: newStatus, is_active: newIsActive } : u));
      
      // Refresh stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUserDetails = async (targetUser) => {
    setActionLoading(true);
    try {
      const res = await adminService.getUserDetails(targetUser._id);
      if (res.success && res.user) {
        setSelectedUserDetails(res.user);
      } else {
        setSelectedUserDetails(targetUser);
      }
    } catch (err) {
      setSelectedUserDetails(targetUser);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete / deactivate the account for "${targetUser.full_name || targetUser.email}"?\n\nIf the user has historical bookings or reviews, their account will be deactivated safely while preserving historical records.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminService.deleteUser(targetUser._id);
      if (res.success) {
        alert(res.message || 'User processed successfully.');
        if (res.action === 'deleted') {
          setUsers(prev => prev.filter(u => u._id !== targetUser._id));
        } else {
          setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, status: 'deactivated', is_active: false } : u));
        }
        const statsData = await adminService.getDashboardStats();
        setStats(statsData);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete/deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to APPROVE the registration request for ${targetUser.full_name || targetUser.email}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await adminService.approveUser(targetUser._id);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, account_status: 'approved', status: 'active', is_active: true } : u));
      
      // Close details modal if open
      setSelectedRequest(null);
      
      // Refresh stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
      
      alert('Account approved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to approve account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (e) => {
    if (e) e.preventDefault();
    if (!rejectingUser) return;
    
    setActionLoading(true);
    try {
      await adminService.rejectUser(rejectingUser._id, rejectionReason || null);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === rejectingUser._id ? { ...u, account_status: 'rejected', status: 'rejected', is_active: false, rejection_reason: rejectionReason } : u));
      
      // Close all modals
      setRejectingUser(null);
      setRejectionReason('');
      setSelectedRequest(null);
      
      // Refresh stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
      
      alert('Account rejected successfully!');
    } catch (err) {
      alert(err.message || 'Failed to reject account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDocumentStatus = async (userId, docId, status) => {
    let reason = '';
    if (status === 'rejected') {
      reason = window.prompt('Please enter a rejection reason for this document:');
      if (reason === null) return;
    }
    
    setActionLoading(true);
    try {
      await adminService.updateDocumentStatus(userId, docId, status, reason);
      
      setSelectedRequest(prev => {
        if (!prev || prev._id !== userId) return prev;
        const updatedDocs = (prev.verification_documents || []).map(d => 
          d.id === docId ? { ...d, status, rejection_reason: reason } : d
        );
        return { ...prev, verification_documents: updatedDocs };
      });
      
      setUsers(prev => prev.map(u => {
        if (u._id !== userId) return u;
        const updatedDocs = (u.verification_documents || []).map(d => 
          d.id === docId ? { ...d, status, rejection_reason: reason } : d
        );
        return { ...u, verification_documents: updatedDocs };
      }));
      
      alert(`Document status updated to ${status} successfully!`);
    } catch (err) {
      alert(err.message || 'Failed to update document status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Booking Status Override (e.g., Force cancel a booking)
  const handleForceCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to FORCE CANCEL this booking? This will override its current state.')) {
      return;
    }

    setActionLoading(true);
    try {
      await adminService.updateBookingStatus(bookingId, {
        booking_status: 'Cancelled',
        payment_status: 'Failed'
      });

      // Update state locally
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, booking_status: 'Cancelled', payment_status: 'Failed' } : b));
      
      // Refresh stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Service Deletion (Content Moderation)
  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (!window.confirm(`Are you sure you want to DELETE/MODERATE the service listing "${serviceTitle}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await adminService.deleteService(serviceId);

      // Update state locally
      setServices(prev => prev.filter(s => s._id !== serviceId));
      
      // Refresh stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      alert(err.message || 'Failed to delete service listing');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Category CRUD Operations
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCategoryFormError('');
    setActionLoading(true);

    try {
      const payload = {
        category_name: categoryForm.category_name,
        description: categoryForm.description,
        icon: categoryForm.icon || categoryForm.category_name.toLowerCase().replace(' ', '_'),
        is_active: true
      };

      if (categoryForm.id) {
        // Edit mode
        const res = await adminService.updateCategory(categoryForm.id, payload);
        if (res.success) {
          setCategories(prev => prev.map(c => c._id === categoryForm.id ? res.category : c));
          setIsCategoryModalOpen(false);
        }
      } else {
        // Create mode
        const res = await adminService.createCategory(payload);
        if (res.success) {
          setCategories(prev => [...prev, res.category]);
          setIsCategoryModalOpen(false);
        }
      }
    } catch (err) {
      setCategoryFormError(err.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`This will DEACTIVATE the category "${categoryName}". It will no longer appear in provider service forms. Continue?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminService.deleteCategory(categoryId);
      if (res.success) {
        // Soft-delete: mark as inactive in local state
        setCategories(prev => prev.map(c => c._id === categoryId ? { ...c, is_active: false } : c));
      }
    } catch (err) {
      alert(err.message || 'Failed to deactivate category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCategoryStatus = async (categoryId, currentIsActive) => {
    const action = currentIsActive ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this category?`)) return;

    setActionLoading(true);
    try {
      const res = await adminService.toggleCategoryStatus(categoryId, !currentIsActive);
      if (res.success) {
        setCategories(prev => prev.map(c => c._id === categoryId ? res.category : c));
      }
    } catch (err) {
      alert(err.message || 'Failed to update category status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveService = async (serviceId, serviceTitle) => {
    if (!window.confirm(`Approve the service listing "${serviceTitle}"? It will become publicly visible to customers.`)) return;

    setActionLoading(true);
    try {
      const res = await adminService.approveService(serviceId);
      if (res.success) {
        setServices(prev => prev.map(s => s._id === serviceId ? { ...s, status: 'active' } : s));
      }
    } catch (err) {
      alert(err.message || 'Failed to approve service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectService = async (serviceId, serviceTitle) => {
    const reason = window.prompt(`Enter rejection reason for "${serviceTitle}" (optional):`);
    if (reason === null) return; // cancelled

    setActionLoading(true);
    try {
      const res = await adminService.rejectService(serviceId, reason || undefined);
      if (res.success) {
        setServices(prev => prev.map(s => s._id === serviceId ? { ...s, status: 'rejected', rejection_reason: reason } : s));
      }
    } catch (err) {
      alert(err.message || 'Failed to reject service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCategoryModal = (cat = null) => {
    setCategoryFormError('');
    if (cat) {
      setCategoryForm({
        id: cat._id,
        category_name: cat.category_name || '',
        description: cat.description || '',
        icon: cat.icon || ''
      });
    } else {
      setCategoryForm({
        id: '',
        category_name: '',
        description: '',
        icon: ''
      });
    }
    setIsCategoryModalOpen(true);
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesSearch = 
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q)) ||
      (u.provider_category && u.provider_category.toLowerCase().includes(q));

    const matchesRole = userRoleFilter === 'all' || u.role?.toLowerCase() === userRoleFilter.toLowerCase();
    
    let matchesStatus = true;
    if (userStatusFilter === 'active') {
      matchesStatus = u.is_active !== false && u.status !== 'suspended' && u.status !== 'deactivated';
    } else if (userStatusFilter === 'suspended') {
      matchesStatus = u.is_active === false || u.status === 'suspended' || u.status === 'deactivated';
    } else if (userStatusFilter === 'pending') {
      matchesStatus = u.account_status === 'pending' || u.status === 'pending';
    } else if (userStatusFilter === 'rejected') {
      matchesStatus = u.account_status === 'rejected' || u.status === 'rejected';
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      (b.customer_name && b.customer_name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.provider_name && b.provider_name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.booking_status && b.booking_status.toLowerCase().includes(bookingSearch.toLowerCase()));
    const matchesStatus = bookingStatusFilter === 'all' || b.booking_status?.toLowerCase() === bookingStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredServices = services.filter(s => {
    return (
      (s.title && s.title.toLowerCase().includes(serviceSearch.toLowerCase())) ||
      (s.category_name && s.category_name.toLowerCase().includes(serviceSearch.toLowerCase())) ||
      (s.provider_name && s.provider_name.toLowerCase().includes(serviceSearch.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(serviceSearch.toLowerCase()))
    );
  });

  const filteredCategories = categories.filter(c => {
    return c.category_name && c.category_name.toLowerCase().includes(categorySearch.toLowerCase());
  });

  // Report Export Handlers
  const handleExportUsers = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Account Status', 'City', 'Created At'];
    const rows = filteredUsers.map(u => [
      u._id,
      u.full_name || '',
      u.email || '',
      u.phone || '',
      u.role || '',
      u.status || 'active',
      u.account_status || 'approved',
      u.city || '',
      u.created_at ? new Date(u.created_at).toLocaleString() : ''
    ]);
    downloadCSV('admin_users_report', headers, rows);
  };

  const handleExportBookings = () => {
    const headers = ['Booking ID', 'Customer Name', 'Customer Email', 'Provider Name', 'Service Title', 'Booking Date', 'Time Slot', 'Total Amount (₹)', 'Booking Status', 'Payment Status'];
    const rows = filteredBookings.map(b => [
      b._id,
      b.customer_name || '',
      b.customer_email || '',
      b.provider_name || '',
      b.service_title || b.service_name || '',
      b.booking_date || '',
      b.time_slot || '',
      b.total_price || b.amount || 0,
      b.booking_status || '',
      b.payment_status || ''
    ]);
    downloadCSV('admin_bookings_report', headers, rows);
  };

  const handleExportServices = () => {
    const headers = ['Service ID', 'Title', 'Category', 'Provider Name', 'Price (₹)', 'Duration', 'City', 'Status'];
    const rows = filteredServices.map(s => [
      s._id,
      s.title || '',
      s.category_name || s.category || '',
      s.provider_name || '',
      s.price_value || s.price || 0,
      s.duration || '',
      s.city || '',
      s.status || 'active'
    ]);
    downloadCSV('admin_services_report', headers, rows);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={12} /> Admin Portal
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Welcome, {user?.full_name || user?.email}</h1>
              <p className="text-slate-500 mt-1">Full system management, user audits, booking monitoring, and provider services control.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-2"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={logout}
                className="bg-slate-950 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <LayoutDashboard size={16} /> Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <Users size={16} /> Users Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <Clock size={16} /> Pending Requests ({users.filter(u => u.account_status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <Calendar size={16} /> Bookings Monitor ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <Briefcase size={16} /> Services Registry ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              <Tag size={16} /> Category Management ({categories.length})
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 mt-4 font-medium">Gathering system data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-lg">Server Error</h3>
              <p className="mt-1">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Retry Request
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-8">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_users}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Providers</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_providers}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-violet-50 text-violet-600 p-3.5 rounded-xl">
                      <LayoutDashboard size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Services</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_services}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Bookings</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_bookings}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl">
                      <IndianRupee size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Earnings</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">₹{stats.total_earnings.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>

                {/* Analytical breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bookings Status Breakdown */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Calendar className="text-blue-600" size={20} /> Booking Lifecycle Distribution
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.bookings_by_status).map(([status, count]) => {
                        const total = stats.total_bookings || 1;
                        const percentage = Math.round((count / total) * 100);
                        
                        let colorClass = 'bg-slate-400';
                        if (status === 'Completed') colorClass = 'bg-emerald-500';
                        if (status === 'Pending') colorClass = 'bg-amber-500';
                        if (status === 'Accepted') colorClass = 'bg-blue-500';
                        if (status === 'Cancelled' || status === 'Rejected') colorClass = 'bg-rose-500';

                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                              <span className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ₹{colorClass}`}></span>
                                {status}
                              </span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Users Role Breakdown */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Users className="text-blue-600" size={20} /> Platform Accounts Division
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.users_by_role).map(([role, count]) => {
                        const total = stats.total_users || 1;
                        const percentage = Math.round((count / total) * 100);
                        
                        let colorClass = 'bg-slate-400';
                        if (role === 'Admin') colorClass = 'bg-rose-500';
                        if (role === 'Provider') colorClass = 'bg-indigo-500';
                        if (role === 'User') colorClass = 'bg-sky-500';

                        return (
                          <div key={role}>
                            <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                              <span className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                                {role}s
                              </span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* System Metrics Monitor */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="text-emerald-600" size={20} /> Administrative Core Boundaries
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm mb-1">CORS & Security Keys</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">FastAPI JWT signatures verified using strong HS256 tokens. CORS limits incoming clients to specific React frontend headers.</p>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Valid & Secure</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Database Integrity</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">Seeding rules verified. Strict MongoDB indexes configured on unique email, active services, and customer bookings keys.</p>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Index Verified</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Suspension Enforcer</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">Authentication layer actively intercepts login requests for flagged accounts. User/provider dashboard panels reject suspended tokens.</p>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Protection Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search & Filters */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, city..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-slate-400" />
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      >
                        <option value="all">All Roles</option>
                        <option value="user">Customers</option>
                        <option value="provider">Service Providers</option>
                        <option value="admin">Administrators</option>
                      </select>
                    </div>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended / Deactivated</option>
                      <option value="pending">Pending Approval</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <button
                      onClick={handleExportUsers}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                      title="Export Users Report as CSV"
                    >
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                        <th className="py-4 px-6">Name & Contact</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Category/Hourly Rate</th>
                        <th className="py-4 px-6">City</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((item) => {
                          const isSuspended = item.status === 'suspended' || item.status === 'deactivated' || item.is_active === false;
                          const isAdmin = item.role?.toLowerCase() === 'admin';
                          
                          let roleBadgeColor = 'bg-sky-50 text-sky-700';
                          if (item.role?.toLowerCase() === 'provider') roleBadgeColor = 'bg-indigo-50 text-indigo-700';
                          if (isAdmin) roleBadgeColor = 'bg-rose-50 text-rose-700';

                          return (
                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-bold text-slate-800">{item.full_name || 'No Name'}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.email}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.phone || 'No phone number'}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${roleBadgeColor}`}>
                                  {item.role || 'User'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {item.role?.toLowerCase() === 'provider' ? (
                                  <div>
                                    <p className="font-medium">{item.provider_category || 'Home Services'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">₹{item.hourly_rate || 0}/hr • {item.experience || 0} yrs exp</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {item.city || 'N/A'}
                              </td>
                              <td className="py-4 px-6">
                                {isSuspended ? (
                                  <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 w-fit">
                                    <PowerOff size={10} /> Suspended
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 w-fit">
                                    <Power size={10} /> Active
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleViewUserDetails(item)}
                                    disabled={actionLoading}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all border border-blue-100"
                                    title="View Full User Details"
                                  >
                                    <Eye size={14} />
                                  </button>

                                  {!isAdmin && (
                                    <>
                                      <button
                                        onClick={() => handleToggleUserStatus(item)}
                                        disabled={actionLoading}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                          isSuspended
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                        }`}
                                        title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                                      >
                                        {isSuspended ? (
                                          <>
                                            <Power size={12} /> Activate
                                          </>
                                        ) : (
                                          <>
                                            <PowerOff size={12} /> Suspend
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteUser(item)}
                                        disabled={actionLoading}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-100"
                                        title="Delete / Deactivate User"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search & Filters */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search bookings by provider, customer, status..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Filter size={16} className="text-slate-400" />
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <button
                      onClick={handleExportBookings}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                      title="Export Bookings Report as CSV"
                    >
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                        <th className="py-4 px-6">Customer</th>
                        <th className="py-4 px-6">Provider</th>
                        <th className="py-4 px-6">Date & Time</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                            No bookings matching criteria found.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((item) => {
                          let statusColor = 'bg-slate-50 text-slate-700';
                          if (item.booking_status === 'Pending') statusColor = 'bg-amber-50 text-amber-700';
                          if (item.booking_status === 'Accepted') statusColor = 'bg-blue-50 text-blue-700';
                          if (item.booking_status === 'Completed') statusColor = 'bg-emerald-50 text-emerald-700';
                          if (item.booking_status === 'Cancelled' || item.booking_status === 'Rejected') statusColor = 'bg-rose-50 text-rose-700';

                          return (
                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {item.customer_name || 'Customer'}
                                <p className="text-xs text-slate-400 font-normal mt-0.5">{item.booking_address}</p>
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {item.provider_name || 'Provider'}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                <div>
                                  <p className="font-medium">{item.booking_date}</p>
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Clock size={12} /> {item.booking_time}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold text-slate-800 text-sm">
                                ${item.total_amount || 0}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                                  {item.booking_status}
                                </span>
                                {item.payment_status && (
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                                    Pay: {item.payment_status}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {item.booking_status !== 'Cancelled' && item.booking_status !== 'Completed' && item.booking_status !== 'Rejected' ? (
                                  <button
                                    onClick={() => handleForceCancelBooking(item._id)}
                                    disabled={actionLoading}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto border border-rose-100"
                                  >
                                    <XCircle size={12} /> Force Cancel
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Terminated</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search service registry by category, provider name, city..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleExportServices}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                    title="Export Services Report as CSV"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                {/* Service Cards Grid */}
                {filteredServices.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-medium">
                    No service listings registered match the query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((item) => (
                      <div key={item._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-200 transition-all">
                        <div className="p-6">
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                              {item.category_name}
                            </span>
                            <span className="text-slate-800 font-extrabold text-lg">${item.price_value}</span>
                          </div>
                          
                          <h3 className="font-bold text-slate-800 text-base mt-4 line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                              {item.provider_name ? item.provider_name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{item.provider_name || 'Service Provider'}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.city} • Rating: {item.average_rating || 5.0}★</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-4 border-t border-slate-100">
                          {/* Status badge row */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              item.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : item.status === 'pending_approval'
                                ? 'bg-amber-50 text-amber-700'
                                : item.status === 'rejected'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.status === 'pending_approval' ? 'Pending Approval'
                                : item.status === 'active' ? 'Active'
                                : item.status === 'rejected' ? 'Rejected'
                                : item.status || 'Unknown'}
                            </span>
                          </div>

                          {/* Rejection reason (if rejected) */}
                          {item.status === 'rejected' && item.rejection_reason && (
                            <p className="text-[10px] text-red-500 italic mb-3">
                              Reason: {item.rejection_reason}
                            </p>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            {item.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveService(item._id, item.title)}
                                  disabled={actionLoading}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectService(item._id, item.title)}
                                  disabled={actionLoading}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {item.status !== 'pending_approval' && (
                              <button
                                onClick={() => handleDeleteService(item._id, item.title)}
                                disabled={actionLoading}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-all border border-red-100 flex items-center gap-1.5 text-xs font-bold ml-auto"
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                {/* Search Bar & Add Button */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>

                {/* Categories Table List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                          <th className="py-4 px-6">Icon</th>
                          <th className="py-4 px-6">Category Name</th>
                          <th className="py-4 px-6">Description</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCategories.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                              No categories configured in the system.
                            </td>
                          </tr>
                        ) : (
                          filteredCategories.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                  {item.category_name ? item.category_name.substring(0, 2).toUpperCase() : 'C'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-bold text-slate-800">
                                {item.category_name}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate">
                                {item.description || 'No description provided'}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  item.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {item.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenCategoryModal(item)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl border border-blue-100 transition-all"
                                    title="Edit Category"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleCategoryStatus(item._id, item.is_active !== false)}
                                    disabled={actionLoading}
                                    className={`p-2 rounded-xl border transition-all text-xs font-bold ${
                                      item.is_active !== false
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                                    }`}
                                    title={item.is_active !== false ? 'Disable Category' : 'Enable Category'}
                                  >
                                    {item.is_active !== false ? <PowerOff size={14} /> : <Power size={14} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(item._id, item.category_name)}
                                    disabled={actionLoading}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl border border-rose-100 transition-all"
                                    title="Deactivate Category"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PENDING REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800">Pending Registration Reviews</h3>
                  <p className="text-xs text-slate-400 mt-1">Review, authorize or reject new User and Provider accounts.</p>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                        <th className="py-4 px-6">Name & Contact</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Details</th>
                        <th className="py-4 px-6">City</th>
                        <th className="py-4 px-6">Submitted At</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.account_status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                            No pending registration requests.
                          </td>
                        </tr>
                      ) : (
                        users.filter(u => u.account_status === 'pending').map((item) => {
                          const isProvider = item.role?.toLowerCase() === 'provider';
                          const regDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                          
                          return (
                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-bold text-slate-800">{item.full_name || 'No Name'}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.email}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.phone || 'No phone number'}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  isProvider ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
                                }`}>
                                  {item.role || 'User'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {isProvider ? (
                                  <div>
                                    <p className="font-medium">{item.provider_category || 'Home Services'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">${item.hourly_rate || 0}/hr • {item.experience || 0} yrs exp</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Customer account review</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {item.city || 'N/A'}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {regDate}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setSelectedRequest(item)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-sm"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleApproveUser(item)}
                                    disabled={actionLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-sm disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectingUser(item)}
                                    disabled={actionLoading}
                                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-sm disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── View Details Modal ── */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Registration Application Detail</h3>
                <p className="text-xs text-slate-400 mt-0.5">Auditing profile credentials for {selectedRequest.full_name}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-xl p-1"
              >
                &times;
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Account Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedRequest.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{selectedRequest.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{selectedRequest.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Role</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 uppercase tracking-wider">{selectedRequest.role || 'User'}</p>
                </div>
              </div>
              
              <hr className="border-slate-100" />
              
              {/* Address / Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">City</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{selectedRequest.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Address</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{selectedRequest.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">State / Pincode</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedRequest.state || 'N/A'} {selectedRequest.pincode ? `• ${selectedRequest.pincode}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registered At</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRequest.role?.toLowerCase() === 'provider' && (
                <>
                  <hr className="border-slate-100" />
                  
                  {/* Provider Exclusive details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Category</p>
                        <p className="text-sm font-bold text-indigo-700 mt-1">{selectedRequest.provider_category || 'Home Services'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hourly Rate</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">${selectedRequest.hourly_rate || 0}/hr</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Experience</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{selectedRequest.experience || 0} Years</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Skills / Specializations</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedRequest.skills && selectedRequest.skills.length > 0 ? (
                          selectedRequest.skills.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{s}</span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">None listed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Service Profile Description</p>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1 whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        {selectedRequest.description || 'No description provided.'}
                      </p>
                    </div>

                    {selectedRequest.availability && (
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Availability Schedule</p>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(selectedRequest.availability).map(([day, slots]) => (
                            <div key={day} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                              <p className="text-[10px] font-bold uppercase text-slate-400">{day.substring(0, 3)}</p>
                              <p className="text-xs font-bold text-slate-700 mt-1">
                                {slots && slots.length > 0 ? slots[0] : 'Closed'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification Documents Table */}
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Verification & Compliance Documents</p>
                      {!selectedRequest.verification_documents || selectedRequest.verification_documents.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No verification documents uploaded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedRequest.verification_documents.map((doc) => (
                            <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{doc.document_type}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[200px] mt-0.5">File: {doc.file_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    doc.status === 'approved' ? 'bg-green-50 text-green-700' :
                                    doc.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {doc.status}
                                  </span>
                                  <a
                                    href={adminService.viewDocumentUrl(selectedRequest._id, doc.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                                  >
                                    View File
                                  </a>
                                </div>
                                {doc.status === 'rejected' && doc.rejection_reason && (
                                  <p className="text-[10px] text-red-500 font-medium italic mt-1">
                                    Reason: {doc.rejection_reason}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateDocumentStatus(selectedRequest._id, doc.id, 'approved')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateDocumentStatus(selectedRequest._id, doc.id, 'rejected')}
                                  className="bg-red-50 hover:bg-red-105 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </>
              )}
            </div>
            
            {/* Footer actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setRejectingUser(selectedRequest);
                }}
                className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveUser(selectedRequest)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirmation Dialog ── */}
      {rejectingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Provide Rejection Reason</h3>
              <p className="text-xs text-slate-400 mt-0.5">Application for {rejectingUser.full_name}</p>
            </div>
            
            <form onSubmit={handleRejectUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectingUser(null); setRejectionReason(''); }}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {categoryForm.id ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {categoryFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {categoryFormError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter category name"
                  value={categoryForm.category_name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, category_name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Enter category description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Icon Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter icon name"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── USER DETAILS INSPECTION MODAL ── */}
      {selectedUserDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 md:p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedUserDetails(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shrink-0">
                {selectedUserDetails.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-900 truncate">{selectedUserDetails.full_name || 'User Profile'}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedUserDetails.role?.toLowerCase() === 'provider'
                      ? 'bg-indigo-50 text-indigo-700'
                      : selectedUserDetails.role?.toLowerCase() === 'admin'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-sky-50 text-sky-700'
                  }`}>
                    {selectedUserDetails.role || 'User'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedUserDetails.is_active !== false && selectedUserDetails.status !== 'suspended'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedUserDetails.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">User ID: {selectedUserDetails._id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Info</p>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {selectedUserDetails.email}</p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {selectedUserDetails.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location & Address</p>
                <div className="space-y-1 text-sm text-slate-700">
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {selectedUserDetails.city || 'No city'}, {selectedUserDetails.state || ''}</p>
                  <p className="text-xs text-slate-500">{selectedUserDetails.address || 'No street address provided'}</p>
                </div>
              </div>
            </div>

            {/* Provider details if provider */}
            {selectedUserDetails.role?.toLowerCase() === 'provider' && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-6">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Provider Business Specs</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Category</p>
                    <p className="text-sm font-extrabold text-slate-800 truncate">{selectedUserDetails.provider_category || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Hourly Rate</p>
                    <p className="text-sm font-extrabold text-blue-700">₹{selectedUserDetails.hourly_rate || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Experience</p>
                    <p className="text-sm font-extrabold text-slate-800">{selectedUserDetails.experience || 0} yrs</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Rating</p>
                    <p className="text-sm font-extrabold text-amber-600">⭐ {selectedUserDetails.average_rating || 5.0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity stats */}
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Bookings</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{selectedUserDetails.total_bookings ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Reviews</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{selectedUserDetails.total_reviews ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Services</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{selectedUserDetails.total_services ?? 0}</p>
              </div>
            </div>

            {/* Documents section */}
            {selectedUserDetails.verification_documents && selectedUserDetails.verification_documents.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Verification Documents</p>
                <div className="space-y-2">
                  {selectedUserDetails.verification_documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{doc.document_type}</p>
                        <p className="text-[11px] text-slate-400">{doc.file_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          doc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {doc.status || 'pending'}
                        </span>
                        <a
                          href={adminService.viewDocumentUrl(selectedUserDetails._id, doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition-colors"
                        >
                          View File
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
