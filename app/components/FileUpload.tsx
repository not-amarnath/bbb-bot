"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface FileUploadProps {
  onUploadSuccess: (uploadId: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File) => {
    const file = acceptedFiles;
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Get presigned URL from our API
      const { data } = await axios.post('/api/s3/presigned-url', {
        fileName: file.name,
        fileType: file.type,
      });

      const { presignedUrl, uploadId, key } = data;

      // 2. Upload file directly to S3
      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total?? 1)
          );
          setProgress(percentCompleted);
        },
      });

      // 3. Notify our backend that the upload is complete to trigger processing
      await axios.post('/api/start-processing', { uploadId, s3Path: key });

      onUploadSuccess(uploadId);

    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  },);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': },
    multiple: false,
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center cursor-pointer hover:border-gray-600 transition-colors">
      <input {...getInputProps()} />
      {uploading? (
        <div>
          <p>Uploading...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p>{progress}%</p>
        </div>
      ) : isDragActive? (
        <p>Drop the audio file here...</p>
      ) : (
        <p>Drag 'n' drop an audio file here, or click to select one</p>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}