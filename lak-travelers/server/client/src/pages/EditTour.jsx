import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api'; // Using our pre-configured API instance

const EditTour = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Separate States for Duration Logic
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('Days');

  const [formData, setFormData] = useState({
    name: '',
    destinations: '',
    duration: '',
    price: '',
    groupSize: '',
    description: '', 
    image: '',
    mapUrl: '',      
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Fetch Data and Parse the Duration String
  useEffect(() => {
    const fetchTour = async () => {
      try {
        const { data } = await API.get(`/tours/${id}`);
        
        // Parses data like "3 Days" into "3" and "Days"
        if (data.duration) {
            const parts = data.duration.split(' ');
            if (parts.length >= 2) {
                setDurationValue(parts[0]);
                setDurationUnit(parts[1]);
            } else {
                setDurationValue(data.duration);
            }
        }

        setFormData({
            name: data.name || '',
            destinations: data.destinations || '',
            duration: data.duration || '',
            price: data.price || '',
            groupSize: data.groupSize || '',
            description: data.description || '',
            image: data.image || '',
            mapUrl: data.mapUrl || ''
        });
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error:", error);
        alert("Error loading tour data. Redirecting...");
        navigate('/tours');
      }
    };
    fetchTour();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Updates formData whenever the duration value or unit changes
  const handleDurationUpdate = (val, unit) => {
      setDurationValue(val);
      setDurationUnit(unit);
      setFormData(prev => ({ ...prev, duration: `${val} ${unit}` }));
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
      // ⚠️ Using the API instance avoids CORS and Authentication errors
      const res = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData((prev) => ({ ...prev, image: res.data }));
      alert("Image updated successfully! ✅");
    } catch (error) {
      console.error("Upload Error:", error);
      alert(error.response?.data?.message || 'Image upload failed! ❌');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => handleFileUpload(e.target.files[0]);
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
   * 🚐 Update tour package details
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/tours/${id}`, formData);
      alert('Tour Package Updated Successfully! ✅');
      navigate(`/tours/${id}`); 
    } catch (error) {
      console.error("Update Error:", error);
      alert(error.response?.data?.message || 'Failed to update tour');
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
            <h2 className="text-xl font-semibold text-white tracking-wide">Edit Tour Package</h2>
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
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Tour Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Package Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Destinations</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">📍</span>
                        <input type="text" name="destinations" value={formData.destinations} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                    <div className="flex gap-2">
                        <div className="relative w-1/2">
                            <span className="absolute left-3 top-3 text-slate-400">⏳</span>
                            <input 
                                type="number" 
                                value={durationValue} 
                                onChange={(e) => handleDurationUpdate(e.target.value, durationUnit)} 
                                className="w-full pl-9 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                                required
                            />
                        </div>
                        <div className="w-1/2">
                            <select 
                                value={durationUnit} 
                                onChange={(e) => handleDurationUpdate(durationValue, e.target.value)} 
                                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                            >
                                <option value="Minutes">Mins</option>
                                <option value="Hours">Hours</option>
                                <option value="Days">Days</option>
                                <option value="Weeks">Weeks</option>
                            </select>
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Group Size</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">👥</span>
                        <input type="number" name="groupSize" value={formData.groupSize} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Per Person (LKR)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">Rs</span>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                    </div>
                 </div>
               </div>
            </div>

            {/* SECTION 2: MAP & DESCRIPTION */}
            <div>
               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Tour Description</label>
                 <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none" required></textarea>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Route Map URL</label>
                 <input type="text" name="mapUrl" value={formData.mapUrl} onChange={handleChange} placeholder='src URL from Google Maps' className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono text-slate-600" />
               </div>
            </div>

            {/* SECTION 3: IMAGE UPDATE */}
            <div>
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Cover Image</h3>
               
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
                        <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" />
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

export default EditTour;