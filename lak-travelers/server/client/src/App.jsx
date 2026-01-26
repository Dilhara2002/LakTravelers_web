import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CurrencyProvider } from './context/CurrencyContext';

// Pages Import
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import MyBookings from "./pages/MyBookings";
import VendorSetup from "./pages/VendorSetup";
import HotelList from "./pages/HotelList";
import HotelDetails from "./pages/HotelDetails";
import AddHotel from "./pages/AddHotel";
import EditHotel from "./pages/EditHotel";
import TourList from "./pages/TourList";
import TourDetails from "./pages/TourDetails";
import AddTour from "./pages/AddTour";
import EditTour from "./pages/EditTour";
import VehicleList from "./pages/VehicleList";
import VehicleDetails from "./pages/VehicleDetails";
import AddVehicle from "./pages/AddVehicle";
import SmartPlanner from "./pages/SmartPlanner"; 
import CommunityFeed from "./pages/CommunityFeed";

import LegalPolicy from "./pages/LegalPolicy";
import AboutUs from "./pages/AboutUs";

// Components Import
import ChatBot from './components/ChatBot'; 
import AdminBookings from './pages/AdminBookings';
import VendorBookings from './pages/VendorBookings';

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

function App() {
  return (
    <CurrencyProvider>
      <Router>
        {/* limit={1} also helps control multiple simultaneous notifications */}
        <ToastContainer position="top-center" autoClose={3000} limit={1} />
        
        <div className="font-sans bg-gray-50 text-gray-900 min-h-screen flex flex-col relative">
          <Navbar />
          
          <main className="pt-24 flex-grow px-4 md:px-0">
            <Routes>
              {/* --- 🌍 Public Routes --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/hotels" element={<HotelList />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route path="/tours" element={<TourList />} />
              <Route path="/tours/:id" element={<TourDetails />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/vehicles/:id" element={<VehicleDetails />} />
              <Route path="/privacy" element={<LegalPolicy />} />
              <Route path="/about" element={<AboutUs />} />

              {/* --- 🔐 Protected AI & Community Routes --- */}
              <Route path="/smart-planner" element={
                <ProtectedRoute>
                  <SmartPlanner />
                </ProtectedRoute>
              } /> 
              
              <Route path="/community" element={
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
              <Route path="/add-hotel" element={<ProtectedRoute><AddHotel /></ProtectedRoute>} />
              <Route path="/edit-hotel/:id" element={<ProtectedRoute><EditHotel /></ProtectedRoute>} />
              <Route path="/add-tour" element={<ProtectedRoute><AddTour /></ProtectedRoute>} />
              <Route path="/edit-tour/:id" element={<ProtectedRoute><EditTour /></ProtectedRoute>} />
              <Route path="/add-vehicle" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />

              {/* --- 💼 Admin & Vendor Booking Management --- */}
              <Route path='/admin/bookings' element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
              <Route path='/vendor/bookings' element={<ProtectedRoute><VendorBookings /></ProtectedRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<div className="text-center py-20 font-bold text-gray-500">404 - Not Found</div>} />
            </Routes>
          </main>

          <ChatBot /> 
          <Footer />
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;