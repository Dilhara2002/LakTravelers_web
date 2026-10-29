import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { toast } from 'react-toastify';
import registerImage from '../assets/Register.jpg';

// SOCIAL LOGIN IMPORTS
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
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

  const userInfo = useMemo(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const roleFromUrl = queryParams.get('role');
    if (roleFromUrl === 'vendor') {
      setFormData((prev) => ({ ...prev, role: 'vendor' }));
    }
  }, [location]);

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

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match! ❌');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/users/send-otp', {
        email: formData.email.trim().toLowerCase(),
      });

      setIsOtpSent(true);
      toast.success('Verification code sent! 📩');
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const { data } = await API.post('/users', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        otp: formData.otp,
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      toast.success('Account created successfully 🎉');
      navigate('/');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // SOCIAL LOGIN HANDLERS
  // =========================

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post('/users/google', {
        token: credentialResponse.credential,
      });

      localStorage.setItem('userInfo', JSON.stringify(res.data));
      toast.success('Google login success 🎉');
      navigate('/');
      window.location.reload();
    } catch {
      toast.error('Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 p-4 pt-10">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row mt-4 border border-gray-100">

        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-14">

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {isOtpSent ? 'Verify Email 📧' : 'Create Account 🚀'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isOtpSent
                ? `Enter OTP sent to ${formData.email}`
                : 'Join LakTravelers'}
            </p>
          </div>

          <form onSubmit={isOtpSent ? handleSubmit : handleSendOtp} className="space-y-5">

            {!isOtpSent ? (
              <>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  Full Name
                  <input id="name" name="name" value={formData.name} type="text" autoComplete="name" required placeholder="Full Name" onChange={handleChange} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                </label>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address
                  <input id="email" name="email" value={formData.email} type="email" autoComplete="email" required placeholder="Email" onChange={handleChange} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                </label>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                  <input id="password" name="password" value={formData.password} autoComplete="new-password" type="password" placeholder="Password (8+ characters)" minLength="8" required onChange={handleChange} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                </label>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                  Confirm Password
                  <input id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} autoComplete="new-password" type="password" placeholder="Confirm Password" minLength="8" required onChange={handleChange} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                </label>

                <button type="submit" className="w-full rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Get OTP'}
                </button>

                {/* SOCIAL LOGIN SECTION */}
                {googleEnabled && <div className="mt-6 text-center">
                  <p className="text-sm mb-3">Or continue with</p>

                  {googleEnabled && <GoogleLogin onSuccess={handleGoogleSuccess} />}


                </div>}
              </>
            ) : (
              <>
                <label htmlFor="otp" className="block text-sm font-semibold text-slate-700">Verification code</label>
                <input
                  id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                  required pattern="[0-9]{6}" maxLength={6} value={formData.otp} autoFocus
                  placeholder="Enter OTP"
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-center text-xl tracking-widest"
                />

                <button type="submit" className="w-full rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Account'}
                </button>
                <button type="button" disabled={isLoading} onClick={() => { setIsOtpSent(false); setFormData(previous => ({ ...previous, otp: '' })); }} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-blue-700">Change email or request a new code</button>
              </>
            )}
          </form>

          <p className="mt-6 text-center">
            Already have account? <Link to="/login">Login</Link>
          </p>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="hidden md:block w-1/2 relative">
          <img alt="Sri Lanka travel scenery" src={registerImage} className="w-full h-full object-cover" />
        </div>

      </div>
    </div>
  );
};

export default Register;
