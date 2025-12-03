'use client';

import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  return (
    <div className="sticky top-20 z-40 bg-starrs-mint/95 backdrop-blur-md border-b border-starrs-teal/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 overflow-x-auto py-4 scrollbar-hide">
          {loading ? (
            <div className="flex space-x-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-9 w-24 bg-starrs-teal-light rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => onCategoryClick('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-starrs-teal text-white shadow-md'
                    : 'bg-white/80 text-starrs-teal-dark border border-starrs-teal/30 hover:bg-starrs-teal-light hover:border-starrs-teal'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === c.id
                      ? 'bg-starrs-teal text-white shadow-md'
                      : 'bg-white/80 text-starrs-teal-dark border border-starrs-teal/30 hover:bg-starrs-teal-light hover:border-starrs-teal'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubNav;
