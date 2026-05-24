import React, { useEffect, useRef, useState } from 'react';
import { Search, User, Heart, ShoppingCart, Menu, ChevronDown, ShieldAlert, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Layout/Brand/logo-colored.png';
import flagDE from '../assets/Layout1/Image/flags/DE@2x.png';

const Header = ({ setPage, onAuthRequired, searchQuery, setSearchQuery }) => {
  const { items } = useCart();
  const { user, profile } = useAuth();
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isShipOpen, setIsShipOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const langRef = useRef(null);
  const shipRef = useRef(null);
  const helpRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage('listing');
  };

  const handleProfileClick = () => {
    if (user) {
      setPage('profile');
    } else {
      onAuthRequired();
    }
  };

  const handleOrdersClick = () => {
    if (user) {
      setPage('orders');
    } else {
      onAuthRequired();
    }
  };

  const toggleLangMenu = () => {
    setIsLangOpen((prev) => !prev);
    setIsShipOpen(false);
  };

  const toggleShipMenu = () => {
    setIsShipOpen((prev) => !prev);
    setIsLangOpen(false);
  };

  const toggleHelpMenu = () => {
    setIsHelpOpen((prev) => !prev);
    setIsLangOpen(false);
    setIsShipOpen(false);
  };

  const handleNavSearch = (query) => {
    setSearchQuery(query);
    setSearchInput(query);
    setPage('listing');
    setIsHelpOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (isLangOpen && langRef.current && !langRef.current.contains(target)) {
        setIsLangOpen(false);
      }
      if (isShipOpen && shipRef.current && !shipRef.current.contains(target)) {
        setIsShipOpen(false);
      }
      if (isHelpOpen && helpRef.current && !helpRef.current.contains(target)) {
        setIsHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen, isShipOpen, isHelpOpen]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white border-b border-[color:var(--site-border)] lg:sticky top-0 z-50 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {/* Top Header */}
      <div className="container py-5 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setSearchQuery(''); setSearchInput(''); setPage('home'); }}>
          <img src={logo} alt="Brand" className="h-[46px]" />
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl flex border border-[#1A73E8] rounded-xl overflow-hidden items-center bg-white shadow-sm focus-within:shadow-[0_6px_16px_rgba(26,115,232,0.18)]">
          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-grow px-4 py-2.5 outline-none text-sm text-dark placeholder-gray-400"
          />
          <div className="relative border-l border-shade-border h-full hidden md:flex items-center bg-white px-2">
            <select className="appearance-none bg-transparent pl-3 pr-8 py-2 outline-none text-sm text-dark cursor-pointer font-normal">
              <option>All category</option>
              <option>Automobiles</option>
              <option>Clothes and wear</option>
              <option>Home interiors</option>
              <option>Computer and tech</option>
              <option>Tools, equipments</option>
              <option>Sports and outdoor</option>
              <option>Animal and pets</option>
              <option>Machinery tools</option>
            </select>
            <ChevronDown className="w-4 h-4 text-secondary absolute right-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="bg-[#1A73E8] hover:bg-[#1666D1] text-white px-8 py-2.5 font-medium transition-colors text-sm shrink-0"
          >
            Search
          </button>
        </form>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Profile Action */}
          <div
            onClick={handleProfileClick}
            className="flex flex-col items-center cursor-pointer text-[#8B96A5] hover:text-[#1A73E8] transition-colors relative"
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs max-w-[80px] truncate text-center font-medium">
              {profile ? (profile.fullName || 'Profile') : 'Profile'}
            </span>
            {profile?.isAdmin && (
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5 border border-white" title="Admin Portal Active" />
            )}
          </div>

          {/* Message Action */}
          <div
            onClick={() => setPage('message')}
            className="flex flex-col items-center cursor-pointer text-[#8B96A5] hover:text-[#1A73E8] transition-colors"
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Message</span>
          </div>

          {/* Orders Action */}
          <div
            onClick={handleOrdersClick}
            className="flex flex-col items-center cursor-pointer text-[#8B96A5] hover:text-[#1A73E8] transition-colors"
          >
            <Heart className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Orders</span>
          </div>

          {/* Cart Action */}
          <div
            onClick={() => setPage('cart')}
            className="flex flex-col items-center cursor-pointer text-[#8B96A5] hover:text-[#1A73E8] transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">My cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white rounded-full text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Header Navigation */}
      <div className="border-t border-[color:var(--site-border)] bg-white overflow-x-auto lg:overflow-visible no-scrollbar">
        <div className="container py-3 flex items-center justify-between whitespace-nowrap gap-4">
          <nav className="flex items-center gap-6 font-medium text-dark">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleNavSearch('')}
            >
              <Menu className="w-5 h-5" />
              <span>All category</span>
            </button>
            <button type="button" className="hover:text-primary transition-colors" onClick={() => handleNavSearch('deals')}>Hot offers</button>
            <div className="relative" ref={helpRef}>
              <button
                type="button"
                onClick={toggleHelpMenu}
                aria-expanded={isHelpOpen}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
              >
                <span>Help</span>
                <ChevronDown className="w-4 h-4 text-secondary" />
              </button>
              {isHelpOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-[color:var(--site-border)] rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setPage('message'); setIsHelpOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-[#F3F6FF]"
                  >
                    Contact support
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavSearch('shipping')}
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-[#F3F6FF]"
                  >
                    Shipping info
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavSearch('returns')}
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-[#F3F6FF]"
                  >
                    Return policy
                  </button>
                </div>
              )}
            </div>
            {profile?.isAdmin && (
              <a href="#" className="hover:text-primary text-red-600 transition-colors flex items-center gap-1" onClick={(e) => { e.preventDefault(); setPage('admin'); }}>
                <ShieldAlert size={14} />
                Admin Portal
              </a>
            )}
          </nav>

          <div className="flex items-center gap-6 font-medium text-dark">
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={toggleLangMenu}
                aria-expanded={isLangOpen}
                className="flex items-center gap-1 cursor-pointer"
              >
                <span>English, USD</span>
                <ChevronDown className="w-4 h-4 text-secondary" />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-shade-border rounded-lg shadow-lg z-50 whitespace-normal">
                  <div className="px-4 py-3 text-sm text-dark font-semibold">Language & currency</div>
                  <div className="px-4 pb-3 text-xs text-secondary leading-relaxed break-words">
                    Coming soon. This feature is not available yet.
                  </div>
                  <div className="border-t border-shade-border px-4 py-2 text-xs text-secondary">English (USD)</div>
                  <div className="px-4 py-2 text-xs text-secondary">Urdu (PKR)</div>
                  <div className="px-4 py-2 text-xs text-secondary">French (EUR)</div>
                </div>
              )}
            </div>

            <div className="relative" ref={shipRef}>
              <button
                type="button"
                onClick={toggleShipMenu}
                aria-expanded={isShipOpen}
                className="flex items-center gap-1 cursor-pointer"
              >
                <span>Ship to</span>
                <img src={flagDE} alt="DE" className="w-5 h-3 rounded-sm shadow-sm" />
                <ChevronDown className="w-4 h-4 text-secondary" />
              </button>
              {isShipOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-shade-border rounded-lg shadow-lg z-50 whitespace-normal">
                  <div className="px-4 py-3 text-sm text-dark font-semibold">Ship to</div>
                  <div className="px-4 pb-3 text-xs text-secondary leading-relaxed break-words">
                    Coming soon. This feature is not available yet.
                  </div>
                  <div className="border-t border-shade-border px-4 py-2 text-xs text-secondary">Germany</div>
                  <div className="px-4 py-2 text-xs text-secondary">Pakistan</div>
                  <div className="px-4 py-2 text-xs text-secondary">France</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
