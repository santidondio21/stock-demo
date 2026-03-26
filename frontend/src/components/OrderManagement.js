import React, { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompleteOrderDialog from './CompleteOrderDialog';


const OrderManagement = ({ orders, onRefresh }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState(null);

  const handleCompleteClick = (order) => {
    setOrderToComplete(order);
    setIsCompleteDialogOpen(true);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
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
      className="border border-stone-200 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => viewOrderDetails(order)}
      data-testid={`order-card-${order.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {order.business_name}
            </CardTitle>
            <p className="text-sm text-stone-600">{formatDate(order.created_at)}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Productos solicitados:</span>
            <span className="font-bold">{order.products.length} artículo{order.products.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {order.status === 'pending' && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCompleteClick(order);
            }}
            className="w-full mt-6 rounded-full font-bold"
            style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
            data-testid={`complete-order-${order.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Despachar Pedido
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="pending" data-testid="pending-tab">
            Pendientes ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="completed-tab">
            Completados ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="cancelled-tab">
            Cancelados ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <Card className="border-2 border-dashed border-stone-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Clock className="h-16 w-16 text-stone-400 mb-4" />
                <p className="text-lg text-stone-600">No hay pedidos pendientes</p>
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
                <p className="text-lg text-stone-600">No hay pedidos completados</p>
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
                <p className="text-lg text-stone-600">No hay pedidos cancelados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <h3 className="font-bold text-lg">{selectedOrder.business_name}</h3>
                  <p className="text-sm text-stone-600">{formatDate(selectedOrder.created_at)}</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Productos solicitados:</h4>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.product_name || 'Producto'}</p>
                        <p className="text-sm text-stone-600">Código: {product.product_code || product.product_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{product.quantity}</p>
                        <p className="text-sm text-stone-600">unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total unidades {selectedOrder.status === 'completed' ? 'enviadas' : 'solicitadas'}:</span>
                  <span>{selectedOrder.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CompleteOrderDialog
        order={orderToComplete}
        isOpen={isCompleteDialogOpen}
        onClose={() => {
          setIsCompleteDialogOpen(false);
          setOrderToComplete(null);
        }}
        onSuccess={onRefresh}
      />
    </div>
  );
};

export default OrderManagement;
