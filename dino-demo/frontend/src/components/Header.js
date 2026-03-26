import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Header = ({ pendingOrdersCount, userRole, onLogout }) => {
  const getRoleName = () => {
    if (userRole === 'deposito') return 'Depósito';
    if (userRole === 'negocio1') return 'Dino La Falda';
    if (userRole === 'negocio2') return 'Dino Carlos Paz';
    return 'Usuario';
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm" data-testid="header">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <img
              src="https://customer-assets.emergentagent.com/job_stock-sync-17/artifacts/m8xlmjcp_Screenshot_20251030_161924_Instagram.png"
              alt="Dino Logo"
              className="h-16 w-16 object-contain"
              data-testid="header-logo"
            />
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#1A1A1A' }}>
                {getRoleName()}
              </h2>
            </div>
            {pendingOrdersCount > 0 && (
              <Badge
                className="text-sm font-bold px-3 py-1"
                style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
                data-testid="pending-orders-badge"
              >
                {pendingOrdersCount} pedido{pendingOrdersCount !== 1 ? 's' : ''} pendiente{pendingOrdersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <Button
            onClick={onLogout}
            variant="outline"
            className="rounded-full font-medium px-6"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
