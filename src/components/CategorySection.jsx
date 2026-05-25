import React from 'react';
import placeholderImage from '../assets/placeholder.svg';

const CategorySection = ({ title, bannerImg, items, bannerBg, setPage, onProductClick, categorySlug, setSearchQuery }) => {
  const handleBannerClick = () => {
    if (setSearchQuery) {
      setSearchQuery(categorySlug || '');
    }
    setPage('listing');
  };

  return (
    <section className="bg-white border border-[color:var(--site-border)] rounded-2xl mt-6 flex flex-col lg:flex-row overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      {/* Banner */}
      <div
        className="w-full lg:w-72 p-6 flex flex-col justify-between relative overflow-hidden bg-cover bg-no-repeat bg-center min-h-[160px] lg:min-h-0"
        style={{ backgroundColor: bannerBg || '#F7F7F7', backgroundImage: `url("${bannerImg}")` }}
      >
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-dark w-40 leading-tight mb-4">{title}</h3>
        </div>
        <div className="relative z-10">
          <button 
            onClick={handleBannerClick}
            className="bg-white text-dark px-4 py-2 rounded-full font-semibold text-sm hover:bg-[#F3F6FF] transition-colors shadow-sm"
          >
            Source now
          </button>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            onClick={() => onProductClick && item.id && onProductClick(item.id)}
            className="p-5 border-r border-b last:border-r-0 border-[color:var(--site-border)] flex justify-between cursor-pointer hover:bg-white hover:shadow-[0px_6px_24px_rgba(15,23,42,0.08)] transition-all duration-300 group h-[130px] relative hover:z-10"
          >
            <div className="flex flex-col min-w-0 mr-2 justify-between py-1">
              <span className="text-[#1C1C1C] text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {item.name}
              </span>
              <span className="text-[#8B96A5] text-xs font-medium">
                From USD {parseFloat(item.price).toFixed(2)}
              </span>
            </div>
            <div className="w-[82px] h-[82px] shrink-0 self-end -mr-1 -mb-1">
              <img 
                src={item.image || placeholderImage} 
                alt={item.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
