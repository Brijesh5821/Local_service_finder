import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Briefcase, FileText, ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Account Type, 2: Account Details
  const [role, setRole] = useState('User'); // 'User', 'Provider', 'Admin'
  
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
    // Provider specific fields
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    "Plumber", "Electrician", "Painter", "Carpenter", "Cleaning",
    "AC Repair", "Beautician", "Appliance Repair", "Home Tutor", "Mechanic",
    "Photographer", "Driver", "Gardener", "Cook", "Laptop Repair",
    "Mobile Repair", "Pest Control", "Interior Designer", "Packers & Movers"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-blue-600 tracking-tight mb-3">
            <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
            <span>LocalService</span>
          </Link>
          <p className="text-slate-500 text-sm">Join the platform to discover premium local services or find new clients</p>
        </div>

        {/* Form Card (Light Theme) */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto">
          {step === 1 ? (
            /* Step 1: Role selection */
            <div>
              <h3 className="text-2xl font-bold text-slate-800 text-center mb-6">Select Your Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* User Card */}
                <div 
                  onClick={() => setRole('User')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${role === 'User' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${role === 'User' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <User className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Customer</h4>
                  <p className="text-xs text-slate-500">Book professional home services with top local providers.</p>
                </div>

                {/* Provider Card */}
                <div 
                  onClick={() => setRole('Provider')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${role === 'Provider' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${role === 'Provider' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Service Provider</h4>
                  <p className="text-xs text-slate-500">List your professional services and boost your business.</p>
                </div>

                {/* Admin Card */}
                <div 
                  onClick={() => setRole('Admin')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${role === 'Admin' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${role === 'Admin' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <User className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Administrator</h4>
                  <p className="text-xs text-slate-500">Manage, monitor and audit the service finder system.</p>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
                >
                  Continue <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Details Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" /> Back
                </button>
                <span className="text-slate-500 text-sm font-semibold">Step 2 of 2: {role} Details</span>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="text" name="full_name" required minLength={3} value={formData.full_name} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="John Doe" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="john@example.com" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="tel" name="phone" required minLength={10} value={formData.phone} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="9876543210" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="text" name="address" required value={formData.address} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="123 Street Address" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="City" />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input type="text" name="state" required value={formData.state} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="State" />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                  <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Pincode" />
                </div>

              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* Provider conditional fields */}
              {role === 'Provider' && (
                <div className="border-t border-slate-200 pt-6 mt-6 space-y-6">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" /> Professional Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                      <select name="provider_category" required={role === 'Provider'} value={formData.provider_category} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Experience (Years)</label>
                      <input type="number" name="experience" required={role === 'Provider'} min="0" value={formData.experience} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="5" />
                    </div>

                    {/* Hourly rate */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate ($)</label>
                      <input type="number" name="hourly_rate" required={role === 'Provider'} min="1" value={formData.hourly_rate} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="50" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Description</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <textarea name="description" required={role === 'Provider'} value={formData.description} onChange={handleChange} rows="3" className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" placeholder="Provide details about your experience, training, and specialization..." />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing registration...</>
                ) : (
                  'Create My Account'
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-500">
                  Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">Log in</Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
