// src/constants/listingConstants.js

export const SAFETY_FEATURES = [
    'ABS',
    'Airbags',
    'Stability Control',
    'Traction Control',
    'Lane Departure Warning',
    'Forward Collision Warning',
    'Blind Spot Monitor',
    'Parking Sensors',
    'Backup Camera',
    'Night Vision',
    'Automatic Emergency Braking',
    'Tire Pressure Monitoring',
    'Anti-Theft System',
    'Emergency Call System',
    'ISOFIX Child Seat Anchors'
  ];
  
  export const COMFORT_FEATURES = [
    'Air Conditioning',
    'Automatic Climate Control',
    'Multi-Zone Climate Control',
    'Heated Seats',
    'Ventilated Seats',
    'Massage Seats',
    'Leather Upholstery',
    'Power Seats',
    'Memory Seats',
    'Power Windows',
    'Power Mirrors',
    'Heated Mirrors',
    'Keyless Entry',
    'Push Button Start',
    'Remote Start',
    'Panoramic Sunroof',
    'Power Tailgate',
    'Cruise Control',
    'Adaptive Cruise Control',
    'Auto-Dimming Mirrors',
    'Rain Sensing Wipers',
    'Ambient Lighting',
    'Head-Up Display'
  ];
  
  export const PERFORMANCE_FEATURES = [
    'Sport Suspension',
    'Adaptive Suspension',
    'Sport Exhaust',
    'Limited Slip Differential',
    'Launch Control',
    'Sport Mode',
    'Race Mode',
    'Paddle Shifters',
    'Performance Brakes',
    'Carbon Ceramic Brakes',
    'Performance Tires',
    'Forged Wheels',
    'Carbon Fiber Components',
    'Aerodynamic Package',
    'Sport Seats',
    'Variable Steering Ratio',
    'Torque Vectoring',
    'Performance Data Recorder'
  ];
  
  export const ENTERTAINMENT_FEATURES = [
    'Premium Sound System',
    'Satellite Radio',
    'Navigation System',
    'Bluetooth Connectivity',
    'Apple CarPlay',
    'Android Auto',
    'Wireless Phone Charging',
    'USB Ports',
    'Touchscreen Display',
    'Digital Instrument Cluster',
    'WiFi Hotspot',
    'Rear Entertainment System',
    'Voice Control',
    'Premium Speakers',
    'Smartphone Integration',
    '360-Degree Camera System'
  ];
  
  export const COUNTRIES = [
    { code: 'ZA', name: 'South Africa' },
    { code: 'BW', name: 'Botswana' },
    { code: 'NA', name: 'Namibia' },
    { code: 'ZW', name: 'Zimbabwe' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'SZ', name: 'Eswatini' },
    // Add more as needed
  ];
  
  export const TRANSMISSION_TYPES = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automatic' },
    { value: 'dct', label: 'Dual-Clutch (DCT)' },
    { value: 'cvt', label: 'CVT' },
    { value: 'semi-auto', label: 'Semi-Automatic' }
  ];
  
  export const FUEL_TYPES = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
    { value: 'hydrogen', label: 'Hydrogen' }
  ];
  
  export const DRIVETRAIN_TYPES = [
    { value: 'rwd', label: 'RWD' },
    { value: 'fwd', label: 'FWD' },
    { value: 'awd', label: 'AWD' },
    { value: '4wd', label: '4WD' }
  ];
  
  export const BODY_STYLES = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'suv', label: 'SUV/Crossover' },
    { value: 'truck', label: 'Truck/Pickup' },
    { value: 'van', label: 'Van/Minivan' },
    { value: 'wagon', label: 'Wagon' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'sport', label: 'Sports Car' },
    { value: 'luxury', label: 'Luxury Vehicle' },
    { value: 'other', label: 'Other' }
  ];
  
  export const LISTING_STATUS = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'published', label: 'Published' },
    { value: 'sold', label: 'Sold' },
    { value: 'archived', label: 'Archived' }
  ];
  
  export const PRICE_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'negotiable', label: 'Negotiable' },
    { value: 'call', label: 'Price on Call' },
    { value: 'poa', label: 'POA (Price on Application)' }
  ];