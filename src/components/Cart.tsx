'use client';

import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🥤</div>
          <h2 className="text-2xl font-bold text-starrs-teal-dark mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Your cart is empty</h2>
          <p className="text-starrs-teal-dark/70 mb-6 font-medium">Add some delicious shakes to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-starrs-teal text-white px-6 py-3 rounded-full hover:bg-starrs-teal-dark transition-all duration-200 font-semibold shadow-lg"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          className="flex items-center space-x-2 text-starrs-teal-dark hover:text-starrs-teal-darker transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Continue Shopping</span>
        </button>
        <h1 className="text-3xl font-bold text-starrs-teal-dark" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-starrs-green hover:text-starrs-green-dark transition-colors duration-200 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border-2 border-starrs-teal/20 overflow-hidden mb-8">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-starrs-teal/20' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-starrs-teal-dark mb-1">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-sm text-gray-500 mb-1">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-gray-500 mb-1">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-lg font-semibold text-starrs-teal-dark">₱{item.totalPrice} each</p>
              </div>
              
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-starrs-teal-light rounded-full p-1 border-2 border-starrs-teal/30">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-starrs-teal/20 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4 text-starrs-teal-dark" />
                  </button>
                  <span className="font-semibold text-starrs-teal-dark min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-starrs-teal/20 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 text-starrs-teal-dark" />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-starrs-teal-dark">₱{item.totalPrice * item.quantity}</p>
                </div>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-starrs-green hover:text-starrs-green-dark hover:bg-starrs-green/10 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md border-2 border-starrs-teal/20 p-6">
        <div className="flex items-center justify-between text-2xl font-bold text-starrs-teal-dark mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <span>Total:</span>
          <span className="text-starrs-green">₱{(getTotalPrice() || 0).toFixed(2)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-gradient-to-r from-starrs-teal to-starrs-teal-dark text-white py-4 rounded-xl hover:from-starrs-teal-dark hover:to-starrs-teal-darker transition-all duration-200 transform hover:scale-[1.02] font-semibold text-lg shadow-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
