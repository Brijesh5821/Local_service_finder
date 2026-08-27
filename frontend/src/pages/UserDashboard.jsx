import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { providerService } from '../services/providerService';
import { bookingService } from '../services/bookingService';
// Import notification service to fetch user updates
import { notificationService } from '../services/notificationService';
import { reviewService } from '../services/reviewService';
import BookingModal from '../components/BookingModal';
import { downloadCSV } from '../utils/csvExporter';
import {
  Search, Star, MapPin, Clock, ChevronDown, ChevronUp,
  Briefcase, Calendar, X, AlertCircle, Loader2, RefreshCw,
  User, Wrench, Home, Zap, Scissors, Truck, Filter, Bell, Download
} from 'lucide-react';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Plumber', value: 'Plumber', icon: <Wrench className="h-4 w-4" /> },
  { label: 'Electrician', value: 'Electrician', icon: <Zap className="h-4 w-4" /> },
  { label: 'Cleaning', value: 'Cleaning', icon: <Home className="h-4 w-4" /> },
  { label: 'Carpenter', value: 'Carpenter', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Salon', value: 'Salon', icon: <Scissors className="h-4 w-4" /> },
  { label: 'Shifting', value: 'Shifting', icon: <Truck className="h-4 w-4" /> },
];

const StatusBadge = ({ status }) => {
  const styles = {
    Pending:   'bg-amber-50 text-amber-700 border border-amber-200',
    Accepted:  'bg-green-50 text-green-700 border border-green-200',
    Confirmed: 'bg-green-50 text-green-700 border border-green-200',
    Completed: 'bg-blue-50 text-blue-700 border border-blue-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
    Rejected:  'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};


const ProviderCard = ({ provider, onBook }) => {
  const initials = provider.full_name
    ? provider.full_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const rating = provider.average_rating ? Number(provider.average_rating).toFixed(1) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Card top */}
      <div className="p-5 flex-1">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {provider.profile_image ? (
              <img
                src={provider.profile_image}
                alt={provider.full_name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                {initials}
              </div>
            )}
          </div>
          {/* Name / category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{provider.full_name}</h3>
            {provider.provider_category && (
              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1">
                {provider.provider_category}
              </span>
            )}
          </div>
          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-sm font-bold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating}
            </div>
          )}
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-slate-500 text-sm mt-3 line-clamp-2">{provider.description}</p>
        )}

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {provider.experience && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              {provider.experience} yrs exp
            </span>
          )}
          {provider.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              {provider.city}
            </span>
          )}
          {provider.distance !== undefined && (
            <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
              <MapPin className="h-3.5 w-3.5 text-blue-500 fill-blue-100" />
              {provider.distance} km away
            </span>
          )}
          {provider.availability !== undefined && (
            <span className={`flex items-center gap-1 font-semibold ${provider.availability ? 'text-green-600' : 'text-slate-400'}`}>
              <Clock className="h-3.5 w-3.5" />
              {provider.availability ? 'Available' : 'Unavailable'}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          {provider.hourly_rate ? (
            <span className="text-blue-700 font-bold text-lg">₹{provider.hourly_rate}
              <span className="text-slate-400 font-normal text-xs">/hr</span>
            </span>
          ) : (
            <span className="text-slate-400 text-sm">Rate on request</span>
          )}
        </div>
        <button
          onClick={() => onBook(provider)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

const MapModal = ({ onClose, onSelect, initialLat, initialLng }) => {
  const [coords, setCoords] = useState({
    lat: initialLat || 23.0225, // Ahmedabad defaults
    lng: initialLng || 72.5714
  });

  useEffect(() => {
    const mapElement = document.getElementById('map-picker');
    if (!mapElement || !window.L) return;

    const map = window.L.map('map-picker').setView([coords.lat, coords.lng], 12);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = window.L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setCoords({ lat: position.lat, lng: position.lng });
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat, lng });
    });

    // Make sure map updates sizes correctly inside absolute modals
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Select Location Coordinates</h3>
        <p className="text-sm text-slate-500 mb-4">Click anywhere on the map or drag the marker to target your search address.</p>
        
        <div id="map-picker" className="w-full h-80 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden mb-5 z-0" />
        
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl truncate">
            Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all">
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(coords.lat, coords.lng);
                onClose();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              Select Position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const { user } = useAuth();

  // Providers state
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState('');

  // Geolocation Search States
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Sorting & Pagination States
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(6);

  // Search & Filter state
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availabilityDay, setAvailabilityDay] = useState('');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // Bookings reschedule states
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  // Booking modal
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('providers');

  // State to hold user notifications list
  const [notifications, setNotifications] = useState([]);
  // Loading state for notifications fetch operation
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  // Error message string for notifications fetch
  const [notificationsError, setNotificationsError] = useState('');

  // Reviews state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleExportMyBookings = () => {
    const headers = ['Booking ID', 'Provider Name', 'Provider Category', 'Booking Date', 'Booking Time', 'Address', 'Total Amount (₹)', 'Booking Status'];
    const rows = bookings.map(b => [
      b._id,
      b.provider_name || '',
      b.provider_category || '',
      b.booking_date || '',
      b.booking_time || '',
      b.booking_address || b.address || '',
      b.total_amount || 0,
      b.booking_status || ''
    ]);
    downloadCSV('my_booking_history', headers, rows);
  };

  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewText('');
    setReviewError('');
    setIsReviewModalOpen(true);
  };

  const handleSubmittingReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewSubmitLoading(true);
    setReviewError('');
    try {
      await reviewService.createReview({
        booking_id: reviewBooking._id,
        rating: reviewRating,
        review_text: reviewText
      });
      setIsReviewModalOpen(false);
      fetchBookings();
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const fetchProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError('');
    try {
      const filters = {};
      if (searchName) filters.name = searchName;
      if (selectedCategory) filters.category = selectedCategory;
      if (filterCity) filters.city = filterCity;
      if (maxPrice) filters.max_price = parseFloat(maxPrice);
      if (minRating) filters.min_rating = parseFloat(minRating);
      if (availabilityDay) filters.availability = availabilityDay;
      if (userLat !== null) filters.lat = userLat;
      if (userLng !== null) filters.lng = userLng;
      if (userLat !== null && userLng !== null) filters.radius = searchRadius;
      if (sortBy) filters.sort_by = sortBy;
      filters.page = currentPage;
      filters.limit = itemsPerPage;

      const res = await providerService.getProviders(filters);
      setProviders(res.providers || []);
      setTotalCount(res.total_count || 0);
    } catch (err) {
      setProvidersError(err.message || 'Failed to load providers.');
    } finally {
      setProvidersLoading(false);
    }
  }, [searchName, selectedCategory, filterCity, maxPrice, minRating, availabilityDay, userLat, userLng, searchRadius, sortBy, currentPage, itemsPerPage]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      setBookingsError(err.message || 'Failed to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Fetch notifications callback logic
  const fetchNotifications = useCallback(async () => {
    // Set loader to true
    setNotificationsLoading(true);
    // Clear old errors
    setNotificationsError('');
    // Try calling the notification service API
    try {
      // Execute retrieval api request
      const res = await notificationService.getNotifications();
      // Set results list in state
      setNotifications(res.notifications || []);
    // Catch api exceptions
    } catch (err) {
      // Update error state
      setNotificationsError(err.message || 'Failed to load notifications.');
    // Done state
    } finally {
      // Set loader back to false
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Hook to fetch user notifications list on page load
  useEffect(() => {
    // Invoke retrieval handler
    fetchNotifications();
  }, [fetchNotifications]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRescheduleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Please choose a valid date and time.');
      return;
    }
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      await bookingService.rescheduleBooking(reschedulingBooking._id, rescheduleDate, rescheduleTime, rescheduleReason);
      setReschedulingBooking(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      fetchBookings();
      alert('Reschedule request submitted successfully! Pending provider approval.');
    } catch (err) {
      setRescheduleError(err.message || 'Failed to request rescheduling.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    fetchBookings();
    setActiveTab('bookings');
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setCurrentPage(1);
      },
      (error) => {
        alert("Unable to retrieve location. Please pin it manually on the map.");
      }
    );
  };

  const handleSelectMapLocation = (lat, lng) => {
    setUserLat(lat);
    setUserLng(lng);
    setCurrentPage(1);
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() || 'U');

  const pendingCount = bookings.filter(b => b.booking_status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Welcome Banner ── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-6 md:p-8 mb-8 shadow-lg text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-extrabold text-xl">
              {initials}
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Welcome back 👋</p>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {user?.full_name || user?.email || 'User'}
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {pendingCount > 0
                  ? `You have ${pendingCount} pending booking${pendingCount > 1 ? 's' : ''}`
                  : 'No pending bookings. Book a service today!'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-extrabold">{bookings.length}</p>
              <p className="text-blue-100 text-xs">Total Bookings</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-extrabold">{pendingCount}</p>
              <p className="text-blue-100 text-xs">Pending</p>
            </div>
          </div>
        </div>

        {/* ── Popular Categories ── */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Popular Categories</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setActiveTab('providers');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
                  ${selectedCategory === cat.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { id: 'providers', label: 'Available Providers', count: providers.length },
            { id: 'bookings', label: 'My Bookings', count: bookings.length },
            // Add notifications tab with unread count badge
            { id: 'notifications', label: 'Notifications', count: notifications.filter(n => !n.is_read).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all flex items-center gap-2
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── PROVIDERS TAB ── */}
        {activeTab === 'providers' && (
          <div>
            {/* Location selector bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Search Coordinate Area</p>
                  <p className="text-sm font-bold text-slate-800">
                    {userLat !== null && userLng !== null ? `Latitude: ${userLat.toFixed(5)}, Longitude: ${userLng.toFixed(5)}` : 'Location not selected'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-end">
                {userLat !== null && userLng !== null && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Radius:</label>
                    <select
                      value={searchRadius}
                      onChange={(e) => {
                        setSearchRadius(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none"
                    >
                      <option value={2}>2 km</option>
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={25}>25 km</option>
                      <option value={50}>50 km</option>
                    </select>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-all"
                >
                  Locate Me
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Pick on Map
                </button>
                {userLat !== null && userLng !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserLat(null);
                      setUserLng(null);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Clear Location
                  </button>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by provider name..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="City..."
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="w-full sm:w-40 pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                    ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={fetchProviders}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Max Hourly Rate (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={maxPrice}
                      onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Min Rating</label>
                    <select
                      value={minRating}
                      onChange={e => { setMinRating(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">Any</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="4.5">4.5+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Availability</label>
                    <select
                      value={availabilityDay}
                      onChange={e => { setAvailabilityDay(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">Any Day</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">Default</option>
                      <option value="price_low_high">Price: Low to High</option>
                      <option value="price_high_low">Price: High to Low</option>
                      <option value="rating">Rating</option>
                      {userLat !== null && userLng !== null && (
                        <option value="distance">Distance (Near First)</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results count */}
            {!providersLoading && !providersError && (
              <p className="text-sm text-slate-500 mb-4">
                Showing <span className="font-bold text-slate-700">{providers.length}</span> provider{providers.length !== 1 ? 's' : ''}
                {selectedCategory ? ` in ${selectedCategory}` : ''}
              </p>
            )}

            {/* Provider grid */}
            {providersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : providersError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p>{providersError}</p>
                <button onClick={fetchProviders} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <User className="h-14 w-14" />
                <p className="text-lg font-semibold text-slate-500">No providers found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearchName(''); setSelectedCategory(''); setFilterCity(''); setMaxPrice(''); setMinRating(''); }}
                  className="text-blue-600 font-semibold hover:underline text-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {providers.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onBook={setSelectedProvider}
                    />
                  ))}
                </div>

                {/* Pagination controls */}
                {totalCount > itemsPerPage && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                      }}
                      className="px-4 py-2 border border-slate-200 hover:border-blue-500 rounded-xl text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-slate-500">
                      Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                      onClick={() => {
                        setCurrentPage(prev => prev + 1);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:border-blue-500 rounded-xl text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">My Bookings</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportMyBookings}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                  title="Export My Booking History as CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={fetchBookings}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : bookingsError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-slate-500">{bookingsError}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Calendar className="h-14 w-14" />
                <p className="text-lg font-semibold text-slate-500">No bookings yet</p>
                <p className="text-sm">Find a provider and book a service!</p>
                <button
                  onClick={() => setActiveTab('providers')}
                  className="mt-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  Browse Providers
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {booking.provider_name
                            ? booking.provider_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
                            : 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{booking.provider_name || 'Provider'}</p>
                          {booking.provider_category && (
                            <p className="text-blue-600 text-xs font-semibold">{booking.provider_category}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {booking.booking_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {booking.booking_time}
                            </span>
                            {booking.booking_address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {booking.booking_address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <StatusBadge status={booking.booking_status} />
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          💳 Pay on Service
                        </span>
                        {booking.total_amount > 0 && (
                          <span className="text-blue-700 font-bold text-sm">₹{booking.total_amount}</span>
                        )}
                        {booking.booking_status === 'Pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          >
                            {cancellingId === booking._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            Cancel Booking
                          </button>
                        )}
                        {(booking.booking_status === 'Pending' || booking.booking_status === 'Accepted') && (
                          <button
                            onClick={() => {
                              setReschedulingBooking(booking);
                              setRescheduleDate(booking.booking_date || '');
                              setRescheduleTime(booking.booking_time || '');
                            }}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Reschedule
                          </button>
                        )}
                        {booking.booking_status === 'Completed' && !booking.is_reviewed && (
                          <button
                            onClick={() => handleOpenReviewModal(booking)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            Leave Review
                          </button>
                        )}
                        {booking.booking_status === 'Completed' && booking.is_reviewed && (
                          <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="mt-3 text-xs text-slate-400 border-t border-slate-50 pt-3">
                        <span className="font-semibold">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div>
            {/* Header controls layout */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
              {/* Refresh trigger button */}
              <button
                onClick={fetchNotifications}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            {/* Display loader if fetching alerts list */}
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : notificationsError ? (
              /* Display error message details */
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-slate-500">{notificationsError}</p>
              </div>
            ) : notifications.length === 0 ? (
              /* Empty state details */
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Bell className="h-14 w-14" />
                <p className="text-lg font-semibold text-slate-500">No notifications yet</p>
                <p className="text-sm">You will receive alerts here when booking status changes.</p>
              </div>
            ) : (
              /* Alerts list grid container */
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      // Mark as read only if it is unread
                      if (!notif.is_read) {
                        // Call patch read service endpoint
                        notificationService.markAsRead(notif._id).then(() => fetchNotifications());
                      }
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      notif.is_read
                        ? 'bg-white border-slate-100 shadow-sm opacity-75'
                        : 'bg-blue-50/30 border-blue-100 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Bell icon box container styling */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                          notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Bell className="h-5 w-5" />
                        </div>
                        {/* Details text area */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Alert title */}
                            <h4 className={`font-bold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notif.title}
                            </h4>
                            {/* Unread badge */}
                            {!notif.is_read && (
                              <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                New
                              </span>
                            )}
                          </div>
                          {/* Alert message body */}
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                          {/* Date and reference details footer */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span>
                              Ref Booking: <span className="font-mono text-slate-500">{notif.booking_id}</span>
                            </span>
                            <span>•</span>
                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
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

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Review Modal */}
      {isReviewModalOpen && reviewBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Leave a Review</h3>
            <p className="text-sm text-slate-500 mb-6">
              Share your experience with <span className="font-semibold">{reviewBooking.provider_name}</span>.
            </p>

            {reviewError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmittingReview} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Review
                </label>
                <textarea
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what you liked or how they can improve..."
                  rows="4"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitLoading || reviewText.length < 3}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
                >
                  {reviewSubmitLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapModalOpen && (
        <MapModal
          onClose={() => setIsMapModalOpen(false)}
          onSelect={handleSelectMapLocation}
          initialLat={userLat}
          initialLng={userLng}
        />
      )}

      {/* Reschedule Booking Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 relative">
            <button
              onClick={() => setReschedulingBooking(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 rounded-xl hover:bg-slate-50 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reschedule Booking</h3>
            <p className="text-sm text-slate-500 mb-6">
              Change date and time for booking with <span className="font-semibold">{reschedulingBooking.provider_name}</span>.
            </p>

            {rescheduleError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {rescheduleError}
              </div>
            )}

            <form onSubmit={handleRescheduleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Time</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Rescheduling</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Need to adjust for work emergency..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {rescheduleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm Reschedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {isReviewModalOpen && reviewBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 md:p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </span>
              <h3 className="text-xl font-bold text-slate-900">Rate & Review Service</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Share your feedback for <span className="font-semibold text-slate-800">{reviewBooking.provider_name}</span>.
            </p>

            {reviewError && (
              <div className="flex items-center gap-2 p-3.5 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmittingReview} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 rounded-lg hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700">{reviewRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Review</label>
                <textarea
                  required
                  rows={4}
                  minLength={3}
                  maxLength={1000}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe your experience with this service provider..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 resize-none transition-all"
                />
                <p className="text-[11px] text-slate-400 text-right mt-1">{reviewText.length}/1000 characters</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitLoading || reviewText.trim().length < 3}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {reviewSubmitLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Review'
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

export default UserDashboard;
