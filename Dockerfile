# ============================================
# Dockerfile para NR12 Compliance System
# ============================================
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos para variáveis de ambiente do Vite
# Estas variáveis são incorporadas no build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Definir como ENV para que o Vite possa acessar durante o build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ============================================
# Production Stage
FROM nginx:alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar build para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
