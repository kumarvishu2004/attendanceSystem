import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { loadFaceModels, detectFace, getDescriptorArray, faceapi } from '../../utils/faceUtils';

export default function FaceCamera({
  onFaceDetected,
  onNoFace,
  mode = 'recognize', // 'recognize' | 'register'
  active = true,
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    loadFaceModels().then(loaded => {
      if (loaded) setModelsLoaded(true);
      else setError('Failed to load face recognition models. Please refresh the page.');
    });
  }, []);

  const drawOnCanvas = useCallback((detection, video) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      const { x, y, width, height } = detection.detection.box;
      const pad = 20;

      // Draw face box
      ctx.strokeStyle = faceDetected ? '#22c55e' : '#3b82f6';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - pad, y - pad, width + pad * 2, height + pad * 2);

      // Corner accents
      const cornerLen = 20;
      ctx.strokeStyle = faceDetected ? '#22c55e' : '#60a5fa';
      ctx.lineWidth = 4;
      const corners = [
        [x - pad, y - pad, 1, 1],
        [x + width + pad, y - pad, -1, 1],
        [x - pad, y + height + pad, 1, -1],
        [x + width + pad, y + height + pad, -1, -1]
      ];
      for (const [cx, cy, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cornerLen * dx, cy);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + cornerLen * dy);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = faceDetected ? '#22c55e' : '#3b82f6';
      ctx.font = 'bold 14px Inter';
      ctx.fillRect(x - pad, y - pad - 24, 120, 24);
      ctx.fillStyle = '#fff';
      ctx.fillText(faceDetected ? '✓ Face Found' : '⟳ Scanning...', x - pad + 6, y - pad - 6);
    }
  }, [faceDetected]);

  const runDetection = useCallback(async () => {
    if (!modelsLoaded || !active || processing) return;
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    setProcessing(true);
    try {
      const detection = await detectFace(video);
      drawOnCanvas(detection, video);

      if (detection) {
        setFaceDetected(true);
        const descriptor = getDescriptorArray(detection);
        if (descriptor) {
          onFaceDetected?.(descriptor, detection);
        }
      } else {
        setFaceDetected(false);
        onNoFace?.();
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setProcessing(false);
    }
  }, [modelsLoaded, active, processing, drawOnCanvas, onFaceDetected, onNoFace]);

  useEffect(() => {
    if (modelsLoaded && cameraReady && active) {
      intervalRef.current = setInterval(runDetection, 800);
    }
    return () => clearInterval(intervalRef.current);
  }, [modelsLoaded, cameraReady, active, runDetection]);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Status Bar */}
      <div className={`mb-3 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
        !modelsLoaded ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' :
        !cameraReady ? 'bg-gray-800 border-gray-700 text-gray-400' :
        faceDetected ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' :
        'bg-blue-900/20 border-blue-800/50 text-blue-400'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          !modelsLoaded ? 'bg-amber-400 animate-pulse' :
          !cameraReady ? 'bg-gray-500 animate-pulse' :
          faceDetected ? 'bg-emerald-400' :
          'bg-blue-400 animate-pulse'
        }`}></span>
        {!modelsLoaded ? 'Loading AI models...' :
         !cameraReady ? 'Starting camera...' :
         faceDetected ? 'Face detected — hold still' :
         'Looking for face...'}
      </div>

      {/* Camera Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-800 shadow-2xl"
           style={{ aspectRatio: '4/3' }}>
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div>
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              mirrored={true}
              videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={(e) => setError('Camera access denied. Please allow camera permissions.')}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Corner Decorations */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-lg"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-lg"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-lg"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-lg"></div>
            </div>

            {/* Scan Line */}
            {cameraReady && !faceDetected && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60 scan-line"
                ></div>
              </div>
            )}

            {/* Mode Badge */}
            <div className="absolute top-3 right-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                mode === 'register' ? 'bg-purple-900/80 text-purple-300 border border-purple-700' :
                'bg-blue-900/80 text-blue-300 border border-blue-700'
              }`}>
                {mode === 'register' ? '📸 Register' : '🔍 Recognize'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Info Text */}
      <p className="text-center text-xs text-gray-600 mt-3">
        Position your face within the camera frame • Ensure good lighting
      </p>
    </div>
  );
}
