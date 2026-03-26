import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post(`/auth/login`, { username, password });
      login(
        { username: response.data.username, role: response.data.role },
        response.data.access_token
      );
      toast.success('¡Bienvenido!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#FAFAF9' }}
      data-testid="login-page"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-12">
          <img
            src="https://customer-assets.emergentagent.com/job_stock-sync-17/artifacts/m8xlmjcp_Screenshot_20251030_161924_Instagram.png"
            alt="Dino Logo"
            className="h-32 w-32 object-contain"
            data-testid="logo"
          />
        </div>
        
        <Card className="border-2 border-stone-200 shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl font-bold text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sistema de Gestión de Inventario Dino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                  className="h-12 rounded-lg"
                  data-testid="username-input"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  className="h-12 rounded-lg"
                  data-testid="password-input"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-bold rounded-full"
                style={{
                  backgroundColor: '#A8D5BA',
                  color: '#1A1A1A'
                }}
                data-testid="login-button"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-stone-600">
          <p className="mb-2">Usuarios de prueba:</p>
          <p>deposito / admin123</p>
          <p>negocio1 / negocio123</p>
          <p>negocio2 / negocio123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
