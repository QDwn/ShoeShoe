'use client';

import { useState } from 'react';
import Link from 'next/link';
import './page.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Processing...');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setIsSuccess(true);
        
        // Lưu user vào localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          window.location.href = '/'; 
        }, 1500);
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (error) {
      setMessage('❌ Cannot connect to Server');
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>Sign In</h2>

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

        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}