import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../services/assets';

const TourCard = ({ tour, onDelete, user }) => {

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

  return (
    <Link 
      to={`/tours/${tour._id}`} 
      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block h-full"
    >

      {/* ---------------- 1. IMAGE AREA ---------------- */}
      <div className="relative h-72 w-full overflow-hidden">
        
        <img
          src={getImageUrl(tour.image)}
          alt={tour.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src="https://via.placeholder.com/400x300?text=Image+Not+Found"
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Left: Duration Badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1">
          <span>⏳</span> {tour.duration}
        </div>

        {/* Top Right: Admin Buttons (Vendor/Admin Only) */}
        {user && (user.role === 'vendor' || user.role === 'admin') && (
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <Link
              to={`/edit-tour/${tour._id}`}
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

        {/* Bottom Left: Price Badge */}
        <div className="absolute bottom-4 left-4 z-10">
           <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
             <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">Per Person</span>
             <span className="text-xl font-extrabold text-green-700">
               LKR {tour.price ? tour.price.toLocaleString() : "0"}
             </span>
           </div>
        </div>
      </div>

      {/* ---------------- 2. DETAILS AREA ---------------- */}
      <div className="p-6 relative">
        
        {/* Floating Destination Pill */}
        <div className="absolute -top-5 right-6 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 max-w-[150px] truncate">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          <span className="truncate">{tour.destinations}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors truncate">
          {tour.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
          {tour.description}
        </p>

        {/* Bottom Info Row */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
            <span>⭐</span> {tour.rating > 0 ? tour.rating.toFixed(1) : "New"}
          </div>
          <div className="text-green-600 text-sm font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
            View Package 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default TourCard;
