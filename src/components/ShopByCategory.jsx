"use client"

import { useLanguage } from '../context/LanguageContext';

export default function ShopByCategory(){
  const { t } = useLanguage();

  const categories = [
    {name:t('home.categoryTitles.0'), img:"/all star nba 2026.jpg"},
    {name:t('home.categoryTitles.1'), img:"/jordan.jpg"},
    {name:t('home.categoryTitles.2'), img:"/ball.jpg"},
    {name:t('home.categoryTitles.3'), img:"/bg socks.jpg"},
    {name:t('home.categoryTitles.4'), img:"/jersey allstar 2026.jpg"},
    {name:t('home.categoryTitles.5'), img:"/teeshirt allstar 2026.jpg"}
  ]

  return(

    <div className="shopcategory">

      <div className="categoryScroll">

        {categories.map((item,index)=>(
          <div className="categoryCard" key={index}>

            <img src={item.img} alt={item.name} />

            <h3>{item.name}</h3>

          </div>
        ))}

      </div>

    </div>

  )

}