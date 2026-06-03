"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LatestCollection() {
    const [collection, setCollection] = useState([]);
    const { language } = useLanguage();

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const res = await fetch('/api/products?limit=9&offset=0');
                const data = await res.json();
                setCollection(Array.isArray(data.products) ? data.products : []);
            } catch (error) {
                console.error('Error loading latest collection:', error);
                setCollection([]);
            }
        };

        loadLatest();
    }, []);

    return (
        <div className="collection">
            <div className="collectionScroll">
                {collection.map((item) => (
                    <div className="productCard" key={item.id}>
                        <img src={item.image_url} alt={item.name} />
                        <h3>{item.name}</h3>
                        <p>{parseFloat(item.price).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}