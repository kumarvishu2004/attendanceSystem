import { useState, useEffect, useCallback } from 'react';

// ─── OFFICE LOCATION (Guru Nanak Tower, Chandigarh) ──────────────────────────
export const OFFICE_LOCATION = {
  name: 'Guru Nanak Tower',
  latitude: 30.7092492,
  longitude: 76.6920291,
  radiusMeters: 200, // allow within 200 metres
};

// Haversine formula — distance in metres between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * useGeolocation
 *
 * Returns:
 *  status      : 'checking' | 'allowed' | 'denied' | 'out_of_range' | 'error' | 'unsupported'
 *  distance    : metres from office (null until known)
 *  coords      : { latitude, longitude } (null until known)
 *  errorMsg    : human-readable error string
 *  recheck     : call this to retry
 */
export default function useGeolocation() {
  const [status, setStatus]     = useState('checking');
  const [distance, setDistance] = useState(null);
  const [coords, setCoords]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const check = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('checking');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        const dist = haversineDistance(
          latitude, longitude,
          OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude
        );
        setDistance(Math.round(dist));
        if (dist <= OFFICE_LOCATION.radiusMeters) {
          setStatus('allowed');
        } else {
          setStatus('out_of_range');
          setErrorMsg(
            `You are ${Math.round(dist)} m away from ${OFFICE_LOCATION.name}. ` +
            `You must be within ${OFFICE_LOCATION.radiusMeters} m to use this feature.`
          );
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMsg('Location permission denied. Please allow location access and try again.');
        } else {
          setStatus('error');
          setErrorMsg('Unable to determine your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { check(); }, [check]);

  return { status, distance, coords, errorMsg, recheck: check };
}
