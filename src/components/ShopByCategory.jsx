"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { defaultHomeMedia, getHomeMedia, HOME_MEDIA_EVENT, fetchHomeMediaConfig } from '../lib/homeMedia';

export default function ShopByCategory(){
  const { t } = useLanguage();
  const [images, setImages] = useState(defaultHomeMedia.shopByBasketballImages);

  useEffect(() => {
    setImages(getHomeMedia().shopByBasketballImages);

    fetchHomeMediaConfig()
      .then((media) => setImages(media.shopByBasketballImages))
      .catch(() => {});

    const syncMedia = (event) => {
      setImages(event?.detail?.shopByBasketballImages || getHomeMedia().shopByBasketballImages);
    };

    window.addEventListener(HOME_MEDIA_EVENT, syncMedia);
    window.addEventListener('storage', syncMedia);

    return () => {
      window.removeEventListener(HOME_MEDIA_EVENT, syncMedia);
      window.removeEventListener('storage', syncMedia);
    };
  }, []);

  const categories = [
    {name:t('home.categoryTitles.0'), img:images[0]},
    {name:t('home.categoryTitles.1'), img:images[1]},
    {name:t('home.categoryTitles.2'), img:images[2]},
    {name:t('home.categoryTitles.3'), img:images[3]},
    {name:t('home.categoryTitles.4'), img:images[4]},
    {name:t('home.categoryTitles.5'), img:images[5]}
  ]

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
