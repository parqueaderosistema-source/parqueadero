# Parqueadero

Sistema de gestión de parqueadero: registro de entradas y salidas, cobro manual y caja diaria.

## Estructura

```
parqueadero/
  ParqueaderoBack/    API: Node + Express + TypeScript + MongoDB (Mongoose)
  ParqueaderoFront/   Aplicación Angular
```

## Backend

```bash
cd ParqueaderoBack
cp .env.example .env      # completar MONGODB_URI, JWT_SECRET y contraseñas
npm install
npm run dev               # http://localhost:3000
```

Scripts útiles: `npm run typecheck`, `npm run build`, `npm run seed:tipos`, `npm run seed:usuarios`.

## Frontend

```bash
cd ParqueaderoFront
npm install
npx ng serve              # http://localhost:4200
```

## Arquitectura

### Backend (`ParqueaderoBack/src`)

| Capa | Responsabilidad |
|---|---|
| `config/` | Configuración validada al arrancar (`env.ts`), CORS, roles y conexión a MongoDB |
| `routes/` | URLs y qué rol puede usar cada una |
| `middlewares/` | Autenticación (carga el usuario desde la BD en cada petición), roles y manejo global de errores |
| `controllers/` | Validan la entrada con `validar()` y responden; no tienen lógica de negocio ni `try/catch` |
| `services/` | Reglas de negocio. Separados por responsabilidad: registro (operación), resumen (consultas), historial, historialExcel (formato), auditoría, token, auth |
| `validators/` | Esquemas zod de cuerpo, query y parámetros de URL |
| `models/` | Esquemas de Mongoose |

Los servicios lanzan `HttpError(status, mensaje)`; `middlewares/error.middleware.ts` lo convierte en respuesta JSON. Cualquier otro error responde 500 con un mensaje genérico (no expone detalles internos).

### Frontend (`ParqueaderoFront/src/app`)

- `core/config/api.config.ts`: token `API_URL`; su valor sale de `src/environments/` (desarrollo: `http://localhost:3000/api`, producción: `/api`).
- `core/services/`: un servicio por área (auth, parqueadero, admin, historial, tipos-vehiculo).
- `core/guards/rol.guard.ts`: `rolGuard(...roles)` protege cada panel.

## Seguridad

- Sesión en cookie `httpOnly` (JWT HS256, 8 h). El rol y el estado activo se consultan en la BD en cada petición: desactivar un usuario tiene efecto inmediato.
- Login con límite de 5 intentos fallidos cada 15 minutos y tiempo de respuesta igual exista o no el correo.
- Toda entrada (cuerpo, query y parámetros de URL) se valida con zod; no se construyen expresiones regulares con texto del usuario.
- `helmet`, CORS restringido a `FRONTEND_URL` en producción (en desarrollo, cualquier puerto de localhost) y límite general de peticiones.
- Detrás de un proxy, configure `TRUST_PROXY` para que el límite de peticiones use la IP real.

## Ramas

- `main`: versión estable.
- `develop`: integración.
- `feature/<nombre>`: se crean desde `develop` y vuelven a `develop` mediante pull request.
