'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/context/LanguageContext';
import './page.css';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(t('auth.processing'));
    setIsSuccess(false);
    setShowResendVerification(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message || t('auth.loginSuccess')}`);
        setIsSuccess(true);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-changed'));
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setMessage(`✕ ${data.message || t('auth.loginFailed')}`);
        setShowResendVerification(response.status === 403);
      }
    } catch {
      setMessage(`✕ ${t('auth.cannotConnect')}`);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setMessage(`✕ ${t('auth.email')} là bắt buộc`);
      return;
    }

    setResendLoading(true);
    setMessage(t('auth.processing'));

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message || t('auth.verificationHint')}`);
        setIsSuccess(true);
        setShowResendVerification(false);
      } else {
        setMessage(`✕ ${data.message || t('auth.registerFailed')}`);
        setIsSuccess(false);
      }
    } catch {
      setMessage(`✕ ${t('auth.cannotConnect')}`);
      setIsSuccess(false);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>{t('auth.signIn')}</h2>

        {message && (
          <div style={{
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

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{t('auth.signIn')}</button>
        </form>

        {showResendVerification && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            style={{
              width: '100%',
              marginTop: '12px',
              background: '#b91c1c',
            }}
          >
            {resendLoading ? t('auth.processing') : t('auth.resendVerification')}
          </button>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          {t('auth.noAccount')}{' '}
        <Link href="/register" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
          {t('auth.signUpNow')}
        </Link>
      </div>

      <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px' }}>
        <Link href="/forgot-password" style={{ color: '#b91c1c', textDecoration: 'none', fontWeight: 'bold' }}>
          {t('auth.forgotPassword')}
        </Link>
      </div>
      </div>
    </div>
  );
}
