'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../../src/components/Navbar';

export default function ProductSizesAdmin() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [newSize, setNewSize] = useState('');
  const [newStock, setNewStock] = useState(0);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=200');
      const body = await res.json();
      setProducts(body.products || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSizes(pid) {
    if (!pid) return setSizes([]);
    try {
      const res = await fetch(`/api/products/${pid}/sizes`);
      const body = await res.json();
      setSizes(body.sizes || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { fetchSizes(productId); }, [productId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!productId || !newSize) return;
    try {
      const res = await fetch('/api/product-sizes', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ product_id: productId, size: newSize, stock: Number(newStock) })
      });
      if (res.ok) {
        setNewSize(''); setNewStock(0);
        fetchSizes(productId);
      }
    } catch (err) { console.error(err); }
  }

  async function handleUpdate(id, stock) {
    try {
      const res = await fetch(`/api/product-sizes/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ stock }) });
      if (res.ok) fetchSizes(productId);
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this size?')) return;
    try {
      const res = await fetch(`/api/product-sizes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSizes(productId);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="admin-page site-container">
      <Navbar />
      <h1>Product Sizes Admin</h1>
      <div style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <label>Select product</label>
          <select style={{width:'100%',padding:8}} value={productId||''} onChange={(e)=>setProductId(e.target.value||null)}>
            <option value="">--Choose product--</option>
            {products.map(p=> <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
          </select>

          {productId && (
            <div style={{marginTop:20}}>
              <h3>Sizes for product #{productId}</h3>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr><th style={{textAlign:'left'}}>Size</th><th>Stock</th><th></th></tr>
                </thead>
                <tbody>
                  {sizes.map(s => (
                    <tr key={s.id}>
                      <td>{s.size}</td>
                      <td>
                        <input type="number" defaultValue={s.stock} style={{width:80}} onBlur={(e)=>handleUpdate(s.id, Number(e.target.value)||0)} />
                      </td>
                      <td><button onClick={()=>handleDelete(s.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <form onSubmit={handleAdd} style={{marginTop:16}}>
                <input placeholder="Size (e.g. 40 or M)" value={newSize} onChange={(e)=>setNewSize(e.target.value)} />
                <input type="number" value={newStock} onChange={(e)=>setNewStock(e.target.value)} style={{width:100,marginLeft:8}} />
                <button style={{marginLeft:8}}>Add / Update</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
