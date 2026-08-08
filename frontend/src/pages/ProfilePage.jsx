import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Clock, FileText, Loader2, CheckCircle2, AlertCircle, Edit2, Save, X, Camera } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getProfile();
      if (data.success && data.user) {
        setProfile(data.user);
        setFormData({
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          profile_image: data.user.profile_image || '',
          gender: data.user.gender || 'Male',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          pincode: data.user.pincode || '',
          provider_category: data.user.provider_category || '',
          experience: data.user.experience || '',
          description: data.user.description || '',
          hourly_rate: data.user.hourly_rate || '',
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
        gender: profile.gender || 'Male',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        provider_category: profile.provider_category || '',
        experience: profile.experience || '',
        description: profile.description || '',
        hourly_rate: profile.hourly_rate || '',
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

      if (profile.role === 'Provider') {
        payload.provider_category = formData.provider_category;
        payload.experience = formData.experience ? parseInt(formData.experience) : null;
        payload.description = formData.description;
        payload.hourly_rate = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null;
        payload.availability = formData.availability;
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
              {/* Profile Image support */}
              <div className="relative">
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
                {isEditing && (
                  <div className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
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
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Profile Image URL */}
              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Profile Image URL</label>
                  <input 
                    type="text" 
                    name="profile_image" 
                    value={formData.profile_image} 
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
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
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

            </div>
          </div>

          {/* Provider details section */}
          {profile.role === 'Provider' && (
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
                      <option value="">Select Category</option>
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
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Hourly Rate ($)</label>
                    <input 
                      type="number" 
                      name="hourly_rate" 
                      disabled={!isEditing}
                      value={formData.hourly_rate} 
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

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
