import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useRef } from "react";
import { features } from './services/features';
import PublicExperience from './components/PublicExperience';
import WhatsApp from './components/WhatsApp';
import PublicVehicles from './pages/PublicVehicles';
import CustomerReviews from './pages/CustomerReviews';
import ReviewDecision from './pages/ReviewDecision';
const ComingSoon = () => <section className="text-center py-24"><h1 className="text-3xl font-bold text-blue-600">Lak Travelers — Coming Soon</h1><p className="mt-4">This service is not available yet.</p><a href="/" className="inline-block mt-6 text-blue-600 underline">Explore Lak Travelers</a></section>;
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CurrencyProvider } from './context/CurrencyContext';

// Pages Import
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const VendorSetup = lazy(() => import('./pages/VendorSetup'));
const HotelList = lazy(() => import('./pages/HotelList'));
const HotelDetails = lazy(() => import('./pages/HotelDetails'));
const AddHotel = lazy(() => import('./pages/AddHotel'));
const EditHotel = lazy(() => import('./pages/EditHotel'));
const TourList = lazy(() => import('./pages/TourList'));
const TourDetails = lazy(() => import('./pages/TourDetails'));
const AddTour = lazy(() => import('./pages/AddTour'));
const EditTour = lazy(() => import('./pages/EditTour'));
const VehicleList = lazy(() => import('./pages/VehicleList'));
const VehicleDetails = lazy(() => import('./pages/VehicleDetails'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const SmartPlanner = lazy(() => import('./pages/SmartPlanner'));
const CommunityFeed = lazy(() => import('./pages/CommunityFeed'));
const LegalPolicy = lazy(() => import('./pages/LegalPolicy'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const PublicGallery = lazy(() => import('./pages/PublicGallery'));
const AdminGallery = lazy(() => import('./pages/AdminGallery'));

// Components Import
import ChatBot from './components/ChatBot'; 
const AdminBookings = lazy(() => import('./pages/AdminBookings'));
const VendorBookings = lazy(() => import('./pages/VendorBookings'));

// 🛡️ Protected Route Component to restrict access to logged-in users
const ProtectedRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const location = useLocation();
  const toastId = useRef(null); // Use useRef to control toast instances

  useEffect(() => {
    if (!userInfo) {
      // Only show a new toast if one isn't already active
      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.error("Please login first to access this feature! 🔐", {
          toastId: "login-first-error" // Fixed ID prevents duplicate toast appearance
        });
      }
    }
  }, [userInfo]);

  return userInfo ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const RoleRoute = ({ children, roles }) => {
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (!userInfo) return <Navigate to="/login" state={{ from: location }} replace />;
  return roles.includes(userInfo.role)
    ? children
    : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <CurrencyProvider>
      <Router>
        {/* limit={1} also helps control multiple simultaneous notifications */}
        <ToastContainer position="top-center" autoClose={3000} limit={1} />
        
        <div className="font-sans bg-gray-50 text-gray-900 min-h-screen flex flex-col relative">
          <Navbar />
          
          <main className="pt-24 flex-grow px-4 md:px-0">
            <Suspense fallback={<div className="py-24 text-center font-bold text-blue-600">Loading...</div>}>
            <PublicExperience><Routes>
              {/* --- 🌍 Public Routes --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/hotels" element={features.hotels ? <HotelList /> : <ComingSoon />} />
              <Route path="/hotels/:id" element={features.hotels ? <HotelDetails /> : <ComingSoon />} />
              <Route path="/tours" element={features.tourPackages ? <TourList /> : <ComingSoon />} />
              <Route path="/tours/:id" element={features.tourPackages ? <TourDetails /> : <ComingSoon />} />
              <Route path="/vehicles" element={features.marketplaceVehicles ? <VehicleList /> : <PublicVehicles />} />
              <Route path="/vehicles/:id" element={features.marketplaceVehicles ? <VehicleDetails /> : <PublicVehicles detail />} />
              <Route path="/privacy" element={<LegalPolicy />} />
              <Route path="/reviews" element={<CustomerReviews />} />
               <Route path="/gallery" element={<PublicGallery />} />
               <Route path="/admin/gallery" element={<RoleRoute roles={['admin', 'super-admin']}><AdminGallery /></RoleRoute>} />
              <Route path="/admin/reviews/:id/decision" element={<RoleRoute roles={['admin', 'super-admin']}><ReviewDecision /></RoleRoute>} />
              <Route path="/admin/reviews" element={<RoleRoute roles={['admin', 'super-admin']}><CustomerReviews moderate /></RoleRoute>} />
              <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
              <Route path="/about" element={<AboutUs />} />

              {/* --- 🔐 Protected AI & Community Routes --- */}
              <Route path="/smart-planner" element={!features.smartPlanner ? <ComingSoon /> :
                <ProtectedRoute>
                  <SmartPlanner />
                </ProtectedRoute>
              } /> 
              
              <Route path="/community" element={!features.community ? <ComingSoon /> :
                <ProtectedRoute>
                  <CommunityFeed />
                </ProtectedRoute>
              } />

              {/* --- 🔐 Protected User Routes --- */}
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/vendor-setup" element={<ProtectedRoute><VendorSetup /></ProtectedRoute>} />

              {/* --- 🏨 Protected Service Management Routes --- */}
              <Route path="/add-hotel" element={<RoleRoute roles={['vendor', 'admin']}><AddHotel /></RoleRoute>} />
              <Route path="/edit-hotel/:id" element={<RoleRoute roles={['vendor', 'admin']}><EditHotel /></RoleRoute>} />
              <Route path="/add-tour" element={<RoleRoute roles={['vendor', 'admin']}><AddTour /></RoleRoute>} />
              <Route path="/edit-tour/:id" element={<RoleRoute roles={['vendor', 'admin']}><EditTour /></RoleRoute>} />
              <Route path="/add-vehicle" element={<RoleRoute roles={['vendor', 'admin']}><AddVehicle /></RoleRoute>} />

              {/* --- 💼 Admin & Vendor Booking Management --- */}
              <Route path='/admin/bookings' element={<RoleRoute roles={['admin']}><AdminBookings /></RoleRoute>} />
              <Route path='/vendor/bookings' element={<RoleRoute roles={['vendor', 'admin']}><VendorBookings /></RoleRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<div className="text-center py-20 font-bold text-gray-500">404 - Not Found</div>} />
            </Routes></PublicExperience>
            </Suspense>
          </main>

          {features.chatbot && <ChatBot />}
          <WhatsApp /> 
          <Footer />
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
