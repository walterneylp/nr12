# 🐳 Docker - NR12 Compliance System

Este documento descreve como executar o sistema NR12 usando Docker.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

## 🚀 Instalação Rápida

### Opção 1: Script Automático (Recomendado)

```bash
./docker-test.sh
```

Este script irá:
1. Verificar dependências
2. Construir a imagem Docker
3. Iniciar o container
4. Executar testes automatizados
5. Validar o funcionamento

### Opção 2: Comandos Manuais

```bash
# Construir e iniciar
docker-compose up -d --build

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## 📁 Estrutura dos Arquivos

```
.
├── Dockerfile              # Imagem multi-stage (build + nginx)
├── docker-compose.yml      # Orquestração dos serviços
├── nginx.conf             # Configuração do servidor web
├── .dockerignore          # Arquivos ignorados no build
└── docker-test.sh         # Script de teste automatizado
```

## ⚙️ Configuração

### Variáveis de Ambiente

O sistema usa as seguintes variáveis (definidas em `docker-compose.yml`):

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_SUPABASE_URL` | URL do Supabase | https://wrwzjqkcdiecdhxhipsp.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | (chave do projeto) |

Para usar um Supabase local, descomente as seções correspondentes no `docker-compose.yml`.

### Portas

| Serviço | Porta Host | Porta Container | Descrição |
|---------|------------|-----------------|-----------|
| nr12-app | 3000 | 80 | Aplicação React |

## 🔧 Comandos Úteis

```bash
# Rebuild completo
docker-compose down && docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f nr12-app

# Acessar shell do container
docker exec -it nr12-app sh

# Ver estatísticas
docker stats nr12-app

# Healthcheck manual
curl http://localhost:3000/
```

## 🧪 Testes

O sistema inclui testes automatizados que verificam:

- ✅ Container está rodando
- ✅ Aplicação responde HTTP 200
- ✅ Conteúdo HTML está presente
- ✅ Headers de segurança configurados
- ✅ Arquivos estáticos servidos
- ✅ Logs sem erros críticos

Para executar:
```bash
./docker-test.sh
```

## 🏗️ Detalhes da Imagem

### Multi-Stage Build

1. **Stage 1 (builder)**: Node 20 Alpine
   - Instala dependências npm
   - Compila TypeScript
   - Gera build de produção

2. **Stage 2 (production)**: Nginx Alpine
   - Serve arquivos estáticos
   - Configuração otimizada para SPA (React Router)
   - Headers de segurança
   - Compressão gzip
   - Cache de assets

### Tamanho da Imagem

- **Builder**: ~500MB (inclui node_modules)
- **Production**: ~30MB (apenas nginx + assets)

## 🔒 Segurança

A imagem inclui as seguintes proteções:

- Headers de segurança (X-Frame-Options, X-Content-Type-Options, etc.)
- Container não-root (nginx)
- Healthcheck configurado
- Apenas portas necessárias expostas

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs nr12-app

# Verificar se porta 3000 está livre
lsof -i :3000
```

### Build falha

```bash
# Limpar cache e rebuild
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### Problemas de permissão

```bash
# No Linux, pode ser necessário ajustar permissões
sudo chown -R $USER:$USER .
```

## 📊 Monitoramento

### Healthcheck

O container possui healthcheck integrado:
```bash
docker inspect --format='{{.State.Health.Status}}' nr12-app
```

### Métricas

```bash
# Uso de recursos
docker stats nr12-app --no-stream

# Tamanho da imagem
docker images nr12_kimi_implementacao_nr12-app
```

## 📝 Notas

- O frontend se conecta ao Supabase na nuvem por padrão
- Para desenvolvimento local com Supabase, use `supabase start`
- Os arquivos de deploy (`deploy-*.zip`) são ignorados no build Docker
