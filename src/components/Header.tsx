'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  const { siteSettings, loading } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 bg-starrs-mint/95 backdrop-blur-md border-b border-starrs-teal/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button 
            onClick={onMenuClick}
            className="flex items-center space-x-2 md:space-x-3 text-starrs-teal-dark hover:text-starrs-teal-darker active:opacity-80 transition-colors duration-200 touch-manipulation"
          >
            {loading ? (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-starrs-teal-light rounded-full animate-pulse" />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-starrs-teal-light rounded-full flex items-center justify-center ring-2 ring-starrs-teal/50 flex-shrink-0">
                <img 
                  src={siteSettings?.site_logo || "/logo.jpg"} 
                  alt={siteSettings?.site_name || "Starr's Famous Shakes"}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.jpg";
                  }}
                />
              </div>
            )}
            <div className="flex flex-col items-start">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-starrs-teal-dark leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {loading ? (
                  <div className="w-24 md:w-32 h-5 md:h-6 bg-starrs-teal-light rounded animate-pulse" />
                ) : (
                  "starr's"
                )}
              </h1>
              <p className="text-xs md:text-sm font-medium text-starrs-teal/80 -mt-0.5 md:-mt-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                famous shakes
              </p>
            </div>
          </button>

          <div className="flex items-center space-x-1 md:space-x-2">
            <button 
              onClick={onCartClick}
              className="relative p-2 md:p-3 text-starrs-teal-dark hover:text-starrs-teal-darker hover:bg-starrs-teal-light active:bg-starrs-teal-light rounded-full transition-all duration-200 touch-manipulation"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-starrs-green text-white text-[10px] md:text-xs rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center animate-bounce-gentle font-semibold shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
