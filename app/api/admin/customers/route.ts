import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" }
    });

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        customerEmail: true,
        customerPhone: true,
        customerAddress: true,
        total: true,
        finalAmount: true,
        status: true,
        createdAt: true,
        items: true
      }
    });

    const formattedCustomers = customers.map((c) => {
      const cEmail = (c.email || "").toLowerCase();
      const cPhone = c.phone || "";

      // Find all orders associated with this customer by email or phone
      const customerOrders = orders.filter(
        (o) =>
          (cEmail && (o.customerEmail || "").toLowerCase() === cEmail) ||
          (cPhone && o.customerPhone === cPhone)
      );

      const nonCancelledOrders = customerOrders.filter(
        (o) => !["CANCELLED", "FAILED", "REFUNDED"].includes(o.status.toUpperCase())
      );

      const totalSpent = nonCancelledOrders.reduce(
        (sum, o) => sum + (o.finalAmount || o.total || 0),
        0
      );

      // Collect addresses from orders if customer table doesn't have an address field
      const addresses = Array.from(
        new Set(customerOrders.map((o) => o.customerAddress).filter(Boolean))
      );

      return {
        id: c.id,
        _id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        addresses: addresses,
        primaryAddress: addresses[0] || "No order address on file",
        ordersCount: customerOrders.length,
        totalSpent: Math.round(totalSpent),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        orders: customerOrders.map((o) => ({
          id: o.id,
          _id: o.id,
          total: o.finalAmount || o.total,
          status: o.status,
          address: o.customerAddress,
          createdAt: o.createdAt.toISOString(),
          itemsCount: Array.isArray(o.items) ? o.items.length : 1
        }))
      };
    });

    return NextResponse.json(formattedCustomers);
  } catch (error: any) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers database" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone } = body;
  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existing) {
      return NextResponse.json({ error: "Customer email is already registered" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash: "manual-admin-creation"
      }
    });

    await logAction("Create Customer Admin", `Customer "${name}" (${email}) added manually by Admin.`);

    return NextResponse.json({ success: true, customer: { ...customer, _id: customer.id } });
  } catch (error: any) {
    console.error("POST /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to create customer record" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, name, email, phone } = body;
  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email ? email.toLowerCase() : undefined,
        phone: phone || undefined
      }
    });

    await logAction("Update Customer", `Customer ID "${id}" details updated by Admin.`);

    return NextResponse.json({ success: true, customer: { ...customer, _id: customer.id } });
  } catch (error: any) {
    console.error("PUT /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to update customer record" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
  }

  try {
    await prisma.customer.delete({
      where: { id }
    });

    await logAction("Delete Customer", `Customer ID "${id}" deleted by Admin.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to delete customer record" }, { status: 500 });
  }
}
