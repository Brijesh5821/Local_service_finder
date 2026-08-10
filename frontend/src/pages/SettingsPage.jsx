import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Shield, Smartphone, Trash2, Key, Globe,
  ChevronRight, CheckCircle2, AlertTriangle,
  Lock, Mail, Eye, EyeOff, Loader2, Info, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Reusable Toggle ── */
const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/* ── Section Wrapper ── */
const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </div>
);

/* ── Setting Row ── */
const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SettingsPage = () => {
  const { user, logout } = useAuth();

  /* ── Notification Settings ── */
  const [notifs, setNotifs] = useState({
    emailBookings: true,
    emailPromotions: false,
    pushBookings: true,
    pushUpdates: true,
    smsAlerts: false,
  });
  const toggleNotif = (key) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Application Settings ── */
  const [app, setApp] = useState({
    darkMode: false,
    compactView: false,
    language: 'en',
    currency: 'INR',
  });

  /* ── Security Settings ── */
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  /* ── Account danger zone ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ── Active Tab ── */
  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'application', label: 'Application', icon: Smartphone },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];
  const [activeTab, setActiveTab] = useState('notifications');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setPwLoading(false);
    setPwSuccess('Password updated successfully!');
    setPwForm({ current: '', newPw: '', confirm: '' });
    setTimeout(() => setPwSuccess(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link to={`/${user?.role}-dashboard`} className="hover:text-blue-600 transition-colors font-medium">Dashboard</Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="text-slate-800 font-semibold">Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1.5">Manage your preferences, security and account.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar Tabs ── */}
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="space-y-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 space-y-6">

            {/* ════ NOTIFICATIONS ════ */}
            {activeTab === 'notifications' && (
              <>
                <Section
                  icon={Mail}
                  title="Email Notifications"
                  description="Control what LocalService sends to your email inbox"
                >
                  <SettingRow label="Booking Confirmations" description="Receive confirmation emails for new bookings and updates">
                    <Toggle checked={notifs.emailBookings} onChange={() => toggleNotif('emailBookings')} id="email-bookings" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow label="Promotional Emails" description="Special offers, discounts and service announcements">
                    <Toggle checked={notifs.emailPromotions} onChange={() => toggleNotif('emailPromotions')} id="email-promos" />
                  </SettingRow>
                </Section>

                <Section
                  icon={Bell}
                  title="Push Notifications"
                  description="Browser and mobile push notifications"
                >
                  <SettingRow label="Booking Status Updates" description="Get notified when your booking status changes">
                    <Toggle checked={notifs.pushBookings} onChange={() => toggleNotif('pushBookings')} id="push-bookings" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow label="Platform Updates" description="News and feature updates from LocalService">
                    <Toggle checked={notifs.pushUpdates} onChange={() => toggleNotif('pushUpdates')} id="push-updates" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow label="SMS Alerts" description="Critical alerts via text message (carrier rates may apply)">
                    <Toggle checked={notifs.smsAlerts} onChange={() => toggleNotif('smsAlerts')} id="sms-alerts" />
                  </SettingRow>
                </Section>
              </>
            )}

            {/* ════ APPLICATION ════ */}
            {activeTab === 'application' && (
              <>
                <Section
                  icon={Smartphone}
                  title="Display Preferences"
                  description="Customize how the application looks and feels"
                >
                  <SettingRow label="Dark Mode" description="Switch to a dark color theme (coming soon)">
                    <Toggle checked={app.darkMode} onChange={(v) => setApp(p => ({ ...p, darkMode: v }))} id="dark-mode" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow label="Compact View" description="Show more content with a condensed layout">
                    <Toggle checked={app.compactView} onChange={(v) => setApp(p => ({ ...p, compactView: v }))} id="compact-view" />
                  </SettingRow>
                </Section>

                <Section
                  icon={Globe}
                  title="Regional Settings"
                  description="Language, currency and locale preferences"
                >
                  <SettingRow label="Language">
                    <select
                      value={app.language}
                      onChange={(e) => setApp(p => ({ ...p, language: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                      <option value="ta">Tamil</option>
                    </select>
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow label="Currency">
                    <select
                      value={app.currency}
                      onChange={(e) => setApp(p => ({ ...p, currency: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </SettingRow>
                </Section>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Some display settings are being rolled out progressively. Full support coming in the next update.
                  </p>
                </div>
              </>
            )}

            {/* ════ SECURITY ════ */}
            {activeTab === 'security' && (
              <>
                {/* Change Password */}
                <Section
                  icon={Key}
                  title="Change Password"
                  description="Update your login password to keep your account secure"
                >
                  {pwError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {pwSuccess}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          required value={pwForm.current}
                          onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showNew ? 'text' : 'password'}
                          required minLength={6}
                          value={pwForm.newPw}
                          onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                          placeholder="Min. 6 characters"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={pwForm.confirm}
                          onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                          placeholder="Repeat new password"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 shadow-sm"
                    >
                      {pwLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><Key className="h-4 w-4" /> Update Password</>}
                    </button>
                  </form>
                </Section>

                {/* Advanced Security */}
                <Section
                  icon={Shield}
                  title="Advanced Security"
                  description="Extra layers of protection for your account"
                >
                  <SettingRow
                    label="Two-Factor Authentication"
                    description="Require a verification code in addition to your password (coming soon)"
                  >
                    <Toggle checked={twoFA} onChange={setTwoFA} id="2fa" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <SettingRow
                    label="Login Activity Alerts"
                    description="Get notified via email whenever a new device signs in to your account"
                  >
                    <Toggle checked={loginAlerts} onChange={setLoginAlerts} id="login-alerts" />
                  </SettingRow>
                  <div className="border-t border-slate-100" />
                  <div className="py-1">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Active Sessions</p>
                    <p className="text-xs text-slate-500 mb-3">You are currently signed in on 1 device.</p>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Lock className="h-4 w-4" /> Sign Out All Devices
                    </button>
                  </div>
                </Section>
              </>
            )}

            {/* ════ ACCOUNT ════ */}
            {activeTab === 'account' && (
              <>
                <Section
                  icon={User}
                  title="Account Information"
                  description="Your current account details"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Name</p>
                        <p className="text-sm font-bold text-slate-800">{user?.full_name || '—'}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-bold text-slate-800">{user?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Account Type</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                          {user?.role || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      to={`/${user?.role}-dashboard`}
                      className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </Section>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-red-100 bg-red-50/50">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-800 text-base">Danger Zone</h3>
                      <p className="text-xs text-red-500 mt-0.5">Irreversible actions — proceed with care</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                      Permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
                    </p>
                    {showDeleteConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <p className="text-sm font-bold">Are you absolutely sure?</p>
                        </div>
                        <p className="text-xs text-red-600 mb-4">
                          All your bookings, profile data and history will be permanently erased.
                        </p>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">
                            Yes, Delete My Account
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-300 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl text-sm transition-all"
                      >
                        <Trash2 className="h-4 w-4" /> Delete My Account
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
