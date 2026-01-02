import { useRef, useState } from "react";
import Instructions from "./components/Instructions";
import ProgressBar from "./components/ProgressBar";
import { UI_CONFIG } from "./config";
import { processVideoMaxBrightness } from "./processors";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoBlob(file);
      processVideo(file);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = null;
  };

  const processVideo = async (blob) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: 0 });
    setResultImage(null);

    try {
      const onProgress = (current, total) => {
        setProgress({ current, total });
      };

      const result = await processVideoMaxBrightness(blob, onProgress);
      setResultImage(result);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Processing failed: " + error.message);
    }

    setIsProcessing(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        processVideo(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Recording failed: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setVideoBlob(null);
    setResultImage(null);
    setProgress({ current: 0, total: 0 });
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          7k memory solver
        </h1>

        <Instructions />

        <div className="flex gap-3 mb-6">
          {UI_CONFIG.showUploadButton && (
            <>
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Upload Video
              </button>
            </>
          )}

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              Screen Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-5 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors font-medium"
            >
              Stop Recording
            </button>
          )}
        </div>

        {isProcessing && (
          <ProgressBar
            current={progress.current}
            total={progress.total}
            label="Processing video frames..."
          />
        )}

        {resultImage && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Result</h2>
            <img
              src={resultImage}
              alt="Processed result"
              className="max-w-full rounded border border-gray-300"
            />
            <div className="flex gap-3 mt-4">
              <a
                href={resultImage}
                download="memory-game-solution.png"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Download Solution
              </a>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
