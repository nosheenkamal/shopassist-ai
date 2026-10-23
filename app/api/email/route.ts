import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim();
    const orderId = String(body.orderId ?? "").trim();
    const refundStatus = String(body.refundStatus ?? "").trim();

    if (!email || !orderId) {
      return NextResponse.json(
        { error: "Email and order ID are required." },
        { status: 400 }
      );
    }

    if (refundStatus !== "Approved") {
      return NextResponse.json(
        { error: "A confirmation email can only be sent after authorized approval." },
        { status: 403 }
      );
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
      process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      return NextResponse.json(
        { error: "Email service is not configured yet." },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: `Refund approval confirmation — ${orderId}`,
      text:
        `Your refund request for order ${orderId} has been approved by an authorized reviewer.\n\n` +
        "This message confirms the review decision; actual payment processing may occur separately.",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Could not send the confirmation email." },
      { status: 500 }
    );
  }
}