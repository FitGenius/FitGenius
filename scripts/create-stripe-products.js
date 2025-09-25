// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('🚀 Criando produtos Stripe para FitGenius...\n');

  try {
    // Criar produto Professional
    console.log('1️⃣ Criando produto Professional...');
    const professionalProduct = await stripe.products.create({
      name: 'FitGenius Professional',
      description: 'Plano profissional para personal trainers - Até 30 clientes, IA incluída, relatórios avançados',
      metadata: {
        plan: 'professional',
        max_clients: '30',
        features: 'ai,reports,advanced_workouts'
      }
    });

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 9700, // R$ 97.00
      currency: 'brl',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'professional'
      }
    });

    console.log('✅ Professional criado:');
    console.log(`   Product ID: ${professionalProduct.id}`);
    console.log(`   Price ID: ${professionalPrice.id}`);
    console.log(`   Valor: R$ 97,00/mês\n`);

    // Criar produto Enterprise
    console.log('2️⃣ Criando produto Enterprise...');
    const enterpriseProduct = await stripe.products.create({
      name: 'FitGenius Enterprise',
      description: 'Plano enterprise para academias e grandes personal trainers - Clientes ilimitados, white-label, API',
      metadata: {
        plan: 'enterprise',
        max_clients: 'unlimited',
        features: 'ai,reports,advanced_workouts,white_label,api,multi_tenant'
      }
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 19700, // R$ 197.00
      currency: 'brl',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'enterprise'
      }
    });

    console.log('✅ Enterprise criado:');
    console.log(`   Product ID: ${enterpriseProduct.id}`);
    console.log(`   Price ID: ${enterprisePrice.id}`);
    console.log(`   Valor: R$ 197,00/mês\n`);

    // Mostrar resumo
    console.log('📋 RESUMO DOS PRODUTOS CRIADOS:');
    console.log('================================');
    console.log(`Professional: ${professionalPrice.id}`);
    console.log(`Enterprise: ${enterprisePrice.id}`);
    console.log('\n🔧 Adicione estas variáveis ao seu .env:');
    console.log(`STRIPE_PROFESSIONAL_PRICE_ID="${professionalPrice.id}"`);
    console.log(`STRIPE_ENTERPRISE_PRICE_ID="${enterprisePrice.id}"`);

    return {
      professional: {
        product: professionalProduct.id,
        price: professionalPrice.id
      },
      enterprise: {
        product: enterpriseProduct.id,
        price: enterprisePrice.id
      }
    };

  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  // Carregar variáveis de ambiente
  require('dotenv').config();

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não encontrada no .env');
    process.exit(1);
  }

  createStripeProducts()
    .then(products => {
      console.log('\n🎉 Produtos Stripe criados com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Falha na criação dos produtos');
      process.exit(1);
    });
}

module.exports = { createStripeProducts };