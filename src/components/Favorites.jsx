import React, { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { getFavorites, toggleFavorite } from '../lib/favorites';

const Favorites = ({ setPage, onProductClick }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getFavorites());
  }, []);

  const handleRemove = (product) => {
    const next = toggleFavorite(product);
    setItems(next);
  };

  if (!items || items.length === 0) {
    return (
      <div className="container py-12 text-center">
        <Heart className="mx-auto text-red-500" size={48} />
        <h2 className="mt-4 text-xl font-semibold">No favorites yet</h2>
        <p className="text-sm text-gray-500 mt-2">Add products to your favorites to see them here.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold mb-6">My Favorites</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="border rounded-xl p-4 flex flex-col">
            <div className="h-40 bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
              {p.image ? <img src={p.image} alt={p.title} className="max-h-full max-w-full object-contain" /> : (
                <div className="text-sm text-gray-400">No image</div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[15px] mb-1 truncate">{p.title}</h3>
              <div className="text-sm text-gray-600 mb-3">{p.brand || ''}</div>
              <div className="font-bold mb-3">${p.price}</div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onProductClick && onProductClick(p.id)}
                className="flex-1 rounded-md bg-primary text-white py-2 text-sm"
              >
                View
              </button>
              <button
                onClick={() => handleRemove(p)}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm text-red-600 flex items-center gap-2"
                title="Remove favorite"
              >
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
