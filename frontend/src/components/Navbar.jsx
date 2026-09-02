import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, User, Settings, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const isProvider = user && (user?.role || '').toLowerCase() === 'provider';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: isProvider ? '/provider-dashboard?tab=services' : '/services' },
  ];

  const isLinkActive = (path) => {
    if (path.includes('/provider-dashboard?tab=services')) {
      return location.pathname === '/provider-dashboard' && (location.search.includes('tab=services') || !location.search);
    }
    return location.pathname === path && !location.search;
  };

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.full_name) {
      const parts = user.full_name.trim().split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user.email || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white shadow-sm py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              LocalService
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-blue-600 relative after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full pb-1 ${
                  isLinkActive(link.path) ? 'text-blue-600 after:w-full' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated() ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user?.full_name || user?.email}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to={`/${user?.role}-dashboard`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <User className="h-4 w-4" /> My Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogoutClick}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-blue-600 text-sm font-medium px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <User className="h-4 w-4" />
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                isLinkActive(link.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="border-t border-slate-100 pt-4 mt-3 space-y-2">
            {isAuthenticated() ? (
              <>
                <div className="px-4 py-2 bg-slate-50 rounded-xl mb-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Signed in as</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{user?.full_name || 'User'}</p>
                </div>
                <Link
                  to={`/${user?.role}-dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full text-left py-3 px-4 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-blue-600" /> Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full text-left py-3 px-4 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-blue-600" /> My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full text-left py-3 px-4 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-blue-600" /> Settings
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                  className="w-full text-center py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
