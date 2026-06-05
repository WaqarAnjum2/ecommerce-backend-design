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
  List,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const AdminPortal = ({ setPage }) => {
  const { user, profile, refetchProfile, signOut, updatePassword, getToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, orders, products, add-product, profile, order-history
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    dialogSize: 'md',
    onConfirm: null,
  });

  // Data states
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inquiries, setInquiries] = useState([]);
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
    imageFiles: [],
    imagePreviews: []
  });
  const [imageInputKey, setImageInputKey] = useState(0);
  const [editImageInputKey, setEditImageInputKey] = useState(0);

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    avatarUrl: '',
    avatarFile: null,
    avatarPreview: ''
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
      dialogSize: 'md',
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

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

  const getOrderDetailData = (entry) => {
    const sourceOrder = entry?.order || entry || {};
    const items = Array.isArray(sourceOrder.items) ? sourceOrder.items : [];
    return {
      id: sourceOrder.id || entry?.orderId || entry?.id || 'Unknown',
      totalAmount: entry?.totalAmount ?? sourceOrder.totalAmount ?? 0,
      status: entry?.status || sourceOrder.status || 'Pending',
      createdAt: sourceOrder.createdAt || entry?.createdAt || null,
      completedAt: entry?.completedAt || null,
      user: entry?.user || sourceOrder.user || null,
      items,
    };
  };

  const renderOrderDetailContent = (entry, sourceLabel) => {
    const order = getOrderDetailData(entry);
    const itemCount = order.items.reduce((count, item) => count + Number(item.quantity || 0), 0);

    return (
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Order ID</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)] break-all">{order.id}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Source</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{sourceLabel}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Status</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{order.status}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Total</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)] mb-2">Customer</p>
            <p className="text-sm font-semibold text-[color:var(--admin-ink)]">{order.user?.fullName || 'Anonymous'}</p>
            <p className="text-sm text-[color:var(--admin-muted)]">{order.user?.email || '-'}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)] mb-2">Dates</p>
            <p className="text-sm text-[color:var(--admin-ink)]">
              Ordered: {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
            </p>
            <p className="text-sm text-[color:var(--admin-ink)]">
              Completed: {order.completedAt ? new Date(order.completedAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--admin-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--admin-ink)]">Order Items</p>
              <p className="text-xs text-[color:var(--admin-muted)]">{order.items.length} products, {itemCount} total units</p>
            </div>
            <p className="text-xs font-semibold text-[color:var(--admin-muted)] uppercase tracking-[0.15em]">Detail view</p>
          </div>
          {order.items.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--admin-muted)]">No item details are available for this order.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-[color:var(--admin-muted)] uppercase text-[11px] tracking-[0.15em]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--admin-border)]">
                  {order.items.map((item) => {
                    const unitPrice = Number(item.price || item.product?.price || 0);
                    const quantity = Number(item.quantity || 0);
                    const lineTotal = unitPrice * quantity;

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl border border-[color:var(--admin-border)] bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img
                                src={item.product?.image || item.product?.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp'}
                                alt={item.product?.title || 'Product'}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[color:var(--admin-ink)]">{item.product?.title || 'Unknown Product'}</p>
                              <p className="text-xs text-[color:var(--admin-muted)] break-all">{item.product?.id || item.productId || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[color:var(--admin-ink)]">{quantity}</td>
                        <td className="px-4 py-3">{formatCurrency(unitPrice)}</td>
                        <td className="px-4 py-3 font-semibold text-[color:var(--admin-ink)]">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Items</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{order.items.length}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Total Units</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{itemCount}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--admin-border)] bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-muted)]">Grand Total</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--admin-ink)]">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>
      </div>
    );
  };

  const openOrderDetailModal = (entry, sourceLabel) => {
    openModal({
      title: 'Order full details',
      message: renderOrderDetailContent(entry, sourceLabel),
      type: 'info',
      confirmText: 'Close',
      showCancel: false,
      dialogSize: 'xl',
    });
  };

  const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'product-images';

  const sanitizeDecimalInput = (value) => {
    const normalized = String(value ?? '').replace(/[^\d.]/g, '');
    const [wholePart = '', ...fractionParts] = normalized.split('.');

    if (fractionParts.length === 0) {
      return normalized;
    }

    return `${wholePart}.${fractionParts.join('').replace(/\./g, '')}`;
  };

  const sanitizeIntegerInput = (value) => String(value ?? '').replace(/\D/g, '');

  const isImageFile = (file) => Boolean(file && typeof file.type === 'string' && file.type.startsWith('image/'));

  const validateProductNumbers = (form, productLabel) => {
    if (!String(form.title || '').trim()) {
      openInfo({ title: 'Validation error', message: `${productLabel} title is required.`, type: 'error' });
      return null;
    }

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      openInfo({ title: 'Validation error', message: 'Price must be a number greater than 0.', type: 'error' });
      return null;
    }

    if (form.oldPrice !== '' && form.oldPrice !== null && form.oldPrice !== undefined) {
      const parsedOldPrice = Number(form.oldPrice);
      if (!Number.isFinite(parsedOldPrice) || parsedOldPrice < 0) {
        openInfo({ title: 'Validation error', message: 'Old price must be a non-negative number.', type: 'error' });
        return null;
      }
    }

    const parsedStock = Number(form.stock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      openInfo({ title: 'Validation error', message: 'Stock must be a non-negative integer.', type: 'error' });
      return null;
    }

    return {
      price: parsedPrice,
      oldPrice: form.oldPrice === '' || form.oldPrice === null || form.oldPrice === undefined ? null : Number(form.oldPrice),
      stock: parsedStock
    };
  };

  const revokePreviewUrls = (urls) => {
    if (!urls || urls.length === 0) return;
    urls.forEach((url) => URL.revokeObjectURL(url));
  };

  const getImageSource = (file) => {
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(file);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image.'));
      };
      img.src = url;
    });
  };

  const convertToWebp = async (file, options = {}) => {
    const maxSize = options.maxSize || 1600;
    const quality = options.quality || 0.82;
    const source = await getImageSource(file);
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image conversion failed.');
    }
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    if (typeof source.close === 'function') {
      source.close();
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) {
      throw new Error('Image conversion failed.');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'image';
    const uniqueId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fileName = `${baseName}-${uniqueId}.webp`;

    return new File([blob], fileName, { type: 'image/webp' });
  };

  const uploadImagesToSupabase = async (files, folderKey) => {
    const uploads = [];

    for (const file of files) {
      const webpFile = await convertToWebp(file);
      const path = `products/${folderKey}/${webpFile.name}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, webpFile, {
        contentType: 'image/webp',
        upsert: true
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      if (!data?.publicUrl) {
        throw new Error('Failed to retrieve image URL.');
      }
      uploads.push({ path, url: data.publicUrl });
    }

    return uploads;
  };

  const deleteSupabaseImagesByPaths = async (paths) => {
    if (!paths || paths.length === 0) return;
    const { error } = await supabase.storage.from(storageBucket).remove(paths);
    if (error) {
      console.warn('Failed to delete images from storage:', error.message || error);
    }
  };

  const getStoragePathFromUrl = (url) => {
    try {
      const parsed = new URL(url);
      const marker = `/storage/v1/object/public/${storageBucket}/`;
      const index = parsed.pathname.indexOf(marker);
      if (index === -1) return null;
      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch (err) {
      return null;
    }
  };

  const deleteSupabaseImagesByUrls = async (urls) => {
    const paths = (urls || []).map(getStoragePathFromUrl).filter(Boolean);
    await deleteSupabaseImagesByPaths(paths);
  };

  const handleImageFilesChange = (fileList, isEdit = false) => {
    const files = Array.from(fileList || []);

    if (files.length === 0) {
      openInfo({
        title: 'No images selected',
        message: 'Please choose one or more image files to upload.',
        type: 'error'
      });
      return;
    }

    const invalidFiles = files.filter((file) => !isImageFile(file));
    if (invalidFiles.length > 0) {
      openInfo({
        title: 'Invalid file selected',
        message: 'Only image files are allowed for product uploads.',
        type: 'error'
      });
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));

    if (isEdit) {
      if (!editingProduct) return;
      revokePreviewUrls(editingProduct.newImagePreviews);
      setEditingProduct({
        ...editingProduct,
        imageFiles: files,
        newImagePreviews: previews
      });
      setEditImageInputKey((prev) => prev + 1);
    } else {
      revokePreviewUrls(productForm.imagePreviews);
      setProductForm({
        ...productForm,
        imageFiles: files,
        imagePreviews: previews
      });
      setImageInputKey((prev) => prev + 1);
    }
  };

  const removeSelectedImage = (index, isEdit = false) => {
    if (isEdit) {
      if (!editingProduct) return;
      const nextFiles = editingProduct.imageFiles.filter((_, idx) => idx !== index);
      const nextPreviews = editingProduct.newImagePreviews.filter((_, idx) => idx !== index);
      const removedPreview = editingProduct.newImagePreviews[index];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }
      setEditingProduct({
        ...editingProduct,
        imageFiles: nextFiles,
        newImagePreviews: nextPreviews
      });
    } else {
      const nextFiles = productForm.imageFiles.filter((_, idx) => idx !== index);
      const nextPreviews = productForm.imagePreviews.filter((_, idx) => idx !== index);
      const removedPreview = productForm.imagePreviews[index];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }
      setProductForm({
        ...productForm,
        imageFiles: nextFiles,
        imagePreviews: nextPreviews
      });
    }
  };

  const clearSelectedImages = (isEdit = false) => {
    if (isEdit) {
      if (!editingProduct) return;
      revokePreviewUrls(editingProduct.newImagePreviews);
      setEditingProduct({
        ...editingProduct,
        imageFiles: [],
        newImagePreviews: []
      });
      setEditImageInputKey((prev) => prev + 1);
    } else {
      revokePreviewUrls(productForm.imagePreviews);
      setProductForm({
        ...productForm,
        imageFiles: [],
        imagePreviews: []
      });
      setImageInputKey((prev) => prev + 1);
    }
  };

  const handleProfileAvatarChange = async (file) => {
    if (!file) {
      openInfo({
        title: 'No file selected',
        message: 'Please choose an image file for the admin avatar.',
        type: 'error'
      });
      return;
    }

    if (!isImageFile(file)) {
      openInfo({
        title: 'Invalid image',
        message: 'Please select an image file for the admin avatar.',
        type: 'error'
      });
      return;
    }

    if (profileForm.avatarPreview && profileForm.avatarPreview !== profile?.avatarUrl) {
      URL.revokeObjectURL(profileForm.avatarPreview);
    }

    const preview = URL.createObjectURL(file);
    setProfileForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: preview
    }));
  };

  const clearProfileAvatarSelection = () => {
    if (profileForm.avatarPreview && profileForm.avatarPreview !== profile?.avatarUrl) {
      URL.revokeObjectURL(profileForm.avatarPreview);
    }

    setProfileForm((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: profile?.avatarUrl || '',
      avatarUrl: profile?.avatarUrl || ''
    }));
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
        avatarUrl: profile.avatarUrl || '',
        avatarFile: null,
        avatarPreview: profile.avatarUrl || ''
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
    if (activeTab === 'inquiries' || activeTab === 'dashboard') {
      fetchInquiries();
    }
  }, [activeTab, prodPage, prodSearch]);

  // Fetch inquiries (admin)
  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(Array.isArray(data) ? data : []);
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error(err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = (id) => {
    openConfirm({
      title: 'Delete inquiry',
      message: 'Are you sure you want to delete this inquiry? This cannot be undone.',
      confirmText: 'Delete',
      onConfirm: async () => {
        setLoading(true);
        try {
          const resp = await fetch(`/api/inquiries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          if (resp.ok) {
            openInfo({ title: 'Deleted', message: 'Inquiry deleted.', type: 'success' });
            fetchInquiries();
          } else {
            const d = await resp.json();
            openInfo({ title: 'Delete failed', message: d.error || 'Failed to delete.', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          openInfo({ title: 'Delete failed', message: 'Failed to delete inquiry.', type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Update inquiry status (admin)
  const handleUpdateInquiryStatus = (id, newStatus) => {
    openConfirm({
      title: 'Update inquiry status',
      message: `Set inquiry ${id.substring(0, 8)}... to ${newStatus}?`,
      confirmText: 'Update',
      onConfirm: async () => {
        setLoading(true);
        try {
          const resp = await fetch(`/api/inquiries/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          if (resp.ok) {
            openInfo({ title: 'Updated', message: 'Inquiry status updated.', type: 'success' });
            fetchInquiries();
          } else {
            const d = await resp.json();
            openInfo({ title: 'Update failed', message: d.error || 'Failed to update.', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          openInfo({ title: 'Update failed', message: 'Failed to update inquiry status.', type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

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

  const closeEditModal = () => {
    if (editingProduct?.newImagePreviews?.length) {
      revokePreviewUrls(editingProduct.newImagePreviews);
    }
    setEditingProduct(null);
  };

  // Handle Add Product Submit
  const handleAddProduct = (e) => {
    e.preventDefault();

    const parsedNumbers = validateProductNumbers(productForm, 'Product');
    if (!parsedNumbers) {
      return;
    }

    openConfirm({
      title: 'Add product',
      message: 'Create this product with the current details?',
      confirmText: 'Add',
      onConfirm: async () => {
        setLoading(true);

        const folderKey = `new-${Date.now()}`;
        let uploads = [];

        try {
          if (productForm.imageFiles.length > 0) {
            uploads = await uploadImagesToSupabase(productForm.imageFiles, folderKey);
          }

          const payload = {
            title: productForm.title,
            price: parsedNumbers.price,
            oldPrice: parsedNumbers.oldPrice,
            desc: productForm.desc,
            categoryId: productForm.categoryId || null,
            brand: productForm.brand,
            stock: parsedNumbers.stock,
            shipping: productForm.shipping,
            features: productForm.featuresInput.split(',').map(f => f.trim()).filter(f => f !== ''),
            imageUrls: uploads.map((item) => item.url)
          };

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
            revokePreviewUrls(productForm.imagePreviews);
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
              imageFiles: [],
              imagePreviews: []
            });
            setImageInputKey((prev) => prev + 1);
            setActiveTab('products');
          } else {
            const data = await response.json();
            await deleteSupabaseImagesByPaths(uploads.map((item) => item.path));
            openInfo({
              title: 'Add failed',
              message: data.error || 'Failed to add product.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          await deleteSupabaseImagesByPaths(uploads.map((item) => item.path));
          openInfo({
            title: 'Add failed',
            message: err?.message || 'Failed to add product.',
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
      imageUrls: Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls : [product.image || ''],
      imageFiles: [],
      newImagePreviews: []
    });
    setEditImageInputKey((prev) => prev + 1);
  };

  // Submit Edit Product
  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedNumbers = validateProductNumbers(editingProduct, 'Product');
    if (!parsedNumbers) {
      return;
    }

    openConfirm({
      title: 'Update product',
      message: 'Save changes to this product?',
      confirmText: 'Save',
      onConfirm: async () => {
        setLoading(true);

        const existingUrls = (editingProduct.imageUrls || []).filter((url) => url && url.trim() !== '');
        const hasNewImages = editingProduct.imageFiles && editingProduct.imageFiles.length > 0;
        let uploads = [];

        try {
          if (hasNewImages) {
            uploads = await uploadImagesToSupabase(editingProduct.imageFiles, editingProduct.id);
          }

          const payload = {
            title: editingProduct.title,
            price: parsedNumbers.price,
            oldPrice: parsedNumbers.oldPrice,
            desc: editingProduct.desc,
            categoryId: editingProduct.categoryId || null,
            brand: editingProduct.brand,
            stock: parsedNumbers.stock,
            shipping: editingProduct.shipping,
            features: editingProduct.featuresInput.split(',').map(f => f.trim()).filter(f => f !== ''),
            imageUrls: hasNewImages ? uploads.map((item) => item.url) : existingUrls
          };

          const response = await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            if (hasNewImages) {
              await deleteSupabaseImagesByUrls(existingUrls);
            }
            openInfo({
              title: 'Product updated',
              message: 'The product was updated successfully.',
              type: 'success'
            });
            closeEditModal();
            fetchProducts();
          } else {
            const data = await response.json();
            if (hasNewImages) {
              await deleteSupabaseImagesByPaths(uploads.map((item) => item.path));
            }
            openInfo({
              title: 'Update failed',
              message: data.error || 'Failed to update product.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          if (hasNewImages) {
            await deleteSupabaseImagesByPaths(uploads.map((item) => item.path));
          }
          openInfo({
            title: 'Update failed',
            message: err?.message || 'Failed to update product.',
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
        let uploadedAvatarPath = null;

        try {
          let avatarUrl = profileForm.avatarUrl || profile?.avatarUrl || '';

          if (profileForm.avatarFile) {
            const webpFile = await convertToWebp(profileForm.avatarFile);
            const avatarPath = `profiles/${profile?.id || user?.id || 'admin'}/${webpFile.name}`;
            const uploadResult = await supabase.storage.from(storageBucket).upload(avatarPath, webpFile, {
              contentType: 'image/webp',
              upsert: true
            });

            if (uploadResult.error) {
              throw uploadResult.error;
            }

            uploadedAvatarPath = avatarPath;
            const { data } = supabase.storage.from(storageBucket).getPublicUrl(avatarPath);
            if (!data?.publicUrl) {
              throw new Error('Failed to retrieve avatar URL.');
            }
            avatarUrl = data.publicUrl;
          }

          const response = await fetch('/api/profiles/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
              fullName: profileForm.fullName,
              avatarUrl
            })
          });

          if (response.ok) {
            if (profile?.avatarUrl && profileForm.avatarFile) {
              await deleteSupabaseImagesByUrls([profile.avatarUrl]);
            }
            openInfo({
              title: 'Profile updated',
              message: 'Your profile was updated successfully.',
              type: 'success'
            });
            if (profileForm.avatarPreview && profileForm.avatarPreview !== profile?.avatarUrl) {
              URL.revokeObjectURL(profileForm.avatarPreview);
            }
            setProfileForm((prev) => ({
              ...prev,
              avatarFile: null,
              avatarPreview: avatarUrl,
              avatarUrl
            }));
            await refetchProfile();
          } else {
            if (uploadedAvatarPath) {
              await deleteSupabaseImagesByPaths([uploadedAvatarPath]);
            }
            const data = await response.json();
            openInfo({
              title: 'Update failed',
              message: data.error || 'Failed to update profile.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          if (uploadedAvatarPath) {
            await deleteSupabaseImagesByPaths([uploadedAvatarPath]);
          }
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
            onClick={() => { setActiveTab('inquiries'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'inquiries' ? 'bg-[color:var(--admin-accent)] text-white shadow-[0_12px_26px_rgba(91,124,255,0.35)]' : 'text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-surface-2)] hover:text-[color:var(--admin-ink)]'}`}
          >
            <FileText size={18} />
            <span>Inquiries</span>
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
              <div className="w-14 h-14 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-2)] flex items-center justify-center text-white overflow-hidden shrink-0">
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
            <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-[color:var(--admin-muted)]">Avatar preview</p>
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
                        <th className="px-6 py-4 text-center">Actions</th>
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
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openOrderDetailModal(ord, 'Active order')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[color:var(--admin-border)] bg-white text-xs font-semibold text-[color:var(--admin-ink)] hover:bg-[color:var(--admin-surface-2)]"
                                >
                                  <Eye size={14} />
                                  View full detail
                                </button>
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
                        <th className="px-6 py-4 text-center">Actions</th>
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
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => openOrderDetailModal(hist, 'Order history')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[color:var(--admin-border)] bg-white text-xs font-semibold text-[color:var(--admin-ink)] hover:bg-[color:var(--admin-surface-2)]"
                            >
                              <Eye size={14} />
                              View full detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="admin-card admin-fade-in rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[color:var(--admin-border)] bg-white/70 flex items-center justify-between">
                <span className="text-sm font-semibold text-[color:var(--admin-ink)]">{inquiries.length} Inquiries</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => fetchInquiries()} className="text-sm px-3 py-2 rounded-xl border bg-white">Refresh</button>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-12 text-center text-[color:var(--admin-muted)]">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-[color:var(--admin-ink)]">No inquiries found</p>
                  <p className="text-sm mt-1">When users submit inquiries they will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/70 text-[color:var(--admin-muted)] uppercase font-semibold text-xs border-b border-[color:var(--admin-border)]">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--admin-border)] text-[color:var(--admin-muted)]">
                      {inquiries.map((iq) => (
                        <tr key={iq.id} className="hover:bg-[#f7f9ff]">
                          <td className="px-6 py-4 font-mono text-xs text-[color:var(--admin-ink)]">{iq.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 font-semibold text-[color:var(--admin-ink)]">{iq.subject}</td>
                          <td className="px-6 py-4">{iq.quantity || '-'}</td>
                          <td className="px-6 py-4 text-xs">{new Date(iq.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={iq.status || 'new'}
                                onChange={(e) => handleUpdateInquiryStatus(iq.id, e.target.value)}
                                className="text-sm px-2 py-1 border rounded"
                              >
                                <option value="new">New</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openModal({ title: 'Inquiry details', message: iq.details, type: 'info' })} className="px-3 py-1 rounded border">View</button>
                              <button onClick={() => { navigator.clipboard?.writeText(`${iq.subject}\n\n${iq.details}`); openInfo({ title: 'Copied', message: 'Inquiry copied to clipboard.', type: 'success' }); }} className="px-3 py-1 rounded border">Copy</button>
                              <button onClick={() => handleDeleteInquiry(iq.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
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
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: sanitizeDecimalInput(e.target.value) })}
                      placeholder="e.g. 299.99"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Old Price ($) — Optional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={productForm.oldPrice}
                      onChange={(e) => setProductForm({ ...productForm, oldPrice: sanitizeDecimalInput(e.target.value) })}
                      placeholder="e.g. 349.99"
                      className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Stock Count *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: sanitizeIntegerInput(e.target.value) })}
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

                  {/* Product Images Upload */}
                  <div className="col-span-1 md:col-span-2 border-t border-[#DEE2E7] pt-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-bold text-[#1C1C1C]">Product Images</label>
                        <p className="text-xs text-[#8B96A5]">Upload one or more files. Images are compressed to WebP before upload.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearSelectedImages(false)}
                        className="text-xs font-bold text-[#0D6EFD] hover:underline"
                      >
                        Clear selected
                      </button>
                    </div>

                    <input
                      key={imageInputKey}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFilesChange(e.target.files, false)}
                      className="block w-full text-sm text-[#505050] file:mr-4 file:rounded-full file:border-0 file:bg-[#0D6EFD] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0b5ed7]"
                    />

                    {productForm.imagePreviews.length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {productForm.imagePreviews.map((preview, idx) => (
                          <div key={preview} className="rounded-xl border border-[#DEE2E7] bg-white p-3">
                            <div className="aspect-square overflow-hidden rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                              <img src={preview} alt={`Selected preview ${idx + 1}`} className="h-full w-full object-contain" />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-[#505050]">{productForm.imageFiles[idx]?.name || `Image ${idx + 1}`}</span>
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(idx, false)}
                                className="inline-flex items-center justify-center rounded-full border border-[#DEE2E7] p-1 text-red-600 hover:bg-red-50"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Avatar Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProfileAvatarChange(e.target.files?.[0])}
                    className="block w-full text-sm text-[#505050] file:mr-4 file:rounded-full file:border-0 file:bg-[#0D6EFD] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0b5ed7]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={clearProfileAvatarSelection}
                      className="text-xs font-bold text-[#0D6EFD] hover:underline"
                    >
                      Reset avatar selection
                    </button>
                    {profileForm.avatarFile && (
                      <span className="text-xs text-[#8B96A5]">Selected: {profileForm.avatarFile.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-[#DEE2E7] w-full sm:w-fit">
                  <span className="text-xs text-[#505050] font-medium">Avatar Preview:</span>
                  {profileForm.avatarPreview ? (
                    <img src={profileForm.avatarPreview} alt="Preview" className="w-16 h-16 rounded-2xl border object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border border-dashed border-[#DEE2E7] flex items-center justify-center text-[#8B96A5] text-xs text-center px-2">
                      No image selected
                    </div>
                  )}
                </div>

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
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full text-sm p-2.5 pr-11 border border-[#DEE2E7] rounded-md outline-none bg-white focus:border-[#8B96A5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B96A5] transition hover:text-[#1C1C1C]"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
              <button onClick={closeEditModal} className="text-[#8B96A5] hover:text-[#1C1C1C] p-1 rounded-md">
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
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: sanitizeDecimalInput(e.target.value) })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Old Price ($) — Optional</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={editingProduct.oldPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, oldPrice: sanitizeDecimalInput(e.target.value) })}
                    className="w-full text-sm p-2.5 border border-[#DEE2E7] rounded-md outline-none focus:border-[#8B96A5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1.5">Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: sanitizeIntegerInput(e.target.value) })}
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
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-bold text-[#1C1C1C]">Product Images</label>
                      <p className="text-xs text-[#8B96A5]">Uploading new files will replace the existing images and delete the old storage objects.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearSelectedImages(true)}
                      className="text-xs font-bold text-[#0D6EFD] hover:underline"
                    >
                      Clear selected
                    </button>
                  </div>
                      onClick={() => {
                        clearSelectedImages(false);
                        setActiveTab('products');
                      }}
                  {editingProduct.imageUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8B96A5]">Current images</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {editingProduct.imageUrls.map((url, idx) => (
                          <div key={`${url}-${idx}`} className="rounded-xl border border-[#DEE2E7] bg-white p-3">
                            <div className="aspect-square overflow-hidden rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                              <img src={url} alt={`Current product ${idx + 1}`} className="h-full w-full object-contain" />
                            </div>
                            <p className="mt-2 truncate text-xs text-[#505050]">Stored image {idx + 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    key={editImageInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageFilesChange(e.target.files, true)}
                    className="block w-full text-sm text-[#505050] file:mr-4 file:rounded-full file:border-0 file:bg-[#0D6EFD] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0b5ed7]"
                  />

                  {editingProduct.newImagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8B96A5]">New images to save</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {editingProduct.newImagePreviews.map((preview, idx) => (
                          <div key={preview} className="rounded-xl border border-[#DEE2E7] bg-white p-3">
                            <div className="aspect-square overflow-hidden rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                              <img src={preview} alt={`New preview ${idx + 1}`} className="h-full w-full object-contain" />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-[#505050]">{editingProduct.imageFiles[idx]?.name || `Image ${idx + 1}`}</span>
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(idx, true)}
                                className="inline-flex items-center justify-center rounded-full border border-[#DEE2E7] p-1 text-red-600 hover:bg-red-50"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[color:var(--admin-border)] bg-white/70 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={closeEditModal}
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
          <div className={`admin-card w-full rounded-2xl ${modalState.dialogSize === 'xl' ? 'max-w-5xl' : 'max-w-md'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--admin-border)]">
              <h3 className={`text-sm font-bold ${getModalAccentClass(modalState.type)}`}>
                {modalState.title}
              </h3>
              <button onClick={closeModal} className="text-[#8B96A5] hover:text-[#1C1C1C] p-1 rounded-md">
                <X size={18} />
              </button>
            </div>
            <div className={`px-5 py-4 text-sm text-dark-light ${modalState.dialogSize === 'xl' ? 'max-h-[78vh] overflow-y-auto' : ''}`}>
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
