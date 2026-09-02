import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Clock, FileText, Loader2, CheckCircle2, AlertCircle, Edit2, Save, X, Camera, Calendar, Trash2 } from 'lucide-react';
import { authService } from '../services/authService';
import { providerService } from '../services/providerService';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be smaller than 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    setError('');
    setSuccess('');
    setImageUploading(true);
    try {
      const res = await authService.uploadProfileImage(file);
      if (res.success && res.profile_image) {
        setFormData(prev => ({ ...prev, profile_image: res.profile_image }));
        setProfile(prev => ({ ...prev, profile_image: res.profile_image }));
        setUser(prev => prev ? { ...prev, profile_image: res.profile_image } : prev);
        setSuccess('Profile photo updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile photo.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleProfileImageRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setError('');
    setSuccess('');
    setImageUploading(true);
    try {
      const res = await authService.removeProfileImage();
      if (res.success) {
        setFormData(prev => ({ ...prev, profile_image: '' }));
        setProfile(prev => ({ ...prev, profile_image: '' }));
        setUser(prev => prev ? { ...prev, profile_image: '' } : prev);
        setSuccess('Profile photo removed successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove profile photo.');
    } finally {
      setImageUploading(false);
    }
  };

  // Provider verification documents states
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profile_image: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Provider specific
    provider_category: '',
    experience: '',
    description: '',
    hourly_rate: '',
    latitude: '',
    longitude: '',
    service_radius: '',
    holidays: [],
    availability: {
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-17:00']
    }
  });

  const categories = [
    "Plumber", "Electrician", "Painter", "Carpenter", "Cleaning",
    "AC Repair", "Beautician", "Appliance Repair", "Home Tutor", "Mechanic",
    "Photographer", "Driver", "Gardener", "Cook", "Laptop Repair",
    "Mobile Repair", "Pest Control", "Interior Designer", "Packers & Movers"
  ];

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const res = await providerService.getMyDocuments();
      if (res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    try {
      const res = await providerService.uploadDocument(docType, file);
      if (res.success) {
        setUploadSuccess(`${docType} uploaded successfully!`);
        fetchDocuments();
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getProfile();
      if (data.success && data.user) {
        setProfile(data.user);
        if (data.user.role?.toLowerCase() === 'provider') {
          fetchDocuments();
        }
        setFormData({
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          profile_image: data.user.profile_image || '',
          gender: data.user.gender || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          pincode: data.user.pincode || '',
          provider_category: data.user.provider_category || '',
          experience: data.user.experience !== null && data.user.experience !== undefined ? data.user.experience : '',
          description: data.user.description || '',
          hourly_rate: data.user.hourly_rate !== null && data.user.hourly_rate !== undefined ? data.user.hourly_rate : '',
          latitude: data.user.latitude || '',
          longitude: data.user.longitude || '',
          service_radius: data.user.service_radius || '',
          holidays: data.user.holidays || [],
          availability: data.user.availability || {
            monday: ['09:00-17:00'],
            tuesday: ['09:00-17:00'],
            wednesday: ['09:00-17:00'],
            thursday: ['09:00-17:00'],
            friday: ['09:00-17:00']
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profile_image: profile.profile_image || '',
        gender: profile.gender || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        provider_category: profile.provider_category || '',
        experience: profile.experience || '',
        description: profile.description || '',
        hourly_rate: profile.hourly_rate || '',
        latitude: profile.latitude || '',
        longitude: profile.longitude || '',
        service_radius: profile.service_radius || '',
        holidays: profile.holidays || [],
        availability: profile.availability || {
          monday: ['09:00-17:00'],
          tuesday: ['09:00-17:00'],
          wednesday: ['09:00-17:00'],
          thursday: ['09:00-17:00'],
          friday: ['09:00-17:00']
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaveLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        profile_image: formData.profile_image,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };

      // Check if role is provider in a case-insensitive manner
      if (profile.role?.toLowerCase() === 'provider') {
        payload.provider_category = formData.provider_category;
        payload.experience = formData.experience ? parseInt(formData.experience) : null;
        payload.description = formData.description;
        payload.hourly_rate = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null;
        payload.availability = formData.availability;
        payload.latitude = formData.latitude ? parseFloat(formData.latitude) : null;
        payload.longitude = formData.longitude ? parseFloat(formData.longitude) : null;
        payload.service_radius = formData.service_radius ? parseFloat(formData.service_radius) : null;
        payload.holidays = formData.holidays || [];
      }

      const response = await authService.updateProfile(payload);
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        fetchProfile();
        // Update auth context so navbar shows new name immediately
        if (setUser && response.user) {
          setUser((prev) => ({
            ...prev,
            full_name: response.user.full_name || prev?.full_name,
            email: response.user.email || prev?.email,
            profile_image: response.user.profile_image,
          }));
        }
      } else {
        setError(response.message || 'Profile update failed.');
      }
    } catch (err) {
      setError(err.message || 'Profile update failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!profile) return '?';
    const parts = (profile.full_name || '').split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Fetching profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Image support with real file upload */}
              <div className="relative group">
                {formData.profile_image ? (
                  <img 
                    src={formData.profile_image} 
                    alt={profile.full_name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl shadow-md">
                    {getUserInitials()}
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
                  <label className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-all hover:scale-105" title={formData.profile_image ? "Replace Photo" : "Upload Photo"}>
                    {imageUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                      disabled={imageUploading}
                    />
                  </label>

                  {formData.profile_image && (
                    <button
                      type="button"
                      onClick={handleProfileImageRemove}
                      disabled={imageUploading}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-all hover:scale-105"
                      title="Remove Photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-extrabold text-slate-900">{profile.full_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                  <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    {profile.role}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-semibold">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCancel}
                  className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Profile details form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Personal & Contact Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    name="full_name" 
                    disabled={!isEditing}
                    value={formData.full_name} 
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    name="email" 
                    disabled={!isEditing}
                    value={formData.email} 
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    type="tel" 
                    name="phone" 
                    disabled={!isEditing}
                    value={formData.phone} 
                    onChange={handleChange}
                    placeholder="Enter your 10-digit phone number"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Gender</label>
                <select 
                  name="gender" 
                  disabled={!isEditing}
                  value={formData.gender} 
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Profile Photo File Picker */}
              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Profile Photo</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-sm cursor-pointer transition-all">
                      {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {imageUploading ? 'Uploading...' : (formData.profile_image ? 'Replace Photo' : 'Choose Photo')}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    </label>

                    {formData.profile_image && (
                      <button
                        type="button"
                        onClick={handleProfileImageRemove}
                        disabled={imageUploading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-sm transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Photo
                      </button>
                    )}

                    <span className="text-xs text-slate-400">Max size 5MB (JPG, PNG, WEBP, GIF)</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    name="address" 
                    disabled={!isEditing}
                    value={formData.address} 
                    onChange={handleChange}
                    placeholder="Enter your street address"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">City</label>
                <input 
                  type="text" 
                  name="city" 
                  disabled={!isEditing}
                  value={formData.city} 
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">State</label>
                <input 
                  type="text" 
                  name="state" 
                  disabled={!isEditing}
                  value={formData.state} 
                  onChange={handleChange}
                  placeholder="Enter your state"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Pincode</label>
                <input 
                  type="text" 
                  name="pincode" 
                  disabled={!isEditing}
                  value={formData.pincode} 
                  onChange={handleChange}
                  placeholder="Enter your 6-digit pincode"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

            </div>
          </div>

          {/* Provider details section */}
          {/* Check if role is provider in a case-insensitive manner to render provider fields */}
          {profile.role?.toLowerCase() === 'provider' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" /> Provider Profile Settings
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Service Category</label>
                    <select 
                      name="provider_category" 
                      disabled={!isEditing}
                      value={formData.provider_category} 
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select service category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Years of Experience</label>
                    <input 
                      type="number" 
                      name="experience" 
                      disabled={!isEditing}
                      value={formData.experience} 
                      onChange={handleChange}
                      placeholder="Enter years of experience"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Hourly Rate (₹)</label>
                    <input 
                      type="number" 
                      name="hourly_rate" 
                      disabled={!isEditing}
                      value={formData.hourly_rate} 
                      onChange={handleChange}
                      placeholder="Enter hourly rate"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Latitude */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      name="latitude" 
                      disabled={!isEditing}
                      placeholder="Enter latitude (e.g. 23.0225)"
                      value={formData.latitude} 
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      name="longitude" 
                      disabled={!isEditing}
                      placeholder="Enter longitude (e.g. 72.5714)"
                      value={formData.longitude} 
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Service Radius */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Service Radius (km)</label>
                    <input 
                      type="number" 
                      name="service_radius" 
                      disabled={!isEditing}
                      placeholder="Enter service radius in km"
                      value={formData.service_radius} 
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {isEditing && (
                    <div className="col-span-full flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData(prev => ({
                                ...prev,
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude
                              }));
                            });
                          }
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                      >
                        Auto-detect Coordinates
                      </button>
                    </div>
                  )}

                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Business Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <textarea 
                      name="description" 
                      disabled={!isEditing}
                      value={formData.description} 
                      onChange={handleChange}
                      rows="4"
                      placeholder="Describe your service and experience"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Availability info header */}
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock className="h-4 w-4 text-blue-600" /> Weekly Availability Time Slots
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {Object.keys(formData.availability).map((day) => (
                    <div key={day} className="p-3 bg-white border border-slate-250 rounded-xl shadow-sm">
                      <p className="text-xs font-bold text-slate-700 capitalize mb-1">{day}</p>
                      <p className="text-[10px] text-blue-600 font-semibold">{formData.availability[day].join(', ')}</p>
                    </div>
                  ))}
                </div>

                {/* Holidays date block */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" /> Manage Holidays / Date Blocking
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    {isEditing && (
                      <div className="flex items-center gap-2.5 max-w-sm">
                        <input
                          type="date"
                          id="new-holiday-input"
                          min={new Date().toISOString().split('T')[0]}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-holiday-input');
                            const dateVal = input?.value;
                            if (dateVal && !formData.holidays.includes(dateVal)) {
                              setFormData(prev => ({
                                ...prev,
                                holidays: [...prev.holidays, dateVal].sort()
                              }));
                              input.value = '';
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          Add Date
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.holidays.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No blocked holiday dates. Customers can book any working hour weekday.</p>
                      ) : (
                        formData.holidays.map((date) => (
                          <span
                            key={date}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm"
                          >
                            {date}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    holidays: prev.holidays.filter(d => d !== date)
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                                title="Remove Date"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Provider Verification Documents block */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                    <FileText className="h-4 w-4 text-blue-600" /> Verification & Compliance Documents
                  </div>
                  
                  {uploadError && (
                    <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="p-3 mb-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold">
                      {uploadSuccess}
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    {["Identity Proof", "License/Certificate", "Supporting Document"].map((docType) => {
                      const existing = documents.find(d => d.document_type === docType);
                      return (
                        <div key={docType} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{docType}</p>
                            {existing ? (
                              <div className="mt-1 space-y-1">
                                <p className="text-xs text-slate-500 truncate max-w-[250px]">
                                  File: <span className="font-semibold">{existing.file_name}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    existing.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                                    existing.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {existing.status.toUpperCase()}
                                  </span>
                                  <a
                                    href={`${api.defaults.baseURL || ''}/provider/documents/${existing.id}/view`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                                  >
                                    View Document
                                  </a>
                                </div>
                                {existing.status === 'rejected' && existing.rejection_reason && (
                                  <p className="text-xs text-red-500 font-medium italic mt-1">
                                    Rejection Reason: {existing.rejection_reason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic mt-1">No document uploaded yet</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {(!existing || existing.status === 'rejected') && (
                              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                {existing ? 'Re-upload' : 'Upload File'}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleDocumentUpload(docType, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Edit mode action submit button */}
          {isEditing && (
            <button 
              type="submit" 
              disabled={saveLoading} 
              className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              {saveLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Saving changes...</>
              ) : (
                <><Save className="h-5 w-5" /> Save Changes</>
              )}
            </button>
          )}

        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
