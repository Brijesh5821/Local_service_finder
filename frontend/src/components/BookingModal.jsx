import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Loader2, CheckCircle, Star, IndianRupee, User, ArrowLeft } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';

const BookingModal = ({ provider, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    booking_date: '',
    booking_time: '',
    booking_address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Confirmation step: 'form' or 'confirm'
  const [step, setStep] = useState('form');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!provider?.id) return;
      setReviewsLoading(true);
      try {
        const res = await reviewService.getReviewsByProvider(provider.id);
        if (res.success) {
          setReviews(res.reviews || []);
        }
      } catch (err) {
        console.error("Failed to load reviews in booking modal", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [provider]);

  const [dateError, setDateError] = useState('');

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDateError('');
    
    if (provider?.holidays && provider.holidays.includes(selectedDate)) {
      setDateError('Provider is on holiday/unavailable on this date.');
      setForm({ ...form, booking_date: selectedDate });
      return;
    }

    if (selectedDate) {
      try {
        const dateObj = new Date(selectedDate);
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const selectedDayName = weekdays[dateObj.getDay()];
        
        const availability = provider?.availability || {};
        if (!availability[selectedDayName] || availability[selectedDayName].length === 0) {
          const capitalizedDay = selectedDayName.charAt(0).toUpperCase() + selectedDayName.slice(1);
          setDateError(`Provider does not offer services on ${capitalizedDay}s.`);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setForm({ ...form, booking_date: selectedDate });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setError('');

    if (!form.booking_date) {
      setError('Please select a valid booking date.');
      return;
    }

    if (form.booking_date < today) {
      setError('Booking date cannot be in the past.');
      return;
    }

    if (dateError) {
      setError(dateError);
      return;
    }

    if (!form.booking_time) {
      setError('Please select a booking time.');
      return;
    }

    if (!form.booking_address || form.booking_address.trim().length < 5) {
      setError('Please provide a complete service address (at least 5 characters).');
      return;
    }

    // Show confirmation step
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    setError('');
    setLoading(true);
    try {
      await bookingService.createBooking({
        provider_id: provider.id,
        service_id: null,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        booking_address: form.booking_address,
        notes: form.notes,
        total_amount: provider.hourly_rate || 0,
      });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to create booking. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // Today's date as minimum for date picker
  const today = new Date().toISOString().split('T')[0];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">
              {step === 'confirm' ? 'Confirm Your Booking' : 'Book Service'}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {provider?.full_name} · {provider?.provider_category || 'Service Provider'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-blue-700 p-2 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-bold text-slate-800">Booking Placed!</p>
              <p className="text-slate-500 text-sm text-center">
                Your booking with {provider?.full_name} has been placed successfully. The provider will review and confirm it shortly.
              </p>
              <p className="text-slate-400 text-xs">
                Payment: Pay on Service (Payment gateway coming soon)
              </p>
            </div>
          ) : step === 'confirm' ? (
            /* ── CONFIRMATION SUMMARY STEP ── */
            <div className="max-w-lg mx-auto">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-lg">Booking Summary</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Please review the details before confirming</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {/* Service */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Service / Provider</p>
                      <p className="text-sm font-bold text-slate-800">{provider?.full_name}</p>
                      <p className="text-xs text-slate-500">{provider?.provider_category || 'Service Provider'}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />

                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date</p>
                      <p className="text-sm font-bold text-slate-800">{formatDate(form.booking_date)}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Time</p>
                      <p className="text-sm font-bold text-slate-800">{formatTime(form.booking_time)}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Address</p>
                      <p className="text-sm font-bold text-slate-800">{form.booking_address}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />

                  {/* Price */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IndianRupee className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Price</p>
                      <p className="text-sm font-bold text-slate-800">
                        {provider?.hourly_rate ? `₹${provider.hourly_rate}/hr` : 'To be discussed'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Payment: Pay on Service</p>
                    </div>
                  </div>

                  {form.notes && (
                    <>
                      <div className="border-t border-slate-100" />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Notes</p>
                          <p className="text-sm text-slate-700">{form.notes}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setStep('form'); setError(''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Placing...</>
                  ) : (
                    <><CheckCircle className="h-5 w-5" /> Confirm Booking</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Form */}
              <form onSubmit={handleProceedToConfirm} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Provider rate info */}
                {provider?.hourly_rate && (
                  <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-600">Hourly Rate</span>
                    <span className="font-bold text-blue-700 text-lg">₹{provider.hourly_rate}/hr</span>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Calendar className="inline h-4 w-4 mr-1 text-blue-500" />
                    Booking Date
                  </label>
                  <input
                    type="date"
                    name="booking_date"
                    value={form.booking_date}
                    onChange={handleDateChange}
                    min={today}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {dateError && (
                    <p className="text-red-500 text-xs mt-1.5 font-semibold">{dateError}</p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Clock className="inline h-4 w-4 mr-1 text-blue-500" />
                    Booking Time
                  </label>
                  <input
                    type="time"
                    name="booking_time"
                    value={form.booking_time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <MapPin className="inline h-4 w-4 mr-1 text-blue-500" />
                    Service Address
                  </label>
                  <textarea
                    name="booking_address"
                    value={form.booking_address}
                    onChange={handleChange}
                    required
                    rows={2}
                    placeholder="Enter service address"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <FileText className="inline h-4 w-4 mr-1 text-blue-500" />
                    Additional Notes
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Add any special instructions or requirements"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit - goes to confirmation */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Review Booking →
                </button>
              </form>

              {/* Right Column: Provider Details & Reviews */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-6 md:pt-0 flex flex-col">
                <h3 className="font-bold text-slate-800 text-lg mb-3">Provider Profile</h3>
                
                {/* Rating summary */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-xl font-bold text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {provider.average_rating ? Number(provider.average_rating).toFixed(1) : 'New'}
                  </div>
                  <span className="text-slate-500 text-sm">
                    ({reviews.length} customer review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>

                {provider.description && (
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed italic">
                    "{provider.description}"
                  </p>
                )}

                <div className="border-t border-slate-100 pt-4 flex-1 flex flex-col min-h-[250px]">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Customer Reviews</h4>
                  
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-10 flex-1">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 flex-1 text-center">
                      <Star className="h-8 w-8 text-slate-200 mb-2" />
                      <p className="text-sm font-semibold">No reviews yet</p>
                      <p className="text-xs">Be the first to review after your booking completes!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto pr-1 max-h-[300px]">
                      {reviews.map((r) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-800 truncate">{r.customer_name}</span>
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{r.review_text}</p>
                          <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
