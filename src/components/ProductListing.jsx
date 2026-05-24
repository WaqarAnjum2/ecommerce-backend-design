import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Grid, List, ChevronDown, Star, Heart, X } from 'lucide-react';
import ProductCardCarousel from './ProductCardCarousel';
import { getFavorites, toggleFavorite } from '../lib/favorites';

const ProductListing = ({ setPage, onProductClick, searchQuery, setSearchQuery }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [page, setPageNum] = useState(1);
  const [activeFilters, setActiveFilters] = useState([]);
  const [favorites, setFavorites] = useState(() => getFavorites());

  const brandOptions = ["Samsung", "Apple", "Huawei", "Pocco", "Lenovo", "Canon", "GoPro"];

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const normalizeNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // Build query and fetch products
  const fetchProducts = useCallback((overridePage) => {
    setLoading(true);
    const params = new URLSearchParams();
    const currentPage = overridePage ?? page;
    params.set('page', String(currentPage));
    params.set('limit', '10');

    const ratingValues = selectedRatings.map((r) => Number(r)).filter(Number.isFinite);
    const ratingFilter = ratingValues.length ? Math.min(...ratingValues) : null;

    let parsedMin = normalizeNumber(minPrice);
    let parsedMax = normalizeNumber(maxPrice);
    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      [parsedMin, parsedMax] = [parsedMax, parsedMin];
    }

    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedBrands.length) params.set('brand', selectedBrands.join(','));
    if (parsedMin !== null) params.set('minPrice', String(parsedMin));
    if (parsedMax !== null) params.set('maxPrice', String(parsedMax));
    if (ratingFilter !== null) params.set('rating', String(ratingFilter));
    if (sortBy) params.set('sort', sortBy);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      })
      .catch((err) => console.error('Failed to fetch products:', err))
      .finally(() => setLoading(false));
  }, [page, selectedCategory, searchQuery, selectedBrands, minPrice, maxPrice, selectedRatings, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleStorage = () => setFavorites(getFavorites());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Update active filter tags
  useEffect(() => {
    const filters = [];
    if (searchQuery) filters.push(`Search: "${searchQuery}"`);
    selectedBrands.forEach((b) => filters.push(b));
    selectedRatings.forEach((r) => filters.push(`${r} star`));
    if (minPrice || maxPrice) filters.push(`$${minPrice || '0'} - $${maxPrice || '∞'}`);
    setActiveFilters(filters);
  }, [searchQuery, selectedBrands, selectedRatings, minPrice, maxPrice]);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPageNum(1);
  };

  const toggleRating = (rating) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
    setPageNum(1);
  };

  const removeFilter = (filterToRemove) => {
    if (filterToRemove.startsWith('Search: "')) {
      setSearchQuery('');
    } else if (filterToRemove.endsWith(' star')) {
      const starVal = parseInt(filterToRemove.split(' ')[0]);
      setSelectedRatings(prev => prev.filter(r => r !== starVal));
    } else if (filterToRemove.includes(' - ')) {
      setMinPrice('');
      setMaxPrice('');
    } else {
      setSelectedBrands(prev => prev.filter(b => b !== filterToRemove));
    }
    setPageNum(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedRatings([]);
    setSortBy('');
    setPageNum(1);
  };

  const handleApplyPrice = () => {
    const nextPage = 1;
    setPageNum(nextPage);
    fetchProducts(nextPage);
  };

  return (
    <div className="container py-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[#8B96A5] text-sm mb-6">
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setPage('home')}>Home</span>
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-primary transition-colors">Clothings</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#1C1C1C] font-normal">All Products</span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className="w-[240px] flex-shrink-0 space-y-2 bg-white border border-[color:var(--site-border)] rounded-2xl p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          {/* Category */}
          <div className="border-t border-[color:var(--site-border)] py-3">
            <h4 className="font-bold text-[#1C1C1C] mb-3 flex justify-between items-center cursor-pointer">
              Category <ChevronDown className="w-4 h-4 opacity-50" />
            </h4>
            <ul className="space-y-3 text-[#505050] text-sm">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className={`hover:text-primary cursor-pointer ${selectedCategory === cat.slug ? 'text-primary font-medium' : ''}`}
                  onClick={() => { setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug); setPageNum(1); }}
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div className="border-t border-[color:var(--site-border)] py-3">
            <h4 className="font-bold text-[#1C1C1C] mb-3 flex justify-between items-center cursor-pointer">
              Brands <ChevronDown className="w-4 h-4 opacity-50" />
            </h4>
            <div className="space-y-2">
              {brandOptions.map(brand => (
                <label key={brand} className="flex items-center gap-3 text-[#1C1C1C] text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-[color:var(--site-border)] text-[#1A73E8] focus:ring-[#1A73E8]"
                  />
                  <span className="group-hover:text-primary transition-colors">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-[#DEE2E7] py-3">
            <h4 className="font-bold text-[#1C1C1C] mb-3 flex justify-between items-center cursor-pointer">
              Price range <ChevronDown className="w-4 h-4 opacity-50" />
            </h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[#1C1C1C] text-xs mb-1">Min</p>
                  <input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-[color:var(--site-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1A73E8]" />
                </div>
                <div className="flex-1">
                  <p className="text-[#1C1C1C] text-xs mb-1">Max</p>
                  <input type="number" placeholder="999999" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-[color:var(--site-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1A73E8]" />
                </div>
              </div>
              <button onClick={handleApplyPrice} className="w-full bg-[#1A73E8] border border-[#1A73E8] text-white py-2 rounded-full text-sm font-medium hover:bg-[#1666D1] transition-colors shadow-sm">
                Apply
              </button>
            </div>
          </div>

          {/* Ratings */}
          <div className="border-t border-[color:var(--site-border)] py-3 pb-4">
            <h4 className="font-bold text-[#1C1C1C] mb-3 flex justify-between items-center cursor-pointer">
              Ratings <ChevronDown className="w-4 h-4 opacity-50" />
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2].map((stars) => (
                <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedRatings.includes(stars)}
                    onChange={() => toggleRating(stars)}
                    className="w-4 h-4 rounded border-[color:var(--site-border)] text-[#1A73E8] focus:ring-[#1A73E8]"
                  />
                  <div className="flex gap-0.5">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={14} className={i < stars ? "fill-[#FF9017] text-[#FF9017]" : "text-[#D1D3D3]"} />
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Top Bar */}
          <div className="bg-white border border-[color:var(--site-border)] rounded-2xl p-4 flex items-center justify-between mb-4 shadow-sm">
            <span className="text-[#1C1C1C] text-sm">
              {pagination.total.toLocaleString()} items
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-[color:var(--site-border)] rounded-full px-3 py-1 bg-white">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPageNum(1); }}
                  className="text-sm outline-none bg-transparent cursor-pointer"
                >
                  <option value="">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="orders_desc">Most Popular</option>
                </select>
              </div>
              <div className="flex border border-[color:var(--site-border)] rounded-full overflow-hidden">
                <div className={`p-2 border-r border-[color:var(--site-border)] cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-[#EFF2F4]' : 'hover:bg-[#F3F6FF]'}`} onClick={() => setViewMode('grid')}>
                  <Grid size={18} className="text-[#1C1C1C]" />
                </div>
                <div className={`p-2 cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-[#EFF2F4]' : 'hover:bg-[#F3F6FF]'}`} onClick={() => setViewMode('list')}>
                  <List size={18} className="text-[#1C1C1C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilters.map((filter, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 border border-[color:var(--site-border)] rounded-full bg-white text-dark text-sm">
                  <span>{filter}</span>
                  <X size={14} className="text-[#8B96A5] cursor-pointer hover:text-dark" onClick={() => removeFilter(filter)} />
                </div>
              ))}
              <button className="text-primary text-sm font-normal hover:underline ml-2" onClick={clearAllFilters}>
                Clear all filter
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-[#8B96A5]">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'list' ? (
            /* Product List View */
            <div className="space-y-3">
              {products.map((product) => {
                const isFav = favorites.some((item) => item.id === product.id);
                return (
                <div key={product.id} className="bg-white border border-[#DEE2E7] rounded-lg p-5 flex gap-6 hover:shadow-md transition-shadow group cursor-pointer relative" onClick={() => onProductClick(product.id)}>
                  <div className="w-[210px] h-[210px] lg:w-[240px] lg:h-[240px] flex-shrink-0 flex items-center justify-center bg-[#F7F7F7] rounded-lg p-6 relative overflow-hidden">
                    <ProductCardCarousel images={product.imageUrls?.length > 0 ? product.imageUrls : [product.image]} title={product.title} />
                  </div>
                  <button
                    className={`absolute right-5 top-5 w-10 h-10 border rounded-md flex items-center justify-center transition-all shadow-sm ${
                      isFav
                        ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                        : 'border-[#DEE2E7] text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = toggleFavorite(product);
                      setFavorites(next);
                    }}
                    aria-pressed={isFav}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} className={isFav ? 'fill-current' : ''} />
                  </button>
                  <div className="flex-1 py-1">
                    <h3 className="text-[#1C1C1C] text-base font-semibold group-hover:text-primary transition-colors mb-3">{product.title}</h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-[#1C1C1C]">${product.price}</span>
                        {product.oldPrice && <span className="text-[#8B96A5] line-through text-sm mt-0.5">${product.oldPrice}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={14} className={i < Math.round(parseFloat(product.rating)) ? "fill-[#FF9017] text-[#FF9017]" : "text-[#D1D3D3]"} />
                        ))}
                      </div>
                      <span className="text-[#FF9017] text-sm font-medium">{product.rating}</span>
                      <span className="text-[#8B96A5] text-sm ml-2">• {product.orders} orders</span>
                      <span className="text-[#00B517] text-sm font-medium ml-2">• {product.shipping}</span>
                    </div>
                    <p className="text-[#505050] text-sm leading-relaxed mb-4 line-clamp-2 max-w-2xl">{product.desc}</p>
                    <button className="text-primary font-bold text-sm bg-transparent border-none p-0 hover:underline">View details</button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            /* Product Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const isFav = favorites.some((item) => item.id === product.id);
                return (
                <div key={product.id} className="bg-white border border-[#DEE2E7] rounded-lg p-4 hover:shadow-[0px_8px_25px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center cursor-pointer" onClick={() => onProductClick(product.id)}>
                  <div className="w-full aspect-square flex items-center justify-center mb-4 bg-[#F7F7F7] rounded-md p-6 overflow-hidden">
                    <ProductCardCarousel images={product.imageUrls?.length > 0 ? product.imageUrls : [product.image]} title={product.title} />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#1C1C1C]">${product.price}</span>
                          <button
                            className={`w-8 h-8 border rounded-md flex items-center justify-center transition-all shadow-sm ${
                              isFav
                                ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                                : 'border-[#DEE2E7] text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = toggleFavorite(product);
                              setFavorites(next);
                            }}
                            aria-pressed={isFav}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart size={16} className={isFav ? 'fill-current' : ''} />
                          </button>
                        </div>
                        {product.oldPrice && <span className="text-[#8B96A5] line-through text-xs">${product.oldPrice}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={12} className={i < Math.round(parseFloat(product.rating)) ? "fill-[#FF9017] text-[#FF9017]" : "text-[#D1D3D3]"} />
                        ))}
                      </div>
                      <span className="text-[#FF9017] text-xs font-medium">{product.rating}</span>
                    </div>
                    <h3 className="text-[#505050] text-[13px] leading-[1.4] line-clamp-2 hover:text-primary transition-colors">{product.title}</h3>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-end mt-8">
              <div className="flex items-center gap-3">
                <div className="flex border border-[#DEE2E7] rounded-md overflow-hidden bg-white">
                  <div
                    className={`px-3 py-2 border-r border-[#DEE2E7] cursor-pointer text-dark flex items-center ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-shade'}`}
                    onClick={() => page > 1 && setPageNum(page - 1)}
                  >{"<"}</div>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <div
                      key={p}
                      className={`px-4 py-2 border-r border-[#DEE2E7] cursor-pointer text-dark text-sm transition-colors ${page === p ? 'bg-[#EFF2F4] font-bold' : 'hover:bg-shade'}`}
                      onClick={() => setPageNum(p)}
                    >{p}</div>
                  ))}
                  <div
                    className={`px-3 py-2 cursor-pointer text-dark flex items-center ${page >= pagination.totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-shade'}`}
                    onClick={() => page < pagination.totalPages && setPageNum(page + 1)}
                  >{">"}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
