import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductCardCarousel = ({ images, title = 'Product Image' }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback to a blank image if no images exist
  const finalImages = Array.isArray(images) && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp'];

  const hasMultiple = finalImages.length > 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? finalImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === finalImages.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setActiveIndex(index);
  };

  return (
    <div className="w-full h-full relative group/carousel flex items-center justify-center">
      {/* Product Image */}
      <img
        src={finalImages[activeIndex]}
        alt={`${title} - view ${activeIndex + 1}`}
        className="max-w-full max-h-full object-contain transition-all duration-500 select-none group-hover:scale-105"
      />

      {/* Navigation Chevrons — Visible on hover */}
      {hasMultiple && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 w-8 h-8 rounded-full bg-white/95 border border-[#DEE2E7] flex items-center justify-center text-[#505050] hover:bg-[#0D6EFD] hover:text-white transition-all shadow-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 w-8 h-8 rounded-full bg-white/95 border border-[#DEE2E7] flex items-center justify-center text-[#505050] hover:bg-[#0D6EFD] hover:text-white transition-all shadow-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 z-10"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {finalImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => handleDotClick(e, index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'bg-[#0D6EFD] w-3'
                  : 'bg-[#DEE2E7] hover:bg-[#8B96A5]'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCardCarousel;
