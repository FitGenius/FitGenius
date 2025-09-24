# 🚀 FITGENIUS - GUIA DE DEPLOYMENT

## ✅ Arquivos de Produção Criados

- ✅ `.env.production` - Variáveis de ambiente de produção
- ✅ `Dockerfile` - Container Docker otimizado
- ✅ `docker-compose.yml` - Orquestração completa
- ✅ `nginx/nginx.conf` - Proxy reverso com SSL
- ✅ `vercel.json` - Configuração Vercel
- ✅ `scripts/setup-production.sh` - Script de setup
- ✅ `src/app/api/health/route.ts` - Health check endpoint
- ✅ `next.config.ts` - Configuração otimizada

---

## 🎯 OPÇÕES DE DEPLOYMENT

### 1. 🔷 VERCEL (Recomendado)

**Vantagens:**
- Deploy automático do GitHub
- CDN global
- SSL automático
- Escalabilidade automática
- Zero configuração

**Passos:**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel --prod

# 4. Configurar variáveis no dashboard
```

**Variáveis necessárias no Vercel:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

### 2. 🐳 DOCKER (Qualquer Cloud)

**Deploy local:**
```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run

# Ou usar docker-compose
npm run docker:compose
```

**Deploy em produção:**
```bash
# 1. Configure as variáveis em .env.production
# 2. Execute o setup
npm run setup:prod

# 3. Build e deploy
docker-compose up --build -d
```

---

### 3. ☁️ RAILWAY

**Vantagens:**
- PostgreSQL incluído
- Deploy do GitHub
- Variáveis automáticas

**Passos:**
1. Conecte seu GitHub no Railway
2. Selecione o repositório FitGenius
3. Configure as variáveis de ambiente
4. Deploy automático!

---

### 4. 🌊 RENDER

**Vantagens:**
- Free tier disponível
- SSL automático
- PostgreSQL gerenciado

**Passos:**
1. Conecte GitHub no Render
2. Crie Web Service
3. Configure build: `npm run build`
4. Configure start: `npm start`

---

## 🗄️ BANCO DE DADOS

### Opção 1: Supabase (Recomendado)
```bash
# 1. Crie projeto no Supabase
# 2. Obtenha a DATABASE_URL
# 3. Execute migrations
npx prisma migrate deploy
```

### Opção 2: Neon
```bash
# 1. Crie banco no Neon
# 2. Configure CONNECTION_STRING
# 3. Execute migrations
```

### Opção 3: PlanetScale
```bash
# 1. Crie banco no PlanetScale
# 2. Configure schema
# 3. Deploy branches
```

---

## 🔒 CONFIGURAÇÃO DE SEGURANÇA

### 1. Variáveis Críticas
```bash
# Gerar NEXTAUTH_SECRET
openssl rand -base64 32

# Gerar JWT secrets
openssl rand -hex 64
```

### 2. OAuth Configuration
**Google Console:**
1. Crie projeto no Google Console
2. Configure OAuth 2.0
3. Adicione domínios autorizados

### 3. Headers de Segurança
✅ Já configurados no `next.config.ts`:
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- CSP (Content Security Policy)

---

## 🚦 HEALTH CHECKS

**Endpoint:** `/api/health`

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XX",
  "database": "healthy",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 📊 MONITORAMENTO

### 1. Sentry (Erro Tracking)
```bash
# 1. Crie projeto no Sentry
# 2. Configure SENTRY_DSN
# 3. Deploy automático de sourcemaps
```

### 2. Analytics
```bash
# Google Analytics 4
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 🎬 SCRIPTS ÚTEIS

```bash
# Preparar produção
npm run setup:prod

# Build e analyze
npm run analyze

# Check de tipos
npm run type-check

# Backup do banco
npm run backup:db

# Migrations
npm run db:deploy

# Health check local
curl http://localhost:3000/api/health
```

---

## 🔥 CHECKLIST PRÉ-DEPLOY

### Código
- [ ] Build local funciona (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Lint ok (`npm run lint`)
- [ ] Types ok (`npm run type-check`)

### Configuração
- [ ] `.env.production` configurado
- [ ] `DATABASE_URL` válida
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] OAuth providers configurados

### Database
- [ ] Migrations aplicadas
- [ ] Conexão testada
- [ ] Backup configurado

### Deploy
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Health check responde
- [ ] Logs sem erros

---

## 🚨 TROUBLESHOOTING

### Build Errors
```bash
# Limpar cache
rm -rf .next node_modules
npm ci
npm run build
```

### Database Issues
```bash
# Reset Prisma
npx prisma generate
npx prisma db push --force-reset
```

### Docker Issues
```bash
# Rebuild sem cache
docker build --no-cache -t fitgenius .
```

---

## 📞 SUPORTE

**Documentação:**
- Next.js: https://nextjs.org/docs
- Prisma: https://prisma.io/docs
- Vercel: https://vercel.com/docs

**Status:**
- Health: `/api/health`
- Version: `package.json`

---

**🎉 PROJETO PRONTO PARA PRODUÇÃO!**

> Escolha sua plataforma de deploy e siga os passos acima.
> Para dúvidas, consulte os logs em tempo real.

*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*