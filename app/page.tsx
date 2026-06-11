"use client"
import { useState, useEffect } from "react"
import Navbar from "../src/components/Navbar"
import TrendRecommendationRow from "../src/components/TrendRecommendationRow"
import FeaturedProducts from "../src/components/FeaturedProducts"
import LatestCollection from "../src/components/LatestCollection"
import ShopByCategory from "../src/components/ShopByCategory"
import PreFooterStrip from "../src/components/PreFooterStrip"
import BasketballFooter from "../src/components/BasketballFooter"
import { useLanguage } from "../src/context/LanguageContext"
import { defaultHomeMedia, getHomeMedia, HOME_MEDIA_EVENT, fetchHomeMediaConfig } from "../src/lib/homeMedia"

export default function HomeImage(){
  const { t } = useLanguage()
  const [images, setImages] = useState(defaultHomeMedia.heroImages)
  const [index,setIndex] = useState(0)
  const [progress,setProgress] = useState(0)
  const [playing,setPlaying] = useState(true)

  useEffect(() => {
    setImages(getHomeMedia().heroImages)

    fetchHomeMediaConfig()
      .then((media) => {
        setImages(media.heroImages)
        setIndex((current) => (media.heroImages.length ? current % media.heroImages.length : 0))
      })
      .catch(() => {})

    const syncMedia = (event) => {
      const nextImages = event?.detail?.heroImages || getHomeMedia().heroImages
      setImages(nextImages)
      setIndex((current) => (nextImages.length ? current % nextImages.length : 0))
    }

    window.addEventListener(HOME_MEDIA_EVENT, syncMedia)
    window.addEventListener('storage', syncMedia)

    return () => {
      window.removeEventListener(HOME_MEDIA_EVENT, syncMedia)
      window.removeEventListener('storage', syncMedia)
    }
  }, [])

  const prevImage = () => {
    setIndex((index - 1 + images.length) % images.length)
    setProgress(0)
  }

  const nextImage = () => {
    setIndex((index + 1) % images.length)
    setProgress(0)
  }

  // vòng tròn chạy
  useEffect(()=>{

    if(!playing) return

    const timer = setInterval(()=>{
      setProgress(prev => {
        if (prev >= 99) {
          setIndex(i => (i + 1) % images.length)
          return 0
        }

        return prev + 1
      })
    },60)

    return ()=> clearInterval(timer)

  },[playing, images.length])

  return(

    <div>

      <Navbar/>

      <div className="khung">

        {images[index] ? (
          <img className="imghome" src={images[index]} alt="Home hero slide" />
        ) : (
          <div className="imghome hero-placeholder">No hero image</div>
        )}

        <button className="btnleft" onClick={prevImage}>{"<"}</button>
        <button className="btnright" onClick={nextImage}>{">"}</button>

        <button className="circleBtn" onClick={()=>setPlaying(!playing)}>

          <svg width="47" height="47">

            <circle
              cx="23.5"
              cy="23.5"
              r="20"
              stroke="#ddd"
              strokeWidth="3"
              fill="none"
            />

            <circle
              cx="23.5"
              cy="23.5"
              r="20"
              stroke="black" 
              strokeWidth="3"
              fill="none"
              strokeDasharray="126"
              strokeDashoffset={126 - (126*progress)/100}
              strokeLinecap="round"
              transform="rotate(-90 23.5 23.5)"
            />
            {playing ? (
              <>
                <rect x="18" y="16" width="4" height="15" fill="black"/>
                <rect x="25" y="16" width="4" height="15" fill="black"/>
              </>
            ) : (
              <polygon points="19,16 19,31 31,23.5" fill="black"/>
            )}
          </svg>
        </button>
      </div>
      
      <div className="Featured">
        <TrendRecommendationRow />
        <h1 >{t('home.featuredProducts')}</h1>
        <FeaturedProducts />
      </div>
      
      <div className="collection">
        <h1>{t('home.latestCollection')}</h1>
        <LatestCollection />
      </div>

       <div className="Shopbycategory">
        <h1>{t('home.shopByBasketball')}</h1>
        <ShopByCategory />
      </div>

      <PreFooterStrip />
      
      <BasketballFooter />
    </div>

  )

}
