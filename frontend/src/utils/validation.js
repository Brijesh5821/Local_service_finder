import { COMMON_WEAK_PASSWORDS } from './constants';

export const validateFullName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Full name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Full name must not exceed 100 characters.' };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'Full name must contain letters only.' };
  }
  return { isValid: true, error: '' };
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true, error: '' };
};

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required.' };
  }
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number.' };
  }
  return { isValid: true, error: '' };
};

export const validateGender = (gender) => {
  if (!gender || typeof gender !== 'string' || !gender.trim()) {
    return { isValid: false, error: 'Please select your gender.' };
  }
  const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  if (!validGenders.includes(gender.trim())) {
    return { isValid: false, error: 'Please select a valid gender option.' };
  }
  return { isValid: true, error: '' };
};

export const validateStreetAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Street address is required.' };
  }
  const trimmed = address.trim();
  if (trimmed.length < 5) {
    return { isValid: false, error: 'Street address must be at least 5 characters long.' };
  }
  if (trimmed.length > 300) {
    return { isValid: false, error: 'Street address must not exceed 300 characters.' };
  }
  return { isValid: true, error: '' };
};

export const validateCity = (city) => {
  if (!city || typeof city !== 'string') {
    return { isValid: false, error: 'City is required.' };
  }
  const trimmed = city.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters long.' };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'City name must contain letters and spaces only.' };
  }
  return { isValid: true, error: '' };
};

export const validateState = (state) => {
  if (!state || typeof state !== 'string') {
    return { isValid: false, error: 'State is required.' };
  }
  const trimmed = state.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'State name must be at least 2 characters long.' };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'State name must contain letters and spaces only.' };
  }
  return { isValid: true, error: '' };
};

export const validatePincode = (pincode) => {
  if (!pincode || typeof pincode !== 'string') {
    return { isValid: false, error: 'Pincode is required.' };
  }
  const trimmed = pincode.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 6-digit pincode.' };
  }
  return { isValid: true, error: '' };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character.' };
  }
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too weak or commonly used.' };
  }
  return { isValid: true, error: '' };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true, error: '' };
};

export const validateRole = (role) => {
  if (!role || typeof role !== 'string') {
    return { isValid: false, error: 'Please select an account type.' };
  }
  const normalized = role.trim().toLowerCase();
  if (['admin', 'superadmin', 'administrator'].includes(normalized)) {
    return { isValid: false, error: 'Invalid account type selection.' };
  }
  if (!['user', 'customer', 'provider'].includes(normalized)) {
    return { isValid: false, error: 'Please select a valid account type.' };
  }
  return { isValid: true, error: '' };
};

export const validateExperience = (experience) => {
  if (experience === '' || experience === null || experience === undefined) {
    return { isValid: false, error: 'Years of experience is required.' };
  }
  const num = Number(experience);
  if (isNaN(num) || !Number.isInteger(num) || num < 0 || num > 60) {
    return { isValid: false, error: 'Experience must be a valid number between 0 and 60.' };
  }
  return { isValid: true, error: '' };
};

export const validateHourlyRate = (rate) => {
  if (rate === '' || rate === null || rate === undefined) {
    return { isValid: false, error: 'Hourly rate is required.' };
  }
  const num = Number(rate);
  if (isNaN(num) || num <= 0 || num > 100000) {
    return { isValid: false, error: 'Hourly rate must be a valid number greater than 0.' };
  }
  return { isValid: true, error: '' };
};

export const validateDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { isValid: false, error: 'Business description is required.' };
  }
  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters long.' };
  }
  if (trimmed.length > 2000) {
    return { isValid: false, error: 'Description must not exceed 2000 characters.' };
  }
  return { isValid: true, error: '' };
};

export const validateServiceCategory = (category, allowedCategories = []) => {
  if (!category || typeof category !== 'string' || !category.trim()) {
    return { isValid: false, error: 'Please select a service category.' };
  }
  if (allowedCategories.length > 0 && !allowedCategories.includes(category.trim())) {
    return { isValid: false, error: 'Selected category is invalid.' };
  }
  return { isValid: true, error: '' };
};

export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Start time and end time are required when available.' };
  }
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  if (endMins <= startMins) {
    return { isValid: false, error: 'End time must be later than start time.' };
  }
  return { isValid: true, error: '' };
};

export const validateBookingDate = (dateStr) => {
  if (!dateStr) {
    return { isValid: false, error: 'Booking date is required.' };
  }
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) {
    return { isValid: false, error: 'Booking date cannot be in the past.' };
  }
  return { isValid: true, error: '' };
};

export const validateReview = (rating, reviewText, isRequired = true) => {
  if (!rating || rating < 1 || rating > 5) {
    return { isValid: false, error: 'Please select a rating between 1 and 5 stars.' };
  }
  if (isRequired || (reviewText && reviewText.trim())) {
    const trimmed = (reviewText || '').trim();
    if (!trimmed) {
      return { isValid: false, error: 'Review text cannot be empty or whitespace only.' };
    }
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Review text must be at least 3 characters.' };
    }
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Review text must not exceed 1000 characters.' };
    }
  }
  return { isValid: true, error: '' };
};
