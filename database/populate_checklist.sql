-- =====================================================
-- CHECKLIST NR-12 COMPLETO - 89 ITENS
-- Baseado na NR-12 e checklists técnicos oficiais
-- =====================================================

DO $$
DECLARE
    v_id UUID;
BEGIN
    -- Ensure Version 1.0 exists
    INSERT INTO checklist_versions (name, version, is_active)
    VALUES ('NR-12 Completo', '1.0', true)
    ON CONFLICT DO NOTHING;

    -- Get Version ID
    SELECT id INTO v_id FROM checklist_versions WHERE name = 'NR-12 Completo' AND version = '1.0' LIMIT 1;

    IF v_id IS NOT NULL THEN
        -- DELETE existing items to avoid duplicates
        DELETE FROM checklist_requirements WHERE checklist_version_id = v_id;

        -- =====================================================
        -- NR-10 - ITENS 1-25 (Segurança em Instalações Elétricas)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        
        -- Análise de Riscos e Proteções (NR-10)
        (v_id, '10.1', 'Há medidas preventivas de controle do risco elétrico mediante técnicas de análise de risco?', 'NR-10 - Análise de Riscos', 'NR-10 6.1', 10),
        (v_id, '10.2', 'Documentação das inspeções e medições de proteção contra descargas atmosféricas (SPDA)', 'NR-10 - Aterramento e SPDA', 'NBR 5419', 20),
        (v_id, '10.3', 'Documentação das inspeções e medições de aterramento elétrico', 'NR-10 - Aterramento e SPDA', 'NBR 5410', 30),
        (v_id, '10.4', 'Cabo terra está devidamente protegido', 'NR-10 - Aterramento', 'NR-10 6.4', 40),
        (v_id, '10.5', 'Carcaças metálicas, grades e portas estão devidamente aterradas', 'NR-10 - Aterramento', 'NR-10 6.4', 50),
        
        -- Barreiras e Proteções (NR-10)
        (v_id, '10.6', 'Partes vivas estão protegidas/bloqueadas impedindo acesso acidental', 'NR-10 - Barreiras', 'NR-10 6.5', 60),
        (v_id, '10.7', 'EPCs: Comandos alimentados em baixa tensão em bom estado', 'NR-10 - EPCs', 'NR-10 6.6', 70),
        (v_id, '10.8', 'EPCs: Barramentos e conexões isolados para eliminar risco de contato', 'NR-10 - EPCs', 'NR-10 6.6', 80),
        (v_id, '10.9', 'Isolação das partes vivas, obstáculos, barreiras e sinalização adequadas', 'NR-10 - EPCs', 'NBR 5410', 90),
        (v_id, '10.10', 'Resultados dos testes de isolação elétrica em EPCs e EPIs', 'NR-10 - EPCs/EPIs', 'NR-10 6.7', 100),
        
        -- Emergência e Organização (NR-10)
        (v_id, '10.11', 'Consta descrição dos procedimentos para emergência elétrica', 'NR-10 - Emergência', 'NR-10 6.8', 110),
        (v_id, '10.12', 'Esquemas unifilares atualizados das instalações elétricas', 'NR-10 - Documentação', 'NR-10 6.9', 120),
        (v_id, '10.13', 'Sistema de iluminação de emergência instalado e funcionando', 'NR-10 - Emergência', 'NR-10 6.10', 130),
        (v_id, '10.14', 'Entradas vedadas contra acesso de animais ou poeira', 'NR-10 - Organização', 'NR-10 6.11', 140),
        (v_id, '10.15', 'Cabos não expostos a riscos mecânicos no entorno', 'NR-10 - Organização', 'NR-10 6.11', 150),
        
        -- Procedimentos e Sinalização (NR-10)
        (v_id, '10.16', 'Não há acúmulo de materiais no interior dos painéis', 'NR-10 - Organização', 'NR-10 6.11', 160),
        (v_id, '10.17', 'Serviços elétricos precedidos de ordens de serviço específicas', 'NR-10 - Procedimentos', 'NR-10 6.12', 170),
        (v_id, '10.18', 'Medidas de proteção contra incêndio conforme NR-23', 'NR-10 - Proteção', 'NR-23', 180),
        (v_id, '10.19', 'Procedimentos e instruções técnicas de segurança disponíveis', 'NR-10 - Procedimentos', 'NR-10 6.13', 190),
        (v_id, '10.20', 'Quadros elétricos com sinalização de segurança e tensão', 'NR-10 - Sinalização', 'NR-10 6.14', 200),
        
        -- Bloqueio e Travamento (NR-10)
        (v_id, '10.21', 'Painel possui sistema de travamento e bloqueio de dispositivos (LOTO)', 'NR-10 - LOTO', 'NR-10/NBR-14039', 210),
        (v_id, '10.22', 'Indicação de posição dos dispositivos: VERDE (D), VERMELHO (L)', 'NR-10 - Sinalização', 'NR-10 6.15', 220),
        (v_id, '10.23', 'Componentes internos (relés, disjuntores) identificados', 'NR-10 - Sinalização', 'NR-10 6.16', 230),
        (v_id, '10.24', 'Documentação de qualificação e treinamentos dos trabalhadores', 'NR-10 - Treinamento', 'NR-10 6.17', 240),
        (v_id, '10.25', 'Aterramento: evidências de malha abaixo de 10 Ohms', 'NR-10 - Aterramento', 'NBR 5410', 250);

        -- =====================================================
        -- NR-12 - ITENS 26-39 (Quadro Elétrico da Máquina)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.26', 'Os comandos do quadro elétrico estão sinalizados/identificados', 'Quadro Elétrico', 'NR-12 12.14', 260),
        (v_id, '12.27', 'Os comandos de operação estão alimentados em extra baixa tensão', 'Quadro Elétrico', 'NR-12 12.15', 270),
        (v_id, '12.28', 'Os dispositivos de partida e parada possuem redundância no acionamento', 'Quadro Elétrico', 'NR-12 12.24', 280),
        (v_id, '12.29', 'A inversão do motor elétrico não causa acidente ao operador', 'Quadro Elétrico', 'NR-12 12.25', 290),
        (v_id, '12.30', 'Os componentes e circuitos internos possuem sinalização de identificação', 'Quadro Elétrico', 'NR-12 12.16', 300),
        (v_id, '12.31', 'Os barramentos energizados possuem proteção fixa abrangendo totalmente a área de risco', 'Quadro Elétrico', 'NR-12 12.17', 310),
        (v_id, '12.32', 'Não há acúmulo de cabos elétricos no interior do quadro', 'Quadro Elétrico', 'NR-12 12.18', 320),
        (v_id, '12.33', 'Não há acúmulo/guarda de materiais no interior do quadro', 'Quadro Elétrico', 'NR-12 12.19', 330),
        (v_id, '12.34', 'Há projeto e laudo de aterramento da máquina (malha < 10 Ohms)', 'Quadro Elétrico', 'NR-12 12.20', 340),
        (v_id, '12.35', 'Aterramento: invólucro, porta do quadro, cabos internos', 'Quadro Elétrico', 'NR-12 12.20', 350),
        (v_id, '12.36', 'A chave geral dispõe de sistema para bloqueio mecânico (LOTO)', 'Quadro Elétrico', 'NR-12 12.30', 360),
        (v_id, '12.37', 'Evidenciado procedimentos de desenergização (LOTO) em manutenções', 'Quadro Elétrico', 'NR-12 12.31', 370),
        (v_id, '12.38', 'O Quadro elétrico possui porta permanentemente fechada', 'Quadro Elétrico', 'NR-12 12.21', 380),
        (v_id, '12.39', 'O quadro elétrico possui as devidas sinalizações de risco', 'Quadro Elétrico', 'NR-12 12.22', 390);

        -- =====================================================
        -- NR-12 - ITENS 40-44 (Dispositivos de Parada de Emergência)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.40', 'A máquina possui dispositivo de parada de emergência', 'Parada de Emergência', 'NR-12 12.56', 400),
        (v_id, '12.41', 'A máquina possui número suficiente de dispositivos de emergência', 'Parada de Emergência', 'NR-12 12.57', 410),
        (v_id, '12.42', 'O dispositivo possui dois blocos de contatos redundantes', 'Parada de Emergência', 'NR-12 12.58', 420),
        (v_id, '12.43', 'O dispositivo possui correta sinalização de identificação (português)', 'Parada de Emergência', 'NR-12 12.59', 430),
        (v_id, '12.44', 'O dispositivo está em local visível e de fácil acesso', 'Parada de Emergência', 'NR-12 12.60', 440);

        -- =====================================================
        -- NR-12 - ITENS 45-47 (Interface de Segurança e Dispositivos)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.45', 'A máquina possui algum tipo de interface de segurança', 'Interface de Segurança', 'NR-12 12.38', 450),
        (v_id, '12.46', 'Os dispositivos de segurança estão adequados: intertravamento, cortina, bimanual, pedal, scanner', 'Interface de Segurança', 'NR-12 12.43-12.55', 460),
        (v_id, '12.47', 'Os dispositivos de segurança possuem rearme/reset para repartida', 'Interface de Segurança', 'NR-12 12.44', 470);

        -- =====================================================
        -- NR-12 - ITENS 48-51 (Comando Bimanual)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.48', 'O número de dispositivos bimanuais é conforme o número de operadores', 'Comando Bimanual', 'NBR 14152', 480),
        (v_id, '12.49', 'O bimanual possui seletor conforme número de operadores e indicação visual', 'Comando Bimanual', 'NBR 14152', 490),
        (v_id, '12.50', 'Os comandos bimanuais atendem requisitos da NBR 14152 (distância entre botões)', 'Comando Bimanual', 'NBR 14152', 500),
        (v_id, '12.51', 'O bimanual possui controle de simultaneidade via interface de segurança', 'Comando Bimanual', 'NBR 14152', 510);

        -- =====================================================
        -- NR-12 - ITENS 52-56 (Pedal de Acionamento)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.52', 'Os comandos possuem identificação em língua portuguesa', 'Pedal de Acionamento', 'NR-12 12.25', 520),
        (v_id, '12.53', 'O pedal possui 3 estágios (parado, acionamento e bloqueio)', 'Pedal de Acionamento', 'NR-12 12.28', 530),
        (v_id, '12.54', 'O pedal possui proteção superior contra acionamentos acidentais', 'Pedal de Acionamento', 'NR-12 12.29', 540),
        (v_id, '12.55', 'O número de pedais está conforme o número de operadores', 'Pedal de Acionamento', 'NR-12 12.28', 550),
        (v_id, '12.56', 'O pedal possui seletor conforme número de operadores e indicação visual', 'Pedal de Acionamento', 'NR-12 12.28', 560);

        -- =====================================================
        -- NR-12 - ITENS 57-58 (Chave Homem Morto)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.57', 'A máquina necessita de chave homem morto para setup', 'Chave Homem Morto', 'NR-12 12.35', 570),
        (v_id, '12.58', 'A chave intermitente é homologada para a função', 'Chave Homem Morto', 'NR-12 12.36', 580);

        -- =====================================================
        -- NR-12 - ITENS 59-61 (Proteções Fixas)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.59', 'As proteções fixas estão fixadas com parafusos allen, rebite ou solda', 'Proteções Fixas', 'NR-12 12.42', 590),
        (v_id, '12.60', 'As proteções fixas abrangem totalmente a área de risco', 'Proteções Fixas', 'NR-12 12.42', 600),
        (v_id, '12.61', 'A dimensão da malha está conforme tabelas de acesso a área de risco', 'Proteções Fixas', 'NR-12 Anexo II', 610);

        -- =====================================================
        -- NR-12 - ITENS 62-67 (Proteções Móveis)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.62', 'As proteções móveis podem ser fixadas de forma segura quando abertas', 'Proteções Móveis', 'NR-12 12.43', 620),
        (v_id, '12.63', 'As proteções móveis abrangem totalmente a área de risco', 'Proteções Móveis', 'NR-12 12.43', 630),
        (v_id, '12.64', 'A dimensão da malha está conforme tabelas de acesso', 'Proteções Móveis', 'NR-12 Anexo II', 640),
        (v_id, '12.65', 'As proteções móveis possuem dispositivos de monitoração do acesso', 'Proteções Móveis', 'NR-12 12.44', 650),
        (v_id, '12.66', 'Proteções com acesso a movimento de inércia possuem chave com bloqueio eletromecânico e redundância', 'Proteções Móveis', 'NR-12 12.45', 660),
        (v_id, '12.67', 'Movimento de inércia possui relé de monitoração ou temporizador para liberação', 'Proteções Móveis', 'NR-12 12.46', 670);

        -- =====================================================
        -- NR-12 - ITENS 68-69 (Cortina de Luz)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.68', 'A cortina de luz abrange totalmente a área de risco (dimensão e altura)', 'Cortina de Luz', 'NR-12 Anexo I.8', 680),
        (v_id, '12.69', 'A cortina possui laudo de verificação do tempo de parada e afastamento (S = K×T + C)', 'Cortina de Luz', 'ISO 13855', 690);

        -- =====================================================
        -- NR-12 - ITENS 70-71 (Scanner)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.70', 'O scanner abrange totalmente a área de risco (dimensão e altura)', 'Scanner', 'NR-12 Anexo I.9', 700),
        (v_id, '12.71', 'O scanner possui laudo de verificação do tempo de parada e afastamento', 'Scanner', 'ISO 13855', 710);

        -- =====================================================
        -- NR-12 - ITENS 72-74 (Calço Mecânico)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.72', 'A máquina possui calço mecânico com ou sem regulagem de altura', 'Calço Mecânico', 'NR-12 12.48', 720),
        (v_id, '12.73', 'O calço mecânico está monitorado através de chave de segurança', 'Calço Mecânico', 'NR-12 12.48', 730),
        (v_id, '12.74', 'O calço possui redundância mecânica das chaves quando monitorado', 'Calço Mecânico', 'NR-12 12.48', 740);

        -- =====================================================
        -- NR-12 - ITENS 75-78 (Sistema Hidráulico)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.75', 'O sistema hidráulico possui bloco hidráulico de segurança', 'Sistema Hidráulico', 'NR-12 12.49', 750),
        (v_id, '12.76', 'O bloco hidráulico possui válvula de retenção de segurança', 'Sistema Hidráulico', 'NR-12 12.49', 760),
        (v_id, '12.77', 'As mangueiras pressurizadas possuem sistema de segurança contra ruptura', 'Sistema Hidráulico', 'NR-12 12.50', 770),
        (v_id, '12.78', 'As mangueiras possuem indicação da pressão máxima admissível', 'Sistema Hidráulico', 'NR-12 12.51', 780);

        -- =====================================================
        -- NR-12 - ITENS 79 (Sistema Pneumático)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.79', 'O sistema pneumático possui válvula de segurança para bloqueio e despressurização', 'Sistema Pneumático', 'NR-12 12.52', 790);

        -- =====================================================
        -- NR-12 - ITENS 80-83 (Outros Componentes)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.80', 'A máquina possui cames de monitoração do posicionamento', 'Outros Componentes', 'NR-12 12.53', 800),
        (v_id, '12.81', 'A máquina possui guarda-corpo, degrau, rodapé e escada conforme necessidade', 'Outros Componentes', 'NR-12 12.54', 810),
        (v_id, '12.82', 'A escada marinheiro possui linha de vida', 'Outros Componentes', 'NR-35', 820),
        (v_id, '12.83', 'Os rodízios possuem trava em pelo menos duas rodas', 'Outros Componentes', 'NR-12 12.55', 830);

        -- =====================================================
        -- NR-12 - ITENS 84-87 (Sinalização e Área)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.84', 'A área no entorno da máquina possui sinalização no piso', 'Sinalização e Área', 'NR-12 12.116', 840),
        (v_id, '12.85', 'A área no entorno da máquina está desobstruída', 'Sinalização e Área', 'NR-12 12.117', 850),
        (v_id, '12.86', 'A máquina possui sinalização de superfície quente', 'Sinalização e Área', 'NR-12 12.118', 860),
        (v_id, '12.87', 'Se há deslocamento, a máquina sinaliza este movimento', 'Sinalização e Área', 'NR-12 12.119', 870);

        -- =====================================================
        -- NR-12 - ITENS 88-89 (Documentação e Treinamento)
        -- =====================================================
        INSERT INTO checklist_requirements (checklist_version_id, item, description, group_name, standard_reference, sort_order) VALUES
        (v_id, '12.88', 'A máquina possui manual de instrução em língua portuguesa', 'Documentação e Treinamento', 'NR-12 12.125', 880),
        (v_id, '12.89', 'O operador possui curso de capacitação NR-12 documentado', 'Documentação e Treinamento', 'NR-12 12.135', 890);

    END IF;
END $$;
