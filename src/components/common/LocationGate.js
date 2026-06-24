import React from 'react';
import useGeolocation, { OFFICE_LOCATION } from '../../hooks/useGeolocation';

/**
 * LocationGate — wraps any page/component that requires the user
 * to be physically at the office location.
 *
 * Usage:
 *   <LocationGate>
 *     <AttendancePage />
 *   </LocationGate>
 */
export default function LocationGate({ children }) {
  const { status, distance, errorMsg, recheck } = useGeolocation();

  if (status === 'allowed') return children;

  const icons = {
    checking:     { emoji: '📡', color: 'blue',   title: 'Checking your location…' },
    denied:       { emoji: '🔒', color: 'red',    title: 'Location Access Denied' },
    out_of_range: { emoji: '📍', color: 'amber',  title: 'Outside Office Zone' },
    error:        { emoji: '⚠️', color: 'red',    title: 'Location Error' },
    unsupported:  { emoji: '🌐', color: 'gray',   title: 'Browser Not Supported' },
  };

  const cfg = icons[status] || icons.error;

  const colorMap = {
    blue:  { bg: 'bg-blue-900/30',  border: 'border-blue-700/40',  text: 'text-blue-400',  btn: 'bg-blue-600 hover:bg-blue-500' },
    red:   { bg: 'bg-red-900/30',   border: 'border-red-700/40',   text: 'text-red-400',   btn: 'bg-red-600 hover:bg-red-500' },
    amber: { bg: 'bg-amber-900/20', border: 'border-amber-700/40', text: 'text-amber-400', btn: 'bg-amber-600 hover:bg-amber-500' },
    gray:  { bg: 'bg-gray-900/30',  border: 'border-gray-700/40',  text: 'text-gray-400',  btn: 'bg-gray-600 hover:bg-gray-500' },
  };
  const c = colorMap[cfg.color];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className={`w-full max-w-md rounded-2xl border ${c.border} ${c.bg} p-8 text-center space-y-5`}>
        {/* Pulsing icon for 'checking' */}
        <div className={`text-5xl ${status === 'checking' ? 'animate-pulse' : ''}`}>
          {cfg.emoji}
        </div>

        <div>
          <h2 className={`text-xl font-bold ${c.text}`}>{cfg.title}</h2>
          {errorMsg && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{errorMsg}</p>
          )}
          {status === 'checking' && (
            <p className="text-gray-500 text-sm mt-2">Requesting GPS…</p>
          )}
        </div>

        {/* Office info card */}
        <div className="bg-gray-900/50 rounded-xl p-4 text-left space-y-1 text-sm">
          <p className="text-gray-400 font-medium">📌 Required location</p>
          <p className="text-white font-semibold">{OFFICE_LOCATION.name}</p>
          <p className="text-gray-500 text-xs">
            {OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}
          </p>
          <p className="text-gray-500 text-xs">
            Allowed radius: {OFFICE_LOCATION.radiusMeters} metres
          </p>
          {typeof distance === 'number' && (
            <p className={`text-xs font-semibold mt-1 ${distance <= OFFICE_LOCATION.radiusMeters ? 'text-green-400' : 'text-red-400'}`}>
              Your distance: {distance} m
            </p>
          )}
        </div>

        {/* Action buttons */}
        {status !== 'checking' && status !== 'unsupported' && (
          <button
            onClick={recheck}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${c.btn}`}
          >
            🔄 Try Again
          </button>
        )}

        {(status === 'denied') && (
          <p className="text-gray-600 text-xs">
            Tip: Open browser settings → Site Settings → Location → Allow for this site.
          </p>
        )}

        <a
          href={`https://www.google.com/maps?q=${OFFICE_LOCATION.latitude},${OFFICE_LOCATION.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-400 hover:text-blue-300 text-xs transition-colors"
        >
          View office on Google Maps →
        </a>
      </div>
    </div>
  );
}
