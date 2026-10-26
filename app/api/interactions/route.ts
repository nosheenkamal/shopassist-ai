import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const client = await auth.getClient();
    const sheets = google.sheets({
      version: "v4",
      auth: client as any,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Interactions!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          `INT-${Date.now()}`,
          new Date().toISOString(),
          body.customerName || "Guest",
          body.question || "",
          body.response || "",
          body.refundStatus || "N/A",
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interaction logging error:", error);
    return NextResponse.json(
      { error: "Could not log interaction." },
      { status: 500 }
    );
  }
}