import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem("userInfo")));
  const [loading, setLoading] = useState(true);

  // --- Modal & Management States ---
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false); // Review Modal
  const [showEditModal, setShowEditModal] = useState(false); // Manual Add/Edit Modal
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [allUsers, setAllUsers] = useState([]); 
  const [activeTab, setActiveTab] = useState("overview"); 

  // --- Form State for Manual Add/Edit ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isApproved: true,
    vendorDetails: { businessName: "", phone: "" }
  });

  const [adminStats, setAdminStats] = useState({
    usersCount: 0, vendorsCount: 0, bookingsCount: 0,
    hotelsCount: 0, toursCount: 0, vehiclesCount: 0, totalRevenue: 0,
  });

  const [pendingVendors, setPendingVendors] = useState([]);
  const [vendorStats, setVendorStats] = useState({
    myHotels: 0, myTours: 0, myVehicles: 0, myBookingsCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (user.role === "admin") {
        const [statsRes, pendingRes, usersRes] = await Promise.all([
          API.get("/users/admin-stats").catch(() => ({ data: {} })),
          API.get("/users/pending").catch(() => ({ data: [] })),
          API.get("/users/admin/all").catch(() => ({ data: [] }))
        ]);
        setAdminStats({ ...statsRes.data, totalRevenue: statsRes.data.totalRevenue || 0 });
        setPendingVendors(pendingRes.data || []);
        setAllUsers(usersRes.data || []);
      }
      if (user.role === "vendor") {
        const [hotels, tours, vehicles, bookings] = await Promise.all([
          API.get("/hotels").catch(() => ({ data: [] })),
          API.get("/tours").catch(() => ({ data: [] })),
          API.get("/vehicles").catch(() => ({ data: [] })),
          API.get("/bookings/vendor/my").catch(() => ({ data: [] })),
        ]);
        const uid = user._id;
        setVendorStats({
          myHotels: hotels.data.filter(h => (h.user === uid || h.user?._id === uid)).length,
          myTours: tours.data.filter(t => (t.user === uid || t.user?._id === uid)).length,
          myVehicles: vehicles.data.filter(v => (v.user === uid || v.user?._id === uid)).length,
          myBookingsCount: bookings.data.length,
        });
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) navigate("/login");
    else fetchDashboardData();
  }, [fetchDashboardData, navigate, user]);

  // --- Manual Actions ---
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ name: "", email: "", password: "", role: "user", isApproved: true, vendorDetails: { businessName: "", phone: "" } });
    setShowEditModal(true);
  };

  const handleOpenEdit = (u) => {
    setIsEditMode(true);
    setSelectedVendor(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      isApproved: u.isApproved,
      password: "",
      vendorDetails: { 
        businessName: u.vendorDetails?.businessName || "", 
        phone: u.vendorDetails?.phone || "" 
      }
    });
    setShowEditModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await API.put(`/users/admin/update/${selectedVendor._id}`, formData);
      } else {
        await API.post("/users/admin/create", formData);
      }
      setShowEditModal(false);
      fetchDashboardData();
    } catch (err) { alert(err.response?.data?.message || "Action failed"); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this vendor?")) return;
    try {
      await API.put(`/users/approve/${id}`);
      setShowModal(false);
      fetchDashboardData();
    } catch { alert("Action failed."); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this account permanently?")) return;
    try {
      await API.delete(`/users/admin/${id}`);
      fetchDashboardData();
    } catch { alert("Delete failed."); }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold mt-2 text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  /* ================= ADMIN UI ================= */
  if (user?.role === "admin") {
    const adminChart = [
      { name: "Hotels", count: adminStats.hotelsCount || 0 },
      { name: "Tours", count: adminStats.toursCount || 0 },
      { name: "Vehicles", count: adminStats.vehiclesCount || 0 },
    ];
    const userChart = [
      { name: "Travelers", value: Math.max(0, adminStats.usersCount - adminStats.vendorsCount) },
      { name: "Vendors", value: adminStats.vendorsCount },
    ];

    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Master Console 🛡️</h1>
              <p className="text-gray-500">Global system management & manual account control.</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              {['overview', 'applications', 'users'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {tab === 'users' ? 'Management' : tab}
                </button>
              ))}
            </div>
          </header>

          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard title="Total Users" value={adminStats.usersCount} color="bg-slate-100 text-slate-600" icon="👥" />
                <StatCard title="Active Bookings" value={adminStats.bookingsCount} color="bg-blue-100 text-blue-600" icon="📅" />
                <StatCard title="Revenue" value={`Rs. ${adminStats.totalRevenue.toLocaleString()}`} color="bg-emerald-100 text-emerald-600" icon="💰" />
                <StatCard title="Services" value={adminStats.hotelsCount + adminStats.toursCount + adminStats.vehiclesCount} color="bg-amber-100 text-amber-600" icon="🛠️" />
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={adminChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={userChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {userChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === "applications" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-gray-100"><h2 className="text-xl font-black text-slate-800">Pending Vendor Approvals</h2></div>
              <div className="divide-y divide-gray-100">
                {pendingVendors.length === 0 ? <p className="p-10 text-center text-gray-400 font-bold">No applications to review.</p> :
                  pendingVendors.map(v => (
                    <div key={v._id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <img src={v.profileImage || "/default-avatar.png"} className="w-12 h-12 rounded-full object-cover bg-gray-200 border" alt="" />
                        <div><p className="font-bold text-slate-900">{v.vendorDetails?.businessName || v.name}</p><p className="text-xs text-gray-500">{v.email}</p></div>
                      </div>
                      <button onClick={() => { setSelectedVendor(v); setShowModal(true); }} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm">Review Full Profile</button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">User Management</h2>
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Manual Add</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr><th className="p-4 text-xs font-black uppercase text-gray-400">User</th><th className="p-4 text-xs font-black uppercase text-gray-400">Role</th><th className="p-4 text-xs font-black uppercase text-gray-400">Status</th><th className="p-4 text-xs font-black uppercase text-gray-400 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">{u.name.charAt(0)}</div>
                            <div><p className="text-sm font-bold text-slate-800">{u.name}</p><p className="text-[10px] text-gray-400">{u.email}</p></div>
                          </div>
                        </td>
                        <td className="p-4"><span className="text-xs font-bold uppercase">{u.role}</span></td>
                        <td className="p-4"><span className={`text-[10px] font-black px-2 py-1 rounded-full ${u.isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{u.isApproved ? 'ACTIVE' : 'PENDING'}</span></td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleOpenEdit(u)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg">Edit</button>
                          <button onClick={() => handleDeleteUser(u._id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* --- MANUAL ADD/EDIT MODAL --- */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
               <button type="button" onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 text-gray-400 text-2xl">&times;</button>
               <h2 className="text-2xl font-black mb-6">{isEditMode ? 'Edit Account' : 'Add New Account'}</h2>
               <div className="space-y-4">
                  <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />
                  <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />
                  {!isEditMode && <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />}
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full border p-3 rounded-xl outline-none bg-white">
                    <option value="user">Traveler</option><option value="vendor">Vendor</option><option value="admin">Admin</option>
                  </select>
                  {formData.role === 'vendor' && (
                    <>
                      <input type="text" placeholder="Business Name" value={formData.vendorDetails.businessName} onChange={(e) => setFormData({...formData, vendorDetails: {...formData.vendorDetails, businessName: e.target.value}})} className="w-full border p-3 rounded-xl outline-none" />
                      <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isApproved} onChange={(e) => setFormData({...formData, isApproved: e.target.checked})} id="appr" /><label htmlFor="appr" className="text-xs font-bold">Approved Account</label></div>
                    </>
                  )}
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black mt-8 hover:bg-slate-800">{isEditMode ? 'Save Changes' : 'Create Account'}</button>
            </form>
          </div>
        )}

        {/* --- REVIEW MODAL --- */}
        {showModal && selectedVendor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 text-3xl">&times;</button>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Vendor Verification</h2>
              <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                <div><p><b>Business:</b> {selectedVendor.vendorDetails?.businessName}</p><p><b>Phone:</b> {selectedVendor.vendorDetails?.phone}</p></div>
                <div><p><b>NIC/Passport:</b> {selectedVendor.vendorDetails?.registrationNumber}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-10">
                <img src={selectedVendor.profileImage} className="w-full h-32 object-cover rounded-xl border" alt="" />
                <img src={selectedVendor.vendorDetails?.idFront} className="w-full h-32 object-cover rounded-xl border" alt="" />
                <img src={selectedVendor.vendorDetails?.idBack} className="w-full h-32 object-cover rounded-xl border" alt="" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleApprove(selectedVendor._id)} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black">Approve</button>
                <button onClick={() => handleDeleteUser(selectedVendor._id)} className="flex-1 bg-rose-100 text-rose-600 py-4 rounded-2xl font-black">Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================= VENDOR UI ================= */
  if (user?.role === "vendor") {
    const vendorChart = [
      { name: "Hotels", count: vendorStats.myHotels },
      { name: "Tours", count: vendorStats.myTours },
      { name: "Vehicles", count: vendorStats.myVehicles },
    ];
    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div><h1 className="text-3xl font-black text-slate-900">Partner Dashboard 🏢</h1><p className="text-gray-500">Manage your business assets and track earnings.</p></div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black ${user.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{user.isApproved ? "VERIFIED PARTNER ✅" : "PENDING APPROVAL ⏳"}</div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <StatCard title="Hotels" value={vendorStats.myHotels} color="bg-blue-50 text-blue-600" icon="🏨" />
            <StatCard title="Tours" value={vendorStats.myTours} color="bg-emerald-50 text-emerald-600" icon="🗺️" />
            <StatCard title="Vehicles" value={vendorStats.myVehicles} color="bg-amber-50 text-amber-600" icon="🚗" />
            <StatCard title="Bookings" value={vendorStats.myBookingsCount} color="bg-indigo-50 text-indigo-600" icon="📦" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black mb-8 uppercase tracking-tight">Inventory Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendorChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#10b981" radius={[10, 10, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-3xl h-fit">
                <h3 className="text-xl font-bold mb-4">Grow your Business 📈</h3>
                <p className="text-slate-400 text-sm mb-6">List new properties or tours to attract more travelers.</p>
                <div className="space-y-3">
                    <Link to="/add-hotel" className="block w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-center">Add Hotel</Link>
                    <Link to="/vendor/bookings" className="block w-full border border-slate-700 py-3 rounded-xl font-bold text-center">Manage Bookings</Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= TRAVELER UI ================= */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full">
        <h1 className="text-3xl font-black mb-2 text-slate-900">Ayubowan, {user?.name.split(' ')[0]}! 🙏</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">Ready for your next adventure in Sri Lanka?</p>
        <div className="space-y-3"><Link to="/my-bookings" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">My Reservations</Link><Link to="/" className="block w-full border border-gray-200 text-slate-600 py-4 rounded-2xl font-bold">Browse Tours</Link></div>
      </div>
    </div>
  );
};

export default Dashboard;
