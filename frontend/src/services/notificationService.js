// Import the configured Axios API client instance
import api from '../api/axios';

// Export notifications service functions object
export const notificationService = {
  // Async function to fetch notifications for the logged in user
  getNotifications: async () => {
    // Try block to handle request execution
    try {
      // Make a GET request to the notifications endpoint
      const res = await api.get('/notifications');
      // Return the response payload data
      return res.data;
    // Catch block to handle request exceptions
    } catch (error) {
      // Throw formatted error with message detail if present in response
      throw new Error(error.response?.data?.detail || 'Failed to fetch notifications');
    }
  },

  // Async function to mark a notification as read
  markAsRead: async (notificationId) => {
    // Try block to handle request execution
    try {
      // Make a PATCH request to read status endpoint
      const res = await api.patch(`/notifications/${notificationId}/read`);
      // Return response payload data
      return res.data;
    // Catch block to handle request exceptions
    } catch (error) {
      // Throw formatted error with message detail
      throw new Error(error.response?.data?.detail || 'Failed to mark notification as read');
    }
  },
};
