// Carregar variáveis de ambiente
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function updateStripeWebhook() {
  console.log('🔄 Atualizando webhook Stripe para nova URL...\n');

  const newWebhookUrl = 'https://fitgenius-7gdk8cozn-farmagenius-projects.vercel.app/api/stripe/webhook';

  try {
    // Listar webhooks existentes
    console.log('📋 Buscando webhooks existentes...');
    const webhooks = await stripe.webhookEndpoints.list();

    console.log(`✅ Encontrados ${webhooks.data.length} webhook(s)`);

    // Encontrar o webhook do FitGenius
    const fitGeniusWebhook = webhooks.data.find(wh =>
      wh.url.includes('fitgenius') || wh.metadata?.app === 'fitgenius'
    );

    if (fitGeniusWebhook) {
      console.log(`🔧 Atualizando webhook: ${fitGeniusWebhook.id}`);
      console.log(`   URL antiga: ${fitGeniusWebhook.url}`);
      console.log(`   URL nova: ${newWebhookUrl}`);

      // Atualizar o webhook
      const updatedWebhook = await stripe.webhookEndpoints.update(
        fitGeniusWebhook.id,
        {
          url: newWebhookUrl,
        }
      );

      console.log('\n✅ Webhook atualizado com sucesso!');
      console.log(`   ID: ${updatedWebhook.id}`);
      console.log(`   URL: ${updatedWebhook.url}`);
      console.log(`   Secret: ${updatedWebhook.secret}`);

      console.log('\n🔧 Verifique se a variável STRIPE_WEBHOOK_SECRET está correta:');
      console.log(`STRIPE_WEBHOOK_SECRET="${updatedWebhook.secret}"`);

    } else {
      console.log('🆕 Criando novo webhook...');

      const events = [
        'checkout.session.completed',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted'
      ];

      const webhook = await stripe.webhookEndpoints.create({
        url: newWebhookUrl,
        enabled_events: events,
        metadata: {
          app: 'fitgenius',
          version: '1.0',
          environment: 'production'
        }
      });

      console.log('\n✅ Novo webhook criado!');
      console.log(`   ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Secret: ${webhook.secret}`);

      console.log('\n🔧 Atualize a variável de ambiente:');
      console.log(`STRIPE_WEBHOOK_SECRET="${webhook.secret}"`);
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar webhook:', error.message);
    throw error;
  }
}

// Criar script de teste de produção
async function createProductionTestScript() {
  console.log('\n📝 Criando script de teste de produção...');

  const testScript = `
// Teste da aplicação FitGenius em produção
const tests = [
  {
    name: 'Health Check',
    url: 'https://fitgenius-7gdk8cozn-farmagenius-projects.vercel.app/api/health',
    method: 'GET'
  },
  {
    name: 'Homepage',
    url: 'https://fitgenius-7gdk8cozn-farmagenius-projects.vercel.app',
    method: 'GET'
  },
  {
    name: 'Auth Signin',
    url: 'https://fitgenius-7gdk8cozn-farmagenius-projects.vercel.app/auth/signin',
    method: 'GET'
  }
];

async function runTests() {
  console.log('🧪 Executando testes de produção...\\n');

  for (const test of tests) {
    try {
      console.log(\`📋 Testando: \${test.name}\`);
      console.log(\`   URL: \${test.url}\`);

      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'User-Agent': 'FitGenius-Test/1.0'
        }
      });

      console.log(\`   Status: \${response.status} \${response.statusText}\`);

      if (response.status < 500) {
        console.log(\`   ✅ \${test.name} - OK\`);
      } else {
        console.log(\`   ⚠️ \${test.name} - Erro de servidor\`);
      }

    } catch (error) {
      console.log(\`   ❌ \${test.name} - Falha: \${error.message}\`);
    }

    console.log('');
  }

  console.log('🏁 Testes concluídos!');
}

runTests();
  `;

  require('fs').writeFileSync(
    require('path').join(__dirname, 'test-production.js'),
    testScript.trim()
  );

  console.log('✅ Script de teste criado: scripts/test-production.js');
}

// Executar se chamado diretamente
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não encontrada no .env');
    process.exit(1);
  }

  updateStripeWebhook()
    .then(() => {
      createProductionTestScript();
      console.log('\n🎉 Webhook atualizado e script de teste criado!');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Execute: node scripts/test-production.js');
      console.log('2. Teste login na aplicação');
      console.log('3. Teste processo de pagamento');
      console.log('4. Configure domínio customizado (opcional)');
    })
    .catch(error => {
      console.error('\\n💥 Falha na atualização');
      process.exit(1);
    });
}

module.exports = { updateStripeWebhook };
