import api from '../api/axios';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        // Handle FastAPI validation errors format or custom error messages
        const detail = error.response.data.detail || error.response.data.message;
        if (Array.isArray(detail)) {
          throw new Error(detail[0].msg);
        }
        throw new Error(detail || 'Registration failed');
      }
      throw new Error('Network Error or Server Unreachable');
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const detail = error.response.data.detail || error.response.data.message;
        throw new Error(detail || 'Login failed');
      }
      throw new Error('Network Error or Server Unreachable');
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to fetch profile');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to update profile');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const response = await api.put('/users/settings', settingsData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to update settings');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const detail = error.response.data.detail || error.response.data.message;
        if (Array.isArray(detail)) {
          throw new Error(detail[0].msg);
        }
        throw new Error(detail || 'Failed to change password');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to send reset email');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const detail = error.response.data.detail || error.response.data.message;
        if (Array.isArray(detail)) {
          throw new Error(detail[0].msg);
        }
        throw new Error(detail || 'Failed to reset password');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to upload profile image');
      }
      throw new Error('Network error or server unreachable');
    }
  },

  removeProfileImage: async () => {
    try {
      const response = await api.delete('/users/profile-image');
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to remove profile image');
      }
      throw new Error('Network error or server unreachable');
    }
  }
};


