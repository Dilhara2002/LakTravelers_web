import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";
import loginImage from "../assets/Login.jpg"; 

const Login = () => {
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const requested = location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}` : new URLSearchParams(location.search).get('returnTo');
  const destination = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  // Scroll to the top of the page immediately upon loading
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await API.post("/users/auth", { email, password });
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      navigate(destination);
      window.location.reload();
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.response?.data?.message || "Login Failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("/users/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("userInfo", JSON.stringify(res.data));
      navigate(destination);
      window.location.reload();
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-30 py-10">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-gray-100">

        {/* LEFT: FORM SECTION */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Welcome Back 👋
            </h2>
            <p className="text-slate-500 font-medium italic">
              Please enter your details to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="group">
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-medium"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="group">
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="#" className="text-sm font-bold text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-lg text-white transition-all shadow-xl transform active:scale-95
                ${isLoading
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  Authenticating...
                </span>
              ) : (
                "Sign Into My Account"
              )}
            </button>
          </form>

          {/* Social Login Section */}
          <div className="my-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-sm text-slate-500 font-medium">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="flex flex-col items-center gap-4">
              {googleEnabled && <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Google Login Failed")}
                />}

              {!googleEnabled && (
                <p className="text-sm text-slate-400">Social login is not configured. Use email and password.</p>
              )}
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT: IMAGE SECTION */}
        <div className="hidden md:block w-1/2 relative">
          <img
            src={loginImage}
            alt="Sigiriya Rock Fortress"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-16 text-white">
            <div>
              <h3 className="text-4xl font-black mb-4 leading-tight">Explore the<br />Hidden Beauty.</h3>
              <p className="text-slate-200 text-lg font-medium opacity-90 leading-relaxed">
                Unlock exclusive deals and plan your dream journey with Lak Travelers. 🏝️
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
