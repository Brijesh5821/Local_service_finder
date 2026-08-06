import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, ArrowLeft, Mail, Lock, Phone, User as UserIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

const RegisterPage = () => {
  const [role, setRole] = useState(null); // 'user', 'provider'
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role
      };

      const response = await authService.register(payload);
      if (response.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ type, title, description, icon: Icon }) => (
    <div 
      onClick={() => setRole(type)}
      className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
        <Icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-slate-900 rounded-b-[100px] z-0 hidden md:block"></div>
      
      <div className="max-w-4xl w-full z-10">
        
        <div className="text-center mb-10 md:mb-16">
          <Link to="/" className="inline-block text-2xl font-bold text-blue-600 md:text-white tracking-tight mb-2">
            LocalService
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-white">
            {role ? `Create a ${role.charAt(0).toUpperCase() + role.slice(1)} Account` : 'Join LocalService'}
          </h2>
          <p className="mt-2 text-slate-600 md:text-slate-300">
            {role ? 'Fill in your details to get started' : 'Select how you want to use LocalService'}
          </p>
        </div>

        {!role ? (
          /* Role Selection State */
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto">
            <h3 className="text-center text-xl font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">Select Account Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RoleCard 
                type="user" 
                title="Customer" 
                description="I want to book services for my home or business." 
                icon={User} 
              />
              <RoleCard 
                type="provider" 
                title="Service Provider" 
                description="I want to offer my services and find new customers." 
                icon={Briefcase} 
              />
            </div>
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500">
                Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">Log in</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Registration Form State */
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 max-w-xl mx-auto">
            <button 
              onClick={() => setRole(null)}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to account type
            </button>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required minLength={3} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required minLength={10} maxLength={10} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="5551234567" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Create Account'}
              </button>

              <div className="mt-6 text-center text-sm text-slate-600">
                By registering, you agree to our <a href="#" className="font-semibold text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-blue-600 hover:underline">Privacy Policy</a>.
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
