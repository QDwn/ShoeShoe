"use client"
import { useState, useEffect } from "react"
import Navbar from "../src/components/Navbar"
import FeaturedProducts from "../src/components/FeaturedProducts"
import LatestCollection from "../src/components/LatestCollection"
import ShopByCategory from "../src/components/ShopByCategory"

export default function HomeImage(){

  const images = ["/img nba all star 2026.jpg","/ja2.jpg"]

  const [index,setIndex] = useState(0)
  const [progress,setProgress] = useState(0)
  const [playing,setPlaying] = useState(true)

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
      setProgress(prev => prev + 1)
    },60)

    return ()=> clearInterval(timer)

  },[playing])

  // khi vòng tròn đầy → đổi ảnh
  useEffect(()=>{

    if(progress >= 100){
      setIndex(i => (i + 1) % images.length)
      setProgress(0)
    }

  },[progress])

  return(

    <div>

      <Navbar/>

      <div className="khung">

        <img className="imghome" src={images[index]} />

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
        <h1 >Featured Products</h1>
        <FeaturedProducts />
      </div>
      
      <div className="collection">
        <h1>The latest collection</h1>
        <LatestCollection />
      </div>

       <div className="Shopbycategory">
        <h1>Shop by Basketball</h1>
        <ShopByCategory />
      </div>
    </div>

  )

}