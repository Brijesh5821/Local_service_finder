import api from '../api/axios';

export const adminService = {
  // Retrieve stats for the admin dashboard
  getDashboardStats: async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard statistics');
    }
  },

  // Retrieve list of all users
  getUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch users');
    }
  },

  // Retrieve complete details for a specific user
  getUserDetails: async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user details');
    }
  },

  // Safely delete or deactivate a user account
  deleteUser: async (userId) => {
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete/deactivate user');
    }
  },

  // Update user active status or suspension status
  updateUserStatus: async (userId, statusData) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, statusData);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update user status');
    }
  },

  // Retrieve list of all bookings
  getBookings: async () => {
    try {
      const res = await api.get('/admin/bookings');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch bookings');
    }
  },

  // Force update booking status
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      const res = await api.patch(`/admin/bookings/${bookingId}/status`, statusData);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update booking status');
    }
  },

  // Retrieve all service listings
  getServices: async () => {
    try {
      const res = await api.get('/admin/services');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch services');
    }
  },

  // Delete a service listing (content moderation)
  deleteService: async (serviceId) => {
    try {
      const res = await api.delete(`/admin/services/${serviceId}`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete service');
    }
  },

  // Approve a user/provider registration request
  approveUser: async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/approve`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to approve user');
    }
  },

  // Reject a user/provider registration request
  rejectUser: async (userId, reason) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/reject`, { rejection_reason: reason });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to reject user');
    }
  },

  // Categories CRUD APIs
  getCategories: async () => {
    try {
      const res = await api.get('/admin/categories');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch categories');
    }
  },
  createCategory: async (categoryData) => {
    try {
      const res = await api.post('/admin/categories', categoryData);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create category');
    }
  },
  updateCategory: async (categoryId, categoryData) => {
    try {
      const res = await api.put(`/admin/categories/${categoryId}`, categoryData);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update category');
    }
  },
  deleteCategory: async (categoryId) => {
    try {
      const res = await api.delete(`/admin/categories/${categoryId}`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete/deactivate category');
    }
  },
  toggleCategoryStatus: async (categoryId, isActive) => {
    try {
      const res = await api.patch(`/admin/categories/${categoryId}/toggle`, { is_active: isActive });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to toggle category status');
    }
  },
  getPublicCategories: async () => {
    try {
      const res = await api.get('/admin/categories/public');
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch categories');
    }
  },
  approveService: async (serviceId) => {
    try {
      const res = await api.patch(`/admin/services/${serviceId}/approve`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to approve service');
    }
  },
  rejectService: async (serviceId, reason) => {
    try {
      const res = await api.patch(`/admin/services/${serviceId}/reject`, { reason });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to reject service');
    }
  },
  updateDocumentStatus: async (userId, docId, status, rejectionReason = '') => {
    try {
      const params = { status };
      if (rejectionReason) params.rejection_reason = rejectionReason;
      const res = await api.patch(`/admin/users/${userId}/documents/${docId}/status`, null, { params });
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update document status');
    }
  },
  viewDocumentUrl: (userId, docId) => {
    return `${api.defaults.baseURL}/admin/users/${userId}/documents/${docId}/view`;
  }
};
