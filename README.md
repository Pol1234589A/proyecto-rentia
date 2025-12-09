# RentiaRoom CRM

Sistema de gestión inmobiliaria con integración segura a Rentger.

## 🔐 Seguridad de API Keys

La API key de Rentger está **protegida** mediante Vercel Serverless Functions. 
Nunca se expone en el código del frontend.

## 📁 Estructura del Proyecto

```
rentiaroom/
├── api/                          # 🔒 Backend Seguro (Vercel Serverless Functions)
│   └── rentger/
│       ├── ping.ts               # Verificar conexión con Rentger
│       ├── sync-owner.ts         # Crear/actualizar propietarios
│       ├── sync-asset.ts         # Crear/actualizar propiedades
│       ├── upload-signature.ts   # Subir firma RGPD
│       ├── get-assets.ts         # Obtener lista de propiedades
│       └── get-people.ts         # Obtener lista de personas
│
├── components/                   # Componentes React
├── services/
│   └── rentgerService.ts         # Cliente que llama a /api/rentger/*
├── firebase.ts                   # Configuración de Firebase (Auth, Firestore, Storage)
├── vercel.json                   # Configuración de Vercel
└── package.json
```

## 🚀 Despliegue en Vercel

### 1. Configurar Variable de Entorno (API Key)

En el dashboard de Vercel:
1. Ve a tu proyecto → **Settings** → **Environment Variables**
2. Añade una nueva variable:
   - **Name:** `RENTGER_API_KEY`
   - **Value:** Tu API key de Rentger
   - **Environment:** Production, Preview, Development

### 2. Desplegar

```bash
# Si usas Vercel CLI
vercel --prod

# O simplemente haz push a tu repositorio conectado
git push origin main
```

## 🔧 Desarrollo Local

### Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
RENTGER_API_KEY=tu_api_key_de_rentger
```

### Ejecutar en Local

```bash
# Instalar dependencias
npm install

# Desarrollo con Vercel Functions locales
vercel dev

# O solo frontend (sin API de Rentger)
npm run dev
```

## 📡 Endpoints de API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/rentger/ping` | POST | Verificar conexión con Rentger |
| `/api/rentger/sync-owner` | POST | Crear/actualizar propietario |
| `/api/rentger/sync-asset` | POST | Crear/actualizar propiedad |
| `/api/rentger/upload-signature` | POST | Subir firma RGPD |
| `/api/rentger/get-assets` | POST | Obtener propiedades |
| `/api/rentger/get-people` | POST | Obtener personas |

## 🔒 Seguridad

- ✅ API key almacenada en variables de entorno de Vercel
- ✅ Llamadas a Rentger se hacen desde el servidor (no desde el navegador)
- ✅ Frontend solo conoce las rutas `/api/rentger/*`
- ✅ Imposible ver la API key inspeccionando el código del navegador

## 📝 Uso desde el Frontend

```typescript
import { rentgerService } from './services/rentgerService';

// Verificar conexión
const isConnected = await rentgerService.ping();

// Sincronizar propietario
const rentgerId = await rentgerService.syncOwner({
  name: 'Juan García',
  email: 'juan@example.com',
  phone: '666123456',
  dni: '12345678A'
});

// Sincronizar propiedad
const result = await rentgerService.syncAsset({
  address: 'Calle Mayor 1',
  city: 'Murcia',
  type: 'apartment',
  rooms: 3
});
```

## 🛠 Tecnologías

- **Frontend:** React + Vite + TypeScript
- **Backend:** Vercel Serverless Functions
- **Base de Datos:** Firebase Firestore
- **Autenticación:** Firebase Auth
- **Almacenamiento:** Firebase Storage
- **Integración:** Rentger API
