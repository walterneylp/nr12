
-- RISK CATALOG SEED DATA
-- Table structure is defined in schema.sql

INSERT INTO risk_catalog (category, hazard, location, consequence, s, p, f, category_required) VALUES
('MECANICO', 'Esmagamento em partes móveis', 'Zona de conformação', 'Lesão grave', 8, 4, 3, '3'),
('MECANICO', 'Corte em partes rotativas', 'Eixo/rotor exposto', 'Amputação', 10, 4, 3, '3'),
('MECANICO', 'Aprisionamento em pontos de nip', 'Correias e polias', 'Lesão grave', 8, 4, 3, '2'),
('MECANICO', 'Projeção de partículas', 'Área de usinagem', 'Lesão ocular', 6, 2, 3, '2'),
('MECANICO', 'Arraste por correia', 'Transmissão', 'Fraturas', 6, 4, 3, '2'),
('MECANICO', 'Corte por lâminas expostas', 'Lâminas', 'Lesão grave', 8, 4, 3, '3'),
('MECANICO', 'Entalamento em guilhotina', 'Ponto de corte', 'Amputação', 10, 4, 3, '4'),
('ELEVACAO', 'Queda de carga', 'Zona de elevação', 'Lesão grave', 8, 2, 2, '3'),
('ELETRICO', 'Choque elétrico', 'Painel/quadros', 'Queimaduras', 8, 2, 2, '2'),
('TERMICO', 'Contato com superfície quente', 'Resistência/forno', 'Queimadura', 4, 4, 6, '1'),
('TRANSPORTE', 'Atropelamento por paleteira', 'Área de movimentação', 'Fraturas', 6, 2, 1, '1'),
('EMBALAGEM', 'Esmagamento em máquina de embalagem', 'Ponto de selagem', 'Lesão grave', 8, 4, 3, '2');

-- CHECKLIST VERSIONS SEED DATA
DO $$
DECLARE
  v_id UUID;
BEGIN
  -- 1. Create Version if not exists
  INSERT INTO checklist_versions (name, version, is_active)
  VALUES ('NR-12 Geral', '1.0', true)
  ON CONFLICT DO NOTHING;

  -- Get the ID of the version we just inserted/found
  SELECT id INTO v_id FROM checklist_versions WHERE name = 'NR-12 Geral' AND version = '1.0' LIMIT 1;

  -- 2. Insert Requirements (Using correct table: checklist_requirements)
  IF v_id IS NOT NULL THEN
      INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
      (v_id, '12.1', 'Arranjo físico e instalações - Áreas de circulação desobstruídas?', 'Arranjo Físico', 'NR-12.6', 1),
      (v_id, '12.2', 'Meios de acesso permanentes (escadas, passarelas) seguros?', 'Arranjo Físico', 'NR-12.64', 2),
      (v_id, '12.3', 'Sistemas de segurança em zonas de perigo?', 'Sistemas de Segurança', 'NR-12.38', 3),
      (v_id, '12.4', 'Dispositivos de parada de emergência acessíveis?', 'Sistemas de Segurança', 'NR-12.56', 4),
      (v_id, '12.5', 'Proteções fixas fixadas firmemente?', 'Proteções', 'NR-12.48', 5),
      (v_id, '12.6', 'Proteções móveis com intertravamento operante?', 'Proteções', 'NR-12.44', 6),
      (v_id, '12.7', 'Quadros de energia elétrica fechados e sinalizados?', 'Instalações Elétricas', 'NR-10 / NR-12.14', 7),
      (v_id, '12.8', 'Condutores elétricos protegidos contra danos mecânicos?', 'Instalações Elétricas', 'NR-12.18', 8)
      ON CONFLICT DO NOTHING;
  END IF;
END $$;
