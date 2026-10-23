
import { NextResponse } from "next/server";
import { getSheetData } from "../../lib/googleSheets";

export async function GET() {
  try {
    const rows = await getSheetData("Products!A:F");

    if (rows.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const headers = rows[0].map((header: string) =>
      header.trim()
    );

    const products = rows.slice(1).map((row) => {
      const product: Record<string, string> = {};

      headers.forEach((header, index) => {
        product[header] = row[index] ?? "";
      });

      return product;
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      { error: "Could not load products from Google Sheets." },
      { status: 500 }
    );
  }
}
