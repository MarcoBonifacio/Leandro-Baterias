-- =====================================================================
-- LEANDRO BATERÍAS - SUPABASE SQL SCHEMA SETUP
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- para crear las tablas necesarias y configurar los permisos correctos.
-- =====================================================================

-- 0. Limpiar tablas previas (en caso de que quieras recrear la base desde cero)
-- Descomenta las siguientes líneas si requieres reiniciar la base de datos:
-- DROP TABLE IF EXISTS public.payments;
-- DROP TABLE IF EXISTS public.order_items;
-- DROP TABLE IF EXISTS public.orders;
-- DROP TABLE IF EXISTS public.customers;
-- DROP TABLE IF EXISTS public.products;
-- DROP TABLE IF EXISTS public.categories;

-- 1. Tabla de Categorías (Autos, Pesados, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Productos (Catálogo de Baterías VARTA, SOLITE, CAPSA, ULTRABAT, ETNA, ENERJET, etc.)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(255) PRIMARY KEY, -- Soporta tanto ID manual 'item-xxxx' como UUIDs
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 50,
    amperage VARCHAR(50),
    voltage VARCHAR(50),
    cca INT DEFAULT 500,
    polarity VARCHAR(20) DEFAULT 'Derecha',
    dimensions VARCHAR(100) DEFAULT 'Estándar',
    warranty_months INT DEFAULT 12,
    type VARCHAR(50) DEFAULT 'Plomo-Ácido',
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    document_type VARCHAR(20) DEFAULT 'DNI', -- DNI, RUC, Pasaporte
    document_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla Principal de Órdenes / Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(255) PRIMARY KEY, -- ID compuesto 'ORD-xxxxxx' generado por el frontend
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id VARCHAR(255), -- Relacionar pedido con usuario (UUID de Supabase o string de cuenta Admin)
    date VARCHAR(50) NOT NULL, -- Fecha formateada para rápido renderizado
    customer_name VARCHAR(255) NOT NULL,
    document_id VARCHAR(50),
    receipt_type VARCHAR(50) DEFAULT 'boleta', -- boleta o factura
    email VARCHAR(255),
    phone_number VARCHAR(50),
    shipping_address TEXT,
    vehicle_info VARCHAR(255),
    payment_method VARCHAR(100),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    taxes DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Confirmado, Entregado, Cancelado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Intentar alteración de tabla por si orders ya existía antes de agregar user_id
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vehicle_info VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- 5. Tabla de Detalles de cada Orden (Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_title VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Pagos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    payment_method VARCHAR(100) NOT NULL, -- Efectivo, Yape/Plin, Tarjeta, Transferencia en Cusco
    transaction_reference VARCHAR(150),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Aprovado, Fallido
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Perfiles de Usuario (Soporte de Autenticación de Clientes con Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columna role si profiles ya estuviera pre-existente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' NOT NULL;

-- 8. Tabla para Carrito de Compras (Cart Items) de usuarios registrados
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id VARCHAR(255) REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id)
);

-- =====================================================================
-- TRIGGER AUTOMÁTICO EN SUPABASE PARA SINCRONIZAR REGISTROS
-- Esto sincroniza la tabla 'auth.users' interna de Supabase con tu tabla 'public.profiles'
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Usuario nuevo'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN new.email = 'admin@leandrobaterias.com' OR new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- PASO DE MIGRACIÓN DINÁMICA DE BASE DE DATOS (MIGRAR VIEJAS TABLAS SI ES NECESARIO)
-- Ejecuta automáticamente el renombre si el usuario ya tenía las tablas creadas.
-- =====================================================================
DO $$
BEGIN
    -- Migrar columna de imagen en la tabla de productos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'imageurl') THEN
        ALTER TABLE public.products RENAME COLUMN imageurl TO image_url;
    END IF;

    -- Asegurar existencia de nuevas columnas técnicas para soporte de edición y creación completa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cca') THEN
        ALTER TABLE public.products ADD COLUMN cca INT DEFAULT 500;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'polarity') THEN
        ALTER TABLE public.products ADD COLUMN polarity VARCHAR(20) DEFAULT 'Derecha';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'dimensions') THEN
        ALTER TABLE public.products ADD COLUMN dimensions VARCHAR(100) DEFAULT 'Estándar';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'warranty_months') THEN
        ALTER TABLE public.products ADD COLUMN warranty_months INT DEFAULT 12;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'type') THEN
        ALTER TABLE public.products ADD COLUMN type VARCHAR(50) DEFAULT 'Plomo-Ácido';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE public.products ADD COLUMN description TEXT;
    END IF;

    -- Migrar columnas en la tabla de órdenes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customername') THEN
        ALTER TABLE public.orders RENAME COLUMN customername TO customer_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'documentid') THEN
        ALTER TABLE public.orders RENAME COLUMN documentid TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'receipttype') THEN
        ALTER TABLE public.orders RENAME COLUMN receipttype TO receipt_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phonenumber') THEN
        ALTER TABLE public.orders RENAME COLUMN phonenumber TO phone_number;
    END IF;

    -- Migrar columna de método de pago en la tabla de pagos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'paymentmethod') THEN
        ALTER TABLE public.payments RENAME COLUMN paymentmethod TO payment_method;
    END IF;
END $$;

-- =====================================================================
-- SEED INITIAL DATA (CATEGORÍAS DE ENTRADA)
-- Esto asegura que las relaciones funcionen inmediatamente
-- =====================================================================
INSERT INTO public.categories (name, description)
VALUES 
    ('auto', 'Baterías para autos y pequeños utilitarios (CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET)'),
    ('pesado', 'Baterías para camiones, buses, maquinaria agrícola y pesada')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- CONFIGURACIÓN DE PERMISOS IMPORTANTES (SOPORTE DE ACCESO DESDE EL CLIENTE - ANON KEY)
-- Útil para asegurar conectividad instantánea sin errores de lectura/escritura.
-- =====================================================================

-- Opción A: Deshabilitar RLS para desarrollo rápido y pruebas directas
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;

-- Opción B (RECOMENDADO PARA PRODUCCIÓN): Si habilitas RLS más adelante, crea políticas públicas:
-- Descomenta estas líneas si deseas habilitar RLS y tener políticas precisas de lectura/escritura pública:

/*
-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (cualquiera puede ver categorías y productos)
CREATE POLICY "Permitir lectura de categorías para todos" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir lectura de productos para todos" ON public.products FOR SELECT USING (true);

-- Políticas de escritura/consulta pública para Órdenes, Clientes, Detalles de Pedido y Pagos durante Checkout
CREATE POLICY "Permitir inserción de productos para todos" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserción de clientes para todos" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir consulta de clientes para todos" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de órdenes para todos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de órdenes para todos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de items por orden" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de items por orden" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de pagos" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de pagos" ON public.payments FOR SELECT USING (true);
*/
