'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/context/LanguageContext';
import '../login/page.css';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [stage, setStage] = useState('email');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  const showMessage = (text, success = false) => {
    setMessage(text);
    setIsSuccess(success);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    showMessage(t('auth.processing'), false);

    try {
      const response = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`✓ ${data.message || t('auth.otpSent')}`, true);
        setDebugOtp(data.debugOtp || '');
        setStage('otp');
      } else {
        setDebugOtp('');
        showMessage(`✕ ${data.message || t('auth.resetFailed')}`, false);
      }
    } catch {
      showMessage(`✕ ${t('auth.cannotConnect')}`, false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    showMessage(t('auth.processing'), false);

    try {
      const response = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStage('reset');
        setDebugOtp('');
        showMessage(`✓ ${data.message || t('auth.otpSent')}`, true);
      } else {
        showMessage(`✕ ${data.message || t('auth.otpInvalid')}`, false);
      }
    } catch {
      showMessage(`✕ ${t('auth.cannotConnect')}`, false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    showMessage(t('auth.processing'), false);

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`✓ ${data.message || t('auth.passwordResetSuccess')}`, true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        showMessage(`✕ ${data.message || t('auth.resetFailed')}`, false);
      }
    } catch {
      showMessage(`✕ ${t('auth.cannotConnect')}`, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>{t('auth.resetPassword')}</h2>

        {message && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '5px',
              textAlign: 'center',
              backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
              color: isSuccess ? '#155724' : '#721c24',
              fontSize: '14px',
            }}
          >
            {message}
          </div>
        )}

        {debugOtp && (
          <div
            style={{
              marginBottom: '15px',
              padding: '10px',
              borderRadius: '5px',
              background: '#fff3cd',
              color: '#92400e',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            DEV OTP: <strong>{debugOtp}</strong>
          </div>
        )}

        {stage === 'email' && (
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? t('auth.processing') : t('auth.requestOtp')}
            </button>
          </form>
        )}

        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder={t('auth.otp')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? t('auth.processing') : t('auth.verifyOtp')}
            </button>
          </form>
        )}

        {stage === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder={t('auth.minPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? t('auth.processing') : t('auth.resetPassword')}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <Link href="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
            {t('auth.signInNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
