"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface FileUploadProps {
  onUploadSuccess: (uploadId: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setCurrentFileName(file.name);
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const { data } = await axios.post("/api/s3/presigned-url", {
          fileName: file.name,
          fileType: file.type,
        });

        const { presignedUrl, uploadId, key } = data;

        await axios.put(presignedUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            setProgress(percentCompleted);
          },
        });

        await axios.post("/api/start-processing", { uploadId, s3Path: key });

        onUploadSuccess(uploadId);
      } catch (err) {
        console.error(err);
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [] },
    multiple: false,
  });

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-500/80 p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-10 blur-lg pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Icon / Branding */}
            <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-xl bg-white/10 sm:w-28 sm:h-28">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19V6a3 3 0 016 0v13m-9 0a3 3 0 01-3-3v-1a3 3 0 013-3h.5A6.5 6.5 0 0116 14.5V16a3 3 0 01-3 3"
                />
              </svg>
            </div>

            {/* Main content */}
            <div
              {...getRootProps()}
              role="button"
              aria-disabled={uploading}
              className="w-full cursor-pointer"
            >
              <input {...getInputProps()} />

              <div className="rounded-lg bg-white/90 dark:bg-gray-900/80 p-4 sm:p-6 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {uploading
                        ? `Uploading${
                            currentFileName ? ` — ${currentFileName}` : "..."
                          }`
                        : isDragActive
                        ? "Drop the audio file here"
                        : "Drag & drop or click to select an audio file"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Supported formats: mp3, wav, m4a. Files are uploaded securely
                      and processed automatically.
                    </p>

                    {error && (
                      <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}

                    {uploading && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2.5 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {progress}% • {currentFileName ?? "Preparing..."}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center sm:items-start">
                    <div className="hidden sm:inline-flex items-center px-3 py-2 rounded-md bg-slate-100/70 dark:bg-slate-800 text-sm">
                      <span className="truncate max-w-[10rem] text-slate-800 dark:text-slate-100">
                        {currentFileName ?? "No file selected"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="inline-flex items-center px-4 py-2 rounded-md bg-white text-sm font-medium text-slate-900 shadow-sm hover:scale-[1.02] transition-transform">
                        {uploading ? "Uploading..." : "Select File"}
                      </div>

                      <button
                        type="button"
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                        onClick={(e) => {
                          // forward click to input
                          const input =
                            (e.currentTarget.closest("div") as HTMLElement)
                              ?.querySelector("input[type='file']") as
                              | HTMLInputElement
                              | null;
                          input?.click();
                        }}
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer small note */}
          <div className="mt-4 text-center text-xs text-white/80 sm:text-right sm:mt-0">
            <span className="italic">
              Processing times vary — you will be notified when complete.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}