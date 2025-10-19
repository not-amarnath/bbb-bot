"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import FileUpload from "./components/FileUpload";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<any | null>(null);

  useEffect(() => {
    if (!jobId || jobStatus === "COMPLETED" || jobStatus === "FAILED") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/jobs/${jobId}/status`);
        setJobStatus(data.status);
        if (data.status === "COMPLETED") {
          setJobResult(data);
          window.clearInterval(interval);
        }
        if (data.status === "FAILED") {
          window.clearInterval(interval);
        }
      } catch (error) {
        console.error("Error fetching job status:", error);
        setJobStatus("FAILED");
        window.clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => window.clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleUploadSuccess = (newJobId: string) => {
    setJobId(newJobId);
    setJobStatus("UPLOADED");
    setJobResult(null);
  };

  const handleExport = async () => {
    if (!jobId) return;
    try {
      const response = await axios.get(`/api/export/${jobId}/csv`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export-${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export CSV", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero (no header/logo) */}
      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 mb-6"></div>

          <h1 className="text-slate-900 dark:text-white font-extrabold leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Free & Open Source AI
            <br className="hidden md:inline" /> Meeting Note Taker
          </h1>

          <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-8">
            Your Data, Your Control — 100% local AI processing. Works with
            Google Meet, Zoom, Teams and more. Self-hosted alternative to
            Granola, Otter.ai and Fireflies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"></div>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-6"></div>
        </div>
      </section>

      {/* File upload card like hero's lower card */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            {/* example export button shown when job completes */}
            {jobStatus === "COMPLETED" && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}