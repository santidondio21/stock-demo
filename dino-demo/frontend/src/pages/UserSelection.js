import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Store } from 'lucide-react';

const UserSelection = ({ onSelectUser }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#FAFAF9' }}
      data-testid="user-selection-page"
    >
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-12">
          <img
            src="https://customer-assets.emergentagent.com/job_stock-sync-17/artifacts/m8xlmjcp_Screenshot_20251030_161924_Instagram.png"
            alt="Dino Logo"
            className="h-32 w-32 object-contain"
            data-testid="logo"
          />
        </div>
        
        <Card className="border-2 border-stone-200 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-4xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Sistema de Gestión Dino
            </CardTitle>
            <CardDescription className="text-lg">
              Selecciona tu perfil para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Depósito */}
              <Card 
                className="border-2 border-stone-200 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl"
                onClick={() => onSelectUser('deposito')}
                data-testid="select-deposito"
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#A8D5BA' }}
                  >
                    <Building2 className="h-10 w-10" style={{ color: '#1A1A1A' }} />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Depósito
                  </h3>
                  <p className="text-sm text-stone-600">
                    Gestionar productos, categorías y despachar pedidos
                  </p>
                  <Button
                    className="w-full mt-4 rounded-full font-bold h-12"
                    style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                  >
                    Ingresar
                  </Button>
                </CardContent>
              </Card>

              {/* Negocio 1 */}
              <Card 
                className="border-2 border-stone-200 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl"
                onClick={() => onSelectUser('negocio1')}
                data-testid="select-negocio1"
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FFB380' }}
                  >
                    <Store className="h-10 w-10" style={{ color: '#1A1A1A' }} />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    La Falda
                  </h3>
                  <p className="text-sm text-stone-600">
                    Ver productos y hacer pedidos
                  </p>
                  <Button
                    className="w-full mt-4 rounded-full font-bold h-12"
                    style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
                  >
                    Ingresar
                  </Button>
                </CardContent>
              </Card>

              {/* Negocio 2 */}
              <Card 
                className="border-2 border-stone-200 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl"
                onClick={() => onSelectUser('negocio2')}
                data-testid="select-negocio2"
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FFB380' }}
                  >
                    <Store className="h-10 w-10" style={{ color: '#1A1A1A' }} />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Carlos Paz
                  </h3>
                  <p className="text-sm text-stone-600">
                    Ver productos y hacer pedidos
                  </p>
                  <Button
                    className="w-full mt-4 rounded-full font-bold h-12"
                    style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
                  >
                    Ingresar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSelection;
