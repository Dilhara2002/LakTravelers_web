import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api'; 

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [pickupDate, setPickupDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [days, setDays] = useState(1); // Minimum of one day

  // Review State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const user = JSON.parse(localStorage.getItem('userInfo'));

  /**
   * Fetch vehicle details from the API
   */
  const fetchVehicle = async () => {
    try {
      const { data } = await API.get(`/vehicles/${id}`);
      setVehicle(data);
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
    // eslint-disable-next-line
  }, [id]);

  /**
   * Handle vehicle booking
   */
  const handleBooking = async (e) => {
    e.preventDefault();

    // 🚨 Important: Calculate the total price
    const calculatedPrice = vehicle.pricePerDay * days;

    try {
      const bookingData = {
        vehicle: id,              // Name as defined in the Backend Schema
        checkInDate: pickupDate,  // Using checkInDate field for pickupDate per Schema
        pickupLocation,
        totalPrice: calculatedPrice, // 👈 This value is mandatory
        status: 'Pending'
      };

      console.log("Submitting Booking:", bookingData); // Debugging

      await API.post('/bookings', bookingData);
      alert("Vehicle Booked Successfully! 🚗✅. Please wait for Vendor approval.");
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Booking Error:", error);
      alert(error.response?.data?.message || "Booking Failed! Please ensure you are logged in.");
      if (error.response?.status === 401) navigate('/login');
    }
  };

  /**
   * Delete vehicle listing
   */
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this vehicle? ⚠️")) {
      try {
        await API.delete(`/vehicles/${id}`);
        alert("Vehicle Deleted! 🗑️");
        navigate('/vehicles');
      } catch (error) {
        alert("Failed to delete vehicle");
      }
    }
  };

  /**
   * Upload an image for the review
   */
  const handleReviewImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // ✅ Extract only the URL from the Cloudinary response
      const imageUrl = typeof data === 'object' ? data.image : data;
      setReviewImage(imageUrl);
      setUploading(false);
      alert("Photo uploaded! 📸");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploading(false);
      alert('Image upload failed');
    }
  };

  /**
   * Submit the review
   */
  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a star rating! ⭐");
    
    try {
      await API.post(`/vehicles/${id}/reviews`, { rating, comment, image: reviewImage });
      alert('Review Submitted! ⭐');
      setComment('');
      setRating(0);
      setReviewImage('');
      fetchVehicle();
    } catch (error) {
      alert(error.response?.data?.message || "Review Failed");
    }
  };

  /**
   * Helper function to format the image URL for display
   */
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/800x400?text=No+Image+Available";
    if (typeof imagePath === 'string' && imagePath.startsWith("http")) return imagePath;
    const backendURL = "https://lak-travelers-api.vercel.app"; 
    const cleanPath = typeof imagePath === 'string' && imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${backendURL}${cleanPath}`;
  };

  const getRatingLabel = (r) => {
    switch (r) {
      case 5: return "Excellent 😍";
      case 4: return "Very Good 😄";
      case 3: return "Good 🙂";
      case 2: return "Fair 😐";
      case 1: return "Poor 😞";
      default: return "Select rating";
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;
  if (!vehicle) return <div className="text-center mt-20 text-xl font-bold text-gray-600">Vehicle not found 😕</div>;

  const heroImage = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : "";

  return (
    <div className="bg-gray-50 min-h-screen pb-10">

      {/* 1. HERO BANNER */}
      <div className="relative h-[400px] md:h-[500px]">
        <img 
          src={getImageUrl(heroImage)} 
          alt={vehicle.vehicleModel} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {vehicle.licensePlate}
              </span>
              <span className="flex items-center gap-1 text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/20">
                👨‍✈️ Driver: {vehicle.driverName}
              </span>
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{vehicle.vehicleModel}</h1>
           <div className="flex items-center gap-4 text-lg">
             <span className="text-yellow-400 font-bold text-xl">⭐ {vehicle.rating ? vehicle.rating.toFixed(1) : "New"}</span>
             <span className="opacity-80">| {vehicle.numReviews} Reviews</span>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
        
        {/* 2. MAIN CONTENT (Left Side) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Vehicle Details</h2>
              {user && (user.role === 'admin' || user._id === vehicle.user || user._id === vehicle.user?._id) && (
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/edit-vehicle/${vehicle._id}`)} className="text-blue-600 font-bold hover:underline">Edit</button>
                  <button onClick={handleDelete} className="text-red-500 font-bold hover:underline">Delete</button>
                </div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                  <div className="text-2xl mb-1">💺</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Seats</div>
                  <div className="font-bold text-gray-800">{vehicle.capacity} Persons</div>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                  <div className="text-2xl mb-1">📞</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Contact</div>
                  <div className="font-bold text-gray-800">{vehicle.contactNumber}</div>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                  <div className="text-2xl mb-1">🚘</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Type</div>
                  <div className="font-bold text-gray-800">{vehicle.type || "Standard"}</div>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                  <div className="text-2xl mb-1">❄️</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">AC</div>
                  <div className="font-bold text-gray-800">Available</div>
               </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{vehicle.description}</p>
          </div>

          {/* Reviews Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
               <div className="text-center">
                 <div className="text-5xl font-extrabold text-gray-900">{vehicle.rating ? vehicle.rating.toFixed(1) : "0.0"}</div>
                 <div className="text-yellow-500 text-lg">⭐⭐⭐⭐⭐</div>
               </div>
               <div className="h-12 w-px bg-gray-200"></div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">User Reviews</h2>
                 <p className="text-gray-500">{vehicle.numReviews} ratings</p>
               </div>
            </div>

            {vehicle.reviews.length === 0 ? (
               <div className="text-center py-10 italic text-gray-400">No reviews yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {vehicle.reviews.map((review) => (
                  <div key={review._id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                         {review.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-bold text-gray-900 leading-tight">{review.name}</p>
                         <div className="flex text-yellow-400 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm">{i < review.rating ? "★" : "☆"}</span>
                            ))}
                         </div>
                       </div>
                    </div>
                    <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                    {review.image && (
                      <img src={getImageUrl(review.image)} alt="Review" className="h-16 w-16 object-cover rounded-lg border border-gray-200 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4">Write a Review ✍️</h3>
              {user ? (
                <form onSubmit={submitReviewHandler} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Rating: <span className="text-blue-600 font-normal ml-1">{getRatingLabel(hoverRating || rating)}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea 
                    rows="3" 
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                    placeholder="How was the driver and vehicle?" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    required
                  ></textarea>

                  <div className="flex justify-between items-center">
                    <input type="file" onChange={handleReviewImageUpload} className="text-sm text-gray-500 cursor-pointer"/>
                    <button type="submit" disabled={uploading} className="bg-gray-900 text-white px-8 py-2 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50">
                      {uploading ? 'Processing...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-300 rounded-xl text-center">
                  Please <a href="/login" className="text-blue-600 font-bold hover:underline">log in</a> to review.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SIDEBAR (Booking Section) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-28">
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-blue-600">Rs {vehicle.pricePerDay.toLocaleString()}</span>
              <span className="text-gray-500 font-medium"> / day</span>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  value={pickupDate} 
                  onChange={(e) => setPickupDate(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">How many days?</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  value={days} 
                  onChange={(e) => setDays(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Airport, Colombo..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  value={pickupLocation} 
                  onChange={(e) => setPickupLocation(e.target.value)} 
                  required 
                />
              </div>

              <div className="flex justify-between items-center py-3 border-t border-gray-100 mt-2">
                 <span className="font-bold text-gray-700">Total Price:</span>
                 <span className="font-bold text-xl text-blue-700">LKR {(vehicle.pricePerDay * days).toLocaleString()}</span>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:bg-blue-700 transition transform active:scale-95">
                Book Vehicle
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Driver included in price</p>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-xs text-gray-500">
               <div className="flex items-center gap-2"><span className="text-green-500">✔</span> Professional Driver</div>
               <div className="flex items-center gap-2"><span className="text-green-500">✔</span> 24/7 Roadside Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;