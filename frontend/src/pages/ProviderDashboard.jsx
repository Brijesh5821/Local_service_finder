// Import React hooks for state management and side effects
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// Import useAuth context hook to access provider session information
import { useAuth } from '../context/AuthContext';
// Import providerService to query dashboard statistics, bookings, and services
import { providerService } from '../services/providerService';
// Import notificationService to mark notification alerts as read
import { notificationService } from '../services/notificationService';
// Import adminService to fetch active categories for service form
import { adminService } from '../services/adminService';
import { downloadCSV } from '../utils/csvExporter';
// Import Lucide icons for UI decoration
import {
  Bell, Briefcase, Calendar, Clock, Edit,
  Loader2, MapPin, Plus, RefreshCw, Trash2, X,
  CheckCircle, AlertCircle, Power, User, Download, Star
} from 'lucide-react';

// Define the static list of categories matching the database categories
const CATEGORIES = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Cleaning",
  "AC Repair", "Beautician", "Appliance Repair", "Home Tutor", "Mechanic",
  "Photographer", "Driver", "Gardener", "Cook", "Pest Control",
  "Laptop Repair", "Mobile Repair", "RO Water Purifier", "Interior Designer", "Packers & Movers"
];

// Helper component to render status badges with distinct colors
const StatusBadge = ({ status }) => {
  // Styles mapping for booking status
  const styles = {
    // Amber colors for pending status
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    // Blue colors for accepted status
    Accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
    // Green colors for completed status
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    // Red colors for cancelled status
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
    // Red colors for rejected status
    Rejected: 'bg-red-50 text-red-600 border border-red-200',
  };
  // Return styled span badge element
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

// Main ProviderDashboard page component
const ProviderDashboard = () => {
  // Extract provider session context variables
  const { user, logout, fetchProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  // Tab navigation selection state
  const [activeTab, setActiveTab] = useState(
    tabParam && ['overview', 'bookings', 'services', 'notifications'].includes(tabParam) ? tabParam : 'overview'
  );

  useEffect(() => {
    const currentTabParam = searchParams.get('tab');
    if (currentTabParam && ['overview', 'bookings', 'services', 'notifications'].includes(currentTabParam)) {
      setActiveTab(currentTabParam);
    }
  }, [searchParams]);

  // Statistics data object state
  const [stats, setStats] = useState({
    total_bookings: 0,
    pending_bookings: 0,
    accepted_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    total_earnings: 0.0
  });
  // Stats loading state
  const [statsLoading, setStatsLoading] = useState(false);

  // Bookings state variables
  const [bookings, setBookings] = useState([]);
  // Bookings loading state
  const [bookingsLoading, setBookingsLoading] = useState(false);
  // Bookings listing sub-tab state (pending, accepted, history)
  const [bookingFilter, setBookingFilter] = useState('pending');

  // Services state variables
  const [services, setServices] = useState([]);
  // Services loading state
  const [servicesLoading, setServicesLoading] = useState(false);

  // Notifications state variables
  const [notifications, setNotifications] = useState([]);
  // Notifications loading state
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Confirmation modal details state (reject / cancel / complete / accept)
  const [actionModal, setActionModal] = useState(null);
  // Reason input state for reject or cancel dialogs
  const [actionReason, setActionReason] = useState('');
  // Loading status flag for modal actions
  const [actionLoading, setActionLoading] = useState(false);

  // Service form modal details state (add / edit)
  const [serviceModal, setServiceModal] = useState(null);
  // Service form parameters state
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    category_name: '',
    price: '$$',
    price_value: '',
    city: '',
    status: 'active',
    availability: []
  });
  // Service modal API call loading status
  const [serviceFormLoading, setServiceFormLoading] = useState(false);
  // Service modal validation error string
  const [serviceFormError, setServiceFormError] = useState('');
  // Dynamic categories list fetched from admin API
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);

  // Callback handler to fetch dashboard stats
  const fetchStats = useCallback(async () => {
    // Enable loader
    setStatsLoading(true);
    // Execute GET statistics API call
    try {
      // Call service method
      const res = await providerService.getDashboardStats();
      // Set stats state variables
      if (res.success) setStats(res.stats);
    // Catch errors
    } catch (err) {
      // Log errors silently
      console.error(err.message);
    // Disable loader
    } finally {
      // Done loading
      setStatsLoading(false);
    }
  }, []);

  // Callback handler to fetch active categories from admin API
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminService.getPublicCategories();
      if (res.success && res.categories?.length > 0) {
        setDynamicCategories(res.categories.map(c => c.category_name));
      }
    } catch (err) {
      // Fall back to static list silently
    }
  }, []);

  // Callback handler to fetch bookings feed
  const fetchBookings = useCallback(async () => {
    // Enable loader
    setBookingsLoading(true);
    // Execute GET bookings API call
    try {
      // Call service method
      const res = await providerService.getBookings();
      // Set state list
      if (res.success) setBookings(res.bookings || []);
    // Catch errors
    } catch (err) {
      // Log errors
      console.error(err.message);
    // Disable loader
    } finally {
      // Done loading
      setBookingsLoading(false);
    }
  }, []);

  // Callback handler to fetch services list
  const fetchServices = useCallback(async () => {
    // Enable loader
    setServicesLoading(true);
    // Execute GET services API call
    try {
      // Call service method
      const res = await providerService.getServices();
      // Set state list
      if (res.success) setServices(res.services || []);
    // Catch errors
    } catch (err) {
      // Log errors
      console.error(err.message);
    // Disable loader
    } finally {
      // Done loading
      setServicesLoading(false);
    }
  }, []);

  // Callback handler to fetch notifications feed
  const fetchNotifications = useCallback(async () => {
    // Enable loader
    setNotificationsLoading(true);
    // Execute GET notifications API call
    try {
      // Call service method
      const res = await providerService.getNotifications();
      // Set state list
      if (res.success) setNotifications(res.notifications || []);
    // Catch errors
    } catch (err) {
      // Log errors
      console.error(err.message);
    // Disable loader
    } finally {
      // Done loading
      setNotificationsLoading(false);
    }
  }, []);

  // UseEffect hook to fetch all database records on page load
  useEffect(() => {
    // Fetch user profile
    if (fetchProfile) fetchProfile();
    // Fetch stats
    fetchStats();
    // Fetch bookings
    fetchBookings();
    // Fetch services
    fetchServices();
    // Fetch notifications
    fetchNotifications();
    // Fetch dynamic categories from admin API
    fetchCategories();
  }, [fetchProfile, fetchStats, fetchBookings, fetchServices, fetchNotifications, fetchCategories]);

  const handleExportBookings = () => {
    const headers = ['Booking ID', 'Customer Name', 'Customer Phone', 'Service Name', 'Booking Date', 'Time Slot', 'Address', 'Amount (₹)', 'Booking Status', 'Payment Status'];
    const rows = filteredBookings.map(b => [
      b._id,
      b.customer_name || '',
      b.customer_phone || '',
      b.service_name || '',
      b.booking_date || '',
      b.booking_time || b.time_slot || '',
      b.address || '',
      b.total_amount || b.amount || 0,
      b.booking_status || '',
      b.payment_status || ''
    ]);
    downloadCSV('provider_bookings_report', headers, rows);
  };

  // Method to refresh all page details
  const handleRefreshAll = () => {
    // Refresh user profile
    if (fetchProfile) fetchProfile();
    // Refresh stats
    fetchStats();
    // Refresh bookings
    fetchBookings();
    // Refresh services
    fetchServices();
    // Refresh notifications
    fetchNotifications();
  };

  // Method to trigger action updates (Accept, Reject, Cancel, Complete)
  const handleBookingActionSubmit = async (e) => {
    // Prevent default form behavior
    e.preventDefault();
    // Set loader to true
    setActionLoading(true);
    // Identify booking and target action type
    const { booking, type } = actionModal;
    // Try block to call status update endpoints
    try {
      // Run block conditional on action type
      if (type === 'accept') {
        // Accept booking via service call
        await providerService.acceptBooking(booking._id);
      } else if (type === 'reject') {
        // Reject booking passing reason string
        await providerService.rejectBooking(booking._id, actionReason);
      } else if (type === 'cancel') {
        // Cancel booking passing reason string
        await providerService.cancelBooking(booking._id, actionReason);
      } else if (type === 'complete') {
        // Complete booking
        await providerService.completeBooking(booking._id);
      } else if (type === 'reschedule-accept') {
        await providerService.acceptRescheduleBooking(booking._id);
      } else if (type === 'reschedule-reject') {
        await providerService.rejectRescheduleBooking(booking._id);
      }
      // Reset action modal states
      setActionModal(null);
      // Reset reason text box
      setActionReason('');
      // Refresh statistics counts
      fetchStats();
      // Refresh booking table
      fetchBookings();
      // Refresh notifications list
      fetchNotifications();
    // Catch status change exceptions
    } catch (err) {
      // Trigger notification alert
      alert(err.message || 'Operation failed. Please try again.');
    // Enable controls
    } finally {
      // Done loader
      setActionLoading(false);
    }
  };

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleToggleDayAvailability = (dayName) => {
    setServiceForm(prev => {
      const currentAvail = Array.isArray(prev.availability) ? prev.availability : [];
      const exists = currentAvail.some(d => d.day === dayName);
      let updated;
      if (exists) {
        updated = currentAvail.filter(d => d.day !== dayName);
      } else {
        updated = [...currentAvail, { day: dayName, slots: [{ startTime: "09:00", endTime: "17:00" }] }];
      }
      return { ...prev, availability: updated };
    });
  };

  const handleAddSlotToDay = (dayName) => {
    setServiceForm(prev => {
      const currentAvail = Array.isArray(prev.availability) ? prev.availability : [];
      const updated = currentAvail.map(d => {
        if (d.day === dayName) {
          const lastSlot = d.slots && d.slots.length > 0 ? d.slots[d.slots.length - 1] : { startTime: "09:00", endTime: "17:00" };
          return {
            ...d,
            slots: [...(d.slots || []), { startTime: lastSlot.endTime || "09:00", endTime: "18:00" }]
          };
        }
        return d;
      });
      return { ...prev, availability: updated };
    });
  };

  const handleRemoveSlotFromDay = (dayName, slotIndex) => {
    setServiceForm(prev => {
      const currentAvail = Array.isArray(prev.availability) ? prev.availability : [];
      const updated = currentAvail.map(d => {
        if (d.day === dayName) {
          const newSlots = d.slots.filter((_, idx) => idx !== slotIndex);
          return { ...d, slots: newSlots };
        }
        return d;
      }).filter(d => d.slots.length > 0);
      return { ...prev, availability: updated };
    });
  };

  const handleUpdateSlotTime = (dayName, slotIndex, field, value) => {
    setServiceForm(prev => {
      const currentAvail = Array.isArray(prev.availability) ? prev.availability : [];
      const updated = currentAvail.map(d => {
        if (d.day === dayName) {
          const newSlots = d.slots.map((s, idx) => {
            if (idx === slotIndex) {
              return { ...s, [field]: value };
            }
            return s;
          });
          return { ...d, slots: newSlots };
        }
        return d;
      });
      return { ...prev, availability: updated };
    });
  };

  // Method to trigger CRUD services updates
  const handleServiceFormSubmit = async (e) => {
    // Prevent default submit reload
    e.preventDefault();
    // Clear validation error text
    setServiceFormError('');

    // Client-side validations
    const titleCleaned = (serviceForm.title || '').trim();
    if (!titleCleaned) {
      setServiceFormError('Service title is required.');
      return;
    }
    if (titleCleaned.length < 3) {
      setServiceFormError('Service title must be at least 3 characters long.');
      return;
    }

    const descCleaned = (serviceForm.description || '').trim();
    if (!descCleaned) {
      setServiceFormError('Service description is required.');
      return;
    }
    if (descCleaned.length < 10) {
      setServiceFormError('Service description must be at least 10 characters long.');
      return;
    }

    if (!serviceForm.category_name) {
      setServiceFormError('Please select a category.');
      return;
    }
    if (!serviceForm.price_value || isNaN(Number(serviceForm.price_value)) || Number(serviceForm.price_value) <= 0) {
      setServiceFormError('Please enter a valid numeric price value.');
      return;
    }

    // Availability validation
    if (!serviceForm.availability || !Array.isArray(serviceForm.availability) || serviceForm.availability.length === 0) {
      setServiceFormError('Please select at least one working day and time slot for service availability.');
      return;
    }

    for (const dayObj of serviceForm.availability) {
      if (!dayObj.slots || dayObj.slots.length === 0) {
        setServiceFormError(`Please add at least one time slot for ${dayObj.day}.`);
        return;
      }
      const sortedSlots = [];
      for (let i = 0; i < dayObj.slots.length; i++) {
        const slot = dayObj.slots[i];
        if (!slot.startTime || !slot.endTime) {
          setServiceFormError(`Please specify both start time and end time for slot ${i + 1} on ${dayObj.day}.`);
          return;
        }
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        if (endMins <= startMins) {
          setServiceFormError(`End time must be later than start time for slot ${i + 1} on ${dayObj.day}.`);
          return;
        }

        // Check for overlaps on the same day
        for (const existing of sortedSlots) {
          if (startMins < existing.endMins && endMins > existing.startMins) {
            setServiceFormError(`Time slots overlap on ${dayObj.day} (${slot.startTime}–${slot.endTime}). Please adjust slot times.`);
            return;
          }
        }
        sortedSlots.push({ startMins, endMins });
      }
    }

    // Set service loader to true
    setServiceFormLoading(true);
    // Identify service modal mode
    const { type, service } = serviceModal;
    // Try block to call API endpoints
    try {
      // Build form payload object
      const payload = {
        title: serviceForm.title,
        description: serviceForm.description,
        category_name: serviceForm.category_name,
        price: serviceForm.price,
        price_value: parseFloat(serviceForm.price_value),
        city: serviceForm.city || undefined,
        status: serviceForm.status,
        availability: serviceForm.availability
      };

      // Call API based on add or edit mode
      if (type === 'add') {
        // Execute create service call
        await providerService.createService(payload);
      } else if (type === 'edit') {
        // Execute update service call passing service ID
        await providerService.updateService(service.id, payload);
      }

      // Close modal
      setServiceModal(null);
      // Refresh services listing
      fetchServices();
    // Catch api errors
    } catch (err) {
      // Set error message
      setServiceFormError(err.message || 'Failed to save service.');
    // Enable controls
    } finally {
      // Done loader
      setServiceFormLoading(false);
    }
  };

  // Method to handle service deleting
  const handleServiceDelete = async (serviceId) => {
    // Confirm delete intent
    if (!window.confirm('Are you sure you want to delete this service listing?')) return;
    // Try block to execute DELETE endpoint
    try {
      // Execute api delete call
      await providerService.deleteService(serviceId);
      // Refresh services listing
      fetchServices();
    // Catch exceptions
    } catch (err) {
      // Trigger error alert
      alert(err.message || 'Failed to delete service.');
    }
  };

  // Method to toggle service status directly
  const handleToggleServiceStatus = async (service) => {
    // Determine new status value
    const nextStatus = service.status === 'active' ? 'inactive' : 'active';
    // Try block to update status
    try {
      // Call update endpoint setting new status
      await providerService.updateService(service.id, { status: nextStatus });
      // Refresh listing
      fetchServices();
    // Catch errors
    } catch (err) {
      // Alert error
      alert(err.message || 'Failed to update service status.');
    }
  };

  // Helper method to build user initials
  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() || 'P');

  // Filter bookings based on active booking filter sub-tab
  const filteredBookings = bookings.filter(b => {
    // If pending tab is active, filter bookings with status Pending
    if (bookingFilter === 'pending') return b.booking_status === 'Pending';
    // If accepted tab is active, filter bookings with status Accepted
    if (bookingFilter === 'accepted') return b.booking_status === 'Accepted';
    // Else filter history (Completed, Cancelled, Rejected)
    return ['Completed', 'Cancelled', 'Rejected'].includes(b.booking_status);
  });

  // Calculate unread notification badges
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  return (
    // Outer page wrapper with background padding
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Welcome Section ── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            {/* Round avatar display */}
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {initials}
            </div>
            <div>
              {/* Service provider portal tag */}
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Service Provider Portal
              </span>
              {/* Provider name header */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                Welcome, {user?.full_name || user?.email || 'Provider'}
              </h1>
              {/* Bio brief descriptor */}
              <p className="text-sm text-slate-500 mt-1">
                Manage your services, update incoming customer bookings, and track your total earnings.
              </p>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* Refresh button */}
            <button
              onClick={handleRefreshAll}
              className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
              title="Refresh all data"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {/* Sign Out button */}
            <button
              onClick={logout}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Main Tab Navigation Header ── */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 scrollbar-none overflow-x-auto">
          {[
            // Overview panel navigation object
            { id: 'overview', label: 'Overview' },
            // Bookings list panel navigation object
            { id: 'bookings', label: 'Bookings List', badge: bookings.filter(b => b.booking_status === 'Pending').length },
            // My services panel navigation object
            { id: 'services', label: 'My Services' },
            // Notifications panel navigation object
            { id: 'notifications', label: 'Notifications', badge: unreadNotificationsCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all flex items-center gap-2 flex-shrink-0
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              {/* Check if tab requires count badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB PANEL ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Booking Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: 'Total Earnings', val: `₹{Number(stats?.total_earnings || 0).toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100' },
                { label: 'Total Bookings', val: stats?.total_bookings || 0, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-100' },
                { label: 'Pending Bookings', val: stats?.pending_bookings || 0, color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100' },
                { label: 'Accepted Bookings', val: stats?.accepted_bookings || 0, color: 'text-blue-600', bg: 'bg-blue-50/50 border-blue-100' },
                { label: 'Completed Bookings', val: stats?.completed_bookings || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100' },
                { label: 'Cancelled Bookings', val: stats?.cancelled_bookings || 0, color: 'text-red-500', bg: 'bg-red-50/50 border-red-100' },
              ].map((card, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${card.bg} flex flex-col justify-between shadow-sm`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <p className={`text-2xl font-extrabold mt-3 ${card.color}`}>{card.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Provider Profile Summary Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" /> Profile Summary
                  </h3>
                  <a href="/profile" className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline">
                    Edit Profile &rarr;
                  </a>
                </div>
                {/* Profile fields content grid */}
                <div className="space-y-4">
                  {/* Overall Rating */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Overall Rating</span>
                    {user?.average_rating !== undefined && user?.average_rating !== null ? (
                      <div className="flex items-center gap-1.5 text-sm font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl w-fit border border-amber-200">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{Number(user.average_rating).toFixed(1)}</span>
                        <span className="text-xs font-normal text-amber-600">
                          ({user.total_reviews || 0} {user.total_reviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No reviews yet</span>
                    )}
                  </div>

                  {/* Category Field */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Category</span>
                    <span className="font-bold text-slate-800 text-sm">{user?.provider_category || 'Not Configured'}</span>
                  </div>

                  {/* Experience Field */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Experience</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {user?.experience !== null && user?.experience !== undefined && user?.experience !== '' ? `${user.experience} years` : 'Not Configured'}
                    </span>
                  </div>

                  {/* Hourly Rate Field */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Hourly Rate</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      {user?.hourly_rate !== null && user?.hourly_rate !== undefined && user?.hourly_rate !== '' ? `₹${user.hourly_rate}/hr` : 'Not Configured'}
                    </span>
                  </div>

                  {/* City Location Field */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Service City</span>
                    <span className="font-bold text-slate-800 text-sm">{user?.city || 'Not Configured'}</span>
                  </div>

                  {/* Availability Slots display */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase mb-2">Availability Slots</span>
                    {user?.availability && Object.keys(user.availability).length > 0 ? (
                      <div className="space-y-1.5 mt-1">
                        {Object.entries(user.availability).map(([day, slots]) => {
                          let formattedSlots = null;
                          if (Array.isArray(slots) && slots.length > 0) {
                            formattedSlots = slots.join(', ');
                          } else if (typeof slots === 'string' && slots.trim()) {
                            formattedSlots = slots;
                          } else if (slots && typeof slots === 'object') {
                            if (slots.available !== false && slots.start_time && slots.end_time) {
                              formattedSlots = `${slots.start_time} - ${slots.end_time}`;
                            }
                          }
                          if (!formattedSlots) return null;
                          return (
                            <div key={day} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs">
                              <span className="font-bold text-slate-700 capitalize">{day}</span>
                              <span className="font-semibold text-blue-600">{formattedSlots}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No weekly slots configured</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Incoming Pending Bookings Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" /> Incoming Requests
                  </h3>
                  <button
                    onClick={() => { setActiveTab('bookings'); setBookingFilter('pending'); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>
                {/* Pending list */}
                {bookings.filter(b => b.booking_status === 'Pending').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <CheckCircle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No pending requests right now</p>
                    <p className="text-xs">Incoming service requests will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.filter(b => b.booking_status === 'Pending').slice(0, 3).map(booking => (
                      <div key={booking._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{booking.service_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Customer: {booking.customer_name} ({booking.customer_phone})</p>
                          <div className="flex gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {booking.booking_date}</span>
                            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {booking.booking_time}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActionModal({ type: 'accept', booking })}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setActionModal({ type: 'reject', booking })}
                            className="border border-slate-200 bg-white hover:bg-slate-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
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
          </div>
        )}

        {/* ── BOOKINGS LIST PANEL ── */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            {/* Filter sub-navigation */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <div className="flex gap-2">
                {[
                  { id: 'pending', label: 'Pending Requests' },
                  { id: 'accepted', label: 'Accepted Jobs' },
                  { id: 'history', label: 'History' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setBookingFilter(filter.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                      ${bookingFilter === filter.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={handleExportBookings}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                  title="Export Bookings & Revenue Report as CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Bookings Loader */}
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Calendar className="h-14 w-14 text-slate-350" />
                <p className="text-lg font-semibold text-slate-500 mt-2">No bookings matching filter</p>
                <p className="text-sm">Incoming customer booking logs will register in this log tab.</p>
              </div>
            ) : (
              /* Bookings list card grid */
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="border border-slate-150 p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        {/* Service name & status */}
                        <div className="flex items-center gap-3">
                          <h4 className="font-extrabold text-slate-900 text-lg">{booking.service_name}</h4>
                          <StatusBadge status={booking.booking_status} />
                        </div>
                        {/* Customer details */}
                        <p className="text-sm font-semibold text-slate-700 mt-1">
                          Customer: <span className="font-bold text-slate-900">{booking.customer_name}</span> | Phone: {booking.customer_phone}
                        </p>
                        {/* Address */}
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          {booking.booking_address || 'No address specified'}
                        </p>
                        {/* Notes */}
                        {booking.notes && (
                          <div className="mt-2 text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600">
                            <span className="font-semibold text-slate-800">Client Note:</span> {booking.notes}
                          </div>
                        )}
                        {/* Reschedule Requested block */}
                        {booking.reschedule_requested && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" /> Reschedule Requested by Client
                            </p>
                            <p className="text-xs text-slate-750 mt-1 font-medium">
                              Proposed: <span className="font-bold">{booking.reschedule_date}</span> @ <span className="font-bold">{booking.reschedule_time}</span>
                            </p>
                            {booking.reschedule_reason && (
                              <p className="text-xs text-slate-600 italic mt-1 font-medium">
                                Reason: "{booking.reschedule_reason}"
                              </p>
                            )}
                            <div className="flex gap-2 mt-2.5">
                              <button
                                onClick={() => setActionModal({ type: 'reschedule-accept', booking })}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm"
                              >
                                Accept Reschedule
                              </button>
                              <button
                                onClick={() => setActionModal({ type: 'reschedule-reject', booking })}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-red-650 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Reject / Cancel Reasons */}
                        {booking.rejection_reason && (
                          <div className="mt-2 text-xs bg-red-50 border border-red-150 p-2.5 rounded-lg text-red-700">
                            <span className="font-bold">Rejection Reason:</span> {booking.rejection_reason}
                          </div>
                        )}
                        {booking.cancellation_reason && (
                          <div className="mt-2 text-xs bg-red-50 border border-red-150 p-2.5 rounded-lg text-red-700">
                            <span className="font-bold">Cancellation Reason:</span> {booking.cancellation_reason}
                          </div>
                        )}
                      </div>

                      {/* Right column: Dates, rates & buttons */}
                      <div className="flex flex-col items-start md:items-end justify-between gap-4 shrink-0">
                        <div className="text-left md:text-right">
                          <p className="text-sm font-extrabold text-blue-700">₹{booking.total_amount}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{booking.booking_date} @ {booking.booking_time}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Booking Context Action buttons */}
                        <div className="flex gap-2">
                          {booking.booking_status === 'Pending' && (
                            <>
                              <button
                                onClick={() => setActionModal({ type: 'accept', booking })}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                              >
                                Accept Booking
                              </button>
                              <button
                                onClick={() => setActionModal({ type: 'reject', booking })}
                                className="border border-slate-200 bg-white hover:bg-slate-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {booking.booking_status === 'Accepted' && (
                            <>
                              <button
                                onClick={() => setActionModal({ type: 'complete', booking })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                              >
                                Complete Service
                              </button>
                              <button
                                onClick={() => setActionModal({ type: 'cancel', booking })}
                                className="border border-slate-200 bg-white hover:bg-slate-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                              >
                                Cancel Booking
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY SERVICES PANEL ── */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" /> Configured Services ({services.length})
              </h3>
              {/* Add service button trigger */}
              <button
                onClick={() => {
                  // Set initial empty form data
                  setServiceForm({
                    title: '',
                    description: '',
                    category_name: CATEGORIES[0],
                    price: '$$',
                    price_value: '',
                    city: user?.city || '',
                    status: 'active'
                  });
                  // Clear form error text
                  setServiceFormError('');
                  // Open modal in Add mode
                  setServiceModal({ type: 'add', service: null });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Service
              </button>
            </div>

            {/* Services loader spinner */}
            {servicesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Briefcase className="h-14 w-14 text-slate-350" />
                <p className="text-lg font-semibold text-slate-500 mt-2">No service offerings listed yet</p>
                <p className="text-sm">Click "Add Service" to register an active service category for clients.</p>
              </div>
            ) : (
              /* Services listing grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="border border-slate-150 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      {/* Service status toggle & Title */}
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-extrabold text-slate-900 text-md truncate" title={service.title}>
                          {service.title}
                        </h4>
                      {/* Status tag badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex-shrink-0
                          ${service.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : service.status === 'pending_approval'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : service.status === 'rejected'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {service.status === 'pending_approval' ? 'Pending' : service.status}
                        </span>
                      </div>
                      {/* Service Category */}
                      <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2">
                        {service.category_name}
                      </span>
                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-3 line-clamp-3">{service.description}</p>
                      {/* Rejection reason block */}
                      {service.status === 'rejected' && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-0.5">Rejected by Admin</p>
                          {service.rejection_reason && (
                            <p className="text-[11px] text-red-600 italic">{service.rejection_reason}</p>
                          )}
                        </div>
                      )}
                      {/* Pending notice */}
                      {service.status === 'pending_approval' && (
                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] text-amber-700">⏳ Awaiting admin review before becoming publicly visible.</p>
                        </div>
                      )}
                      {/* Meta city location */}
                      {service.city && (
                        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {service.city}
                        </p>
                      )}
                      {/* Service Availability summary */}
                      {service.availability && Array.isArray(service.availability) && service.availability.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Availability</span>
                          <div className="flex flex-wrap gap-1">
                            {service.availability.map((d) => (
                              <span key={d.day} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                                {d.day.slice(0, 3)}: {d.slots ? d.slots.map(s => `${s.startTime || s.start_time}-${s.endTime || s.end_time}`).join(', ') : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between items-center">
                      <div>
                        {/* Price tier and value */}
                        <p className="text-xs text-slate-400 font-semibold uppercase">Hourly rate</p>
                        <p className="text-blue-700 font-extrabold text-md">₹{service.price_value} <span className="text-slate-400 text-[10px] font-normal">({service.price})</span></p>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {/* Active status toggler */}
                        <button
                          onClick={() => handleToggleServiceStatus(service)}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"
                          title={service.status === 'active' ? 'Deactivate service' : 'Activate service'}
                        >
                          <Power className={`h-4 w-4 ${service.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </button>
                        {/* Edit button */}
                        <button
                          onClick={() => {
                            // Populate form data
                            setServiceForm({
                              title: service.title,
                              description: service.description,
                              category_name: service.category_name,
                              price: service.price,
                              price_value: service.price_value,
                              city: service.city || '',
                              status: service.status,
                              availability: service.availability || []
                            });
                            // Clear form errors
                            setServiceFormError('');
                            // Open modal in Edit mode
                            setServiceModal({ type: 'edit', service });
                          }}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Service Details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleServiceDelete(service.id)}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-red-500 rounded-lg transition-colors"
                          title="Delete Service listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS PANEL ── */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" /> Notifications Feed
              </h3>
              <button
                onClick={fetchNotifications}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            {/* Notifications loading */}
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Bell className="h-14 w-14 text-slate-350" />
                <p className="text-lg font-semibold text-slate-500 mt-2">No provider notifications yet</p>
                <p className="text-sm">Status alerts will registers here when customer actions complete.</p>
              </div>
            ) : (
              /* Notifications feed list */
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      if (!notif.is_read) {
                        notificationService.markAsRead(notif._id).then(() => fetchNotifications());
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      notif.is_read
                        ? 'bg-white border-slate-100 shadow-sm opacity-75'
                        : 'bg-blue-50/20 border-blue-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</h4>
                          {!notif.is_read && <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">New</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 mt-1.5">
                          <span>Booking ID: <span className="font-mono">{notif.booking_id}</span></span>
                          <span>•</span>
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── ACTION CONFIRMATION MODAL ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Modal Card */}
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1 bg-blue-600" />
            <form onSubmit={handleBookingActionSubmit} className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-900 text-lg capitalize">
                  {actionModal.type === 'accept' && 'Accept Booking'}
                  {actionModal.type === 'reject' && 'Reject Booking'}
                  {actionModal.type === 'cancel' && 'Cancel Booking'}
                  {actionModal.type === 'complete' && 'Complete Service'}
                  {actionModal.type === 'reschedule-accept' && 'Approve Rescheduling'}
                  {actionModal.type === 'reschedule-reject' && 'Reject Rescheduling'}
                </h3>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => { setActionModal(null); setActionReason(''); }}
                  className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body message details */}
              <div className="space-y-4 mb-6">
                <p className="text-sm text-slate-600">
                  {actionModal.type === 'accept' && 'Are you sure you want to accept this incoming booking? You will coordinate details directly with the customer.'}
                  {actionModal.type === 'reject' && 'Please provide a brief reason for rejecting this booking request. This description will be shared with the customer.'}
                  {actionModal.type === 'cancel' && 'Are you sure you want to cancel this accepted booking? Please provide a reason to notify the client.'}
                  {actionModal.type === 'complete' && 'Are you sure the service has been successfully completed? Total client earnings will compile to your payout log.'}
                  {actionModal.type === 'reschedule-accept' && 'Are you sure you want to approve this customer rescheduling request? The booking date and time will be officially updated.'}
                  {actionModal.type === 'reschedule-reject' && 'Are you sure you want to reject this rescheduling request? The booking will remain at its current scheduled time.'}
                </p>

                {/* Reason text fields for Reject and Cancel dialogs */}
                {['reject', 'cancel'].includes(actionModal.type) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Rejection Reason</label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Unavailable at this time slot..."
                      rows="3"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons layout */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setActionModal(null); setActionReason(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1 shadow-sm
                    ${actionModal.type === 'accept' && 'bg-blue-600 hover:bg-blue-700'}
                    ${actionModal.type === 'reject' && 'bg-red-600 hover:bg-red-700'}
                    ${actionModal.type === 'cancel' && 'bg-red-600 hover:bg-red-700'}
                    ${actionModal.type === 'complete' && 'bg-emerald-600 hover:bg-emerald-700'}
                    ${actionModal.type === 'reschedule-accept' && 'bg-blue-600 hover:bg-blue-700'}
                    ${actionModal.type === 'reschedule-reject' && 'bg-red-600 hover:bg-red-700'}`}
                >
                  {actionLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Confirm Action'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT SERVICE MODAL ── */}
      {serviceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Modal Card */}
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1 bg-blue-600" />
            <form onSubmit={handleServiceFormSubmit} className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {serviceModal.type === 'add' ? 'Add New Service Listing' : 'Edit Service details'}
                </h3>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setServiceModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Validation Error Message */}
              {serviceFormError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-700">{serviceFormError}</span>
                </div>
              )}

              {/* Form fields grid wrapper */}
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Service Title</label>
                  <input
                    type="text"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter service name"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Category</label>
                  <select
                    value={serviceForm.category_name}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, category_name: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select service category</option>
                    {dynamicCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price configurations grid layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price Tier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Price Tier</label>
                    <select
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="$">$ (Low-cost)</option>
                      <option value="$$">$$ (Average)</option>
                      <option value="$$$">$$$ (Premium)</option>
                    </select>
                  </div>
                  {/* Price Numeric Value */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      value={serviceForm.price_value}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, price_value: e.target.value }))}
                      placeholder="Enter price"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* City Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Service Location</label>
                  <input
                    type="text"
                    value={serviceForm.city}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter service location"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Service Description</label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your service"
                    rows="3"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Service Availability Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1 uppercase tracking-wider">
                    Service Availability
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Configure the days and time slots when clients can book this service.
                  </p>

                  {/* Day selection buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {WEEKDAYS.map((dayName) => {
                      const isSelected = (serviceForm.availability || []).some(d => d.day === dayName);
                      return (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => handleToggleDayAvailability(dayName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {dayName.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Days Time Slots */}
                  {(!serviceForm.availability || serviceForm.availability.length === 0) ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                      Select working days above to configure booking time slots.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {WEEKDAYS.filter(dayName => (serviceForm.availability || []).some(d => d.day === dayName)).map(dayName => {
                        const dayObj = serviceForm.availability.find(d => d.day === dayName);
                        return (
                          <div key={dayName} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                                {dayName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddSlotToDay(dayName)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
                              >
                                + Add Time Slot
                              </button>
                            </div>

                            {/* Slots list */}
                            <div className="space-y-2">
                              {(dayObj.slots || []).map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl text-xs">
                                  <span className="text-[10px] font-bold text-slate-400">Slot {idx + 1}:</span>
                                  <input
                                    type="time"
                                    value={slot.startTime || "09:00"}
                                    onChange={(e) => handleUpdateSlotTime(dayName, idx, 'startTime', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 bg-slate-50 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-slate-400 font-bold">to</span>
                                  <input
                                    type="time"
                                    value={slot.endTime || "17:00"}
                                    onChange={(e) => handleUpdateSlotTime(dayName, idx, 'endTime', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 bg-slate-50 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {dayObj.slots.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlotFromDay(dayName, idx)}
                                      className="ml-auto text-red-500 hover:text-red-700 text-[11px] font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={serviceFormLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                >
                  {serviceFormLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Save Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Export Dashboard component as default
export default ProviderDashboard;
