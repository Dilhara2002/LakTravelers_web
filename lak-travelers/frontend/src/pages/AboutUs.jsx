import React from 'react';
import wijesinghe from "../assets/founder.jpg"; 

const AboutUs = () => {



  return (
    <div className="bg-[#fcfcfc] min-h-screen py-16 md:py-24 font-sans overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* --- Hero Section --- */}
        <div className="text-center mb-20 opacity-100 transition-opacity duration-1000">
          <span className="text-blue-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 block underline decoration-blue-200 decoration-2 underline-offset-8">Our Journey</span>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
            We Create Memories <br /> 
            <span className="text-blue-600">Across Sri Lanka</span>
          </h1>
          <h2 className="text-2xl font-bold mb-4">About LakTravelers</h2>
          <p className="text-slate-500 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
            LakTravelers is a travel and transportation brand operating under IDW Private Limited. IDW (Pvt) Ltd is our parent company; we offer personalized travel experiences and transportation services across Sri Lanka.
          </p>
          <p className="text-slate-500 text-base md:text-xl max-w-3xl mx-auto leading-relaxed mt-5">
            As one of the business ventures under IDW Private Limited, LakTravelers is committed to making every journey convenient, enjoyable, and memorable.
          </p>
        </div>

        {/* --- Mission & Vision --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div data-reveal className="bg-white p-10 rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-100 transition-transform hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-blue-200">🎯</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
            <p className="text-slate-500 leading-relaxed">
              To provide authentic, sustainable, and luxury travel experiences in Sri Lanka while ensuring the highest level of safety and local expertise for every traveler.
            </p>
          </div>
          <div data-reveal className="bg-white p-10 rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-100 transition-transform hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg">👁️</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
            <p className="text-slate-500 leading-relaxed">
              To be the most trusted name in Sri Lankan tourism, connecting the world with the rich culture and natural beauty of our motherland.
            </p>
          </div>
        </div>

        {/* --- Who is Ishan Wijesinghe Card --- */}
        <div data-reveal className="bg-slate-900 rounded-[4rem] p-8 md:p-16 text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-blue-900/10">
          <div className="travel-founder-photo w-60 h-80 md:w-72 md:h-96 rounded-[2.5rem] overflow-hidden bg-slate-800 flex-shrink-0 border-4 border-slate-700 shadow-inner">
            <img 
              src={wijesinghe} 
              alt="Ishan Wijesinghe" 
              loading="lazy" decoding="async" className="w-full h-full object-cover object-top" 
              onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Mr.+Wijesinghe" }}
            />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <span className="bg-blue-600 text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">Founder — LakTravelers</span>
            <h2 className="text-3xl md:text-5xl font-black italic">"Travel is the only thing you buy that makes you richer."</h2>
            <p className="text-slate-400 text-lg font-medium">Ishan Wijesinghe — Founder — LakTravelers</p>
            <p className="text-slate-300 leading-relaxed max-w-xl text-base md:text-lg">
              I founded Lak Travelers to help you experience Sri Lanka in a way that feels personal. From listening to your travel plans to helping with the details, I focus on thoughtful customer care and reliable service so you can enjoy the journey.
            </p>
          </div>
        </div>

        {/* --- Location & Contact --- */}
        <div data-reveal className="mt-24 text-center">
          <div className="inline-block p-1 px-4 mb-6 bg-slate-100 rounded-full text-slate-500 text-[10px] font-bold uppercase tracking-widest italic border border-slate-200">
            Founded by Ishan Wijesinghe
          </div>
          <p className="text-slate-600 font-bold text-lg md:text-xl mb-4 italic">73/D Walagedara, Wattappola, Sri Lanka.</p>
          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 font-black text-blue-600 text-lg">
            <a href="tel:+94723201365" className="hover:text-blue-800 transition-colors underline decoration-blue-200 decoration-2 underline-offset-4">+94 72 320 1365</a>
            <span className="hidden md:block text-slate-300">|</span>
            <a href="mailto:laktravelers@gmail.com" className="hover:text-blue-800 transition-colors underline decoration-blue-200 decoration-2 underline-offset-4">laktravelers@gmail.com</a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
