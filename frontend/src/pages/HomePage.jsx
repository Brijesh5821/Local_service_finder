import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, ShieldCheck, Zap, Clock, ThumbsUp, Wrench, Paintbrush, Droplet, Wind, Sparkles, MonitorSmartphone, Trophy, CheckCircle, Users } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to services page with filters
    navigate(`/services?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  const popularCategories = [
    { name: 'Plumber', icon: <Droplet className="h-6 w-6" />, count: '2,400+ Pros' },
    { name: 'Electrician', icon: <Zap className="h-6 w-6" />, count: '3,100+ Pros' },
    { name: 'Painter', icon: <Paintbrush className="h-6 w-6" />, count: '1,800+ Pros' },
    { name: 'Cleaning', icon: <Sparkles className="h-6 w-6" />, count: '4,200+ Pros' },
    { name: 'AC Repair', icon: <Wind className="h-6 w-6" />, count: '1,500+ Pros' },
    { name: 'Appliance Repair', icon: <Wrench className="h-6 w-6" />, count: '2,900+ Pros' }
  ];

  const featuredProviders = [
    {
      name: 'Alex Rivera',
      category: 'Electrician',
      rating: 4.9,
      reviews: 142,
      hourly_rate: 65,
      image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
      tagline: 'Specialist in smart home integration & safety audits.'
    },
    {
      name: 'Maria Santos',
      category: 'Cleaning',
      rating: 5.0,
      reviews: 310,
      hourly_rate: 40,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      tagline: 'Eco-friendly deep cleaning & post-construction setup.'
    },
    {
      name: 'David Miller',
      category: 'Plumber',
      rating: 4.8,
      reviews: 98,
      hourly_rate: 75,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      tagline: 'Emergency leaks, drain cleaning, and water heater installs.'
    }
  ];

  const popularServices = [
    { title: 'Full Home Deep Cleaning', price: 120, category: 'Cleaning', rating: 4.9, image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' },
    { title: 'Ceiling Fan & Light Install', price: 75, category: 'Electrician', rating: 4.8, image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80' },
    { title: 'Kitchen Pipe Leak Repair', price: 90, category: 'Plumber', rating: 5.0, image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&auto=format&fit=crop&q=80' }
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
                className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
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
            {featuredProviders.map((provider, index) => (
              <div key={index} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl transition-all group duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <img src={provider.image} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/20" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{provider.name}</h4>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{provider.category}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-6">{provider.tagline}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-800">{provider.rating}</span>
                    <span className="text-xs text-slate-400">({provider.reviews} reviews)</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-blue-600">${provider.hourly_rate}</span>
                    <span className="text-xs text-slate-400">/hr</span>
                  </div>
                </div>
              </div>
            ))}
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
            {popularServices.map((service, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                <div className="h-48 relative overflow-hidden bg-slate-200">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider">
                    {service.category}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{service.title}</h3>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold shrink-0">
                      <Star className="h-3.5 w-3.5 fill-current" /> {service.rating}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Starting cost</p>
                      <p className="text-2xl font-black text-slate-950">${service.price}</p>
                    </div>
                    <Link to="/services" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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

      {/* 6. Statistics */}
      <section className="py-20 bg-blue-600 text-white font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-blue-500/50">
            <div className="flex flex-col items-center justify-center p-4">
              <Users className="h-8 w-8 mb-3 text-blue-200" />
              <p className="text-4xl md:text-5xl font-black mb-1">50,000+</p>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Verified Providers</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <CheckCircle className="h-8 w-8 mb-3 text-blue-200" />
              <p className="text-4xl md:text-5xl font-black mb-1">2.4 Million</p>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Completed Bookings</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Star className="h-8 w-8 mb-3 text-blue-200" />
              <p className="text-4xl md:text-5xl font-black mb-1">4.9 / 5</p>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Average Rating</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Trophy className="h-8 w-8 mb-3 text-blue-200" />
              <p className="text-4xl md:text-5xl font-black mb-1">100%</p>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Service Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">What Our Clients Say</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Read honest feedback and service ratings submitted by real customers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Homeowner', quote: 'The plumber arrived exactly on time and repaired the kitchen pipe leak in 30 minutes! Highly professional.' },
              { name: 'Marcus Chen', role: 'Apartment Tenant', quote: 'Deep cleaning service was incredible. The team brought their own tools and left the house sparkling clean.' },
              { name: 'Emily Rodriguez', role: 'Working Mom', quote: 'Amazing service. Finding an electrician for a quick fixture replacement took me less than 2 minutes.' }
            ].map((test, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between h-full">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 italic text-base">"{test.quote}"</p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200/50">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {test.name[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{test.name}</h5>
                    <p className="text-xs text-slate-400 font-medium">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Download App */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
            
            <div className="text-center md:text-left text-white md:w-1/2 relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Get the LocalService App</h2>
              <p className="text-blue-200 text-lg mb-10 max-w-md mx-auto md:mx-0">
                Book and manage your service orders on the go. Get real-time order status updates and exclusive offers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <button className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg border border-slate-800">
                  <MonitorSmartphone className="h-6 w-6 text-blue-500" />
                  <div className="text-left">
                    <p className="text-[9px] uppercase font-semibold text-slate-400">Download on the</p>
                    <p className="text-sm font-bold">App Store</p>
                  </div>
                </button>
                <button className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg">
                  <MonitorSmartphone className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="text-[9px] uppercase font-semibold text-slate-500">Get it on</p>
                    <p className="text-sm font-bold">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center relative z-10 mt-12 md:mt-0">
              <div className="w-56 h-[400px] bg-slate-950 rounded-[2.5rem] border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 w-full h-5 bg-slate-950 flex justify-center z-20">
                  <div className="w-1/3 h-3 bg-slate-900 rounded-b-lg"></div>
                </div>
                <div className="flex-1 bg-slate-950 pt-8 px-4 flex flex-col justify-between pb-6">
                  <div className="space-y-3">
                    <div className="h-10 bg-blue-600/20 border border-blue-500/20 rounded-xl flex items-center justify-between px-3">
                      <span className="text-[10px] font-bold text-blue-400">LocalService</span>
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-xl text-center shadow-lg">
                    <p className="text-[10px] font-bold text-white">Book Your First Service</p>
                    <p className="text-[8px] text-blue-100">Get 20% off with code FIRST20</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
