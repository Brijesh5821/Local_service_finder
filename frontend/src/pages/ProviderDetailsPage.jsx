import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Briefcase, Clock, ShieldCheck, 
  CheckCircle, Calendar, User, Award, MessageSquare, Loader2, 
  AlertCircle, IndianRupee, Sparkles, Check
} from 'lucide-react';
import { providerService } from '../services/providerService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';

const ProviderDetailsPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user && ['admin', 'system_admin'].includes(user.role?.toLowerCase());

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!providerId) return;
      setLoading(true);
      setError('');
      try {
        const res = await providerService.getProviderById(providerId);
        if (res.success && res.provider) {
          setProvider(res.provider);
        } else {
          setError('Provider profile not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load provider details.');
      } finally {
        setLoading(false);
      }
    };

    const fetchReviewsData = async () => {
      if (!providerId) return;
      setReviewsLoading(true);
      try {
        const res = await reviewService.getReviewsByProvider(providerId);
        if (res.success) {
          setReviews(res.reviews || []);
        }
      } catch (err) {
        console.error('Failed to load provider reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProviderData();
    fetchReviewsData();
  }, [providerId]);

  const handleBookClick = () => {
    if (isAdmin) {
      alert('Admin users cannot create service bookings.');
      return;
    }
    if (!isAuthenticated()) {
      navigate('/login', { state: { redirectTo: `/provider/${providerId}` } });
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 font-semibold text-sm">Loading provider details...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <AlertCircle className="h-14 w-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Provider Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error || "We couldn't locate the requested service provider profile."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const initials = provider.full_name
    ? provider.full_name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const averageRating = provider.average_rating ? Number(provider.average_rating).toFixed(1) : null;
  const isAvailable = provider.availability !== false;

  // Format availability schedule display
  const availabilityData = provider.availability;
  let availableDaysList = [];
  if (Array.isArray(availabilityData)) {
    availableDaysList = availabilityData.map(d => d.day ? d.day.charAt(0).toUpperCase() + d.day.slice(1) : d);
  } else if (availabilityData && typeof availabilityData === 'object') {
    availableDaysList = Object.keys(availabilityData).map(day => day.charAt(0).toUpperCase() + day.slice(1));
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100/80 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Provider ID: <code className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-600">{provider.id || provider._id}</code>
          </span>
        </div>

        {/* Main Hero Header Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 overflow-hidden relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {provider.profile_image ? (
                <img
                  src={provider.profile_image}
                  alt={provider.full_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-blue-50 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-blue-50 shadow-md">
                  {initials}
                </div>
              )}
              {isAvailable && (
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-white text-white p-1 rounded-full shadow" title="Available for Booking">
                  <CheckCircle className="h-4 w-4" />
                </span>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{provider.full_name}</h1>
                {provider.provider_category && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                    {provider.provider_category}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isAvailable 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {isAvailable ? 'Available Now' : 'Currently Unavailable'}
                </span>
              </div>

              {/* Rating & Reviews */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-xl font-bold border border-amber-200/60">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {averageRating ? averageRating : 'New'}
                </div>
                <span className="text-slate-500 font-medium">
                  {reviews.length} customer review{reviews.length !== 1 ? 's' : ''}
                </span>
                {provider.city && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {provider.city}
                  </span>
                )}
                {provider.experience && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    {provider.experience} Years Experience
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 Cols): Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">

            {/* About / Description Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> About Service Provider
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {provider.description || `${provider.full_name} is a verified professional service provider offering quality ${provider.provider_category || 'home service'} solutions in ${provider.city || 'your area'}. Equipped with years of expertise and committed to high standards of customer satisfaction.`}
              </p>
            </div>

            {/* Service Features & Highlights */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" /> Service Overview & Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Category</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{provider.provider_category || 'General Service'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    {provider.hourly_rate ? `₹${provider.hourly_rate} / hour` : 'Rate on request'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{provider.experience ? `${provider.experience} Years` : 'Experienced'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Location</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{provider.city || 'City-wide Service'}</p>
                </div>
              </div>

              {availableDaysList.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operating Schedule</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDaysList.map((day, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-xl border border-blue-100">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" /> Customer Reviews
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">Authentic ratings and feedback from verified customers</p>
                </div>
                {averageRating && (
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-2xl font-bold text-sm border border-amber-200">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {averageRating} / 5.0
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                  <Star className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-700 font-bold text-sm">No reviews yet</p>
                  <p className="text-slate-400 text-xs mt-1">Be the first customer to leave feedback after your completed service booking!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, idx) => (
                    <div key={r.id || r._id || idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{r.customer_name || 'Verified Customer'}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{r.review_text}</p>
                      {r.created_at && (
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sticky Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 sticky top-24 space-y-6">
              
              {/* Pricing banner */}
              <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Service Pricing</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold">
                    {provider.hourly_rate ? `₹${provider.hourly_rate}` : 'Rate on request'}
                  </span>
                  {provider.hourly_rate && <span className="text-blue-200 text-sm font-medium">/ hour</span>}
                </div>
                <p className="text-[11px] text-blue-100/90 mt-2 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-blue-200" /> Pay after service completion
                </p>
              </div>

              {/* Guarantees List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Verified & Background Checked Pro</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>Flexible Booking & Time Slots</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>100% Quality Service Guarantee</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4" />

              {/* Main Book Now Button inside page */}
              <button
                onClick={handleBookClick}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-base"
              >
                <Calendar className="h-5 w-5" /> Book Now
              </button>

              <p className="text-[11px] text-slate-400 text-center font-medium">
                Free cancellation up to 2 hours before booking time
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Booking Modal Instance */}
      {isBookingModalOpen && (
        <BookingModal
          provider={{
            id: provider.id || provider._id,
            service_id: provider.service_id || null,
            full_name: provider.full_name,
            profile_image: provider.profile_image,
            hourly_rate: provider.hourly_rate,
            provider_category: provider.provider_category,
            availability: provider.availability,
            description: provider.description,
            city: provider.city,
            holidays: provider.holidays,
            average_rating: provider.average_rating,
          }}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            setIsBookingModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProviderDetailsPage;
