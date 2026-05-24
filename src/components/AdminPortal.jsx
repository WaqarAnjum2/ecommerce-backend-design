import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Edit, 
  Trash2, 
  Plus, 
  Trash,
  ChevronDown,
  CheckCircle,
  FileText,
  Package,
  Layers,
  Search,
  Grid,
  List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminPortal = ({ setPage }) => {
  const { user, profile, refetchProfile, signOut, updatePassword, getToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders, products, add-product, profile, order-history
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Data states
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination and search for products tab
  const [prodSearch, setProdSearch] = useState('');
  const [prodPage, setProdPage] = useState(1);
  const [prodTotalPages, setProdTotalPages] = useState(1);

  // Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    oldPrice: '',
    desc: '',
    categoryId: '',
    brand: '',
    stock: '10',
    shipping: 'Free Shipping',
    featuresInput: '',
    imageUrls: ['']
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    avatarUrl: ''
  });

  // Load profile details to form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        avatarUrl: profile.avatarUrl || ''
      });
    }
  }, [profile]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/all', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order history
  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(prodPage));
      params.set('limit', '8');
      if (prodSearch) {
        params.set('search', prodSearch);
      }
      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setProdTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch relevant tab data
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'order-history') {
      fetchOrderHistory();
    }
  }, [activeTab, prodPage, prodSearch]);

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        // Refresh orders
        fetchOrders();
        // Notify success
        alert(`Order status updated to ${newStatus}`);
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  // Handle image URL changes in forms
  const handleImageUrlChange = (index, value, isEdit = false) => {
    if (isEdit) {
      const updatedUrls = [...editingProduct.imageUrls];
      updatedUrls[index] = value;
      setEditingProduct({ ...editingProduct, imageUrls: updatedUrls });
    } else {
      const updatedUrls = [...productForm.imageUrls];
      updatedUrls[index] = value;
      setProductForm({ ...productForm, imageUrls: updatedUrls });
    }
  };

  const addImageUrlInput = (isEdit = false) => {
    if (isEdit) {
      setEditingProduct({
        ...editingProduct,
        imageUrls: [...editingProduct.imageUrls, '']
      });
    } else {
      setProductForm({
        ...productForm,
        imageUrls: [...productForm.imageUrls, '']
      });
    }
  };

  const removeImageUrlInput = (index, isEdit = false) => {
    if (isEdit) {
      const updatedUrls = editingProduct.imageUrls.filter((_, idx) => idx !== index);
      setEditingProduct({
        ...editingProduct,
        imageUrls: updatedUrls.length > 0 ? updatedUrls : ['']
      });
    } else {
      const updatedUrls = productForm.imageUrls.filter((_, idx) => idx !== index);
      setProductForm({
        ...productForm,
        imageUrls: updatedUrls.length > 0 ? updatedUrls : ['']
      });
    }
  };

  // Handle Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    const filteredUrls = productForm.imageUrls.filter(url => url.trim() !== '');

    const payload = {
      title: productForm.title,
      price: productForm.price,
      oldPrice: productForm.oldPrice || null,
      desc: productForm.desc,
      categoryId: productForm.categoryId || null,
      brand: productForm.brand,
      stock: productForm.stock,
      shipping: productForm.shipping,
      features: productForm.featuresInput.split(',').map(f => f.trim()).filter(f => f !== ''),
      imageUrls: filteredUrls
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Product added successfully!');
        // Reset form
        setProductForm({
          title: '',
          price: '',
          oldPrice: '',
          desc: '',
          categoryId: '',
          brand: '',
          stock: '10',
          shipping: 'Free Shipping',
          featuresInput: '',
          imageUrls: ['']
        });
        setActiveTab('products');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        alert('Product deleted successfully');
        fetchProducts();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      desc: product.desc || '',
      categoryId: product.categoryId || '',
      brand: product.brand || '',
      stock: String(product.stock),
      shipping: product.shipping || 'Free Shipping',
      featuresInput: Array.isArray(product.features) ? product.features.join(', ') : '',
      imageUrls: Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls : [product.image || '']
    });
  };

  // Submit Edit Product
  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const filteredUrls = editingProduct.imageUrls.filter(url => url.trim() !== '');

    const payload = {
      title: editingProduct.title,
      price: editingProduct.price,
      oldPrice: editingProduct.oldPrice || null,
      desc: editingProduct.desc,
      categoryId: editingProduct.categoryId || null,
      brand: editingProduct.brand,
      stock: editingProduct.stock,
      shipping: editingProduct.shipping,
      features: editingProduct.featuresInput.split(',').map(f => f.trim()).filter(f => f !== ''),
      imageUrls: filteredUrls
    };

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        fetchProducts();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Submit Profile update
  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          avatarUrl: profileForm.avatarUrl
        })
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        await refetchProfile();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Submit Password update directly
  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Password updated successfully!');
        setNewPassword('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut();
      setPage('home');
    }
  };

  return (
    <div className="flex h-screen bg-[#F7F7F7] overflow-hidden font-sans">
      {/* Sidebar - Desktop Layout */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1C1C1C] text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden md:block'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 bg-[#0D6EFD]/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[#FF9017]" />
            <span className="text-xl font-bold tracking-tight text-[#DEE2E7]">Admin Portal</span>
          </div>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-[#8B96A5] hover:bg-gray-800 hover:text-white'}`}
          >
            <Layers size={18} />
            <span>Manage Orders</span>
          </button>

          <button
            onClick={() => { setActiveTab('order-history'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'order-history' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-[#8B96A5] hover:bg-gray-800 hover:text-white'}`}
          >
            <FileText size={18} />
            <span>Order History</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-[#8B96A5] hover:bg-gray-800 hover:text-white'}`}
          >
            <Package size={18} />
            <span>Manage Products</span>
          </button>

          <button
            onClick={() => { setActiveTab('add-product'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'add-product' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-[#8B96A5] hover:bg-gray-800 hover:text-white'}`}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-[#8B96A5] hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings size={18} />
            <span>Profile Settings</span>
          </button>
        </nav>

        {/* Sidebar Admin Profile Info & Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden border border-gray-700">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-lg">{profile?.fullName?.substring(0, 1).toUpperCase() || 'A'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[#DEE2E7]">{profile?.fullName || 'Admin User'}</p>
              <p className="text-xs text-[#8B96A5] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-sm font-semibold transition-all border border-red-900/30"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#DEE2E7] shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#1C1C1C] p-1 rounded hover:bg-[#F7F7F7]" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-[#1C1C1C] capitalize">
              {activeTab === 'add-product' ? 'Add New Product' : activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage('home')}
              className="text-xs font-semibold px-4 py-2 border border-[#DEE2E7] text-[#505050] bg-white hover:bg-gray-50 rounded-md transition-all"
            >
              Go to Storefront
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#00B517] rounded-full animate-pulse"></span>
              <span className="text-xs text-[#505050] font-medium">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow overflow-y-auto p-6">
          {loading && (
            <div className="fixed inset-0 z-50 bg-black/10 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-dark">Processing...</span>
              </div>
            </div>
          )}

          {/* TAB 1: MANAGE ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#DEE2E7] bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-sm font-semibold text-[#1C1C1C]">{orders.length} Active Orders</span>
                <span className="text-xs text-[#8B96A5]">Set status to 'Delivered' to push into history.</span>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-[#8B96A5]">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-dark">No active orders</p>
                  <p className="text-sm mt-1">Pending user checkouts will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#8B96A5] uppercase font-semibold text-xs border-b border-[#DEE2E7]">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Items / Products</th>
                        <th className="px-6 py-4">Total Price</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEE2E7] text-[#505050]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-xs text-dark">{ord.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-dark">{ord.user?.fullName || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{ord.user?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[250px] space-y-1">
                              {ord.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs">
                                  <span className="font-semibold text-[#1C1C1C]">{item.quantity}x</span>
                                  <span className="truncate">{item.product?.title || 'Unknown Product'}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-dark">${ord.totalAmount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              ord.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              ord.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              ord.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                              ord.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="text-xs border border-[#DEE2E7] rounded p-1 bg-white outline-none cursor-pointer hover:border-[#8B96A5]"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDER HISTORY */}
          {activeTab === 'order-history' && (
            <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#DEE2E7] bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1C1C1C]">{historyOrders.length} Completed Orders</span>
                <span className="text-xs text-[#8B96A5]">Orders marked as 'Delivered' populate here automatically.</span>
              </div>

              {historyOrders.length === 0 ? (
                <div className="p-12 text-center text-[#8B96A5]">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-dark">History is empty</p>
                  <p className="text-sm mt-1">Deliver active orders to see them in this history log.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#8B96A5] uppercase font-semibold text-xs border-b border-[#DEE2E7]">
                        <th className="px-6 py-4">History ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Completed Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEE2E7] text-[#505050]">
                      {historyOrders.map((hist) => (
                        <tr key={hist.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-xs text-dark">{hist.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-dark">{hist.user?.fullName || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{hist.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-dark">${hist.totalAmount}</td>
                          <td className="px-6 py-4 text-xs">
                            {new Date(hist.completedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                              <CheckCircle size={12} />
                              {hist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Product Listing Top Search Bar */}
              <div className="bg-white border border-[#DEE2E7] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
                    placeholder="Search product title..."
                    className="w-full text-sm pl-9 pr-4 py-2 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('add-product')}
                  className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] rounded-md transition-all"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-sm overflow-hidden">
                {products.length === 0 ? (
                  <div className="p-12 text-center text-[#8B96A5]">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-dark">No products found</p>
                    <p className="text-sm mt-1">Try another search term or create a new product.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-[#8B96A5] uppercase font-semibold text-xs border-b border-[#DEE2E7]">
                            <th className="px-6 py-4">Product Info</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Brand</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DEE2E7] text-[#505050]">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-50 border border-[#DEE2E7] rounded flex items-center justify-center p-1.5 flex-shrink-0">
                                    <img src={p.image || p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp'} alt={p.title} className="max-w-full max-h-full object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-dark truncate max-w-[200px]">{p.title}</p>
                                    <p className="text-xs text-[#8B96A5] font-mono">{p.id.substring(0, 8)}...</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 capitalize">{p.category?.name || 'Uncategorized'}</td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-dark">${p.price}</span>
                                {p.oldPrice && <span className="text-xs text-[#8B96A5] line-through block">${p.oldPrice}</span>}
                              </td>
                              <td className="px-6 py-4 font-semibold text-dark">{p.stock}</td>
                              <td className="px-6 py-4">{p.brand || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => openEditModal(p)}
                                    className="p-1.5 border border-[#DEE2E7] rounded hover:bg-gray-50 text-[#0D6EFD] hover:border-[#0D6EFD]"
                                    title="Edit Product"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 border border-[#DEE2E7] rounded hover:bg-red-50 text-red-600 hover:border-red-600"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {prodTotalPages > 1 && (
                      <div className="p-4 border-t border-[#DEE2E7] bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-[#8B96A5]">Page {prodPage} of {prodTotalPages}</span>
                        <div className="flex items-center border border-[#DEE2E7] rounded bg-white overflow-hidden shadow-sm">
                          <button
                            disabled={prodPage <= 1}
                            onClick={() => setProdPage(prodPage - 1)}
                            className="px-3 py-1.5 text-xs font-semibold border-r border-[#DEE2E7] hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Prev
                          </button>
                          <button
                            disabled={prodPage >= prodTotalPages}
                            onClick={() => setProdPage(prodPage + 1)}
                            className="px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADD PRODUCT FORM */}
          {activeTab === 'add-product' && (
            <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      placeholder="e.g. Sony WH-1000XM5 Headphones"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Category</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5] cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Brand</label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      placeholder="e.g. Sony, Apple, Samsung"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="e.g. 299.99"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Old Price ($) — Optional</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.oldPrice}
                      onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })}
                      placeholder="e.g. 349.99"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Stock Count *</label>
                    <input
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="10"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Shipping Method</label>
                    <input
                      type="text"
                      value={productForm.shipping}
                      onChange={(e) => setProductForm({ ...productForm, shipping: e.target.value })}
                      placeholder="e.g. Free Shipping, $10 Shipping"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Features (Comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.featuresInput}
                      onChange={(e) => setProductForm({ ...productForm, featuresInput: e.target.value })}
                      placeholder="e.g. Active Noise Cancellation, Bluetooth 5.2, 30 Hours Battery Life"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Description</label>
                    <textarea
                      rows="4"
                      value={productForm.desc}
                      onChange={(e) => setProductForm({ ...productForm, desc: e.target.value })}
                      placeholder="Enter detailed description..."
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5] resize-none"
                    ></textarea>
                  </div>

                  {/* Multiple Product Images Input Block */}
                  <div className="col-span-1 md:col-span-2 border-t border-[#DEE2E7] pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-[#1C1C1C]">Product Image URLs</label>
                      <button
                        type="button"
                        onClick={() => addImageUrlInput(false)}
                        className="flex items-center gap-1 text-xs font-bold text-[#0D6EFD] hover:underline"
                      >
                        <Plus size={14} /> Add URL Field
                      </button>
                    </div>

                    <div className="space-y-2">
                      {productForm.imageUrls.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleImageUrlChange(idx, e.target.value, false)}
                            placeholder={`https://unsplash.com/... (Image URL #${idx + 1})`}
                            className="flex-1 text-sm p-2 border border-[#DEE2E7] rounded outline-none focus:border-[#8B96A5]"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageUrlInput(idx, false)}
                            className="p-2 border border-[#DEE2E7] hover:border-red-600 rounded text-red-600 hover:bg-red-50 flex items-center justify-center"
                            disabled={productForm.imageUrls.length <= 1}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#DEE2E7] pt-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="text-sm font-semibold px-5 py-2.5 border border-[#DEE2E7] text-[#505050] hover:bg-gray-50 rounded-md transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm font-semibold px-5 py-2.5 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] rounded-md shadow-sm transition-all"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
              <h2 className="text-base font-bold text-[#1C1C1C] border-b border-[#DEE2E7] pb-3 mb-5">Administrator Account Details</h2>
              <form onSubmit={handleUpdateProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#8B96A5] mb-1">Email Address</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] bg-gray-50 text-gray-500 rounded-md outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                  />
                </div>

                {profileForm.avatarUrl && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-[#DEE2E7] w-fit">
                    <span className="text-xs text-[#505050] font-medium">Avatar Preview:</span>
                    <img src={profileForm.avatarUrl} alt="Preview" className="w-12 h-12 rounded-full border object-cover" />
                  </div>
                )}

                <div className="border-t border-[#DEE2E7] pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="text-sm font-semibold px-5 py-2.5 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] rounded-md shadow-sm transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              </form>

              <h2 className="text-base font-bold text-[#1C1C1C] border-b border-[#DEE2E7] pb-3 mt-10 mb-5">Change Account Password</h2>
              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                  />
                </div>

                <div className="border-t border-[#DEE2E7] pt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="text-sm font-semibold px-5 py-2.5 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] rounded-md shadow-sm transition-all disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* EDIT PRODUCT MODAL OVERLAY */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white border border-[#DEE2E7] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEE2E7] bg-gray-50">
              <h3 className="text-base font-bold text-dark">Edit Product Details</h3>
              <button onClick={() => setEditingProduct(null)} className="text-[#8B96A5] hover:text-[#1C1C1C] p-1 rounded-md">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Old Price ($) — Optional</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.oldPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, oldPrice: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Shipping Method</label>
                  <input
                    type="text"
                    value={editingProduct.shipping}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shipping: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Features (Comma-separated)</label>
                  <input
                    type="text"
                    value={editingProduct.featuresInput}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featuresInput: e.target.value })}
                    placeholder="e.g. ANC, Bluetooth 5.0"
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Description</label>
                  <textarea
                    rows="4"
                    value={editingProduct.desc}
                    onChange={(e) => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5] resize-none"
                  ></textarea>
                </div>

                {/* Multiple Images Edit */}
                <div className="col-span-1 md:col-span-2 border-t border-[#DEE2E7] pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-[#1C1C1C]">Product Image URLs</label>
                    <button
                      type="button"
                      onClick={() => addImageUrlInput(true)}
                      className="flex items-center gap-1 text-xs font-bold text-[#0D6EFD] hover:underline"
                    >
                      <Plus size={14} /> Add URL Field
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editingProduct.imageUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleImageUrlChange(idx, e.target.value, true)}
                          placeholder={`https://unsplash.com/... (Image URL #${idx + 1})`}
                          className="flex-1 text-sm p-2 border border-[#DEE2E7] rounded outline-none focus:border-[#8B96A5]"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageUrlInput(idx, true)}
                          className="p-2 border border-[#DEE2E7] hover:border-red-600 rounded text-red-600 hover:bg-red-50 flex items-center justify-center"
                          disabled={editingProduct.imageUrls.length <= 1}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#DEE2E7] bg-gray-50 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-sm font-semibold px-4 py-2 border border-[#DEE2E7] text-[#505050] hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProductSubmit}
                className="text-sm font-semibold px-4 py-2 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] rounded-md shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
