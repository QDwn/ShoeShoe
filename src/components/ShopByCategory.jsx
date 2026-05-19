export default function ShopByCategory(){

  const categories = [
    {name:"All Start NBA 2026", img:"all star nba 2026.jpg"},
    {name:"Basketball Shoes", img:"/jordan.jpg"},
    {name:"Ball Basketball", img:"/ball.jpg"},
    {name:"Socks", img:"/bg socks.jpg"},
    {name:"Jersey", img:"/jersey allstar 2026.jpg"},
    {name:"Training Shirt", img:"/teeshirt allstar 2026.jpg"}
  ]

  return(

    <div className="shopcategory">

      <div className="categoryScroll">

        {categories.map((item,index)=>(
          <div className="categoryCard" key={index}>

            <img src={item.img}/>

            <h3>{item.name}</h3>

          </div>
        ))}

      </div>

    </div>

  )

}