import React, { useEffect } from 'react';

const LegalPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-16 md:py-24 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 animate-bounce-subtle">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
            Privacy <span className="text-blue-600">Policy</span>
          </h1>
          <p className="text-slate-500 text-lg">Your trust is our foundation at Lak Travelers.</p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">01. Introduction</h2>
            <p className="text-slate-600 leading-relaxed">
              Welcome to Lak Travelers, managed by <strong>Mr. Wijesinghe</strong>. We ensure your data is safe.
            </p>
          </section>

          <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-4">🛡️ Security</h2>
            <p className="text-slate-300">We use 100% encryption for all your travel bookings and personal details.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalPolicy;