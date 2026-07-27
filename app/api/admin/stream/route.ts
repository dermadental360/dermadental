import { NextRequest } from "next/server";
import { adminEventBus, AdminEventData } from "@/lib/eventBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ message: "Connected to Admin SSE stream" })}\n\n`)
      );

      const onAdminEvent = (data: AdminEventData) => {
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch (err) {
          console.error("SSE enqueue error:", err);
        }
      };

      adminEventBus.on("admin_event", onAdminEvent);

      // Keep-alive ping interval every 15s to prevent cloud proxies timing out
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        adminEventBus.off("admin_event", onAdminEvent);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
