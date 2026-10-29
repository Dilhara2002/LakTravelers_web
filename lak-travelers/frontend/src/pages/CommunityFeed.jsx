import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

const CommunityFeed = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // CCTNS Form State
  const [formData, setFormData] = useState({
    comment: "",
    safetyScore: 5,
    hygieneScore: 5,
    serviceQuality: 5,
    targetType: "hotel",
    targetId: "",
  });

  // Fetch existing community experiences
  const fetchReviews = async () => {
    try {
      const { data } = await API.get('/reviews/all');
      setReviews(data.reviews || data); 
    } catch {
      toast.error("Failed to load community insights.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReviews();
  }, []);

  // Submit experience and recalibrate trust scores
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    if (!userInfo) {
      toast.warning("Please login to share your experience! 🔐");
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/reviews/submit', formData);
      
      toast.success("CCTNS: Trust Score Recalibrated! 🛡️");
      setFormData({ comment: "", safetyScore: 5, hygieneScore: 5, serviceQuality: 5, targetType: 'hotel', targetId: '' });
      fetchReviews(); 
    } catch {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] py-20 px-6 font-sans">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
        
        {/* --- LEFT: REVIEW FORM (DESIGN FROM SCREENSHOT) --- */}
        <div className="lg:col-span-5">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 sticky top-28">
            <div className="mb-8 text-center">
              <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                Share Experience
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-4 tracking-tighter">
                Contribute to <br/><span className="text-orange-500">Community Trust</span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <select value={formData.targetType} onChange={(e) => setFormData({...formData, targetType: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold text-sm">
                  <option value="hotel">Hotel</option>
                  <option value="vehicle">Vehicle</option>
                </select>
                <input value={formData.targetId} onChange={(e) => setFormData({...formData, targetId: e.target.value})} placeholder="Listing ID" className="col-span-2 p-3 bg-slate-50 rounded-xl font-bold text-sm" required pattern="[0-9a-fA-F]{24}" />
              </div>
              <textarea 
                className="w-full p-6 bg-slate-50 rounded-3xl font-bold text-sm border-none focus:ring-2 focus:ring-orange-400 outline-none transition-all h-40 resize-none"
                placeholder="How was the safety and service? Your nudge helps others!"
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                required
              />

              {/* Sliders Container */}
              <div className="space-y-6 bg-slate-50 p-6 rounded-3xl">
                {/* Safety Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400">Safety</label>
                    <span className="text-[10px] font-black text-orange-600">{formData.safetyScore}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={formData.safetyScore} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" onChange={(e)=>setFormData({...formData, safetyScore: e.target.value})} />
                </div>

                {/* Hygiene Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400">Hygiene</label>
                    <span className="text-[10px] font-black text-blue-600">{formData.hygieneScore}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={formData.hygieneScore} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" onChange={(e)=>setFormData({...formData, hygieneScore: e.target.value})} />
                </div>

                {/* Quality Slider (Added as per requirement) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400">Quality</label>
                    <span className="text-[10px] font-black text-slate-900">{formData.serviceQuality}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={formData.serviceQuality} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" onChange={(e)=>setFormData({...formData, serviceQuality: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-[#131926] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-slate-200 active:scale-95">
                {submitting ? "Submitting..." : "Submit Experience"}
              </button>
            </form>
          </div>
        </div>

        {/* --- RIGHT: LIVE COMMUNITY FEED --- */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex justify-between items-end pb-4 border-b border-slate-100">
            <h3 className="text-3xl font-black text-slate-800">Community Insights</h3>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Live Feedback Loop
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center font-black text-slate-300 text-xl animate-pulse italic">Recalibrating Cognitive Data...</div>
          ) : (
            <div className="grid gap-8">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white p-10 rounded-[4rem] shadow-xl border border-white hover:border-orange-100 transition-all group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#131926] rounded-2xl flex items-center justify-center text-white font-black text-2xl uppercase">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-slate-800">{review.user?.name}</h4>
                        <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                          🛡️ Verified Safety Node
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 font-bold text-xl leading-relaxed italic mb-10 pl-4 border-l-4 border-slate-100">
                    "{review.comment}"
                  </p>

                  {/* CCTNS Metrics Display */}
                  <div className="grid grid-cols-3 gap-6 border-t border-slate-50 pt-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety</p>
                      <p className="text-2xl font-black text-orange-600">{review.safetyScore}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hygiene</p>
                      <p className="text-2xl font-black text-blue-600">{review.hygieneScore}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quality</p>
                      <p className="text-2xl font-black text-slate-900">{review.serviceQuality || 5}/10</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CommunityFeed;
