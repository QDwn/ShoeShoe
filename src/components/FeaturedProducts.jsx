export default function FeaturedProducts(){

  const categories = [
    { name: "Tee Warm Up", sales: 1200, img: "/warmup.jpg" },
    { name: "Jerseys", sales: 900, img: "/jerseys.jpg" },
    { name: "Socks", sales: 700, img: "/socks.jpg" },
    { name: "Shoes", sales: 1500, img: "/sabrina2.jpg" }
  ]

  return(

    <div className="Featured">

      <div className="featuredGrid">

        {categories.map((item,index)=>(
          
          <div className="featuredItem" key={index}>

            <img src={item.img} />

            <div className="featuredContent">

              <h2>{item.name}</h2>

              <button>Shop Now</button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}