import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Search, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from './ImageUploader';


// Helper para optimizar URLs de Cloudinary
const optimizeCloudinaryUrl = (url, width = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insertar transformaciones: f_auto (formato automático), q_auto (calidad automática), w_XXX (ancho)
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

// Helper para normalizar texto (eliminar acentos para búsqueda)
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (acentos)
    .toLowerCase();
};

// Crear regex flexible desde el término de búsqueda
const createFlexiblePattern = (searchTerm) => {
  const normalized = normalizeText(searchTerm);
  const accentableChars = 'aeioun'; // Caracteres que frecuentemente tienen acentos/tildes
  let pattern = '';
  for (const char of normalized) {
    pattern += '[\ufffd]*'; // Permitir caracteres corruptos opcionales
    if (accentableChars.includes(char)) {
      pattern += `(?:${char}|[\ufffd]+)`;
    } else {
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  pattern += '[\ufffd]*';
  return pattern;
};

// Función de búsqueda flexible que maneja caracteres corruptos y acentos
const searchMatches = (text, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return true;
  if (!text) return false;
  
  const normalizedSearch = normalizeText(searchTerm);
  const normalizedText = normalizeText(text);
  
  // Coincidencia directa
  if (normalizedText.includes(normalizedSearch)) return true;
  
  // Regex flexible para caracteres corruptos
  try {
    const pattern = createFlexiblePattern(searchTerm);
    const regex = new RegExp(pattern, 'i');
    if (regex.test(normalizedText)) return true;
  } catch (e) {}
  
  // Último intento: eliminar corruptos y buscar
  const cleanText = text.replace(/\ufffd/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return cleanText.includes(normalizedSearch);
};

const ProductManagement = ({ products, categories, onRefresh, initialCategoryFilter }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter || 'all');

  useEffect(() => {
    if (initialCategoryFilter) {
      setSelectedCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);
  const [ingresoValue, setIngresoValue] = useState(0);
  const [egresoValue, setEgresoValue] = useState(0); // Nuevo estado para egreso
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [originalQuantity, setOriginalQuantity] = useState(0); // Para detectar cambios manuales
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    image_url: '',
    quantity: 0,
    category_id: '',
    precio: 0
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      image_url: '',
      quantity: 0,
      category_id: '',
      precio: 0
    });
    setEditingProduct(null);
    setIngresoValue(0);
    setEgresoValue(0);
    setMovements([]);
    setOriginalQuantity(0);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setOriginalQuantity(product.quantity); // Guardar cantidad original
    setFormData({
      code: product.code,
      name: product.name,
      image_url: product.image_url,
      quantity: product.quantity,
      category_id: product.category_id,
      precio: product.precio || 0
    });
    setIngresoValue(0);
    setEgresoValue(0);
    fetchMovements(product.id);
    setIsDialogOpen(true);
  };

  const fetchMovements = async (productId) => {
    setLoadingMovements(true);
    try {
      const response = await api.get(`/products/${productId}/movements`);
      setMovements(response.data);
    } catch (error) {
      console.error('Error al cargar historial');
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Al editar, solo enviar quantity si cambió MANUALMENTE (no por ingreso de stock)
        // Si quantity cambió por ingreso de stock, ya está actualizado en backend
        const quantityChangedManually = formData.quantity !== originalQuantity && 
                                        formData.quantity !== (originalQuantity + ingresoValue);
        
        let dataToSend = { ...formData };
        
        // Si la cantidad no cambió manualmente, no la enviamos
        if (!quantityChangedManually) {
          delete dataToSend.quantity;
        }
        
        await api.put(`/products/${editingProduct.id}`, dataToSend);
        toast.success('Producto actualizado');
      } else {
        await api.post(`/products`, formData);
        toast.success('Producto creado');
      }
      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar producto');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Producto eliminado');
      onRefresh();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleIngreso = async (productId, ingresoAmount) => {
    if (ingresoAmount <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    try {
      await api.put(`/products/${productId}`, { ingreso: ingresoAmount });
      toast.success(`Stock actualizado: +${ingresoAmount} unidades`);
      
      // Actualizar el formData con el nuevo stock
      const newQuantity = formData.quantity + ingresoAmount;
      setFormData({ ...formData, quantity: newQuantity });
      
      // También actualizar originalQuantity para que handleSubmit sepa que ya se aplicó
      setOriginalQuantity(newQuantity);
      
      setIngresoValue(0);
      onRefresh();
      fetchMovements(productId);
    } catch (error) {
      toast.error('Error al actualizar stock');
    }
  };

  const handleEgreso = async (productId, egresoAmount) => {
    if (egresoAmount <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    if (egresoAmount > formData.quantity) {
      toast.error(`Stock insuficiente. Stock actual: ${formData.quantity}`);
      return;
    }
    try {
      await api.put(`/products/${productId}`, { egreso: egresoAmount });
      toast.success(`Stock actualizado: -${egresoAmount} unidades`);
      
      // Actualizar el formData con el nuevo stock
      const newQuantity = formData.quantity - egresoAmount;
      setFormData({ ...formData, quantity: newQuantity });
      
      // También actualizar originalQuantity para que handleSubmit sepa que ya se aplicó
      setOriginalQuantity(newQuantity);
      
      setEgresoValue(0);
      onRefresh();
      fetchMovements(productId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al actualizar stock');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      searchMatches(p.name, searchTerm) ||
      searchMatches(p.code, searchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
                data-testid="product-search-input"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64 h-12" data-testid="product-category-filter">
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
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="rounded-full font-bold px-8"
              style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
              data-testid="add-product-button"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            
            {editingProduct ? (
              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="data">Datos del Producto</TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Historial
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="data">
                  <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    data-testid="product-code-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="product-name-input"
                  />
                </div>
              </div>
              
              <ImageUploader
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">{editingProduct ? 'Stock Actual' : 'Cantidad Inicial'}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    data-testid="product-quantity-input"
                  />
                  {editingProduct && (
                    <p className="text-xs text-stone-600">
                      💡 Puedes editarlo manualmente o usar "Ingreso de Stock" abajo
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    data-testid="product-precio-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {editingProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="ingreso">Ingreso de Stock</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ingreso"
                        type="number"
                        placeholder="Cantidad"
                        min="0"
                        value={ingresoValue}
                        onChange={(e) => setIngresoValue(parseInt(e.target.value) || 0)}
                        data-testid="product-ingreso-input"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          handleIngreso(editingProduct.id, ingresoValue);
                        }}
                        disabled={ingresoValue <= 0}
                        className="rounded-full font-bold whitespace-nowrap"
                        style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                        data-testid="apply-ingreso-button"
                      >
                        +Sumar
                      </Button>
                    </div>
                  </div>
                )}
                {editingProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="egreso">Egreso de Stock</Label>
                    <div className="flex gap-2">
                      <Input
                        id="egreso"
                        type="number"
                        placeholder="Cantidad"
                        min="0"
                        value={egresoValue}
                        onChange={(e) => setEgresoValue(parseInt(e.target.value) || 0)}
                        data-testid="product-egreso-input"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          handleEgreso(editingProduct.id, egresoValue);
                        }}
                        disabled={egresoValue <= 0 || egresoValue > formData.quantity}
                        className="rounded-full font-bold whitespace-nowrap"
                        style={{ backgroundColor: '#FF6B6B', color: 'white' }}
                        data-testid="apply-egreso-button"
                      >
                        −Restar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {editingProduct && (
                <p className="text-sm text-stone-600 bg-stone-100 p-3 rounded-lg">
                  Stock actual: <strong>{formData.quantity} unidades</strong>. Usa Ingreso/Egreso para cambios de inventario o edita el campo "Stock Actual" para ajustes manuales.
                </p>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger data-testid="product-category-select">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-full font-bold"
                  style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                  data-testid="save-product-button"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              {loadingMovements ? (
                <div className="text-center py-8">
                  <p className="text-stone-600">Cargando historial...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-stone-400 mx-auto mb-4" />
                  <p className="text-lg text-stone-600">Sin movimientos registrados</p>
                  <p className="text-sm text-stone-500">Los cambios de stock aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <Card key={movement.id} className="border border-stone-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {movement.quantity_change > 0 ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                              )}
                              <span className="font-semibold text-lg">
                                {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} unidades
                              </span>
                            </div>
                            <p className="text-sm text-stone-600 mb-1">{movement.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-stone-500">
                              <span>Stock anterior: {movement.quantity_before}</span>
                              <span>→</span>
                              <span>Stock nuevo: {movement.quantity_after}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {movement.type === 'ingreso' ? 'Ingreso' : movement.type === 'manual' ? 'Manual' : 'Pedido'}
                            </Badge>
                            <p className="text-xs text-stone-500 mt-2">
                              {new Date(movement.created_at).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                data-testid="product-code-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="product-name-input"
              />
            </div>
          </div>
          
          <ImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
          />
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
                min="0"
                data-testid="product-quantity-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                data-testid="product-precio-input"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              required
            >
              <SelectTrigger data-testid="product-category-select">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full font-bold"
              style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
              data-testid="save-product-button"
            >
              Crear
            </Button>
          </DialogFooter>
        </form>
      )}
          </DialogContent>
        </Dialog>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="border-2 border-dashed border-stone-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-stone-400 mb-4" />
            <p className="text-lg text-stone-600">No se encontraron productos</p>
            <p className="text-sm text-stone-500">Intenta con otra búsqueda o categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300" data-testid={`product-card-${product.id}`}>
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">Precio:</span>
                    <span className="text-xl font-bold">${product.precio ? product.precio.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Stock:</span>
                    <span className="text-2xl font-bold" style={{ color: product.quantity > 0 ? '#A8D5BA' : '#FF6B6B' }}>
                      {product.quantity}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => openEditDialog(product)}
                    variant="outline"
                    className="flex-1 rounded-full"
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    variant="outline"
                    className="rounded-full"
                    style={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                    data-testid={`delete-product-${product.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
