import React, { useState, useEffect } from 'react';
import { Star, Heart, MessageSquare, ShoppingBag, ShieldCheck, Globe, ChevronRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { isFavorite as isFavoriteProduct, toggleFavorite } from '../lib/favorites';

const ProductDetails = ({ setPage, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProduct(data);
        setFavorite(isFavoriteProduct(data.id));
      })
      .catch((err) => console.error('Failed to load product:', err))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product);
    setFavorite(isFavoriteProduct(product.id));
  };

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center text-[#8B96A5]">
        <p className="text-lg">Product not found</p>
        <button className="text-primary mt-4 hover:underline" onClick={() => setPage('listing')}>Back to products</button>
      </div>
    );
  }

  const ratingNum = parseFloat(product.rating) || 0;
  const isInStock = product.stock > 0;

  return (
    <div className="container py-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[#8B96A5] text-sm mb-6">
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setPage('home')}>Home</span>
        <ChevronRight className="w-4 h-4" />
        {product.category && (
          <>
            <span className="cursor-pointer hover:text-primary transition-colors">{product.category.name}</span>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-[#1C1C1C] font-normal">{product.title}</span>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-[color:var(--site-border)] rounded-2xl p-5 lg:p-8 flex flex-col lg:flex-row gap-8 mb-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        {/* Gallery Section */}
        <div className="lg:w-[450px] flex-shrink-0">
          {(() => {
            const images = product.imageUrls?.length > 0 ? product.imageUrls : (product.image ? [product.image] : []);
            const currentImage = images[selectedThumb] || product.image;
            return (
              <>
                <div className="border border-[color:var(--site-border)] rounded-2xl p-8 mb-4 flex items-center justify-center bg-[#F7F7F7] aspect-square overflow-hidden group">
                  {currentImage && (
                    <img
                      src={currentImage}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedThumb(i)}
                        className={`w-14 h-14 border rounded-xl p-1 bg-white flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedThumb === i
                            ? 'border-primary ring-1 ring-primary'
                            : 'border-[color:var(--site-border)] hover:border-[#8B96A5]'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.title} thumbnail ${i + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Product Info Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isInStock ? (
              <>
                <Check size={20} className="text-[#00B517]" />
                <span className="text-sm font-medium text-[#00B517]">In stock ({product.stock})</span>
              </>
            ) : (
              <span className="text-sm font-medium text-[#FA3434]">Out of Stock</span>
            )}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1C1C1C] mb-4">{product.title}</h1>

          {/* Ratings & Orders */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[5, 4, 3, 2, 1].map((s, i) => (
                <Star key={i} size={16} className={i < Math.round(ratingNum) ? "fill-[#FF9017] text-[#FF9017]" : "text-[#D1D3D3]"} />
              ))}
              <span className="text-[#FF9017] text-sm ml-1">{ratingNum}</span>
            </div>
            <div className="flex items-center gap-1 text-[#8B96A5] text-sm">
              <ShoppingBag size={16} />
              <span>{product.orders} sold</span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="bg-[#FFF0DF] p-4 rounded-2xl flex flex-wrap gap-8 items-center mb-6">
            <div className="flex flex-col">
              <span className="text-xl lg:text-3xl font-bold text-[#FA3434]">${product.price}</span>
              {product.oldPrice && <span className="text-[#8B96A5] line-through text-sm">${product.oldPrice}</span>}
            </div>
          </div>

          {/* Product Meta Info */}
          <div className="space-y-4 mb-8">
            {product.brand && (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <span className="text-[#8B96A5]">Brand:</span>
                <span className="col-span-2 lg:col-span-3 text-[#505050]">{product.brand}</span>
              </div>
            )}
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 text-sm border-t border-[#DEE2E7] pt-4">
              <span className="text-[#8B96A5]">Shipping:</span>
              <span className="col-span-2 lg:col-span-3 text-[#505050]">{product.shipping}</span>
            </div>
          </div>

          <div className="h-[1px] bg-[color:var(--site-border)] mb-8"></div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              className={`flex-1 min-w-[150px] py-3 rounded-full font-bold transition-colors ${
                isInStock
                  ? 'bg-[#1A73E8] hover:bg-[#1666D1] text-white'
                  : 'bg-[#DEE2E7] text-[#8B96A5] cursor-not-allowed'
              }`}
              onClick={() => { if (isInStock) { handleAddToCart(); setPage('cart'); } }}
              disabled={!isInStock}
            >
              {isInStock ? 'Buy Now' : 'Out of Stock'}
            </button>
            <button
              className={`flex-1 min-w-[150px] py-3 rounded-full font-bold transition-colors ${
                addedToCart
                  ? 'bg-[#00B517] text-white'
                  : 'bg-[#EAF2FF] hover:bg-[#D7E7FF] text-[#1A73E8]'
              }`}
              onClick={handleAddToCart}
              disabled={!isInStock}
            >
              {addedToCart ? '✓ Added!' : 'Add to Cart'}
            </button>
            <button
              className={`w-12 h-12 flex items-center justify-center border rounded-full transition-colors ${
                favorite
                  ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                  : 'border-[color:var(--site-border)] text-[#1A73E8] hover:bg-[#F3F6FF]'
              }`}
              onClick={handleToggleFavorite}
              aria-pressed={favorite}
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={20} className={favorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Sidebar / Seller Info */}
        <div className="lg:w-[280px] space-y-4">
          <div className="bg-white border border-[color:var(--site-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] flex items-center justify-center text-[#1A73E8] font-bold text-xl uppercase">R</div>
              <div className="flex flex-col">
                <span className="text-[#1C1C1C] font-normal">Supplier</span>
                <span className="text-[#505050] text-sm">Guanjhou Trading Co.</span>
              </div>
            </div>
            <div className="h-[1px] bg-[color:var(--site-border)] mb-4"></div>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-sm text-[#8B96A5]">
                <ShieldCheck size={18} />
                <span>Verified Seller</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#8B96A5]">
                <Globe size={18} />
                <span>Worldwide shipping</span>
              </div>
            </div>
            <button
              className="w-full bg-[#1A73E8] text-white py-2 rounded-full text-sm font-medium hover:bg-[#1666D1] transition-colors"
              onClick={() => setPage && setPage('home')}
            >
              Send inquiry
            </button>
          </div>
        </div>
      </div>

      {/* Description Tabs */}
      <div className="bg-white border border-[color:var(--site-border)] rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="flex border-b border-[color:var(--site-border)] bg-white overflow-x-auto no-scrollbar">
          {['Description', 'Reviews', 'Shipping'].map((tab, i) => (
            <button key={tab} className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${i === 0 ? 'text-primary border-primary' : 'text-[#8B96A5] border-transparent hover:text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-[#505050] text-sm lg:text-base leading-relaxed mb-6">
            {product.desc || 'No description available.'}
          </p>
          {product.features && product.features.length > 0 && (
            <div className="space-y-3">
              {product.features.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[#505050] text-sm">
                  <Check size={16} className="text-[#8B96A5]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
