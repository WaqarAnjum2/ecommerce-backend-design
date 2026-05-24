import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShippingAddress({ setPage, onAuthRequired }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (!user) {
      onAuthRequired();
      setPage('cart');
      return;
    }

    try {
      const stored = localStorage.getItem('shipping_address');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFullName(parsed.fullName || '');
        setAddress(parsed.address || '');
        setCity(parsed.city || '');
        setZip(parsed.zip || '');
        setCountry(parsed.country || '');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { fullName, address, city, zip, country };
    localStorage.setItem('shipping_address', JSON.stringify(data));
    setPage('payments');
  };

  return (
    <div className="container py-6 max-w-2xl mx-auto">
      {/* Checkout Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
          <span className="text-sm font-semibold text-primary mt-1">Shipping</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">2</div>
          <span className="text-sm text-gray-500 mt-1">Payment</span>
        </div>
      </div>

      <div className="bg-white border border-[#DEE2E7] rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPage('cart')} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-[#1C1C1C]">Shipping Address</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#505050] mb-1">Recipient Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#505050] mb-1">Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Apt 4B"
              className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York"
                className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">Postal / ZIP Code</label>
              <input
                type="text"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="e.g. 10001"
                className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#505050] mb-1">Country</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States"
              className="w-full border border-[#DEE2E7] rounded-lg px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#00B517] hover:bg-[#00A015] text-white py-3 rounded-lg font-bold text-lg transition-colors mt-6 shadow"
          >
            Continue to Payment
          </button>
        </form>
      </div>
    </div>
  );
}
