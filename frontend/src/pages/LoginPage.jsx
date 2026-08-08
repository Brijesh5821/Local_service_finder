import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, Sparkles, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
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
        // Save token & user to auth context
        login(response.access_token);
        
        // Decode token to find role
        const payload = JSON.parse(atob(response.access_token.split('.')[1]));
        const userRole = payload.role ? payload.role.toLowerCase() : 'user';

        // Redirect based on role
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-25%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/40 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-25%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/30 blur-[130px] pointer-events-none"></div>

      <div className="max-w-md w-full z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-blue-600 tracking-tight mb-3">
            <Sparkles className="h-8 w-8 text-blue-650 animate-pulse" />
            <span>LocalService</span>
          </Link>
          <p className="text-slate-500 text-sm">Welcome back! Sign in to manage your bookings and services.</p>
        </div>

        {/* Light Theme Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 md:p-10">
          
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Sign In</h3>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="john@example.com" 
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-500 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 bg-white border-slate-300 text-blue-600 focus:ring-blue-500 rounded cursor-pointer" 
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                Remember this device
              </label>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Google OAuth Option */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-500 rounded-full py-0.5">Or continue with</span>
              </div>
            </div>

            <button 
              type="button" 
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Don't have an account? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">Register here</Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
