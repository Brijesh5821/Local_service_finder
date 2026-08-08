import api from '../api/axios';

export const providerService = {
  getProviders: async (filters = {}) => {
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      if (filters.min_price !== undefined) params.min_price = filters.min_price;
      if (filters.max_price !== undefined) params.max_price = filters.max_price;
      if (filters.min_rating !== undefined) params.min_rating = filters.min_rating;

      const res = await api.get('/providers/', { params });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch providers');
    }
  },

  getProviderById: async (providerId) => {
    try {
      const res = await api.get(`/providers/${providerId}`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider');
    }
  },
};
