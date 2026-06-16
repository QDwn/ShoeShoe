'use client';

import { useEffect, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';
import {
  defaultHomeMedia,
  getHomeMedia,
  saveHomeMedia,
  fetchHomeMediaConfig,
  persistHomeMediaConfig,
  uploadHomeMediaFile,
} from '../../../src/lib/homeMedia';

const heroSlotLabels = ['Hero Slide 1', 'Hero Slide 2'];
const featuredSlotLabels = ['Tee Warm Up', 'Jerseys', 'Socks', 'Shoes'];
const shopSlotLabels = ['All Star NBA 2026', 'Basketball Shoes', 'Ball Basketball', 'Socks', 'Jerseys', 'Tee Shirt'];

export default function AdminBackgroundPage() {
  const [error, setError] = useState('');
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(true);
  const [homeMedia, setHomeMedia] = useState(defaultHomeMedia);
  const [homeMediaSaving, setHomeMediaSaving] = useState(false);

  useEffect(() => {
    setHomeMedia(getHomeMedia());
    fetchStoredHomeMedia();
  }, []);

  const fetchStoredHomeMedia = async () => {
    try {
      const media = await fetchHomeMediaConfig();
      setHomeMedia(media);
    } catch (e) {
      setError(e.message);
    }
  };

  const syncHomeMediaState = async (updater) => {
    const next = typeof updater === 'function' ? updater(homeMedia) : updater;
    saveHomeMedia(next);
    setHomeMedia(next);
    setHomeMediaSaving(true);
    try {
      const persisted = await persistHomeMediaConfig(next);
      setHomeMedia(persisted);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setHomeMediaSaving(false);
    }
  };

  const openMediaPicker = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) input.click();
  };

  const updateMediaSlot = async (section, index, file) => {
    if (!file) return;
    try {
      const imageUrl = await uploadHomeMediaFile(file, `${section}-${index + 1}`);
      await syncHomeMediaState((prev) => {
        const nextList = [...prev[section]];
        nextList[index] = imageUrl;
        return { ...prev, [section]: nextList };
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const clearMediaSlot = async (section, index) => {
    try {
      await syncHomeMediaState((prev) => {
        const nextList = [...prev[section]];
        nextList[index] = '';
        return { ...prev, [section]: nextList };
      });
    } catch (_error) {}
  };

  const getTitleSection = (section) => {
    if (section === 'featuredImages') return 'featuredTitles';
    if (section === 'shopByBasketballImages') return 'shopByBasketballTitles';
    return null;
  };

  const getResolvedMediaTitle = (section, index) => {
    const titleSection = getTitleSection(section);
    if (!titleSection) return '';

    const explicitTitle = String(homeMedia[titleSection]?.[index] || '').trim();
    if (explicitTitle) return explicitTitle;

    const imageUrl = String(homeMedia[section]?.[index] || '').trim();
    const defaultImageList = defaultHomeMedia[section] || [];
    const defaultTitleList = defaultHomeMedia[titleSection] || [];
    const matchedDefaultIndex = defaultImageList.findIndex((item) => item === imageUrl);

    if (matchedDefaultIndex >= 0) {
      return defaultTitleList[matchedDefaultIndex] || '';
    }

    if (section === 'featuredImages') return `Featured ${index + 1}`;
    if (section === 'shopByBasketballImages') return `Shop Item ${index + 1}`;
    return '';
  };

  const renameMediaSlot = async (section, index) => {
    const titleSection = getTitleSection(section);
    if (!titleSection) return;

    const currentValue = getResolvedMediaTitle(section, index);
    const nextValue = window.prompt('Enter a new title', currentValue);
    if (nextValue === null) return;

    try {
      await syncHomeMediaState((prev) => {
        const nextTitles = [...(Array.isArray(prev[titleSection]) ? prev[titleSection] : [])];
        nextTitles[index] = String(nextValue).trim();
        return { ...prev, [titleSection]: nextTitles };
      });
    } catch (_error) {}
  };

  const addMediaSlot = async (section) => {
    const titleSection = getTitleSection(section);
    try {
      await syncHomeMediaState((prev) => {
        const currentItems = [...(Array.isArray(prev[section]) ? prev[section] : [])];
        const nextItems = section === 'heroImages' ? [...currentItems, ''] : ['', ...currentItems];
        const nextState = { ...prev, [section]: nextItems };

        if (titleSection) {
          const currentTitles = [...(Array.isArray(prev[titleSection]) ? prev[titleSection] : [])];
          nextState[titleSection] = ['', ...currentTitles];
        }

        return nextState;
      });
    } catch (_error) {}
  };

  const removeMediaSlot = async (section, index) => {
    const titleSection = getTitleSection(section);
    try {
      await syncHomeMediaState((prev) => {
        const nextList = [...(Array.isArray(prev[section]) ? prev[section] : [])];
        nextList.splice(index, 1);
        const nextState = { ...prev, [section]: nextList.length ? nextList : [...(defaultHomeMedia[section] || [])] };
        if (titleSection) {
          const nextTitles = [...(Array.isArray(prev[titleSection]) ? prev[titleSection] : [])];
          nextTitles.splice(index, 1);
          nextState[titleSection] = nextTitles.length ? nextTitles : [...(defaultHomeMedia[titleSection] || [])];
        }
        return nextState;
      });
    } catch (_error) {}
  };

  const resetHomeMedia = async () => {
    try {
      await syncHomeMediaState(defaultHomeMedia);
    } catch (_error) {}
  };

  const renderMediaField = (section, index, label, className) => {
    const imageUrl = homeMedia[section]?.[index] || '';
    const titleSection = getTitleSection(section);
    const resolvedTitle = titleSection ? getResolvedMediaTitle(section, index) : '';
    const inputId = `${section}-${index}`;

    return (
      <div className={`media-editable ${className || ''}`} key={`${section}-${index}`}>
        <input
          id={inputId}
          className="media-input"
          type="file"
          accept="image/*"
          onChange={(e) => updateMediaSlot(section, index, e.target.files?.[0])}
        />
        {imageUrl ? (
          <img src={imageUrl} alt={label} />
        ) : (
          <div className="media-empty-state">
            {titleSection ? (
              <span className="media-empty-title">{resolvedTitle || 'Untitled card'}</span>
            ) : (
              label
            )}
          </div>
        )}
        <div className="media-overlay">
          <div className="media-overlay-content">
            {!titleSection ? <strong>{label}</strong> : null}
            {resolvedTitle ? <span className="media-custom-title">{resolvedTitle}</span> : null}
            <div className="inline-actions">
              <button type="button" className="btn-primary" onClick={() => openMediaPicker(inputId)}>
                {imageUrl ? 'Replace' : 'Add'}
              </button>
              {imageUrl && !titleSection ? (
                <button type="button" className="btn-danger" onClick={() => clearMediaSlot(section, index)}>
                  Remove Image
                </button>
              ) : null}
              {titleSection ? (
                <button type="button" className="btn-secondary" onClick={() => renameMediaSlot(section, index)}>
                  Rename
                </button>
              ) : null}
              <button type="button" className="btn-secondary" onClick={() => removeMediaSlot(section, index)}>
                Remove Slot
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleReset = () => {
    if (window.confirm('Reset background media to defaults?')) resetHomeMedia();
  };

  return (
    <AdminPageFrame activeTab="background" title="Edit Background" error={error}>
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Home</p>
            <h2>Edit Background</h2>
          </div>
          <div className="inline-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowBackgroundPreview((v) => !v)}>
              {showBackgroundPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button type="button" className="btn-danger" onClick={handleReset} disabled={homeMediaSaving}>
              Reset Default
            </button>
          </div>
        </div>
        {homeMediaSaving ? <p className="admin-inline-note">Saving background changes...</p> : null}
        {showBackgroundPreview ? (
          <div className="home-media-editor">
            <div className="home-media-section">
              <div className="home-media-heading">
                <span className="eyebrow">Hero</span>
                <div className="home-media-title-actions">
                  <h3>Home Background</h3>
                  <button type="button" className="btn-secondary" onClick={() => addMediaSlot('heroImages')}>
                    + Add Image
                  </button>
                </div>
              </div>
              <div className="home-hero-preview">
                {heroSlotLabels.map((label, index) => renderMediaField('heroImages', index, label, 'home-hero-slot'))}
                {(homeMedia.heroImages || []).slice(heroSlotLabels.length).map((_, extraIndex) =>
                  renderMediaField('heroImages', heroSlotLabels.length + extraIndex, `Hero Slide ${heroSlotLabels.length + extraIndex + 1}`, 'home-hero-slot')
                )}
              </div>
            </div>

            <div className="home-media-section">
              <div className="home-media-heading">
                <span className="eyebrow">Featured</span>
                <div className="home-media-title-actions">
                  <h3>Featured Products</h3>
                  <button type="button" className="btn-secondary" onClick={() => addMediaSlot('featuredImages')}>
                    + Add Image
                  </button>
                </div>
              </div>
              <div className="home-featured-preview">
                {featuredSlotLabels.map((label, index) => renderMediaField('featuredImages', index, label, 'home-featured-slot'))}
                {(homeMedia.featuredImages || []).slice(featuredSlotLabels.length).map((_, extraIndex) =>
                  renderMediaField('featuredImages', featuredSlotLabels.length + extraIndex, `Featured Slot ${featuredSlotLabels.length + extraIndex + 1}`, 'home-featured-slot')
                )}
              </div>
            </div>

            <div className="home-media-section">
              <div className="home-media-heading">
                <span className="eyebrow">Categories</span>
                <div className="home-media-title-actions">
                  <h3>Shop by Basketball</h3>
                  <button type="button" className="btn-secondary" onClick={() => addMediaSlot('shopByBasketballImages')}>
                    + Add Image
                  </button>
                </div>
              </div>
              <div className="home-shop-preview">
                {shopSlotLabels.map((label, index) => renderMediaField('shopByBasketballImages', index, label, 'home-shop-slot'))}
                {(homeMedia.shopByBasketballImages || []).slice(shopSlotLabels.length).map((_, extraIndex) =>
                  renderMediaField('shopByBasketballImages', shopSlotLabels.length + extraIndex, `Shop Slot ${shopSlotLabels.length + extraIndex + 1}`, 'home-shop-slot')
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AdminPageFrame>
  );
}
