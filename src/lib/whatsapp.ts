/**
 * WhatsApp Click-to-Chat utilities.
 * Single source of truth for number resolution and URL building.
 *
 * Number priority:
 *   1. company_settings.whatsapp_number (fetched server-side, passed as prop)
 *   2. NEXT_PUBLIC_WHATSAPP_NUMBER env var (client-safe fallback)
 *
 * Format: international digits only, e.g. 2348012345678
 */

export const BUSINESS_NAME = "WAPTEK COMPUTER SERVICES";

/** Sanitize a string so it is safe to embed in a WhatsApp message. */
function sanitize(value: string): string {
  return value.replace(/[<>&"']/g, "").trim();
}

/** Strip all non-digit characters from a phone number string. */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Resolve the WhatsApp number from props or env, returning null if unavailable. */
export function resolveWhatsAppNumber(fromSettings?: string | null): string | null {
  const raw = fromSettings ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null;
  if (!raw) return null;
  const digits = digitsOnly(raw);
  return digits.length >= 10 ? digits : null;
}

/** Build a wa.me URL with a pre-filled message. Returns null if no number. */
export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function generalSupportMessage(): string {
  return `Hello ${BUSINESS_NAME}, I need help with a product or service on your website.`;
}

export function productInquiryMessage(opts: {
  productName: string;
  price: string;
  location: string;
  vendorName: string;
  url: string;
}): string {
  const name = sanitize(opts.productName);
  const location = sanitize(opts.location);
  const vendor = sanitize(opts.vendorName);
  return [
    `Hello ${BUSINESS_NAME},`,
    ``,
    `I am interested in this product:`,
    ``,
    `Product: ${name}`,
    `Price: ${opts.price}`,
    `Location: ${location}`,
    `Seller: ${vendor}`,
    `Link: ${opts.url}`,
    ``,
    `Please send me more details and confirm availability.`,
  ].join("\n");
}

export function repairInquiryMessage(): string {
  return [
    `Hello ${BUSINESS_NAME}, I need help with a computer repair.`,
    ``,
    `Device type: `,
    `Problem: `,
    `Preferred branch: `,
  ].join("\n");
}

export function orderSupportMessage(opts: {
  orderRef: string;
  status: string;
  total: string;
}): string {
  const ref = sanitize(opts.orderRef);
  const status = sanitize(opts.status);
  return [
    `Hello ${BUSINESS_NAME},`,
    ``,
    `I need help with order ${ref}.`,
    `Current status: ${status}.`,
    `Order total: ${opts.total}.`,
    `Please assist me.`,
  ].join("\n");
}

export function checkoutSupportMessage(): string {
  return `Hello ${BUSINESS_NAME}, I need help completing my order on your website.`;
}
