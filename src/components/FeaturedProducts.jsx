"use client"

import { useLanguage } from '../context/LanguageContext';

export default function FeaturedProducts(){
  const { t } = useLanguage();

  const categories = [
    { name: t('home.featuredCategories.0'), sales: 1200, img: "/warmup.jpg" },
    { name: t('home.featuredCategories.1'), sales: 900, img: "/jerseys.jpg" },
    { name: t('home.featuredCategories.2'), sales: 700, img: "/socks.jpg" },
    { name: t('home.featuredCategories.3'), sales: 1500, img: "/sabrina2.jpg" }
  ]

  return(

    <div className="Featured">

      <div className="featuredGrid">

        {categories.map((item,index)=>(
          
          <div className="featuredItem" key={index}>

            <img src={item.img} alt={item.name} />

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