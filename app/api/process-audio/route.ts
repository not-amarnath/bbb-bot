import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@upstash/qstash/nextjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import axios from "axios";

async function handler(req: NextRequest) {
  try {
    const { uploadId, s3Path } = await req.json();

    // Update status to PROCESSING
    await prisma.audioUpload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' },
    });

    // --- MOCK PROCESSING ---
    // In a real app, you would call your AI APIs here.
    // For this example, we'll simulate the process and create mock data.
    console.log(`Processing audio for uploadId: ${uploadId}`);
    await new Promise(resolve => setTimeout(resolve, 15000)); // Simulate long task

    // Mock API response data
    const mockApiResponse = {
      words: [
        { text: "Hello", start: 0.0, end: 0.5 },
        { text: "world", start: 0.6, end: 1.0 },
        { text: "This", start: 2.0, end: 2.2 }
      ],
      utterances: [
        {
          speaker: "A",
          text: "Hello world",
          start: 0.0,
          end: 1.0,
          sentiment: "neutral",
          sentimentScore: 0.0
        },
        {
          speaker: "B",
          text: "This is a test",
          start: 2.0,
          end: 3.0,
          sentiment: "positive",
          sentimentScore: 0.8
        }
      ]
    };
    // --- DATA PERSISTENCE ---
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const speakersMap = new Map<string, string>();

      for (const utterance of mockApiResponse.utterances) {
        let speakerRecord = await tx.speaker.findUnique({
          where: { uploadId_speakerLabel: { uploadId, speakerLabel: utterance.speaker } },
        });
        if (!speakerRecord) {
          speakerRecord = await tx.speaker.create({
            data: { uploadId, speakerLabel: utterance.speaker },
          });
        }
        speakersMap.set(utterance.speaker, speakerRecord.id);

        const segment = await tx.transcriptionSegment.create({
          data: {
            text: utterance.text,
            startTime: utterance.start,
            endTime: utterance.end,
            sentiment: utterance.sentiment,
            sentimentScore: utterance.sentimentScore,
            uploadId: uploadId,
            speakerId: speakerRecord.id,
          },
        });

        const wordsInSegment = mockApiResponse.words.filter(
          w => w.start >= utterance.start && w.end <= utterance.end
        );

        await tx.wordTimestamp.createMany({
          data: wordsInSegment.map(word => ({
            word: word.text,
            startTime: word.start,
            endTime: word.end,
            segmentId: segment.id,
          })),
        });
      }
    });

    // --- FINAL CALCULATIONS ---
    // (You would add the metric calculation logic here)

    // Final status update
    await prisma.audioUpload.update({
      where: { id: uploadId },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Processing failed:", error);
    // You should also update the DB status to FAILED here
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// Secure the endpoint with QStash signature verification
export const POST = verifySignature(handler as unknown as any);