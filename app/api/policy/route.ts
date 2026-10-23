import { NextResponse } from "next/server";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
  process.cwd(),
  "refund_policy.docx"
);

    const fileBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return NextResponse.json({
      policy: result.value,
    });
  } catch (error) {
    console.error("Policy read error:", error);
    return NextResponse.json(
      { error: "Could not read the refund policy document." },
      { status: 500 }
    );
  }
}