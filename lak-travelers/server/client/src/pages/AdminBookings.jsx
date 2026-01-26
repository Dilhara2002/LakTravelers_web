import { useEffect, useState } from "react";
import API from "../services/api";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null); // To show details when clicked

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await API.get("/bookings/admin/all");
        setBookings(data);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="p-8 mt-20">
      <h1 className="text-3xl font-bold mb-6">All Bookings (Admin) 🛡️</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking List */}
        <div className="space-y-4">
          {bookings.map((b) => (
            <div 
              key={b._id} 
              onClick={() => setSelectedBooking(b)}
              className={`p-4 border rounded-xl cursor-pointer transition shadow-sm hover:bg-slate-50 ${selectedBooking?._id === b._id ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">Booking #{b._id.slice(-6)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">Service: {b.hotel?.name || b.tour?.name || b.vehicle?.vehicleModel}</p>
            </div>
          ))}
        </div>

        {/* Full Details Panel */}
        {selectedBooking && (
          <div className="bg-white p-6 border rounded-2xl shadow-lg sticky top-24">
            <h2 className="text-xl font-bold border-b pb-4 mb-4 text-blue-600">Full Details</h2>
            
            <div className="space-y-6">
              <section>
                <h3 className="font-bold text-slate-700 underline">User Details (Customer)</h3>
                <p>Name: {selectedBooking.user?.name}</p>
                <p>Email: {selectedBooking.user?.email}</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-700 underline">Booking Details</h3>
                <p>Date: {new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                <p>Total Price: Rs. {selectedBooking.totalPrice}</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-700 underline">Vendor Details (Service Provider)</h3>
                {/* These can be accessed this way because Vendor details are populated in the Controller */}
                <p>Vendor Name: {selectedBooking.hotel?.user?.name || selectedBooking.tour?.user?.name || selectedBooking.vehicle?.user?.name}</p>
                <p>Vendor Email: {selectedBooking.hotel?.user?.email || selectedBooking.tour?.user?.email || selectedBooking.vehicle?.user?.email}</p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;