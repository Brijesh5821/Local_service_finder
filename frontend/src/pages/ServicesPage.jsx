import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated API call - In a real app this would use the configured axios instance
    const fetchServices = async () => {
      try {
        // const response = await api.get('/services');
        // setServices(response.data);
        
        // Mock data for initial UI render
        setTimeout(() => {
          setServices([
            { id: 1, title: 'Plumbing Repair', category: 'Home Services', price: '$$' },
            { id: 2, title: 'Electrical Installation', category: 'Home Services', price: '$$$' },
            { id: 3, title: 'Deep Cleaning', category: 'Cleaning', price: '$$' },
            { id: 4, title: 'Lawn Mowing', category: 'Landscaping', price: '$' },
            { id: 5, title: 'Personal Trainer', category: 'Wellness', price: '$$$' },
            { id: 6, title: 'Dog Walking', category: 'Pet Care', price: '$' },
          ]);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch services', error);
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Browse Services</h1>
        <p className="text-lg text-slate-600">Find the perfect professional for your next project.</p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
            placeholder="Search for a service or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(skeleton => (
            <div key={skeleton} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div className="h-10 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length > 0 ? (
            filteredServices.map(service => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {service.category}
                  </span>
                  <span className="text-sm font-medium text-slate-500">{service.price}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">{service.title}</h3>
                <button className="w-full bg-slate-50 hover:bg-slate-100 text-blue-600 font-medium py-2 px-4 rounded-lg border border-slate-200 transition-colors text-center">
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
              No services found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
