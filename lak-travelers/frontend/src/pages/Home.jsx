import { useReducedMotion } from 'framer-motion';
import CustomerReviews from './CustomerReviews';
import { features } from '../services/features';
import PublicVehicles from './PublicVehicles';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// 👇 Importing local images
import i1 from "../assets/i1.jpg";
import i2 from "../assets/i2.jpg";
import i3 from "../assets/i3.jpg";
import i4 from "../assets/i4.jpg";
import i5 from "../assets/i5.jpg";
import i6 from "../assets/i6.jpg";
import i7 from "../assets/i7.jpg";
import i8 from "../assets/i8.jpg";

const Home = () => {
  const reducedMotion = useReducedMotion();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroImages = useMemo(() => [i1, i2, i3, i4, i5, i6, i7], []);

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("userInfo");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (reducedMotion) return;
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000); 
    return () => clearInterval(intervalId);
  }, [heroImages.length, reducedMotion]);

  const BackgroundSlider = () => (
    <div className="absolute inset-0 z-0 overflow-hidden h-full w-full">
      {heroImages.map((imgUrl, index) => (
        <img
          key={index}
          src={imgUrl}
          alt="Sri Lanka Paradise"
          fetchPriority={index === 0 ? "high" : "low"}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out transform ${
            index === currentImageIndex 
              ? 'opacity-100'
              : 'opacity-0 scale-100'   
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-slate-50 z-20"></div>
    </div>
  );

  // ============================================================
  // 👇 UI Section for Logged-In Users
  // ============================================================
  const LoggedInUI = () => (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Updated to h-screen for full viewport height */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {BackgroundSlider()}
        <div className="travel-hero-copy relative z-30 max-w-5xl w-full text-center text-white space-y-8 px-6">
          <div className="inline-block">
            <span className="uppercase tracking-[0.2em] text-xs md:text-sm font-bold bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
              The Pearl of the Indian Ocean
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight drop-shadow-2xl leading-[1.1]">
            Experience <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
              Sri Lanka
            </span>
          </h1>
          <p className="text-white text-base md:text-lg font-semibold tracking-wide">LakTravelers · A Brand of IDW (Pvt) Ltd</p>
          <p className="text-lg md:text-2xl text-slate-100 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            Explore Sri Lanka with personalized travel assistance and transport. Your ultimate island journey awaits.
          </p>
          <div className="mt-10 bg-white/10 backdrop-blur-xl p-2 rounded-3xl border border-white/30 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 shadow-2xl">
            <div className="flex-grow flex items-center px-6">
                <svg className="w-6 h-6 text-white/70 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" placeholder="Where to next?" className="w-full bg-transparent text-white placeholder-white/70 py-4 outline-none text-lg font-medium" />
            </div>
            <Link to={features.hotels ? "/hotels" : "/vehicles"} className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-10 py-4 rounded-3xl font-bold transition shadow-lg flex items-center justify-center gap-2">
              Explore Now
            </Link>
          </div>
        </div>
      </div>

      {/* 🚀 AI SMART PLANNER SECTION */}
      {features.smartPlanner && <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
               <img src={i2} alt="AI Travel Planning" className="relative z-10 rounded-[3rem] shadow-2xl border-8 border-white object-cover h-[500px] w-full" />
               <div className="absolute bottom-6 right-6 z-20 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-blue-50 max-w-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-3 w-3 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Engine Active</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">"Plan a 3-day luxury yoga retreat in Sigiriya with vegan food."</p>
               </div>
            </div>
            <div className="lg:w-1/2 space-y-8">
              <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">Next-Gen Technology</span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
                Plan Smarter with <br/> <span className="text-blue-600">GraphRAG AI</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Our advanced Graph-based AI doesn't just search; it connects. By analyzing hotels, transport, and locations as a knowledge graph, we build perfectly integrated itineraries tailored to your specific preferences.
              </p>
              <ul className="space-y-4">
                {["Personalized Multi-Criteria Itineraries", "Integrated Hotel & Transport Matching", "Real-time Availability Intelligence"].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    {text}
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link to="/smart-planner" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition transform hover:-translate-y-1">
                  Try AI Planner 🪄
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>}

      <section className="bg-slate-900 py-20 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
           <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Promise to You</h2>
               <p className="text-slate-400 text-lg">We provide high-quality services for every traveler.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[{ title: "Verified Listings", icon: "✅" }, { title: "Personalized Travel", icon: "🌴" }, { title: "24/7 Support", icon: "📞" }, { title: "Best Price", icon: "🏷️" }].map((item, idx) => (
                  <div key={idx} className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition duration-300">
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm">Quality services you can trust.</p>
                  </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );

  // ============================================================
  // 👇 UI Section for Guest (Unregistered) Visitors
  // ============================================================
  const GuestUI = () => (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Updated to h-screen for full viewport height */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center px-4 overflow-hidden">
        {BackgroundSlider()}
        <div className="travel-hero-copy relative z-30 max-w-5xl w-full text-center text-white space-y-8 px-6">
          <div className="inline-block"><span className="uppercase tracking-[0.2em] text-xs md:text-sm font-bold bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/20">The Pearl of the Indian Ocean </span></div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">Explore <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-500">Lak Travelers</span></h1>
          <p className="text-white text-base md:text-lg font-semibold tracking-wide">LakTravelers · A Brand of IDW (Pvt) Ltd</p>
          <p className="text-lg md:text-2xl text-slate-100 max-w-2xl mx-auto font-light leading-relaxed">Personalized travel experiences and reliable transport across Sri Lanka.</p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-10 py-4 rounded-2xl font-bold transition shadow-lg text-lg">Get Started Free</Link>
            <Link to={features.hotels ? "/hotels" : "/vehicles"} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-bold border border-white/30 transition text-lg">View Listings</Link>
          </div>
        </div>
      </div>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Your Journey Starts Here</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 text-center">
            <div className="group"><div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 transition group-hover:bg-blue-600 group-hover:text-white">1</div><h3 className="text-xl font-bold mb-3">Create Account</h3><p className="text-slate-500 max-w-xs mx-auto">Register as a Traveler or Vendor with your email within minutes.</p></div>
            <div className="group"><div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 transition group-hover:bg-blue-600 group-hover:text-white">2</div><h3 className="text-xl font-bold mb-3">Verify Profile</h3><p className="text-slate-500 max-w-xs mx-auto">Submit details for admin approval to ensure a safe community.</p></div>
            <div className="group"><div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 transition group-hover:bg-blue-600 group-hover:text-white">3</div><h3 className="text-xl font-bold mb-3">Start Exploring</h3><p className="text-slate-500 max-w-xs mx-auto">Explore our vehicles and contact us to plan your journey.</p></div>
          </div>
        </div>
      </section>

      {features.hotels && <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 text-white">
            <div className="flex-1 space-y-6">
                <span className="text-yellow-400 font-bold uppercase tracking-wider">Become a Partner</span>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">Are you a Hotel Owner or a Tour Guide?</h2>
                <p className="text-slate-400 text-lg">Reach thousands of international tourists and travelers every month on Lak Travelers.</p>
                <Link to="/register?role=vendor" className="inline-block bg-yellow-400 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition">
                   Register as Vendor
                </Link>
            </div>
            <div className="flex-1">
                <img src={i8} alt="Join Lak Travelers" className="rounded-2xl shadow-2xl w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>}
    </div>
  );

  return <>{user ? LoggedInUI() : GuestUI()}<PublicVehicles embedded /><CustomerReviews embedded /></>;
};

export default Home;