import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from './models/Hotel.js';
import Vehicle from './models/Vehicle.js';
import Tour from './models/Tour.js';
import User from './models/User.js';
import db from './config/db.js';

dotenv.config();
db(); 

const importData = async () => {
  try {
    
    // await Hotel.deleteMany();
    // await Vehicle.deleteMany();
    // await Tour.deleteMany();

    // 
    const adminUser = "65a1234567890abcdef12345"; 

    // --- 🏨 SAMPLE HOTELS DATA ---
    const sampleHotels = [
      {
        user: adminUser,
        name: "Heritance Kandalama",
        location: "Sigiriya",
        description: "An architectural masterpiece integrated into the rock face, offering stunning views of Sigiriya rock.",
        pricePerNight: 45000,
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
        mapUrl: "https://goo.gl/maps/example1",
        luxuryGrade: "Luxury",
        veganOptions: true,
        wellness: ["Yoga", "Spa", "Gym", "Meditation"],
        amenities: ["Pool", "Free WiFi", "Eco-friendly", "Bird Watching"]
      },
      {
        user: adminUser,
        name: "98 Acres Resort & Spa",
        location: "Ella",
        description: "A scenic tea estate resort with breathtaking views of the Ella Gap and Little Adam's Peak.",
        pricePerNight: 55000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        mapUrl: "https://goo.gl/maps/example2",
        luxuryGrade: "Luxury",
        veganOptions: true,
        wellness: ["Spa", "Yoga", "Nature Trails"],
        amenities: ["Tea Plantation", "Private Balcony", "AC"]
      },
      {
        user: adminUser,
        name: "Cinnamon Citadel",
        location: "Kandy",
        description: "A riverside retreat in the hill capital, reflecting the royal grandeur of Kandy.",
        pricePerNight: 28000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        mapUrl: "https://goo.gl/maps/example3",
        luxuryGrade: "Standard",
        veganOptions: true,
        wellness: ["Gym", "Ayurveda Spa"],
        amenities: ["Pool", "Riverside Dining", "Parking"]
      },
      {
        user: adminUser,
        name: "Beach Backpackers",
        location: "Bentota",
        description: "Affordable and fun stay right on the beach, perfect for surfers and solo travelers.",
        pricePerNight: 4500,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
        mapUrl: "https://goo.gl/maps/example4",
        luxuryGrade: "Budget",
        veganOptions: false,
        wellness: ["Surfing"],
        amenities: ["Free WiFi", "Hostel Dorms", "Bar"]
      }
    ];

    // --- 🚗 SAMPLE VEHICLES DATA ---
    const sampleVehicles = [
      {
        user: adminUser,
        type: "Car",
        vehicleModel: "Mercedes-Benz E-Class",
        licensePlate: "WP-CAS-5566",
        driverName: "Anura Silva",
        capacity: 3,
        pricePerDay: 25000,
        description: "Premium luxury sedan for executive travel and high-end tourism.",
        contactNumber: "0712345678",
        images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d"],
        amenities: ["AC", "WiFi", "Leather Seats", "Bottled Water"],
        driverLanguages: ["English", "Sinhala", "French"],
        isPrivate: true
      },
      {
        user: adminUser,
        type: "Van",
        vehicleModel: "Toyota KDH High Roof",
        licensePlate: "WP-ND-8899",
        driverName: "Nimal Kumara",
        capacity: 12,
        pricePerDay: 15000,
        description: "Spacious van perfect for large family groups or small tour groups.",
        contactNumber: "0777654321",
        images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"],
        amenities: ["AC", "Adjustable Seats", "Entertainment System"],
        driverLanguages: ["English", "Sinhala", "Tamil"],
        isPrivate: true
      },
      {
        user: adminUser,
        type: "SUV",
        vehicleModel: "Mitsubishi Montero",
        licensePlate: "WP-KH-1122",
        driverName: "Sahan Perera",
        capacity: 5,
        pricePerDay: 18000,
        description: "Powerful 4x4 SUV suitable for hill country tours and off-road tracks.",
        contactNumber: "0755554433",
        images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70"],
        amenities: ["AC", "Off-road capable", "GPS", "Sunroof"],
        driverLanguages: ["English", "Sinhala"],
        isPrivate: true
      }
    ];

    // --- 🗺️ SAMPLE TOURS DATA ---
    const sampleTours = [
      {
        user: adminUser,
        name: "Sigiriya Cultural Exploration",
        description: "A guided journey through the ancient rock fortress and the surrounding villages.",
        destinations: "Sigiriya Rock, Pidurangala, Hiriwadunna",
        duration: "1 Day",
        price: 12000,
        groupSize: 10,
        image: "https://images.unsplash.com/photo-1588598142121-76c1f85517c7",
        categories: ["Cultural", "History"],
        activities: ["Hiking", "Photography", "Village Safari"],
        difficulty: "Moderate"
      },
      {
        user: adminUser,
        name: "Ella Peaks & Waterfalls Adventure",
        description: "Trek the famous Little Adam's Peak and witness the Nine Arch Bridge.",
        destinations: "Little Adam's Peak, Nine Arch Bridge, Rawana Falls",
        duration: "2 Days",
        price: 18000,
        groupSize: 5,
        image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
        categories: ["Adventure", "Nature"],
        activities: ["Trekking", "Swimming", "Train Ride"],
        difficulty: "Easy"
      }
    ];

    // Data Import කිරීම
    await Hotel.insertMany(sampleHotels);
    await Vehicle.insertMany(sampleVehicles);
    await Tour.insertMany(sampleTours);

    console.log('✅ Success: All Sample Data (Hotels, Vehicles, Tours) Imported!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();