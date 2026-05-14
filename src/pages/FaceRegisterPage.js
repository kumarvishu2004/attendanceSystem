import React, { useState, useCallback, useRef } from 'react';
import FaceCamera from '../components/common/FaceCamera';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import LocationGate from '../components/common/LocationGate';

function FaceRegisterPage() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | capturing | captured | saving | done | error
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [message, setMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(true);

  const REQUIRED_CAPTURES = 5;
  const descriptorsBuffer = useRef([]);

  const averageDescriptors = (descriptors) => {
    const len = descriptors[0].length;
    const avg = new Array(len).fill(0);
    for (const d of descriptors) {
      for (let i = 0; i < len; i++) avg[i] += d[i];
    }
    return avg.map(v => v / descriptors.length);
  };

  const handleFaceDetected = useCallback((descriptor) => {
    if (status === 'done' || status === 'saving') return;

    setStatus('capturing');
    descriptorsBuffer.current.push(descriptor);
    const count = descriptorsBuffer.current.length;
    setCaptureCount(count);

    if (count >= REQUIRED_CAPTURES) {
      const averaged = averageDescriptors(descriptorsBuffer.current);
      setCapturedDescriptor(averaged);
      setCameraActive(false);
      setStatus('captured');
    }
  }, [status]);

  const handleSaveDescriptor = async () => {
    if (!capturedDescriptor) return;
    setStatus('saving');

    try {
      const res = await API.put('/users/register-face', {
        faceDescriptor: capturedDescriptor
      });
      updateUser(res.data.user);
      setMessage('Face registered successfully! You can now use face recognition for attendance.');
      setStatus('done');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save face data.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setCapturedDescriptor(null);
    setCaptureCount(0);
    setMessage('');
    setCameraActive(true);
    descriptorsBuffer.current = [];
  };

  const progressPercent = Math.min((captureCount / REQUIRED_CAPTURES) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Face Registration</h2>
        <p className="text-gray-500 text-sm mt-1">Register your face for automatic attendance tracking</p>
      </div>

      {/* Status Banner */}
      {user?.faceRegistered && status !== 'done' && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span>✓</span>
          <span>Face already registered. You can re-register to update your face data.</span>
        </div>
      )}

      {/* Instructions */}
      {status === 'idle' && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">📋 Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">1.</span> Position your face clearly in the camera frame</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">2.</span> Ensure good, even lighting on your face</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">3.</span> Keep still while {REQUIRED_CAPTURES} samples are captured</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">4.</span> Remove sunglasses or face coverings</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">5.</span> Confirm to save your face data</li>
          </ul>
        </div>
      )}

      {/* Camera */}
      {(status === 'idle' || status === 'capturing') && (
        <FaceCamera
          onFaceDetected={handleFaceDetected}
          mode="register"
          active={cameraActive}
        />
      )}

      {/* Progress */}
      {(status === 'idle' || status === 'capturing') && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Samples Captured</span>
            <span className="text-sm font-mono text-blue-400">{captureCount}/{REQUIRED_CAPTURES}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {captureCount < REQUIRED_CAPTURES
              ? `Keep your face in frame... ${REQUIRED_CAPTURES - captureCount} more needed`
              : 'All samples captured!'}
          </p>
        </div>
      )}

      {/* Captured - Confirm */}
      {status === 'captured' && (
        <div className="card border-blue-800/50 bg-blue-900/10 text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-white mb-2">Face Data Captured!</h3>
          <p className="text-gray-400 text-sm mb-6">
            {REQUIRED_CAPTURES} samples averaged into your unique face profile.
            Ready to save?
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleReset} className="btn-secondary">
              Re-capture
            </button>
            <button onClick={handleSaveDescriptor} className="btn-primary">
              ✓ Save Face Data
            </button>
          </div>
        </div>
      )}

      {status === 'saving' && (
        <div className="card text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Saving face data securely...</p>
        </div>
      )}

      {status === 'done' && (
        <div className="card border-emerald-800/50 bg-emerald-900/10 text-center py-8 match-success">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-white mb-2">Registration Complete!</h3>
          <p className="text-gray-400 text-sm mb-6">{message}</p>
          <button onClick={handleReset} className="btn-secondary">Register Again</button>
        </div>
      )}

      {status === 'error' && (
        <div className="card border-red-800/50 bg-red-900/10 text-center py-8">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-red-400 font-medium mb-4">{message}</p>
          <button onClick={handleReset} className="btn-secondary">Try Again</button>
        </div>
      )}
    </div>
  );
}

const FaceRegisterPageWithLocation = () => (
  <LocationGate>
    <FaceRegisterPage />
  </LocationGate>
);

export default FaceRegisterPageWithLocation;
