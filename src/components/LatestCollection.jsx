export default function LatestCollection() {
    const collection = [
        {name:"Nike JA 1", price:"2.500.000", img:"/ja1 trivia.jpg"},
        {name:"Nike JA 2", price:"2.600.000", img:"/ja2 sonic.jpg"},
        {name:"Jersey All-Star Giannis", price:"3.200.000", img:"/jersey allstar Giannis.jpg"},
        {name:"Tee Shirt All-Star 2026", price:"3.200.000", img:"/teeshirt allstar.jpg"},
        {name:"Puma Lamelo Ball pink", price:"2.800.000", img:"/lamelo pink.jpg"},
        {name:"Nike KD 17", price:"3.500.000", img:"/kd 17.jpg"},
        {name:"Adidas Trae Young", price:"2.900.000", img:"/trae young 3.0.jpg"},
        {name:"Nike Sabrina 1 Grounded", price:"3.100.000", img:"/sabrina1 grounded.jpg"},
        {name:"Nike Sabrina 2 Pink", price:"3.100.000", img:"/sabrina2 pink.jpg"}
    ]

    return (
        <div className="collection">

        <div className="collectionScroll">

            {collection.map((item,index)=>(
            <div className="productCard" key={index}>
                <img src={item.img}/>
                <h3>{item.name}</h3>
                <p>{item.price}</p>
            </div>
            ))}

        </div>

        </div>

    )
}