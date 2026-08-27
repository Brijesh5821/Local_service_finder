import api from '../api/axios';

export const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const res = await api.post('/bookings/', bookingData);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create booking');
    }
  },

  getMyBookings: async () => {
    try {
      const res = await api.get('/bookings/my');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch bookings');
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to cancel booking');
    }
  },

  rescheduleBooking: async (bookingId, date, time, reason) => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/reschedule`, {
        booking_date: date,
        booking_time: time,
        reason: reason
      });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to reschedule booking');
    }
  },
};
