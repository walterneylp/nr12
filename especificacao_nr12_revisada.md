# Especificação Técnica - Sistema NR-12 Safety Inspector

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Propósito
O **NR-12 Safety Inspector** é um sistema SaaS (Software as a Service) completo para emissão de laudos técnicos de segurança de máquinas, conforme a **Norma Regulamentadora NR-12** do Brasil e a **NBR ISO 12100**.

O sistema é destinado a:
- Engenheiros de Segurança do Trabalho
- Técnicos em Segurança do Trabalho
- Empresas de consultoria em segurança
- Departamentos de segurança de indústrias

### 1.2 Problema que Resolve
1. **Processos manuais demorados**: Elimina planilhas e documentos físicos
2. **Falta de padronização**: Laudos consistentes e normatizados
3. **Dificuldade de rastreamento**: Controle completo do ciclo de vida dos laudos
4. **Riscos jurídicos**: Validação de conformidade antes da emissão
5. **Gestão dispersa**: Centralização de dados, evidências e documentos

### 1.3 Solução Oferecida
- Fluxo de trabalho automatizado com gates de validação
- Checklists digitais baseados em normas técnicas
- Geração automática de PDFs profissionais
- App mobile PWA para trabalho em campo offline
- Sistema multi-tenant com isolamento completo de dados

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Stack Tecnológico

| Camada | Tecnologia | Descrição |
|--------|------------|-----------|
| **Frontend** | React 18 + TypeScript | SPA responsiva |
| | Vite | Build tool |
| | React Router | Roteamento |
| | Lucide React | Ícones |
| **Backend** | Node.js + Express | API REST |
| | TypeScript | Tipagem estática |
| | Zod | Validação de schemas |
| **Database** | PostgreSQL (Supabase) | Banco relacional |
| | Row Level Security | Isolamento multi-tenant |
| **Auth** | Supabase Auth | JWT + Gestão de usuários |
| **Storage** | Supabase Storage | Arquivos e fotos |
| **PDF** | PDFKit | Geração de laudos |

### 2.2 Arquitetura de Dados (Multi-Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│                      TENANT (Empresa)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Users     │  │   Clients   │  │    Jobs     │         │
│  │  (Profiles) │  │  (Clientes) │  │ (Trabalhos) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┴────────────────┘                 │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              REPORT (Laudo Técnico)                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │Machines  │ │Checklist │ │  Risks   │ │ Actions │ │   │
│  │  │(Máquinas)│ │  NR-12   │ │   HRN    │ │  Plan   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Modelo de Dados Principal

#### Entidades Core

**tenants** - Empresas assinantes do SaaS
- `id`, `name`, `slug`, `created_at`

**profiles** - Usuários do sistema
- `id` (UUID vinculado ao auth), `email`, `name`, `role`
- `tenant_id` (FK), `created_at`

**clients** - Clientes das empresas de consultoria
- `id`, `tenant_id` (FK), `name`, `trade_name`, `cnpj`
- Endereço completo, contatos

**sites** - Locais/filiais dos clientes
- `id`, `tenant_id` (FK), `client_id` (FK), `name`, `address`

**machines** - Máquinas/equipamentos (cadastro principal)
- `id`, `tenant_id` (FK), `client_id` (FK), `site_id` (FK)
- `tag` (código interno), `name`, `description`
- `manufacturer`, `model`, `serial_number`, `year`
- `machine_type`, `location`, `photo_file_id`, `qr_code_uuid`
- `risk_level` (opcional, derivado do laudo mais recente)

**machine_electrical_profiles** - Perfil elétrico (opcional; manter separado do core NR-12)
> Usado quando o laudo exigir dados elétricos complementares (ex.: interface com NR-10, painéis, validações internas).
- `id`, `tenant_id` (FK), `machine_id` (FK)
- `voltage_v`, `current_a`, `power_kw` (opcionais)
- `atpv` (opcional), `notes`


**jobs** - Trabalhos/ordens de serviço
- `id`, `tenant_id` (FK), `client_id` (FK)
- `title`, `description`, `status`, `start_date`, `end_date`

**reports** - Laudos técnicos
- `id`, `tenant_id` (FK), `client_id` (FK), `job_id` (FK)
- `title`, `status` (DRAFT, IN_REVIEW, READY, SIGNED, ARCHIVED)
- `checklist_version_id` (FK) *(versão do checklist/conjunto normativo aplicado; garante reprodutibilidade)*
- `validity_months`, `valid_from`, `valid_until`
- `art_number`, `art_file_id` *(ART anexada; pode ser exigida por Gate)*
- `draft_pdf_file_id` *(PDF gerado antes da assinatura; opcional)*
- `signed_pdf_file_id` *(PDF final assinado/bloqueado; obrigatório em SIGNED)*
- `signature_mode` *(EXTERNAL_UPLOAD, SIMPLE_E_SIGN, INTEGRATED_PROVIDER)*
- `signature_provider` *(opcional; ex.: provedor/ICP; apenas se integrado)*
- `signed_at`, `signed_by` (FK profiles) *(quem assinou no sistema)*
- `signed_hash_sha256` *(hash do PDF final; base de auditoria e verificação)*
- `signature_metadata_json` *(opcional; metadados técnicos da assinatura, quando existirem)*
- `revision`, `parent_report_id`
- `locked_at` *(timestamp interno de bloqueio; derivado de SIGNED)*

#### Entidades de Relacionamento


**report_machines** - Vínculo máquinas ao laudo
- `id`, `tenant_id` (FK), `report_id` (FK), `machine_id` (FK)

**checklist_versions** - Versionamento do checklist (conjunto normativo)
- `id`
- `name` *(ex.: "NR-12 + ISO 12100 v2026.01")*
- `version` *(semver ou string de versão)*
- `effective_from`, `effective_to` *(vigência; `effective_to` pode ser nulo)*
- `deprecated_at` *(opcional)*
- `notes`

**checklist_requirements** - Itens do checklist (dados mestre, versionados)
- `id`, `checklist_version_id` (FK)
- `code`, `title`, `description`, `category`, `normative_ref`, `is_required`
- `sort_order`
- `created_at`

**checklist_responses** - Respostas do checklist

- `id`, `tenant_id` (FK), `report_id` (FK), `machine_id` (FK), `requirement_id` (FK)
- `status` (COMPLIANT, NONCOMPLIANT, NOT_APPLICABLE)
- `evidence_text`, `evidence_file_id`

**risk_assessments** - Avaliações de risco
- `id`, `tenant_id` (FK), `report_id` (FK), `machine_id` (FK)
- `method` (HRN, SFP)

**risk_entries** - Entradas de risco individuais
- `id`, `tenant_id` (FK), `assessment_id` (FK)
- `hazard`, `hazard_location`, `possible_consequence`
- `hrn_severity`, `hrn_probability`, `hrn_frequency`, `hrn_number`
- `risk_level`, `required_category`, `residual_risk`, `notes`

**safety_functions** - Funções de segurança (NBR 14153)
- `id`, `tenant_id` (FK), `machine_id` (FK), `report_id` (FK)
- `name`, `description`, `required_category`, `current_category`, `has_function`

**action_plans** - Planos de ação
- `id`, `tenant_id` (FK), `report_id` (FK), `machine_id` (FK), `status`

**action_items** - Itens do plano de ação
- `id`, `tenant_id` (FK), `plan_id` (FK)
- `priority` (CRITICAL, HIGH, MEDIUM, LOW, IMPROVEMENT)
- `description`, `due_days`, `due_date`, `responsible_id`, `status`
- `evidence_before_id`, `evidence_after_id`, `closed_at`


**audit_events** - Auditoria (imutável; sem delete físico)
- `id`, `tenant_id` (FK)
- `actor_user_id` (FK profiles), `ip`, `user_agent`
- `entity_type`, `entity_id`
- `action` (CREATE, UPDATE, DELETE, STATUS_CHANGE, EXPORT, SIGN)
- `before_json`, `after_json`
- `created_at`

**async_jobs** - Processos assíncronos (workers)
- `id`, `tenant_id` (FK)
- `type` (PDF_RENDER, CSV_IMPORT, MEDIA_PROCESS, NOTIFY, OFFLINE_SYNC_RECONCILE)
- `status` (QUEUED, RUNNING, DONE, FAILED)
- `payload_json`, `result_json`, `error_message`
- `attempts`, `locked_at`, `finished_at`, `created_at`

---


### 2.4 Processos Assíncronos (Workers)

Para garantir performance e robustez (principalmente em geração de PDF, importação e mídia), o sistema deve tratar operações pesadas como **jobs assíncronos**.

**Princípios:**
- O Backend cria um registro em `async_jobs` e enfileira execução (ex.: Redis/BullMQ) quando aplicável.
- A UI acompanha status por polling/SSE (MVP: polling) e exibe progresso/erros.
- Jobs devem ser **idempotentes** (reexecução segura), com limite de tentativas e backoff.

**Jobs mínimos recomendados:**
- `PDF_RENDER` (geração de `draft_pdf_file_id` e `signed_pdf_file_id`)
- `CSV_IMPORT` (carga em massa com validação e relatório de erros)
- `MEDIA_PROCESS` (thumbnail, validação de arquivo, normalização)
- `NOTIFY` (e-mail/push)
- `OFFLINE_SYNC_RECONCILE` (reconciliação pós-offline)

### 2.5 PWA Offline e Sincronização

O modo offline deve ser **projetado** (não apenas “cache”) para suportar trabalho em campo.

**Armazenamento local:**
- IndexedDB para entidades (machines, responses, risks, action items) e anexos “pendentes”.
- `outbox` (fila local) com operações: CREATE/UPDATE/DELETE (por entidade) + UPLOAD (mídias).

**Sincronização:**
- Ao reconectar, o app:
  1) envia a outbox em ordem (com reexecução em caso de falha),
  2) baixa deltas do servidor por `updated_at`/`version`.
- Upload de arquivos offline: anexos ficam em `PENDING_UPLOAD` até confirmação do servidor.

**Conflitos:**
- Política padrão (MVP): **Last-Write-Wins** por campo, com `updated_at` e `updated_by`.
- Se houver conflito, registrar evento em `audit_events` e exibir banner na UI com opção de “revisar alterações”.

**Regras com Gates:**
- Um gate só é considerado “OK” quando **não houver pendências de sync** relacionadas (ex.: checklist completo mas com respostas pendentes de upload/sync não libera assinatura).


## 3. FLUXO DE FUNCIONAMENTO

### 3.1 Hierarquia de Dados

```
TENANT (Empresa)
  └── CLIENT (Cliente)
        └── JOB (Trabalho/Ordem)
              ├── SITE (Local)
              │     └── MACHINE (Máquina)
              └── REPORT (Laudo)
                    ├── MACHINE (via report_machines)
                    ├── CHECKLIST_RESPONSE
                    ├── RISK_ASSESSMENT
                    │     └── RISK_ENTRY
                    ├── SAFETY_FUNCTION
                    └── ACTION_PLAN
                          └── ACTION_ITEM
```

### 3.2 Fluxo Principal de Trabalho

```
┌────────────────────────────────────────────────────────────────────┐
│  1. CADASTRO                                                       │
│     ├── Criar Cliente (dados da empresa contratante)               │
│     ├── Criar Trabalho/Job (escopo do serviço)                     │
│     ├── Cadastrar Locais (Sites)                                   │
│     └── Cadastrar Máquinas (Assets)                                │
│                                                                    │
│  2. CRIAÇÃO DO LAUDO                                               │
│     ├── Criar Report vinculado ao Job                              │
│     ├── Selecionar máquinas para inspeção                          │
│     └── Status inicial: DRAFT (Rascunho)                           │
│                                                                    │
│  3. PREENCHIMENTO                                                  │
│     ├── Checklist NR-12 (por máquina)                              │
│     │     ├── COMPLIANT (Atende)                                   │
│     │     ├── NONCOMPLIANT (Não atende → gera ação)                │
│     │     └── NOT_APPLICABLE (Não aplicável)                       │
│     │                                                               │
│     ├── Apreciação de Risco HRN                                    │
│     │     ├── Severidade (S): 2-25                                 │
│     │     ├── Probabilidade (P): 0.5-10                            │
│     │     ├── Frequência (F): 1-10                                 │
│     │     └── HRN = S × P × F                                      │
│     │                                                               │
│     ├── Funções de Segurança (NBR 14153)                           │
│     │     └── Categorias: B, 1, 2, 3, 4                            │
│     │                                                               │
│     └── Plano de Ação (automático das não conformidades)           │
│           ├── Prioridade: CRITICAL > HIGH > MEDIUM > LOW           │
│           └── Prazo baseado na criticidade                         │
│                                                                    │
│  4. VALIDAÇÃO (Gates)                                              │
│     ├── Gate A: Máquinas vinculadas                                │
│     ├── Gate B: Checklist completo                                 │
│     ├── Gate C: Risco avaliado                                     │
│     ├── Gate D: Funções de segurança (se aplicável)                │
│     ├── Gate E: Plano de ação criado                               │
│     └── ART anexada (para assinatura)                              │
│                                                                    │
│  5. FINALIZAÇÃO                                                    │
│     ├── Gerar PDF (rascunho) → `draft_pdf_file_id`                  │
│     ├── Upload da ART (Anotação de Responsabilidade Técnica)        │
│     ├── Assinatura (modo configurável)                              │
│     │     ├── EXTERNAL_UPLOAD: upload do PDF assinado externamente  │
│     │     ├── SIMPLE_E_SIGN: aceite/assinatura eletrônica simples   │
│     │     └── INTEGRATED_PROVIDER: provedor integrado (futuro)      │
│     ├── Registrar hash SHA-256 + metadados da assinatura            │
│     ├── Status: SIGNED (bloqueio técnico de imutabilidade)          │
│     └── Gerar/armazenar PDF final → `signed_pdf_file_id`            │
└────────────────────────────────────────────────────────────────────┘
```

### 3.3 Sistema de Gates (Validações)

Os gates são checkpoints obrigatórios antes de permitir a transição para **READY** e **SIGNED**.

> Regra global: **não pode existir pendência de sincronização (offline)** para liberar assinatura.

| Gate | Descrição | Validação |
|------|-----------|-----------|
| **A** | Inventário | Pelo menos 1 máquina vinculada ao laudo |
| **B** | Checklist NR-12 | Todos os itens obrigatórios respondidos (versão do checklist travada no report) |
| **C** | Apreciação de Risco | HRN calculado para todas as máquinas (S/P/F válidos) |
| **D** | Funções de Segurança | Categorias validadas (se aplicável) |
| **E** | Plano de Ação | Ações criadas para não conformidades |
| **F** | ART e Assinatura | ART anexada **se exigido** + PDF final assinado presente em `SIGNED` |


---

## 4. ESTRUTURA DE TELAS

### 4.1 Telas Públicas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | `Login` | Autenticação de usuários |
| `/setup` | `AdminSetup` | Configuração inicial do tenant |
| `/setup/fix-user` | `AdminFixUser` | Correção de perfis |

### 4.2 Telas Principais (Dashboard)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/dashboard` | `Dashboard` | Visão gerencial com KPIs |

**Funcionalidades do Dashboard:**
- Cards de métricas (clientes, máquinas, laudos, taxa de conformidade)
- Gráficos (pizza: status das máquinas; barras: evolução mensal)
- Alertas (laudos próximos ao vencimento, ações pendentes)
- Filtros (período, cliente, site)

### 4.3 Gestão Cadastral

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/clients` | `Clients` | Lista e CRUD de clientes |
| `/sites` | `Sites` | Lista e CRUD de locais |
| `/assets` | `Assets` | Lista e CRUD de máquinas |
| `/jobs` | `Jobs` | Lista e CRUD de trabalhos |
| `/users` | `Users` | Gestão de usuários do tenant |

### 4.4 Laudos (Core do Sistema)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/reports` | `Reports` | Lista de laudos |
| `/reports/:id` | `ReportDetail` | Detalhe completo do laudo |

**Aba do ReportDetail:**
- **Visão Geral**: Dados do laudo, status, máquinas vinculadas
- **Checklist**: Checklist NR-12 por máquina
- **Riscos**: Apreciação de risco HRN
- **Funções de Segurança**: Gestão NBR 14153
- **Plano de Ação**: Ações corretivas
- **PDF**: Visualização e download do laudo

### 4.5 Telas Auxiliares

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/documents` | `Documents` | Gestão de documentos |
| `/risk-catalog` | `RiskCatalog` | Catálogo de riscos predefinidos |
| `/imports` | `Imports` | Importação via CSV/Excel |
| `/audit` | `Audit` | Logs de auditoria |

---

## 5. REGRAS DE NEGÓCIO

### 5.1 Status do Laudo (Report)

**Estados e transições permitidas:**
```
DRAFT → IN_REVIEW → READY → SIGNED → ARCHIVED
   ↑        ↑          ↑
   └────────┴──────────┘   (retorno permitido até READY)
```

- **DRAFT**: Rascunho, pode editar tudo (dados, checklist, riscos, plano de ação, anexos).
- **IN_REVIEW**: Em revisão técnica (mantém edição, mas com trilha de auditoria reforçada).
- **READY**: Pronto para assinatura (gates OK; permite apenas ajustes mínimos e anexos finais).
- **SIGNED**: Laudo assinado e **imutável** (bloqueio técnico).
- **ARCHIVED**: Arquivado (somente leitura).

#### 5.1.1 Modos de assinatura (MVP e evolução)

O sistema deve suportar **um modo no MVP** e manter o modelo preparado para evolução:

- `EXTERNAL_UPLOAD` *(MVP recomendado)*: o PDF é assinado fora do sistema (certificado/ICP/provedor) e o usuário faz upload do **PDF final assinado** (`signed_pdf_file_id`).
- `SIMPLE_E_SIGN`: assinatura eletrônica simples (aceite + evidência; sem ICP-Brasil).
- `INTEGRATED_PROVIDER` *(planejado)*: integração com provedor de assinatura (ICP-Brasil/terceiros).

> Independente do modo, ao entrar em `SIGNED` o sistema grava `signed_hash_sha256`, `signed_at`, `signed_by` e (quando existir) `signature_metadata_json`.

#### 5.1.2 Imutabilidade (como garantir de verdade)

Imutabilidade não deve depender só da UI. Deve ser garantida em **duas camadas**:

1) **Banco de dados (PostgreSQL)**
- Triggers/constraints que bloqueiam `UPDATE`/`DELETE` em:
  - `reports` (exceto campos controlados: `status`, `signed_*`, `locked_at`, `signed_pdf_file_id`)
  - tabelas filhas associadas ao report (`checklist_responses`, `risk_*`, `action_*`, `report_machines`, etc.)
- Bloqueio condicionado a `reports.status = 'SIGNED'`.

2) **Backend (defesa em profundidade)**
- Middleware que recusa mutações quando `status='SIGNED'`.
- Cada tentativa bloqueada gera `audit_events` (ação `UPDATE` com erro).

**Snapshot opcional (recomendado):**
- Persistir `report_snapshot` (JSON) + `hash_sha256` no momento da assinatura para auditoria e reprodutibilidade.

### 5.2 Cálculo do HRN (Hazard Risk Number)

**Fórmula:**
```
HRN = SEVERIDADE (S) × PROBABILIDADE (P) × FREQUÊNCIA (F)
```

#### 5.2.1 Escalas oficiais (valores permitidos)

> Para evitar inconsistências (catálogo, relatórios e comparações), **S, P e F são discretos** e só aceitam os valores abaixo.

**Severidade (S):**
- `2`  Leve
- `4`  Moderada
- `6`  Significativa
- `8`  Grave
- `10` Catastrófica
- `25` Fatal

**Probabilidade (P):**
- `0.5` Remota
- `1`   Improvável
- `2`   Possível
- `4`   Provável
- `8`   Muito provável
- `10`  Quase certa

**Frequência (F):**
- `1`  Rara
- `2`  Ocasional
- `3`  Frequente
- `6`  Muito frequente
- `10` Contínua

**Validação (backend):**
- Rejeitar valores fora do domínio (422).
- Recalcular `hrn_number` sempre no servidor (não confiar no frontend).

#### 5.2.2 Classificação do risco (padrão do produto)

- `HRN < 50` → Aceitável
- `50 ≤ HRN < 200` → Tolerável
- `200 ≤ HRN < 400` → Inaceitável
- `HRN ≥ 400` → Crítico

> Observação: o **Catálogo de Riscos (Anexo C)** deve usar **exatamente estas escalas**.


### 5.3 Categorias de Funções de Segurança (NBR 14153)

| Categoria | Descrição | PL (Performance Level) |
|-----------|-----------|------------------------|
| **B** | Básica | - |
| **1** | Estrutura bem experimentada | a, b |
| **2** | Com verificação da função de segurança | c, d |
| **3** | Redundância sem falha comum | d, e |
| **4** | Redundância com monitoração | e |

### 5.4 Prioridades do Plano de Ação

| Prioridade | HRN Mínimo | Prazo Padrão |
|------------|------------|--------------|
| **CRITICAL** | ≥ 400 | 7 dias |
| **HIGH** | ≥ 200 | 15 dias |
| **MEDIUM** | ≥ 50 | 30 dias |
| **LOW** | < 50 | 60 dias |
| **IMPROVEMENT** | - | 90 dias |

### 5.5 Permissões (RBAC)

| Permissão | MASTER | TECHNICIAN | VIEWER |
|-----------|--------|------------|--------|
| Ler dados | ✅ | ✅ | ✅ |
| Criar/Editar máquinas | ✅ | ✅ | ❌ |
| Preencher checklist | ✅ | ✅ | ❌ |
| Assinar laudos | ✅ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ |

---

## 6. API ENDPOINTS PRINCIPAIS

### 6.0 Padrões de API (contrato)

- **Base path**: `/api/v1`
- **Auth**: `Authorization: Bearer <supabase_jwt>`
- **Paginação** (padrão):
  - `page` (1..n), `page_size` (1..100)
  - `sort` (ex.: `created_at.desc`)
  - `query` (busca textual quando aplicável)
- **Erros**:
  - `422` validação: `{ code, message, fields: { campo: "motivo" } }`
  - `401/403` autenticação/autorização
  - `409` conflito (ex.: tentativa de editar report SIGNED)
- **Idempotência**: rotas de jobs devem aceitar reexecução segura.

### 6.1 Autenticação

```
GET  /api/v1/health                 # Health check
GET  /api/v1/me                     # Dados do usuário logado + perfil/tenant
POST /api/v1/admin/setup            # Setup inicial do tenant (protegido por SETUP_TOKEN)
```

### 6.2 Dashboard

```
GET /api/v1/dashboard/metrics       # KPIs e métricas
```

### 6.3 Cadastros

```
GET    /api/v1/clients              # Listar clientes
POST   /api/v1/clients              # Criar cliente
PUT    /api/v1/clients/:id          # Atualizar cliente
DELETE /api/v1/clients/:id          # Deletar cliente

GET    /api/v1/sites                # Listar sites
POST   /api/v1/sites                # Criar site
PUT    /api/v1/sites/:id            # Atualizar site
DELETE /api/v1/sites/:id            # Deletar site

GET    /api/v1/machines             # Listar máquinas
POST   /api/v1/machines             # Criar máquina
PUT    /api/v1/machines/:id         # Atualizar máquina
DELETE /api/v1/machines/:id         # Deletar máquina
```

### 6.4 Laudos (Reports)

```
GET    /api/v1/reports              # Listar laudos (paginação obrigatória)
POST   /api/v1/reports              # Criar laudo (status=DRAFT)
GET    /api/v1/reports/:id          # Detalhes do laudo

PATCH  /api/v1/reports/:id          # Atualizar metadados do laudo (bloqueado em SIGNED)
POST   /api/v1/reports/:id/status   # Transição de status (valida gates + imutabilidade)

POST   /api/v1/reports/:id/render   # Enfileira geração de PDF (job)
GET    /api/v1/reports/:id/jobs     # Lista jobs relacionados (PDF/import/etc)

POST   /api/v1/reports/:id/sign     # Finaliza assinatura (conforme signature_mode)
```

### 6.5 Checklist e Risco

```
GET  /api/v1/reports/:id/checklist
PUT  /api/v1/reports/:id/checklist

GET  /api/v1/reports/:id/risks
PUT  /api/v1/reports/:id/risks
```

### 6.6 Arquivos (Evidências)

```
POST /api/v1/files/presign          # Cria URL/token de upload (com validações)
GET  /api/v1/files/:id/link         # Link temporário (expira; audita downloads)
```


## 7.
## 7. REQUISITOS TÉCNICOS

### 7.1 Requisitos Funcionais

1. **Multi-Tenancy**: Isolamento completo de dados entre empresas (RLS no Supabase/Postgres)
2. **Autenticação**: Supabase Auth (JWT validado via JWKS) + sessão no frontend
3. **Autorização**: RBAC com 3 perfis (Master, Technician, Viewer) + políticas RLS por tenant
4. **Offline (PWA)**: Suporte real a trabalho em campo com outbox, sync e tratamento de conflito (ver 2.5)
5. **PDF**: Geração de laudos em PDF profissional (rascunho e final assinado)
6. **Assinatura**: Modo MVP por upload de PDF assinado externamente + trilha e hash (evoluir para provedor integrado)
7. **Notificações**: Push e e-mail para prazos/eventos (assíncrono)
8. **Anexos**: Upload de fotos/documentos com links temporários e controle de acesso
9. **Importação**: CSV/Excel para carga em massa com validação e relatório de erros (job assíncrono)
10. **Auditoria**: Log imutável de operações críticas (inclui downloads/exportações e mudanças de status)
11. **Rate Limiting**: Proteção contra abuso (por IP/usuário/tenant)

### 7.2 Requisitos Não-Funcionais

1. **Performance (APIs)**
   - `p95 ≤ 300ms` em rotas CRUD/paginação.
   - `p99 ≤ 800ms` em rotas CRUD/paginação.
   - Operações pesadas (PDF, importação, mídia) devem ser **assíncronas**.

2. **Disponibilidade**: 99.9% uptime (SaaS)

3. **Escalabilidade**
   - Suporte inicial: `1000+ tenants` e crescimento horizontal de workers.
   - Paginação obrigatória em listagens e índices adequados no banco.

4. **Segurança**
   - RLS no banco + RBAC na API
   - CORS/CSP
   - Rate limiting
   - Links temporários para download (expiração) e trilha de auditoria para exportações

5. **Mobile**: PWA responsivo (iOS/Android) + modo offline projetado

6. **Backup & Retenção**
   - Backup diário do banco e storage
   - Política de retenção configurável por tenant (ex.: 5 anos para laudos/auditoria)

---

## 8. CONFIGURAÇÃO DE DESENVOLVIMENTO

### 8.1 Variáveis de Ambiente

**Backend (.env)**:
```env
PORT=4000

# Supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=xxx                  # usado apenas quando necessário (ex.: validações públicas)
SUPABASE_SERVICE_ROLE_KEY=xxx          # NUNCA expor no frontend
SUPABASE_JWKS_URL=https://project.supabase.co/auth/v1/.well-known/jwks.json

# Setup inicial (one-time)
SETUP_TOKEN=setup-token

# Workers/Jobs (opcional no MVP, recomendado)
REDIS_URL=redis://localhost:6379

# Downloads/links temporários
FILE_LINK_TTL_SECONDS=900
```


**Frontend (.env)**:
```env
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### 8.2 Comandos

```bash
# Instalação
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Docker
docker compose up -d
```

---

## 9. ROADMAP E MELHORIAS FUTURAS

### Fase 1 - MVP (Concluído)
- ✅ CRUD de cadastros
- ✅ Checklist NR-12
- ✅ Apreciação de risco HRN
- ✅ Geração de PDF
- ✅ Multi-tenant

### Fase 2 - Profissional (Concluído)
- ✅ PWA com offline
- ✅ Dashboard gerencial
- ✅ Sistema de notificações
- ✅ Segurança enterprise
- ✅ Modo escuro
- ✅ Documentação Swagger

### Fase 3 - Avançado (Planejado)
- ⏳ Integração com provedor de assinatura (ICP/terceiros)
- ⏳ IA para análise de imagens
- ⏳ Integração com ERPs
- ⏳ Aplicativo nativo
- ⏳ API pública
- ⏳ Blockchain para imutabilidade

---

## 10. CONSIDERAÇÕES IMPORTANTES

### 10.1 Compliance Normativo
O sistema deve garantir:
- Rastreabilidade completa (quem, quando, o quê)
- Imutabilidade após assinatura
- Validação de campos obrigatórios
- Conformidade com NR-12 e ISO 12100

### 10.2 Performance
- Paginação em todas as listagens
- Cache de dados estáticos
- Lazy loading de componentes
- Otimização de imagens

### 10.3 UX/UI
- Feedback visual para todas as ações
- Confirmação para operações destrutivas
- Auto-save de formulários
- Indicadores de progresso
- Mensagens de erro claras


### 10.4 Segurança de Arquivos e LGPD (mínimo obrigatório)

- **Uploads**:
  - validar `mime_type` + assinatura (magic bytes) para evitar spoofing
  - limitar tamanho por tipo e por tenant
  - bloquear extensões perigosas e conteúdo executável
- **Acesso**:
  - nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
  - downloads apenas via **link temporário** (TTL) e com verificação de tenant
  - links compartilhados devem ter expiração e revogação
- **Retenção/Exclusão**:
  - política de retenção configurável por tenant
  - exclusão lógica (soft delete) para laudos/auditoria, quando aplicável
- **Auditoria**:
  - registrar download/exportação de arquivos e PDF final

### 10.5 Auditoria e Rastreabilidade

O sistema deve registrar eventos em `audit_events` para:
- criação/edição/exclusão (quando permitido)
- mudanças de status (DRAFT/IN_REVIEW/READY/SIGNED/ARCHIVED)
- assinatura (modo, hash, usuário)
- exportações (PDF/ZIP/CSV) e downloads de evidências

> Eventos de auditoria devem ser imutáveis (sem delete físico) e com retenção conforme política.


---

## ANEXO A - CHECKLIST NR-12 COMPLETO

O sistema implementa um checklist digital baseado na Norma Regulamentadora NR-12, com **89 itens** organizados em categorias. Cada item pode ter os seguintes status:

- **COMPLIANT** (Conforme/Atende)
- **NONCOMPLIANT** (Não Conforme/Não Atende → gera ação obrigatória)
- **NOT_APPLICABLE** (Não Aplicável)

### A.1 Informações Técnicas (5.1.1)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.1-01 | Manuais técnicos em português | ✅ |
| 5.1.1-02 | Projetos técnicos disponíveis (mecânicos, elétricos, automação) | ✅ |
| 5.1.1-03 | Diagramas de blocos de segurança documentados | ✅ |
| 5.1.1-04 | Histórico de manutenção (registros de reparos e inspeções) | ✅ |
| 5.1.1-05 | Certificados de conformidade/EC (para máquinas importadas) | ✅ |
| 5.1.1-06 | ART – Responsabilidade Técnica (se houve modificações) | ✅ |

### A.2 Identificação (5.1.2)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.2-01 | Placa de identificação do fabricante legível | ✅ |
| 5.1.2-02 | Localização geograficamente adequada | ✅ |
| 5.1.2-03 | Espaço adequado para circulação (mín. 0,60 m - NR-12 12.3.2) | ✅ |
| 5.1.2-04 | Acesso fácil para manutenção | ✅ |
| 5.1.2-05 | Layout atualizado com máquinas identificadas | ✅ |

### A.3 Sinalização (5.1.3)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.3-01 | Sinalização de perigo (cores padrão NR-26) | ✅ |
| 5.1.3-02 | Placas de advertência adequadas | ✅ |
| 5.1.3-03 | Instruções de operação segura afixadas | ✅ |
| 5.1.3-04 | Indicadores de partes móveis | ✅ |
| 5.1.3-05 | Avisos de energia/voltagem | ✅ |
| 5.1.3-06 | Proibido ligar na manutenção (Lockout/tagout) | ✅ |

### A.4 Proteções (5.1.4)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.4-01 | Proteção fixa (impede acesso a partes móveis) | ✅ |
| 5.1.4-02 | Proteção móvel intertravada | ✅ |
| 5.1.4-03 | Distância de segurança (NBR ISO 13857) | ✅ |
| 5.1.4-04 | Ausência de arestas vivas | ✅ |
| 5.1.4-05 | Materiais de proteção adequados | ✅ |
| 5.1.4-06 | Fixação adequada das proteções | ✅ |

### A.5 Comandos (5.1.5)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.5-01 | Botão de partida posicionado de forma segura | ✅ |
| 5.1.5-02 | Chave de parada normal acessível | ✅ |
| 5.1.5-03 | Parada de emergência (botão vermelho/amarelo 60mm) | ✅ |
| 5.1.5-04 | E-stop testado (corta alimentação) | ✅ |
| 5.1.5-05 | Acionamento bimanual (se aplicável) | ✅ |
| 5.1.5-06 | Intertravamento de acesso | ✅ |
| 5.1.5-07 | Comando à distância seguro | ✅ |

### A.6 Segurança Avançada (5.1.6)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.6-01 | Cortina de luz (interrupção automática) | ✅ |
| 5.1.6-02 | Sensores de proximidade testados | ✅ |
| 5.1.6-03 | PLC/Relé de segurança (Categoria 2, 3 ou 4) | ✅ |
| 5.1.6-04 | Alavanca de liberação após parada | ✅ |
| 5.1.6-05 | Velocidade de parada controlada | ✅ |

### A.7 Manutenção (5.1.7)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.7-01 | Procedimento de manutenção documentado | ✅ |
| 5.1.7-02 | Acesso ao painel elétrico seguro | ✅ |
| 5.1.7-03 | Dissipação de energia residual | ✅ |
| 5.1.7-04 | Lockout/tagout implementado | ✅ |
| 5.1.7-05 | Ferramentas específicas para ajuste | ✅ |
| 5.1.7-06 | Registro de inspeção de manutenção | ✅ |

### A.8 Limpeza (5.1.8)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.8-01 | Procedimento de limpeza seguro | ✅ |
| 5.1.8-02 | Plano de inspeção periódica definido | ✅ |
| 5.1.8-03 | Inspeção visual de desgaste | ✅ |
| 5.1.8-04 | Testes de funcionalidade | ✅ |

### A.9 Elétrica (5.1.9) - NR-10

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.1.9-01 | Aterramento adequado (Resistência ≤ 10 Ω) | ✅ |
| 5.1.9-02 | Disjuntor e proteção DR dimensionados | ✅ |
| 5.1.9-03 | Caixa de entrada identificada | ✅ |
| 5.1.9-04 | Cabos e conectores em bom estado | ✅ |
| 5.1.9-05 | Extensões temporárias eliminadas | ✅ |
| 5.1.9-06 | Conformidade NR-10 | ✅ |

### A.10 Máquinas Específicas - Conformação (5.2.1)

*Itens condicionais (aplicáveis apenas a prensas, plastoformas, sopradoras)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.1-01 | Comando bimanual obrigatório | Condicional |
| 5.2.1-02 | Ciclo único de acionamento | Condicional |
| 5.2.1-03 | Freio de parada (< 5s) | Condicional |
| 5.2.1-04 | Proteção fixa área de trabalho | Condicional |
| 5.2.1-05 | Dispositivo de retirada de peças | Condicional |
| 5.2.1-06 | Função inching (manobra lenta) | Condicional |
| 5.2.1-07 | Válvulas de segurança testadas | Condicional |
| 5.2.1-08 | Manutenção de moldes segura | Condicional |

### A.11 Máquinas Específicas - Rotativas (5.2.2)

*Itens condicionais (tornos, furadeiras, fresadoras)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.2-01 | Proteção contra apreensão (cabelo/roupa) | Condicional |
| 5.2.2-02 | Proteção de ferramenta (protetor até 6 mm) | Condicional |
| 5.2.2-03 | Proteção de peça/placa | Condicional |
| 5.2.2-04 | Distância de segurança (mín. 30 mm) | Condicional |
| 5.2.2-05 | Parada por inércia (< 10s) | Condicional |
| 5.2.2-06 | Chave com mola de retorno | Condicional |
| 5.2.2-07 | Refrigeração/lubrificação segura | Condicional |
| 5.2.2-08 | Mandril/placa segura | Condicional |

### A.12 Máquinas Específicas - Corte (5.2.3)

*Itens condicionais (serras, tesouras, guilhotinas)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.3-01 | Proteção da lâmina/serra | Condicional |
| 5.2.3-02 | Comando bimanual/pedal seguro | Condicional |
| 5.2.3-03 | Parada de emergência próxima | Condicional |
| 5.2.3-04 | Proteção traseira da lâmina | Condicional |
| 5.2.3-05 | Sistema de avanço seguro | Condicional |
| 5.2.3-06 | Protetor de dedos | Condicional |
| 5.2.3-07 | Validação de angulação | Condicional |

### A.13 Máquinas Específicas - Elevação (5.2.4)

*Itens condicionais (pontes rolantes, guinchos, elevadores)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.4-01 | Carga máxima visível | Condicional |
| 5.2.4-02 | Inspeção periódica certificada | Condicional |
| 5.2.4-03 | Correntes/cabos/eslingas sem falhas | Condicional |
| 5.2.4-04 | Freio funcional (testado sob carga) | Condicional |
| 5.2.4-05 | Limitador de velocidade | Condicional |
| 5.2.4-06 | Comando de acionamento claro | Condicional |
| 5.2.4-07 | Proteção contra sobrecarga | Condicional |
| 5.2.4-08 | Segurança contra queda | Condicional |

### A.14 Máquinas Específicas - Cozinha Industrial (5.2.5)

*Itens condicionais (fritadeiras, fornos, misturadores)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.5-01 | Zona de perigo delimitada | Condicional |
| 5.2.5-02 | Proteção de peças móveis | Condicional |
| 5.2.5-03 | Temperatura sinalizada | Condicional |
| 5.2.5-04 | Alça/pegadeira segura | Condicional |
| 5.2.5-05 | Parada de emergência acessível | Condicional |
| 5.2.5-06 | Proteção contra acionamento acidental | Condicional |
| 5.2.5-07 | Drenagem segura | Condicional |
| 5.2.5-08 | Limpeza segura | Condicional |
| 5.2.5-09 | Energia de backup desligada | Condicional |

### A.15 Máquinas Específicas - Embalagem (5.2.6)

*Itens condicionais (seladoras, encartuchadoras)*

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.2.6-01 | Zona de apreensão protegida | Condicional |
| 5.2.6-02 | Ciclo contínuo com parada segura | Condicional |
| 5.2.6-03 | Controle de temperatura | Condicional |
| 5.2.6-04 | Parada ao abrir guarda | Condicional |
| 5.2.6-05 | Tempo de parada < 10s | Condicional |
| 5.2.6-06 | Ajuste de velocidade protegido | Condicional |

### A.16 Capacitação (5.3)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.3-01 | Treinamento inicial dos operadores | ✅ |
| 5.3-02 | Conteúdo documentado (tema, data, instrutor) | ✅ |
| 5.3-03 | Reciclagem periódica (mínimo anual) | ✅ |
| 5.3-04 | Registro de competência (avaliação) | ✅ |
| 5.3-05 | Treinamento de manutenção | ✅ |
| 5.3-06 | Instrutor qualificado | ✅ |
| 5.3-07 | Material didático disponível | ✅ |

### A.17 Gestão (5.4)

| Código | Item | Obrigatório |
|--------|------|-------------|
| 5.4-01 | Inventário atualizado de máquinas | ✅ |
| 5.4-02 | Prontuário individual por máquina | ✅ |
| 5.4-03 | Histórico de manutenção | ✅ |
| 5.4-04 | Registro de inspeções visuais | ✅ |
| 5.4-05 | Plano de ação de não conformidades | ✅ |
| 5.4-06 | Acompanhamento de ações | ✅ |
| 5.4-07 | Responsável pela segurança designado | ✅ |
| 5.4-08 | Comunicação de riscos | ✅ |
| 5.4-09 | Cumprimento de normas complementares (NR-5, 6, 9, 10, 17) | ✅ |

---

## ANEXO B - CÁLCULO DO HRN (Hazard Risk Number)

### Fórmula
```
HRN = SEVERIDADE × PROBABILIDADE × FREQUÊNCIA
```

### Severidade (S)

| Valor | Descrição | Exemplo |
|-------|-----------|---------|
| 2 | Leve | Cortes leves, pequenos machucados |
| 4 | Moderada | Cortes profundos, fraturas simples |
| 6 | Significativa | Fraturas múltiplas, amputações parciais |
| 8 | Grave | Amputação, lesão irreversível |
| 10 | Catastrófica | Incapacidade permanente |
| 25 | Fatal | Morte |

### Probabilidade (P)

| Valor | Descrição |
|-------|-----------|
| 0.5 | Remota |
| 1 | Pouco provável |
| 2 | Possível |
| 4 | Provável |
| 8 | Muito provável |
| 10 | Certa |

### Frequência (F)

| Valor | Descrição |
|-------|-----------|
| 1 | Rara |
| 2 | Pouco frequente |
| 3 | Frequente |
| 6 | Muito frequente |
| 10 | Contínua |

### Classificação do Risco

| HRN | Classificação | Ação Requerida |
|-----|---------------|----------------|
| < 50 | Aceitável | Monitoramento |
| 50 - 199 | Tolerável | Plano de ação recomendado |
| 200 - 399 | Inaceitável | Plano de ação obrigatório |
| ≥ 400 | Crítico | Parada imediata + ação emergencial |

---

## ANEXO C - CATÁLOGO DE RISCOS (HRN)

O sistema possui um catálogo pré-cadastrado de riscos comuns em máquinas industriais. Cada risco inclui valores padrão para cálculo do HRN e categoria de segurança sugerida.

> Importante: os valores de **S, P e F** seguem **exatamente** as escalas definidas em **5.2.1** (valores discretos). O sistema **recalcula** o HRN no servidor.

### Riscos Mecânicos

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Esmagamento em partes móveis | Esmagamento | Zona de conformação | Lesão grave | 8 | 4 | 3 | 96 | 3 |
| Corte em partes rotativas | Corte | Eixo/rotor exposto | Amputação | 10 | 4 | 3 | 120 | 3 |
| Aprisionamento em pontos de nip | Aprisionamento | Correias e polias | Lesão grave | 8 | 4 | 3 | 96 | 2 |
| Projeção de partículas | Projeção | Área de usinagem | Lesão ocular | 6 | 2 | 3 | 36 | 2 |
| Arraste por correia | Arraste | Transmissão | Fraturas | 6 | 4 | 3 | 72 | 2 |
| Corte por lâminas expostas | Corte | Lâminas | Lesão grave | 8 | 4 | 3 | 96 | 3 |
| Entalamento em guilhotina | Entalamento | Ponto de corte | Amputação | 10 | 4 | 3 | 120 | 4 |

### Riscos de Elevação

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Queda de carga | Queda de carga | Zona de elevação | Lesão grave | 8 | 2 | 2 | 32 | 3 |

### Riscos Elétricos

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Choque elétrico | Choque elétrico | Painel/quadros | Queimaduras | 8 | 2 | 2 | 32 | 2 |

### Riscos Térmicos

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Contato com superfície quente | Queimadura | Resistência/forno | Queimadura | 4 | 4 | 6 | 96 | 1 |

### Riscos de Transporte/Movimentação

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Atropelamento por paleteira | Atropelamento | Área de movimentação | Fraturas | 6 | 2 | 1 | 12 | 1 |

### Riscos em Embalagem

| Risco | Perigo | Localização | Consequência | S | P | F | HRN | Categoria |
|-------|--------|-------------|--------------|---|---|---|-----|-----------|
| Esmagamento em máquina de embalagem | Esmagamento | Ponto de selagem | Lesão grave | 8 | 4 | 3 | 96 | 2 |

### Tipos de Máquinas Suportados

O catálogo cobre os seguintes tipos de máquinas:

| Tipo | Descrição | Exemplos |
|------|-----------|----------|
| **CONFORMACAO** | Máquinas de conformação | Prensas, dobradeiras, plastoformas, sopradoras |
| **ROTATIVA** | Máquinas rotativas | Tornos, furadeiras, fresadoras, retíficas |
| **CORTE** | Máquinas de corte | Serras, guilhotinas, tesouras, laser |
| **ELEVACAO** | Equipamentos de elevação | Pontes rolantes, guinchos, elevadores, talhas |
| **COZINHA** | Equipamentos de cozinha industrial | Fritadeiras, fornos, misturadores, seladoras |
| **EMBALAGEM** | Máquinas de embalagem | Seladoras, encartuchadoras, paletizadoras |

### Personalização do Catálogo

- O catálogo pode ser expandido com novos riscos específicos
- Cada tenant pode adicionar riscos personalizados
- O sistema sugere automaticamente os valores padrão ao avaliar uma máquina

---


## ANEXO D - SISTEMA DE EVIDÊNCIAS (MÍDIAS)

O sistema possui um módulo completo para coleta e gestão de evidências durante os levantamentos técnicos.

### D.1 Tipos de Mídia Suportados

| Tipo | Formatos | Tamanho Máx. | Uso |
|------|----------|--------------|-----|
| **Fotos** | JPG, PNG, WEBP | 10 MB | Evidências visuais, placas, proteções, danos |
| **Textos** | TXT, Markdown | 1 MB | Anotações, descrições detalhadas, observações |
| **Áudios** | MP3, WAV, OGG | 50 MB | Narração de inspeção, entrevistas, explicações |
| **Vídeos** | MP4, WEBM | 100 MB | Demonstração de funcionamento, testes |
| **Documentos** | PDF, DOC, XLS | 20 MB | Manuais, certificados, ART, projetos |

### D.2 Vinculação de Evidências

As evidências podem ser vinculadas a:

1. **Máquinas (Assets)**
   - Foto da placa de identificação
   - Fotos de proteções e dispositivos de segurança
   - Vídeo de funcionamento
   - Áudio descrevendo condições

2. **Locais (Sites)**
   - Fotos do layout
   - Evidências de sinalização
   - Condições ambientais

3. **Checklist NR-12**
   - Evidência fotográfica de não conformidades
   - Áudio explicando o problema
   - Texto detalhando a observação

4. **Riscos (Risk Assessments)**
   - Fotos do ponto de perigo
   - Vídeo demonstrando o risco
   - Áudio descrevendo a exposição

5. **Plano de Ação**
   - Foto "antes" da não conformidade
   - Foto "depois" da correção
   - Comprovação da implementação

### D.3 Funcionalidades do Módulo de Mídias

1. **Upload Múltiplo**
   - Seleção de vários arquivos simultâneos
   - Drag & drop
   - Preview antes do envio

2. **Captura em Tempo Real (Mobile)**
   - Câmera integrada para fotos
   - Gravador de áudio
   - Geolocalização automática
   - Timestamp

3. **Organização**
   - Categorização por tipo
   - Tags para busca
   - Data e responsável
   - Status (pendente/revisado/arquivado)

4. **Visualização**
   - Galeria de fotos com zoom
   - Player de áudio/vídeo
   - Visualizador de documentos
   - Tela cheia

5. **Compartilhamento**
   - Links temporários para clientes
   - Exportação em ZIP
   - Inclusão automática no PDF do laudo

### D.4 Armazenamento

- **Backend**: Supabase Storage
- **Estrutura**: `tenant_id/entity_type/entity_id/filename`
- **Backup**: Automático diário
- **CDN**: Distribuição global para acesso rápido
- **Segurança**: Acesso via link temporário (TTL) e validação de tenant (JWT)

### D.5 Tabela de Banco de Dados

**files** - Registro de arquivos
- `id`, `tenant_id` (FK)
- `bucket`, `path`, `filename`
- `mime_type`, `size_bytes`
- `created_by` (FK), `created_at`

**machine_files** - Vínculo máquina-arquivo
- `id`, `tenant_id` (FK), `machine_id` (FK), `file_id` (FK)
- `category`, `note`, `created_at`

**machine_notes** - Notas de texto
- `id`, `tenant_id` (FK), `machine_id` (FK)
- `title`, `body`, `created_by` (FK), `created_at`

---

## ANEXO E - IMPORTAÇÃO CSV

O sistema permite importação em massa de dados via arquivos CSV/Excel para agilizar o cadastro.

### E.1 Entidades Suportadas

| Entidade | Operação | Campos Principais |
|----------|----------|-------------------|
| **Clientes** | INSERT | name, trade_name, cnpj, address, contact_* |
| **Sites** | INSERT | name, address, client_id (ou nome para matching) |
| **Máquinas** | INSERT/UPDATE | tag, name, machine_type, site_id, client_id |
| **Checklist** | INSERT | machine_id, requirement_code, status |

### E.2 Formato do Arquivo CSV

**Clientes (clients.csv)**
```csv
name,trade_name,cnpj,address,address_number,city,state,zip_code,contact_name,contact_email,contact_phone
Indústria ABC Ltda,ABC Indústria,12.345.678/0001-90,Rua das Flores,123,São Paulo,SP,01234-000,João Silva,joao@abc.com.br,(11) 98765-4321
```

**Máquinas (machines.csv)**
```csv
client_name,site_name,tag,name,machine_type,manufacturer,model,serial_number,year,voltage,location
Indústria ABC Ltda,Fábrica Principal,PRE-001,Prensa Hidraulica 200T,CONFORMACAO,MetalPress,PH-200,SN123456,2019,380V,Sector A - Linha 1
```

### E.3 Funcionalidades da Importação

1. **Validação de Dados**
   - Verificação de campos obrigatórios
   - Validação de CNPJ
   - Verificação de e-mails
   - Duplicidade (por CNPJ para clientes, por tag para máquinas)

2. **Matching Inteligente**
   - Busca de clientes por nome (fuzzy matching)
   - Busca de sites por nome
   - Vinculação automática por nomes similares

3. **Preview Antes da Importação**
   - Listagem de registros válidos
   - Alerta de registros com erro
   - Contagem de registros a serem criados/atualizados

4. **Relatório de Importação**
   - Total de registros processados
   - Quantidade de sucessos
   - Quantidade de falhas
   - Detalhamento dos erros por linha

5. **Importação em Lote**
   - Processamento de até 1.000 registros por arquivo
   - Progresso em tempo real
   - Possibilidade de cancelamento

### E.4 Endpoints de Importação

```
POST /api/imports/clients       # Importar clientes
POST /api/imports/machines      # Importar máquinas
POST /api/imports/validate      # Validar arquivo sem importar
GET  /api/imports/template/:type # Download de template CSV
```

### E.5 Templates Disponíveis

O sistema fornece templates CSV de exemplo para download:

- `template_clientes.csv`
- `template_maquinas.csv`
- `template_sites.csv`
- `template_checklist.csv`

### E.6 Regras de Negócio

1. **Segurança**
   - Apenas usuários com permissão MASTER ou TECHNICIAN podem importar
   - Todos os registros são vinculados ao tenant do usuário
   - Log de auditoria da operação de importação

2. **Validações Específicas**
   - Cliente: CNPJ único no tenant
   - Máquina: Tag única no tenant
   - Site: Nome único por cliente
   - Checklist: Máquina e requisito devem existir

3. **Comportamento em Duplicidade**
   - Cliente: Atualiza dados se CNPJ existir
   - Máquina: Atualiza dados se TAG existir
   - Site: Ignora se nome+cliente existir
   - Checklist: Atualiza status se já existir

---

**Documento Version:** 1.2  
**Data:** Fevereiro de 2026  
**Sistema:** NR-12 Safety Inspector Pro
