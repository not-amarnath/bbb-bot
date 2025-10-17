import { Client } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId, s3Path } = await req.json();

    // Update status in DB
    await prisma.audioUpload.update({
      where: { id: uploadId },
      data: { status: 'QUEUED' },
    });

    // Publish job to QStash
    await qstashClient.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-audio`,
      body: {
        uploadId,
        s3Path,
      },
    });

    return NextResponse.json({ message: "Processing job queued" });
  } catch (error) {
    console.error("Error queueing job:", error);
    return NextResponse.json({ error: "Failed to queue job" }, { status: 500 });
  }
}