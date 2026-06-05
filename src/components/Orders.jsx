import React, { useEffect, useState } from 'react';
import placeholderImage from '../assets/placeholder.svg';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Orders = ({ setPage, onAuthRequired }) => {
  const { user, getToken, profile } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  useEffect(() => {
    if (!user) {
      onAuthRequired();
      setPage('home');
      return;
    }

    const fetchOrderData = async () => {
      setLoading(true);
      setHistoryLoading(true);
      try {
        const token = getToken();
        if (!token) return;

        const [ordersResponse, historyResponse] = await Promise.all([
          fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/orders/history', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!ordersResponse.ok) {
          throw new Error('Failed to load orders');
        }

        const ordersData = await ordersResponse.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistoryOrders(Array.isArray(historyData) ? historyData : []);
        } else {
          setHistoryOrders([]);
        }
      } catch (err) {
        console.error(err);
        setError('Could not retrieve order history.');
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    fetchOrderData();
  }, [user, getToken, onAuthRequired, setPage]);

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

  const renderOrderItems = (items) => (
    <div className="divide-y divide-[#DEE2E7] border-t border-[#DEE2E7] bg-[#FCFDFF]">
      {items.map((item) => {
        const unitPrice = Number(item.price || item.product?.price || 0);
        const lineTotal = unitPrice * Number(item.quantity || 0);

        return (
          <div key={item.id} className="p-4 sm:p-5 flex gap-4 items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F7F7F7] border border-[#DEE2E7] rounded-lg p-2 flex items-center justify-center shrink-0">
              <img
                src={item.product?.image || placeholderImage}
                alt={item.product?.title || 'Product'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 truncate mb-1">
                {item.product?.title || 'Unknown Product'}
              </h3>
              <div className="grid gap-1 text-sm text-gray-600 sm:grid-cols-3">
                <span>Qty: {item.quantity}</span>
                <span>Unit price: {formatCurrency(unitPrice)}</span>
                <span>Line total: {formatCurrency(lineTotal)}</span>
              </div>
            </div>
            {item.product && (
              <button
                onClick={() => handleBuyAgain(item.product)}
                className="bg-primary text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-primary-dark transition"
              >
                Buy it again
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

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
      <div className="bg-white border border-[#DEE2E7] rounded-lg p-8 shadow-sm space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recent Orders</h1>
            <p className="text-sm text-[#8B96A5]">Review placed orders, expand each order for item-level details, and open the full history archive.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFullHistory((prev) => !prev)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#DEE2E7] px-4 py-2 text-sm font-semibold text-[#1C1C1C] hover:bg-[#F7FAFC] transition"
          >
            {showFullHistory ? 'Hide full order history' : 'View full order history'}
            {showFullHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
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
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="border border-[#DEE2E7] rounded-lg overflow-hidden">
                  <div className="bg-[#F7FAFC] p-4 border-b border-[#DEE2E7] flex flex-wrap justify-between items-center gap-4 text-sm">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">ORDER PLACED</p>
                        <p className="font-medium text-gray-700">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">TOTAL</p>
                        <p className="font-medium text-gray-700">{formatCurrency(order.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">STATUS</p>
                        <p className={`font-semibold ${order.status === 'Delivered' ? 'text-green-600' : 'text-orange-500'}`}>
                          {order.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#8B96A5] uppercase tracking-wider text-xs">SHIP TO</p>
                        <p className="font-medium text-gray-700">{profile?.fullName || user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[#8B96A5] text-xs">ORDER ID: {order.id}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#DEE2E7] px-3 py-1 text-xs font-semibold text-[#1C1C1C] hover:bg-white transition"
                      >
                        {isExpanded ? 'Hide details' : 'View details'}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && renderOrderItems(order.items || [])}
                </div>
              );
            })}
          </div>
        )}

        {showFullHistory && (
          <section className="space-y-4 border-t border-[#DEE2E7] pt-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1C1C1C]">Full Order History</h2>
                <p className="text-sm text-[#8B96A5]">Completed history records with saved order items, quantities, and unit prices.</p>
              </div>
              <p className="text-sm font-medium text-[#8B96A5]">{historyOrders.length} record{historyOrders.length === 1 ? '' : 's'}</p>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-gray-500">Loading full order history...</div>
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-[#DEE2E7] rounded-lg">
                <p>No completed history is available yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {historyOrders.map((record) => {
                  const sourceOrder = record.order || {};
                  const orderItems = sourceOrder.items || [];
                  const completedDate = new Date(record.completedAt || sourceOrder.createdAt || Date.now()).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const isExpanded = expandedHistoryId === record.id;

                  return (
                    <div key={record.id} className="border border-[#DEE2E7] rounded-lg overflow-hidden">
                      <div className="bg-[#FFFDF8] p-4 border-b border-[#DEE2E7] flex flex-wrap justify-between items-center gap-4 text-sm">
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <p className="text-[#8B96A5] uppercase tracking-wider text-xs">COMPLETED</p>
                            <p className="font-medium text-gray-700">{completedDate}</p>
                          </div>
                          <div>
                            <p className="text-[#8B96A5] uppercase tracking-wider text-xs">TOTAL</p>
                            <p className="font-medium text-gray-700">{formatCurrency(record.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-[#8B96A5] uppercase tracking-wider text-xs">STATUS</p>
                            <p className="font-semibold text-green-600">{record.status || 'Delivered'}</p>
                          </div>
                          <div>
                            <p className="text-[#8B96A5] uppercase tracking-wider text-xs">SHIP TO</p>
                            <p className="font-medium text-gray-700">{record.user?.fullName || profile?.fullName || user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[#8B96A5] text-xs">ORDER ID: {sourceOrder.id || record.orderId || record.id}</p>
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : record.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#DEE2E7] px-3 py-1 text-xs font-semibold text-[#1C1C1C] hover:bg-white transition"
                          >
                            {isExpanded ? 'Hide details' : 'View details'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        orderItems.length > 0 ? renderOrderItems(orderItems) : (
                          <div className="p-6 text-sm text-gray-500">Saved order details are unavailable for this record.</div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Orders;
