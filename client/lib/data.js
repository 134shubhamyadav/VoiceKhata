export const customers = [
  {
    id: "1",
    name: "Ramesh Yadav",
    phone: "+91 98765 43210",
    avatar: "RY",
    color: "from-blue-500 to-blue-600",
    pending: 4500,
    totalCredit: 12000,
    totalPaid: 7500,
    risk: "high",
    daysOverdue: 12,
    lastTransaction: "2 days ago",
    transactions: [
      { id: "t1", type: "credit", amount: 2000, date: "15 Jan 2025", note: "Grocery items", status: "pending" },
      { id: "t2", type: "payment", amount: 1500, date: "10 Jan 2025", note: "Partial payment", status: "paid" },
      { id: "t3", type: "credit", amount: 2500, date: "5 Jan 2025", note: "Monthly stock", status: "overdue" },
    ],
    reminders: [
      { id: "r1", message: "Ramesh bhai, ₹4500 baaki hai. Aaj payment karo.", sentAt: "Today 10:00 AM", status: "delivered" },
      { id: "r2", message: "Ramesh bhai, payment reminder - ₹4500", sentAt: "Yesterday 2:00 PM", status: "read" },
    ]
  },
  {
    id: "2",
    name: "Priya Sharma",
    phone: "+91 87654 32109",
    avatar: "PS",
    color: "from-violet-500 to-violet-600",
    pending: 1200,
    totalCredit: 8000,
    totalPaid: 6800,
    risk: "low",
    daysOverdue: 2,
    lastTransaction: "1 day ago",
    transactions: [
      { id: "t4", type: "credit", amount: 1200, date: "18 Jan 2025", note: "Vegetables", status: "pending" },
      { id: "t5", type: "payment", amount: 3000, date: "14 Jan 2025", note: "Full payment", status: "paid" },
    ],
    reminders: [
      { id: "r3", message: "Priya ji, ₹1200 baaki hai.", sentAt: "Today 9:00 AM", status: "sent" },
    ]
  },
  {
    id: "3",
    name: "Suresh Patel",
    phone: "+91 76543 21098",
    avatar: "SP",
    color: "from-orange-500 to-orange-600",
    pending: 8900,
    totalCredit: 25000,
    totalPaid: 16100,
    risk: "high",
    daysOverdue: 21,
    lastTransaction: "5 days ago",
    transactions: [
      { id: "t6", type: "credit", amount: 5000, date: "1 Jan 2025", note: "Bulk purchase", status: "overdue" },
      { id: "t7", type: "credit", amount: 3900, date: "28 Dec 2024", note: "Festival stock", status: "overdue" },
    ],
    reminders: []
  },
  {
    id: "4",
    name: "Meena Agarwal",
    phone: "+91 65432 10987",
    avatar: "MA",
    color: "from-emerald-500 to-emerald-600",
    pending: 650,
    totalCredit: 5000,
    totalPaid: 4350,
    risk: "low",
    daysOverdue: 1,
    lastTransaction: "Today",
    transactions: [
      { id: "t8", type: "credit", amount: 650, date: "19 Jan 2025", note: "Daily items", status: "pending" },
    ],
    reminders: []
  },
  {
    id: "5",
    name: "Yaksh Store",
    phone: "+91 54321 09876",
    avatar: "YS",
    color: "from-pink-500 to-pink-600",
    pending: 3300,
    totalCredit: 15000,
    totalPaid: 11700,
    risk: "medium",
    daysOverdue: 7,
    lastTransaction: "3 days ago",
    transactions: [
      { id: "t9", type: "credit", amount: 3300, date: "12 Jan 2025", note: "Weekly supplies", status: "overdue" },
    ],
    reminders: [
      { id: "r4", message: "Yaksh Store, ₹3300 ki payment pending hai.", sentAt: "2 days ago", status: "delivered" },
    ]
  },
  {
    id: "6",
    name: "Shubham Verma",
    phone: "+91 43210 98765",
    avatar: "SV",
    color: "from-cyan-500 to-cyan-600",
    pending: 0,
    totalCredit: 9000,
    totalPaid: 9000,
    risk: "low",
    daysOverdue: 0,
    lastTransaction: "Today",
    transactions: [
      { id: "t10", type: "payment", amount: 9000, date: "19 Jan 2025", note: "Full clearance", status: "paid" },
    ],
    reminders: []
  },
];

export const recentTransactions = [
  { id: "rt1", customer: "Ramesh Yadav", avatar: "RY", type: "credit", amount: 2000, time: "2 hrs ago", note: "Grocery items" },
  { id: "rt2", customer: "Priya Sharma", avatar: "PS", type: "payment", amount: 1500, time: "4 hrs ago", note: "Partial payment" },
  { id: "rt3", customer: "Suresh Patel", avatar: "SP", type: "credit", amount: 3900, time: "Yesterday", note: "Festival stock" },
  { id: "rt4", customer: "Meena Agarwal", avatar: "MA", type: "payment", amount: 650, time: "Yesterday", note: "Daily settlement" },
  { id: "rt5", customer: "Yaksh Store", avatar: "YS", type: "credit", amount: 1200, time: "2 days ago", note: "Weekly supplies" },
];

export const insights = {
  totalPending: 18550,
  totalCollected: 51350,
  collectionRate: 73,
  overdueCustomers: 3,
  avgRepaymentDays: 8,
  monthlyTrend: [
    { month: "Aug", collected: 32000, pending: 12000 },
    { month: "Sep", collected: 28000, pending: 18000 },
    { month: "Oct", collected: 41000, pending: 9000 },
    { month: "Nov", collected: 38000, pending: 14000 },
    { month: "Dec", collected: 45000, pending: 11000 },
    { month: "Jan", collected: 51000, pending: 18000 },
  ],
  aiInsights: [
    "Suresh Patel has been overdue for 21 days. High risk of default.",
    "Collection rate improved by 12% this month.",
    "Top 3 customers contribute 68% of total credit.",
    "Send reminders on Tuesday mornings for best response rate.",
  ]
};

export const reminders = [
  {
    id: "rem1",
    customer: "Ramesh Yadav",
    avatar: "RY",
    amount: 4500,
    message: "Ramesh bhai, aapka ₹4,500 baaki hai. Aaj payment kar dijiye. Payment link: pay.voicekhata.in/ram123",
    channel: "WhatsApp",
    sentAt: "Today, 10:00 AM",
    status: "delivered",
    daysOverdue: 12
  },
  {
    id: "rem2",
    customer: "Suresh Patel",
    avatar: "SP",
    amount: 8900,
    message: "Suresh bhai, ₹8,900 ka payment 21 din se pending hai. Please clear karein.",
    channel: "WhatsApp",
    sentAt: "Today, 9:30 AM",
    status: "sent",
    daysOverdue: 21
  },
  {
    id: "rem3",
    customer: "Yaksh Store",
    avatar: "YS",
    amount: 3300,
    message: "Yaksh Store, ₹3,300 ki payment week bhar se pending hai.",
    channel: "SMS",
    sentAt: "Yesterday, 2:00 PM",
    status: "read",
    daysOverdue: 7
  },
  {
    id: "rem4",
    customer: "Priya Sharma",
    avatar: "PS",
    amount: 1200,
    message: "Priya ji, ₹1,200 baaki hai. Suvidhajan payment karein.",
    channel: "WhatsApp",
    sentAt: "Today, 8:00 AM",
    status: "pending",
    daysOverdue: 2
  },
];
