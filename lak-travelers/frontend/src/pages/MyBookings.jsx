import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js";
import { toast } from 'react-toastify';
import { resolveAssetUrl } from '../services/assets';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [aiPlans, setAiPlans] = useState([]); 
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [loading, setLoading] = useState(true);

  // 1. Fetch Standard Reservations
  const fetchMyBookings = useCallback(async () => {
    try {
      const { data } = await API.get('/bookings/mybookings');
      setBookings(data);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
    }
  }, [navigate]);

  // 2. Fetch Saved AI Itineraries
  const fetchMyPlans = useCallback(async () => {
    try {
      const { data } = await API.get('/ai/my-plans'); 
      setAiPlans(data);
    } catch (error) {
      console.error("AI Plans Fetch Error:", error);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchMyBookings(), fetchMyPlans()]);
      setLoading(false);
    };
    loadAllData();
  }, [fetchMyBookings, fetchMyPlans]);

  // ✅ Delete Plan Logic
  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this saved plan?")) {
      try {
        await API.delete(`/ai/plan/${id}`);
        toast.success("Plan deleted successfully!");
        fetchMyPlans(); // Refresh the list
      } catch {
        toast.error("Failed to delete plan.");
      }
    }
  };

  // ✅ View Plan in SmartPlanner Logic
  const handleViewPlan = (plan) => {
    // Store data in localStorage to persist across navigation
    localStorage.setItem("plannerForm", JSON.stringify({
      location: plan.location,
      duration: plan.duration,
      preferences: plan.preferences,
      transportType: "Private", 
    }));
    localStorage.setItem("plannerResult", plan.itinerary);
    
    // Redirect to the Smart Planner page
    navigate('/smart-planner');
  };

  // PDF Download Logic
  const downloadPlanPDF = (plan) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif;">
        <h1 style="color: #1e293b; border-bottom: 4px solid #f97316; padding-bottom: 10px;">LAK TRAVELERS</h1>
        <h2 style="margin-top: 20px;">Trip to ${plan.location} (${plan.duration} Days)</h2>
        <p><b>Preferences:</b> ${plan.preferences || 'N/A'}</p>
        <hr/>
        <div style="line-height: 1.6;">${plan.itinerary}</div>
      </div>
    `;
    
    const opt = {
      margin: 0.5,
      filename: `Plan_${plan.location}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await API.put(`/bookings/${id}/cancel`);
        fetchMyBookings();
      } catch (error) {
        toast.error(error.response?.data?.message || "Action failed");
      }
    }
  };

  const getImageUrl = (imagePath) => resolveAssetUrl(imagePath, 'https://placehold.co/400x300?text=No+Image');

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Travel Dashboard 🎒</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage your bookings and AI-generated trip plans.</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'bookings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Reservations ({bookings.length})
            </button>
            <button 
              onClick={() => setActiveTab('ai-plans')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'ai-plans' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              AI Itineraries ({aiPlans.length})
            </button>
          </div>
        </header>

        {/* --- SECTION 1: MY BOOKINGS --- */}
        {activeTab === 'bookings' && (
          bookings.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
              <span className="text-5xl mb-4 block">🎫</span>
              <p className="text-slate-400 font-bold mb-6">No active reservations found.</p>
              <Link to="/" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black inline-block hover:bg-blue-600 transition shadow-xl">Start Exploring</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bookings.map((booking) => {
                const item = booking.hotel || booking.tour || booking.vehicle;
                const statusKey = booking.status ? booking.status.toLowerCase() : 'pending';
                const statusStyles = { confirmed: "bg-emerald-500", pending: "bg-amber-500", cancelled: "bg-rose-500", rejected: "bg-slate-400" };
                if (!item) return null;
                const title = item.name || item.vehicleModel || "Booking Item";
                const imageSrc = Array.isArray(item.images) ? item.images[0] : (item.image || item.images);

                return (
                  <div key={booking._id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full group">
                    <div className="relative h-52 overflow-hidden">
                      <img src={getImageUrl(imageSrc)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
                      <div className={`absolute top-5 left-5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${statusStyles[statusKey] || 'bg-gray-500'}`}>
                        {statusKey}
                      </div>
                    </div>
                    <div className="p-8 flex-grow">
                      <h3 className="text-xl font-black text-slate-900 mb-4">{title}</h3>
                      <div className="space-y-3 text-xs font-bold">
                        <div className="flex justify-between text-slate-400"><span>Amount:</span><span className="text-slate-900 font-black text-sm">Rs.{booking.totalPrice?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-slate-400"><span>Date:</span><span className="text-slate-700">{booking.checkInDate || booking.tourDate || booking.pickupDate}</span></div>
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-8">
                      <span className="text-[10px] text-slate-300 font-black uppercase">REF: {booking._id.slice(-6)}</span>
                      {statusKey === 'pending' && (
                        <button onClick={() => handleCancel(booking._id)} className="text-rose-500 font-black text-[10px] uppercase hover:underline transition">Cancel</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* --- SECTION 2: SAVED AI PLANS --- */}
        {activeTab === 'ai-plans' && (
          aiPlans.length === 0 ? (
            <div className="bg-blue-50 rounded-[3rem] p-16 text-center border border-blue-100 shadow-sm max-w-xl mx-auto">
              <span className="text-5xl mb-4 block">🪄</span>
              <p className="text-blue-900 font-black mb-6 text-xl">No AI Itineraries Saved Yet.</p>
              <Link to="/smart-planner" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black inline-block hover:bg-blue-700 transition shadow-xl">Go to Smart Planner</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {aiPlans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group">
                  
                  {/* 🗑️ Delete Plan Button */}
                  <button 
                    onClick={() => handleDeletePlan(plan._id)}
                    className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="mb-6">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Saved AI Plan</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">{plan.location}</h3>
                    <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-wider">{plan.duration} Day Adventure</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Preferences:</p>
                    <p className="text-xs font-bold text-slate-600 italic line-clamp-2">"{plan.preferences || 'General Exploration'}"</p>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button 
                      onClick={() => handleViewPlan(plan)}
                      className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition"
                    >
                      VIEW DETAILS
                    </button>
                    <button 
                      onClick={() => downloadPlanPDF(plan)} 
                      className="px-6 py-3.5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition text-lg"
                    >
                      📥
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyBookings;
