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
    const [customers, orders, payments, products] = await Promise.all([
      prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.product.findMany()
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const paymentMapByOrderId = new Map(payments.map((p) => [p.orderId, p]));
    const paymentMapByRazorpayOrder = new Map(payments.map((p) => [p.razorpayOrderId, p]));

    const formattedCustomers = customers.map((c) => {
      const cEmail = (c.email || "").toLowerCase();
      const cPhone = (c.phone || "").replace(/\D/g, "");

      // Find all orders associated with this customer by email or phone
      const customerOrders = orders.filter((o) => {
        const oEmail = (o.customerEmail || "").toLowerCase();
        const oPhone = (o.customerPhone || "").replace(/\D/g, "");
        return (cEmail && oEmail === cEmail) || (cPhone && oPhone.includes(cPhone.slice(-10)));
      });

      const nonCancelledOrders = customerOrders.filter(
        (o) => !["CANCELLED", "FAILED"].includes(o.status.toUpperCase())
      );

      const totalSpent = nonCancelledOrders.reduce(
        (sum, o) => sum + (o.finalAmount || o.total || 0),
        0
      );

      const completedOrders = customerOrders.filter((o) =>
        ["DELIVERED", "PAID"].includes(o.status.toUpperCase())
      ).length;

      const cancelledOrders = customerOrders.filter((o) =>
        ["CANCELLED", "FAILED"].includes(o.status.toUpperCase())
      ).length;

      const pendingOrders = customerOrders.filter((o) =>
        ["PENDING", "PLACED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status.toUpperCase())
      ).length;

      const orderAmounts = customerOrders.map((o) => o.finalAmount || o.total || 0);
      const highestOrderValue = orderAmounts.length > 0 ? Math.max(...orderAmounts) : 0;
      const lowestOrderValue = orderAmounts.length > 0 ? Math.min(...orderAmounts) : 0;

      const addresses = Array.from(
        new Set(customerOrders.map((o) => o.customerAddress).filter(Boolean))
      );

      const customerSince = c.createdAt.toISOString();
      const firstPurchaseDate = customerOrders.length > 0
        ? customerOrders[customerOrders.length - 1].createdAt.toISOString()
        : customerSince;
      const lastPurchaseDate = customerOrders.length > 0
        ? customerOrders[0].createdAt.toISOString()
        : null;

      // Customer VIP / Status Logic
      let customerStatus: "NEW" | "RETURNING" | "VIP" = "NEW";
      if (customerOrders.length >= 5 || totalSpent >= 5000) {
        customerStatus = "VIP";
      } else if (customerOrders.length >= 2) {
        customerStatus = "RETURNING";
      }

      // Unique Payment Methods Used
      const paymentMethodsUsed = Array.from(
        new Set(customerOrders.map((o) => o.paymentMethod || "RAZORPAY"))
      );

      const averageOrderValue = nonCancelledOrders.length > 0
        ? Math.round(totalSpent / nonCancelledOrders.length)
        : 0;

      // Product Purchase History Aggregation
      const productSummaryMap = new Map<string, any>();
      customerOrders.forEach((o) => {
        const rawItems = Array.isArray(o.items)
          ? o.items
          : typeof o.items === "string"
          ? JSON.parse(o.items)
          : [];

        if (Array.isArray(rawItems)) {
          rawItems.forEach((item: any) => {
            const pId = String(item.productId || item.id || item.name);
            const matchedProd = productMap.get(pId);
            const pName = item.name || matchedProd?.name || "Product";
            const qty = Math.max(1, Number(item.quantity) || 1);
            const price = Number(item.price || matchedProd?.price || 0);
            const itemTotal = Number(item.total) || price * qty;
            const pImages = Array.isArray(matchedProd?.images) ? (matchedProd.images as any[]) : [];
            const pImage = item.image || pImages[0] || "/placeholder.png";

            if (productSummaryMap.has(pId)) {
              const existing = productSummaryMap.get(pId);
              existing.timesPurchased += 1;
              existing.totalQuantityPurchased += qty;
              existing.totalAmountSpent += itemTotal;
            } else {
              productSummaryMap.set(pId, {
                productId: pId,
                name: pName,
                image: pImage,
                category: matchedProd?.category || "Skincare",
                timesPurchased: 1,
                totalQuantityPurchased: qty,
                totalAmountSpent: itemTotal,
                lastPurchasedDate: o.createdAt.toISOString()
              });
            }
          });
        }
      });

      const productPurchaseHistory = Array.from(productSummaryMap.values());

      // Formatted Orders with Deep Invoice & Payment Breakdown
      const formattedOrders = customerOrders.map((o) => {
        const matchingPayment =
          paymentMapByOrderId.get(o.id) ||
          (o.idempotencyKey ? paymentMapByRazorpayOrder.get(o.idempotencyKey) : null);

        const rawItems = Array.isArray(o.items)
          ? o.items
          : typeof o.items === "string"
          ? JSON.parse(o.items)
          : [];

        const detailedItems = Array.isArray(rawItems)
          ? rawItems.map((item: any) => {
              const pId = String(item.productId || item.id || "");
              const matchedProd = productMap.get(pId);
              const qty = Math.max(1, Number(item.quantity) || 1);
              const price = Number(item.price || matchedProd?.price || 0);

              return {
                productId: pId || "SKU-PROD",
                name: item.name || matchedProd?.name || "Product Item",
                sku: pId ? pId.slice(-8).toUpperCase() : "SKU-DEFAULT",
                category: matchedProd?.category || "Skincare",
                image: item.image || (Array.isArray(matchedProd?.images) ? (matchedProd.images as any[])[0] : null) || "/placeholder.png",
                unitPrice: price,
                quantity: qty,
                lineTotal: Number(item.total) || price * qty
              };
            })
          : [];

        const grandTotal = o.finalAmount || o.total || 0;
        const isPaid = o.paymentStatus === "PAID" || o.status === "PAID";

        return {
          id: o.id,
          _id: o.id,
          invoiceNumber: `INV-${o.id.slice(-8).toUpperCase()}`,
          orderDate: o.createdAt.toISOString(),
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          trackingNumber: o.trackingNumber || null,
          customerAddress: o.customerAddress,
          notes: o.notes || null,
          items: detailedItems,
          billBreakdown: {
            subtotal: o.subtotal || grandTotal,
            discountType: o.discountType || "NONE",
            discountPercentage: o.discountPercentage || 0,
            discountAmount: o.discountAmount || 0,
            couponCode: o.discountType === "PREPAID" ? "PREPAID5" : null,
            shippingCharge: o.shippingCharge || 0,
            isFreeShipping: (o.shippingCharge || 0) === 0,
            codFee: o.codFee || 0,
            tax: 0,
            grandTotal: grandTotal,
            amountPaid: isPaid ? grandTotal : 0,
            outstandingAmount: isPaid ? 0 : grandTotal
          },
          paymentDetails: {
            paymentMethod: o.paymentMethod,
            razorpayPaymentId: matchingPayment?.paymentId || "N/A",
            razorpayOrderId: matchingPayment?.razorpayOrderId || o.idempotencyKey || "N/A",
            transactionId: matchingPayment?.paymentId || "N/A",
            paymentStatus: matchingPayment?.status || o.paymentStatus,
            paidDate: matchingPayment?.createdAt ? matchingPayment.createdAt.toISOString() : o.updatedAt.toISOString(),
            refundStatus: matchingPayment?.status === "REFUNDED" ? "REFUNDED" : "NONE"
          },
          timeline: [
            { stage: "Customer Registered", timestamp: customerSince, completed: true },
            { stage: "Order Placed", timestamp: o.createdAt.toISOString(), completed: true },
            { stage: "Payment Status", timestamp: o.updatedAt.toISOString(), completed: isPaid, detail: isPaid ? "Paid via Razorpay / COD" : "Pending Payment" },
            { stage: "Order Workflow", timestamp: o.updatedAt.toISOString(), completed: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(o.status.toUpperCase()), statusText: o.status }
          ]
        };
      });

      return {
        id: c.id,
        _id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        addresses: addresses,
        primaryAddress: addresses[0] || "No order address on file",
        customerSince: customerSince,
        firstPurchaseDate: firstPurchaseDate,
        lastOrderDate: lastPurchaseDate,
        customerStatus: customerStatus,
        paymentMethodsUsed: paymentMethodsUsed,
        ordersCount: customerOrders.length,
        completedOrdersCount: completedOrders,
        cancelledOrdersCount: cancelledOrders,
        pendingOrdersCount: pendingOrders,
        totalSpent: Math.round(totalSpent),
        averageOrderValue: averageOrderValue,
        highestOrderValue: highestOrderValue,
        lowestOrderValue: lowestOrderValue,
        productPurchaseHistory: productPurchaseHistory,
        orders: formattedOrders,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
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
