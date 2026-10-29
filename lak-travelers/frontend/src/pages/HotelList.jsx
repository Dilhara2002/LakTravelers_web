import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api'; 
import HotelCard from "../components/cards/HotelCard";

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  // 🔐 Retrieve user info (Memoized to prevent unnecessary re-renders)
  const user = useMemo(() => {
    try {
      const savedUser = localStorage.getItem("userInfo");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * 📡 Fetch all hotels from the system
   */
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/hotels');
        setHotels(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError("Failed to load hotels. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  /**
   * 🗑️ Delete Handler for removing a hotel listing
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel? 🗑️")) return;

    try {
      await API.delete(`/hotels/${id}`);
      setHotels(prev => prev.filter((h) => h._id !== id));
      alert("Hotel removed successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Unauthorized: You cannot delete this listing.");
    }
  };

  /**
   * 🔍 Filter hotels based on the search term
   */
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hotels, searchTerm]);

  /**
   * 🦴 Skeleton Loader UI for better UX during loading
   */
  const SkeletonCard = () => (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-4 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-3xl mb-4"></div>
      <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto">
        
        {/* --- 1. Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="animate-fade-in">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              Luxury Hotels 🏨
            </h1>
            <p className="text-gray-500 mt-3 text-lg font-medium">
              Discover the perfect stay for your Sri Lankan adventure.
            </p>
          </div>

          {user && (user.role === 'vendor' || user.role === 'admin') && (
            <Link
              to="/add-hotel"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              List Your Hotel
            </Link>
          )}
        </div>

        {/* --- 2. Search Section --- */}
        <div className="relative mb-16 max-w-2xl group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-slate-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Where are you going? (e.g. Nuwara Eliya, Galle)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-8 py-5 bg-white border border-gray-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-gray-700 text-lg"
          />
        </div>

        {/* --- 3. Main Grid / Content --- */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, n) => <SkeletonCard key={n} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-[3rem] border border-red-100">
            <p className="text-red-600 font-bold text-lg">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-slate-900 underline font-bold">Try Refreshing</button>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-inner">
            <div className="inline-block p-8 rounded-full bg-gray-50 mb-6 text-6xl">🔍</div>
            <h3 className="text-2xl font-bold text-slate-900">No results found</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">We couldn't find any hotels matching "{searchTerm}". Try another location.</p>
            <button 
              onClick={() => setSearchTerm("")}
              className="mt-8 bg-slate-900 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                onDelete={() => handleDelete(hotel._id)}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelList;
