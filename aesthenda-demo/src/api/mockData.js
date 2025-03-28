// Mock user data with tenant and stylist IDs
export const users = [
  {
    id: '1',
    email: 'admin@salon1.com',
    password: 'password', // Never do this in production!
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'salon_admin',
    tenantId: 'salon1',
    stylist_id: 'STY12345'
  },
  {
    id: '2',
    email: 'stylist@salon1.com',
    password: 'password',
    firstName: 'Jamie',
    lastName: 'Smith',
    role: 'stylist',
    tenantId: 'salon1',
    stylist_id: 'STY67890'
  },
  {
    id: '3',
    email: 'admin@salon2.com',
    password: 'password',
    firstName: 'Taylor',
    lastName: 'Johnson',
    role: 'salon_admin',
    tenantId: 'salon2',
    stylist_id: 'STY54321'
  }
];

// Mock salon data with tenant-specific branding
export const salons = [
  {
    id: '1',
    businessName: 'Serenity Spa & Salon',
    tenantId: 'salon1',
    slug: 'serenity-spa',
    status: 'active',
    contactInfo: {
      email: 'contact@serenityspa.com',
      phone: '555-123-4567',
      website: 'https://serenityspa.com',
      socialMedia: {
        instagram: 'serenityspa',
        facebook: 'SerenitySpaSalon'
      }
    },
    address: {
      street: '123 Tranquil Ave',
      city: 'Relaxville',
      state: 'CA',
      zipcode: '90210',
      country: 'USA'
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '20:00', isOpen: true },
      friday: { open: '09:00', close: '20:00', isOpen: true },
      saturday: { open: '10:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '15:00', isOpen: false }
    },
    settings: {
      branding: {
        logoUrl: 'https://placehold.co/200x80?text=Serenity',
        primaryColor: '#6B705C',
        secondaryColor: '#D8C3A5',
        fontFamily: 'Playfair Display, serif'
      },
      bookingPage: {
        welcomeMessage: 'Welcome to Serenity Spa & Salon. Relax, rejuvenate, transform.',
        displayOptions: {
          showPrices: true,
          showDuration: true
        }
      }
    }
  },
  {
    id: '2',
    businessName: 'Luxe Hair Studio',
    tenantId: 'salon2',
    slug: 'luxe-hair',
    status: 'active',
    contactInfo: {
      email: 'info@luxehair.com',
      phone: '555-987-6543',
      website: 'https://luxehair.com',
      socialMedia: {
        instagram: 'luxehair',
        facebook: 'LuxeHairStudio'
      }
    },
    address: {
      street: '456 Glam Street',
      city: 'Styleville',
      state: 'NY',
      zipcode: '10001',
      country: 'USA'
    },
    businessHours: {
      monday: { open: '10:00', close: '19:00', isOpen: true },
      tuesday: { open: '10:00', close: '19:00', isOpen: true },
      wednesday: { open: '10:00', close: '19:00', isOpen: true },
      thursday: { open: '10:00', close: '21:00', isOpen: true },
      friday: { open: '10:00', close: '21:00', isOpen: true },
      saturday: { open: '09:00', close: '18:00', isOpen: true },
      sunday: { open: '12:00', close: '17:00', isOpen: true }
    },
    settings: {
      branding: {
        logoUrl: 'https://placehold.co/200x80?text=Luxe',
        primaryColor: '#845EC2',
        secondaryColor: '#D5CABD',
        fontFamily: 'Montserrat, sans-serif'
      },
      bookingPage: {
        welcomeMessage: 'Experience luxury and style at Luxe Hair Studio.',
        displayOptions: {
          showPrices: true,
          showDuration: true
        }
      }
    }
  }
];

// Mock staff data
export const staff = [
  {
    id: '101',
    firstName: 'Jamie',
    lastName: 'Smith',
    email: 'stylist@salon1.com',
    role: 'stylist',
    tenantId: 'salon1',
    stylist_id: 'STY67890',
    profile: {
      title: 'Senior Stylist',
      bio: 'Specializes in color and highlights with 8+ years experience.',
      avatar: 'https://i.pravatar.cc/150?img=32',
      services: ['haircut', 'color', 'highlights']
    }
  },
  {
    id: '102',
    firstName: 'Morgan',
    lastName: 'Lee',
    email: 'morgan@salon1.com',
    role: 'salon_staff',
    tenantId: 'salon1',
    stylist_id: 'STY13579',
    profile: {
      title: 'Front Desk Coordinator',
      bio: 'Keeping everything organized and running smoothly.',
      avatar: 'https://i.pravatar.cc/150?img=26',
      services: []
    }
  },
  {
    id: '103',
    firstName: 'Jordan',
    lastName: 'Rivera',
    email: 'jordan@salon1.com',
    role: 'stylist',
    tenantId: 'salon1',
    stylist_id: 'STY24680',
    profile: {
      title: 'Nail Technician',
      bio: 'Expert in nail art and designs.',
      avatar: 'https://i.pravatar.cc/150?img=5',
      services: ['manicure', 'pedicure', 'gel polish']
    }
  }
];

// Mock services data
export const services = [
  {
    id: '201',
    name: 'Women\'s Haircut',
    description: 'Professional haircut with consultation, shampoo, and styling.',
    duration: 60, // minutes
    price: 85,
    tenantId: 'salon1',
    category: 'haircut'
  },
  {
    id: '202',
    name: 'Men\'s Haircut',
    description: 'Classic men\'s cut with consultation and styling.',
    duration: 45,
    price: 65,
    tenantId: 'salon1',
    category: 'haircut'
  },
  {
    id: '203',
    name: 'Full Highlights',
    description: 'Complete highlight service with toner and styling.',
    duration: 120,
    price: 150,
    tenantId: 'salon1',
    category: 'color'
  },
  {
    id: '204',
    name: 'Gel Manicure',
    description: 'Long-lasting gel polish application with nail prep.',
    duration: 45,
    price: 55,
    tenantId: 'salon1',
    category: 'nails'
  }
];

// Mock appointments data
export const appointments = [
  {
    id: '301',
    tenantId: 'salon1',
    clientName: 'Riley Johnson',
    clientEmail: 'riley@example.com',
    clientPhone: '555-123-7890',
    serviceId: '201',
    stylist_id: 'STY67890',
    startTime: '2023-10-20T14:00:00',
    endTime: '2023-10-20T15:00:00',
    status: 'confirmed',
    notes: 'First time client, referred by Morgan'
  },
  {
    id: '302',
    tenantId: 'salon1',
    clientName: 'Casey Smith',
    clientEmail: 'casey@example.com',
    clientPhone: '555-321-6540',
    serviceId: '203',
    stylist_id: 'STY67890',
    startTime: '2023-10-21T10:00:00',
    endTime: '2023-10-21T12:00:00',
    status: 'confirmed',
    notes: 'Regular client, wants to go lighter than usual'
  },
  {
    id: '303',
    tenantId: 'salon1',
    clientName: 'Taylor Williams',
    clientEmail: 'taylor@example.com',
    clientPhone: '555-987-1234',
    serviceId: '204',
    stylist_id: 'STY24680',
    startTime: '2023-10-20T16:00:00',
    endTime: '2023-10-20T16:45:00',
    status: 'confirmed',
    notes: 'Wants simple design on ring finger'
  }
];

// Function to simulate authentication
export const authenticate = (email, password) => {
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  
  const salon = salons.find(s => s.tenantId === user.tenantId);
  
  // Create a token (in a real app, this would be a JWT)
  const token = btoa(JSON.stringify({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    tenantId: user.tenantId,
    stylist_id: user.stylist_id
  }));
  
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      stylist_id: user.stylist_id
    },
    salon: salon ? {
      id: salon.id,
      businessName: salon.businessName,
      settings: salon.settings
    } : null,
    token
  };
};

// Function to verify token (simplified)
export const verifyToken = (token) => {
  try {
    return JSON.parse(atob(token));
  } catch (e) {
    return null;
  }
};

// Function to get data for a specific tenant
export const getTenantData = (tenantId) => {
  if (!tenantId) return null;
  
  return {
    salon: salons.find(s => s.tenantId === tenantId),
    staff: staff.filter(s => s.tenantId === tenantId),
    services: services.filter(s => s.tenantId === tenantId),
    appointments: appointments.filter(a => a.tenantId === tenantId)
  };
};

// Function to get stylist-specific appointments
export const getStylistAppointments = (tenantId, stylist_id) => {
  if (!tenantId || !stylist_id) return [];
  
  return appointments.filter(a => a.tenantId === tenantId && a.stylist_id === stylist_id);
};

// Function to get service by ID
export const getServiceById = (serviceId) => {
  return services.find(s => s.id === serviceId);
}; 