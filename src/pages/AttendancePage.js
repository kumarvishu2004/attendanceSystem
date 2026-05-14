import React, { useState, useCallback, useRef } from 'react';
import FaceCamera from '../components/common/FaceCamera';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import API from '../utils/api';
import LocationGate from '../components/common/LocationGate';

const MATCH_THRESHOLD = 0.5;
const CONFIRM_FRAMES = 3; // need N consecutive matches

function AttendancePage() {
  const { user } = useAuth();
  const { todayAttendance, isLoggedIn, isLoggedOut, fetchTodayAttendance } = useAttendance();

  const [status, setStatus] = useState('idle'); // idle | scanning | matched | noMatch | success | error | alreadyDone
  const [matchedUser, setMatchedUser] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  const consecutiveMatches = useRef(0);
  const lastProcessedRef = useRef(null);
  const processingRef = useRef(false);

  const mode = isLoggedIn && !isLoggedOut ? 'logout' : 'login';

  const handleFaceDetected = useCallback(async (descriptor) => {
    if (processingRef.current || status === 'success') return;

    // Rate limit: process every 1.5 seconds
    const now = Date.now();
    if (lastProcessedRef.current && now - lastProcessedRef.current < 1500) return;
    lastProcessedRef.current = now;

    setStatus('scanning');
    processingRef.current = true;

    try {
      const res = await API.post('/users/recognize-face', { faceDescriptor: descriptor });
      const { matched, user: matchUser, confidence: conf } = res.data;

      if (matched && matchUser) {
        consecutiveMatches.current += 1;
        setMatchedUser(matchUser);
        setConfidence(conf);

        if (consecutiveMatches.current >= CONFIRM_FRAMES) {
          // Confirmed match — process attendance
          consecutiveMatches.current = 0;
          setCameraActive(false);
          setLoading(true);
          setStatus('matched');

          try {
            if (mode === 'login') {
              const r = await API.post('/attendance/login', { method: 'face' });
              setMessage(r.data.message);
              setStatus('success');
            } else {
              const r = await API.post('/attendance/logout', { method: 'face' });
              setMessage(r.data.message);
              setStatus('success');
            }
            await fetchTodayAttendance();
          } catch (err) {
            const msg = err.response?.data?.message || 'Error processing attendance';
            if (msg.includes('Already')) {
              setStatus('alreadyDone');
              setMessage(msg);
            } else {
              setStatus('error');
              setMessage(msg);
            }
          } finally {
            setLoading(false);
          }
        } else {
          setStatus('scanning');
        }
      } else {
        consecutiveMatches.current = 0;
        setStatus('noMatch');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Recognition error');
    } finally {
      processingRef.current = false;
    }
  }, [status, mode, fetchTodayAttendance]);

  const handleNoFace = useCallback(() => {
    if (status !== 'success' && status !== 'matched') {
      consecutiveMatches.current = 0;
      setStatus('idle');
    }
  }, [status]);

  const handleReset = () => {
    setStatus('idle');
    setMatchedUser(null);
    setMessage('');
    setCameraActive(true);
    consecutiveMatches.current = 0;
    processingRef.current = false;
  };

  const handleManualAttendance = async (actionMode) => {
    setLoading(true);
    try {
      if (actionMode === 'login') {
        const r = await API.post('/attendance/login', { method: 'manual' });
        setMessage(r.data.message);
      } else {
        const r = await API.post('/attendance/logout', { method: 'manual' });
        setMessage(r.data.message);
      }
      setStatus('success');
      await fetchTodayAttendance();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Face Recognition</h2>
        <p className="text-gray-500 text-sm mt-1">
          {mode === 'login' ? 'Look at the camera to mark your attendance' : 'Look at the camera to mark your logout'}
        </p>
      </div>

      {/* Today Status */}
      {todayAttendance && (
        <div className="card bg-gray-800/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Login</p>
              <p className="font-mono font-bold text-white text-sm">
                {todayAttendance.loginTime
                  ? new Date(todayAttendance.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className={`text-xs font-semibold ${
                todayAttendance.status === 'present' ? 'text-emerald-400' :
                todayAttendance.status === 'late' ? 'text-amber-400' : 'text-gray-400'
              }`}>{todayAttendance.status || 'N/A'}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Logout</p>
              <p className="font-mono font-bold text-white text-sm">
                {todayAttendance.logoutTime
                  ? new Date(todayAttendance.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Already Done */}
      {isLoggedOut ? (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-white mb-2">Attendance Complete</h3>
          <p className="text-gray-400 text-sm">You've completed your attendance for today.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">In</p>
              <p className="font-mono font-bold text-emerald-400 text-sm">
                {new Date(todayAttendance.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Out</p>
              <p className="font-mono font-bold text-red-400 text-sm">
                {new Date(todayAttendance.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">Total: {todayAttendance.totalHours}h</p>
        </div>
      ) : (
        <>
          {/* Camera */}
          {status !== 'success' && (
            <FaceCamera
              onFaceDetected={handleFaceDetected}
              onNoFace={handleNoFace}
              mode="recognize"
              active={cameraActive && !loading}
            />
          )}

          {/* Status Feedback */}
          <div className={`card text-center py-6 transition-all duration-300 ${
            status === 'success' ? 'border-emerald-800/50 bg-emerald-900/10' :
            status === 'error' ? 'border-red-800/50 bg-red-900/10' :
            status === 'matched' ? 'border-blue-800/50 bg-blue-900/10' :
            status === 'noMatch' ? 'border-amber-800/30' : ''
          }`}>
            {status === 'idle' && (
              <div>
                <div className="text-4xl mb-3">📹</div>
                <p className="text-gray-300 font-medium">Position your face in the camera</p>
                <p className="text-gray-600 text-sm mt-1">Recognition starts automatically</p>
              </div>
            )}

            {status === 'scanning' && (
              <div>
                <div className="text-4xl mb-3 animate-pulse">🔍</div>
                <p className="text-blue-400 font-medium">Scanning face...</p>
                {matchedUser && (
                  <p className="text-gray-400 text-sm mt-1">
                    Possible match: {matchedUser.name} ({consecutiveMatches.current}/{CONFIRM_FRAMES})
                  </p>
                )}
              </div>
            )}

            {status === 'noMatch' && (
              <div>
                <div className="text-4xl mb-3">❓</div>
                <p className="text-amber-400 font-medium">Face not recognized</p>
                <p className="text-gray-600 text-sm mt-1">Make sure your face is registered in the system</p>
              </div>
            )}

            {status === 'matched' && loading && (
              <div>
                <div className="text-4xl mb-3">⚡</div>
                <p className="text-blue-400 font-medium">Processing for {matchedUser?.name}...</p>
                <p className="text-gray-500 text-sm mt-1">Confidence: {confidence}%</p>
              </div>
            )}

            {status === 'success' && (
              <div className="match-success">
                <div className="text-5xl mb-3">{mode === 'login' ? '👋' : '🏠'}</div>
                <p className="text-emerald-400 font-bold text-lg">{mode === 'login' ? 'Login Recorded!' : 'Logout Recorded!'}</p>
                <p className="text-gray-300 text-sm mt-2">{message}</p>
                <button onClick={handleReset} className="btn-secondary mt-4 text-sm">
                  {mode === 'login' ? 'Mark Another' : 'Done'}
                </button>
              </div>
            )}

            {(status === 'error' || status === 'alreadyDone') && (
              <div>
                <div className="text-4xl mb-3">⚠️</div>
                <p className={`font-medium ${status === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{message}</p>
                <button onClick={handleReset} className="btn-secondary mt-4 text-sm">Try Again</button>
              </div>
            )}
          </div>

          {/* Manual Override */}
          {user?.faceRegistered === false && status !== 'success' && (
            <div className="card border-amber-800/30 bg-amber-900/10">
              <p className="text-amber-400 text-sm font-medium mb-3">⚠️ Face not registered — use manual attendance</p>
              <div className="flex gap-3">
                {!isLoggedIn && (
                  <button onClick={() => handleManualAttendance('login')} className="btn-success flex-1 text-sm" disabled={loading}>
                    Manual Login
                  </button>
                )}
                {isLoggedIn && !isLoggedOut && (
                  <button onClick={() => handleManualAttendance('logout')} className="btn-danger flex-1 text-sm" disabled={loading}>
                    Manual Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Wrap with location gate — attendance only works at the office location
const AttendancePageWithLocation = () => (
  <LocationGate>
    <AttendancePage />
  </LocationGate>
);

export { AttendancePage };
export default AttendancePageWithLocation;
