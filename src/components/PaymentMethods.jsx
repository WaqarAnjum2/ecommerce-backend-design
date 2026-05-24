import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function PaymentMethods({ setPage, onAuthRequired }) {
  const { user, getToken } = useAuth();
  const { items, total, clearCart } = useCart();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      onAuthRequired();
      setPage('cart');
    }
  }, [user]);

  const discount = items.length > 0 ? 60.00 : 0.00;
  const tax = items.length > 0 ? 14.00 : 0.00;
  const finalTotal = Math.max(0, total - discount + tax);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        setError('Your session has expired. Please sign in again.');
        setLoading(false);
        return;
      }

      // Format payload for /api/orders
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Order placed successfully! Clear cart, go to orders list
      clearCart();
      localStorage.removeItem('shipping_address');
      setPage('orders');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      {/* Checkout Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
          <span className="text-sm font-semibold text-green-500 mt-1">Shipping</span>
        </div>
        <div className="flex-1 h-0.5 bg-green-500 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
          <span className="text-sm font-semibold text-primary mt-1">Payment</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Card Details */}
        <div className="flex-grow bg-white border border-[#DEE2E7] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setPage('shipping')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-[#1C1C1C]">Payment Details</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">Card Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CreditCard size={18} />
                </span>
                <input
                  type="text"
                  required
                  pattern="\d{16}"
                  maxLength={16}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="16-digit card number"
                  className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 pl-10 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#505050] mb-1">Expiration Date</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#505050] mb-1">CVV</label>
                <input
                  type="password"
                  required
                  maxLength={3}
                  pattern="\d{3}"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B517] hover:bg-[#00A015] text-white py-3 rounded-lg font-bold text-lg transition-colors mt-6 shadow disabled:bg-gray-400"
            >
              {loading ? 'Processing Payment...' : `Pay $${finalTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full md:w-80 bg-white border border-[#DEE2E7] rounded-lg p-5 h-fit shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-[#1C1C1C] border-b pb-2">Order Summary</h3>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm gap-2">
                <span className="text-[#505050] line-clamp-1 flex-grow">{item.product.title}</span>
                <span className="font-semibold text-right min-w-[70px]">
                  {item.quantity} x ${parseFloat(item.product.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-[#505050]">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#FA3434]">
              <span>Discount:</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#00B517]">
              <span>Tax:</span>
              <span>+${tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base text-[#1C1C1C]">
              <span>Total:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8B96A5]">
            <ShieldCheck size={16} />
            <span>Payments secured with SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
