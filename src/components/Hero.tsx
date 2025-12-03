'use client';

import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-starrs-mint-light via-starrs-teal-light to-starrs-cream-light py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-starrs-cream-light mb-3 leading-tight" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            transform: 'rotate(-1deg)'
          }}>
            starr's
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-starrs-cream-light/90 -mt-2" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transform: 'rotate(1deg)',
            textShadow: '1px 1px 3px rgba(0,0,0,0.1)'
          }}>
            famous shakes
          </p>
        </div>
        <p className="text-lg md:text-xl text-starrs-teal-dark mb-10 max-w-2xl mx-auto animate-slide-up font-medium">
          Premium milkshakes crafted with love. Choose from our signature flavors, 
          decadent bake & shake creations, and refreshing yogurt-based options.
        </p>
        <div className="flex justify-center animate-slide-up">
          <a 
            href="#menu"
            className="bg-starrs-teal text-white px-10 py-4 rounded-full hover:bg-starrs-teal-dark transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Explore Our Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
