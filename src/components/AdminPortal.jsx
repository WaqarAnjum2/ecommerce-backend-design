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
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, orders, products, add-product, profile, order-history
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
  });

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
  const [productView, setProductView] = useState('table');

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

  const openModal = (nextState) => {
    setModalState({
      isOpen: true,
      title: '',
      message: '',
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false,
      onConfirm: null,
      ...nextState,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const openConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    openModal({
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm,
    });
  };

  const openInfo = ({ title, message, type = 'info' }) => {
    openModal({
      title,
      message,
      type,
      confirmText: 'OK',
      showCancel: false,
    });
  };

  const getModalAccentClass = (type) => {
    if (type === 'success') return 'text-teal';
    if (type === 'error') return 'text-red-600';
    if (type === 'confirm') return 'text-primary';
    return 'text-dark';
  };

  const getModalButtonClass = (type) => {
    if (type === 'error') return 'bg-red-600 hover:bg-red-700';
    if (type === 'success') return 'bg-teal hover:bg-teal/90';
    return 'bg-primary hover:bg-primary-dark';
  };

  const handleModalConfirm = async () => {
    const confirmAction = modalState.onConfirm;
    closeModal();
    if (confirmAction) {
      await confirmAction();
    }
  };

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
    if (activeTab === 'orders' || activeTab === 'dashboard') {
      fetchOrders();
    }
    if (activeTab === 'products' || activeTab === 'dashboard') {
      fetchProducts();
    }
    if (activeTab === 'order-history' || activeTab === 'dashboard') {
      fetchOrderHistory();
    }
  }, [activeTab, prodPage, prodSearch]);

  // Update order status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    openConfirm({
      title: 'Update order status',
      message: `Set order ${orderId.substring(0, 8)}... to ${newStatus}?`,
      confirmText: 'Update',
      onConfirm: async () => {
        setLoading(true);
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
            fetchOrders();
            openInfo({
              title: 'Status updated',
              message: `Order status updated to ${newStatus}.`,
              type: 'success'
            });
          } else {
            const errData = await response.json();
            openInfo({
              title: 'Update failed',
              message: errData.error || 'Failed to update status.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Update failed',
            message: 'Failed to update status.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
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
  const handleAddProduct = (e) => {
    e.preventDefault();

    // Client-side validations
    if (!productForm.title || String(productForm.title).trim() === '') {
      openInfo({ title: 'Validation error', message: 'Product title is required.', type: 'error' });
      return;
    }
    if (productForm.price === '' || isNaN(Number(productForm.price)) || Number(productForm.price) <= 0) {
      openInfo({ title: 'Validation error', message: 'Price must be a number greater than 0.', type: 'error' });
      return;
    }
    if (productForm.stock !== '' && (isNaN(Number(productForm.stock)) || Number(productForm.stock) < 0)) {
      openInfo({ title: 'Validation error', message: 'Stock must be a non-negative integer.', type: 'error' });
      return;
    }

    openConfirm({
      title: 'Add product',
      message: 'Create this product with the current details?',
      confirmText: 'Add',
      onConfirm: async () => {
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
            openInfo({
              title: 'Product added',
              message: 'The product was added successfully.',
              type: 'success'
            });
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
            openInfo({
              title: 'Add failed',
              message: data.error || 'Failed to add product.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Add failed',
            message: 'Failed to add product.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle Delete Product
  const handleDeleteProduct = (productId) => {
    openConfirm({
      title: 'Delete product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getToken()}`
            }
          });
          if (response.ok) {
            openInfo({
              title: 'Product deleted',
              message: 'The product was deleted successfully.',
              type: 'success'
            });
            fetchProducts();
          } else {
            const data = await response.json();
            openInfo({
              title: 'Delete failed',
              message: data.error || 'Failed to delete product.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Delete failed',
            message: 'Failed to delete product.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
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
  const handleEditProductSubmit = (e) => {
    e.preventDefault();

    openConfirm({
      title: 'Update product',
      message: 'Save changes to this product?',
      confirmText: 'Save',
      onConfirm: async () => {
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
            openInfo({
              title: 'Product updated',
              message: 'The product was updated successfully.',
              type: 'success'
            });
            setEditingProduct(null);
            fetchProducts();
          } else {
            const data = await response.json();
            openInfo({
              title: 'Update failed',
              message: data.error || 'Failed to update product.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Update failed',
            message: 'Failed to update product.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Submit Profile update
  const handleUpdateProfileSubmit = (e) => {
    e.preventDefault();

    openConfirm({
      title: 'Update profile',
      message: 'Save changes to your profile?',
      confirmText: 'Save',
      onConfirm: async () => {
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
            openInfo({
              title: 'Profile updated',
              message: 'Your profile was updated successfully.',
              type: 'success'
            });
            await refetchProfile();
          } else {
            const data = await response.json();
            openInfo({
              title: 'Update failed',
              message: data.error || 'Failed to update profile.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Update failed',
            message: 'Failed to update profile.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Submit Password update directly
  const handleUpdatePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      openInfo({
        title: 'Password too short',
        message: 'Password must be at least 6 characters long.',
        type: 'error'
      });
      return;
    }

    openConfirm({
      title: 'Update password',
      message: 'Are you sure you want to change your password?',
      confirmText: 'Update',
      onConfirm: async () => {
        setPasswordLoading(true);
        try {
          const { error } = await updatePassword(newPassword);
          if (error) {
            openInfo({
              title: 'Update failed',
              message: error.message || 'Failed to update password.',
              type: 'error'
            });
          } else {
            openInfo({
              title: 'Password updated',
              message: 'Your password was updated successfully.',
              type: 'success'
            });
            setNewPassword('');
          }
        } catch (err) {
          console.error(err);
          openInfo({
            title: 'Update failed',
            message: 'Failed to update password.',
            type: 'error'
          });
        } finally {
          setPasswordLoading(false);
        }
      }
    });
  };

  const handleLogout = () => {
    openConfirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      onConfirm: async () => {
        await signOut();
        setPage('home');
      }
    });
  };

  const activeOrdersCount = orders.length;
  const completedOrdersCount = historyOrders.length;
  const productCount = products.length;
  const lowStockCount = products.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= 5).length;
  const pendingCount = orders.filter((order) => order.status === 'Pending').length;
  const processingCount = orders.filter((order) => order.status === 'Processing').length;
  const shippedCount = orders.filter((order) => order.status === 'Shipped').length;
  const revenueTotal = historyOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const revenueDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(revenueTotal || 0);
  const statusBreakdown = [
    { label: 'Pending', count: pendingCount, color: 'bg-amber-400' },
    { label: 'Processing', count: processingCount, color: 'bg-blue-500' },
    { label: 'Shipped', count: shippedCount, color: 'bg-purple-500' }
  ];

  return (
    <div className="admin-portal relative flex min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[color:var(--admin-accent)] opacity-20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-40 -left-16 h-80 w-80 rounded-full bg-[color:var(--admin-accent-2)] opacity-20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#7ad9ff] opacity-20 blur-3xl" />

      {/* Sidebar - Desktop Layout */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 md:w-64 bg-white/80 admin-glass text-[color:var(--admin-ink)] border-r border-[color:var(--admin-border)] shadow-[0_20px_50px_rgba(15,23,42,0.12)] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden md:block'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-[color:var(--admin-border)] bg-gradient-to-r from-[#eef3ff] to-[#fff4e8]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[color:var(--admin-accent)]" />
            <span className="admin-title text-lg font-semibold tracking-tight text-[color:var(--admin-ink)]">Admin Studio</span>
          </div>
          <button className="md:hidden text-[color:var(--admin-ink)]" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <Grid size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <Layers size={18} />
            <span>Manage Orders</span>
          </button>

          <button
            onClick={() => { setActiveTab('order-history'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'order-history' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <FileText size={18} />
            <span>Order History</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <Package size={18} />
            <span>Manage Products</span>
          </button>

          <button
            onClick={() => { setActiveTab('add-product'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'add-product' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'profile' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <Settings size={18} />
            <span>Profile Settings</span>
          </button>
        </nav>

        {/* Sidebar Admin Profile Info & Logout */}
        <div className="p-4 border-t border-[color:var(--admin-border)]">
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/70 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[color:var(--admin-accent)] flex items-center justify-center text-white overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-semibold text-lg">{profile?.fullName?.substring(0, 1).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[color:var(--admin-ink)]">{profile?.fullName || 'Admin User'}</p>
                <p className="text-xs text-[color:var(--admin-muted)] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-sm font-semibold transition-all border border-red-200"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="admin-glass sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-[color:var(--admin-border)] shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[color:var(--admin-ink)] p-1 rounded hover:bg-white/70" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Admin Console</p>
              <h1 className="admin-title text-lg font-semibold text-[color:var(--admin-ink)] capitalize">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'add-product' && 'Add New Product'}
                {activeTab !== 'dashboard' && activeTab !== 'add-product' && activeTab.replace('-', ' ')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage('home')}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] transition-all shadow-[0_10px_24px_rgba(91,124,255,0.35)]"
            >
              Go to Storefront
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[color:var(--admin-border)] px-3 py-1 text-xs text-[color:var(--admin-muted)] bg-white/70">
              <span className="inline-block w-2 h-2 bg-[#00B517] rounded-full animate-pulse"></span>
              <span className="font-semibold text-[color:var(--admin-ink)]">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
          {loading && (
            <div className="fixed inset-0 z-50 bg-black/10 flex items-center justify-center">
              <div className="admin-card rounded-2xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[color:var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-[color:var(--admin-ink)]">Processing...</span>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="admin-card admin-slide-up rounded-2xl p-4" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Active Orders</p>
                    <p className="admin-title text-2xl font-semibold text-[color:var(--admin-ink)]">{activeOrdersCount}</p>
                    <p className="text-xs text-[color:var(--admin-muted)]">{pendingCount} pending, {processingCount} processing</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#eef3ff] text-[color:var(--admin-accent)] flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                </div>
              </div>

              <div className="admin-card admin-slide-up rounded-2xl p-4" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Completed Orders</p>
                    <p className="admin-title text-2xl font-semibold text-[color:var(--admin-ink)]">{completedOrdersCount}</p>
                    <p className="text-xs text-[color:var(--admin-muted)]">Revenue {revenueDisplay}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#e8fff1] text-[#00B517] flex items-center justify-center">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="admin-card admin-slide-up rounded-2xl p-4" style={{ animationDelay: '0.15s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Products</p>
                    <p className="admin-title text-2xl font-semibold text-[color:var(--admin-ink)]">{productCount}</p>
                    <p className="text-xs text-[color:var(--admin-muted)]">{lowStockCount} low stock</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#fff2e6] text-[color:var(--admin-accent-2)] flex items-center justify-center">
                    <Package size={20} />
                  </div>
                </div>
              </div>

              <div className="admin-card admin-slide-up rounded-2xl p-4" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Revenue</p>
                    <p className="admin-title text-2xl font-semibold text-[color:var(--admin-ink)]">{revenueDisplay}</p>
                    <p className="text-xs text-[color:var(--admin-muted)]">From delivered orders</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#eef3ff] text-[color:var(--admin-accent)] flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'dashboard' && (
            <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="admin-card admin-fade-in rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="admin-title text-base font-semibold text-[color:var(--admin-ink)]">Operations Pulse</h2>
                  <span className="text-xs text-[color:var(--admin-muted)]">Live from active orders</span>
                </div>
                <div className="space-y-3">
                  {statusBreakdown.map((status) => (
                    <div key={status.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--admin-muted)]">{status.label}</span>
                        <span className="font-semibold text-[color:var(--admin-ink)]">{status.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#eef2f8] overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${status.color}`}
                          style={{ width: `${(status.count / Math.max(1, activeOrdersCount)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card admin-fade-in rounded-2xl p-5">
                <h2 className="admin-title text-base font-semibold text-[color:var(--admin-ink)] mb-4">Quick Actions</h2>
                <div className="grid gap-3">
                  <button
                    onClick={() => setActiveTab('add-product')}
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)] hover:bg-[#4a6bff] transition-all"
                  >
                    Add New Product
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-[color:var(--admin-border)] text-[color:var(--admin-ink)] bg-white/70 hover:bg-[color:var(--admin-surface-2)] transition-all"
                  >
                    Review Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('order-history')}
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-[color:var(--admin-border)] text-[color:var(--admin-ink)] bg-white/70 hover:bg-[color:var(--admin-surface-2)] transition-all"
                  >
                    View Order History
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TAB 1: MANAGE ORDERS */}
          {activeTab === 'orders' && (
            <div className="admin-card admin-fade-in rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[color:var(--admin-border)] bg-white/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-sm font-semibold text-[color:var(--admin-ink)]">{orders.length} Active Orders</span>
                <span className="text-xs text-[color:var(--admin-muted)]">Set status to 'Delivered' to push into history.</span>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-[color:var(--admin-muted)]">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-[color:var(--admin-ink)]">No active orders</p>
                  <p className="text-sm mt-1">Pending user checkouts will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/70 text-[color:var(--admin-muted)] uppercase font-semibold text-xs border-b border-[color:var(--admin-border)]">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Items / Products</th>
                        <th className="px-6 py-4">Total Price</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--admin-border)] text-[color:var(--admin-muted)]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#f7f9ff]">
                          <td className="px-6 py-4 font-mono text-xs text-[color:var(--admin-ink)]">{ord.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[color:var(--admin-ink)]">{ord.user?.fullName || 'Anonymous'}</p>
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
                          <td className="px-6 py-4 font-bold text-[color:var(--admin-ink)]">${ord.totalAmount}</td>
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
            <div className="admin-card admin-fade-in rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[color:var(--admin-border)] bg-white/70 flex items-center justify-between">
                <span className="text-sm font-semibold text-[color:var(--admin-ink)]">{historyOrders.length} Completed Orders</span>
                <span className="text-xs text-[color:var(--admin-muted)]">Orders marked as 'Delivered' populate here automatically.</span>
              </div>

              {historyOrders.length === 0 ? (
                <div className="p-12 text-center text-[color:var(--admin-muted)]">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-[color:var(--admin-ink)]">History is empty</p>
                  <p className="text-sm mt-1">Deliver active orders to see them in this history log.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/70 text-[color:var(--admin-muted)] uppercase font-semibold text-xs border-b border-[color:var(--admin-border)]">
                        <th className="px-6 py-4">History ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Completed Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--admin-border)] text-[color:var(--admin-muted)]">
                      {historyOrders.map((hist) => (
                        <tr key={hist.id} className="hover:bg-[#f7f9ff]">
                          <td className="px-6 py-4 font-mono text-xs text-[color:var(--admin-ink)]">{hist.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[color:var(--admin-ink)]">{hist.user?.fullName || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{hist.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-[color:var(--admin-ink)]">${hist.totalAmount}</td>
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
              <div className="admin-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
                    placeholder="Search product title..."
                    className="w-full text-sm pl-9 pr-4 py-2 border border-[color:var(--admin-border)] rounded-xl outline-none bg-white focus:border-[color:var(--admin-accent)]"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center rounded-full border border-[color:var(--admin-border)] bg-white/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setProductView('table')}
                      className={`px-3 py-2 text-xs font-semibold transition-all ${productView === 'table' ? 'bg-[color:var(--admin-accent)] text-white' : 'text-[color:var(--admin-muted)] hover:text-[color:var(--admin-ink)]'}`}
                      title="Table view"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductView('grid')}
                      className={`px-3 py-2 text-xs font-semibold transition-all ${productView === 'grid' ? 'bg-[color:var(--admin-accent)] text-white' : 'text-[color:var(--admin-muted)] hover:text-[color:var(--admin-ink)]'}`}
                      title="Grid view"
                    >
                      <Grid size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveTab('add-product')}
                    className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] transition-all shadow-[0_10px_24px_rgba(91,124,255,0.35)]"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="admin-card admin-fade-in rounded-2xl overflow-hidden">
                {products.length === 0 ? (
                  <div className="p-12 text-center text-[color:var(--admin-muted)]">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-[color:var(--admin-ink)]">No products found</p>
                    <p className="text-sm mt-1">Try another search term or create a new product.</p>
                  </div>
                ) : (
                  <>
                    {productView === 'table' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-white/70 text-[color:var(--admin-muted)] uppercase font-semibold text-xs border-b border-[color:var(--admin-border)]">
                              <th className="px-6 py-4">Product Info</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Price</th>
                              <th className="px-6 py-4">Stock</th>
                              <th className="px-6 py-4">Brand</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[color:var(--admin-border)] text-[color:var(--admin-muted)]">
                            {products.map((p) => (
                              <tr key={p.id} className="hover:bg-[#f7f9ff]">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white border border-[color:var(--admin-border)] rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                                      <img src={p.image || p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp'} alt={p.title} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[color:var(--admin-ink)] truncate max-w-[200px]">{p.title}</p>
                                      <p className="text-xs text-[color:var(--admin-muted)] font-mono">{p.id.substring(0, 8)}...</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 capitalize">{p.category?.name || 'Uncategorized'}</td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-[color:var(--admin-ink)]">${p.price}</span>
                                  {p.oldPrice && <span className="text-xs text-[color:var(--admin-muted)] line-through block">${p.oldPrice}</span>}
                                </td>
                                <td className="px-6 py-4 font-semibold text-[color:var(--admin-ink)]">{p.stock}</td>
                                <td className="px-6 py-4">{p.brand || '-'}</td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => openEditModal(p)}
                                      className="p-2 border border-[color:var(--admin-border)] rounded-xl hover:bg-[#eef3ff] text-[color:var(--admin-accent)] hover:border-[color:var(--admin-accent)]"
                                      title="Edit Product"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(p.id)}
                                      className="p-2 border border-[color:var(--admin-border)] rounded-xl hover:bg-red-50 text-red-600 hover:border-red-600"
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
                    ) : (
                      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p) => (
                          <div key={p.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/80 p-4 shadow-sm hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl border border-[color:var(--admin-border)] bg-white flex items-center justify-center p-1.5">
                                  <img src={p.image || p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp'} alt={p.title} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[color:var(--admin-ink)] truncate max-w-[160px]">{p.title}</p>
                                  <p className="text-xs text-[color:var(--admin-muted)]">{p.category?.name || 'Uncategorized'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="p-2 border border-[color:var(--admin-border)] rounded-xl hover:bg-[#eef3ff] text-[color:var(--admin-accent)] hover:border-[color:var(--admin-accent)]"
                                  title="Edit Product"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 border border-[color:var(--admin-border)] rounded-xl hover:bg-red-50 text-red-600 hover:border-red-600"
                                  title="Delete Product"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-[color:var(--admin-muted)]">Price</p>
                                <p className="text-lg font-semibold text-[color:var(--admin-ink)]">${p.price}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[color:var(--admin-muted)]">Stock</p>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${Number(p.stock) <= 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                  {p.stock}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-[color:var(--admin-muted)] font-mono">{p.id.substring(0, 8)}...</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {prodTotalPages > 1 && (
                      <div className="p-4 border-t border-[color:var(--admin-border)] bg-white/70 flex items-center justify-between">
                        <span className="text-xs text-[color:var(--admin-muted)]">Page {prodPage} of {prodTotalPages}</span>
                        <div className="flex items-center border border-[color:var(--admin-border)] rounded-full bg-white overflow-hidden shadow-sm">
                          <button
                            disabled={prodPage <= 1}
                            onClick={() => setProdPage(prodPage - 1)}
                            className="px-3 py-1.5 text-xs font-semibold border-r border-[color:var(--admin-border)] hover:bg-[#f7f9ff] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Prev
                          </button>
                          <button
                            disabled={prodPage >= prodTotalPages}
                            onClick={() => setProdPage(prodPage + 1)}
                            className="px-3 py-1.5 text-xs font-semibold hover:bg-[#f7f9ff] disabled:opacity-30 disabled:pointer-events-none"
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
            <div className="admin-card admin-fade-in rounded-2xl p-6 max-w-4xl mx-auto">
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

                <div className="flex justify-end gap-3 border-t border-[color:var(--admin-border)] pt-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="text-sm font-semibold px-5 py-2.5 border border-[color:var(--admin-border)] text-[color:var(--admin-ink)] hover:bg-[color:var(--admin-surface-2)] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm font-semibold px-5 py-2.5 bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] rounded-xl shadow-[0_10px_24px_rgba(91,124,255,0.35)] transition-all"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="admin-card admin-fade-in rounded-2xl p-6 max-w-2xl mx-auto">
              <h2 className="admin-title text-base font-semibold text-[color:var(--admin-ink)] border-b border-[color:var(--admin-border)] pb-3 mb-5">Administrator Account Details</h2>
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

                <div className="border-t border-[color:var(--admin-border)] pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="text-sm font-semibold px-5 py-2.5 bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] rounded-xl shadow-[0_10px_24px_rgba(91,124,255,0.35)] transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              </form>

              <h2 className="admin-title text-base font-semibold text-[color:var(--admin-ink)] border-b border-[color:var(--admin-border)] pb-3 mt-10 mb-5">Change Account Password</h2>
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

                <div className="border-t border-[color:var(--admin-border)] pt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="text-sm font-semibold px-5 py-2.5 bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] rounded-xl shadow-[0_10px_24px_rgba(91,124,255,0.35)] transition-all disabled:opacity-50"
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
          <div className="admin-card rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--admin-border)] bg-white/70">
              <h3 className="admin-title text-base font-semibold text-[color:var(--admin-ink)]">Edit Product Details</h3>
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

            <div className="px-6 py-4 border-t border-[color:var(--admin-border)] bg-white/70 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-sm font-semibold px-4 py-2 border border-[color:var(--admin-border)] text-[color:var(--admin-ink)] hover:bg-[color:var(--admin-surface-2)] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProductSubmit}
                className="text-sm font-semibold px-4 py-2 bg-[color:var(--admin-accent)] text-white hover:bg-[#4a6bff] rounded-xl shadow-[0_10px_24px_rgba(91,124,255,0.35)]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="admin-card w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--admin-border)]">
              <h3 className={`text-sm font-bold ${getModalAccentClass(modalState.type)}`}>
                {modalState.title}
              </h3>
              <button onClick={closeModal} className="text-[#8B96A5] hover:text-[#1C1C1C] p-1 rounded-md">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-dark-light">
              {modalState.message}
            </div>
            <div className="px-5 py-4 border-t border-[color:var(--admin-border)] flex justify-end gap-2">
              {modalState.showCancel && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm font-semibold px-4 py-2 border border-[color:var(--admin-border)] text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] rounded-xl"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleModalConfirm}
                className={`text-sm font-semibold px-4 py-2 text-white rounded-xl ${getModalButtonClass(modalState.type)}`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
