# Dino Inventory System - PRD

## Overview
Sistema de inventario para la empresa "Dino" con un depósito central y dos negocios (Dino La Falda y Dino Carlos Paz).

## Core Requirements

### Users
- **Depósito (Warehouse)**: Gestiona productos, categorías y despacha pedidos
- **Negocios (Businesses)**: Ver catálogo de productos y realizar pedidos

### Features Implemented

#### Product Management
- CRUD de productos con código, nombre, imagen (Cloudinary), cantidad y precio
- Categorías para organizar productos
- Historial de movimientos de stock por producto
- Campo de **Ingreso de Stock** para sumar unidades
- Campo de **Egreso de Stock** para restar unidades manualmente

#### Order Flow
- Los negocios seleccionan productos sin especificar cantidad
- El depósito define las cantidades al completar el pedido
- El stock se actualiza automáticamente al completar pedidos

#### Search
- Búsqueda flexible insensible a:
  - Mayúsculas/minúsculas
  - Acentos (bateria → Batería)
  - Caracteres corruptos de importación CSV

#### Session & Cart Persistence
- El usuario seleccionado se guarda en localStorage
- El carrito de compras persiste por usuario (dino_cart_{role})
- El carrito se limpia automáticamente tras enviar pedido exitosamente

#### Image Optimization
- Imágenes optimizadas con Cloudinary (f_auto, q_auto, w_400)
- Lazy loading en imágenes del catálogo

#### PWA Support
- manifest.json con ícono de Dino
- apple-touch-icon para dispositivos iOS
- theme_color: #A8D5BA (verde Dino)

## Technical Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Image Storage**: Cloudinary

## Database Schema
- `products`: id, code, name, image_url, quantity, category_id, precio
- `categories`: id, name
- `orders`: id, business_id, business_name, products[], status, created_at, completed_at
- `product_movements`: id, product_id, type, quantity_before, quantity_after, quantity_change, description

## API Endpoints
- `GET/POST /api/products` - Listar/crear productos
- `PUT /api/products/{id}` - Actualizar producto (incluye ingreso/egreso)
- `GET /api/products/{id}/movements` - Historial de movimientos
- `GET/POST /api/categories` - Listar/crear categorías
- `GET/POST /api/orders` - Listar/crear pedidos
- `PUT /api/orders/{id}/complete` - Completar pedido
- `POST /api/upload-image` - Subir imagen a Cloudinary

## Completed Features (March 2026)
- [x] Persistencia de sesión y carrito con localStorage
- [x] Limpieza automática del carrito tras pedido exitoso
- [x] Búsqueda flexible (acentos, mayúsculas, caracteres corruptos)
- [x] Optimización de imágenes Cloudinary
- [x] Ícono PWA para pantalla de inicio móvil
- [x] Campo de egreso de stock manual

## Known Issues
- Algunos nombres de productos tienen caracteres corruptos (\\ufffd) de la importación CSV original
- La mayoría de productos usan imágenes placeholder de Unsplash (solo ~5 tienen imágenes reales de Cloudinary)

## Future Enhancements
- Reportes de ventas y stock
- Notificaciones push para pedidos nuevos
- Exportación de datos a Excel/CSV
- Multi-idioma
