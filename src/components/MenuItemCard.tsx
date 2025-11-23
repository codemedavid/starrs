import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity 
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  const calculatePrice = () => {
    // Use effective price (discounted or regular) as base
    let price = item.effectivePrice || item.basePrice;
    if (selectedVariation) {
      price = (item.effectivePrice || item.basePrice) + selectedVariation.price;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    // Convert selectedAddOns back to regular AddOn array for cart
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn => 
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );
    onAddToCart(item, 1, selectedVariation, addOnsForCart);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, quantity: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);
      
      if (quantity === 0) {
        // Remove add-on if quantity is 0
        return prev.filter(a => a.id !== addOn.id);
      }
      
      if (existingIndex >= 0) {
        // Update existing add-on quantity
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        // Add new add-on with quantity
        return [...prev, { ...addOn, quantity }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className={`bg-white rounded-xl md:rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer ${!item.available ? 'opacity-60' : ''}`}>
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-2xl md:text-4xl opacity-20 text-gray-400">🥤</div>
          </div>
          
          {/* Badge - Top Left */}
          {(item.isOnDiscount || item.popular) && (
            <div className="absolute top-2 left-2 md:top-3 md:left-3">
              {item.isOnDiscount && item.discountPrice && (
                <span className="inline-block bg-orange-500 text-white text-[10px] md:text-xs font-semibold px-2 py-0.5 md:px-2 md:py-1 rounded">
                  SALE
                </span>
              )}
              {item.popular && !item.isOnDiscount && (
                <span className="inline-block bg-orange-500 text-white text-[10px] md:text-xs font-semibold px-2 py-0.5 md:px-2 md:py-1 rounded">
                  POPULAR
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Content - Clean Text Layout */}
        <div className="p-3 md:p-4 bg-white">
          {/* Badge/Tag */}
          {item.isOnDiscount && item.discountPrice && (
            <div className="text-orange-500 text-[10px] md:text-xs font-medium mb-0.5 md:mb-1">
              Promo Exclusion
            </div>
          )}
          
          {/* Product Name */}
          <h4 className="text-sm md:text-base font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 leading-tight">
            {item.name}
          </h4>
          
          {/* Category/Description */}
          <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3 line-clamp-1">
            {item.category || 'Milkshake'}
          </p>
          
          {/* Price and Button */}
          <div className="flex items-center justify-between gap-2">
            {item.isOnDiscount && item.discountPrice ? (
              <div className="flex-shrink-0">
                <div className="text-base md:text-lg font-bold text-gray-900">
                  ₱{item.discountPrice.toFixed(2)}
                </div>
                <div className="text-[10px] md:text-xs text-gray-400 line-through">
                  ₱{item.basePrice.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-base md:text-lg font-bold text-gray-900 flex-shrink-0">
                ₱{item.basePrice.toFixed(2)}
              </div>
            )}
            
            {/* Action Button */}
            {!item.available ? (
              <button
                disabled
                className="bg-gray-200 text-gray-500 px-3 py-2 md:px-4 md:py-2 rounded-lg cursor-not-allowed font-medium text-xs md:text-sm flex-shrink-0"
              >
                Unavailable
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="bg-starrs-teal-dark text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-starrs-teal-darker active:bg-starrs-teal-darker shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs md:text-sm flex-shrink-0 min-h-[36px] md:min-h-[40px] flex items-center justify-center"
              >
                {item.variations?.length || item.addOns?.length ? 'Customize' : 'Add'}
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 md:space-x-2 bg-starrs-teal-light rounded-lg px-1.5 py-1 md:px-2 md:py-1 flex-shrink-0">
                <button
                  onClick={handleDecrement}
                  className="p-1.5 md:p-1 hover:bg-starrs-teal/20 active:bg-starrs-teal/30 rounded transition-colors duration-200 touch-manipulation"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5 md:h-4 md:w-4 text-starrs-teal-dark" />
                </button>
                <span className="font-bold text-starrs-teal-dark min-w-[20px] md:min-w-[24px] text-center text-xs md:text-sm">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="p-1.5 md:p-1 hover:bg-starrs-teal/20 active:bg-starrs-teal/30 rounded transition-colors duration-200 touch-manipulation"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-starrs-teal-dark" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-starrs-teal/20">
            <div className="sticky top-0 bg-gradient-to-r from-starrs-mint-light to-starrs-teal-light border-b border-starrs-teal/30 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-starrs-teal-dark">Customize {item.name}</h3>
                <p className="text-sm text-starrs-teal-dark/70 mt-1 font-medium">Choose your preferences</p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-starrs-teal/20 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-starrs-teal-dark" />
              </button>
            </div>

            <div className="p-6">
              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-starrs-teal-dark mb-4">Choose Flavor</h4>
                  <div className="space-y-3">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedVariation?.id === variation.id
                            ? 'border-starrs-teal bg-starrs-teal-light'
                            : 'border-starrs-teal/30 hover:border-starrs-teal hover:bg-starrs-mint-light'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-starrs-teal focus:ring-starrs-teal"
                          />
                          <span className="font-semibold text-starrs-teal-dark">{variation.name}</span>
                        </div>
                        <span className="text-starrs-teal-dark font-bold">
                          ₱{((item.effectivePrice || item.basePrice) + variation.price).toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-starrs-teal-dark mb-4">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-semibold text-starrs-teal-dark/80 mb-3 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-3">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-4 border-2 border-starrs-teal/20 rounded-xl hover:border-starrs-teal hover:bg-starrs-mint-light transition-all duration-200"
                          >
                            <div className="flex-1">
                              <span className="font-semibold text-starrs-teal-dark">{addOn.name}</span>
                              <div className="text-sm text-starrs-teal-dark/70">
                                {addOn.price > 0 ? `₱${addOn.price.toFixed(2)} each` : 'Free'}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {selectedAddOns.find(a => a.id === addOn.id) ? (
                                <div className="flex items-center space-x-2 bg-starrs-teal-light rounded-xl p-1 border-2 border-starrs-teal/30">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 1) - 1);
                                    }}
                                    className="p-1.5 hover:bg-starrs-teal/20 rounded-lg transition-colors duration-200"
                                  >
                                    <Minus className="h-3 w-3 text-starrs-teal-dark" />
                                  </button>
                                  <span className="font-semibold text-starrs-teal-dark min-w-[24px] text-center text-sm">
                                    {selectedAddOns.find(a => a.id === addOn.id)?.quantity || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 0) + 1);
                                    }}
                                    className="p-1.5 hover:bg-starrs-teal/20 rounded-lg transition-colors duration-200"
                                  >
                                    <Plus className="h-3 w-3 text-starrs-teal-dark" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-starrs-teal to-starrs-teal-dark text-white rounded-xl hover:from-starrs-teal-dark hover:to-starrs-teal-darker transition-all duration-200 text-sm font-semibold shadow-lg"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t-2 border-starrs-teal/20 pt-4 mb-6">
                <div className="flex items-center justify-between text-2xl font-bold text-starrs-teal-dark">
                  <span>Total:</span>
                  <span className="text-starrs-green">₱{calculatePrice().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-gradient-to-r from-starrs-teal to-starrs-teal-dark text-white py-4 rounded-xl hover:from-starrs-teal-dark hover:to-starrs-teal-darker transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart - ₱{calculatePrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;