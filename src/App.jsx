import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Deals from './components/Deals';
import CategorySection from './components/CategorySection';
import InquiryForm from './components/InquiryForm';
import RecommendedItems from './components/RecommendedItems';
import Services from './components/Services';
import RegionSuppliers from './components/RegionSuppliers';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import ProductListing from './components/ProductListing';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Messages from './components/Messages';
import Orders from './components/Orders';
import Favorites from './components/Favorites';
import ShippingAddress from './components/ShippingAddress';
import PaymentMethods from './components/PaymentMethods';
import AuthModal from './components/AuthModal';
import AdminPortal from './components/AdminPortal';
import { useAuth } from './context/AuthContext';

// Category Banner Images (static assets — kept as-is)
import homeBanner from './assets/Image/backgrounds/image 98.png';
import electronicsBanner from './assets/Image/backgrounds/image 106.png';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();

  // Automatically redirect to admin portal when an admin logs in
  useEffect(() => {
    if (profile?.isAdmin) {
      setCurrentPage('admin');
    } else if (currentPage === 'admin' && (!profile || !profile.isAdmin)) {
      setCurrentPage('home');
    }
  }, [profile]);

  // Dynamic category product data from API
  const [homeItems, setHomeItems] = useState([]);
  const [electronicsItems, setElectronicsItems] = useState([]);

  useEffect(() => {
    // Fetch Home & Outdoor category products
    fetch('/api/products?category=home-outdoor&limit=8')
      .then((r) => r.json())
      .then((data) => {
        const items = (data.products || []).map((p) => ({
          id: p.id,
          name: p.title,
          price: String(p.price),
          image: p.image || '',
        }));
        setHomeItems(items);
      })
      .catch((err) => console.error('Failed to load home items:', err));

    // Fetch Consumer Electronics category products
    fetch('/api/products?category=electronics&limit=8')
      .then((r) => r.json())
      .then((data) => {
        const items = (data.products || []).map((p) => ({
          id: p.id,
          name: p.title,
          price: String(p.price),
          image: p.image || '',
        }));
        setElectronicsItems(items);
      })
      .catch((err) => console.error('Failed to load electronics items:', err));
  }, []);

  // Navigate to product details with a product ID
  const goToDetails = (productId) => {
    setSelectedProductId(productId);
    setCurrentPage('details');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'listing':
        return (
          <ProductListing
            setPage={setCurrentPage}
            onProductClick={goToDetails}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'details':
        return <ProductDetails setPage={setCurrentPage} productId={selectedProductId} />;
      case 'cart':
        return <Cart setPage={setCurrentPage} onAuthRequired={() => setShowAuthModal(true)} />;
      case 'favorites':
        return <Favorites setPage={setCurrentPage} onProductClick={goToDetails} />;
      case 'profile':
        return <Profile setPage={setCurrentPage} onAuthRequired={() => setShowAuthModal(true)} />;
      case 'message':
        return <Messages setPage={setCurrentPage} />;
      case 'orders':
        return <Orders setPage={setCurrentPage} onAuthRequired={() => setShowAuthModal(true)} />;
      case 'shipping':
        return <ShippingAddress setPage={setCurrentPage} onAuthRequired={() => setShowAuthModal(true)} />;
      case 'payments':
        return <PaymentMethods setPage={setCurrentPage} onAuthRequired={() => setShowAuthModal(true)} />;
      default:
        return (
          <div className="container">
            <Hero
              setPage={setCurrentPage}
              onAuthRequired={() => setShowAuthModal(true)}
              onCategoryClick={(cat) => {
                const categoryName = typeof cat === 'string' ? cat : cat?.name;
                if (!categoryName) return;
                setSearchQuery(categoryName);
                setCurrentPage('listing');
              }}
            />
            <Deals setPage={setCurrentPage} onProductClick={goToDetails} />

            <CategorySection
              title="Home and outdoor"
              bannerBg="#FFE6BF"
              bannerImg={homeBanner}
              items={homeItems}
              setPage={setCurrentPage}
              onProductClick={goToDetails}
              categorySlug="home-outdoor"
              setSearchQuery={setSearchQuery}
            />

            <CategorySection
              title="Consumer electronics"
              bannerBg="#E5F1FF"
              bannerImg={electronicsBanner}
              items={electronicsItems}
              setPage={setCurrentPage}
              onProductClick={goToDetails}
              categorySlug="electronics"
              setSearchQuery={setSearchQuery}
            />

            <InquiryForm />
            <RecommendedItems setPage={setCurrentPage} onProductClick={goToDetails} />
            <Services />
            <RegionSuppliers />
          </div>
        );
    }
  };

  if (currentPage === 'admin') {
    return <AdminPortal setPage={setCurrentPage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--site-bg)] font-jakarta">
      <Header
        setPage={setCurrentPage}
        onAuthRequired={() => setShowAuthModal(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-grow pb-12">
        {renderContent()}
      </main>

      <Newsletter />
      <Footer />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default App;
