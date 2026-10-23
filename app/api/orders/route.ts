
import { NextResponse } from "next/server";
import { getSheetData } from "../../lib/googleSheets";

export async function GET() {
  try {
   const rows = await getSheetData("Orders!A:G");

    if (rows.length < 2) {
      return NextResponse.json({ orders: [] });
    }

    const headers = rows[0].map((header: string) =>
      header.trim()
    );

    const orders = rows.slice(1).map((row) => {
      const order: Record<string, string> = {};

      headers.forEach((header, index) => {
        order[header] = row[index] ?? "";
      });

      return order;
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders API error:", error);

    return NextResponse.json(
      { error: "Could not load orders from Google Sheets." },
      { status: 500 }
    );
  }
}
