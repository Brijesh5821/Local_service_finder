import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, MapPin, Key } from 'lucide-react';
import { authService } from '../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetToken('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSuccess('A password reset link has been generated successfully!');
        if (response.token) {
          setResetToken(response.token);
        }
      } else {
        setError(response.message || 'Failed to process request.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-12 px-4 relative overflow-hidden transition-colors duration-200">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-blue-50/50 dark:bg-blue-900/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">LocalService</span>
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">Reset your account password</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-200">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
          
          <div className="p-8 sm:p-10">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Forgot Password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Enter your email address and we will generate a password reset link for you.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{success}</p>
                </div>
                
                {resetToken && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local Test Helper</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Copy this token to reset your password or click the link below:
                    </p>
                    <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg select-all font-mono text-xs break-all text-slate-800 dark:text-slate-200">
                      {resetToken}
                    </div>
                    <Link 
                      to={`/reset-password?token=${resetToken}`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold mt-2"
                    >
                      <Key className="h-3.5 w-3.5" /> Go to Reset Screen
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating link…</> : 'Generate Reset Link'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
