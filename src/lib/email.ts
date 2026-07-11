import "server-only";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type EmailResult = {
  ok: boolean;
  simulated: boolean;
  message: string;
};

const resendEndpoint = "https://api.resend.com/emails";

export async function sendMarketplaceEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS ?? "WAPTEK COMPUTER SERVICES <noreply@waptekcomputerservices.com>";

  if (!apiKey) {
    return {
      ok: true,
      simulated: true,
      message: `Simulated email queued for ${payload.to}: ${payload.subject}`,
    };
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      simulated: false,
      message: detail || "Email provider rejected the message.",
    };
  }

  return {
    ok: true,
    simulated: false,
    message: "Email sent.",
  };
}

export function orderPlacedEmail(orderNumber: string, total: string) {
  return {
    subject: `Order ${orderNumber} received`,
    html: `<p>Your WAPTEK COMPUTER SERVICES order <strong>${orderNumber}</strong> has been received.</p><p>Total: <strong>${total}</strong></p><p>We will review your uploaded receipt before processing.</p>`,
    text: `Your WAPTEK COMPUTER SERVICES order ${orderNumber} has been received. Total: ${total}. We will review your uploaded receipt before processing.`,
  };
}

export function paymentDecisionEmail(orderNumber: string, decision: "confirmed" | "rejected", note: string) {
  const status = decision === "confirmed" ? "confirmed" : "rejected";
  return {
    subject: `Payment ${status} for order ${orderNumber}`,
    html: `<p>Your payment for WAPTEK COMPUTER SERVICES order <strong>${orderNumber}</strong> was <strong>${status}</strong>.</p><p>${note}</p>`,
    text: `Your payment for WAPTEK COMPUTER SERVICES order ${orderNumber} was ${status}. ${note}`,
  };
}

