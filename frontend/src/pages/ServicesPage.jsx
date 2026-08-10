import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, Star, Filter, ChevronDown, ChevronUp,
  Tag, Loader2, AlertCircle, Home, ChevronRight, SlidersHorizontal, X
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'AC Repair', value: 'AC Repair' },
  { label: 'Carpenter', value: 'Carpenter' },
  { label: 'Painter', value: 'Painter' },
  { label: 'Beautician', value: 'Beautician' },
  { label: 'Appliance Repair', value: 'Appliance Repair' },
  { label: 'Home Tutor', value: 'Home Tutor' },
  { label: 'Mechanic', value: 'Mechanic' },
  { label: 'Pest Control', value: 'Pest Control' },
];

const WEEKDAYS = [
  { label: 'Any Day', value: '' },
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

const ServicesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state — initialize from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Services list state
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal state
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Sync from URL params when navigating in
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('location') || '';
    const cat = searchParams.get('category') || '';
    setSearchTerm(q);
    setLocationTerm(loc);
    setSelectedCategory(cat);
    // Scroll to top on mount / navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []); // intentionally only on mount

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (locationTerm) params.city = locationTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      if (minRating) params.min_rating = parseFloat(minRating);
      if (selectedDay) params.availability = selectedDay;

      const response = await api.get('/services/', { params });
      if (response.data && response.data.success) {
        setServices(response.data.services || []);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedCategory, maxPrice, minRating, selectedDay]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchTerm) newParams.q = searchTerm;
    if (locationTerm) newParams.location = locationTerm;
    if (selectedCategory) newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setSelectedCategory('');
    setMaxPrice('');
    setMinRating('');
    setSelectedDay('');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || locationTerm || selectedCategory || maxPrice || minRating || selectedDay;

  const handleBookNow = (service) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    setSelectedProvider({
      id: service.provider_id,
      full_name: service.provider_name,
      profile_image: service.provider_image,
      hourly_rate: service.price_value,
      provider_category: service.category_name,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header / Hero ── */}
      <div className="bg-white border-b border-slate-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-5">
            <Link to="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium">
              <Home className="h-4 w-4" /> Home
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="text-slate-800 font-semibold">
              {selectedCategory || 'All Services'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory ? `${selectedCategory} Services` : 'Browse All Services'}
              </h1>
              <p className="text-slate-500 mt-1.5 text-base">
                Find top-rated local professionals ready to help you today.
              </p>
            </div>
            {!loading && !error && (
              <p className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium flex-shrink-0">
                {services.length} service{services.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Search & Filters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search services, e.g. AC Repair, Cleaning…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>

            {/* City Input */}
            <div className="relative md:w-56">
              <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="City or area…"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex-shrink-0 ${
                  showFilters
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-sm flex-shrink-0"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price (₹/hr)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Min Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="">Any Rating</option>
                  <option value="3">3.0+ Stars</option>
                  <option value="4">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Availability</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Active:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  "{searchTerm}"
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  {selectedCategory}
                </span>
              )}
              {locationTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  <MapPin className="h-3 w-3" />{locationTerm}
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100 hover:bg-red-100 transition-colors"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Services Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-slate-200 rounded-full w-1/3" />
                  <div className="h-5 bg-slate-200 rounded-full w-16" />
                </div>
                <div className="h-6 bg-slate-200 rounded-xl w-3/4 mb-3" />
                <div className="h-4 bg-slate-200 rounded-md w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded-md w-5/6 mb-6" />
                <div className="flex gap-2 items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
                <div className="h-11 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertCircle className="h-14 w-14 text-red-400" />
            <div className="text-center">
              <p className="font-bold text-lg text-slate-800 mb-1">Failed to load services</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchServices}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all text-sm"
            >
              Try Again
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">
            <Tag className="h-14 w-14 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Services Found</h3>
            <p className="text-slate-500 max-w-sm text-center mb-5">
              Try adjusting your search terms, category, or location filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => {
              const initials = service.provider_name
                ? service.provider_name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
                : 'SP';

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Category + Price */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {service.category_name}
                      </span>
                      <span className="text-base font-extrabold text-blue-700">
                        ₹{service.price_value}
                        <span className="text-slate-400 font-normal text-xs">/hr</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Provider Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {service.provider_image ? (
                          <img
                            src={service.provider_image}
                            alt={service.provider_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{service.provider_name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />{service.city || '—'}
                          </p>
                        </div>
                      </div>
                      {service.average_rating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(service.average_rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="px-6 pb-5">
                    <button
                      onClick={() => handleBookNow(service)}
                      className="w-full py-2.5 bg-white hover:bg-blue-600 text-blue-600 hover:text-white font-bold rounded-xl border border-blue-200 hover:border-blue-600 transition-all text-sm shadow-sm"
                    >
                      Book This Service
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onSuccess={() => {
            setSelectedProvider(null);
            alert('Booking placed successfully! Check "My Bookings" in your dashboard.');
          }}
        />
      )}
    </div>
  );
};

export default ServicesPage;
