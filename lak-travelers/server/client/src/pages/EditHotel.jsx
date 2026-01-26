import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api'; // Using our previously created API instance

const EditHotel = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    pricePerNight: '',
    image: '',
    mapUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const { data } = await API.get(`/hotels/${id}`);
        setFormData({
            name: data.name || '',
            location: data.location || '',
            description: data.description || '',
            pricePerNight: data.pricePerNight || '',
            image: data.image || '',
            mapUrl: data.mapUrl || ''
        });
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error:", error);
        alert("Error loading hotel data. Redirecting...");
        navigate('/hotels');
      }
    };
    fetchHotel();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * 🖼️ Upload a new image to Cloudinary
   */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    const data = new FormData();
    data.append('image', file);

    try {
      // ⚠️ Using API here avoids CORS and 401 Unauthorized errors
      const res = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update formData with the URL received from Cloudinary
      setFormData((prev) => ({ ...prev, image: res.data }));
      alert("New image uploaded! ✅");
    } catch (error) {
      console.error("Upload Error:", error);
      alert(error.response?.data?.message || 'Image upload failed! ❌');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => handleFileUpload(e.target.files[0]);
  
  // Drag & Drop Handlers
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

  /**
   * Helper function to format the image URL for display
   */
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
    if (path.startsWith("http")) return path;
    const backendURL = "https://lak-travelers-api.vercel.app"; // Your Backend URL
    return `${backendURL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  /**
   * 📝 Update hotel details
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/hotels/${id}`, formData);
      alert('Hotel Updated Successfully! 📝');
      navigate(`/hotels/${id}`); 
    } catch (error) {
      console.error("Update Error:", error);
      alert(error.response?.data?.message || 'Failed to update hotel');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-800"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">Edit Property</h2>
            <p className="text-slate-400 text-sm mt-1">Update details for {formData.name}</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white transition text-sm font-medium flex items-center gap-2"
          >
            ✕ Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-8">
            
            {/* SECTION 1: CORE DETAILS */}
            <div>
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Property Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">📍</span>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Per Night (LKR)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">Rs</span>
                        <input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                    </div>
                 </div>
               </div>
            </div>

            {/* SECTION 2: MAP & DESCRIPTION */}
            <div>
               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                 <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none" required></textarea>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Google Maps Embed URL</label>
                 <input type="text" name="mapUrl" value={formData.mapUrl} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono text-slate-600" placeholder="src URL from Google Maps" />
               </div>
            </div>

            {/* SECTION 3: IMAGE UPDATE */}
            <div>
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Property Image</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative group border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all cursor-pointer
                        ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                    >
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <p className="text-slate-900 font-medium text-sm">Click to change image</p>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onFileSelect} />
                  </div>

                  <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    {formData.image ? (
                        <>
                           <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                             {uploading ? "Uploading..." : "Current Image"}
                           </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-slate-50 text-slate-400">No Image</div>
                    )}
                    
                    {uploading && (
                      <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white backdrop-blur">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-2"></div>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* ACTION BAR */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={uploading}
                    className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all
                    ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'}`}
                >
                    {uploading ? 'Processing...' : 'Save Changes'}
                </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHotel;