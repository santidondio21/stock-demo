import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCatalog from '@/components/ProductCatalog';
import OrderHistory from '@/components/OrderHistory';
import { ShoppingCart, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const CART_STORAGE_KEY = 'dino_cart';

const NegocioDashboard = ({ userRole, onLogout }) => {
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(() => {
    // Recuperar carrito guardado de localStorage
    try {
      const savedCart = localStorage.getItem(`${CART_STORAGE_KEY}_${userRole}`);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [initialCategoryFilter, setInitialCategoryFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [categoriesRes, ordersRes] = await Promise.all([
        api.get(`/categories`),
        api.get(`/orders`)
      ]);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(`${CART_STORAGE_KEY}_${userRole}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, userRole]);

  const addToCart = (product, quantity) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.info('Este producto ya está en tu pedido');
      return;
    }
    setCart([...cart, { product_id: product.id, product }]);
    toast.success(`${product.name} agregado al pedido`);
  };

  const updateCartItem = (productId, quantity) => {
    // No longer used in new flow
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
    toast.success('Producto eliminado del pedido');
  };

  const clearCart = () => {
    setCart([]);
    // Limpiar también del localStorage
    try {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${userRole}`);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('El pedido está vacío');
      return;
    }

    try {
      const orderProducts = cart.map(item => ({
        product_id: item.product_id
      }));
      
      const response = await api.post(`/orders?business_role=${userRole}`, { products: orderProducts });
      
      // Solo limpiar el carrito si el servidor responde exitosamente (200/201)
      if (response.status === 200 || response.status === 201) {
        toast.success('Pedido enviado exitosamente. El depósito definirá las cantidades.');
        clearCart();
        fetchData();
        setActiveTab('history');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar pedido');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  const businessName = userRole === 'negocio1' ? 'Dino La Falda' : 'Dino Carlos Paz';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <Header userRole={userRole} onLogout={onLogout} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {businessName}
            </h1>
            <p className="text-lg text-stone-600">Catálogo de productos y pedidos</p>
          </div>
          {cart.length > 0 && (
            <div className="relative">
              <Badge
                className="text-lg px-4 py-2"
                style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
                data-testid="cart-badge"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {cart.length} producto{cart.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14" data-testid="negocio-tabs">
            <TabsTrigger value="catalog" className="text-base font-medium" data-testid="catalog-tab">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base font-medium" data-testid="history-tab">
              <History className="h-5 w-5 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ProductCatalog
              categories={categories}
              cart={cart}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onSubmitOrder={submitOrder}
              onClearCart={clearCart}
              initialCategory={initialCategoryFilter}
            />
          </TabsContent>

          <TabsContent value="history">
            <OrderHistory orders={orders} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NegocioDashboard;
