import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, ShieldCheck, Zap, Clock, ThumbsUp, Wrench, PenTool, Paintbrush, Droplet, Wind, Sparkles, MonitorSmartphone } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="bg-slate-50">
      
      {/* 1. Hero Section */}
      <section className="relative bg-white pt-20 pb-28 lg:pt-32 lg:pb-40 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-white/20 z-0"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" /> 
                #1 Local Services Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                Quality Home Services, <br/><span className="text-blue-600">On Demand</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
                Experienced, hand-picked professionals to serve you at your doorstep. Book instantly, relax peacefully.
              </p>
              
              {/* Search Box */}
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center gap-2 mb-10 max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center flex-1 w-full sm:w-auto bg-slate-50 rounded-xl px-4 py-3">
                  <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="What do you need help with?" 
                    className="w-full bg-transparent border-none focus:outline-none text-slate-700 ml-3 placeholder-slate-400"
                  />
                </div>
                <div className="hidden sm:flex items-center w-px h-10 bg-slate-200 mx-1"></div>
                <div className="flex items-center flex-1 w-full sm:w-auto bg-slate-50 rounded-xl px-4 py-3">
                  <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Zip code or City" 
                    className="w-full bg-transparent border-none focus:outline-none text-slate-700 ml-3 placeholder-slate-400"
                  />
                </div>
                <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap">
                  Search
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link to="/services" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-md">
                  Book a Service
                </Link>
                <Link to="/services" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
                  Explore Services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Illustration Area */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-[4/3] bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[2rem] border border-blue-100 shadow-2xl flex items-center justify-center">
                
                {/* Abstract Premium Illustration Placeholder */}
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Premium Services</h3>
                  <p className="text-slate-500 mt-2">Illustration Placeholder</p>
                </div>

                {/* Floating Card 1 */}
                <div className="absolute -left-12 top-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 animate-bounce-slow">
                  <div className="bg-emerald-100 p-2.5 rounded-full">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Guarantee</p>
                    <p className="text-sm font-bold text-slate-900">100% Safe</p>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute -right-8 bottom-16 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 animate-bounce-slow" style={{animationDelay: '1s'}}>
                  <div className="bg-amber-100 p-2.5 rounded-full">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Rating</p>
                    <p className="text-sm font-bold text-slate-900">4.9/5 (10k+)</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Popular Categories</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Explore our highly requested services designed for your everyday needs.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { name: 'Electrician', icon: <Zap className="h-8 w-8" />, color: 'bg-yellow-50 text-yellow-600' },
              { name: 'Plumber', icon: <Droplet className="h-8 w-8" />, color: 'bg-blue-50 text-blue-600' },
              { name: 'Carpenter', icon: <PenTool className="h-8 w-8" />, color: 'bg-orange-50 text-orange-600' },
              { name: 'Painter', icon: <Paintbrush className="h-8 w-8" />, color: 'bg-purple-50 text-purple-600' },
              { name: 'Cleaning', icon: <Sparkles className="h-8 w-8" />, color: 'bg-emerald-50 text-emerald-600' },
              { name: 'AC Repair', icon: <Wind className="h-8 w-8" />, color: 'bg-cyan-50 text-cyan-600' },
              { name: 'Beauty', icon: <Star className="h-8 w-8" />, color: 'bg-pink-50 text-pink-600' },
              { name: 'Appliance Repair', icon: <Wrench className="h-8 w-8" />, color: 'bg-slate-100 text-slate-600' }
            ].map((cat, i) => (
              <Link to="/services" key={i} className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Services */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Featured Services</h2>
              <p className="text-lg text-slate-600 max-w-2xl">Top rated professionals ready to assist you today.</p>
            </div>
            <Link to="/services" className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors bg-blue-50 px-5 py-2.5 rounded-full">
              View all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group">
                <div className="h-56 bg-slate-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10"></div>
                  {/* Image Placeholder */}
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 group-hover:scale-105 transition-transform duration-500">
                    Image Placeholder
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Home Service</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">Deep Home Cleaning</h3>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded font-bold text-sm">
                      <Star className="h-4 w-4 fill-current" /> 4.9
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">By UrbanClean Professionals</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Starting at</p>
                      <p className="text-2xl font-bold text-blue-600">$49</p>
                    </div>
                    <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose LocalService?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">We bring the best experts to your doorstep with guaranteed quality and safety.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Verified Professionals', desc: 'Every provider undergoes a strict background check and skill verification.', icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, bg: 'bg-emerald-50' },
              { title: 'Transparent Pricing', desc: 'No hidden fees. Know exactly what you are paying for before you book.', icon: <Zap className="h-8 w-8 text-blue-600" />, bg: 'bg-blue-50' },
              { title: '100% Satisfaction', desc: 'If you are not happy with the service, we will make it right, guaranteed.', icon: <ThumbsUp className="h-8 w-8 text-pink-600" />, bg: 'bg-pink-50' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
                <div className={`w-20 h-20 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Get your tasks done in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-10 transform -translate-y-1/2"></div>
            
            {[
              { step: '1', title: 'Choose Service', desc: 'Select from our wide range of professional services.', icon: <Search className="h-6 w-6 text-white" /> },
              { step: '2', title: 'Book Provider', desc: 'Pick a time and provider that suits your schedule.', icon: <Clock className="h-6 w-6 text-white" /> },
              { step: '3', title: 'Get Work Done', desc: 'Relax while our expert handles the job perfectly.', icon: <Sparkles className="h-6 w-6 text-white" /> }
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="absolute top-0 right-1/2 -mt-3 -mr-10 bg-slate-800 text-xs font-bold px-3 py-1 rounded-full text-blue-400 border border-slate-700">Step {item.step}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Statistics */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-500/50">
            <div>
              <p className="text-4xl md:text-5xl font-extrabold mb-2">2M+</p>
              <p className="text-blue-200 font-medium uppercase tracking-wide text-sm">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold mb-2">50k+</p>
              <p className="text-blue-200 font-medium uppercase tracking-wide text-sm">Verified Providers</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold mb-2">5M+</p>
              <p className="text-blue-200 font-medium uppercase tracking-wide text-sm">Bookings</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold mb-2">120+</p>
              <p className="text-blue-200 font-medium uppercase tracking-wide text-sm">Cities</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Don't just take our word for it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Homeowner', text: '"The easiest way to find reliable help. The plumber arrived on time and fixed the issue in 30 minutes!"' },
              { name: 'Michael Chen', role: 'Business Owner', text: '"We use LocalService for all our office maintenance. Always professional and reasonably priced."' },
              { name: 'Emily Rodriguez', role: 'Working Mom', text: '"Life saver! Booking a deep clean before the holidays took me less than 2 minutes. Highly recommend."' }
            ].map((review, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow relative">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 italic mb-8 text-lg">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{review.name}</h4>
                    <p className="text-sm text-slate-500">{review.role}</p>
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
            
            {/* Background design */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10">
              <div className="absolute -top-24 -right-24 w-96 h-96 border-[40px] border-white rounded-full"></div>
            </div>

            <div className="text-center md:text-left text-white md:w-1/2 relative z-10 mb-10 md:mb-0">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Get the LocalService App</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-md mx-auto md:mx-0">
                Book and manage your services on the go. Get real-time updates and exclusive app-only offers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <button className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg">
                  <MonitorSmartphone className="h-6 w-6" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-semibold text-slate-300">Download on the</p>
                    <p className="text-sm font-bold">App Store</p>
                  </div>
                </button>
                <button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg">
                  <MonitorSmartphone className="h-6 w-6" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-semibold text-slate-500">Get it on</p>
                    <p className="text-sm font-bold">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center relative z-10">
              {/* App Mockup Placeholder */}
              <div className="w-64 h-[500px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 w-full h-6 bg-slate-900 flex justify-center z-20">
                  <div className="w-1/3 h-4 bg-slate-800 rounded-b-xl"></div>
                </div>
                <div className="flex-1 bg-slate-50 pt-10 px-4">
                  <div className="h-20 bg-blue-600 rounded-xl mb-4"></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-24 bg-white rounded-xl shadow-sm"></div>
                    <div className="h-24 bg-white rounded-xl shadow-sm"></div>
                  </div>
                  <div className="h-32 bg-white rounded-xl shadow-sm mb-4"></div>
                  <div className="h-32 bg-white rounded-xl shadow-sm"></div>
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
