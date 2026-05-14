import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();

  // If arriving from Google sign-in that needs employee ID
  const incomingGoogleData = location.state?.googleData || null;

  const [form, setForm] = useState({
    name: incomingGoogleData?.name || '',
    employeeId: '',
    email: incomingGoogleData?.email || '',
    password: '',
    department: 'General',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // When we have google data pre-filled, show a note
  const isGoogleCompletion = !!incomingGoogleData;

  const departments = ['Trainer', 'HR', 'General', 'Engineering', 'Finance'];

  // Load Google Identity Services script
  useEffect(() => {
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isGoogleCompletion) {
        // Complete Google registration by passing employeeId + department
        const result = await googleLogin(
          null, // no new idToken, server uses googleData stored from previous step
          form.employeeId,
          form.department
        );
        // Since we don't have idToken here, we need to re-trigger Google flow
        // with the stored googleId approach — instead, call register endpoint directly
        const res = await API.post('/auth/google-complete', {
          googleId: incomingGoogleData.googleId,
          email: incomingGoogleData.email,
          name: incomingGoogleData.name,
          picture: incomingGoogleData.picture,
          employeeId: form.employeeId,
          department: form.department,
        });
        if (res.data.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        }
      } else {
        // Standard registration
        const res = await API.post('/auth/register', form);
        if (res.data.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured. Set REACT_APP_GOOGLE_CLIENT_ID in client/.env');
      return;
    }
    if (!window.google) {
      setError('Google sign-in is loading, please try again in a moment.');
      return;
    }
    setError('');
    setGoogleLoading(true);

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const result = await googleLogin(response.credential);
          if (result.needsEmployeeId) {
            // Stay on this page, pre-fill what we have, ask for employeeId
            navigate('/register', { state: { googleData: result.googleData }, replace: true });
            window.location.reload(); // reload to reset state with new data
            return;
          }
          navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
          setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/50 mb-4 text-3xl">👁</div>
          <h1 className="text-3xl font-bold text-white">FaceAttend Pro</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isGoogleCompletion ? 'Complete your registration' : 'Create your account'}
          </p>
        </div>

        <div className="card">
          {isGoogleCompletion && (
            <div className="flex items-center gap-3 bg-blue-900/20 border border-blue-700/30 rounded-xl px-4 py-3 mb-5">
              <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <div>
                <p className="text-blue-300 text-sm font-medium">Signed in with Google</p>
                <p className="text-gray-400 text-xs">{incomingGoogleData.email} — just add your Employee ID below</p>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            {!isGoogleCompletion && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input type="text" className="input-field" placeholder="John Doe"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Employee ID</label>
              <input type="text" className="input-field" placeholder="EMP001"
                value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required />
            </div>

            {!isGoogleCompletion && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input type="email" className="input-field" placeholder="you@company.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                  <input type="password" className="input-field" placeholder="Min. 6 characters"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    minLength={6} required />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
              <select className="input-field" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : isGoogleCompletion ? 'Complete Registration' : 'Create Account'}
            </button>
          </form>

          {!isGoogleCompletion && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="text-gray-600 text-xs font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              {/* Google Sign-Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl border border-gray-300 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <svg className="animate-spin w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                )}
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            </>
          )}

          <div className="mt-5 pt-5 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
