const FAVORITES_KEY = 'favoriteProducts';

const readFavorites = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFavorites = (items) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
};

export const getFavorites = () => readFavorites();

export const isFavorite = (productId) => {
  return readFavorites().some((item) => item.id === productId);
};

export const toggleFavorite = (product) => {
  if (!product?.id) return readFavorites();
  const list = readFavorites();
  const exists = list.some((item) => item.id === product.id);

  let next;
  if (exists) {
    next = list.filter((item) => item.id !== product.id);
  } else {
    next = [
      ...list,
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image || product.imageUrls?.[0] || null,
        brand: product.brand || null,
      }
    ];
  }

  writeFavorites(next);
  return next;
};
