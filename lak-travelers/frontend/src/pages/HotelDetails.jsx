import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import { toast } from 'react-toastify';
import { resolveAssetUrl } from '../services/assets';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hotel, setHotel] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(true);

  // Review State
  const [rating, setRating] = useState(0); 
  const [comment, setComment] = useState('');
  
  const user = JSON.parse(localStorage.getItem('userInfo'));

  /**
   * හෝටල් තොරතුරු ලබා ගැනීම
   */
  const fetchHotel = useCallback(async () => {
    try {
      const { data } = await API.get(`/hotels/${id}`);
      setHotel(data);
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load hotel details");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  /**
   * 💰 මුළු මුදල සහ දින ගණන ගණනය කිරීම
   */
  const { totalNights, calculatedPrice } = useMemo(() => {
    if (!checkIn || !checkOut || !hotel) return { totalNights: 0, calculatedPrice: 0 };
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const differenceInTime = end.getTime() - start.getTime();
    const nights = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return {
      totalNights: nights > 0 ? nights : 0,
      calculatedPrice: nights > 0 ? nights * hotel.pricePerNight : 0
    };
  }, [checkIn, checkOut, hotel]);

  /**
   * පින්තූර URL Helper
   */
  const getImageUrl = (imagePath) => resolveAssetUrl(imagePath, 'https://placehold.co/800x400?text=No+Image');

  /**
   * හෝටලය වෙන් කිරීම (Reserve Now, Pay Later)
   */
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.warn("Please login to make a reservation");
      navigate('/login');
      return;
    }

    if (totalNights <= 0) {
      toast.error("Check-out date must be after Check-in date!");
      return;
    }

    try {
      // Backend එකට දත්ත යැවීම
      await API.post('/bookings', { 
        hotel: id, 
        checkInDate: checkIn, 
        checkOutDate: checkOut,
        totalPrice: calculatedPrice,
        paymentMethod: 'pay_on_arrival' // ✅ පසුව ගෙවීමේ ක්‍රමය
      });

      toast.success("Reservation Successful! Pay on Arrival. 🎉");
      navigate('/my-bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking Failed!");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to DELETE this hotel? ⚠️")) {
      try {
        await API.delete(`/hotels/${id}`);
        toast.success("Hotel Deleted!");
        navigate('/hotels');
      } catch {
        toast.error("Failed to delete hotel");
      }
    }
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.warn("Please select a star rating!");
      return;
    }
    try {
      await API.post(`/hotels/${id}/reviews`, { rating, comment });
      toast.success('Review Submitted!');
      setComment('');
      setRating(0); 
      fetchHotel(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Review Failed");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;
  if (!hotel) return <div className="text-center mt-20 text-xl font-bold text-gray-600">Hotel not found 😕</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* 1. HERO IMAGE BANNER */}
      <div className="relative h-[400px] md:h-[500px]">
        <img src={getImageUrl(hotel.image)} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white max-w-7xl mx-auto w-full">
           <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{hotel.name}</h1>
           <div className="flex items-center gap-4 text-lg">
             <span className="bg-white/20 backdrop-blur px-3 py-1 rounded text-sm font-bold border border-white/30">⭐ {hotel.rating ? hotel.rating.toFixed(1) : "New"}</span>
             <span className="flex items-center gap-1 opacity-90">📍 {hotel.location}</span>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
        
        {/* 2. MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">About this place</h2>
              {user && (user.role === 'admin' || (hotel.user && user._id === hotel.user)) && (
                <div className="flex gap-3 text-sm">
                  <button onClick={() => navigate(`/edit-hotel/${hotel._id}`)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold">Edit</button>
                  <button onClick={handleDelete} className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold">Delete</button>
                </div>
              )}
            </div>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{hotel.description}</p>
          </div>

          {/* REVIEWS */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Guest Reviews</h2>
            {hotel.reviews.length === 0 ? <p className="text-gray-400 italic">No reviews yet.</p> : (
              <div className="space-y-6">
                {hotel.reviews.map((r) => (
                  <div key={r._id} className="border-b pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">{r.name}</span>
                      <span className="text-yellow-400">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* REVIEW FORM */}
            <div className="mt-8 bg-gray-50 p-6 rounded-xl">
              <h3 className="font-bold mb-4">Write a Review</h3>
              <form onSubmit={submitReviewHandler} className="space-y-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setRating(s)} className={`text-2xl ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
                <textarea className="w-full p-3 border rounded-lg" placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} required />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Post Review</button>
              </form>
            </div>
          </div>
        </div>

        {/* 3. BOOKING SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-28">
            <div className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">Rs {hotel.pricePerNight.toLocaleString()}</span>
                <span className="text-gray-500 font-medium"> / night</span>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 border rounded-xl overflow-hidden">
                <div className="p-3 border-r bg-gray-50">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Check-In</label>
                  <input type="date" className="w-full bg-transparent text-sm" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                </div>
                <div className="p-3 bg-gray-50">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Check-Out</label>
                  <input type="date" className="w-full bg-transparent text-sm" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
                </div>
              </div>

              {totalNights > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl space-y-2 border border-blue-100">
                   <div className="flex justify-between text-sm text-gray-600">
                     <span>Rs {hotel.pricePerNight.toLocaleString()} x {totalNights} nights</span>
                     <span>Rs {calculatedPrice.toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-blue-200"></div>
                   <div className="flex justify-between font-extrabold text-gray-900">
                     <span>Total</span>
                     <span>Rs {calculatedPrice.toLocaleString()}</span>
                   </div>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition">
                Reserve Now
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-2">No payment required until you stay</p>
            </form>
            
            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-[10px] text-gray-500">
               <div className="flex items-center gap-1"><span className="text-green-500 font-bold">✔</span> Free Cancellation</div>
               <div className="flex items-center gap-1"><span className="text-green-500 font-bold">✔</span> Pay on Arrival</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HotelDetails;
