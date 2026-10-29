import { useEffect, useState } from "react";
import API from "../services/api";

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ 
    show: false, 
    booking: null, 
    status: "", 
    message: "", 
    problem: "", 
    solution: "" 
  });

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/bookings/vendor/my");
      setBookings(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    try {
      await API.put(`/bookings/${actionModal.booking._id}/status`, {
        status: actionModal.status.toLowerCase(),
      });
      setActionModal({ show: false, booking: null, status: '', message: '', problem: '', solution: '' });
      await fetchMyBookings();
    } catch (error) {
      alert(error.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="text-center mt-20 font-bold animate-pulse text-indigo-600">Loading Vendor Bookings...</div>;

  return (
    <div className="p-8 mt-20 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Booking Requests</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your service reservations and schedules</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 font-bold text-indigo-600">
            Total Requests: {bookings.length}
          </div>
        </div>

        <div className="grid gap-6">
          {bookings.map((b) => {
            const serviceName = b.hotel ? b.hotel.name : b.tour ? b.tour.name : b.vehicle?.vehicleModel;

            return (
              <div key={b._id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row">
                
                {/* 1. SERVICE & CUSTOMER SECTION */}
                <div className="p-8 flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                      b.hotel ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {b.hotel ? "🏨 Hotel" : b.tour ? "🗺️ Tour" : "🚗 Vehicle"}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-bold text-slate-400">ID: #{b._id.slice(-6)}</span>
                  </div>

                  <h2 className="text-3xl font-black text-slate-800 mb-6">{serviceName}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Customer Details */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reserved By</p>
                      <p className="font-extrabold text-slate-800 text-lg">{b.user?.name}</p>
                      <p className="text-slate-500 text-sm font-medium">{b.user?.email}</p>
                    </div>

                    {/* DATES SECTION (FROM - TO) */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration Period</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">From</p>
                          <p className="font-bold text-slate-700">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <span className="text-slate-300 font-bold">→</span>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">To</p>
                          <p className="font-bold text-slate-700">{b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1 md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earning</p>
                      <p className="text-2xl font-black text-indigo-600">Rs. {b.totalPrice?.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">Inclusive of taxes</p>
                    </div>
                  </div>
                </div>

                {/* 2. ACTIONS SECTION */}
                <div className="bg-slate-50 border-l border-slate-100 p-8 lg:w-72 flex flex-col justify-center items-center gap-4">
                  <div className={`w-full py-3 rounded-2xl text-center font-black text-sm uppercase tracking-widest border ${
                    b.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-600' : 
                    b.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'
                  }`}>
                    {b.status}
                  </div>

                  {b.status === 'pending' && (
                    <div className="w-full space-y-3">
                      <button 
                        onClick={() => setActionModal({ show: true, booking: b, status: "Confirmed" })}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-all duration-300 shadow-lg shadow-slate-200 active:scale-95"
                      >
                        Accept Booking
                      </button>
                      <button 
                        onClick={() => setActionModal({ show: true, booking: b, status: "Rejected" })}
                        className="w-full bg-white text-red-600 border border-red-100 py-4 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL FOR ACCEPT/REJECT */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <form onSubmit={handleUpdateStatus} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className={`p-10 text-white ${actionModal.status === 'Confirmed' ? 'bg-green-600' : 'bg-red-600'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">{actionModal.status === 'Confirmed' ? 'Approve' : 'Reject'}</h2>
                  <p className="text-white/80 font-medium mt-2">Send final confirmation to {actionModal.booking?.user?.name}</p>
                </div>
                <button type="button" onClick={() => setActionModal({show:false})} className="text-3xl text-white/50 hover:text-white">✕</button>
              </div>
            </div>

            <div className="p-10 space-y-6">
              {actionModal.status === 'Confirmed' ? (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Confirmation Note</label>
                  <textarea 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-green-100 outline-none transition"
                    rows="4"
                    placeholder="e.g. We've reserved your spot! See you soon."
                    onChange={(e) => setActionModal({...actionModal, message: e.target.value})}
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Rejection Reason</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-red-100 outline-none transition"
                      rows="3"
                      placeholder="e.g. Sorry, we are undergoing renovations."
                      onChange={(e) => setActionModal({...actionModal, problem: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Alternative Solution</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-100 outline-none transition"
                      rows="2"
                      placeholder="e.g. You can book for the next weekend."
                      onChange={(e) => setActionModal({...actionModal, solution: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className={`w-full py-5 rounded-[1.5rem] font-black text-white text-lg shadow-xl transition-all active:scale-95 ${
                actionModal.status === 'Confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
                SUBMIT FINAL {actionModal.status.toUpperCase()}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VendorBookings;
