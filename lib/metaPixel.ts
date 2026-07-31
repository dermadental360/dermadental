"use client";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    __META_PIXEL_INITIALIZED__?: boolean;
    __META_PIXEL_TEST_MODE__?: boolean;
  }
}

export interface MetaPixelConfig {
  enabled: boolean;
  pixelId: string;
  advancedMatching: boolean;
  autoPageView: boolean;
  testMode: boolean;
}

export interface MetaEventOptions {
  eventId?: string; // CAPI future-ready deduplication event_id
  userData?: Record<string, any>; // Advanced matching data (email, phone, etc.)
}

/**
 * Generate a unique Event ID for Meta Pixel & CAPI deduplication.
 */
export function generateEventId(prefix: string = "evt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate Meta Pixel ID (must contain only numbers).
 */
export function validatePixelId(pixelId: string): boolean {
  if (!pixelId) return false;
  const trimmed = pixelId.trim();
  return /^\d+$/.test(trimmed);
}

/**
 * Initialize Meta Pixel script dynamically in browser.
 */
export function initMetaPixel(config: MetaPixelConfig): boolean {
  if (typeof window === "undefined") return false;

  // Do not initialize if Pixel ID is invalid or missing
  if (!config.enabled || !validatePixelId(config.pixelId)) {
    return false;
  }

  // Set global test mode flag
  window.__META_PIXEL_TEST_MODE__ = !!config.testMode;

  // Prevent duplicate initialization
  if (window.__META_PIXEL_INITIALIZED__) {
    if (config.testMode) {
      console.log("[Meta Pixel Debug] Already initialized, skipping duplicate script injection.");
    }
    return true;
  }

  try {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    const advancedData = config.advancedMatching ? {} : undefined;
    window.fbq('init', config.pixelId.trim(), advancedData);
    window.__META_PIXEL_INITIALIZED__ = true;

    if (config.testMode) {
      console.log(
        `%c[Meta Pixel Debug] Meta Pixel Initialized (ID: ${config.pixelId.trim()})`,
        "color: #1877f2; font-weight: bold; background: #e7f3ff; padding: 4px 8px; border-radius: 4px;"
      );
    }

    return true;
  } catch (err) {
    console.error("[Meta Pixel Error] Failed to initialize Meta Pixel:", err);
    return false;
  }
}

/**
 * Core event tracking function with future-ready CAPI deduplication support (event_id).
 */
export function trackPixelEvent(
  eventName: string,
  params: Record<string, any> = {},
  options: MetaEventOptions = {}
): { eventId: string; success: boolean } {
  const eventId = options.eventId || generateEventId(eventName.toLowerCase());

  if (typeof window === "undefined" || !window.fbq || !window.__META_PIXEL_INITIALIZED__) {
    if (typeof window !== "undefined" && window.__META_PIXEL_TEST_MODE__) {
      console.log(
        `%c[Meta Pixel Debug] ${eventName} Suppressed (Pixel not active)`,
        "color: #64748b; font-style: italic;"
      );
    }
    return { eventId, success: false };
  }

  try {
    // Bind eventID for future CAPI server-side event deduplication
    const eventOptions: Record<string, any> = { eventID: eventId };

    window.fbq('track', eventName, params, eventOptions);

    if (window.__META_PIXEL_TEST_MODE__) {
      console.log(
        `%c[Meta Pixel Debug] ${eventName} Fired`,
        "color: #1877f2; font-weight: bold; background: #e7f3ff; padding: 2px 6px; border-radius: 3px;",
        {
          eventName,
          parameters: params,
          eventID: eventId,
          timestamp: new Date().toISOString()
        }
      );
    }

    return { eventId, success: true };
  } catch (err) {
    console.error(`[Meta Pixel Error] Failed to track event ${eventName}:`, err);
    return { eventId, success: false };
  }
}

// ==========================================
// Meta Standard Event Helper Methods
// ==========================================

export function trackPageView(options?: MetaEventOptions) {
  return trackPixelEvent('PageView', {}, options);
}

export function trackViewContent(
  params: {
    content_ids: string[];
    content_name: string;
    content_category: string;
    value: number;
    currency: string;
  },
  options?: MetaEventOptions
) {
  return trackPixelEvent('ViewContent', {
    content_type: 'product',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_category: params.content_category,
    value: params.value,
    currency: params.currency || 'INR'
  }, options);
}

export function trackSearch(
  params: { search_string: string },
  options?: MetaEventOptions
) {
  return trackPixelEvent('Search', {
    search_string: params.search_string
  }, options);
}

export function trackAddToCart(
  params: {
    content_ids: string[];
    content_name: string;
    content_category: string;
    value: number;
    currency: string;
    quantity?: number;
  },
  options?: MetaEventOptions
) {
  return trackPixelEvent('AddToCart', {
    content_type: 'product',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_category: params.content_category,
    value: params.value,
    currency: params.currency || 'INR',
    num_items: params.quantity || 1
  }, options);
}

export function trackInitiateCheckout(
  params: {
    content_ids: string[];
    value: number;
    currency: string;
    num_items: number;
  },
  options?: MetaEventOptions
) {
  return trackPixelEvent('InitiateCheckout', {
    content_type: 'product',
    content_ids: params.content_ids,
    value: params.value,
    currency: params.currency || 'INR',
    num_items: params.num_items
  }, options);
}

export function trackPurchase(
  params: {
    transaction_id: string;
    currency: string;
    value: number;
    content_ids: string[];
    quantity: number;
  },
  options?: MetaEventOptions
) {
  return trackPixelEvent('Purchase', {
    content_type: 'product',
    content_ids: params.content_ids,
    value: params.value,
    currency: params.currency || 'INR',
    num_items: params.quantity,
    transaction_id: params.transaction_id
  }, options);
}

export function trackAddPaymentInfo(
  params: {
    content_ids?: string[];
    value?: number;
    currency?: string;
  },
  options?: MetaEventOptions
) {
  return trackPixelEvent('AddPaymentInfo', {
    content_type: 'product',
    content_ids: params.content_ids,
    value: params.value,
    currency: params.currency || 'INR'
  }, options);
}

export function trackCompleteRegistration(
  params: {
    status?: string;
    content_name?: string;
  } = {},
  options?: MetaEventOptions
) {
  return trackPixelEvent('CompleteRegistration', {
    status: params.status || 'success',
    content_name: params.content_name || 'Customer Account Signup'
  }, options);
}
