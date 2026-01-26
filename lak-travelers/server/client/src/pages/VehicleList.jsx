import { useEffect, useState } from 'react';
import API from '../services/api'; 
import VehicleCard from '../components/cards/VehicleCard';
import { Link } from 'react-router-dom';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // 1. Securely retrieve user information from localStorage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("userInfo");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    /**
     * Fetch the complete list of available vehicles from the system
     */
    const fetchVehicles = async () => {
        try {
            const { data } = await API.get('/vehicles');
            setVehicles(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    /**
     * Remove a vehicle from the system (Delete Handler)
     */
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this vehicle? 🗑️")) {
            try {
                // Using the API instance ensures JWT cookies are sent automatically
                await API.delete(`/vehicles/${id}`);
                setVehicles(vehicles.filter((v) => v._id !== id));
                alert("Vehicle removed successfully! ✅");
            } catch (error) {
                console.error("Delete Error:", error);
                alert(error.response?.data?.message || "Failed to delete. You are not authorized.");
            }
        }
    };

    /**
     * Search engine logic (Filter by model or type)
     */
    const filteredVehicles = vehicles.filter((vehicle) =>
        vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * Skeleton Card component displayed while data is loading
     */
    const SkeletonCard = () => (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-2xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mt-12">
            <div className="max-w-7xl mx-auto">

                {/* --- 1. HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Rent a Vehicle 🚗
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Find comfortable vehicles with experienced drivers for your Sri Lankan journey.
                        </p>
                    </div>

                    {/* Register Vehicle Button (Accessible to Vendors and Admins only) */}
                    {user && (user.role === 'vendor' || user.role === 'admin') && (
                        <Link
                            to="/add-vehicle"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Register New Vehicle
                        </Link>
                    )}
                </div>

                {/* --- 2. SEARCH BAR --- */}
                <div className="relative mb-12 max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by vehicle model or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 text-lg"
                    />
                </div>

                {/* --- 3. VEHICLES GRID --- */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SkeletonCard key={n} />)}
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    // Empty State UI
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-inner">
                        <div className="inline-block p-6 rounded-full bg-gray-50 mb-6 text-5xl">
                            🚙
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">No vehicles available</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">We couldn't find any results for "{searchTerm}". Try another search or check back later.</p>
                        <button 
                            onClick={() => setSearchTerm("")}
                            className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredVehicles.map((vehicle) => (
                            <VehicleCard 
                                key={vehicle._id} 
                                vehicle={vehicle}
                                onDelete={() => handleDelete(vehicle._id)}
                                user={user}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleList;