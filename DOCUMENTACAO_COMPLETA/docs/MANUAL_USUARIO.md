# Manual do Usuário - NR-12 Safety Inspector

## 📚 Sumário

1. [Introdução](#introdução)
2. [Primeiros Passos](#primeiros-passos)
3. [Dashboard](#dashboard)
4. [Gestão de Clientes](#gestão-de-clientes)
5. [Gestão de Locais/Filiais](#gestão-de-locaisfiliais)
6. [Gestão de Máquinas](#gestão-de-máquinas)
7. [Ordens de Serviço](#ordens-de-serviço)
8. [Laudos Técnicos](#laudos-técnicos)
9. [Checklist NR-12](#checklist-nr-12)
10. [Apreciação de Risco](#apreciação-de-risco)
11. [Plano de Ação](#plano-de-ação)
12. [Treinamentos](#treinamentos)
13. [Assinatura de Laudos](#assinatura-de-laudos)
14. [Auditoria](#auditoria)
15. [Configurações](#configurações)
16. [Perfis de Usuário](#perfis-de-usuário)
17. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## Introdução

O **NR-12 Safety Inspector** é um sistema completo para gestão de laudos técnicos de segurança de máquinas, conforme a Norma Regulamentadora NR-12 do Brasil.

### Funcionalidades Principais

- ✅ Cadastro e gestão de clientes, locais e máquinas
- ✅ Checklist digital NR-12 com 89 itens de verificação
- ✅ Apreciação de Risco HRN (Hazard Risk Number)
- ✅ Geração de Planos de Ação corretivos
- ✅ Controle de treinamentos de operadores
- ✅ Emissão de laudos técnicos com assinatura digital
- ✅ Auditoria completa de todas as ações
- ✅ Sistema de notificações e alertas

---

## Primeiros Passos

### 1. Acesso ao Sistema

1. Acesse a URL do sistema fornecida pelo administrador
2. Faça login com seu email e senha
3. Na primeira vez, você será redirecionado para configurar sua empresa

### 2. Configuração Inicial

Após o primeiro login:

1. Vá em **"Minha Empresa"** no menu lateral
2. Preencha os dados da sua empresa:
   - Razão Social
   - CNPJ
   - Endereço completo
   - Dados do responsável técnico
   - Número do CREA
3. Clique em **"Salvar Alterações"**

> **Nota:** Apenas usuários com perfil **MASTER** podem alterar estas configurações.

---

## Dashboard

O Dashboard é a tela inicial do sistema e apresenta uma visão geral da sua operação.

### Cards de Estatísticas

- **Total de Clientes**: Quantidade de clientes cadastrados
- **Total de Máquinas**: Máquinas em todo o sistema
- **Laudos Emitidos**: Total de laudos técnicos
- **Taxa de Conformidade**: Porcentagem de máquinas com risco aceitável

### Alertas e Pendências

O Dashboard exibe 4 colunas de alertas:

| Alerta | Descrição | Ação |
|--------|-----------|------|
| **Laudos Vencendo** | Laudos assinados próximos ao vencimento | Renovar laudo |
| **Ações Pendentes** | Itens do plano de ação não concluídos | Executar ação |
| **Treinamentos** | Certificações próximas ao vencimento | Reciclagem |
| **Riscos Críticos** | Máquinas com HRN > 200 | Priorizar correção |

### Índice de Conformidade NR-12

Gráfico mostrando a distribuição das máquinas por nível de risco:
- **Aceitável** (verde)
- **Tolerável** (amarelo)
- **Inaceitável** (laranja)
- **Crítico** (vermelho)

---

## Gestão de Clientes

### Cadastrar um Novo Cliente

1. Clique em **"Clientes"** no menu lateral
2. Clique no botão **"Novo Cliente"**
3. Preencha os dados:
   - **Razão Social*** (obrigatório)
   - Nome Fantasia
   - CNPJ
   - Endereço completo
   - Telefone e Email
   - Nome do contato técnico
4. Clique em **"Criar"**

### Editar um Cliente

1. Na lista de clientes, clique no ícone de lápis (✏️) no card do cliente
2. Altere os dados necessários
3. Clique em **"Salvar"**

### Excluir um Cliente

> ⚠️ **Atenção:** Ao excluir um cliente, todas as máquinas e laudos vinculados serão mantidos, mas não será possível criar novos registros para este cliente.

1. Clique no ícone de lixeira (🗑️) no card do cliente
2. Confirme a exclusão

---

## Gestão de Locais/Filiais

Os locais permitem que um cliente tenha múltiplas unidades/filiais cadastradas.

### Cadastrar um Local

1. Acesse **"Locais"** no menu lateral
2. Clique em **"Novo Local"**
3. Preencha:
   - **Nome do Local*** (ex: Matriz, Filial SP)
   - **Cliente*** (vincular a um cliente)
   - Código (opcional, ex: MAT, FIL-SP)
   - Endereço completo
   - Dados de contato
4. Clique em **"Criar"**

### Status do Local

- **Ativo**: Disponível para vincular máquinas
- **Inativo**: Não aparece nas listas, mas mantém histórico

Use o botão de toggle (⚫/⚪) para ativar/desativar.

### Vincular Máquina a um Local

Ao cadastrar ou editar uma máquina:
1. Selecione o cliente
2. O campo **"Local/Filial"** aparecerá com os locais disponíveis
3. Selecione o local desejado

---

## Gestão de Máquinas

### Cadastrar uma Máquina

1. Acesse **"Máquinas"** no menu lateral
2. Clique em **"Nova Máquina"**
3. Preencha as abas:

#### Aba Básico
- **Cliente*** e **Local** (se houver)
- **TAG/Identificação*** (código único, ex: MAT-PREN-001)
- **Nome da Máquina***
- **Tipo da Máquina*** (Prensa, Torno, etc.)
- **Criticidade** (Baixa, Média, Alta, Crítica)

#### Aba Técnico
- Fabricante, Modelo, Ano
- Potência, Tensão, Frequência
- Fontes de energia (Elétrica, Pneumática, etc.)
- Anexos NR-12 aplicáveis

#### Aba Localização
- Setor/Planta
- Linha de produção
- Local específico

4. Clique em **"Salvar"**

### Gerar QR Code

Cada máquina possui um QR Code único que pode ser impresso e colado no equipamento. Ao escanear, o técnico pode acessar diretamente os dados da máquina.

---

## Ordens de Serviço

As Ordens de Serviço (OS) agrupam trabalhos relacionados a um cliente.

### Criar uma OS

1. Acesse **"Ordens de Serviço"**
2. Clique em **"Nova OS"**
3. Preencha:
   - **Título*** (ex: Inspeção NR-12 - Setor de Prensas)
   - **Cliente***
   - Número da ART (se houver)
   - Data de início e prazo
   - Valor estimado (opcional)
4. Clique em **"Criar"**

### Status da OS

- **Pendente**: Aguardando início
- **Em Andamento**: Trabalho iniciado
- **Concluído**: Todas as atividades finalizadas
- **Cancelado**: OS cancelada

### Vincular Laudo a uma OS

Ao criar um novo laudo:
1. Selecione o cliente
2. Escolha a OS disponível (opcional)
3. Continue o fluxo normal

---

## Laudos Técnicos

### Criar um Novo Laudo

1. Acesse **"Laudos"** no menu lateral
2. Clique em **"Novo Laudo"**
3. Siga o assistente de 4 passos:

**Passo 1**: Selecione o Cliente
**Passo 2**: Escolha a Ordem de Serviço (opcional)
**Passo 3**: Selecione a Máquina
**Passo 4**: Escolha a versão do checklist e informe o título

### Status do Laudo

| Status | Descrição | Quem pode editar |
|--------|-----------|------------------|
| **Rascunho** | Em elaboração | Técnicos e Master |
| **Pronto** | Aguardando assinatura | Técnicos e Master |
| **Assinado** | Finalizado e bloqueado | Ninguém (imutável) |

### Abas do Laudo

#### 1. Visão Geral
Resumo do laudo com dados da máquina, cliente e status atual.

#### 2. Checklist
Execução do checklist NR-12 com 89 itens:
- **Conforme** (✅ Verde)
- **Não Conforme** (❌ Vermelho - gera ação)
- **Não Aplicável** (➖ Cinza)

Para cada item, você pode:
- Adicionar observações
- Anexar até 3 fotos (Contexto, Detalhe, Placa)

#### 3. Riscos
Apreciação de Risco HRN:
- Identifique os perigos
- Calcule o HRN (Severidade × Probabilidade × Frequência)
- Defina o nível de risco
- Estabeleça ações de controle

#### 4. Plano de Ação
Lista automática de ações geradas dos itens "Não Conforme" do checklist.

Cada ação deve ter:
- Prioridade (Crítica, Alta, Média, Baixa)
- Descrição do que deve ser feito
- Prazo
- Responsável
- Fotos do antes/depois

#### 5. Validação
Checklist de testes práticos de segurança.

---

## Checklist NR-12

O checklist possui **89 itens** organizados em categorias:

### Categorias

1. **Dispositivos de Parada de Emergência**
2. **Dispositivos de Enclausuramento**
3. **Dispositivos de Comando Bimanual**
4. **Dispositivos de Acionamento Mantido**
5. **Dispositivos de Intertravamento**
6. **Proteções Coletivas**
7. **Sinalização de Segurança**
8. **Itens Específicos por Tipo de Máquina**

### Como Preencher

1. Expanda a categoria desejada
2. Para cada item, selecione:
   - **Conforme**: Atende ao requisito
   - **Não Conforme**: Não atende (gera ação automática)
   - **Não Aplicável**: Item não se aplica à máquina
3. Adicione observações quando necessário
4. Anexe fotos como evidência

### Fotos de Evidência

Tipos de foto disponíveis:
- **Contexto**: Visão geral da área
- **Detalhe**: Close do problema/conformidade
- **Placa/ID**: Identificação da máquina

---

## Apreciação de Risco

### Metodologia HRN

O HRN (Hazard Risk Number) é calculado por:

```
HRN = Severidade × Probabilidade × Frequência
```

### Escala de Severidade (S)

| Valor | Descrição |
|-------|-----------|
| 2 | Leve |
| 4 | Moderada |
| 6 | Significativa |
| 8 | Grave |
| 10 | Catastrófica |
| 25 | Fatal |

### Escala de Probabilidade (P)

| Valor | Descrição |
|-------|-----------|
| 0.5 | Remota |
| 1 | Improvável |
| 2 | Possível |
| 4 | Provável |
| 8 | Muito provável |
| 10 | Quase certa |

### Escala de Frequência (F)

| Valor | Descrição |
|-------|-----------|
| 1 | Rara |
| 2 | Ocasional |
| 3 | Frequente |
| 6 | Muito frequente |
| 10 | Contínua |

### Classificação do Risco

| HRN | Classificação | Ação |
|-----|---------------|------|
| < 50 | Aceitável | Monitorar |
| 50-199 | Tolerável | Melhoria recomendada |
| 200-399 | Inaceitável | Ação necessária |
| ≥ 400 | Crítico | Ação imediata |

---

## Plano de Ação

### Gerenciamento de Ações

As ações são geradas automaticamente dos itens "Não Conforme" do checklist.

### Prioridades

| Prioridade | Prazo Padrão | Cor |
|------------|--------------|-----|
| **Crítica** | 7 dias | 🔴 Vermelho |
| **Alta** | 15 dias | 🟠 Laranja |
| **Média** | 30 dias | 🟡 Amarelo |
| **Baixa** | 60 dias | 🔵 Azul |

### Ciclo de Vida de uma Ação

1. **Aberta**: Criada automaticamente ou manualmente
2. **Em Andamento**: Alguém iniciou o trabalho
3. **Concluída**: Ação executada, aguardando verificação
4. **Verificada**: Confirmada e fechada

### Evidências

Para cada ação, anexar:
- **Foto Antes**: Situação original
- **Foto Depois**: Situação corrigida

---

## Treinamentos

### Cadastrar Treinamento

1. Acesse **"Treinamentos"**
2. Clique em **"Novo Treinamento"**
3. Preencha:
   - Tipo (Inicial ou Reciclagem)
   - Nome do Colaborador
   - Cliente/Empresa
   - Máquina (opcional)
   - Carga horária
   - Data de validade
   - Número do certificado
4. Clique em **"Cadastrar"**

### Alertas de Vencimento

O sistema alerta automaticamente quando:
- Faltam 30 dias para vencer
- Faltam 60 dias para vencer
- Faltam 90 dias para vencer

---

## Assinatura de Laudos

### Quando Assinar

O laudo deve ser assinado quando:
- ✅ Checklist completo (todos os itens respondidos)
- ✅ Riscos avaliados
- ✅ Plano de ação criado
- ✅ Ações críticas e altas resolvidas (recomendado)

### Processo de Assinatura

1. Abra o laudo em modo **"Pronto"**
2. Clique em **"Assinar Laudo"**
3. Preencha os dados:
   - Número da ART (opcional, mas recomendado)
   - Upload da ART (PDF ou imagem)
   - Data início da validade
   - Prazo de validade (6, 12, 24 ou 36 meses)
   - Upload do PDF assinado digitalmente
4. Clique em **"Confirmar Assinatura"**

### Após a Assinatura

> 🔒 **Importante:** O laudo fica **BLOQUEADO** para edição permanente!

- Um hash SHA-256 é gerado para garantir integridade
- O PDF assinado é armazenado
- O status muda para "Assinado"
- Não é possível alterar nenhum dado

Para modificar um laudo assinado, é necessário criar uma **nova revisão**.

---

## Auditoria

A auditoria registra **todas as ações** realizadas no sistema.

### O que é Registrado

- Criação, atualização e exclusão de dados
- Quem fez a ação
- Quando foi feita
- O que foi alterado (antes e depois)
- IP e navegador utilizado

### Consultar Logs

1. Acesse **"Auditoria"** no menu lateral
2. Use os filtros:
   - Tipo de ação (Criar, Atualizar, Excluir)
   - Entidade (Cliente, Máquina, Laudo, etc.)
   - Período
   - Usuário
3. Clique em um evento para expandir e ver detalhes

### Estatísticas

- Total de ações hoje/semana/mês
- Ações por tipo
- Entidades mais modificadas

---

## Configurações

### Dados da Empresa

Em **"Minha Empresa"** configure:
- Razão Social e Nome Fantasia
- CNPJ
- Endereço completo
- Dados de contato
- Responsável Técnico
- Número do CREA

### Gestão de Usuários

> ⚠️ Apenas usuários **MASTER** têm acesso.

#### Adicionar Usuário

1. Na página **"Minha Empresa"**, role até "Usuários do Sistema"
2. Clique no ícone de usuário
3. Informe o email e selecione o perfil:
   - **Administrador**: Acesso total
   - **Técnico**: Criar/editar, não assina
   - **Visualizador**: Somente leitura
4. O usuário receberá um email para definir a senha

#### Alterar Permissão

1. Clique no lápis (✏️) ao lado do usuário
2. Selecione o novo perfil
3. Clique em **"Salvar"**

#### Remover Usuário

1. Clique na lixeira (🗑️) ao lado do usuário
2. Confirme a exclusão

---

## Perfis de Usuário

### MASTER (Administrador)

**Pode:**
- Tudo no sistema
- Gerenciar usuários
- Assinar laudos
- Configurar a empresa
- Excluir dados

### TECHNICIAN (Técnico)

**Pode:**
- Criar e editar clientes, máquinas, laudos
- Preencher checklists
- Avaliar riscos
- Gerenciar planos de ação
- Cadastrar treinamentos

**Não pode:**
- Assinar laudos
- Gerenciar usuários
- Excluir dados permanentemente

### VIEWER (Visualizador)

**Pode:**
- Visualizar todos os dados
- Gerar relatórios
- Baixar PDFs

**Não pode:**
- Criar ou editar nada
- Excluir dados

---

## Dicas e Boas Práticas

### 1. Organização

- Use TAGs padronizadas para máquinas (ex: CLIENTE-SETOR-001)
- Mantenha os dados dos clientes sempre atualizados
- Vincule máquinas a locais específicos quando possível

### 2. Checklist

- Sempre tire fotos como evidência
- Seja específico nas observações
- Não marque "Não Aplicável" sem certeza

### 3. Laudos

- Revise todos os dados antes de assinar
- Resolva ações críticas antes da assinatura
- Guarde o PDF assinado em local seguro

### 4. Segurança

- Nunca compartilhe sua senha
- Sempre faça logout ao terminar
- Verifique se está no tenant correto

### 5. Backup

- Exporte relatórios periodicamente
- Mantenha cópias dos PDFs assinados
- Documente as ações corretivas

---

## Suporte

Em caso de dúvidas ou problemas:

1. Verifique se tem permissão para a ação desejada
2. Limpe o cache do navegador (Ctrl+F5)
3. Verifique sua conexão com a internet
4. Entre em contato com o administrador do sistema

---

**Versão do Manual:** 1.0  
**Última Atualização:** Fevereiro 2025  
**Sistema:** NR-12 Safety Inspector
