import { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Loader2, CheckCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        onSuccess && onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Today's date as minimum for date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">Book Service</h2>
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
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-bold text-slate-800">Booking Confirmed!</p>
              <p className="text-slate-500 text-sm text-center">
                Your booking with {provider?.full_name} has been placed. You can track it in My Bookings.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={handleChange}
                  min={today}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
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
                  placeholder="Enter your full address..."
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
                  placeholder="Any specific requirements or instructions..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Confirming...</>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
