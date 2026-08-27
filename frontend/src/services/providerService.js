// Import the Axios base client configuration
import api from '../api/axios';

// Export provider service handler methods
export const providerService = {
  // Retrieve providers list for customer view (existing API)
  getProviders: async (filters = {}) => {
    // Try block to execute query
    try {
      // Initialize empty params dict
      const params = {};
      // Check and add name filter
      if (filters.name) params.name = filters.name;
      // Check and add category filter
      if (filters.category) params.category = filters.category;
      // Check and add city filter
      if (filters.city) params.city = filters.city;
      // Check and add min price filter
      if (filters.min_price !== undefined) params.min_price = filters.min_price;
      // Check and add max price filter
      if (filters.max_price !== undefined) params.max_price = filters.max_price;
      // Check and add min rating filter
      if (filters.min_rating !== undefined) params.min_rating = filters.min_rating;
      // Check and add availability filter
      if (filters.availability) params.availability = filters.availability;
      // Check and add geo filters
      if (filters.lat !== undefined) params.lat = filters.lat;
      if (filters.lng !== undefined) params.lng = filters.lng;
      if (filters.radius !== undefined) params.radius = filters.radius;
      // Check and add sorting & paging parameters
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      // Execute Axios GET call with query params
      const res = await api.get('/providers/', { params });
      // Return response payload data
      return res.data;
    // Catch query exceptions
    } catch (error) {
      // Throw formatted error message
      throw new Error(error.response?.data?.detail || 'Failed to fetch providers');
    }
  },

  // Fetch provider profile details by ID (existing API)
  getProviderById: async (providerId) => {
    // Try block to run lookup
    try {
      // Execute Axios GET request
      const res = await api.get(`/providers/${providerId}`);
      // Return response payload data
      return res.data;
    // Catch lookup exceptions
    } catch (error) {
      // Throw formatted error
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider');
    }
  },

  // Fetch dashboard stats for authenticated provider
  getDashboardStats: async () => {
    // Try block to execute GET call
    try {
      // Execute GET request to singular provider dashboard stats endpoint
      const res = await api.get('/provider/dashboard');
      // Return response data
      return res.data;
    // Catch request error
    } catch (error) {
      // Throw error with detail message
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider stats');
    }
  },

  // Fetch incoming bookings list for provider
  getBookings: async () => {
    // Try block
    try {
      // GET request to provider bookings endpoint
      const res = await api.get('/provider/bookings');
      // Return payload data
      return res.data;
    // Catch errors
    } catch (error) {
      // Throw detail message
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider bookings');
    }
  },

  // Fetch single booking details for provider
  getBookingById: async (bookingId) => {
    // Try block
    try {
      // GET request to provider booking details endpoint
      const res = await api.get(`/provider/bookings/${bookingId}`);
      // Return payload data
      return res.data;
    // Catch errors
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to fetch booking details');
    }
  },

  // Accept a pending booking
  acceptBooking: async (bookingId) => {
    // Try block
    try {
      // PATCH call to accept endpoint
      const res = await api.patch(`/provider/bookings/${bookingId}/accept`);
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error
      throw new Error(error.response?.data?.detail || 'Failed to accept booking');
    }
  },

  // Reject a pending booking with optional reason
  rejectBooking: async (bookingId, reason = '') => {
    // Try block
    try {
      // PATCH call to reject endpoint, sending optional reason payload
      const res = await api.patch(`/provider/bookings/${bookingId}/reject`, { reason });
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to reject booking');
    }
  },

  // Cancel an accepted booking with optional reason
  cancelBooking: async (bookingId, reason = '') => {
    // Try block
    try {
      // PATCH call to cancel endpoint, sending optional reason payload
      const res = await api.patch(`/provider/bookings/${bookingId}/cancel`, { reason });
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to cancel booking');
    }
  },

  // Mark a booking as completed
  completeBooking: async (bookingId) => {
    // Try block
    try {
      // PATCH call to complete endpoint
      const res = await api.patch(`/provider/bookings/${bookingId}/complete`);
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to complete booking');
    }
  },

  // List services owned by this provider
  getServices: async () => {
    // Try block
    try {
      // GET request to provider services endpoint
      const res = await api.get('/provider/services');
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider services');
    }
  },

  // Create a new service list
  createService: async (serviceData) => {
    // Try block
    try {
      // POST request to create service endpoint
      const res = await api.post('/provider/services', serviceData);
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to create service');
    }
  },

  // Update an existing service list
  updateService: async (serviceId, serviceData) => {
    // Try block
    try {
      // PUT request to update service details
      const res = await api.put(`/provider/services/${serviceId}`, serviceData);
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to update service');
    }
  },

  // Delete an existing service list
  deleteService: async (serviceId) => {
    // Try block
    try {
      // DELETE request to service endpoint
      const res = await api.delete(`/provider/services/${serviceId}`);
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to delete service');
    }
  },

  // Fetch notifications feed for the provider
  getNotifications: async () => {
    // Try block
    try {
      // GET request to provider notifications endpoint
      const res = await api.get('/provider/notifications');
      // Return response data
      return res.data;
    // Catch error
    } catch (error) {
      // Throw error detail
      throw new Error(error.response?.data?.detail || 'Failed to fetch provider notifications');
    }
  },

  acceptRescheduleBooking: async (bookingId) => {
    try {
      const res = await api.patch(`/provider/bookings/${bookingId}/reschedule-accept`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to accept rescheduling request');
    }
  },

  rejectRescheduleBooking: async (bookingId) => {
    try {
      const res = await api.patch(`/provider/bookings/${bookingId}/reschedule-reject`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to reject rescheduling request');
    }
  },

  uploadDocument: async (documentType, file) => {
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file);
      
      const res = await api.post('/provider/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to upload document');
    }
  },

  getMyDocuments: async () => {
    try {
      const res = await api.get('/provider/documents');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch documents');
    }
  },

  viewMyDocumentUrl: (docId) => {
    return `${api.defaults.baseURL || ''}/provider/documents/${docId}/view`;
  }
};
