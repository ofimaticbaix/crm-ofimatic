# ☀️ Para leer nada más levantarte

Tienes 3 archivos preparados y un checklist de 10 minutos. Orden exacto:

## 1. [2 min] Ejecutar seed SQL

Abre **Supabase → SQL Editor** y pega el contenido de:

`scripts/seed-demo-data.sql`

Dale RUN. Debe terminar en 1-2 segundos.

Al final verás dos líneas:
- `Deals creados: 12`
- `Actividades creadas: 16`

Si da error, pégame el mensaje y lo arreglamos en 2 min.

Si dice *"Ya se sembró antes..."*, perfecto, los datos ya estaban.

## 2. [5 min] Revisar los 25 nombres dedup

Pega también `scripts/review-dedup.sql` en el SQL Editor. Verás una tabla con 25 filas: `vat`, `nombre_actual`, `nombre_descartado`, contactos de cada uno.

**Solo mira si alguno te hace saltar la alarma.** Un ejemplo sospechoso es `GARCIA FAURA SL` vs `GARCIA FAURA ARQUITECTURA` — puede que el nombre "bueno" no sea el que quedó.

Si ves alguno mal, el propio archivo SQL tiene los comandos comentados al final:

```sql
UPDATE companies
  SET name = (SELECT name FROM companies WHERE vat_number = '<vat>' AND deleted_at IS NOT NULL LIMIT 1)
  WHERE vat_number = '<vat>' AND deleted_at IS NULL;
```

Descomentas, cambias `<vat>` y run. Sólo lo que te preocupe.

## 3. [3 min] Precargar navegación

Abre Chrome incógnito (sin extensiones). Login en la app. Navega por estas pestañas en orden, sin prisas (solo que Next las compile en caché):

- `/dashboard`
- `/clients`
- `/clients/activos`
- `/clients/inactivos`
- `/clients/cerrados`
- `/leads`
- `/companies`
- `/deals` ← en esta verifica que ves 12 deals con valores variados en distintas columnas
- `/tasks`
- `/map`

## 4. Lee `DEMO-SCRIPT.md` de principio a fin

Contiene:
- Guión de 8-12 min en orden exacto
- Frases de transición para memorizar
- **Respuestas preparadas** a 9 preguntas difíciles
- Qué NO hacer en la demo

## 5. Para la demo

- **Chrome**, pantalla completa.
- Sidebar visible.
- No abras F12/devtools.
- Comparte la ventana entera, no pestaña.
- Si algo da error: toast rojo → di *"es un caso límite, tomo nota"* y sigue.

## ⚠️ Cosas que he tocado esta noche

1. Arreglado typecheck (3 errores de TypeScript en account_type).
2. Corregido el seed SQL — la tabla era `memberships`, no `workspace_members`.
3. Verificado que `npm run build` pasa → sin errores de producción.

**NO he tocado código runtime más allá de los typecast.** No he refactorizado nada. No he añadido dependencies.

## 📂 Archivos nuevos creados

- `scripts/seed-demo-data.sql` — ejecutar mañana
- `scripts/review-dedup.sql` — ejecutar y revisar
- `DEMO-SCRIPT.md` — guión
- `LEEME-MAÑANA.md` — este archivo

## 🚦 Estado del producto

Como **demo**: sólido 8/10 si sigues el guión.
Como **producto en producción inmediata**: aún faltan asignación a usuarios y timeline unificado — eso es fase 2.

## Si algo falla esta mañana

Cosas posibles que no pude probar:

1. **Pipeline DnD en móvil** — si el drag no va, usa el dropdown de etapa en la card como fallback (mencionarlo en la demo: *"y para cambios rápidos sin arrastrar, también hay un selector"*).
2. **Dashboard** — no lo he tocado. Debería estar como ayer.
3. **Modal del contacto en modo solo lectura** — arregla fieldset. Si no se ven los campos, prueba click en Editar y ahí sí están.

## 💪 Confianza

Con el guión, los datos sembrados, y las respuestas preparadas, esta demo debería salir bien. La arquitectura está limpia, el dedup está hecho, los flujos son consistentes. Sólo hay que contar la historia bien.

Rompe pierna.
