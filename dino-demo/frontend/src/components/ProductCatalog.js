import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

const optimizeCloudinaryUrl = (url, width = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

const ProductCatalog = ({ categories, cart, onAddToCart, onRemoveFromCart, onSubmitOrder, onClearCart, initialCategory }) => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);

  // Refs para evitar closures viejos en el observer
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const searchRef = useRef('');
  const categoryRef = useRef(initialCategory || 'all');
  const searchTimeout = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchProducts = useCallback(async (p, search, category, reset) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = { page: p, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category_id = category;

      const res = await api.get(`/products`, { params });
      const data = res.data;

      if (reset) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }

      const more = data.length === PAGE_SIZE;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  const resetAndLoad = useCallback((search, category) => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setPage(1);
    setHasMore(true);
    setProducts([]);
    setInitialLoading(true);
    fetchProducts(1, search, category, true);
  }, [fetchProducts]);

  // Carga inicial
  useEffect(() => {
    fetchProducts(1, '', categoryRef.current, true);
  }, []); // eslint-disable-line

  // Si cambia initialCategory desde afuera (click en categoría)
  useEffect(() => {
    if (initialCategory && initialCategory !== categoryRef.current) {
      categoryRef.current = initialCategory;
      setSelectedCategory(initialCategory);
      resetAndLoad(searchRef.current, initialCategory);
    }
  }, [initialCategory, resetAndLoad]);

  // Configurar IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        fetchProducts(nextPage, searchRef.current, categoryRef.current, false);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [fetchProducts]); // solo se recrea si fetchProducts cambia (nunca)

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    searchRef.current = value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      resetAndLoad(value, categoryRef.current);
    }, 400);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    categoryRef.current = value;
    resetAndLoad(searchRef.current, value);
  };

  const isInCart = (productId) => cart.some(item => item.product_id === productId);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const handleSubmitOrder = () => {
    onSubmitOrder();
    setIsCartDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-12"
              data-testid="search-input"
            />
          </div>

          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-64 h-12" data-testid="category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {cart.length > 0 && (
          <Button
            onClick={() => setIsCartDialogOpen(true)}
            className="rounded-full font-bold px-8 h-14"
            style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
            data-testid="view-cart-button"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver Pedido ({cart.length} producto{cart.length !== 1 ? 's' : ''})
          </Button>
        )}
      </div>

      {/* Grid de productos */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-stone-200 animate-pulse" />
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-stone-200 rounded animate-pulse" />
                <div className="h-4 bg-stone-200 rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-2 border-dashed border-stone-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-stone-400 mb-4" />
            <p className="text-lg text-stone-600">No se encontraron productos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(product => (
              <Card
                key={product.id}
                className="border-2 border-transparent hover:border-primary/50 transition-all duration-300 overflow-hidden"
                data-testid={`catalog-product-${product.id}`}
              >
                <div className="aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={optimizeCloudinaryUrl(product.image_url, 400)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400';
                    }}
                  />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>{product.name}</h3>
                      <Badge variant="outline" className="text-xs">{product.code}</Badge>
                    </div>
                    <p className="text-sm text-stone-600 mb-3">{getCategoryName(product.category_id)}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600">Precio:</span>
                        <span className="text-2xl font-bold">${product.precio ? product.precio.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600">Stock disponible:</span>
                        <span className="text-lg font-bold" style={{ color: product.quantity > 10 ? '#A8D5BA' : product.quantity > 0 ? '#FFB380' : '#FF6B6B' }}>
                          {product.quantity} unidades
                        </span>
                      </div>
                    </div>
                  </div>

                  {product.quantity > 0 && (
                    <Button
                      onClick={() => onAddToCart(product, 1)}
                      disabled={isInCart(product.id)}
                      className="w-full rounded-full font-bold"
                      style={{ backgroundColor: isInCart(product.id) ? '#E7E5E4' : '#A8D5BA', color: '#1A1A1A' }}
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      {isInCart(product.id) ? <>✓ Agregado al Pedido</> : (
                        <><ShoppingCart className="h-4 w-4 mr-2" />Agregar al Pedido</>
                      )}
                    </Button>
                  )}

                  {product.quantity === 0 && (
                    <div className="text-center py-3">
                      <Badge style={{ backgroundColor: '#FF6B6B', color: 'white' }}>Sin Stock</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sentinel — trigger de scroll infinito */}
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loading && (
              <div className="flex gap-2 items-center text-stone-500">
                <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Cargando más productos...</span>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-sm text-stone-400">— Todos los productos cargados —</p>
            )}
          </div>
        </>
      )}

      {/* Dialog carrito */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="cart-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Carrito de Compras
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <p className="text-lg text-stone-600">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  📋 Estás seleccionando los productos que necesitas. El depósito definirá las cantidades al despachar tu pedido.
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{item.product.name}</p>
                      <p className="text-sm text-stone-600">Código: {item.product.code}</p>
                      <p className="text-sm font-bold mt-1">${item.product.precio ? item.product.precio.toFixed(2) : '0.00'}</p>
                    </div>
                    <Button
                      onClick={() => onRemoveFromCart(item.product_id)}
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      style={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                      data-testid={`cart-remove-${item.product_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t">
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total productos seleccionados:</span>
                  <span className="text-2xl">{cart.length}</span>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={onClearCart} variant="outline" className="flex-1 rounded-full" data-testid="clear-cart-button">
                    Vaciar Pedido
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    className="flex-1 rounded-full font-bold"
                    style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                    data-testid="submit-order-button"
                  >
                    Enviar Pedido
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCatalog;
