import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-white mb-6 group">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight">LocalService</span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
              Connecting you with the best local professionals. Find trusted services in your neighborhood quickly and easily. High quality, verified, and ready to help.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-400 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Customers</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/services" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> How to use</Link></li>
              <li><Link to="/services" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> Get Quotes</Link></li>
              <li><Link to="/services" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> Pricing</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Providers</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/register" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> Join as a Pro</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> Success Stories</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-colors" /> Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Contact Us</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <div className="bg-slate-800 p-2 rounded-lg text-blue-400 flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>123 Innovation Drive,<br/>Tech City, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg text-blue-400 flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg text-blue-400 flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <span>support@localservice.com</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} LocalService Finder. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/" className="hover:text-slate-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
