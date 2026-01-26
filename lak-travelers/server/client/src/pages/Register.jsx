import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api'; // Your api.js service
import { toast } from 'react-toastify';
import registerImage from '../assets/Register.jpg';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    otp: '', 
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); 

  // Check for currently logged-in user information
  const userInfo = useMemo(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle Role from URL (e.g., ?role=vendor)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const roleFromUrl = queryParams.get('role');
    if (roleFromUrl === 'vendor') {
      setFormData((prev) => ({ ...prev, role: 'vendor' }));
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (userInfo) {
      if (userInfo.role === 'vendor' && !userInfo.isApproved) {
        navigate('/vendor-setup');
      } else {
        navigate('/');
      }
    }
  }, [userInfo, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * 📧 1. Send OTP to the user's email address
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match! ❌');
      return;
    }

    setIsLoading(true);
    try {
      // baseURL already includes /api, so we use '/users/send-otp'
      await API.post('/users/send-otp', { email: email.trim().toLowerCase() });
      setIsOtpSent(true);
      toast.success('Verification code sent to your email! 📩');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Check Connection.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🚀 2. Verify OTP and complete the Registration process
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role, otp } = formData;

    if (!otp) {
      toast.error('Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    try {
      // baseURL already includes /api, so we use '/users'
      const { data } = await API.post('/users', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        otp, 
      });

      localStorage.setItem('userInfo', JSON.stringify(data));

      if (data.role === 'vendor') {
        toast.success('Verified! Now set up your profile. 🏢');
        navigate('/vendor-setup');
      } else {
        toast.success('Registration Successful! 🎉');
        navigate('/');
      }
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP or Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 p-4 pt-10">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row mt-4 border border-gray-100">

        {/* LEFT SIDE: FORM SECTION */}
        <div className="w-full md:w-1/2 p-8 md:p-14">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {isOtpSent ? 'Verify Email 📧' : 'Create Account 🚀'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isOtpSent ? `Enter the code sent to ${formData.email}` : 'Join LakTravelers to explore Sri Lanka'}
            </p>
          </div>

          <form onSubmit={isOtpSent ? handleSubmit : handleSendOtp} className="space-y-6">
            {!isOtpSent ? (
              <>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Registering as:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData({ ...formData, role: 'user' })} className={`py-4 rounded-2xl font-bold border-2 transition-all duration-300 ${formData.role === 'user' ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500'}`}>Traveler</button>
                    <button type="button" onClick={() => setFormData({ ...formData, role: 'vendor' })} className={`py-4 rounded-2xl font-bold border-2 transition-all duration-300 ${formData.role === 'vendor' ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500'}`}>Vendor</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all" />
                  <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all" />
                  <input type="password" name="password" placeholder="Create Password" value={formData.password} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all" />
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all" />
                </div>

                <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-2xl font-black text-lg text-white transition-all shadow-xl ${isLoading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
                  {isLoading ? 'Sending Code...' : 'Get Verification Code'}
                </button>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <input
                  type="text"
                  name="otp"
                  placeholder="6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  maxLength="6"
                  className="w-full px-6 py-5 bg-blue-50 border-2 border-blue-200 rounded-2xl focus:bg-white focus:border-blue-600 text-center text-3xl font-black tracking-[0.5em] outline-none transition-all"
                />
                
                <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-lg text-white bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all">
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                <button type="button" onClick={() => setIsOtpSent(false)} className="w-full text-slate-400 font-bold hover:text-blue-600 text-sm">
                  ← Back to Edit Details
                </button>
              </div>
            )}
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">Sign In</Link>
          </p>
        </div>

        {/* RIGHT SIDE: IMAGE SECTION */}
        <div className="hidden md:block w-1/2 relative">
          <img src={registerImage} alt="Sri Lanka" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-16 text-white">
            <h3 className="text-4xl font-black mb-4 leading-tight">Your Adventure<br/>Begins Here.</h3>
            <p className="text-slate-200 text-lg font-medium opacity-90 leading-relaxed">Join thousands of travelers exploring the paradise island of Sri Lanka. 🏝️</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;