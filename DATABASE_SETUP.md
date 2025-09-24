# 🗄️ DATABASE SETUP - FITGENIUS PRODUCTION

## 🎯 Opções Recomendadas de Banco

### 1. 🚀 SUPABASE (Recomendado)

#### Por que Supabase?
- ✅ PostgreSQL gerenciado
- ✅ Dashboard visual
- ✅ Backup automático
- ✅ SSL/TLS por padrão
- ✅ Edge functions
- ✅ Real-time subscriptions
- ✅ Free tier generoso

#### Setup Supabase:
```bash
# 1. Acesse: https://supabase.com/dashboard
# 2. Crie nova organização: "FitGenius"
# 3. Novo projeto: "fitgenius-prod"
# 4. Região: South America (São Paulo) ou US East (N. Virginia)
# 5. Database Password: GERE_UMA_SENHA_FORTE

# Exemplo URL gerada:
postgresql://postgres.abcdefghijklmnop:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

#### Configurar no .env.production:
```bash
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

---

### 2. ⚡ NEON (Alternativa Excelente)

#### Por que Neon?
- ✅ PostgreSQL serverless
- ✅ Branching de databases
- ✅ Auto-scaling
- ✅ Backup point-in-time
- ✅ Free tier 0.5GB

#### Setup Neon:
```bash
# 1. Acesse: https://neon.tech
# 2. Crie conta e novo projeto: "fitgenius"
# 3. Região: AWS US East (mais próxima do Vercel)

# URL gerada será algo como:
postgresql://username:password@ep-young-meadow-12345.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

### 3. 🌐 RAILWAY (Simples e Direto)

#### Setup Railway:
```bash
# 1. Acesse: https://railway.app
# 2. New Project > Deploy PostgreSQL
# 3. Copiar DATABASE_URL das variáveis

# URL típica:
postgresql://postgres:password@containers-us-west-123.railway.app:6543/railway
```

---

## 🔧 CONFIGURAÇÃO DO BANCO

### Step 1: Executar Migrações
```bash
cd projeto/fitgenius

# Definir URL do banco
export DATABASE_URL="sua-database-url-aqui"

# Executar migrações
npx prisma migrate deploy

# Gerar cliente Prisma
npx prisma generate

# Verificar conexão
npx prisma db push --preview-feature
```

### Step 2: Seed Inicial (Opcional)
```bash
# Criar dados iniciais
npx prisma db seed

# Ou manualmente via Prisma Studio:
npx prisma studio
```

### Step 3: Verificar Schema
```sql
-- Verificar se todas as tabelas foram criadas:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Principais tabelas esperadas:
-- User, Professional, Client, Subscription, Payment
-- Workout, Exercise, Assessment, Message, Notification
```

---

## 🔐 SEGURANÇA DO BANCO

### SSL/TLS Configuration
```bash
# Supabase e Neon já vêm com SSL
# Verificar se URL contém: ?sslmode=require
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Connection Pooling
```bash
# Para alta performance, usar connection pooling:
# Supabase: usar porta 6543 (pooler)
# Neon: pooling já incluído
```

### Backup Strategy
```sql
-- Supabase: Backup automático (point-in-time recovery)
-- Neon: Backup automático + branching
-- Railway: Backup manual recomendado

-- Comando manual backup (se necessário):
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## 📊 CONFIGURAÇÃO DE PERFORMANCE

### Índices Importantes
```sql
-- Adicionar índices para melhor performance:
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_subscription_user ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS idx_workout_client ON "Workout"("clientId");
CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
```

### Configurações do Prisma
```javascript
// prisma/schema.prisma - configurações otimizadas:
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["tracing"]
}

datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

---

## 🧪 TESTING DO BANCO

### Health Check
```bash
# Criar script de health check:
cat > scripts/db-health.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Test basic query
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}`);

    // Test subscription query
    const subCount = await prisma.subscription.count();
    console.log(`✅ Subscriptions: ${subCount}`);

  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
EOF

node scripts/db-health.js
```

---

## 🚀 DEPLOY COM BANCO

### Vercel Configuration
```bash
# Na dashboard da Vercel, adicionar:
DATABASE_URL="sua-url-completa-aqui"
DIRECT_URL="sua-direct-url-aqui"  # Para Supabase
```

### Railway Configuration
```bash
# Railway detecta automaticamente se usar PostgreSQL service
# Ou adicionar nas variáveis:
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Build Command
```json
// package.json - adicionar ao scripts:
{
  "build": "prisma generate && next build",
  "postinstall": "prisma generate",
  "db:migrate": "prisma migrate deploy",
  "db:seed": "prisma db seed"
}
```

---

## 📈 MONITORAMENTO

### Query Monitoring
```javascript
// lib/prisma.ts - adicionar logging:
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Performance Metrics
- Supabase: Dashboard > Reports
- Neon: Dashboard > Monitoring
- Railway: Dashboard > Metrics

---

## ⚠️ TROUBLESHOOTING

### Problemas Comuns:

1. **Connection timeout**
   ```bash
   # Verificar firewall/security groups
   # Testar com: telnet hostname port
   ```

2. **SSL errors**
   ```bash
   # Adicionar ?sslmode=require na URL
   DATABASE_URL="postgres://...?sslmode=require"
   ```

3. **Migration failures**
   ```bash
   # Reset e re-aplicar:
   npx prisma migrate reset --force
   npx prisma migrate deploy
   ```

4. **Out of connections**
   ```bash
   # Usar connection pooling
   # Supabase: porta 6543
   # Adicionar ?pgbouncer=true se suportado
   ```

---

## 🎯 CHECKLIST FINAL

- [ ] ✅ Banco de dados criado (Supabase/Neon)
- [ ] ✅ URL configurada no .env.production
- [ ] ✅ Migrações executadas com sucesso
- [ ] ✅ Seed inicial executado (opcional)
- [ ] ✅ Health check passou
- [ ] ✅ Índices de performance criados
- [ ] ✅ SSL habilitado
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoramento ativo

**🎉 Banco de dados pronto para produção!**