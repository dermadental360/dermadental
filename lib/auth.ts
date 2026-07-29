import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const cookieName = "dd360_admin";
const customerCookieName = "dd360_customer";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function signAdminToken(email: string) {
  return jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export async function isAdmin() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

export function signCustomerToken(id: string, email: string) {
  return jwt.sign({ id, email, role: "customer" }, JWT_SECRET, { expiresIn: "7d" });
}

export async function getCustomer() {
  try {
    const jar = await cookies();
    const token = jar.get(customerCookieName)?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || decoded.role !== "customer") return null;

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id }
    });

    if (customer) {
      return {
        id: customer.id,
        _id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      };
    }

    return null;
  } catch {
    return null;
  }
}

export { cookieName, customerCookieName };
