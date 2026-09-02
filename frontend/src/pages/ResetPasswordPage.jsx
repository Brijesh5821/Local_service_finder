import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, MapPin, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { COMMON_WEAK_PASSWORDS } from '../utils/constants';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    const errors = { password: '', confirmPassword: '' };
    if (newPassword) {
      if (newPassword.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      } else if (!/[A-Z]/.test(newPassword)) {
        errors.password = 'Password must contain at least one uppercase letter.';
      } else if (!/[a-z]/.test(newPassword)) {
        errors.password = 'Password must contain at least one lowercase letter.';
      } else if (!/\d/.test(newPassword)) {
        errors.password = 'Password must contain at least one number.';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        errors.password = 'Password must contain at least one special character.';
      } else if (COMMON_WEAK_PASSWORDS.includes(newPassword.toLowerCase())) {
        errors.password = 'Password is too weak or commonly used.';
      }
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (fieldErrors.password || fieldErrors.confirmPassword) {
      setError('Please fix password validation errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.success) {
        setSuccess('Your password has been reset successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(response.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while resetting the password.');
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
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset Password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Enter your new password below.
              </p>
            </div>

            {!token && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  No reset token found. Please check your reset link or generate a new one from the Forgot Password screen.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{success}</p>
              </div>
            )}

            {!success && token && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.password}</p>
                  )}
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!fieldErrors.password || !!fieldErrors.confirmPassword || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center font-semibold">
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

export default ResetPasswordPage;
