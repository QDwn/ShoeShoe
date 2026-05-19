'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, password, avatar
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // State cho edit info
  const [editName, setEditName] = useState('');

  // State cho change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State cho upload avatar
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    setEditName(userData.name);
    if (userData.avatar) {
      setAvatarPreview(userData.avatar);
    }
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('Processing...');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: editName
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setIsSuccess(true);
        
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (error) {
      setMessage('❌ Cannot connect to Server');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('Processing...');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          oldPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setIsSuccess(true);
        
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (error) {
      setMessage('❌ Cannot connect to Server');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      setAvatarPreview(base64String);

      try {
        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user.id,
            avatar: base64String
          })
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('✅ ' + data.message);
          setIsSuccess(true);

          const updatedUser = { ...user, ...data.user };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setMessage('❌ ' + data.message);
        }
      } catch (error) {
        setMessage('❌ Cannot connect to Server');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-header">
          <Link href="/" className="back-link">← Back to Home</Link>
          <h1>My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-placeholder-large">{user.name?.[0]?.toUpperCase()}</div>
            )}
            <div className="profile-info-basic">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => { setActiveTab('info'); setMessage(''); }}
          >
            Personal Info
          </button>
          <button
            className={`tab-button ${activeTab === 'avatar' ? 'active' : ''}`}
            onClick={() => { setActiveTab('avatar'); setMessage(''); }}
          >
            Avatar
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => { setActiveTab('password'); setMessage(''); }}
          >
            Change Password
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Tab Content */}
        <div className="profile-content">
          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="tab-content">
              <h3>Personal Information</h3>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user.email} disabled />
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-save">Save</button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name);
                        setMessage('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <div className="info-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Name</label>
                    <p>{user.name}</p>
                  </div>
                  <button
                    className="btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Name
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Avatar Tab */}
          {activeTab === 'avatar' && (
            <div className="tab-content">
              <h3>Change Avatar</h3>
              <div className="avatar-upload">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />
                ) : (
                  <div className="avatar-preview-placeholder">No avatar selected</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="file-input"
                />
                <label htmlFor="avatar-input" className="btn-upload">
                  Choose Image
                </label>
              </div>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="tab-content">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Old Password</label>
                  <input
                    type="password"
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (minimum 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-save">Change Password</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
