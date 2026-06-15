"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { defaultHomeMedia, getHomeMedia, HOME_MEDIA_EVENT, fetchHomeMediaConfig } from '../lib/homeMedia';

function resolveShopTitle(media, fallbackNames, index) {
  const explicitTitle = String(media.titles?.[index] || '').trim();
  if (explicitTitle) return explicitTitle;

  const imageUrl = String(media.images?.[index] || '').trim();
  const matchedDefaultIndex = defaultHomeMedia.shopByBasketballImages.findIndex((item) => item === imageUrl);
  if (matchedDefaultIndex >= 0) {
    return defaultHomeMedia.shopByBasketballTitles[matchedDefaultIndex] || fallbackNames[matchedDefaultIndex] || `Shop Item ${index + 1}`;
  }

  return `Shop Item ${index + 1}`;
}

export default function ShopByCategory(){
  const { t } = useLanguage();
  const [media, setMedia] = useState({
    images: defaultHomeMedia.shopByBasketballImages,
    titles: defaultHomeMedia.shopByBasketballTitles,
  });
  const fallbackNames = [
    t('home.categoryTitles.0'),
    t('home.categoryTitles.1'),
    t('home.categoryTitles.2'),
    t('home.categoryTitles.3'),
    t('home.categoryTitles.4'),
    t('home.categoryTitles.5'),
  ];

  useEffect(() => {
    const localMedia = getHomeMedia();
    setMedia({
      images: localMedia.shopByBasketballImages,
      titles: localMedia.shopByBasketballTitles || defaultHomeMedia.shopByBasketballTitles,
    });

    fetchHomeMediaConfig()
      .then((nextMedia) => setMedia({
        images: nextMedia.shopByBasketballImages,
        titles: nextMedia.shopByBasketballTitles || defaultHomeMedia.shopByBasketballTitles,
      }))
      .catch(() => {});

    const syncMedia = (event) => {
      const nextMedia = event?.detail || getHomeMedia();
      setMedia({
        images: nextMedia.shopByBasketballImages || getHomeMedia().shopByBasketballImages,
        titles: nextMedia.shopByBasketballTitles || defaultHomeMedia.shopByBasketballTitles,
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
    name: resolveShopTitle(media, fallbackNames, index),
    img,
  }));

  return(

    <div className="shopcategory">

      <div className="categoryScroll">

        {categories.map((item,index)=>(
          <div className="categoryCard" key={index}>

            {item.img ? <img src={item.img} alt={item.name} /> : <div className="home-image-placeholder tall">{item.name}</div>}

            <h3>{item.name}</h3>

          </div>
        ))}

      </div>

    </div>

  )

}
