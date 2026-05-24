import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Orders = ({ setPage, onAuthRequired }) => {
  const { user, getToken, profile } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      onAuthRequired();
      setPage('home');
      return;
    }

    const fetchOrders = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError('Could not retrieve order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleBuyAgain = (product) => {
    if (product) {
      addItem(product, 1);
      setPage('cart');
    }
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <p className="text-gray-500">Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="bg-white border border-[#DEE2E7] rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Recent Orders</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>You have not placed any orders yet.</p>
            <button
              onClick={() => setPage('listing')}
              className="mt-4 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={order.id} className="border border-[#DEE2E7] rounded-lg overflow-hidden">
                  {/* Order Top Bar Info */}
                  <div className="bg-[#F7FAFC] p-4 border-b border-[#DEE2E7] flex flex-wrap justify-between items-center gap-4 text-sm">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">ORDER PLACED</p>
                        <p className="font-medium text-gray-700">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">TOTAL</p>
                        <p className="font-medium text-gray-700">${parseFloat(order.totalAmount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">STATUS</p>
                        <p className={`font-semibold ${
                          order.status === 'Delivered' ? 'text-green-600' : 'text-orange-500'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">SHIP TO</p>
                        <p className="font-medium text-gray-700">{profile?.fullName || user.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[#8B96A5] text-xs">ORDER ID: {order.id}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-[#DEE2E7]">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-6 flex gap-6 items-center">
                        <div className="w-20 h-20 bg-[#F7F7F7] border border-[#DEE2E7] rounded p-2 flex items-center justify-center shrink-0">
                          <img
                            src={item.product?.image || 'https://via.placeholder.com/150'}
                            alt={item.product?.title || 'Product'}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate mb-1">
                            {item.product?.title || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Qty: {item.quantity} • Price: ${parseFloat(item.price).toFixed(2)}
                          </p>
                          {item.product && (
                            <button
                              onClick={() => handleBuyAgain(item.product)}
                              className="bg-primary text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-primary-dark transition"
                            >
                              Buy it again
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
