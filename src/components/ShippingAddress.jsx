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
  const [errors, setErrors] = useState({});

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

  const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
  const CITY_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
  const COUNTRY_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,55}$/;
  const ADDRESS_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s#.,'\/-]{4,79}$/;

  const getZipRegex = (countryValue) => {
    const normalized = countryValue.trim().toLowerCase();

    if (normalized === 'us' || normalized === 'usa' || normalized.includes('united states')) {
      return /^\d{5}(-\d{4})?$/;
    }

    if (normalized.includes('canada')) {
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    }

    return /^[A-Za-z0-9][A-Za-z0-9\- ]{2,9}$/;
  };

  const validateField = (field, value) => {
    const trimmed = value.trim();

    switch (field) {
      case 'fullName':
        if (!trimmed) return 'Recipient name is required.';
        if (!NAME_REGEX.test(trimmed)) {
          return 'Use 2-60 letters with spaces, apostrophes, or hyphens.';
        }
        return '';
      case 'address':
        if (!trimmed) return 'Street address is required.';
        if (!ADDRESS_REGEX.test(trimmed)) {
          return 'Use 5-80 characters and standard punctuation.';
        }
        return '';
      case 'city':
        if (!trimmed) return 'City is required.';
        if (!CITY_REGEX.test(trimmed)) {
          return 'Use 2-50 letters with spaces, apostrophes, or hyphens.';
        }
        return '';
      case 'zip':
        if (!trimmed) return 'Postal / ZIP code is required.';
        if (!getZipRegex(country).test(trimmed)) {
          return 'Enter a valid postal / ZIP code.';
        }
        return '';
      case 'country':
        if (!trimmed) return 'Country is required.';
        if (!COUNTRY_REGEX.test(trimmed)) {
          return 'Use 2-56 letters with spaces, apostrophes, or hyphens.';
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    return {
      fullName: validateField('fullName', fullName),
      address: validateField('address', address),
      city: validateField('city', city),
      zip: validateField('zip', zip),
      country: validateField('country', country),
    };
  };

  const handleFieldChange = (field, setter) => (event) => {
    setter(event.target.value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field, value) => {
    const message = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const data = {
      fullName: fullName.trim(),
      address: address.trim(),
      city: city.trim(),
      zip: zip.trim(),
      country: country.trim(),
    };
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
              onChange={handleFieldChange('fullName', setFullName)}
              onBlur={() => handleFieldBlur('fullName', fullName)}
              placeholder="Full name"
              minLength={2}
              maxLength={60}
              pattern="[A-Za-z][A-Za-z\s.'-]{1,59}"
              title="Use 2-60 letters with spaces, apostrophes, or hyphens."
              autoComplete="name"
              className={`w-full border rounded-lg px-4 py-2.5 outline-none ${
                errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-[#DEE2E7] focus:border-primary'
              }`}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#505050] mb-1">Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={handleFieldChange('address', setAddress)}
              onBlur={() => handleFieldBlur('address', address)}
              placeholder="Street address"
              minLength={5}
              maxLength={80}
              pattern="[A-Za-z0-9][A-Za-z0-9\s#.,'\/-]{4,79}"
              title="Use 5-80 characters and standard punctuation."
              autoComplete="street-address"
              className={`w-full border rounded-lg px-4 py-2.5 outline-none ${
                errors.address ? 'border-red-300 focus:border-red-500' : 'border-[#DEE2E7] focus:border-primary'
              }`}
              aria-invalid={Boolean(errors.address)}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={handleFieldChange('city', setCity)}
                onBlur={() => handleFieldBlur('city', city)}
                placeholder="City"
                minLength={2}
                maxLength={50}
                pattern="[A-Za-z][A-Za-z\s.'-]{1,49}"
                title="Use 2-50 letters with spaces, apostrophes, or hyphens."
                autoComplete="address-level2"
                className={`w-full border rounded-lg px-4 py-2.5 outline-none ${
                  errors.city ? 'border-red-300 focus:border-red-500' : 'border-[#DEE2E7] focus:border-primary'
                }`}
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-600">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#505050] mb-1">Postal / ZIP Code</label>
              <input
                type="text"
                required
                value={zip}
                onChange={handleFieldChange('zip', setZip)}
                onBlur={() => handleFieldBlur('zip', zip)}
                placeholder="Postal / ZIP code"
                inputMode="text"
                minLength={3}
                maxLength={10}
                pattern="[A-Za-z0-9\- ]{3,10}"
                title="Use 3-10 letters or numbers."
                autoComplete="postal-code"
                className={`w-full border rounded-lg px-4 py-2.5 outline-none ${
                  errors.zip ? 'border-red-300 focus:border-red-500' : 'border-[#DEE2E7] focus:border-primary'
                }`}
                aria-invalid={Boolean(errors.zip)}
              />
              {errors.zip && (
                <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#505050] mb-1">Country</label>
            <input
              type="text"
              required
              value={country}
              onChange={handleFieldChange('country', setCountry)}
              onBlur={() => handleFieldBlur('country', country)}
              placeholder="Country"
              minLength={2}
              maxLength={56}
              pattern="[A-Za-z][A-Za-z\s.'-]{1,55}"
              title="Use 2-56 letters with spaces, apostrophes, or hyphens."
              autoComplete="country-name"
              className={`w-full border rounded-lg px-4 py-2.5 outline-none ${
                errors.country ? 'border-red-300 focus:border-red-500' : 'border-[#DEE2E7] focus:border-primary'
              }`}
              aria-invalid={Boolean(errors.country)}
            />
            {errors.country && (
              <p className="mt-1 text-xs text-red-600">{errors.country}</p>
            )}
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
