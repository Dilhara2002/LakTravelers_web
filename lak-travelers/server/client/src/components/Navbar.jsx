import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import logoImage from "../assets/logo.png"; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("userInfo")));

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("userInfo")));
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post("/users/logout");
      localStorage.removeItem("userInfo");
      setIsDropdownOpen(false);
      navigate("/login");
      window.location.reload(); 
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("userInfo");
      navigate("/login");
    }
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // List of menu items (including Community Feed)
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Hotels", path: "/hotels" },
    { name: "Tours", path: "/tours" },
    { name: "Vehicles", path: "/vehicles" },
    { name: "Planner", path: "/smart-planner", isAI: true },
    { name: "Community", path: "/community", isLive: true }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-full items-center px-6 sm:px-10 lg:px-16">
        
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3 group z-50">
          <div className="h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border border-gray-100 shadow-sm group-hover:shadow-md transition">
            <img 
              src={logoImage} 
              alt="LakTravelers Logo" 
              className="h-full w-full object-cover"
              onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/50?text=LT"}}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900 leading-none">
              Lak<span className="text-blue-600">Travelers</span>
            </span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mt-1">
              Explore Sri Lanka
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="hidden xl:flex items-center space-x-8 ml-auto mr-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative text-sm font-bold transition-colors py-2 flex items-center gap-1.5 ${
                  isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                } group`}
              >
                {item.name === "Planner" ? "Smart Planner" : item.name}
                
                {/* AI Badge for Planner */}
                {item.isAI && (
                  <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-black animate-pulse">AI</span>
                )}
                
                {/* Live Badge for Community */}
                {item.isLive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                <span className={`absolute left-0 bottom-0 h-0.5 w-full bg-blue-600 transition-transform origin-left duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </Link>
            );
          })}
        </div>

        {/* AUTH TOOLS */}
        <div className="flex items-center gap-4 ml-auto xl:ml-0">
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 pr-3 bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-md transition duration-200 focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 overflow-hidden shadow-sm">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-bold text-gray-700 max-w-[120px] truncate">{user.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 z-20 mt-3 w-64 origin-top-right rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mt-0.5">{user.role}</p>
                    </div>
                    <div className="p-2">
                      {(user.role === "vendor" || user.role === "admin") && (
                        <Link to="/dashboard" onClick={closeDropdown} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">Dashboard</Link>
                      )}
                      {user.role === "user" && (
                        <Link to="/my-bookings" onClick={closeDropdown} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">My Bookings</Link>
                      )}
                      <Link to="/profile" onClick={closeDropdown} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">My Profile</Link>
                      <div className="my-1 h-px bg-gray-100" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition text-left">Logout</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition">Log In</Link>
              <Link to="/register" className="rounded-full bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all hover:-translate-y-0.5">Sign Up</Link>
            </div>
          )}

          {/* MOBILE HAMBURGER */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white px-4 pt-4 pb-6 shadow-lg overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="flex flex-col space-y-2">
            
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={closeDropdown} 
                className="text-lg font-bold px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.name === "Planner" ? "Smart Planner" : item.name}
                  {item.isAI && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-black">AI</span>}
                </div>
                {item.isLive && (
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-500 font-black uppercase">Live Feed</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            ))}

            {!user && (
              <div className="flex flex-col gap-3 pt-6 mt-4 border-t border-gray-100">
                <Link to="/login" onClick={closeDropdown} className="text-center py-4 text-gray-600 font-bold rounded-xl border border-gray-100">Log In</Link>
                <Link to="/register" onClick={closeDropdown} className="text-center py-4 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-100">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;