import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { uploadId: string } }
) {
  try {
    const uploadId = params.uploadId;
    const segments = await prisma.transcriptionSegment.findMany({
      where: { uploadId },
      include: { speaker: true },
      orderBy: { startTime: 'asc' },
    });

    if (segments.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 });
    }

    const fields =;

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(segments);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${uploadId}.csv"`,
      },
    });

  } catch (error) {
    console.error("CSV Export failed:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}