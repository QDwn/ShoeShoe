'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../login/page.css';
import { useLanguage } from '../../src/context/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(t('auth.processing'));
    setIsSuccess(false);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: registerEmail, 
          password: registerPassword,
          confirmPassword: confirmPassword,
          name: registerName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setIsSuccess(true);
        
        // Lưu user vào localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-changed'));
        
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
        setRegisterName('');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch {
      setMessage('❌ ' + t('auth.cannotConnect'));
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>{t('auth.signUp')}</h2>

        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '5px',
            textAlign: 'center',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <input 
            type="text" 
            placeholder={t('auth.fullName')} 
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            required
          />
          <input 
            type="email" 
            placeholder={t('auth.email')} 
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder={t('auth.minPassword')} 
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder={t('auth.confirmPassword')} 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">{t('auth.signUp')}</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          {t('auth.alreadyAccount')} {' '}
          <Link href="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
            {t('auth.signInNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
