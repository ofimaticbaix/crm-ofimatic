-- ================================================================
-- SEED DE DATOS PARA DEMO
-- Pega este bloque entero en el SQL Editor de Supabase y dale RUN.
-- Crea: 12 deals variados + 20 actividades completadas recientes.
-- Es idempotente: detecta si ya hay deals con subject "DEMO_SEED"
-- y salta, para que puedas ejecutarlo varias veces sin miedo.
-- ================================================================

DO $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_pipeline_id UUID;
  v_stage_qual UUID;   -- Calificación
  v_stage_prop UUID;   -- Propuesta
  v_stage_nego UUID;   -- Negociación
  v_stage_won UUID;    -- Ganado
  v_stage_lost UUID;   -- Perdido
  v_company RECORD;
  v_companies UUID[];
  v_idx INT;
  v_already_seeded INT;
BEGIN
  -- 1) Detectar workspace y usuario actuales
  SELECT id INTO v_workspace_id FROM workspaces ORDER BY created_at LIMIT 1;
  SELECT user_id INTO v_user_id FROM memberships WHERE workspace_id = v_workspace_id LIMIT 1;

  IF v_workspace_id IS NULL OR v_user_id IS NULL THEN
    RAISE NOTICE 'ABORT: No se encontró workspace o usuario. Nada cambiado.';
    RETURN;
  END IF;

  -- 2) Ya sembrado? (marcador = metadata->>'demo_seed')
  SELECT count(*) INTO v_already_seeded
  FROM deals
  WHERE workspace_id = v_workspace_id
    AND custom_fields->>'demo_seed' = 'true';

  IF v_already_seeded > 0 THEN
    RAISE NOTICE 'Ya se sembró antes (% deals de demo existen). Saliendo sin cambios.', v_already_seeded;
    RETURN;
  END IF;

  -- 3) Pipeline y etapas
  SELECT id INTO v_pipeline_id FROM pipelines WHERE workspace_id = v_workspace_id LIMIT 1;
  IF v_pipeline_id IS NULL THEN
    RAISE NOTICE 'ABORT: No hay pipeline configurado.';
    RETURN;
  END IF;

  SELECT id INTO v_stage_qual FROM stages WHERE pipeline_id = v_pipeline_id AND is_closed_won = false AND is_closed_lost = false ORDER BY position LIMIT 1;
  SELECT id INTO v_stage_prop FROM stages WHERE pipeline_id = v_pipeline_id AND is_closed_won = false AND is_closed_lost = false ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_stage_nego FROM stages WHERE pipeline_id = v_pipeline_id AND is_closed_won = false AND is_closed_lost = false ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_stage_won  FROM stages WHERE pipeline_id = v_pipeline_id AND is_closed_won = true LIMIT 1;
  SELECT id INTO v_stage_lost FROM stages WHERE pipeline_id = v_pipeline_id AND is_closed_lost = true LIMIT 1;

  -- 4) Coger 12 empresas customer aleatorias
  SELECT array_agg(id ORDER BY random()) INTO v_companies
  FROM (
    SELECT id FROM companies
    WHERE workspace_id = v_workspace_id
      AND deleted_at IS NULL
      AND account_type = 'customer'
    ORDER BY random()
    LIMIT 12
  ) sub;

  IF array_length(v_companies, 1) IS NULL THEN
    -- Fallback: cualquier empresa no-lead
    SELECT array_agg(id ORDER BY random()) INTO v_companies
    FROM (
      SELECT id FROM companies
      WHERE workspace_id = v_workspace_id
        AND deleted_at IS NULL
        AND (account_type IS NULL OR account_type != 'lead')
      ORDER BY random()
      LIMIT 12
    ) sub;
  END IF;

  IF array_length(v_companies, 1) IS NULL THEN
    RAISE NOTICE 'ABORT: No hay empresas disponibles.';
    RETURN;
  END IF;

  -- 5) Crear 12 deals con valores variados
  INSERT INTO deals (workspace_id, pipeline_id, stage_id, company_id, name, value, status, expected_close_date, owner_id, created_by_id, custom_fields)
  VALUES
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_qual, (SELECT id FROM stages WHERE pipeline_id=v_pipeline_id ORDER BY position LIMIT 1)),
      v_companies[1], 'Renovación mantenimiento anual', 8500, 'open', (now() + interval '15 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_qual, (SELECT id FROM stages WHERE pipeline_id=v_pipeline_id ORDER BY position LIMIT 1)),
      v_companies[2], 'Corte láser serie piezas', 2400, 'open', (now() + interval '8 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_prop, v_stage_qual),
      v_companies[3], 'Mecanizado CNC lote grande', 18500, 'open', (now() + interval '20 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_prop, v_stage_qual),
      v_companies[4], 'Subcontratación plegado', 6200, 'open', (now() + interval '5 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_nego, v_stage_prop),
      v_companies[5], 'Proyecto estructura metálica', 65000, 'open', (now() + interval '30 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_nego, v_stage_prop),
      v_companies[6], 'Soldadura especializada inox', 12800, 'open', (now() + interval '10 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_nego, v_stage_prop),
      v_companies[7], 'Contrato marco 2026', 85000, 'open', (now() + interval '45 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_qual, (SELECT id FROM stages WHERE pipeline_id=v_pipeline_id ORDER BY position LIMIT 1)),
      v_companies[8], 'Corte plasma urgente', 950, 'open', (now() + interval '3 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_prop, v_stage_qual),
      v_companies[9], 'Mantenimiento preventivo Q2', 4200, 'open', (now() + interval '12 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_won, v_stage_nego),
      v_companies[10], 'Pedido láser fibra 2m (ganado)', 14500, 'won', (now() - interval '5 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_won, v_stage_nego),
      v_companies[11], 'Encargo mecanizado prototipos (ganado)', 3800, 'won', (now() - interval '12 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, v_pipeline_id, COALESCE(v_stage_lost, v_stage_nego),
      v_companies[12], 'Propuesta corte grande (perdido)', 22000, 'lost', (now() - interval '8 days')::date, v_user_id, v_user_id, '{"demo_seed":"true"}')
  ;

  -- 6) Actividades completadas recientes para mostrar contacto reciente en 8 empresas
  INSERT INTO activities (workspace_id, type, subject, description, is_completed, completed_at, company_id, created_by_id, assigned_to_id, metadata)
  VALUES
    (v_workspace_id, 'call',    'Llamada seguimiento',       'Llamé para ver estado del presupuesto. Quieren arrancar en 2 semanas.', true, now() - interval '1 day',  v_companies[1],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'meeting', 'Reunión en sus oficinas',   'Visita técnica. Interesa ampliar servicio.',                            true, now() - interval '2 days', v_companies[1],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'email',   'Email con propuesta',       'Envié PDF con propuesta detallada.',                                    true, now() - interval '3 days', v_companies[3],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'call',    'Llamada cierre',            'Confirmó recepción. Revisa esta semana.',                               true, now() - interval '4 days', v_companies[3],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'meeting', 'Visita fábrica',            'Recorrido por instalaciones.',                                          true, now() - interval '1 day',  v_companies[5],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'note',    'Nota interna',              'Cliente muy interesado, pedirá pronto.',                                true, now() - interval '2 days', v_companies[5],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'call',    'Llamada gerente',           'Aprobó presupuesto por teléfono.',                                      true, now() - interval '5 days', v_companies[7],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'email',   'Envío factura proforma',    'Proforma con condiciones.',                                             true, now() - interval '6 days', v_companies[7],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'call',    'Llamada técnica',           'Aclaración de especificaciones.',                                       true, now() - interval '3 days', v_companies[9],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'note',    'Seguimiento trimestral',    'Va todo bien, confirmado para Q2.',                                     true, now() - interval '1 day',  v_companies[9],  v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'email',   'Felicitación post-entrega', 'Todo entregado a tiempo.',                                              true, now() - interval '2 days', v_companies[10], v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'call',    'Confirmación recepción',    'Recibido y conforme.',                                                  true, now() - interval '4 days', v_companies[10], v_user_id, v_user_id, '{"demo_seed":"true"}'),
    -- Actividades futuras programadas (para que aparezcan como "con próxima acción")
    (v_workspace_id, 'meeting', 'Reunión programada',        'Meeting para cerrar detalles.',                                         false, NULL, v_companies[2], v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'call',    'Llamar a gerente',          'Pendiente para la próxima semana.',                                     false, NULL, v_companies[4], v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'email',   'Enviar revisión final',     'Pendiente de mi parte.',                                                false, NULL, v_companies[6], v_user_id, v_user_id, '{"demo_seed":"true"}'),
    (v_workspace_id, 'meeting', 'Visita comercial trimestre',NULL,                                                                    false, NULL, v_companies[8], v_user_id, v_user_id, '{"demo_seed":"true"}')
  ;

  -- 7) Actualizar scheduled_at de las actividades futuras
  UPDATE activities SET scheduled_at = now() + interval '3 days'  WHERE company_id = v_companies[2] AND metadata->>'demo_seed' = 'true' AND is_completed = false;
  UPDATE activities SET scheduled_at = now() + interval '5 days'  WHERE company_id = v_companies[4] AND metadata->>'demo_seed' = 'true' AND is_completed = false;
  UPDATE activities SET scheduled_at = now() + interval '7 days'  WHERE company_id = v_companies[6] AND metadata->>'demo_seed' = 'true' AND is_completed = false;
  UPDATE activities SET scheduled_at = now() + interval '10 days' WHERE company_id = v_companies[8] AND metadata->>'demo_seed' = 'true' AND is_completed = false;

  RAISE NOTICE 'OK: creadas 12 deals + 16 actividades de demo. Pipeline y Activos/Inactivos deberían tener datos visuales.';
END $$;

-- Verificación rápida (opcional):
SELECT 'Deals creados:' AS que, count(*) FROM deals WHERE custom_fields->>'demo_seed' = 'true'
UNION ALL
SELECT 'Actividades creadas:', count(*) FROM activities WHERE metadata->>'demo_seed' = 'true';
