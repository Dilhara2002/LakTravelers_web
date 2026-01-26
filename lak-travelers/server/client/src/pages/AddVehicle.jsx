import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const AddVehicle = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    driverName: '',
    vehicleModel: '',
    type: 'Car',
    licensePlate: '',
    capacity: '',
    pricePerDay: '',
    description: '',
    contactNumber: '',
    images: [], 
  });

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const user = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      alert('Unauthorized Access. Vendors and Admins only.');
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 4) {
      alert('You can only upload a maximum of 4 images.');
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const data = new FormData();
        data.append('image', file);
        
        const res = await API.post('/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // ✅ Ensure only the URL is extracted from the response object
        const imageUrl = typeof res.data === 'object' ? res.data.image : res.data;
        uploadedUrls.push(imageUrl);
      }
      
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      alert('Images uploaded successfully! ✅');
    } catch (error) {
      console.error('Upload Error:', error);
      alert(error.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => handleImageUpload(Array.from(e.target.files));
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(Array.from(e.dataTransfer.files));
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  // ✅ ERROR FIX: Verify if the path is a String (Line 90 Fix)
  const getImageUrl = (path) => {
    if (!path) return "";
    
    // If path is received as an object, extract its URL
    const finalPath = typeof path === 'object' ? path.image : path;

    // Verify finalPath is a string before calling startsWith
    if (finalPath && typeof finalPath === 'string' && finalPath.startsWith("http")) {
      return finalPath;
    }
    
    const backendURL = "https://lak-travelers-api.vercel.app"; 
    return `${backendURL}${finalPath?.startsWith("/") ? finalPath : `/${finalPath}`}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('At least one image is required.');

    try {
      await API.post('/vehicles', formData);
      alert('Vehicle Registered Successfully! 🚗');
      navigate('/vehicles');
    } catch (error) {
      console.error('Submit Error:', error);
      alert(error.response?.data?.message || 'Failed to register vehicle.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">Register Vehicle</h2>
            <p className="text-slate-400 text-sm mt-1">Add a car, van, or bus to the fleet</p>
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
          
            {/* SECTION 1: VEHICLE BASICS */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Driver Name</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">👨‍✈️</span>
                            <input
                                type="text"
                                name="driverName"
                                value={formData.driverName}
                                placeholder="e.g. Sunil Perera"
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Model</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">🚘</span>
                            <input
                                type="text"
                                name="vehicleModel"
                                value={formData.vehicleModel}
                                placeholder="e.g. Toyota Prius 2018"
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">🚖</span>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                            >
                                <option value="Car">Car 🚗</option>
                                <option value="Van">Van 🚐</option>
                                <option value="SUV">SUV 🚙</option>
                                <option value="Bus">Bus 🚌</option>
                                <option value="TukTuk">TukTuk 🛺</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">License Plate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">🔢</span>
                            <input
                                type="text"
                                name="licensePlate"
                                value={formData.licensePlate}
                                placeholder="e.g. CAB-1234"
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: PRICING & SPECS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seats</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">💺</span>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            placeholder="4"
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price / Day (LKR)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">Rs</span>
                        <input
                            type="number"
                            name="pricePerDay"
                            value={formData.pricePerDay}
                            placeholder="5000"
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">📞</span>
                        <input
                            type="text"
                            name="contactNumber"
                            value={formData.contactNumber}
                            placeholder="077-1234567"
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 3: DESCRIPTION */}
            <div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        rows="3"
                        placeholder="Any special conditions (e.g. AC, Fuel policy)..."
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                        required
                    />
                </div>
            </div>

            {/* SECTION 4: MEDIA */}
            <div>
                <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Vehicle Photos</h3>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{formData.images.length}/4 Uploaded</span>
                </div>

                {formData.images.length < 4 && (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer mb-6
                    ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                >
                    <div className="flex flex-col items-center pointer-events-none">
                        <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p className="text-sm text-slate-600 font-medium">Drag & Drop or Click to Upload</p>
                    </div>
                    <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onFileSelect} />
                </div>
                )}

                {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((img, index) => (
                    <div key={index} className="relative group h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                        <img 
                            src={getImageUrl(img)} 
                            alt={`Vehicle ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
                
                {uploading && (
                    <div className="mt-4 flex items-center justify-center text-indigo-600 text-sm font-medium gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                        Uploading to Cloudinary...
                    </div>
                )}
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
                    {uploading ? 'Processing...' : 'Complete Registration'}
                </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;