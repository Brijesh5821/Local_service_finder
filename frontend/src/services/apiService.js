import api from '../api/axios';

export const fetchServices = async () => {
  try {
    const response = await api.get('/api/services');
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const fetchProviders = async () => {
  try {
    const response = await api.get('/api/providers');
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};
