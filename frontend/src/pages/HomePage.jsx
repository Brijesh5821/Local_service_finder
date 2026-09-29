import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, ShieldCheck, Zap, ThumbsUp, Wrench, Paintbrush, Droplet, Wind, Sparkles } from 'lucide-react';
import { providerService } from '../services/providerService';
import { reviewService } from '../services/reviewService';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user && ['admin', 'system_admin'].includes(user.role?.toLowerCase());

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState(false);

  const [popularServices, setPopularServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && user) {
      const role = (user.role || '').toLowerCase();
      if (role.includes('admin')) {
        navigate('/admin-dashboard', { replace: true });
      } else if (role.includes('provider')) {
        navigate('/provider-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedProviders = async () => {
      try {
        setLoadingProviders(true);
        setProvidersError(false);
        const res = await providerService.getProviders({ sort_by: 'rating', limit: 3 });
        if (isMounted) {
          const providerList = res?.providers || res?.items || (Array.isArray(res) ? res : []);
          setFeaturedProviders(providerList);
        }
      } catch (err) {
        console.error('Failed to fetch featured providers:', err);
        if (isMounted) {
          setProvidersError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingProviders(false);
        }
      }
    };

    fetchFeaturedProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchPopularServices = async () => {
      try {
        setLoadingServices(true);
        setServicesError(false);
        const res = await api.get('/services/', { params: { limit: 3, sort_by: 'rating' } });
        if (isMounted) {
          const serviceList = res.data?.services || res.data?.items || (Array.isArray(res.data) ? res.data : []);
          setPopularServices(serviceList);
        }
      } catch (err) {
        console.error('Failed to fetch popular services:', err);
        if (isMounted) {
          setServicesError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingServices(false);
        }
      }
    };

    fetchPopularServices();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        setReviewsError(false);
        const res = await reviewService.getRecentReviews(3);
        if (isMounted) {
          const reviewList = res?.reviews || (Array.isArray(res) ? res : []);
          setReviews(reviewList);
        }
      } catch (err) {
        console.error('Failed to fetch customer reviews:', err);
        if (isMounted) {
          setReviewsError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingReviews(false);
        }
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to services page with filters
    navigate(`/services?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  const handleBookNowClick = (service) => {
    if (isAdmin) {
      alert('System Admin users cannot create service bookings.');
      return;
    }
    const serviceId = service.id || service._id;
    const targetUrl = `/services?bookServiceId=${serviceId}`;
    if (!isAuthenticated()) {
      sessionStorage.setItem('pending_booking_id', serviceId);
      sessionStorage.setItem('pending_booking_service', JSON.stringify(service));
      navigate('/login', { state: { redirectTo: targetUrl, selectedService: service } });
    } else {
      navigate(targetUrl, { state: { selectedService: service } });
    }
  };

  const popularCategories = [
    { name: 'Plumber', icon: <Droplet className="h-6 w-6" />, count: '2,400+ Pros' },
    { name: 'Electrician', icon: <Zap className="h-6 w-6" />, count: '3,100+ Pros' },
    { name: 'Painter', icon: <Paintbrush className="h-6 w-6" />, count: '1,800+ Pros' },
    { name: 'Cleaning', icon: <Sparkles className="h-6 w-6" />, count: '4,200+ Pros' },
    { name: 'AC Repair', icon: <Wind className="h-6 w-6" />, count: '1,500+ Pros' },
    { name: 'Appliance Repair', icon: <Wrench className="h-6 w-6" />, count: '2,900+ Pros' }
  ];

  return (
    <div className="bg-white min-h-screen pt-16">
      
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white py-24 lg:py-32 overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute top-[-30%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Text & Search */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} /> 
                Premium Home Services Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Expert Home Services,<br/>
                <span className="text-blue-500">Delivered Instantly</span>
              </h1>
              
              <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0">
                Book verified plumbers, electricians, cleaners, and other professionals at transparent, fixed rates.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-slate-700/60 shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto lg:mx-0 mb-8">
                <div className="flex items-center flex-1 w-full bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/40">
                  <Search className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Wrench, cleaner, electrician..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-white ml-3 placeholder-slate-500 text-sm"
                  />
                </div>
                
                <div className="flex items-center flex-1 w-full bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/40">
                  <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="City or Pincode" 
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-white ml-3 placeholder-slate-500 text-sm"
                  />
                </div>
                
                <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 whitespace-nowrap text-sm">
                  Search Pros
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-slate-400">
                <span>Popular:</span>
                {['Cleaning', 'AC Repair', 'Plumbing'].map((pop) => (
                  <button 
                    key={pop}
                    type="button"
                    onClick={() => setSearchQuery(pop)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700/50"
                  >
                    {pop}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium App Presentation Graphic */}
            <div className="lg:col-span-5 hidden lg:flex justify-center relative">
              <div className="relative w-72 h-[500px] bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 w-full h-6 bg-slate-950 flex justify-center z-20">
                  <div className="w-1/3 h-4 bg-slate-900 rounded-b-xl"></div>
                </div>
                <div className="flex-1 bg-slate-950 pt-10 px-4 flex flex-col justify-between pb-8">
                  <div className="space-y-4">
                    <div className="h-12 bg-blue-600/20 border border-blue-500/20 rounded-xl flex items-center justify-between px-3">
                      <span className="text-xs font-bold text-blue-400">LocalService App</span>
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Next Booking</p>
                      <p className="text-xs font-bold text-white mt-1">Deep Home Cleaning</p>
                      <p className="text-[10px] text-blue-400 mt-0.5 font-medium">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-xl text-center shadow-lg shadow-blue-600/30">
                    <p className="text-xs font-bold text-white">Book Your First Service</p>
                    <p className="text-[9px] text-blue-100 mt-0.5">Get 20% off with code FIRST20</p>
                  </div>
                </div>
              </div>
              {/* Floating Card */}
              <div className="absolute -left-8 top-1/4 bg-slate-800 border border-slate-700/80 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">100% Insured</p>
                  <p className="text-[10px] text-slate-400">Satisfaction Guaranteed</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Popular Categories</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Browse through our highly requested everyday home repair and care services.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularCategories.map((cat, i) => (
              <Link 
                to={`/services?category=${cat.name}`} 
                key={i} 
                className="group p-6 bg-slate-50/60 hover:bg-white rounded-2xl border border-[#D1D9E6] hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-center h-full min-h-[175px] w-full"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-sm text-center group-hover:text-blue-600 transition-colors leading-tight">{cat.name}</h3>
                <p className="text-xs text-slate-400 text-center mt-1.5 font-medium">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Providers */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Top Featured Providers</h2>
              <p className="text-lg text-slate-500 max-w-xl">Book top-rated, certified service providers verified by the LocalService team.</p>
            </div>
            <Link to="/services" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg hover:shadow-blue-500/25 text-sm">
              View All Providers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingProviders ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-6"></div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : providersError ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                Unable to load providers at this time.
              </div>
            ) : featuredProviders.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                No service providers available.
              </div>
            ) : (
              featuredProviders.map((provider, index) => {
                const name = provider.full_name || provider.name || 'Service Pro';
                const image = provider.profile_image || provider.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                const category = provider.provider_category || provider.category || 'General Service';
                const tagline = provider.description || provider.tagline || provider.bio || 'Verified service provider offering quality home services.';
                const rawRating = provider.average_rating ?? provider.rating ?? 5.0;
                const rating = typeof rawRating === 'number' ? rawRating.toFixed(1) : rawRating;
                const reviews = provider.review_count ?? provider.reviews ?? 0;
                const hourlyRate = provider.hourly_rate ?? provider.price_value ?? provider.price ?? 0;

                return (
                  <div key={provider.id || provider._id || index} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl transition-all group duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={image} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/20" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{name}</h4>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{category}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-6">{tagline}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-slate-800">{rating}</span>
                        <span className="text-xs text-slate-400">({reviews} reviews)</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-blue-600">₹{hourlyRate}</span>
                        <span className="text-xs text-slate-400">/hr</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 4. Popular Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Popular On-Demand Services</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Explore handpicked services booked repeatedly by our homeowners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingServices ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-9 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : servicesError ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                Unable to load services at this time.
              </div>
            ) : popularServices.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                No services currently available.
              </div>
            ) : (
              popularServices.map((service, idx) => {
                const title = service.title || service.name || 'Home Service';
                const category = service.category_name || service.category || 'General Service';
                const rawRating = service.average_rating ?? service.rating ?? 5.0;
                const rating = typeof rawRating === 'number' ? rawRating.toFixed(1) : rawRating;
                const price = service.price_value ?? service.hourly_rate ?? service.price ?? 0;
                const image = service.image || service.provider_image || (
                  category.toLowerCase().includes('clean') ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' :
                  category.toLowerCase().includes('electric') ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80' :
                  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&auto=format&fit=crop&q=80'
                );

                return (
                  <div key={service.id || service._id || idx} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                    <div className="h-48 relative overflow-hidden bg-slate-200">
                      <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider">
                        {category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{title}</h3>
                        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold shrink-0">
                          <Star className="h-3.5 w-3.5 fill-current" /> {rating}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Starting cost</p>
                          <p className="text-2xl font-black text-slate-950">₹{price}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleBookNowClick(service)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why LocalService?</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">We connect you with high-quality services and trusted providers under one roof.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% Insured & Verified</h3>
              <p className="text-sm text-slate-500">Every technician is background-checked and credential-verified before their profile goes live.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">On-Demand Booking</h3>
              <p className="text-sm text-slate-500">Get instant access to available time slots. Select a professional, confirm a time, and relax.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <ThumbsUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Guaranteed Satisfaction</h3>
              <p className="text-sm text-slate-500">Your happiness is our priority. If you are not satisfied with the job quality, we will fix it for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}

      {/* 7. Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">What Our Clients Say</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Read honest feedback and service ratings submitted by real customers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingReviews ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between h-full animate-pulse">
                  <div className="space-y-3">
                    <div className="flex gap-1 mb-4">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200/50">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : reviewsError ? (
              <div className="col-span-full text-center py-8 text-slate-500 font-medium">
                Unable to load reviews at this time.
              </div>
            ) : reviews.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 font-medium">
                No reviews yet
              </div>
            ) : (
              reviews.map((rev, i) => {
                const name = rev.customer_name || rev.name || 'Customer';
                const role = rev.customer_role || rev.role || 'Verified Customer';
                const quote = rev.review_text || rev.comment || rev.content || rev.quote || '';
                const rating = Math.min(5, Math.max(1, parseInt(rev.rating || 5, 10)));
                const initial = name[0]?.toUpperCase() || 'C';

                return (
                  <div key={rev.id || rev._id || i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <p className="text-slate-600 italic text-base">"{quote}"</p>
                    </div>
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200/50">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {initial}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{name}</h5>
                        <p className="text-xs text-slate-400 font-medium">{role}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>



    </div>
  );
};

export default HomePage;
