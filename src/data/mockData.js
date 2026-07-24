/* ============================================
   Mock Data for Captain Panel
   ============================================ */

export const tables = [
  {
    id: 'T-01',
    status: 'occupied',
    guest: 'Sarah J.',
    time: '45 mins',
    capacity: 4,
    seated: 4,
    section: 'Darbar Area',
    server: 'Marco L.',
    priority: 'high',
    currentStatus: 'Preparing',
    orders: [
      { name: 'Wagyu Beef Burger', qty: 2, price: 56.00, note: 'Medium Rare • No Pickles' },
      { name: 'Truffle Linguine', qty: 1, price: 32.00, note: 'Extra Parmesan' },
      { name: 'Garden Salad', qty: 1, price: 18.00, note: 'Dressing on side' },
    ],
    managerNote: 'Celebrating anniversary. Complimentary dessert suggested at end of meal.',
  },
  {
    id: 'T-02',
    status: 'available',
    guest: null,
    time: '--',
    capacity: 2,
    seated: 0,
    section: 'Darbar Area',
    server: null,
    priority: null,
    currentStatus: null,
    orders: [],
    managerNote: null,
  },
  {
    id: 'T-03',
    status: 'reserved',
    guest: 'Alex Mercer',
    time: '19:30',
    capacity: 4,
    seated: 0,
    section: 'Darbar Area',
    server: null,
    priority: null,
    currentStatus: null,
    orders: [],
    managerNote: null,
  },
  {
    id: 'T-04',
    status: 'cleaning',
    guest: null,
    time: '~5 mins',
    capacity: 4,
    seated: 4,
    section: 'Darbar Area',
    server: null,
    priority: null,
    currentStatus: null,
    orders: [],
    managerNote: null,
  },
  {
    id: 'T-05',
    status: 'payment',
    guest: 'Mark V.',
    time: '1h 12m',
    capacity: 2,
    seated: 3,
    section: 'Darbar Area',
    server: null,
    priority: null,
    currentStatus: null,
    orders: [],
    managerNote: null,
  },
  {
    id: 'T-06',
    status: 'occupied',
    guest: 'Reservation @ 7:30',
    time: '18 mins',
    capacity: 5,
    seated: 5,
    section: 'Darbar Area',
    server: null,
    priority: null,
    currentStatus: 'Reserved',
    orders: [],
    managerNote: null,
  },
];

export const tableManagementTables = [
  {
    id: 'T-01',
    status: 'occupied',
    guest: 'Sarah J.',
    time: '45 mins ago',
    capacity: 4,
    seated: 4,
    section: 'Main Dining Room',
  },
  {
    id: 'T-02',
    status: 'occupied',
    guest: 'Mark V.',
    time: '12 mins ago',
    capacity: 2,
    seated: 2,
    section: 'Main Dining Room',
  },
  {
    id: 'T-03',
    status: 'available',
    guest: null,
    time: null,
    capacity: 6,
    seated: 0,
    section: 'Main Dining Room',
  },
  {
    id: 'T-04',
    status: 'occupied',
    guest: 'Elena V.',
    time: '82 mins ago',
    capacity: 4,
    seated: 3,
    section: 'Main Dining Room',
  },
  {
    id: 'T-05',
    status: 'occupied',
    guest: 'Ty Butler',
    time: '25 mins ago',
    capacity: 4,
    seated: 4,
    section: 'Main Dining Room',
  },
  {
    id: 'T-06',
    status: 'reserved',
    guest: 'Reservation @ 7:30',
    time: null,
    capacity: 6,
    seated: 0,
    section: 'Main Dining Room',
  },
];

export const waitlistData = [
  {
    id: 1,
    name: 'John D.',
    people: 4,
    waitTime: '15m',
    preference: 'Booth Preference',
    isNext: true,
    suggestion: 'Table 12 or 14 currently available for party size of 4.',
  },
  {
    id: 2,
    name: 'Sarah Williams',
    people: 2,
    waitTime: '22m',
    preference: 'Patio Preference',
    isNext: false,
    suggestion: null,
  },
  {
    id: 3,
    name: 'Michael Chen',
    people: 6,
    waitTime: '35m',
    preference: 'Main Dining',
    isNext: false,
    suggestion: null,
  },
  {
    id: 4,
    name: 'Emily Roberts',
    people: 4,
    waitTime: '45m',
    preference: 'Bar/Lounge',
    isNext: false,
    suggestion: null,
  },
  {
    id: 5,
    name: 'David K.',
    people: 1,
    waitTime: '50m',
    preference: 'No Preference',
    isNext: false,
    suggestion: null,
  },
];

export const upcomingWaitlist = [
  { id: 1, name: 'Sarah Miller', initials: 'SM', guests: 4, wait: '15 min wait' },
  { id: 2, name: 'John Doe', initials: 'JD', guests: 2, wait: '30 min wait' },
];

export const sections = ['Darbar Area', 'Terrace', 'Lounge Bar', 'VIP Cabin'];

export const stats = {
  totalTables: 42,
  available: 12,
  occupied: 28,
  waiting: 5,
};

export const waitlistStats = {
  avgWaitTime: '24 Minutes',
  busiestSection: 'Main Dining',
  seatedHourly: '18 Parties',
};

export const captainInfo = {
  name: 'Julian Rossi',
  role: 'Head Captain',
  initials: 'JR',
};

export const tableDetail = {
  id: 'T-01',
  statusLabel: 'Occupied • High Priority',
  currentStatus: 'Preparing',
  customerName: 'Sarah J.',
  people: '4 Guests',
  timeSeated: '45 mins',
  server: 'Marco L.',
  orders: [
    { name: 'Wagyu Beef Burger', qty: 2, price: 56.00, note: 'Medium Rare • No Pickles' },
    { name: 'Truffle Linguine', qty: 1, price: 32.00, note: 'Extra Parmesan' },
    { name: 'Garden Salad', qty: 1, price: 18.00, note: 'Dressing on side' },
  ],
  subtotal: 106.00,
  managerNote: 'Celebrating anniversary. Complimentary dessert suggested at end of meal.',
};
