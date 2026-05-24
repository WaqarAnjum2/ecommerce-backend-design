import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Basic client-side validations
        if (!fullName.trim()) {
          setError('Full Name is required');
          setLoading(false);
          return;
        }
        const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!email || !emailRegex.test(email)) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccess('Account created successfully! Please sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        {/* Tab Headers */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`flex-1 pb-3 text-center text-lg font-semibold border-b-2 transition ${
              !isSignUp ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccess('');
            }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 pb-3 text-center text-lg font-semibold border-b-2 transition ${
              isSignUp ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccess('');
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
