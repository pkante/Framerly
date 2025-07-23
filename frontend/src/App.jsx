import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [transcription, setTranscription] = useState('');
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'video/mp4' || file.type === 'video/quicktime')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setUploadError('');
    } else {
      setUploadError('Please select an .mp4 or .mov video file.');
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    setUploading(true);
    setUploadError('');
    setTranscription('');
    const formData = new FormData();
    formData.append('file', videoFile);
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      // Fetch transcription after upload
      const tRes = await fetch(`http://localhost:8000/transcription/${encodeURIComponent(videoFile.name)}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTranscription(tData.text);
      } else {
        setTranscription('Transcription not found.');
      }
    } catch (err) {
      setUploadError('Upload failed. Is the backend running?');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setUrlLoading(true);
    setUploadError('');
    setTranscription('');
    setVideoUrl('');
    setVideoFile(null);
    try {
      const res = await fetch('http://localhost:8000/fetch_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      // Show video preview (from uploads folder, assuming backend serves static files in future)
      // For now, just show filename and transcription
      setVideoUrl('');
      setVideoFile(null);
      // Fetch transcription
      const tRes = await fetch(`http://localhost:8000/transcription/${encodeURIComponent(data.filename)}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTranscription(tData.text);
      } else {
        setTranscription('Transcription not found.');
      }
      setUploadError('Downloaded: ' + data.filename);
    } catch (err) {
      setUploadError('Download failed. Is the backend running and yt-dlp installed?');
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Upload a Video</h1>
      <form onSubmit={handleUrlSubmit} className="mb-4 flex flex-col items-center w-full max-w-md">
        <input
          type="text"
          placeholder="Paste YouTube or TikTok URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-2"
        />
        <button
          type="submit"
          disabled={!url || urlLoading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 w-full"
        >
          {urlLoading ? 'Fetching...' : 'Fetch Video from URL'}
        </button>
      </form>
      <input
        type="file"
        accept="video/mp4,video/quicktime"
        className="mb-2"
        ref={inputRef}
        onChange={handleFileChange}
      />
      {videoUrl && (
        <video src={videoUrl} controls className="w-full max-w-md mb-4 rounded shadow" />
      )}
      <button
        onClick={handleUpload}
        disabled={!videoFile || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
      {transcription && (
        <div className="mt-4 p-4 bg-white rounded shadow max-w-md w-full">
          <h2 className="font-semibold mb-2">Transcription</h2>
          <p className="whitespace-pre-line">{transcription}</p>
        </div>
      )}
    </div>
  );
}

export default App;
