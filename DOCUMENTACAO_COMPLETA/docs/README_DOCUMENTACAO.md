# 📚 Documentação do Sistema NR-12 Safety Inspector

## Arquivos de Documentação

### 1. Manual do Usuário
**Arquivo:** `MANUAL_USUARIO.md`

Documentação completa para usuários finais do sistema, incluindo:
- Primeiros passos e configuração inicial
- Guia detalhado de cada funcionalidade
- Explicação dos fluxos de trabalho
- Dicas e boas práticas
- FAQ e suporte

**Para quem é:** Todos os usuários do sistema (MASTER, TECHNICIAN, VIEWER)

---

### 2. Documentação Técnica
**Arquivo:** `DOCUMENTACAO_TECNICA.md`

Documentação completa para desenvolvedores e administradores, incluindo:
- Arquitetura do sistema
- Stack tecnológico
- Modelo de dados (ERD)
- API e endpoints
- Autenticação e autorização (RBAC)
- Componentes React
- Fluxos de trabalho
- Deploy e infraestrutura
- Segurança e performance

**Para quem é:** Desenvolvedores, DevOps, Administradores técnicos

---

## Como Usar Estas Documentações

### Para Usuários

1. Comece pelo **Manual do Usuário**
2. Leia a seção "Primeiros Passos"
3. Consulte as seções específicas conforme sua necessidade
4. Verifique seu perfil de acesso em "Perfis de Usuário"

### Para Desenvolvedores

1. Leia a **Documentação Técnica** completa
2. Entenda a arquitetura na seção "Arquitetura do Sistema"
3. Consulte o "Modelo de Dados" para entender as relações
4. Use "Componentes React" como referência de padrões

### Para Administradores

1. Leia ambos os manuais
2. Siga o Manual do Usuário para operação
3. Use a Documentação Técnica para configuração e troubleshooting

---

## Checklist de Implantação

### 1. Configuração do Banco de Dados

Execute os SQLs na seguinte ordem:

```sql
-- 1. Schema base (se aplicável)
database/schema.sql

-- 2. Correções necessárias
database/fix_report_columns.sql
database/fix_file_columns_type.sql

-- 3. Funcionalidades Semana 3
database/add_report_signing.sql

-- 4. Funcionalidades Semana 4
database/add_sites_table.sql
database/add_audit_table.sql
database/add_notifications_table.sql
database/add_rbac.sql

-- 5. Storage (criar via interface se der erro)
database/setup_storage_documents.sql
```

### 2. Configuração do Storage

No painel do Supabase:
1. Crie o bucket `documents` (privado)
2. Configure as políticas de acesso
3. Defina tipos MIME permitidos (PDF, JPG, PNG)
4. Limite de 50MB por arquivo

### 3. Deploy do Frontend

```bash
# Build
npm run build

# Deploy (exemplo Vercel)
vercel --prod

# Ou copie a pasta /dist para seu servidor
```

### 4. Configuração Inicial

1. Acesse o sistema
2. Faça login com o primeiro usuário (será MASTER automaticamente)
3. Configure os dados da empresa em "Minha Empresa"
4. Cadastre os demais usuários
5. Defina as permissões (MASTER/TECHNICIAN/VIEWER)

---

## Sumário de Funcionalidades

### Módulos Implementados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | ✅ | Multi-tenant com JWT |
| Dashboard | ✅ | Métricas e alertas em tempo real |
| Clientes | ✅ | CRUD completo |
| Locais/Filiais | ✅ | Multi-site por cliente |
| Máquinas | ✅ | Cadastro técnico completo |
| Ordens de Serviço | ✅ | Gestão de trabalhos |
| Laudos | ✅ | Ciclo completo com assinatura |
| Checklist NR-12 | ✅ | 89 itens com evidências |
| Apreciação de Risco | ✅ | Cálculo HRN |
| Plano de Ação | ✅ | Gestão de não conformidades |
| Treinamentos | ✅ | Controle de certificações |
| Auditoria | ✅ | Log completo de ações |
| Notificações | ✅ | Alertas em tempo real |
| RBAC | ✅ | Perfis de acesso |

---

## Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| **MASTER** | Acesso total, gerencia usuários, assina laudos |
| **TECHNICIAN** | Cria/edita dados, não assina, não gerencia usuários |
| **VIEWER** | Somente visualização e relatórios |

---

## Suporte

### Problemas Comuns

**Erro: "Bucket not found"**
- Solução: Criar bucket `documents` no Supabase Storage

**Erro: "Column does not exist"**
- Solução: Executar SQLs de correção na ordem correta

**Erro: "new row violates row-level security policy"**
- Solução: Verificar se o usuário tem perfil criado na tabela `profiles`

### Contato

Para suporte técnico ou dúvidas:
- Email: [suporte@empresa.com]
- Documentação: `/docs`

---

## Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | Fev/2025 | Release inicial com Semanas 3 e 4 |

---

**Sistema:** NR-12 Safety Inspector  
**Versão:** 1.0.0  
**Última Atualização:** Fevereiro 2025
