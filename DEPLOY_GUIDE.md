# 🚀 GUIA DE DEPLOY - FITGENIUS

## 📋 CHECKLIST PRÉ-DEPLOY

### ✅ Pré-requisitos
- [ ] Conta no GitHub configurada
- [ ] Conta na Vercel/Railway/Render
- [ ] Conta no Supabase/Neon (banco de dados)
- [ ] Conta no Stripe (pagamentos)
- [ ] Conta no Cloudinary (uploads)
- [ ] Conta no Resend (emails)

---

## 🗄️ 1. CONFIGURAR BANCO DE DADOS

### Opção 1: Supabase (Recomendado)
```bash
# 1. Acesse https://supabase.com
# 2. Crie novo projeto: "fitgenius-prod"
# 3. Copie a CONNECTION STRING

# Exemplo de URL:
postgresql://postgres.abc123:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Opção 2: Neon
```bash
# 1. Acesse https://neon.tech
# 2. Crie novo projeto: "fitgenius"
# 3. Copie a DATABASE_URL
```

### Migrar Schema
```bash
cd projeto/fitgenius

# Configurar URL do banco
export DATABASE_URL="sua-url-aqui"

# Executar migrações
npx prisma migrate deploy

# Gerar cliente
npx prisma generate

# Seed inicial (opcional)
npx prisma db seed
```

---

## 🔐 2. CONFIGURAR STRIPE

### Dashboard Stripe
1. **Acesse:** https://dashboard.stripe.com
2. **Produtos e Preços:**
   ```bash
   # Criar produtos no Stripe Dashboard:

   Produto: "FitGenius Professional"
   - Preço mensal: R$ 97,00
   - Copiar PRICE_ID → STRIPE_PROFESSIONAL_PRICE_ID

   Produto: "FitGenius Enterprise"
   - Preço mensal: R$ 197,00
   - Copiar PRICE_ID → STRIPE_ENTERPRISE_PRICE_ID
   ```

3. **API Keys:**
   ```bash
   # Modo LIVE (produção):
   STRIPE_PUBLIC_KEY="pk_live_..."
   STRIPE_SECRET_KEY="sk_live_..."
   ```

4. **Webhooks:**
   ```bash
   # URL do webhook: https://seudominio.com/api/stripe/webhook
   # Eventos necessários:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

---

## 🌐 3. DEPLOY VERCEL (Recomendado)

### Método 1: CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd projeto/fitgenius
vercel --prod

# Configurar domínio customizado
vercel domains add fitgenius.app
```

### Método 2: GitHub Integration
1. **Push para GitHub:**
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/fitgenius.git
   git push -u origin master
   ```

2. **Conectar Vercel:**
   - Acesse https://vercel.com
   - Import Git Repository
   - Selecionar repositório do FitGenius
   - Framework Preset: Next.js
   - Deploy!

### Variáveis de Ambiente na Vercel
```bash
# Na dashboard da Vercel, adicionar todas as variáveis:
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://fitgenius.app
NEXTAUTH_SECRET=seu-secret-aqui
STRIPE_SECRET_KEY=sk_live_...
# ... todas as outras do .env.production
```

---

## 🚢 4. DEPLOY ALTERNATIVO - RAILWAY

### Configuração Railway
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd projeto/fitgenius
railway init
railway up
```

### Configurar Domínio
```bash
# No dashboard Railway:
1. Settings > Domains
2. Adicionar: fitgenius.app
3. Configurar DNS
```

---

## 📧 5. CONFIGURAR EMAIL (RESEND)

### Setup Resend
```bash
# 1. Acesse https://resend.com
# 2. Criar conta e verificar domínio
# 3. Configurar DNS records:

# DNS Records para fitgenius.app:
Type: TXT
Name: @
Value: "resend-domain-verification=xxx"

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com (priority 10)
```

### Variáveis Email
```bash
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_sua_api_key"
EMAIL_FROM="noreply@fitgenius.app"
```

---

## ☁️ 6. CONFIGURAR UPLOADS (CLOUDINARY)

### Setup Cloudinary
```bash
# 1. Acesse https://cloudinary.com
# 2. Criar conta gratuita
# 3. Copiar credenciais do Dashboard

CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="sua-api-secret"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

---

## 🔒 7. CONFIGURAR SEGURANÇA

### Gerar Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT_SECRET
openssl rand -base64 64

# REFRESH_TOKEN_SECRET
openssl rand -base64 64
```

### Google OAuth
```bash
# 1. Acesse https://console.developers.google.com
# 2. Criar projeto: "FitGenius"
# 3. Ativar Google+ API
# 4. Criar credenciais OAuth 2.0:

# Authorized redirect URIs:
https://fitgenius.app/api/auth/callback/google

# Copiar:
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

---

## 📱 8. DEPLOY MOBILE APP

### Expo Application Services (EAS)
```bash
cd projeto/fitgenius/mobile

# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas init --id your-project-id

# Build para produção
eas build --platform all

# Submit para app stores
eas submit --platform ios
eas submit --platform android
```

---

## 🎯 9. CONFIGURAÇÃO DNS

### Configurar DNS para fitgenius.app
```bash
# No seu provedor de DNS (Cloudflare, Namecheap, etc.):

Type: A
Name: @
Value: 76.76.19.61 (IP da Vercel)

Type: CNAME
Name: www
Value: fitgenius.app

Type: CNAME
Name: api
Value: fitgenius.app

# Para Vercel:
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

## 🧪 10. TESTES PÓS-DEPLOY

### Checklist de Testes
```bash
# ✅ Testar funcionalidades principais:
- [ ] Login/Registro funciona
- [ ] Dashboard carrega corretamente
- [ ] Criação de treinos
- [ ] Sistema de pagamentos (modo teste)
- [ ] Chat em tempo real
- [ ] PWA instalação
- [ ] Mobile app conecta com API

# ✅ Testar integrações:
- [ ] Emails são enviados
- [ ] Uploads funcionam
- [ ] Webhooks Stripe
- [ ] Banco de dados conecta
```

---

## 🔍 11. MONITORAMENTO

### Sentry (Errors)
```bash
# 1. Criar conta em https://sentry.io
# 2. Criar projeto Next.js
# 3. Adicionar variáveis:

SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_ORG="fitgenius"
SENTRY_PROJECT="fitgenius-web"
```

### Vercel Analytics
```bash
# Ativar no dashboard Vercel:
- Analytics
- Speed Insights
- Web Vitals
```

---

## 📊 12. VARIÁVEIS FINAIS DE PRODUÇÃO

```bash
# Copie e configure todas essas variáveis:
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fitgenius.app
NEXT_PUBLIC_API_URL=https://fitgenius.app/api
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://fitgenius.app
NEXTAUTH_SECRET=seu-secret-super-seguro
STRIPE_SECRET_KEY=sk_live_seu_stripe_key
STRIPE_PROFESSIONAL_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EMAIL_FROM=noreply@fitgenius.app
EMAIL_SERVER_PASSWORD=re_sua_resend_key
CLOUDINARY_URL=cloudinary://key:secret@cloud
```

---

## 🚀 DEPLOY EM PRODUÇÃO!

### Comando Final
```bash
# Fazer deploy:
git add .
git commit -m "feat: production ready deployment"
git push origin master

# Vercel fará deploy automático!
# Acompanhar em: https://vercel.com/dashboard
```

### 🎉 Parabéns!
**FitGenius está no ar em:** https://fitgenius.app

---

## 🆘 TROUBLESHOOTING

### Problemas Comuns:
1. **Build falha:** Verificar dependências e tipos
2. **DB não conecta:** Verificar URL e permissões
3. **Stripe não funciona:** Verificar keys e webhooks
4. **Emails não enviam:** Verificar DNS e API key
5. **PWA não instala:** Verificar manifest e service worker

### Logs Úteis:
```bash
# Vercel logs
vercel logs fitgenius.app

# Database logs
# Ver no dashboard Supabase/Neon

# Stripe logs
# Dashboard Stripe > Logs
```

---

**SISTEMA 100% PRONTO PARA PRODUÇÃO! 🎯**