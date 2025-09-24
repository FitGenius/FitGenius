# 💳 STRIPE SETUP - FITGENIUS PAYMENTS

## 🎯 CONFIGURAÇÃO COMPLETA DO STRIPE

### 1. 🏢 CRIAR CONTA STRIPE

#### Registro
```bash
# 1. Acesse: https://dashboard.stripe.com/register
# 2. Criar conta business: "FitGenius"
# 3. Verificar email e telefone
# 4. Completar informações da empresa:
#    - Tipo: Software/SaaS
#    - País: Brasil (ou seu país)
#    - Moeda principal: BRL (ou sua moeda)
```

#### Verificação de Identidade
```bash
# Para ativar pagamentos ao vivo:
# 1. Dashboard > Settings > Account details
# 2. Fornecer informações fiscais
# 3. Upload de documentos (se necessário)
# 4. Aguardar aprovação (1-7 dias)
```

---

### 2. 📦 CRIAR PRODUTOS E PREÇOS

#### Produto 1: FitGenius Professional
```bash
# Dashboard > Products > Create product

Nome: FitGenius Professional
Descrição: Plano profissional para personal trainers em crescimento

# Pricing:
- Modelo: Recurring (Assinatura)
- Preço: R$ 97,00 (ou $29,00 USD)
- Intervalo: Monthly
- ID do preço: [COPIAR PARA STRIPE_PROFESSIONAL_PRICE_ID]

# Exemplo de ID gerado: price_1ABC123xyz789DEF
```

#### Produto 2: FitGenius Enterprise
```bash
Nome: FitGenius Enterprise
Descrição: Plano empresarial para academias e grandes estúdios

# Pricing:
- Modelo: Recurring
- Preço: R$ 197,00 (ou $59,00 USD)
- Intervalo: Monthly
- ID do preço: [COPIAR PARA STRIPE_ENTERPRISE_PRICE_ID]

# Exemplo de ID: price_1XYZ789abc456GHI
```

---

### 3. 🔐 CONFIGURAR API KEYS

#### Chaves de Desenvolvimento (Test Mode)
```bash
# Dashboard > Developers > API keys (Test mode ON)

Publishable key: pk_test_51ABC123...
Secret key: sk_test_51ABC123...

# Adicionar ao .env para testes:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC123..."
STRIPE_SECRET_KEY="sk_test_51ABC123..."
```

#### Chaves de Produção (Live Mode)
```bash
# Dashboard > Developers > API keys (Test mode OFF)

Publishable key: pk_live_51ABC123...
Secret key: sk_live_51ABC123...

# Adicionar ao .env.production:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51ABC123..."
STRIPE_SECRET_KEY="sk_live_51ABC123..."
```

---

### 4. 🪝 CONFIGURAR WEBHOOKS

#### Criar Webhook Endpoint
```bash
# Dashboard > Developers > Webhooks > Add endpoint

# URL do endpoint: https://fitgenius.app/api/stripe/webhook
# Ou para testes: https://your-domain.vercel.app/api/stripe/webhook

# Eventos para escutar:
✓ checkout.session.completed
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ payment_intent.succeeded
✓ payment_intent.payment_failed
```

#### Webhook Secret
```bash
# Após criar o webhook, copiar o signing secret:
# Dashboard > Developers > Webhooks > [seu webhook] > Signing secret

Webhook signing secret: whsec_1ABC123xyz789...

# Adicionar ao .env.production:
STRIPE_WEBHOOK_SECRET="whsec_1ABC123xyz789..."
```

---

### 5. 🧪 TESTES PRÉ-PRODUÇÃO

#### Cartões de Teste
```bash
# Use estes cartões para testar (modo test):

# ✅ Sucesso:
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005

# ❌ Falha:
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995

# Dados complementares (qualquer valor):
CVV: 123
Validade: 12/34
```

#### Fluxo de Teste
```bash
# 1. Modo test ativo no Stripe
# 2. Configurar .env com chaves test
# 3. Testar fluxos:
#    - Assinatura Professional (sucesso)
#    - Assinatura Enterprise (sucesso)
#    - Pagamento declinado
#    - Cancelamento de assinatura
#    - Webhook delivery

# 4. Verificar logs:
#    - Dashboard > Developers > Logs
#    - Dashboard > Developers > Events
```

---

### 6. 🌍 CONFIGURAÇÃO INTERNACIONAL

#### Métodos de Pagamento Brasil
```bash
# Dashboard > Settings > Payment methods

# Ativar para Brasil:
✓ Card payments (Visa, Master, Amex)
✓ PIX (recomendado para Brasil)
✓ Boleto bancário
✓ OXXO (se atender México)
```

#### Multi-Currency Support
```bash
# Dashboard > Settings > Customer billing

# Moedas suportadas:
✓ BRL (Brazilian Real) - principal
✓ USD (US Dollar) - internacional
✓ EUR (Euro) - Europa
✓ GBP (British Pound) - Reino Unido

# Conversão automática ativa
```

---

### 7. 🔒 CONFIGURAÇÕES DE SEGURANÇA

#### Fraud Prevention
```bash
# Dashboard > Settings > Radar

# Ativar Radar (incluído gratuitamente):
✓ Block payments from high-risk countries
✓ Block payments with mismatched billing/shipping
✓ Review payments with unusual spending patterns
✓ Machine learning fraud detection
```

#### PCI Compliance
```bash
# Stripe cuida automaticamente da compliance PCI
# Certificado disponível em:
# Dashboard > Settings > Compliance > PCI

# ✅ Nível PCI DSS Level 1 certificado
```

---

### 8. 📊 CONFIGURAR ANALYTICS

#### Dashboard Analytics
```bash
# Dashboard > Analytics

# Métricas importantes:
- Volume mensal (MRR)
- Taxa de crescimento
- Churn rate
- Lifetime value (LTV)
- Conversão de trial
```

#### Webhook Events Analytics
```bash
# Monitorar eventos importantes:
- checkout.session.completed (conversões)
- customer.subscription.updated (mudanças de plano)
- invoice.payment_failed (problemas de cobrança)
- customer.subscription.deleted (cancelamentos)
```

---

### 9. 📧 CONFIGURAR CUSTOMER BILLING

#### Customer Portal
```bash
# Dashboard > Settings > Billing > Customer portal

# Configurações recomendadas:
✓ Allow customers to update payment methods
✓ Allow customers to update billing address
✓ Allow customers to view invoice history
✓ Allow customers to download invoices
✓ Allow subscription cancellation
✓ Allow subscription pause (opcional)

# Business information:
Business name: FitGenius
Support email: support@fitgenius.app
Support phone: +55 11 1234-5678
Privacy policy: https://fitgenius.app/privacy
Terms of service: https://fitgenius.app/terms
```

#### Email Templates
```bash
# Dashboard > Settings > Emails

# Customizar templates:
✓ Payment receipts
✓ Invoice reminders
✓ Payment failed notifications
✓ Subscription updates
✓ Cancellation confirmations

# Branding:
- Logo: Upload FitGenius logo
- Primary color: #your-brand-color
- Font: Sistema padrão ou custom
```

---

### 10. 🚀 ATIVAÇÃO EM PRODUÇÃO

#### Checklist Pré-Ativação
```bash
# ✅ Conta Stripe verificada e aprovada
# ✅ Produtos e preços criados
# ✅ Webhook configurado e testado
# ✅ API keys de produção configuradas
# ✅ Customer portal configurado
# ✅ Email templates personalizados
# ✅ Métodos de pagamento ativados
# ✅ Fraud protection ativado
# ✅ Testes realizados com sucesso
```

#### Ativar Live Mode
```bash
# 1. Dashboard > toggle "View test data" OFF
# 2. Verificar que todas configurações foram copiadas
# 3. Atualizar .env.production com chaves live
# 4. Fazer primeiro teste de pagamento real (pequeno valor)
# 5. Monitorar Dashboard > Events
```

---

### 11. 🔧 INTEGRAÇÃO COM FITGENIUS

#### Variáveis de Ambiente Finais
```bash
# .env.production - STRIPE CONFIGURATION

# API Keys (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51ABC123..."
STRIPE_SECRET_KEY="sk_live_51ABC123..."
STRIPE_WEBHOOK_SECRET="whsec_1ABC123xyz789..."

# Price IDs dos produtos
STRIPE_PROFESSIONAL_PRICE_ID="price_1ABC123xyz789DEF"
STRIPE_ENTERPRISE_PRICE_ID="price_1XYZ789abc456GHI"

# URLs de redirecionamento
STRIPE_SUCCESS_URL="https://fitgenius.app/dashboard/billing?success=true"
STRIPE_CANCEL_URL="https://fitgenius.app/pricing?canceled=true"
```

#### Teste de Integração
```javascript
// Teste rápido da integração:
curl -X POST https://fitgenius.app/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "PROFESSIONAL",
    "successUrl": "https://fitgenius.app/dashboard/billing?success=true",
    "cancelUrl": "https://fitgenius.app/pricing?canceled=true"
  }'
```

---

### 12. 📱 MOBILE APP INTEGRATION

#### React Native Stripe
```bash
cd mobile/
npm install @stripe/stripe-react-native

# Configuração iOS (mobile/ios/Podfile):
pod 'Stripe', '~> 23.0.0'

# Configuração Android (mobile/android/app/build.gradle):
implementation 'com.stripe:stripe-android:20.+'
```

#### Mobile Environment
```javascript
// mobile/.env
STRIPE_PUBLISHABLE_KEY=pk_live_51ABC123...
API_URL=https://fitgenius.app/api
```

---

### 13. 🧪 TESTES AUTOMATIZADOS

#### Jest Tests para Stripe
```javascript
// __tests__/stripe.test.js
describe('Stripe Integration', () => {
  test('should create checkout session', async () => {
    const response = await request(app)
      .post('/api/stripe/checkout')
      .send({
        planType: 'PROFESSIONAL'
      })
      .expect(200);

    expect(response.body).toHaveProperty('sessionId');
  });

  test('should handle webhook events', async () => {
    const mockEvent = createMockStripeEvent('checkout.session.completed');

    const response = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'test-signature')
      .send(mockEvent)
      .expect(200);
  });
});
```

---

### 14. 📊 MONITORAMENTO PÓS-PRODUÇÃO

#### Métricas Importantes
```bash
# Dashboard Stripe - monitorar:
1. Volume de transações (diário/mensal)
2. Taxa de sucesso de pagamentos
3. Tempo médio para conversão
4. Taxa de churn mensal
5. Disputa de cartões (chargebacks)
6. Tentativas de fraude bloqueadas
```

#### Alertas Configurar
```bash
# Dashboard > Settings > Notifications

# Alertas importantes:
✓ Webhook endpoint down
✓ High payment failure rate
✓ Unusual transaction volume
✓ New chargeback or dispute
✓ Account limit approaching
```

---

### 15. 🆘 TROUBLESHOOTING

#### Problemas Comuns

**1. Webhook não recebe eventos:**
```bash
# Verificar:
- URL do webhook correto
- HTTPS ativo
- Endpoint responde 200
- Signature validation correta
```

**2. Pagamentos falham:**
```bash
# Verificar:
- Chaves API corretas (live vs test)
- Price IDs válidos
- Customer creation funcionando
- Método de pagamento suportado
```

**3. Customer Portal não funciona:**
```bash
# Verificar:
- Customer ID válido no banco
- Portal configurado no dashboard
- Return URL correto
```

#### Logs Úteis
```bash
# Stripe Dashboard:
- Developers > Logs (API calls)
- Developers > Events (webhooks)
- Analytics > Overview (métricas)

# FitGenius logs:
- Vercel Functions logs
- Database query logs
- Application error logs
```

---

## 🎉 STRIPE CONFIGURADO COM SUCESSO!

### ✅ Checklist Final
- [ ] Conta Stripe verificada
- [ ] Produtos e preços criados
- [ ] Webhooks configurados
- [ ] API keys em produção
- [ ] Customer portal ativo
- [ ] Testes realizados
- [ ] Monitoramento configurado
- [ ] Mobile integration ready

**🚀 Sistema de pagamentos 100% operacional!**

### 📞 Suporte
- **Stripe Support:** https://support.stripe.com
- **Documentação:** https://stripe.com/docs
- **Status:** https://status.stripe.com