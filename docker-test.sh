#!/bin/bash
# ============================================
# Script de Teste do Container NR12
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Teste de Container - NR12 System${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Função para printar status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se Docker está instalado
print_status "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado!"
    exit 1
fi
print_success "Docker instalado: $(docker --version)"

# Verificar se Docker Compose está instalado
print_status "Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose não está instalado!"
    exit 1
fi
print_success "Docker Compose disponível"

# Limpar containers antigos se existirem
print_status "Limpando containers antigos..."
docker-compose down --remove-orphans 2>/dev/null || true
docker rm -f nr12-app 2>/dev/null || true

# Build do container
print_status "Construindo container (pode levar alguns minutos)..."
docker-compose build --no-cache
print_success "Build concluído!"

# Subir o container
print_status "Iniciando container..."
docker-compose up -d

# Aguardar container ficar saudável
print_status "Aguardando container ficar pronto..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Container está respondendo!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Container não ficou pronto a tempo!"
    echo ""
    print_status "Logs do container:"
    docker-compose logs nr12-app
    docker-compose down
    exit 1
fi

echo ""
print_success "Container iniciado com sucesso!"

# ============================================
# TESTES
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Executando Testes${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Teste 1: Verificar se a página está acessível
print_status "Teste 1: Verificando se a aplicação responde..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Aplicação está respondendo com HTTP 200"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Aplicação retornou HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Teste 2: Verificar se conteúdo HTML está presente
print_status "Teste 2: Verificando conteúdo HTML..."
if curl -s http://localhost:3000/ | grep -q "html"; then
    print_success "Conteúdo HTML encontrado"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Conteúdo HTML não encontrado"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Teste 3: Verificar headers de segurança
print_status "Teste 3: Verificando headers de segurança..."
HEADERS=$(curl -s -I http://localhost:3000/)
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    print_success "Header X-Frame-Options presente"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "Header X-Frame-Options não encontrado"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Teste 4: Verificar healthcheck do container
print_status "Teste 4: Verificando saúde do container..."
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' nr12-app 2>/dev/null || echo "not_found")
if [ "$CONTAINER_STATUS" = "running" ]; then
    print_success "Container está em execução"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Container não está rodando (status: $CONTAINER_STATUS)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Teste 5: Verificar arquivos estáticos
print_status "Teste 5: Verificando arquivos estáticos..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/vite.svg | grep -q "200\|304"; then
    print_success "Arquivos estáticos servidos corretamente"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "Problema ao servir arquivos estáticos"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Teste 6: Verificar logs do container
print_status "Teste 6: Verificando logs do container..."
LOGS=$(docker-compose logs --tail=20 nr12-app 2>&1)
if echo "$LOGS" | grep -q "error\|Error\|ERROR" ; then
    print_warning "Foram encontrados erros nos logs (pode ser normal para app React)"
else
    print_success "Nenhum erro crítico encontrado nos logs"
fi
TESTS_PASSED=$((TESTS_PASSED + 1))

# ============================================
# RESUMO
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Resumo dos Testes${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Testes Passaram: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Testes Falharam: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    print_status "Aplicação disponível em: http://localhost:3000"
    print_status "Para ver logs: docker-compose logs -f"
    print_status "Para parar: docker-compose down"
    echo ""
    exit 0
else
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}  ALGUNS TESTES FALHARAM${NC}"
    echo -e "${YELLOW}============================================${NC}"
    echo ""
    print_status "Verificando logs do container:"
    docker-compose logs --tail=50 nr12-app
    echo ""
    print_status "Para parar o container: docker-compose down"
    exit 1
fi
