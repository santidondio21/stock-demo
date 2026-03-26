import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, Clock, XCircle, Edit, X, Package, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const OrderHistory = ({ orders, onRefresh }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProducts, setEditProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products`);
      setAllProducts(response.data);
    } catch (error) {
      console.error('Error loading products');
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido?')) return;
    
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Pedido cancelado');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al cancelar pedido');
    }
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setEditProducts([...order.products]);
    
    // Get products not in current order
    const orderProductIds = order.products.map(p => p.product_id);
    const available = allProducts.filter(p => !orderProductIds.includes(p.id));
    setAvailableProducts(available);
    setIsEditDialogOpen(true);
  };

  const handleRemoveProduct = (productId) => {
    setEditProducts(editProducts.filter(p => p.product_id !== productId));
    
    // Add back to available products
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      setAvailableProducts([...availableProducts, product]);
    }
  };

  const handleAddProduct = (product) => {
    const newProduct = {
      product_id: product.id,
      product_name: product.name,
      product_code: product.code
    };
    setEditProducts([...editProducts, newProduct]);
    setAvailableProducts(availableProducts.filter(p => p.id !== product.id));
  };

  const handleEditSubmit = async () => {
    try {
      if (editProducts.length === 0) {
        toast.error('El pedido debe tener al menos un producto');
        return;
      }

      const updatedProducts = editProducts.map(p => ({
        product_id: p.product_id
      }));

      await api.put(`/orders/${selectedOrder.id}`, { products: updatedProducts });
      toast.success('Pedido actualizado');
      setIsEditDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al actualizar pedido');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return (
        <Badge className="font-bold" style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}>
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    }
    if (status === 'completed') {
      return (
        <Badge className="font-bold" style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      );
    }
    return (
      <Badge className="font-bold" style={{ backgroundColor: '#F5F5F4', color: '#1A1A1A' }}>
        <XCircle className="h-3 w-3 mr-1" />
        Cancelado
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const OrderCard = ({ order }) => (
    <Card
      className="border border-stone-200 hover:shadow-md transition-all duration-300"
      data-testid={`history-order-${order.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Pedido #{order.id.slice(0, 8)}
            </CardTitle>
            <p className="text-sm text-stone-600">{formatDate(order.created_at)}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Productos solicitados:</span>
            <span className="font-bold">{order.products.length}</span>
          </div>
          {order.status === 'completed' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Unidades recibidas:</span>
              <span className="font-bold">{order.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => viewOrderDetails(order)}
            variant="outline"
            className="flex-1 rounded-full"
            data-testid={`view-order-${order.id}`}
          >
            Ver Detalles
          </Button>
          {order.status === 'pending' && (
            <>
              <Button
                onClick={() => openEditDialog(order)}
                variant="outline"
                className="rounded-full"
                data-testid={`edit-order-${order.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleCancel(order.id)}
                variant="outline"
                className="rounded-full"
                style={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                data-testid={`cancel-order-${order.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="pending" data-testid="history-pending-tab">
            Pendientes ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="history-completed-tab">
            Completados ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="history-cancelled-tab">
            Cancelados ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <Card className="border-2 border-dashed border-stone-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Clock className="h-16 w-16 text-stone-400 mb-4" />
                <p className="text-lg text-stone-600">No tienes pedidos pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedOrders.length === 0 ? (
            <Card className="border-2 border-dashed border-stone-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-stone-400 mb-4" />
                <p className="text-lg text-stone-600">No tienes pedidos completados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelledOrders.length === 0 ? (
            <Card className="border-2 border-dashed border-stone-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <XCircle className="h-16 w-16 text-stone-400 mb-4" />
                <p className="text-lg text-stone-600">No tienes pedidos cancelados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Detalles del Pedido
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="font-bold text-lg">Pedido #{selectedOrder.id.slice(0, 8)}</h3>
                  <p className="text-sm text-stone-600">{formatDate(selectedOrder.created_at)}</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Productos {selectedOrder.status === 'completed' ? 'recibidos' : 'solicitados'}:</h4>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.product_name || 'Producto'}</p>
                        <p className="text-sm text-stone-600">Código: {product.product_code || product.product_id}</p>
                      </div>
                      {selectedOrder.status === 'completed' && (
                        <div className="text-right">
                          <p className="font-bold text-lg">{product.quantity || 0}</p>
                          <p className="text-sm text-stone-600">unidades</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrder.status === 'completed' && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total unidades recibidas:</span>
                    <span>{selectedOrder.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Editar Pedido
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Agrega o quita productos de tu pedido. El depósito definirá las cantidades al despachar.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Productos en el pedido:</h4>
                {editProducts.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-stone-400" />
                    <p>No hay productos en el pedido</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.product_name || 'Producto'}</p>
                          <p className="text-sm text-stone-600">Código: {product.product_code || product.product_id}</p>
                        </div>
                        <Button
                          onClick={() => handleRemoveProduct(product.product_id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          style={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {availableProducts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Agregar productos:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-stone-600">Código: {product.code} | Stock: {product.quantity}</p>
                        </div>
                        <Button
                          onClick={() => handleAddProduct(product)}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A', borderColor: '#A8D5BA' }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={editProducts.length === 0}
                  className="rounded-full font-bold"
                  style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                  data-testid="save-edit-order"
                >
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
