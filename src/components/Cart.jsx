import React from 'react';
import { ChevronDown, ArrowLeft, ShieldCheck, Truck, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = ({ setPage, onAuthRequired }) => {
  const { items, removeItem, updateQty, clearCart, total } = useCart();
  const { user } = useAuth();

  const discount = items.length > 0 ? 60.00 : 0.00;
  const tax = items.length > 0 ? 14.00 : 0.00;
  const finalTotal = Math.max(0, total - discount + tax);

  const handleCheckout = () => {
    if (!user) {
      onAuthRequired();
    } else {
      setPage('shipping');
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">My cart ({items.length})</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Section: Cart Items */}
        <div className="flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="bg-white border border-[#DEE2E7] rounded-lg p-12 text-center space-y-4">
              <p className="text-gray-500 text-lg">Your cart is empty.</p>
              <button
                onClick={() => setPage('listing')}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-dark transition-colors inline-block"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#DEE2E7] rounded-lg overflow-hidden">
              {items.map((item, index) => {
                const product = item.product;
                const price = parseFloat(product.price) || 0;
                return (
                  <div
                    key={product.id}
                    className={`p-4 lg:p-6 flex flex-col sm:flex-row gap-4 lg:gap-6 ${
                      index !== items.length - 1 ? 'border-b border-[#DEE2E7]' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <div className="w-[80px] h-[80px] lg:w-[100px] lg:h-[100px] border border-[#DEE2E7] rounded-lg p-3 flex items-center justify-center bg-[#F7F7F7] flex-shrink-0 group overflow-hidden">
                      <img
                        src={product.image || 'https://via.placeholder.com/150'}
                        alt={product.title}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-[#1C1C1C] hover:text-primary cursor-pointer transition-colors max-w-md">
                          {product.title}
                        </h3>
                        <div className="text-[#8B96A5] text-sm space-y-0.5">
                          <p>Brand: {product.brand || 'Generic'}</p>
                          <p>Shipping: {product.shipping}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => removeItem(product.id)}
                            className="px-3 py-1.5 border border-[#DEE2E7] rounded-md text-[#FA3434] text-xs font-semibold hover:bg-[#FFF0F0] transition-colors flex items-center gap-1.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[120px]">
                        <span className="text-lg font-bold text-[#1C1C1C]">
                          ${price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2 border border-[#DEE2E7] rounded-md px-2 py-1 bg-white cursor-pointer hover:bg-shade transition-colors">
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQty(product.id, parseInt(e.target.value))}
                            className="bg-transparent text-sm outline-none cursor-pointer pr-1"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>
                                Qty: {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            /* Bottom Actions */
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[#DEE2E7]">
              <button
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-dark transition-colors"
                onClick={() => setPage('listing')}
              >
                <ArrowLeft size={18} />
                Back to shop
              </button>
              <button
                onClick={clearCart}
                className="text-primary font-bold hover:underline"
              >
                Remove all
              </button>
            </div>
          )}

          {/* Benefits Bar */}
          <div className="flex flex-wrap gap-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DEE2E7] flex items-center justify-center text-[#8B96A5]">
                <ShieldCheck size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-[#1C1C1C] font-semibold text-sm">Secure Payment</p>
                <p className="text-[#8B96A5] text-xs">Shop with total peace of mind</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DEE2E7] flex items-center justify-center text-[#8B96A5]">
                <MessageSquare size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-[#1C1C1C] font-semibold text-sm">Customer Support</p>
                <p className="text-[#8B96A5] text-xs">24/7 dedicated support team</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DEE2E7] flex items-center justify-center text-[#8B96A5]">
                <Truck size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-[#1C1C1C] font-semibold text-sm">Free Delivery</p>
                <p className="text-[#8B96A5] text-xs">On orders over specific thresholds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Summary */}
        {items.length > 0 && (
          <div className="lg:w-[280px] space-y-4">
            {/* Coupon */}
            <div className="bg-white border border-[#DEE2E7] rounded-lg p-5">
              <p className="text-[#505050] text-sm mb-3">Have a coupon?</p>
              <div className="flex border border-[#DEE2E7] rounded-md overflow-hidden">
                <input
                  type="text"
                  placeholder="Add coupon"
                  className="flex-1 px-3 py-2 outline-none text-sm w-full"
                />
                <button className="bg-white border-l border-[#DEE2E7] px-4 py-2 text-primary font-bold text-sm hover:bg-shade transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-white border border-[#DEE2E7] rounded-lg p-5 shadow-sm">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-[#505050]">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#FA3434]">
                  <span>Discount:</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#00B517]">
                  <span>Tax:</span>
                  <span>+ ${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="h-[1px] bg-[#DEE2E7] mb-4"></div>

              <div className="flex justify-between text-lg font-bold text-[#1C1C1C] mb-6">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#00B517] hover:bg-[#00A015] text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
