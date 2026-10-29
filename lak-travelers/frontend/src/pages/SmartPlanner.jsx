import { whatsappUrl } from '../services/features';
import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js";
import { toast } from 'react-toastify';

const SmartPlanner = () => {
    // 1. Initialize State from localStorage to persist data
    const [formData, setFormData] = useState(() => {
        const savedForm = localStorage.getItem("plannerForm");
        return savedForm ? JSON.parse(savedForm) : {
            location: "",
            duration: "",
            preferences: "",
            transportType: "Private",
        };
    });

    const [itinerary, setItinerary] = useState(() => {
        return localStorage.getItem("plannerResult") || "";
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 2. Persist form and itinerary data whenever they change
    useEffect(() => {
        localStorage.setItem("plannerForm", JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        if (itinerary) {
            localStorage.setItem("plannerResult", itinerary);
        }
    }, [itinerary]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post("/ai/chat", {
                message: `I want to plan a ${formData.duration} day trip to ${formData.location}. 
                  My preferences are: ${formData.preferences}. 
                  I prefer ${formData.transportType} transport.`,
                history: []
            });
            setItinerary(data.reply);
            toast.success("CCTNS Cognitive Plan Generated! ✨");
        } catch (err) {
            console.error("AI Error:", err);
            toast.error("Failed to generate plan. Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Save the generated plan to the Database
    const handleSavePlan = async () => {
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) {
            toast.warning("Please login to save your plan! 🔐");
            return;
        }

        const userInfo = JSON.parse(userInfoString);
        const token = userInfo?.token;

        if (!token) {
            toast.error("Session expired. Please login again.");
            return;
        }

        setSaving(true);
        try {
            await API.post("/ai/save-plan", {
                location: formData.location,
                duration: formData.duration,
                preferences: formData.preferences,
                itinerary: itinerary
            });
            
            toast.success("Plan saved to your profile! 💾🎉");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save plan.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all data?")) {
            localStorage.removeItem("plannerForm");
            localStorage.removeItem("plannerResult");
            setFormData({ location: "", duration: "", preferences: "", transportType: "Private" });
            setItinerary("");
            toast.info("Planner reset successful.");
        }
    };

    // ✅ 🤖 CCTNS: Cognitive Nudging & Trust Modeling UI Logic
    const MarkdownComponents = {
        p: ({ children }) => {
            const content = React.Children.toArray(children).join("");
            
            // Check for a valid MongoDB ObjectID
            const idRegex = /([0-9a-fA-F]{24})/;
            const match = content.match(idRegex);

            if (match) {
                const id = match[1];
                const lowerContent = content.toLowerCase();
                
                const isHotel = lowerContent.includes('hotel') || lowerContent.includes('resort') || lowerContent.includes('stay') || lowerContent.includes('villa');
                const isVehicle = lowerContent.includes('vehicle') || lowerContent.includes('car') || lowerContent.includes('transport') || lowerContent.includes('van');

                return (
                    <div className="my-8 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform duration-300">
                        {/* CCTNS Pillar: Trust Label for Community Verified Data */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">🛡️ Community Verified & Recalibrated</span>
                        </div>
                        <p className="mb-4 text-slate-700 leading-relaxed font-semibold italic">
                            {content.replace(`(ID: ${id})`, "").replace(`ID: ${id}`, "").replace(`(${id})`, "")}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {isHotel && (
                                <Link to={`/hotels/${id}`} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-orange-200">
                                    🏨 Secure My Stay
                                </Link>
                            )}
                            {isVehicle && (
                                <Link to={`/vehicles/${id}`} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                                    🚗 Reserve Transport
                                </Link>
                            )}
                        </div>
                    </div>
                );
            }
            return <p className="mb-6 leading-relaxed text-slate-600 font-medium">{children}</p>;
        },
        // ✅ CCTNS Pillar: Cognitive Nudging (Suggestions and AI Insights)
        blockquote: ({ children }) => (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-8 border-orange-500 p-8 my-10 rounded-3xl shadow-xl shadow-orange-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500 text-6xl">💡</div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-orange-500 text-white p-2 rounded-xl text-xs font-black animate-pulse uppercase">AI Nudge</span>
                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Cognitive Suggestion</span>
                </div>
                <div className="text-slate-700 font-bold leading-relaxed italic text-lg relative z-10">
                    {children}
                </div>
            </div>
        ),
        h2: ({ children }) => {
            const text = String(children);
            if (text.includes("Logistics") || text.includes("Budget") || text.includes("Safety")) {
                return (
                    <h2 className="text-xl font-black text-slate-900 bg-slate-100/50 inline-block px-6 py-2 rounded-2xl mt-10 mb-6 border-l-4 border-orange-500">
                        {children}
                    </h2>
                );
            }
            return <h2 className="text-3xl font-black text-slate-800 mt-12 mb-6 tracking-tight">{children}</h2>;
        }
    };

    const shareOnWhatsApp = () => {
        if (!itinerary) return;
        const title = `*🌴 My Trusted Trip Plan - Lak Travelers (CCTNS)* \n\n`;
        const details = `📍 *Destination:* ${formData.location} \n⏳ *Duration:* ${formData.duration} Days \n\n`;
        const message = encodeURIComponent(title + details + `Plan yours at: ${window.location.origin}/smart-planner`);
        window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    };

    const downloadPDF = () => {
        const element = document.getElementById('printable-pdf-area');
        element.style.display = 'block';
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `LakTravelers_CCTNS_Plan_${formData.location || 'Itinerary'}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-orange-100">
            {/* --- MODERN HERO SECTION --- */}
            <div className="relative h-[550px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://media.chirpn.com/How_AI_Is_Revolutionizing_the_Travel_and_Tourism_Industry_Hero_Image_d28d4bc6c7.jpg"
                        className="w-full h-full object-cover scale-105"
                        alt="Sri Lanka"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-[#f8fafc] z-10" />
                </div>
                
                <div className="relative z-20 text-center space-y-6 px-6 max-w-4xl animate-in fade-in zoom-in duration-1000">
                    <span className="bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md border border-orange-500/30">
                        CCTNS AI Framework
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter">
                        Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-yellow-400">Planner</span>
                    </h1>
                    <p className="text-slate-200 text-lg md:text-2xl font-light max-w-2xl mx-auto leading-relaxed opacity-90">
                        Trustworthy travel guidance powered by cognitive nudging and real-time community feedback.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-30 pb-20">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* --- 🖋️ INPUT PANEL --- */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden sticky top-28">
                            <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Analysis
                                    </h2>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">CCTNS Engine</p>
                                </div>
                                <button onClick={handleReset} className="bg-white/10 hover:bg-red-500/20 text-white/70 px-3 py-1.5 rounded-xl transition-all border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Reset</span>
                                </button>
                            </div>

                            <form onSubmit={handleGenerate} className="p-8 space-y-7">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] ml-1">Destination</label>
                                    <input name="location" value={formData.location} placeholder="e.g. Ella or Mirissa" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500/20 focus:bg-white font-bold text-sm outline-none transition-all" onChange={handleChange} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] ml-1">Duration</label>
                                    <div className="relative">
                                        <input name="duration" type="number" value={formData.duration} placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white font-bold text-sm outline-none transition-all" onChange={handleChange} required />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] ml-1">Preferences</label>
                                    <textarea name="preferences" value={formData.preferences} placeholder="Vegan meals, Safety first, Local tips..." className="w-full p-4 bg-slate-100/50 rounded-2xl border-none font-bold h-32 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition-all resize-none" onChange={handleChange} />
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl disabled:bg-slate-300">
                                    {loading ? "Cognitive Analysis..." : "Generate Guided Plan"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* --- RIGHT: ITINERARY RESULT PANEL --- */}
                    <div className="lg:col-span-8">
                        {itinerary ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                <div className="bg-white p-8 md:p-16 rounded-[3.5rem] border border-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-100">
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight text-slate-800">Your Trusted Journey</h2>
                                            <p className="text-emerald-600 text-[10px] font-black uppercase mt-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Real-time Reputation Recalibrated
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button onClick={handleSavePlan} disabled={saving} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:bg-slate-100">
                                                {saving ? "SAVING..." : "💾 SAVE"}
                                            </button>
                                            <button onClick={shareOnWhatsApp} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95">
                                                💬 SHARE
                                            </button>
                                            <button onClick={downloadPDF} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-orange-500 transition-all shadow-xl active:scale-95">
                                                📄 PDF
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-lg prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:my-10 prose-blockquote:border-none prose-blockquote:p-0">
                                        <ReactMarkdown components={MarkdownComponents}>{itinerary}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/40 backdrop-blur-md border-2 border-dashed border-slate-200 h-[600px] rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl mb-8 animate-pulse text-emerald-500">🛡️</div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">CCTNS Engine Ready</h3>
                                <p className="text-slate-400 mt-4 max-w-sm mx-auto font-medium">Enter your criteria to get an AI-nudged, community-verified travel plan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 📄 HIDDEN PDF TEMPLATE --- */}
            <div id="printable-pdf-area" style={{ display: 'none', padding: '50px', backgroundColor: 'white' }}>
                <div style={{ borderBottom: '5px solid #10b981', paddingBottom: '30px', marginBottom: '40px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '900', color: '#064e3b' }}>LAK TRAVELERS</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#059669', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px' }}>CCTNS Trusted Travel Framework</p>
                    </div>
                </div>
                
                <div style={{ backgroundColor: '#f0fdf4', padding: '30px', borderRadius: '25px', marginBottom: '40px', border: '1px solid #d1fae5' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#065f46', fontWeight: '900' }}>TRIP TO {formData.location?.toUpperCase()}</h2>
                    <p style={{ margin: 0, fontSize: '16px', color: '#059669', fontWeight: 'bold' }}>{formData.duration} Days - AI Guided & Community Verified</p>
                </div>

                <div className="pdf-markdown-content" style={{ color: '#334155', lineHeight: '1.8', fontSize: '16px' }}>
                    <ReactMarkdown>{itinerary}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default SmartPlanner;
