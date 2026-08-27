import api from '../api/axios';

export const reviewService = {
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews/', reviewData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || error.response.data.message || 'Failed to submit review');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  getReviewsByProvider: async (providerId) => {
    try {
      const response = await api.get(`/reviews/provider/${providerId}`);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to fetch reviews');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  getReviewByBooking: async (bookingId) => {
    try {
      const response = await api.get(`/reviews/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }
};
