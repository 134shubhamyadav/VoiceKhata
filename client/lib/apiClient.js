/**
 * apiClient.js
 *
 * Fetch wrapper for all VoiceKhata backend API calls.
 * BASE_URL reads from NEXT_PUBLIC_API_URL env var — never hardcoded.
 */

const getApiUrl = () => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  return "http://localhost:5000/api";
};

const BASE_URL = getApiUrl();

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("voicekhata_token");
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const result   = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
    return result;
  } catch (err) {
    console.error(`[API] ${endpoint} →`, err.message);
    throw err;
  }
}

export const apiClient = {
  // ── Auth & Onboarding ──────────────────────────────────────────────────
  verifyToken: (idToken) =>
    request("/auth/verify-token", { method: "POST", body: JSON.stringify({ idToken }) }),

  completeOnboarding: (profileData) =>
    request("/auth/complete-onboarding", { method: "POST", body: JSON.stringify(profileData) }),

  getMe: () => request("/auth/me"),

  // Ping endpoint to wake up server
  ping: () => request("/health").catch(() => {}),

  // ── Customers ──────────────────────────────────────────────────────────
  getCustomers: (userId, sort) => {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (sort)   params.set("sort", sort);
    return request(`/customers?${params}`);
  },

  createCustomer: (userId, name, phone) =>
    request("/customers", {
      method: "POST",
      body: JSON.stringify({ userId, name, phone: phone || undefined }),
    }),

  getCustomerById: (id) => request(`/customers/${id}`),

  updateCustomer: (id, data) =>
    request(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getCustomerDetails: (id) => request(`/customers/${id}/details`),

  // ── Entries ────────────────────────────────────────────────────────────
  getEntries: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request(`/entries?${query}`);
  },

  createEntry: (entryData) =>
    request("/entries", { method: "POST", body: JSON.stringify(entryData) }),

  updateEntryStatus: (id, status) =>
    request(`/entries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  payEntry: (id, paidAmount, paymentMethod = "cash") =>
    request(`/entries/${id}/pay`, {
      method: "POST",
      body: JSON.stringify({ paidAmount, paymentMethod }),
    }),

  getReceipt: (id) => request(`/entries/${id}/receipt`),

  deleteEntry: (id) => request(`/entries/${id}`, { method: "DELETE" }),

  // ── Voice ──────────────────────────────────────────────────────────────
  parseVoice: (text) =>
    request("/voice/parse", { method: "POST", body: JSON.stringify({ text }) }),

  // ── Dashboard & Insights ───────────────────────────────────────────────
  getDashboardSummary: () => request("/dashboard/summary"),

  getDashboardInsights: () => request("/dashboard/insights"),

  getInsights: () => request("/insights"),

  // ── Reminders ─────────────────────────────────────────────────────────
  sendReminder: (customerId, entryId, tone = "friendly", message = null) =>
    request("/reminders/send", {
      method: "POST",
      body: JSON.stringify({ customerId, entryId, tone, message }),
    }),

  getReminders: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request(`/reminders?${query}`);
  },

  getCustomerReminders: (customerId) =>
    request(`/reminders/customer/${customerId}`),

  deleteReminder: (id) =>
    request(`/reminders/${id}`, { method: "DELETE" }),
};
