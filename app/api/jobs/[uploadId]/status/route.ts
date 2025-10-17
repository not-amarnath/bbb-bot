import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { uploadId: string } }
) {
  const uploadId = params.uploadId;
  const job = await prisma.audioUpload.findUnique({
    where: { id: uploadId },
    select: {
      status: true,
      segments: {
        include: {
          speaker: true,
          words: true,
        },
        orderBy: {
          startTime: 'asc',
        }
      }
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}