import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle } from 'lucide-react';


// Helper para optimizar URLs de Cloudinary
const optimizeCloudinaryUrl = (url, width = 200) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

const CompleteOrderDialog = ({ order, isOpen, onClose, onSuccess }) => {
  const [quantities, setQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      fetchProducts();
      const initialQuantities = {};
      order.products.forEach(p => {
        initialQuantities[p.product_id] = 0;
      });
      setQuantities(initialQuantities);
    }
  }, [order, isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.quantity : 0;
  };

  const getProductImage = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.image_url : 'https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400';
  };

  const handleComplete = async () => {
    const hasQuantities = Object.values(quantities).some(q => q > 0);
    if (!hasQuantities) {
      toast.error('Debes ingresar al menos una cantidad para enviar');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/complete`, { quantities });
      toast.success('Pedido completado y stock actualizado');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al completar pedido');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="complete-order-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Completar Pedido - {order.business_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-800">
                Ingresa la cantidad a enviar de cada producto. El stock se actualizará automáticamente.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {order.products.map((orderProduct, index) => {
              const currentStock = getProductStock(orderProduct.product_id);
              const productImage = getProductImage(orderProduct.product_id);
              const quantityToSend = quantities[orderProduct.product_id] || 0;
              const hasError = quantityToSend > currentStock;

              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-2 ${hasError ? 'bg-red-50 border-red-300' : 'bg-stone-50 border-stone-200'}`}
                  data-testid={`complete-order-product-${orderProduct.product_id}`}
                >
                  <div className="flex gap-4 mb-3">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0">
                      <img
                        src={optimizeCloudinaryUrl(productImage, 200)}
                        alt={orderProduct.product_name}
                        className="w-20 h-20 object-cover rounded-lg border border-stone-200"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400';
                        }}
                      />
                    </div>
                    
                    {/* Información del producto */}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">{orderProduct.product_name || 'Producto'}</p>
                        <p className="text-sm text-stone-600">Código: {orderProduct.product_code || orderProduct.product_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-stone-600">Stock Disponible</p>
                        <p className={`text-2xl font-bold ${hasError ? 'text-red-600' : 'text-green-600'}`}>
                          {currentStock}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${orderProduct.product_id}`} className="text-sm font-medium">
                      Cantidad a Enviar
                    </Label>
                    <Input
                      id={`quantity-${orderProduct.product_id}`}
                      type="number"
                      min="0"
                      max={currentStock}
                      value={quantities[orderProduct.product_id] || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setQuantities({ ...quantities, [orderProduct.product_id]: value });
                      }}
                      className="text-lg font-bold"
                      placeholder="0"
                      data-testid={`quantity-input-${orderProduct.product_id}`}
                    />
                    {hasError && (
                      <p className="text-sm text-red-600">
                        ⚠️ Cantidad excede el stock disponible
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total unidades a enviar:</span>
              <span className="text-2xl" style={{ color: '#A8D5BA' }}>
                {Object.values(quantities).reduce((sum, q) => sum + q, 0)}
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={loading || Object.values(quantities).every(q => q === 0)}
            className="rounded-full font-bold"
            style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
            data-testid="confirm-complete-order"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Completando...' : 'Completar Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteOrderDialog;
