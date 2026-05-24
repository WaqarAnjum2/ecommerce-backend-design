import React, { useState, useEffect } from 'react';

const RecommendedItems = ({ setPage, onProductClick }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=10&sort=rating')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.products || []);
      })
      .catch((err) => console.error('Failed to load recommended items:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-8">
      <h3 className="text-2xl font-bold mb-6 text-[#1C1C1C]">Recommended items</h3>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No recommendations available</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {items.map((product) => {
            const price = parseFloat(product.price) || 0;
            return (
              <div
                key={product.id}
                onClick={() => onProductClick(product.id)}
                className="bg-white border border-[#DEE2E7] rounded-lg p-4 flex flex-col hover:shadow-[0px_10px_25px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-300 cursor-pointer group h-full shadow-sm"
              >
                <div className="flex-1 flex items-center justify-center p-4 mb-3 bg-[#F7F7F7] rounded-md overflow-hidden aspect-square">
                  <img
                    src={product.image || 'https://via.placeholder.com/150'}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="mt-auto pt-2">
                  <p className="font-semibold text-[#1C1C1C] text-lg mb-1">
                    ${price.toFixed(2)}
                  </p>
                  <p className="text-[#8B96A5] text-sm overflow-hidden text-ellipsis line-clamp-2 leading-snug">
                    {product.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecommendedItems;
