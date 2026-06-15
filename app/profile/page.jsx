'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../src/context/LanguageContext';
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
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

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

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim().replace(/\s+/g, ' '), [firstName, lastName]);

  const persistUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user-changed'));
    window.dispatchEvent(new Event('recommendations-updated'));
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
        showResult(false, data.message || t('profile.cannotUpdateProfile'));
        return;
      }

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setAvatarPreview(updatedUser.avatar || '');
      setCurrentAvatar(updatedUser.avatar || '');
      showResult(true, data.message || t('profile.profileUpdated'));
    } catch {
      showResult(false, t('profile.cannotConnect'));
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
        showResult(false, data.message || t('profile.cannotChangePassword'));
        return;
      }

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showResult(true, data.message || t('profile.passwordUpdated'));
    } catch {
      showResult(false, t('profile.cannotConnect'));
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
      throw new Error(data.message || t('profile.uploadFailed'));
    }

    const updatedUser = { ...user, ...data.user };
    persistUser(updatedUser);
    setAvatarPreview(updatedUser.avatar || '');
    setCurrentAvatar(updatedUser.avatar || '');
    showResult(true, data.message || t('profile.avatarUpdated'));
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

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
        showResult(false, error.message || t('profile.cannotUploadAvatar'));
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
      if (!response.ok) throw new Error(data.message || t('profile.cannotRemoveAvatar'));

      const updatedUser = { ...user, ...data.user };
      persistUser(updatedUser);
      setAvatarPreview('');
      setCurrentAvatar('');
      showResult(true, t('profile.avatarRemoved'));
    } catch (error) {
      showResult(false, error.message || t('profile.cannotRemoveAvatar'));
    }
  };

  if (!user) {
    return <div className="profile-loading">{t('profile.loading')}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <div>
            <p className="profile-eyebrow">{t('profile.account')}</p>
            <h1>{t('profile.accountSettings')}</h1>
          </div>
          <Link href="/" className="profile-back-link">
            {t('profile.backHome')}
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
              <h2>{t('profile.profilePicture')}</h2>
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
                    {t('profile.uploadImage')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRemoveAvatar}
                    disabled={!avatarPreview}
                  >
                    {t('profile.remove')}
                  </button>
                </div>
                <p className="helper-text">{t('profile.supportedFormats')}</p>
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
                <label>{t('profile.firstName')}</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('profile.firstNamePlaceholder')} />
              </div>
              <div className="field">
                <label>{t('profile.lastName')}</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('profile.lastNamePlaceholder')} />
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="grid-email">
              <div className="field">
                <label>{t('profile.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('profile.emailPlaceholder')}
                />
                <p className="helper-text">{t('profile.emailHelp')}</p>
              </div>
              <div className="email-action">
                <button type="button" className="btn btn-secondary wide">
                  {t('profile.editEmail')}
                </button>
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
              {t('profile.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
          </div>
        </form>

        <form className="profile-panel profile-password-panel" onSubmit={handleChangePassword}>
          <section className="profile-section" id="password-section">
            <div className="password-toggle-row">
              <div>
                <h2>{t('profile.password')}</h2>
                <p className="helper-text">{t('profile.passwordHelp')}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPasswordFields((prev) => !prev)}
              >
                {showPasswordFields ? t('profile.hidePassword') : t('profile.changePassword')}
              </button>
            </div>

            {showPasswordFields && (
              <>
                <div className="grid-3 password-fields">
                  <div className="field">
                    <label>{t('profile.currentPassword')}</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder={t('profile.currentPasswordPlaceholder')}
                      required={showPasswordFields}
                    />
                  </div>
                  <div className="field">
                    <label>{t('profile.newPassword')}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('profile.newPasswordPlaceholder')}
                      required={showPasswordFields}
                    />
                  </div>
                  <div className="field">
                    <label>{t('profile.confirmPassword')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profile.confirmPasswordPlaceholder')}
                      required={showPasswordFields}
                    />
                  </div>
                </div>

                <div className="profile-footer profile-footer-password">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPasswordFields(false);
                    }}
                  >
                    {t('profile.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t('profile.saving') : t('profile.savePassword')}
                  </button>
                </div>
              </>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}
