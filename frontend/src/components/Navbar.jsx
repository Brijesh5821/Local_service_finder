import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, Search, User, Settings, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
  ];

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  // Get User Initials for Avatar
  const getUserInitials = () => {
    if (!user) return '?';
    if (user.full_name) {
      const parts = user.full_name.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-blue-600 group">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <MapPin className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">LocalService</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-sm font-medium transition-colors hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full pb-1 ${location.pathname === link.path ? 'text-blue-600 after:w-full' : 'text-slate-600'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors hover:bg-slate-50 rounded-full">
              <Search className="h-5 w-5" />
            </button>
            
            {isAuthenticated() ? (
              /* User is logged in dropdown menu */
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user?.full_name || user?.email}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Logged In As</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link 
                      to={`/${user?.role}-dashboard`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>

                    <Link 
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </Link>

                    <Link 
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>

                    <hr className="my-1 border-slate-100" />

                    <button 
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all font-medium"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Before login links */
              <>
                <Link to="/login" className="text-slate-600 hover:text-blue-600 text-sm font-medium px-2 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                  <User className="h-4 w-4" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-x-0 top-[72px] bg-white border-t border-slate-100 shadow-xl transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${location.pathname === link.path ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="border-t border-slate-100 pt-4 mt-4 px-2 space-y-3">
            {isAuthenticated() ? (
              <>
                <div className="px-4 py-2 bg-slate-50 rounded-xl mb-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Logged In As</p>
                  <p className="text-sm font-bold text-slate-800">{user?.full_name || 'User'}</p>
                </div>
                <Link 
                  to={`/${user?.role}-dashboard`}
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block w-full text-center py-3 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block w-full text-center py-3 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Profile
                </Link>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                  className="block w-full text-center py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block w-full text-center py-3 text-slate-700 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Register
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
