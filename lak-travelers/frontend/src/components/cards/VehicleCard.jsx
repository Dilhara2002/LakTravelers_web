import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../services/assets';

const VehicleCard = ({ vehicle, onDelete, user }) => {

  // Edit/Delete බොත්තම් එබූ විට Card එකේ ප්‍රධාන Link එක වැඩ කිරීම වැළැක්වීමට
  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action) action();
  };

  /**
   * පින්තූරයේ URL එක ලබා දෙන Helper Function එක.
   * Cloudinary සහ Localhost යන දෙකටම ගැළපෙන සේ සකසා ඇත.
   */
  const getImageUrl = (imagePath) => resolveAssetUrl(imagePath, 'https://placehold.co/400x300?text=No+Image');

  // පළමු පින්තූරය තෝරා ගැනීම
  const displayImage = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : "";

  return (
    <Link 
      to={`/vehicles/${vehicle._id}`} 
      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block h-full"
    >

      {/* ---------------- 1. IMAGE AREA ---------------- */}
      <div className="relative h-64 w-full overflow-hidden">
        
        <img
          src={getImageUrl(displayImage)}
          alt={vehicle.vehicleModel}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src="https://via.placeholder.com/400x300?text=Vehicle+Image"
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Left: Driver Badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
          <span className="text-yellow-400">👨‍✈️</span> {vehicle.driverName}
        </div>

        {/* Admin Buttons (Vendor/Admin Only) */}
        {user && (user.role === 'vendor' || user.role === 'admin') && (
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <Link
              to={`/edit-vehicle/${vehicle._id}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-blue-600 text-white transition border border-white/30"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </Link>
            <button
              onClick={(e) => handleAction(e, onDelete)}
              className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-red-500 text-white transition border border-white/30"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-4 left-4 z-10">
           <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
             <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">Per Day</span>
             <span className="text-xl font-extrabold text-blue-700">
               LKR {vehicle.pricePerDay ? vehicle.pricePerDay.toLocaleString() : "0"}
             </span>
           </div>
        </div>
      </div>

      {/* ---------------- 2. DETAILS AREA ---------------- */}
      <div className="p-6 relative">
        
        {/* Floating Capacity Pill */}
        <div className="absolute -top-5 right-6 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 border border-gray-700">
          <span>👥</span> {vehicle.capacity} Seats
        </div>

        {/* Title & License Plate */}
        <div className="mb-3">
            <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
            {vehicle.vehicleModel}
            </h3>
            <span className="inline-block mt-1 bg-gray-100 text-gray-500 text-xs font-mono px-2 py-0.5 rounded border border-gray-200">
            {vehicle.licensePlate}
            </span>
        </div>

        {/* Rating & Contact Row */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="bg-green-50 text-green-600 p-1 rounded-full text-xs">📞</span>
                <span className="font-medium">{vehicle.contactNumber}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                <span>⭐</span> {vehicle.rating > 0 ? vehicle.rating.toFixed(1) : "New"}
            </div>
        </div>

        {/* Bottom Action Row */}
        <div className="border-t border-gray-100 pt-4 mt-auto flex justify-between items-center">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Available Now</span>
          <div className="text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Rent this Vehicle 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default VehicleCard;
