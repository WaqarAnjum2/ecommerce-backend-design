import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bannerImg from '../assets/Image/backgrounds/Banner-board-800x420 2.png';
import promo1 from '../assets/Image/backgrounds/Group 969.png';
import promo2 from '../assets/Image/backgrounds/Group 982.png';

const Hero = ({ setPage, onAuthRequired, onCategoryClick }) => {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState([
    { name: 'Automobiles', slug: 'automobiles' },
    { name: 'Clothes and wear', slug: 'clothes' },
    { name: 'Home interiors', slug: 'home-outdoor' },
    { name: 'Computer and tech', slug: 'electronics' },
    { name: 'Tools, equipments', slug: 'tools' },
    { name: 'Sports and outdoor', slug: 'sports' },
    { name: 'Animal and pets', slug: 'animals' },
    { name: 'Machinery tools', slug: 'machinery' },
    { name: 'More category', slug: 'more' },
  ]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setCategoriesLoading(true);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setCategoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-white border border-[color:var(--site-border)] rounded-2xl mt-6 overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col lg:flex-row p-4 gap-4 lg:h-[400px]">
        {/* Left Categories */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <ul className="space-y-1">
            {categoriesLoading && (
              <li className="px-4 py-2 text-sm text-secondary">Loading categories...</li>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <li className="px-4 py-2 text-sm text-secondary">No categories available</li>
            )}
            {!categoriesLoading && categories.map((cat, index) => (
              <li
                key={cat.id || cat.slug || cat.name}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                  index === 0
                    ? 'bg-[#EAF2FF] font-semibold text-[#1A73E8]'
                    : 'text-dark-light hover:bg-[#F3F6FF] hover:text-[#1A73E8] font-medium'
                }`}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Banner */}
        <div 
          className="flex-1 relative rounded-2xl p-10 flex flex-col justify-center bg-cover bg-no-repeat bg-center min-h-[250px] lg:min-h-0"
          style={{ backgroundImage: `url("${bannerImg}")` }}
        >
          <div className="relative z-10 w-full sm:w-2/3 md:w-1/2">
            <h3 className="text-2xl font-normal text-dark mb-1">Latest trending</h3>
            <h2 className="text-[32px] font-bold text-dark leading-tight mb-6">Electronic items</h2>
            <button 
              onClick={() => onCategoryClick && onCategoryClick('electronics')}
              className="bg-white text-dark px-6 py-2 rounded-full font-semibold hover:bg-[#F3F6FF] transition-colors shadow-sm text-sm"
            >
              Learn more
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-60 flex flex-row lg:flex-col gap-3">
          {/* Welcome Box */}
          <div className="bg-[#EAF2FF] p-4 rounded-2xl flex-1 lg:flex-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#8B96A5] shrink-0 shadow-sm">
                <User className="w-6 h-6 text-[#1A73E8]" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-dark text-sm truncate font-medium">
                  Hi, {profile ? (profile.fullName || 'user') : 'user'}
                </p>
                <p className="text-dark-light text-xs">let's get started</p>
              </div>
            </div>

            {user ? (
              <div className="space-y-2">
                <button 
                  onClick={() => setPage('profile')}
                  className="w-full bg-[#1A73E8] hover:bg-[#1666D1] text-white py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
                >
                  My Profile
                </button>
                <button 
                  onClick={() => setPage('orders')}
                  className="w-full bg-white text-[#1A73E8] py-2 rounded-full text-sm font-semibold border border-[color:var(--site-border)] hover:bg-[#F3F6FF] transition-colors"
                >
                  My Orders
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={onAuthRequired}
                  className="w-full bg-[#1A73E8] hover:bg-[#1666D1] text-white py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
                >
                  Join now
                </button>
                <button 
                  onClick={onAuthRequired}
                  className="w-full bg-white text-[#1A73E8] py-2 rounded-full text-sm font-semibold border border-[color:var(--site-border)] hover:bg-[#F3F6FF] transition-colors"
                >
                  Log in
                </button>
              </div>
            )}
          </div>

          {/* Promo 1 */}
          <div 
            onClick={() => onCategoryClick && onCategoryClick('clothes')}
            className="bg-orange p-3 rounded-2xl flex-1 text-white bg-cover bg-no-repeat bg-center cursor-pointer hover:opacity-95 transition-all shadow-sm hidden sm:flex items-end min-h-[90px]"
            style={{ backgroundImage: `url("${promo1}")` }}
          >
            <p className="text-xs font-semibold leading-tight w-2/3">Get US $10 off with a new supplier</p>
          </div>

          {/* Promo 2 */}
          <div 
            onClick={() => onCategoryClick && onCategoryClick('electronics')}
            className="bg-teal p-3 rounded-2xl flex-1 text-white bg-cover bg-no-repeat bg-center cursor-pointer hover:opacity-95 transition-all shadow-sm hidden sm:flex items-end min-h-[90px]"
            style={{ backgroundImage: `url("${promo2}")` }}
          >
            <p className="text-xs font-semibold leading-tight w-2/3">Send quotes with supplier preferences</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
