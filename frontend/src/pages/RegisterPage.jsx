import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, MapPin, Briefcase, FileText,
  Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, CheckCircle2,
  AlertCircle, ShieldCheck, Star, Wrench
} from 'lucide-react';
import { authService } from '../services/authService';

const CATEGORIES = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Cleaning",
  "AC Repair", "Beautician", "Appliance Repair", "Home Tutor", "Mechanic",
  "Photographer", "Driver", "Gardener", "Cook", "Laptop Repair",
  "Mobile Repair", "Pest Control", "Interior Designer", "Packers & Movers"
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('User'); // 'User' or 'Provider' only

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    pincode: '',
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };

      if (role === 'Provider') {
        payload.provider_category = formData.provider_category;
        payload.experience = formData.experience ? parseInt(formData.experience) : null;
        payload.description = formData.description;
        payload.hourly_rate = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null;
        payload.availability = formData.availability;
      }

      const response = await authService.register(payload);
      if (response.success) {
        setSuccess('Account created successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center py-12 px-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full bg-blue-50/80 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">LocalService</span>
          </Link>
          <p className="text-slate-500 text-sm mt-3">
            {step === 1 ? 'Choose how you want to use LocalService' : 'Fill in your account details below'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-200 text-slate-500'
              }`}>
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span className={`text-xs font-semibold ${s <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                {s === 1 ? 'Account Type' : 'Your Details'}
              </span>
              {s < 2 && <div className={`w-12 h-0.5 ml-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          <div className="p-8 sm:p-10">

            {/* ── STEP 1: Role Selection ── */}
            {step === 1 ? (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-extrabold text-slate-900">Create Your Account</h1>
                  <p className="text-slate-500 text-sm mt-1">Select your account type to get started</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  {/* Customer Card */}
                  <button
                    type="button"
                    onClick={() => setRole('User')}
                    className={`group p-7 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left relative overflow-hidden ${
                      role === 'User'
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-600/10'
                        : 'border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30'
                    }`}
                  >
                    {role === 'User' && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                      role === 'User' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      <User className="h-7 w-7" />
                    </div>
                    <h4 className={`text-lg font-bold mb-1.5 ${role === 'User' ? 'text-blue-700' : 'text-slate-900'}`}>
                      Customer
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Find and book trusted local professionals for any home service.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Book services', 'Track orders', 'Rate providers'].map(f => (
                        <span key={f} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          role === 'User' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>{f}</span>
                      ))}
                    </div>
                  </button>

                  {/* Provider Card */}
                  <button
                    type="button"
                    onClick={() => setRole('Provider')}
                    className={`group p-7 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left relative overflow-hidden ${
                      role === 'Provider'
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-600/10'
                        : 'border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30'
                    }`}
                  >
                    {role === 'Provider' && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                      role === 'Provider' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      <Wrench className="h-7 w-7" />
                    </div>
                    <h4 className={`text-lg font-bold mb-1.5 ${role === 'Provider' ? 'text-blue-700' : 'text-slate-900'}`}>
                      Service Provider
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      List your services, grow your client base and manage bookings.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Earn income', 'Manage schedule', 'Build reputation'].map(f => (
                        <span key={f} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          role === 'Provider' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>{f}</span>
                      ))}
                    </div>
                  </button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-8 mb-8 py-4 border-y border-slate-100">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-blue-600">10k+</p>
                    <p className="text-xs text-slate-500 mt-0.5">Happy Customers</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-blue-600">500+</p>
                    <p className="text-xs text-slate-500 mt-0.5">Verified Providers</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center flex items-center gap-1">
                    <p className="text-xl font-extrabold text-blue-600">4.8</p>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all text-sm"
                >
                  Continue as {role === 'User' ? 'Customer' : 'Service Provider'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-sm text-slate-500 mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

            ) : (
              /* ── STEP 2: Details Form ── */
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">
                      {role === 'Provider' ? 'Provider Details' : 'Account Details'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                        {role === 'User' ? <User className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                        {role === 'User' ? 'Customer' : 'Service Provider'}
                      </span>
                      account
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Change
                  </button>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700 font-medium">{success}</p>
                  </div>
                )}

                {/* Personal Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type="text" name="full_name" required minLength={3}
                        value={formData.full_name} onChange={handleChange}
                        placeholder="John Doe"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type="email" name="email" required
                        value={formData.email} onChange={handleChange}
                        placeholder="you@example.com"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type="tel" name="phone" required minLength={10}
                        value={formData.phone} onChange={handleChange}
                        placeholder="9876543210"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                    <select
                      name="gender" value={formData.gender} onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type="text" name="address" required
                        value={formData.address} onChange={handleChange}
                        placeholder="123 Main Street, Apartment 4B"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      type="text" name="city" required
                      value={formData.city} onChange={handleChange}
                      placeholder="Mumbai"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                    <input
                      type="text" name="state" required
                      value={formData.state} onChange={handleChange}
                      placeholder="Maharashtra"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode</label>
                    <input
                      type="text" name="pincode" required
                      value={formData.pincode} onChange={handleChange}
                      placeholder="400001"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password" required minLength={6}
                        value={formData.password} onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword" required
                        value={formData.confirmPassword} onChange={handleChange}
                        placeholder="Repeat password"
                        className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Provider-only fields */}
                {role === 'Provider' && (
                  <div className="border border-blue-100 bg-blue-50/40 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      <h4 className="font-bold text-slate-800">Professional Details</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Service Category</label>
                        <select
                          name="provider_category" required={role === 'Provider'}
                          value={formData.provider_category} onChange={handleChange}
                          className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        >
                          <option value="">Select Category</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (Years)</label>
                        <input
                          type="number" name="experience" required={role === 'Provider'} min="0"
                          value={formData.experience} onChange={handleChange}
                          placeholder="e.g. 5"
                          className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      {/* Hourly Rate */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hourly Rate (₹)</label>
                        <input
                          type="number" name="hourly_rate" required={role === 'Provider'} min="1"
                          value={formData.hourly_rate} onChange={handleChange}
                          placeholder="e.g. 250"
                          className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">About Your Services</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" style={{width:'1.1rem',height:'1.1rem'}} />
                        <textarea
                          name="description" required={role === 'Provider'}
                          value={formData.description} onChange={handleChange}
                          rows={3}
                          placeholder="Describe your expertise, certifications, and what makes you stand out…"
                          className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Creating account…</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5" /> Create My Account</>
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Your information is encrypted and secure.</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
