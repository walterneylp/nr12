# Roadmap - Semanas 3 e 4

## 📅 SEMANA 3: Finalização do Ciclo de Laudos

### Dia 1-2: Sistema de Assinatura de Laudos
- [ ] Fluxo de transição de status (DRAFT → READY → SIGNED)
- [ ] Upload de ART (Anotação de Responsabilidade Técnica)
- [ ] Upload de PDF assinado externamente
- [ ] Geração de hash SHA-256 para auditoria
- [ ] Tela de assinatura com validação de gates

### Dia 3: Imutabilidade e Bloqueios
- [ ] Bloqueio de edição em laudos SIGNED
- [ ] Visualização somente leitura para laudos assinados
- [ ] Badge/Indicador de laudo assinado
- [ ] Mensagem de aviso quando tentar editar laudo bloqueado

### Dia 4-5: Dashboard Avançado e Alertas
- [ ] Cards de alerta: laudos vencendo (30, 60, 90 dias)
- [ ] Cards de alerta: ações pendentes do plano de ação
- [ ] Cards de alerta: treinamentos expirando
- [ ] Gráficos: evolução de laudos por mês
- [ ] Gráficos: status das máquinas

---

## 📅 SEMANA 4: Multi-Site, Auditoria e RBAC

### Dia 1-2: Cadastro de Sites/Locais
- [ ] Tabela `sites` (filiais/locais dos clientes)
- [ ] CRUD de sites vinculados a clientes
- [ ] Máquinas vinculadas a sites
- [ ] Filtro por site na lista de máquinas
- [ ] Campo site no formulário de máquina

### Dia 3: Sistema de Auditoria (Logs)
- [ ] Tabela `audit_events`
- [ ] Log de todas as ações (CREATE, UPDATE, DELETE)
- [ ] Tela de auditoria (quem fez o quê e quando)
- [ ] Filtros por data, usuário, entidade

### Dia 4: Sistema de Notificações
- [ ] Tabela `notifications`
- [ ] Notificações automáticas:
  - Laudo vencendo em 30 dias
  - Ação do plano de ação próxima do vencimento
  - Treinamento expirando
- [ ] Badge de notificações no header
- [ ] Dropdown de notificações

### Dia 5: Perfis de Usuário (RBAC)
- [ ] Controle de permissões por role:
  - MASTER: tudo
  - TECHNICIAN: criar/editar, não assinar
  - VIEWER: apenas visualizar
- [ ] Ocultar botões de ação quando sem permissão
- [ ] Proteção nas rotas da API (RLS já faz parte)

---

## 📦 Entregáveis Finais

1. **Laudos com ciclo completo**: Criação → Preenchimento → Validação → Assinatura → Imutabilidade
2. **Multi-site**: Clientes com múltiplos locais/filiais
3. **Auditoria**: Rastreabilidade completa das ações
4. **Notificações**: Alertas proativos no sistema
5. **RBAC**: Controle de acesso por perfil

---

## 🎯 O que já temos (Base)

✅ Clientes, Máquinas, Laudos (CRUD)
✅ Checklist NR-12 com evidências fotográficas
✅ Apreciação de Risco HRN
✅ Plano de Ação
✅ Treinamentos
✅ Ordens de Serviço (Jobs)
✅ PDF básico do laudo
✅ Autenticação e Multi-tenancy
