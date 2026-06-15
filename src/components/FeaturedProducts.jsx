"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { defaultHomeMedia, getHomeMedia, HOME_MEDIA_EVENT, fetchHomeMediaConfig } from '../lib/homeMedia';

function resolveFeaturedTitle(media, fallbackNames, index) {
  const explicitTitle = String(media.titles?.[index] || '').trim();
  if (explicitTitle) return explicitTitle;

  const imageUrl = String(media.images?.[index] || '').trim();
  const matchedDefaultIndex = defaultHomeMedia.featuredImages.findIndex((item) => item === imageUrl);
  if (matchedDefaultIndex >= 0) {
    return defaultHomeMedia.featuredTitles[matchedDefaultIndex] || fallbackNames[matchedDefaultIndex] || `Featured ${index + 1}`;
  }

  return `Featured ${index + 1}`;
}

export default function FeaturedProducts(){
  const { t } = useLanguage();
  const [media, setMedia] = useState({
    images: defaultHomeMedia.featuredImages,
    titles: defaultHomeMedia.featuredTitles,
  });
  const fallbackNames = [
    t('home.featuredCategories.0'),
    t('home.featuredCategories.1'),
    t('home.featuredCategories.2'),
    t('home.featuredCategories.3'),
  ];

  useEffect(() => {
    const localMedia = getHomeMedia();
    setMedia({
      images: localMedia.featuredImages,
      titles: localMedia.featuredTitles || defaultHomeMedia.featuredTitles,
    });

    fetchHomeMediaConfig()
      .then((nextMedia) => setMedia({
        images: nextMedia.featuredImages,
        titles: nextMedia.featuredTitles || defaultHomeMedia.featuredTitles,
      }))
      .catch(() => {});

    const syncMedia = (event) => {
      const nextMedia = event?.detail || getHomeMedia();
      setMedia({
        images: nextMedia.featuredImages || getHomeMedia().featuredImages,
        titles: nextMedia.featuredTitles || defaultHomeMedia.featuredTitles,
      });
    };

    window.addEventListener(HOME_MEDIA_EVENT, syncMedia);
    window.addEventListener('storage', syncMedia);

    return () => {
      window.removeEventListener(HOME_MEDIA_EVENT, syncMedia);
      window.removeEventListener('storage', syncMedia);
    };
  }, []);

  const categories = media.images.map((img, index) => ({
    name: resolveFeaturedTitle(media, fallbackNames, index),
    img,
  }));

  return(

    <div className="Featured">

      <div className="featuredGrid">

        {categories.map((item,index)=>(
          
          <div className="featuredItem" key={index}>

            {item.img ? <img src={item.img} alt={item.name} /> : <div className="home-image-placeholder">{item.name}</div>}

            <div className="featuredContent">

              <h2>{item.name}</h2>

              <button>{t('home.shopNow')}</button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}
