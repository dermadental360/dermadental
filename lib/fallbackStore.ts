// Global in-memory fallback store to allow full functionality when MongoDB is offline
export interface FallbackCustomer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface FallbackInquiry {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "New" | "Resolved";
  createdAt: string;
}

export interface FallbackOrder {
  _id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  whatsappSent?: boolean;
  createdAt: string;
}

export interface FallbackAuditLog {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
}

declare global {
  var fallbackCustomers: FallbackCustomer[] | undefined;
  var fallbackInquiries: FallbackInquiry[] | undefined;
  var fallbackOrders: FallbackOrder[] | undefined;
  var fallbackAuditLogs: FallbackAuditLog[] | undefined;
}

if (!global.fallbackCustomers) global.fallbackCustomers = [];
if (!global.fallbackInquiries) global.fallbackInquiries = [];
if (!global.fallbackOrders) global.fallbackOrders = [];
if (!global.fallbackAuditLogs) global.fallbackAuditLogs = [];

export const fallbackStore = {
  customers: global.fallbackCustomers!,
  inquiries: global.fallbackInquiries!,
  orders: global.fallbackOrders!,
  auditLogs: global.fallbackAuditLogs!
};
