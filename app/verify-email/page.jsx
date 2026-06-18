'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../src/context/LanguageContext';
import '../login/page.css';

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState(t('auth.verifyingEmail'));
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setMessage(t('auth.emailVerificationFailed'));
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (cancelled) return;

        if (response.ok) {
          setMessage(`✓ ${data.message || t('auth.emailVerified')}`);
          setIsSuccess(true);
        } else {
          setMessage(`✕ ${data.message || t('auth.emailVerificationFailed')}`);
          setIsSuccess(false);
        }
      } catch {
        if (!cancelled) {
          setMessage(`✕ ${t('auth.cannotConnect')}`);
          setIsSuccess(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>{t('auth.verifyEmailTitle')}</h2>

        <div
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '5px',
            textAlign: 'center',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            fontSize: '14px',
          }}
        >
          {loading ? t('auth.verifyingEmail') : message}
        </div>

        <div style={{ textAlign: 'center', fontSize: '14px', lineHeight: 1.6 }}>
          <p>{t('auth.verificationHint')}</p>
          <Link href="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
            {t('auth.signInNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
