-- ================================================================
-- REVISAR LOS 25 CASOS DE DEDUP DE VAT
-- Muestra las empresas soft-deleted ayer junto con la que sobrevivió,
-- para que puedas verificar que el nombre "bueno" es el correcto.
-- Si ves alguno mal, lo corriges manualmente con un UPDATE al final.
-- ================================================================

-- a) Ver pares: sobreviviente vs descartada
SELECT
  active.vat_number                     AS vat,
  active.name                           AS nombre_actual,
  deleted.name                          AS nombre_descartado,
  active.id                             AS id_actual,
  deleted.id                            AS id_descartado,
  (SELECT count(*) FROM contacts WHERE company_id = active.id  AND deleted_at IS NULL) AS contactos_actual,
  (SELECT count(*) FROM contacts WHERE company_id = deleted.id AND deleted_at IS NULL) AS contactos_descartado
FROM companies active
JOIN companies deleted
  ON deleted.vat_number = active.vat_number
  AND deleted.workspace_id = active.workspace_id
  AND deleted.id != active.id
  AND deleted.deleted_at IS NOT NULL
WHERE active.deleted_at IS NULL
  AND active.vat_number IS NOT NULL
  AND active.vat_number != ''
ORDER BY active.vat_number;

-- ================================================================
-- Si detectas que el nombre descartado era el bueno, úsalo así:
-- (cambia <vat> por el VAT que quieres corregir)
-- ================================================================
-- UPDATE companies
--   SET name = (SELECT name FROM companies WHERE vat_number = '<vat>' AND deleted_at IS NOT NULL LIMIT 1)
--   WHERE vat_number = '<vat>' AND deleted_at IS NULL;

-- ================================================================
-- Y si quisieras revertir una empresa entera (descartar la actual
-- y restaurar la que se había borrado):
-- ================================================================
-- UPDATE companies SET deleted_at = now() WHERE id = '<id_actual>';
-- UPDATE companies SET deleted_at = NULL WHERE id = '<id_descartado>';
