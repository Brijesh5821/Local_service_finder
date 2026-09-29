import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [gsiRendered, setGsiRendered] = useState(false);

  const googleButtonRef = useRef(null);

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      setError('Google sign-in did not return a valid credential token.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const res = await authService.googleLogin(response.credential);

      if (res.success && res.access_token) {
        login(res.access_token);

        const payload = JSON.parse(atob(res.access_token.split('.')[1]));
        const userRole = payload.role ? payload.role.toLowerCase() : 'user';
        const accountStatus = payload.account_status ? payload.account_status.toLowerCase() : 'approved';

        const pendingId = sessionStorage.getItem('pending_booking_id');
        const redirectTo = location.state?.redirectTo || (pendingId ? `/services?bookServiceId=${pendingId}` : null) || location.state?.from;

        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (userRole === 'user' && accountStatus === 'approved') {
          if (redirectTo) {
            navigate(redirectTo, { state: location.state });
          } else {
            navigate('/user-dashboard');
          }
        } else if (userRole === 'provider' && accountStatus === 'approved') {
          navigate('/provider-dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your-google-client-id.apps.googleusercontent.com') {
      return;
    }

    const initializeGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          if (googleButtonRef.current) {
            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380,
            });
            setGsiRendered(true);
          }
        } catch (e) {
          console.error('Failed to render GSI button:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGSI();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGSI();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredentialResponse]);

  const handleCustomGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your-google-client-id.apps.googleusercontent.com') {
      setError('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in .env.');
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });
        window.google.accounts.id.prompt();
      } catch (err) {
        setError('Failed to launch Google Sign-In prompt.');
      }
    } else {
      setError('Google Sign-In SDK is still loading. Please try again in a moment.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {};
    const emailRes = validateEmail(formData.email);
    if (!emailRes.isValid) errors.email = emailRes.error;
    if (!formData.password) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.success && response.access_token) {
        login(response.access_token);

        const payload = JSON.parse(atob(response.access_token.split('.')[1]));
        const userRole = payload.role ? payload.role.toLowerCase() : 'user';
        const accountStatus = payload.account_status ? payload.account_status.toLowerCase() : 'approved';

        const pendingId = sessionStorage.getItem('pending_booking_id');
        const redirectTo = location.state?.redirectTo || (pendingId ? `/services?bookServiceId=${pendingId}` : null) || location.state?.from;

        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (userRole === 'user' && accountStatus === 'approved') {
          if (redirectTo) {
            navigate(redirectTo, { state: location.state });
          } else {
            navigate('/user-dashboard');
          }
        } else if (userRole === 'provider' && accountStatus === 'approved') {
          navigate('/provider-dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center py-12 px-4">

      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-blue-50/80 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">LocalService</span>
          </Link>
          <p className="text-slate-500 text-sm mt-3">Welcome back! Sign in to your account.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Card Header Accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          <div className="p-8 sm:p-10">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900">Sign In</h1>
              <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm ${
                      fieldErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className={`block w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm ${
                      fieldErrors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-sm text-slate-600 cursor-pointer select-none">
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Authentication Section */}
            <div className="mt-4">
              <div ref={googleButtonRef} className="w-full flex justify-center min-h-[44px]"></div>

              {!gsiRendered && (
                <button
                  type="button"
                  onClick={handleCustomGoogleClick}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all text-sm disabled:opacity-60 cursor-pointer mt-1"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                      <span>Authenticating with Google…</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium">New to LocalService?</span>
              </div>
            </div>

            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Create a free account
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </Link>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Secure, encrypted connection. Your data is safe.</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
