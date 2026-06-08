'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './profile.css';

function splitName(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

function getAvatarLabel(user) {
  const source = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || user?.email || '?';
  return source.charAt(0).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      const nameParts = splitName(userData.name || '');

      setUser(userData);
      setFirstName(nameParts.firstName);
      setLastName(nameParts.lastName);
      setEmail(userData.email || '');
      setAvatarPreview(userData.avatar || '');
      setCurrentAvatar(userData.avatar || '');
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fullName = useMemo(() => {
    return `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');
  }, [firstName, lastName]);

  const persistUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const showResult = (ok, text) => {
    setIsSuccess(ok);
    setMessage(text);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: fullName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showResult(false, data.message || 'Cannot update profile');
        return;
      }

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setAvatarPreview(updatedUser.avatar || '');
      setCurrentAvatar(updatedUser.avatar || '');
      showResult(true, data.message || 'Profile updated');
    } catch {
      showResult(false, 'Cannot connect to Server');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showResult(false, data.message || 'Cannot change password');
        return;
      }

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showResult(true, data.message || 'Password updated');
    } catch {
      showResult(false, 'Cannot connect to Server');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatarToServer = async (base64String) => {
    const response = await fetch('/api/auth/upload-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        avatar: base64String,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    const updatedUser = { ...user, ...data.user };
    persistUser(updatedUser);
    setAvatarPreview(updatedUser.avatar || '');
    setCurrentAvatar(updatedUser.avatar || '');
    showResult(true, data.message || 'Avatar updated');
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      setAvatarPreview(base64String);
      setMessage('');

      try {
        await uploadAvatarToServer(base64String);
      } catch (error) {
        setAvatarPreview(currentAvatar || '');
        showResult(false, error.message || 'Cannot upload avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          avatar: '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cannot remove avatar');
      }

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setAvatarPreview('');
      setCurrentAvatar('');
      showResult(true, 'Avatar removed');
    } catch (error) {
      showResult(false, error.message || 'Cannot remove avatar');
    }
  };

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <div>
            <p className="profile-eyebrow">Account</p>
            <h1>Account settings</h1>
          </div>
          <Link href="/" className="profile-back-link">
            Back to Home
          </Link>
        </div>

        {message ? (
          <div className={`profile-alert ${isSuccess ? 'success' : 'error'}`}>
            {message}
          </div>
        ) : null}

        <form className="profile-panel" onSubmit={handleSaveProfile}>
          <section className="profile-section">
            <div className="section-head">
              <h2>Profile Picture</h2>
            </div>

            <div className="avatar-row">
              <div className="avatar-preview-wrap">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="avatar-photo" />
                ) : (
                  <div className="avatar-fallback">{getAvatarLabel(user)}</div>
                )}
              </div>

              <div className="avatar-actions">
                <div className="avatar-buttons">
                  <button type="button" className="btn btn-primary" onClick={handleAvatarPick}>
                    Upload Image
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRemoveAvatar}
                    disabled={!avatarPreview}
                  >
                    Remove
                  </button>
                </div>
                <p className="helper-text">We support PNGs, JPEGs and GIFs under 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden-file-input"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="grid-2">
              <div className="field">
                <label>First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="grid-email">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                />
                <p className="helper-text">Used to log in to your account</p>
              </div>
              <div className="email-action">
                <button type="button" className="btn btn-secondary wide">
                  Edit Email
                </button>
              </div>
            </div>
          </section>

          <section className="profile-section profile-password-section">
            <div>
              <h2>Password</h2>
              <p className="helper-text">Log in with your password instead of using temporary login codes</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Change Password
            </button>
          </section>

          <section className="profile-section" id="password-section">
            <div className="grid-3">
              <div className="field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </section>

          <div className="profile-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const parts = splitName(user.name || '');
                setFirstName(parts.firstName);
                setLastName(parts.lastName);
                setEmail(user.email || '');
                setAvatarPreview(user.avatar || '');
                setCurrentAvatar(user.avatar || '');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setMessage('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
