// Carregar variáveis de ambiente
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function updateWebhookToNewURL() {
  console.log('🔄 Atualizando webhook para nova URL com OpenAI...\n');

  const newWebhookUrl = 'https://fitgenius-9ouu4ty9u-farmagenius-projects.vercel.app/api/stripe/webhook';

  try {
    // Listar webhooks existentes
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`📋 Encontrados ${webhooks.data.length} webhook(s)`);

    // Encontrar webhook do FitGenius
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

      return updatedWebhook;
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar webhook:', error.message);
    throw error;
  }
}

// Executar
if (require.main === module) {
  updateWebhookToNewURL()
    .then(() => {
      console.log('\n🎉 Webhook atualizado para nova versão com OpenAI!');
      console.log('\n🤖 FUNCIONALIDADES ATIVADAS:');
      console.log('✅ Chatbot IA conversacional avançado');
      console.log('✅ Análises de texto em linguagem natural');
      console.log('✅ Geração de planos de treino personalizados');
      console.log('✅ Respostas inteligentes contextuais');

      console.log('\n🚀 NOVA URL DA APLICAÇÃO:');
      console.log('https://fitgenius-9ouu4ty9u-farmagenius-projects.vercel.app');
    })
    .catch(error => {
      console.error('\n💥 Falha na atualização');
      process.exit(1);
    });
}

module.exports = { updateWebhookToNewURL };