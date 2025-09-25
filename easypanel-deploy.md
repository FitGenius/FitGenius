# 🚀 DEPLOY FITGENIUS NO EASYPANEL

## 📋 PASSO A PASSO

### 1. PREPARAR APLICAÇÃO
```bash
# Build da aplicação
npm run build

# Verificar se build foi bem-sucedido
ls .next
```

### 2. CRIAR PROJETO NO EASYPANEL
1. Login no EasyPanel: https://easypanel.io
2. Criar novo projeto: "fitgenius"
3. Escolher template: Next.js ou Custom

### 3. CONFIGURAR VARIÁVEIS DE AMBIENTE
No painel do EasyPanel, adicionar:

```env
# Database
DATABASE_URL=postgresql://postgres.sqvelvgqmyccvfgvanym:Daneelecsk18dj%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.sqvelvgqmyccvfgvanym:Daneelecsk18dj%40@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_URL=https://seu-dominio.easypanel.app
NEXTAUTH_SECRET=your-secret-key-here

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_51QGrDzQanpqlbqwRD...
STRIPE_SECRET_KEY=sk_live_51QGrDzQanpqlbqwR...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-proj-hu87Y9s_nfXSlWy57aDfnsYPRK8nkVfz...

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ffitgenius@gmail.com
SMTP_PASSWORD=qifkgajpgkiaxivu

# App
NODE_ENV=production
```

### 4. DOCKERFILE (SE NECESSÁRIO)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Build da aplicação
RUN npm run build

# Gerar Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

### 5. SCRIPTS DE DEPLOY
```bash
# Script para fazer deploy via API
curl -X POST "https://api.easypanel.io/projects/fitgenius/deploy" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "repository": "seu-usuario/fitgenius",
    "branch": "main"
  }'
```

### 6. CONFIGURAR DOMÍNIO
1. No EasyPanel, ir em "Domains"
2. Adicionar domínio customizado ou usar subdomínio
3. Configurar SSL automático

### 7. BANCO DE DADOS
- ✅ Usar Supabase (já configurado)
- ✅ Executar schema SQL no Supabase
- ✅ Verificar conexão

### 8. MONITORAMENTO
- Verificar logs no EasyPanel
- Testar endpoints da aplicação
- Monitorar performance

## 🔧 COMANDOS ÚTEIS

### Deploy via Git
```bash
git add .
git commit -m "Deploy para EasyPanel"
git push origin main
```

### Verificar status
```bash
# Via API EasyPanel
curl -H "Authorization: Bearer SUA_API_KEY" \
  https://api.easypanel.io/projects/fitgenius/status
```

### Logs
```bash
# Via API EasyPanel
curl -H "Authorization: Bearer SUA_API_KEY" \
  https://api.easypanel.io/projects/fitgenius/logs
```

## 📝 CHECKLIST FINAL

- [ ] Build local funciona
- [ ] Variáveis de ambiente configuradas
- [ ] Schema do banco executado
- [ ] Deploy realizado com sucesso
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Testes de funcionalidade
- [ ] Monitoramento ativo

## 🚀 RESULTADO ESPERADO

Após seguir todos os passos:
- ✅ FitGenius rodando em produção
- ✅ Banco Supabase conectado
- ✅ Pagamentos Stripe funcionando
- ✅ IA OpenAI ativa
- ✅ Emails Gmail funcionais
- ✅ SSL configurado
- ✅ Performance otimizada

## 🔒 SEGURANÇA

IMPORTANTE: Regenere a API key do EasyPanel imediatamente para manter a segurança da conta.