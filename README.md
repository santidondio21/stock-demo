# Dino Inventario — Demo

Demo interactivo del sistema de gestión de inventario Dino.
Cada usuario recibe su propia sesión limpia con 4 productos de ejemplo.

## Deploy

### Backend (Render)
1. Crear nuevo Web Service en Render
2. Apuntar al repositorio, directorio raíz: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Variables de entorno:
   - `MONGO_URL` → tu conexión MongoDB Atlas
   - `DB_NAME` → `dino_demo`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend (Vercel)
1. Crear nuevo proyecto en Vercel
2. Directorio raíz: `frontend`
3. Build command: `yarn build`
4. Output directory: `build`
5. Variables de entorno:
   - `REACT_APP_BACKEND_URL` → URL del backend de Render

## Cómo funciona el demo
- Cada usuario que entra recibe un `session_id` único en `localStorage`
- Sus cambios son propios y no afectan a otros usuarios
- La sesión dura 24 horas y luego se limpia automáticamente
