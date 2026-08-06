import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, ShieldCheck, ArrowLeft, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [role, setRole] = useState(null); // 'user', 'provider', 'admin'
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.access_token) {
        // Save to context
        login(response.access_token);
        
        // Decode to know where to route
        const payload = JSON.parse(atob(response.access_token.split('.')[1]));
        const userRole = payload.role;

        if (userRole === 'user') {
          navigate('/user-dashboard');
        } else if (userRole === 'provider') {
          navigate('/provider-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(response.message || 'Invalid Email or Password');
      }
    } catch (err) {
      setError(err.message || 'Invalid Email or Password');
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
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-600 rounded-b-[100px] z-0 hidden md:block"></div>
      
      <div className="max-w-4xl w-full z-10">
        
        <div className="text-center mb-10 md:mb-16">
          <Link to="/" className="inline-block text-2xl font-bold text-blue-600 md:text-white tracking-tight mb-2">
            LocalService
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-white">
            {role ? `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}` : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-slate-600 md:text-blue-100">
            {role ? 'Enter your credentials to access your account' : 'Please select your account type to continue'}
          </p>
        </div>

        {!role ? (
          /* Role Selection State */
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 max-w-3xl mx-auto">
            <h3 className="text-center text-xl font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">Choose Your Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RoleCard 
                type="user" 
                title="Customer" 
                description="Book services and manage your home needs." 
                icon={User} 
              />
              <RoleCard 
                type="provider" 
                title="Service Provider" 
                description="Manage bookings and grow your business." 
                icon={Briefcase} 
              />
              <RoleCard 
                type="admin" 
                title="Administrator" 
                description="System management and oversight." 
                icon={ShieldCheck} 
              />
            </div>
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">Register here</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Login Form State */
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 max-w-md mx-auto">
            <button 
              onClick={() => setRole(null)}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to roles
            </button>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="you@example.com" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="••••••••" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Sign in'}
              </button>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button type="button" className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
