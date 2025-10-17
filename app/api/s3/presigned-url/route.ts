import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName ||!fileType) {
      return NextResponse.json({ error: "File name and type are required" }, { status: 400 });
    }

    const id = uuidv4();
    const key = `${id}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Create a record in the database
    const audioUpload = await prisma.audioUpload.create({
      data: {
        fileName: fileName,
        s3Path: key,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      presignedUrl,
      uploadId: audioUpload.id,
      key,
    });

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Error generating presigned URL" }, { status: 500 });
  }
}