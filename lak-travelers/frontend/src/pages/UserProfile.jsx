import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import { toast } from 'react-toastify';

const UserProfile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [otp, setOtp] = useState('');
  
  const [showOtpField, setShowOtpField] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await API.get('/users/profile');
        setName(data.name);
        setEmail(data.email);
        setInitialEmail(data.email);
        setImagePreview(data.profileImage || '');
        setLoading(false);
      } catch {
        localStorage.removeItem('userInfo');
        navigate('/login');
      }
    };
    fetchUserData();
  }, [navigate]);

  // Convert image to Base64 to ensure it saves permanently as a string
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
    }
  };

  const handleSendOtp = async () => {
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsOtpLoading(true);
    try {
      await API.post('/users/send-otp', { 
        email: email !== initialEmail ? email : initialEmail,
        isUpdate: true 
      });
      setShowOtpField(true);
      toast.success("Verification code sent to your email.");
    } catch {
      toast.error("Failed to send code.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const isSecurityChange = (email !== initialEmail) || (password.length > 0);

    if (isSecurityChange && !otp) {
      toast.warning("Please verify your identity first.");
      return;
    }

    try {
      const { data } = await API.put('/users/profile', {
        name,
        email,
        password,
        otp,
        profileImage: imagePreview
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      toast.success("Account updated successfully.");
      
      // Update local states
      setInitialEmail(data.email);
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowOtpField(false);

      // Refresh Navbar
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic text-slate-400">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-white py-24 px-6 font-sans antialiased text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-slate-100 pb-8 gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-slate-900">Account <span className="font-bold">Settings</span></h1>
            <p className="text-slate-500 mt-2 text-sm">Update your personal information and security preferences.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition">Cancel</button>
            <button onClick={handleUpdate} className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-black transition shadow-sm">Save Changes</button>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Side: Avatar Management */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative group">
              <div className="w-48 h-48 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl font-bold">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <span className="text-white text-xs font-bold tracking-widest uppercase">Change Photo</span>
                <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
              </label>
            </div>
            <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
              Recommended: Square JPG or PNG.<br/>Max size 5MB.
            </p>
          </div>

          {/* Right Side: Inputs */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* General Info */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 mb-8">Public Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-0 py-3 bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none transition-colors text-sm" placeholder="e.g. Ishan Dilhara" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-0 py-3 bg-transparent border-b focus:border-slate-900 outline-none transition-colors text-sm ${email !== initialEmail ? 'text-blue-600 border-blue-200' : 'border-slate-200'}`} />
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 mb-8">Security & Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">New Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-0 py-3 bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none transition-colors text-sm" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-0 py-3 bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none transition-colors text-sm" placeholder="••••••••" />
                </div>
              </div>
            </section>

            {/* Verification Logic Box */}
            {(email !== initialEmail || password.length > 0) && (
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 transition-all">
                {!showOtpField ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-slate-600 font-medium">Verify your identity to save security changes.</p>
                    <button type="button" onClick={handleSendOtp} disabled={isOtpLoading} className="px-6 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:shadow-sm transition disabled:opacity-50">
                      {isOtpLoading ? 'Sending...' : 'Get OTP Code'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Code</span>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" className="bg-transparent border-b-2 border-slate-900 text-center text-3xl font-light w-40 outline-none tracking-[0.4em] pb-2" placeholder="000000" />
                    <button type="button" onClick={() => setShowOtpField(false)} className="text-[10px] font-bold text-slate-400 hover:text-red-500 underline transition">Change info again</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
