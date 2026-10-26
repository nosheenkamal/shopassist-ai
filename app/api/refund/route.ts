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
    const orderId = String(body.orderId ?? "").trim();

    if (!/^ORD\d+$/i.test(orderId)) {
      return NextResponse.json(
        { error: "Please provide a valid order ID." },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error("Missing Google Sheet ID.");
    }

    const client = await auth.getClient();
    const sheets = google.sheets({
      version: "v4",
      auth: client as any,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Orders!A:G",
    });

    const rows = response.data.values ?? [];
    const headers = (rows[0] ?? []).map((value) =>
      String(value).trim()
    );
    const orderIndex = headers.indexOf("Order_ID");
    const refundIndex = headers.indexOf("Refund_Status");

    if (orderIndex === -1 || refundIndex === -1) {
      return NextResponse.json(
        { error: "Order_ID or Refund_Status column was not found." },
        { status: 400 }
      );
    }

    const rowIndex = rows.findIndex(
      (row, index) =>
        index > 0 &&
        String(row[orderIndex] ?? "").toUpperCase() === orderId.toUpperCase()
    );

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const sheetRow = rowIndex + 1;
    const columnLetter = String.fromCharCode(65 + refundIndex);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Orders!${columnLetter}${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Pending Review"]],
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      refundStatus: "Pending Review",
      message: "Refund request recorded for review. No refund has been approved.",
    });
  } catch (error) {
    console.error("Refund API error:", error);
    return NextResponse.json(
      { error: "Could not record the refund request." },
      { status: 500 }
    );
  }
}