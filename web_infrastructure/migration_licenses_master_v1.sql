-- ==============================================================================
-- TALK.ME SOVEREIGN - MIGRACIÓN ATÓMICA DE CONTROL DE VERSIONES Y COBERTURA
-- Ubicación: web_infrastructure/migration_licenses_master_v1.sql
-- Ejecución: Aruba MySQL (31.11.39.205) / Base de Datos: Sql1934281_1
-- ==============================================================================

-- 1. Añadir columnas de control de actualizaciones y versión máxima permitida sin destruir datos existentes
ALTER TABLE tm_licenses 
ADD COLUMN IF NOT EXISTS updates_until DATETIME DEFAULT NULL AFTER expires_at,
ADD COLUMN IF NOT EXISTS max_allowed_version INT NOT NULL DEFAULT 1 AFTER license_version;

-- 2. Backfill seguro para licencias de Pago Único (One-Time) existentes:
-- Otorgar 1 año completo de cobertura de actualizaciones desde su fecha de creación
UPDATE tm_licenses 
SET updates_until = DATE_ADD(created_at, INTERVAL 1 YEAR),
    max_allowed_version = 1
WHERE payment_mode = 'one_time' 
  AND updates_until IS NULL;

-- 3. Backfill seguro para licencias Rent-to-Own (RTO):
-- Caso 3A: RTO Completadas (ya pagaron las 14 cuotas y son vitalicias)
-- Garantizar 1 año completo desde que completaron o desde la fecha actual
UPDATE tm_licenses 
SET updates_until = DATE_ADD(NOW(), INTERVAL 1 YEAR),
    max_allowed_version = 1
WHERE payment_mode = 'rent_to_own' 
  AND subscription_status = 'complete' 
  AND updates_until IS NULL;

-- Caso 3B: RTO en curso (activas o en proceso)
-- Cubiertas mientras su suscripción y cuotas sigan activas
UPDATE tm_licenses 
SET updates_until = DATE_ADD(created_at, INTERVAL 14 MONTH),
    max_allowed_version = 1
WHERE payment_mode = 'rent_to_own' 
  AND subscription_status = 'active' 
  AND updates_until IS NULL;
