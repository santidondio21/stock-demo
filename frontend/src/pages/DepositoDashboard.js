import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductManagement from '@/components/ProductManagement';
import CategoryManagement from '@/components/CategoryManagement';
import OrderManagement from '@/components/OrderManagement';
import { Package, ShoppingCart, Tag } from 'lucide-react';


const DepositoDashboard = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        api.get(`/orders`),
        api.get(`/products`),
        api.get(`/categories`)
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
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

  const pendingOrders = orders.filter(o => o.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <Header pendingOrdersCount={pendingOrders.length} userRole="deposito" onLogout={onLogout} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Panel de Depósito
          </h1>
          <p className="text-lg text-stone-600">Gestiona productos, categorías y pedidos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600 uppercase tracking-wider">Pedidos Pendientes</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#FFB380' }}>{pendingOrders.length}</p>
              </div>
              <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFB380' }}>
                <ShoppingCart className="h-8 w-8" style={{ color: '#1A1A1A' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600 uppercase tracking-wider">Total Productos</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#A8D5BA' }}>{products.length}</p>
              </div>
              <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8D5BA' }}>
                <Package className="h-8 w-8" style={{ color: '#1A1A1A' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600 uppercase tracking-wider">Categorías</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#1A1A1A' }}>{categories.length}</p>
              </div>
              <div className="h-16 w-16 rounded-full flex items-center justify-between" style={{ backgroundColor: '#F5F5F4' }}>
                <Tag className="h-8 w-8 mx-auto" style={{ color: '#1A1A1A' }} />
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14" data-testid="deposito-tabs">
            <TabsTrigger value="orders" className="text-base font-medium" data-testid="orders-tab">Pedidos</TabsTrigger>
            <TabsTrigger value="products" className="text-base font-medium" data-testid="products-tab">Productos</TabsTrigger>
            <TabsTrigger value="categories" className="text-base font-medium" data-testid="categories-tab">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderManagement orders={orders} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement products={products} categories={categories} onRefresh={fetchData} initialCategoryFilter={selectedCategoryFilter} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement
                categories={categories}
                onRefresh={fetchData}
                onNavigateToProducts={(categoryId) => {
                  setSelectedCategoryFilter(categoryId);
                  setActiveTab('products');
                }}
              />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DepositoDashboard;
