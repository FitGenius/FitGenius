# 🔧 CONFIGURAÇÃO EASYPANEL + FITGENIUS

## ⚠️ PROBLEMA IDENTIFICADO
O hostname `aigenius_postgres:5432` é interno do Docker no EasyPanel. Para conectar localmente, você precisa de um endpoint externo.

## 🚀 SOLUÇÕES POSSÍVEIS

### 📋 **OPÇÃO 1: EXPOR POSTGRESQL EXTERNAMENTE**

1. **No EasyPanel:**
   - Acesse o service PostgreSQL
   - Vá em "Domains" ou "Ports"
   - Adicione port mapping: `5432:5432`
   - Ou crie um domínio público para o PostgreSQL

2. **Obter hostname externo:**
   - Pode ser algo como: `postgres.seudominio.com:5432`
   - Ou IP público: `123.456.789.10:5432`

### 📋 **OPÇÃO 2: USAR OUTRO BANCO PARA DESENVOLVIMENTO**

Para desenvolvimento local, usar PostgreSQL local:

```bash
# Instalar PostgreSQL localmente ou usar Docker
docker run --name fitgenius-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Atualizar .env local
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
```

### 📋 **OPÇÃO 3: CONECTAR VIA TUNNEL/PROXY**

Se o EasyPanel oferece tunnels SSH ou proxy:

```bash
# Exemplo de túnel SSH (se disponível)
ssh -L 5432:aigenius_postgres:5432 usuario@seu-vps.com
```

## 🔄 **PASSOS PARA IMPLEMENTAR**

### **1. DESCOBRIR ENDPOINT EXTERNO**
No EasyPanel, verifique se há:
- [ ] Opção para expor portas
- [ ] Domain/subdomain para PostgreSQL
- [ ] IP público do VPS
- [ ] Proxy/tunnel disponível

### **2. ATUALIZAR VARIÁVEIS DE AMBIENTE**

**Para DESENVOLVIMENTO LOCAL (.env):**
```env
# Usar banco local ou endpoint externo do EasyPanel
DATABASE_URL="postgresql://postgres:Daneelecsk18dj@SEU_ENDPOINT_EXTERNO:5432/postgres"
DIRECT_URL="postgresql://postgres:Daneelecsk18dj@SEU_ENDPOINT_EXTERNO:5432/postgres"
```

**Para PRODUÇÃO (.env.production):**
```env
# Usar hostname interno (funciona dentro do EasyPanel)
DATABASE_URL="postgresql://postgres:Daneelecsk18dj@aigenius_postgres:5432/postgres"
DIRECT_URL="postgresql://postgres:Daneelecsk18dj@aigenius_postgres:5432/postgres"
```

### **3. EXECUTAR SCHEMA NO BANCO**

Opções para executar o schema:

#### **A) Via pgAdmin/Terminal do EasyPanel:**
1. Acesse o container PostgreSQL no EasyPanel
2. Execute o arquivo `easypanel-postgres-schema.sql`
3. Ou conecte via pgAdmin com endpoint externo

#### **B) Via Prisma (após conectar):**
```bash
npx prisma db push
npx prisma generate
```

#### **C) Via script SQL direto:**
```bash
# Se tiver psql instalado e endpoint externo
psql -h SEU_ENDPOINT -U postgres -d postgres -f easypanel-postgres-schema.sql
```

## 🎯 **CONFIGURAÇÃO RECOMENDADA**

### **DESENVOLVIMENTO:**
- PostgreSQL local (Docker) ou endpoint externo do EasyPanel
- Prisma Studio para visualizar dados
- Hot reload funcionando

### **PRODUÇÃO:**
- PostgreSQL interno do EasyPanel (aigenius_postgres)
- Schema executado via terminal/pgAdmin
- Deploy automático via Git

## 📝 **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Obter endpoint externo do PostgreSQL no EasyPanel
- [ ] Ou configurar PostgreSQL local para desenvolvimento
- [ ] Atualizar DATABASE_URL no .env
- [ ] Executar schema SQL no banco
- [ ] Testar conexão com `npx prisma db push`
- [ ] Verificar se aplicação inicia sem erros
- [ ] Deploy no EasyPanel com configuração de produção

## 🔍 **DEBUGGING**

### **Teste de Conexão:**
```bash
# Testar se o endpoint está acessível
telnet SEU_ENDPOINT 5432
# ou
nc -zv SEU_ENDPOINT 5432
```

### **Logs do PostgreSQL:**
- Verificar logs no EasyPanel
- Confirmar se o serviço está rodando
- Verificar se as credenciais estão corretas

### **Variáveis de Ambiente:**
```bash
# Verificar se as variáveis estão sendo carregadas
npx prisma studio
# Se abrir, a conexão está funcionando
```

## 🚀 **PRÓXIMOS PASSOS**

1. **Descobrir o endpoint externo** do PostgreSQL no EasyPanel
2. **Atualizar .env** com endpoint correto
3. **Executar o schema** no banco de dados
4. **Testar a aplicação** localmente
5. **Deploy final** no EasyPanel

## 💡 **DICAS**

- **Firewall:** Certifique-se de que a porta 5432 está liberada
- **SSL:** Pode precisar adicionar `?sslmode=require` na connection string
- **Timeout:** Aumente timeout se conexão for lenta
- **Backup:** Sempre faça backup antes de executar schemas

---

**🔗 Links úteis:**
- [EasyPanel Docs](https://easypanel.io/docs)
- [Prisma Connection Troubleshooting](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)

**Você conseguiu encontrar o endpoint externo do PostgreSQL no seu EasyPanel?**