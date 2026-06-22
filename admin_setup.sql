-- =====================================================================
-- MIGRACIÓN DE SQL: SOPORTE DE ADMINISTRADOR (ADMIN / ADMIN)
-- Leandro Baterías - Gestión de Inventario Exclusiva para Administrador
-- =====================================================================

-- 1. Agregar la columna "role" a la tabla de perfiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' NOT NULL;

-- 2. Actualizar la función trigger para sincronizar cuentas y autodetectar el rol administrativo
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

-- Nota: Si ya registraste anteriormente un administrador con correo 'admin@leandrobaterias.com', 
-- puedes forzar su actualización en tu base de datos ejecutando lo siguiente:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@leandrobaterias.com';
