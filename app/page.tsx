"use client";

import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import axios from 'axios';

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const = useState<string | null>(null);
  const = useState<any | null>(null);

  useEffect(() => {
    if (!jobId || jobStatus === 'COMPLETED' | | jobStatus === 'FAILED') { return; }

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/jobs/${jobId}/status`);
        setJobStatus(data.status);
        if (data.status === 'COMPLETED') {
          setJobResult(data);
          clearInterval(interval);
        }
        if (data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error fetching job status:", error);
        setJobStatus('FAILED');
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  },);

  const handleUploadSuccess = (newJobId: string) => {
    setJobId(newJobId);
    setJobStatus('UPLOADED');
    setJobResult(null);
  };

  const handleExport = async () => {
    if (!jobId) return;
    try {
      const response = await axios.get(`/api/export/${jobId}/csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export CSV", error);
    }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Audio Analysis App</h1>
      
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {jobId && (
        <div className="mt-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">Job Status</h2>
          <p>Job ID: {jobId}</p>
          <p>Status: <span className="font-mono bg-gray-200 p-1 rounded">{jobStatus || 'PENDING'}</span></p> </div> )}

      {jobResult && jobStatus === 'COMPLETED' && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Transcription Results</h2>
          <button onClick={handleExport} className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Export as CSV
          </button>
          <div className="space-y-4">
            {jobResult.segments.map((segment: any) => (
              <div key={segment.id} className="p-4 border rounded-lg">
                <p className="font-bold">Speaker {segment.speaker.speakerLabel} ({segment.startTime.toFixed(2)}s - {segment.endTime.toFixed(2)}s)</p>
                <p>{segment.text}</p>
                <p className="text-sm text-gray-600 mt-2">Sentiment: {segment.sentiment} (Score: {segment.sentimentScore})</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}