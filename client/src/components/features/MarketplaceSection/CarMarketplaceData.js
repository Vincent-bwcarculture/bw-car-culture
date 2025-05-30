// Update to CarMarketplaceData.js
export const sampleCars = [
  {
    id: 1,
    title: "2023 BMW M4 Competition",
    price: 89900,
    mainImage: "/images/f80.jpg",
    gallery: [
      "/images/f80.jpg",
      "/images/f80-front.jpg",
      "/images/f80-rear.jpg",
      "/images/f80-interior.jpg"
    ],
    year: 2023,
    mileage: "1,200",
    condition: "New",
    specs: {
      engine: "3.0L Twin-Turbo Inline-6",
      power: "503 hp",
      torque: "479 lb-ft",
      transmission: "8-Speed Automatic",
      drivetrain: "RWD",
      fuelType: "Premium Gasoline",
      fuelEconomy: "16 city / 23 highway"
    },
    dealer: {
      name: "BMW of Beverly Hills",
      location: "Los Angeles, CA",
      rating: 4.8,
      reviews: 128,
      avatar: "/images/dealer-avatar.jpg",
      verified: true,
      listingsCount: 45,
      yearsActive: 15
    }
  },
  // ... other cars with the same structure
];