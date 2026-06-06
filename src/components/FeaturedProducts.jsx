"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getHomeMedia, HOME_MEDIA_EVENT } from '../lib/homeMedia';

export default function FeaturedProducts(){
  const { t } = useLanguage();
  const [images, setImages] = useState(getHomeMedia().featuredImages);

  useEffect(() => {
    const syncMedia = (event) => {
      setImages(event?.detail?.featuredImages || getHomeMedia().featuredImages);
    };

    window.addEventListener(HOME_MEDIA_EVENT, syncMedia);
    window.addEventListener('storage', syncMedia);

    return () => {
      window.removeEventListener(HOME_MEDIA_EVENT, syncMedia);
      window.removeEventListener('storage', syncMedia);
    };
  }, []);

  const categories = [
    { name: t('home.featuredCategories.0'), sales: 1200, img: images[0] },
    { name: t('home.featuredCategories.1'), sales: 900, img: images[1] },
    { name: t('home.featuredCategories.2'), sales: 700, img: images[2] },
    { name: t('home.featuredCategories.3'), sales: 1500, img: images[3] }
  ]

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
