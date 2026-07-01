# Instrucciones y Guía del Proyecto (AGENTS.md)

## 🏢 Contexto de la Aplicación
**Leandro Baterías** es una plataforma web moderna de comercio electrónico, diagnóstico automotriz e historial de pedidos especializada en baterías para vehículos livianos y pesados en el mercado peruano (moneda: **Soles / PEN**).

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 18+ con TypeScript y Vite.
- **Estilos**: Tailwind CSS (diseño responsivo móvil-first, de alto contraste e intuitivo).
- **Iconos**: `lucide-react` (siempre importar iconos con nombres exactos de esta librería).
- **Backend & Base de Datos**: Supabase (PostgreSQL, Supabase Auth y Almacenamiento en tablas).

---

## 🔐 Reglas Críticas de Autenticación (`AuthModal.tsx` & `supabase.ts`)

### 1. Registro e Inicio con Nombres de Usuario o Correos Flexibles
Para maximizar la conversión y facilitar las pruebas, **nunca se debe obligar al usuario a contar con un correo Gmail o real**:
- Si un usuario ingresa solo un nombre (ej. `rodrigoprueba`, `carlos`), el sistema lo normaliza automáticamente adjuntando el dominio corporativo: `rodrigoprueba@leandrobaterias.com`.
- Si ingresa dominios genéricos de prueba (`@test.com`, `@prueba.com`, `@example.com`), se redirigen de forma transparente al dominio interno para evitar bloqueos por políticas estrictas de servidores de correo.
- Se mantiene sincronización dual: sesión en memoria/Supabase Auth y respaldo local en `localStorage ('custom_session_user')`.

### 2. Acceso Directo de Administrador (Admin Bypass)
El proyecto cuenta con una puerta trasera de acceso rápido para demostración y gestión del catálogo:
- **Usuario / Correo**: `admin` o `admin@leandrobaterias.com`
- **Contraseña**: `admin`, `admin123` o `admin`
- **Comportamiento**: Al detectarse estas credenciales, activa inmediatamente el estado de administrador y establece `localStorage.setItem('admin_session', 'true')`, omitiendo rebotes o verificaciones externas de base de datos.

### 3. Tolerancia a Errores de Clave Foránea en Perfiles (FK `23503`)
Al registrar nuevos usuarios mediante `createUserProfile(id, name, email, phone, role)`:
- Se implementa un retraso de cortesía (`800ms`) antes de insertar en la tabla pública `profiles` para permitir que el motor interno de `auth.users` de Supabase complete su replicación.
- Si la base de datos devuelve un error de violación de clave foránea (`code === '23503'`), **el sistema absorbe la advertencia sin interrumpir la experiencia del cliente**, asumiendo que un *Database Trigger* o proceso en segundo plano vinculará el registro posteriormente.

---

## 📦 Estructura de Datos y Tablas en Supabase

El esquema principal interactúa con las siguientes tablas:
1. `products`: Catálogo de baterías (marca, modelo, amperaje Ah, voltaje V, CCA, polaridad, dimensiones, garantía, precio y stock). Fallback local en `src/data/batteryData.ts`.
2. `profiles`: Perfiles extendidos de usuarios (`id`, `name`, `email`, `phone`, `role`).
3. `user_carts`: Carritos guardados persistentemente en la nube asociados al ID del cliente.
4. `orders` & `order_items`: Registro de pedidos generados (`customer_name`, `delivery_address`, `status`, `total_amount`, código correlativo `PED-...`).
5. `payments`: Métodos de pago e información transaccional (`payment_method`, `transaction_reference`, `status`).

---

## 🛒 Flujo de Compra y Pedidos
- **Buscador Inteligente de Baterías (`BatteryFinder.tsx`)**: Recomienda baterías exactas según categoría, marca, modelo y año del vehículo del cliente.
- **Carrito Desplegable (`CartDrawer.tsx`)**: Permite modificar cantidades, aplicar servicios de instalación a domicilio, entrega de batería usada en parte de pago y calcular costos de envío.
- **Checkout & Métodos de Pago**: Soporte para Yape, Plin, Transferencia Bancaria, Tarjeta de Crédito/Débito y Pago Contra Entrega (Efectivo/POS).
- **Integración WhatsApp**: Genera automáticamente un resumen formateado del pedido con enlace directo al número de atención al cliente de Leandro Baterías.

---

## 🎨 Normas de Diseño e Interfaz
- **Claridad Visual**: Usar tipografías limpias (`Inter`, `Space Grotesk`, `JetBrains Mono`) con paletas de color equilibradas (pizarras oscuras, azules índigo, blancos puros y acentos amarillos/verdes energéticos).
- **Restricciones de iFrame**: Evitar APIs nativas del navegador que puedan fallar en entornos incrustados como `window.alert()` o `window.open()` sin control de excepciones. Usar notificaciones visuales integradas (como banners o mensajes de estado en modales).
