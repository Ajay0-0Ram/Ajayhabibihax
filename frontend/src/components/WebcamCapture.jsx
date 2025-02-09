import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamActive, setWebcamActive] = useState(true); // State to track webcam status

  // Ensure webcam is ready before capturing
  useEffect(() => {
    if (webcamRef.current) {
      setWebcamReady(true);
    }
  }, []);

  const capture = async () => {
    if (!webcamRef.current || !webcamReady || !webcamActive) {
      console.error("❌ Webcam is not ready or inactive.");
      return;
    }

    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      console.error("❌ Error: No image captured.");
      setLoading(false);
      return;
    }

    // Convert base64 to Blob
    const byteCharacters = atob(imageSrc.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Send image to API
    const formData = new FormData();
    formData.append("file", blob, "snapshot.jpg");

    try {
      const response = await fetch("http://127.0.0.1:8000/detect_emotion/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("📌 API Response:", data);

      // Check if confidence is present
      setEmotion({
        emotion: data.emotion || "Unknown",
        confidence: data.confidence !== undefined ? data.confidence.toFixed(2) : "N/A",
      });
    } catch (error) {
      console.error("Error detecting emotion:", error);
    }
    setLoading(false);
  };

  const toggleWebcam = () => {
    if (webcamActive) {
      // Stop the webcam stream
      const stream = webcamRef.current.video.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop()); // Stop all tracks
      }
    } else {
      // Restart the webcam
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          webcamRef.current.video.srcObject = stream;
        })
        .catch((error) => {
          console.error("Error restarting webcam:", error);
        });
    }
    setWebcamActive(!webcamActive); // Toggle webcam state
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {webcamActive && (
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          onUserMedia={() => setWebcamReady(true)}
          className="rounded-lg shadow-lg"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={capture}
          disabled={loading || !webcamReady || !webcamActive}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Detecting..." : "Capture & Detect Emotion"}
        </button>

        <button
          onClick={toggleWebcam}
          className={`p-2 rounded ${
            webcamActive ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          {webcamActive ? "Turn Off Webcam" : "Turn On Webcam"}
        </button>
      </div>

      {emotion && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold">Detected Emotion:</h2>
          <p className="text-lg">
            {emotion.emotion} (Confidence: {emotion.confidence})
          </p>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;