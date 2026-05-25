import React, { useState, useEffect } from 'react';
import placeholderImage from '../assets/placeholder.svg';

const Deals = ({ setPage, onProductClick }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=5&sort=price_asc')
      .then((r) => r.json())
      .then((data) => {
        setDeals(data.products || []);
      })
      .catch((err) => console.error('Failed to load deals:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white border border-[color:var(--site-border)] rounded-2xl mt-6 flex flex-col md:flex-row overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      {/* Timer Section */}
      <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-r border-[color:var(--site-border)] flex flex-col justify-center bg-gray-50/50">
        <h3 className="text-xl font-bold text-dark mb-1">Deals and offers</h3>
        <p className="text-secondary mb-4 font-normal">Limited time discounts</p>
        <div className="flex gap-2">
          {['04', '13', '34', '56'].map((time, i) => (
            <div key={i} className="w-12 h-12 bg-[#313946] rounded-xl flex flex-col items-center justify-center text-white">
              <span className="text-sm font-bold">{time}</span>
              <span className="text-[10px] opacity-70">
                {i === 0 ? 'Days' : i === 1 ? 'Hour' : i === 2 ? 'Min' : 'Sec'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">No deals active</div>
        ) : (
          deals.map((product) => {
            // Calculate a dummy discount percentage
            const price = parseFloat(product.price) || 0;
            const oldPrice = parseFloat(product.oldPrice) || price * 1.25;
            const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
            const discountPct = pct > 0 ? `-${pct}%` : '-15%';

            return (
              <div
                key={product.id}
                className="p-6 flex flex-col items-center justify-center text-center border-r border-b lg:border-b-0 last:border-r-0 border-[color:var(--site-border)] cursor-pointer hover:shadow-[0px_8px_20px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 group"
                onClick={() => onProductClick(product.id)}
              >
                <div className="w-full aspect-square bg-[#F7F7F7] rounded-md flex items-center justify-center mb-4 overflow-hidden p-2">
                  <img
                    src={product.image || placeholderImage}
                    alt={product.title}
                    className="max-w-[90%] max-h-[90%] object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[#1C1C1C] text-sm mb-2 truncate w-full">{product.title}</p>
                <span className="bg-[#FFE3E3] text-[#EB001B] px-3 py-1 rounded-full text-xs font-bold">
                  {discountPct}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Deals;
