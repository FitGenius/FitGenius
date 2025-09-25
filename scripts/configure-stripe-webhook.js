// Carregar variáveis de ambiente
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function configureStripeWebhook() {
  console.log('🔗 Configurando webhook Stripe para FitGenius...\n');

  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    : 'https://fitgenius.app/api/stripe/webhook';

  try {
    console.log(`📡 URL do webhook: ${webhookUrl}`);

    // Eventos que queremos escutar
    const events = [
      'checkout.session.completed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ];

    console.log('\n📋 Eventos configurados:');
    events.forEach(event => console.log(`   ✓ ${event}`));

    // Criar webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      metadata: {
        app: 'fitgenius',
        version: '1.0'
      }
    });

    console.log('\n✅ Webhook criado com sucesso!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Secret: ${webhook.secret}`);

    console.log('\n🔧 Adicione esta variável ao seu .env:');
    console.log(`STRIPE_WEBHOOK_SECRET="${webhook.secret}"`);

    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Adicionar STRIPE_WEBHOOK_SECRET ao .env e .env.production');
    console.log('2. Fazer deploy da aplicação');
    console.log('3. Testar webhook no Stripe Dashboard');

    return webhook;

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);

    if (error.code === 'url_invalid') {
      console.log('\n💡 SOLUÇÃO:');
      console.log('1. Primeiro faça o deploy da aplicação');
      console.log('2. Depois execute este script novamente');
      console.log('3. Ou configure manualmente no Stripe Dashboard');
    }

    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não encontrada no .env');
    process.exit(1);
  }

  configureStripeWebhook()
    .then(webhook => {
      console.log('\n🎉 Webhook configurado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Falha na configuração do webhook');
      console.log('\n🔄 Execute novamente após o deploy da aplicação');
      process.exit(1);
    });
}

module.exports = { configureStripeWebhook };