# Quiniela Chorotega — Backend API

API REST construida con **Node.js + Express + PostgreSQL + JWT**.

## Requisitos

- Node.js 18+
- PostgreSQL 14+ (local o en la nube)

---

## Setup inicial (primera vez)

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y un JWT_SECRET seguro
```

Para generar un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Crear la base de datos en PostgreSQL
```sql
CREATE DATABASE quiniela_chorotega;
```

### 4. Inicializar tablas
```bash
npm run db:init
```

Esto crea las tablas `usuarios` y `quinielas` con sus índices y triggers.

---

## Desarrollo

```bash
# Iniciar con auto-reload (Node.js 18+)
npm run dev

# El servidor arranca en http://localhost:3001
```

**Configurar el frontend** — crear `/src/.env` (en la carpeta del frontend):
```
VITE_API_URL=http://localhost:3001/api
```

---

## Endpoints

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Crear cuenta | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET  | `/api/auth/me` | Ver perfil | ✅ JWT |

**Body registro:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "password": "minimo6",
  "numeroAsociado": "001234"
}
```

**Respuesta exitosa (registro/login):**
```json
{
  "mensaje": "Ingreso exitoso",
  "token": "eyJhbGc...",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "numeroAsociado": "001234",
    "esAdmin": false
  }
}
```

### Quiniela (requieren JWT en header `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/quiniela` | Guardar/actualizar predicciones |
| GET  | `/api/quiniela` | Ver mi quiniela |
| GET  | `/api/quiniela/ranking` | Ver ranking (solo admin) |
| POST | `/api/quiniela/puntajes` | Recalcular puntajes (solo admin) |

**Body guardar quiniela:**
```json
{
  "predicciones": {
    "grupos": {
      "A": [2, 0, null],
      "B": [1, 3, null]
    },
    "bracket": {
      "left":  { "r32": [0,1,0,1,0,1,0,1], "qf": [0,1,0,1], "sf": [0,1] },
      "right": { "r32": [0,1,0,1,0,1,0,1], "qf": [0,1,0,1], "sf": [0,1] },
      "finalPick": 0,
      "thirdPick": 1
    }
  }
}
```

---

## Despliegue en Railway (recomendado)

1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → **PostgreSQL** → copiar `DATABASE_URL`
3. Nuevo servicio → **Deploy from GitHub** → seleccionar la carpeta `backend/`
4. Agregar variables de entorno en Railway:
   - `DATABASE_URL` (la de PostgreSQL)
   - `JWT_SECRET` (string aleatorio seguro)
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://tu-frontend.vercel.app`
5. En la configuración del servicio: **Start command** = `npm start`
6. Ejecutar `npm run db:init` desde Railway Shell (una sola vez)

---

## Hacer admin a un usuario

Desde PostgreSQL:
```sql
UPDATE usuarios SET es_admin = TRUE WHERE email = 'admin@chorotega.cr';
```

---

## Sistema de puntajes

La lógica está en `src/controllers/quinielaController.js` → función `calcularPuntaje()`.

| Ronda | Puntos por acierto |
|-------|-------------------|
| Clasificados 1° y 2° de grupo | 1 pt c/u |
| Octavos de Final | 2 pts |
| Cuartos de Final | 3 pts |
| Semifinales | 4 pts |
| Final | 5 pts |
| Campeón correcto | +10 pts bonus |
