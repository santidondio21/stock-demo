import React, { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';


const CategoryManagement = ({ categories, onRefresh, onNavigateToProducts }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');

  const resetForm = () => {
    setName('');
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name });
        toast.success('Categoría actualizada');
      } else {
        await api.post(`/categories`, { name });
        toast.success('Categoría creada');
      }
      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar categoría');
    }
  };

  const handleDelete = async (categoryId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Categoría eliminada');
      onRefresh();
    } catch (error) {
      toast.error('Error al eliminar categoría');
    }
  };

  const handleEditClick = (category, e) => {
    e.stopPropagation();
    openEditDialog(category);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Categorías</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="rounded-full font-bold px-8"
              style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
              data-testid="add-category-button"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juguetes, Ropa, Accesorios..."
                  required
                  data-testid="category-name-input"
                />
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
                  data-testid="save-category-button"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="border-2 border-dashed border-stone-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tag className="h-16 w-16 text-stone-400 mb-4" />
            <p className="text-lg text-stone-600">No hay categorías aún</p>
            <p className="text-sm text-stone-500">Crea tu primera categoría para organizar productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <Card
              key={category.id}
              className="border border-stone-200 hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1"
              data-testid={`category-card-${category.id}`}
              onClick={() => onNavigateToProducts && onNavigateToProducts(category.id)}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8D5BA' }}>
                    <Tag className="h-10 w-10" style={{ color: '#1A1A1A' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {category.name}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={(e) => handleEditClick(category, e)}
                    variant="outline"
                    className="flex-1 rounded-full"
                    data-testid={`edit-category-${category.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={(e) => handleDelete(category.id, e)}
                    variant="outline"
                    className="rounded-full"
                    style={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                    data-testid={`delete-category-${category.id}`}
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

export default CategoryManagement;
