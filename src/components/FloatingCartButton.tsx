'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onCartClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onCartClick }) => {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onCartClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-starrs-teal to-starrs-teal-dark text-white p-4 rounded-full shadow-lg hover:from-starrs-teal-dark hover:to-starrs-teal-darker transition-all duration-200 transform hover:scale-110 z-40 md:hidden"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-starrs-green text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md">
          {itemCount}
        </span>
      </div>
    </button>
  );
};

export default FloatingCartButton;
