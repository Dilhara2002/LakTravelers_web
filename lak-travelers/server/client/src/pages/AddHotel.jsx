import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // Use our pre-configured API service
import logoImage from "../assets/logo.png"; 

const AddHotel = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    pricePerNight: '',
    image: '',
    mapUrl: '',
  });

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 🔐 Authorization check (Verify if the user is logged in and authorized)
  const user = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      alert('Unauthorized Access. Only Vendors and Admins can add hotels.');
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 🖼️ Upload image to Cloudinary
   */
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Show local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const data = new FormData();
    data.append('image', file);

    try {
      // Sends data to the /api/upload route configured in the Backend
      // Using the 'API' instance avoids CORS issues
      const res = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Updates formData with the URL returned from Cloudinary
      setFormData((prev) => ({ ...prev, image: res.data.image }));
      alert('Image uploaded successfully! ✅');
    } catch (error) {
      console.error('Upload Error:', error);
      alert(error.response?.data?.message || 'Image upload failed. Please try again.');
      setPreview(null);
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

  const removeImage = () => {
    setPreview(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  /**
   * 🏨 Submit hotel details to the Server
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return alert('Property image is required.');

    try {
      // Sends data to the /api/hotels route in the Backend
      await API.post('/hotels', formData);
      alert('Hotel Added Successfully! 🏨');
      navigate('/hotels');
    } catch (error) {
      console.error('Submit Error:', error);
      alert(error.response?.data?.message || 'Failed to add hotel. Check all fields.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* HEADER */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">
              Create Hotel Listing
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Add a new stay for travelers
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white transition text-sm font-medium flex items-center gap-2"
          >
            ✕ Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">

          {/* SECTION 1: Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">
                Property Details
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">🏨</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Ella Green Resort"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">📍</span>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Nuwara Eliya"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price Per Night (LKR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">Rs</span>
                    <input
                      type="number"
                      name="pricePerNight"
                      placeholder="15000"
                      value={formData.pricePerNight}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION & MAP */}
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Property Description</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Describe the hotel and amenities..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Location Map URL (Google Maps)</label>
                <input
                  type="text"
                  name="mapUrl"
                  placeholder='https://www.google.com/maps/embed?pb=...'
                  value={formData.mapUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>

            {/* IMAGE UPLOAD */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">
                Property Image
              </h3>

              {!preview ? (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`relative group border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all cursor-pointer
                  ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                >
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                  <p className="text-slate-900 font-medium text-sm">Drag image here or click to browse</p>
                  <p className="text-slate-400 text-xs mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onFileSelect} />
                </div>
              ) : (
                <div className="relative h-64 w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-slate-100 transition"
                    >
                      Change Image
                    </button>
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white font-bold">
                      Uploading to Cloud...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all
              ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg active:scale-95'}`}
            >
              {uploading ? 'Processing...' : 'Publish Hotel 🏨'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddHotel;