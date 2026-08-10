import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { providerService } from '../services/providerService';
import { bookingService } from '../services/bookingService';
import BookingModal from '../components/BookingModal';
import {
  Search, Star, MapPin, Clock, ChevronDown, ChevronUp,
  Briefcase, Calendar, X, AlertCircle, Loader2, RefreshCw,
  User, Wrench, Home, Zap, Scissors, Truck, Filter
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
    Confirmed: 'bg-green-50 text-green-700 border border-green-200',
    Completed: 'bg-blue-50 text-blue-700 border border-blue-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
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

const UserDashboard = () => {
  const { user } = useAuth();

  // Providers state
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState('');

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
  const [cancellingId, setCancellingId] = useState(null);

  // Booking modal
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('providers');

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

      const res = await providerService.getProviders(filters);
      setProviders(res.providers || []);
    } catch (err) {
      setProvidersError(err.message || 'Failed to load providers.');
    } finally {
      setProvidersLoading(false);
    }
  }, [searchName, selectedCategory, filterCity, maxPrice, minRating, availabilityDay]);

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

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  const handleBookingSuccess = () => {
    fetchBookings();
    setActiveTab('bookings');
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
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Max Hourly Rate (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Min Rating</label>
                    <select
                      value={minRating}
                      onChange={e => setMinRating(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onChange={e => setAvailabilityDay(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onBook={setSelectedProvider}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">My Bookings</h2>
              <button
                onClick={fetchBookings}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
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
                        <StatusBadge status={`Payment: ${booking.payment_status}`} />
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
      </div>

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default UserDashboard;
