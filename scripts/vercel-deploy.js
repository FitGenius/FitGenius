const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy na Vercel...\n');

// Vercel credentials fornecidas pelo usuário
const VERCEL_TOKEN = 'ymRUrWD0Yb94Fc3jgHvzWTCx';
const VERCEL_ORG = 'ffitgenius-3233';
const PROJECT_NAME = 'fitgenius';

// Função para executar comandos
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, {
      stdio: ['inherit', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: {
        ...process.env,
        VERCEL_TOKEN
      }
    });
    console.log(`✅ ${description} concluído`);
    return result;
  } catch (error) {
    console.log(`⚠️ ${description}: ${error.message}`);
    return null;
  }
}

// Instalar Vercel CLI se necessário
function installVercelCLI() {
  console.log('🔧 Verificando Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI já instalado');
  } catch (error) {
    console.log('📦 Instalando Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI instalado');
  }
}

// Criar arquivo vercel.json otimizado
function createVercelConfig() {
  console.log('📄 Criando configuração Vercel...');

  const vercelConfig = {
    "version": 2,
    "framework": "nextjs",
    "regions": ["gru1"],
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "env": {
      "DATABASE_URL": "@database_url",
      "DIRECT_URL": "@direct_url",
      "NEXTAUTH_URL": "@nextauth_url",
      "NEXTAUTH_SECRET": "@nextauth_secret",
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
      "STRIPE_SECRET_KEY": "@stripe_secret_key",
      "STRIPE_WEBHOOK_SECRET": "@stripe_webhook_secret",
      "STRIPE_PROFESSIONAL_PRICE_ID": "@stripe_professional_price",
      "STRIPE_ENTERPRISE_PRICE_ID": "@stripe_enterprise_price",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe_publishable_key"
    },
    "build": {
      "env": {
        "NEXT_TELEMETRY_DISABLED": "1"
      }
    },
    "functions": {
      "app/api/**/*.js": {
        "maxDuration": 30
      }
    },
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  };

  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ vercel.json criado');
}

// Configurar variáveis de ambiente
function setupEnvironmentVariables() {
  console.log('🔑 Configurando variáveis de ambiente...');

  const envFile = path.join(__dirname, '..', '.env.production');
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.production não encontrado');
    return false;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};

  // Parse environment variables
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  // Mapear variáveis para secrets do Vercel
  const vercelSecrets = {
    'database_url': envVars.DATABASE_URL,
    'direct_url': envVars.DIRECT_URL,
    'nextauth_url': 'https://fitgenius.vercel.app',
    'nextauth_secret': envVars.NEXTAUTH_SECRET,
    'supabase_url': envVars.NEXT_PUBLIC_SUPABASE_URL,
    'supabase_anon_key': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'stripe_secret_key': envVars.STRIPE_SECRET_KEY,
    'stripe_webhook_secret': envVars.STRIPE_WEBHOOK_SECRET,
    'stripe_professional_price': envVars.STRIPE_PROFESSIONAL_PRICE_ID,
    'stripe_enterprise_price': envVars.STRIPE_ENTERPRISE_PRICE_ID,
    'stripe_publishable_key': envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  };

  console.log('📋 Variáveis a serem configuradas:');
  Object.keys(vercelSecrets).forEach(key => {
    const value = vercelSecrets[key];
    const maskedValue = value ? value.substring(0, 20) + '...' : 'não definido';
    console.log(`  ${key}: ${maskedValue}`);
  });

  console.log('\n💡 Você precisa configurar essas variáveis manualmente na Vercel:');
  console.log('   1. Acesse: https://vercel.com/ffitgenius-3233/fitgenius/settings/environment-variables');
  console.log('   2. Adicione cada variável como "Environment Variable"');
  console.log('   3. Defina para "Production, Preview, and Development"');

  return true;
}

// Função principal de deploy
async function deployToVercel() {
  try {
    console.log('1️⃣ Preparação inicial...');
    installVercelCLI();
    createVercelConfig();

    console.log('\n2️⃣ Configuração de variáveis...');
    if (!setupEnvironmentVariables()) {
      throw new Error('Falha na configuração de variáveis');
    }

    console.log('\n3️⃣ Login na Vercel...');
    runCommand(`vercel login`, 'Login na Vercel');

    console.log('\n4️⃣ Configuração do projeto...');
    runCommand(`vercel link --yes`, 'Vinculação do projeto');

    console.log('\n5️⃣ Deploy para produção...');
    const deployResult = runCommand(`vercel --prod --yes`, 'Deploy em produção');

    if (deployResult) {
      console.log('\n🎉 Deploy concluído com sucesso!');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Configure as variáveis de ambiente na Vercel');
      console.log('2. Teste a aplicação no ambiente de produção');
      console.log('3. Configure domínio customizado (se desejado)');
      console.log('4. Teste webhooks do Stripe');

      console.log('\n🔗 Links importantes:');
      console.log('• Dashboard Vercel: https://vercel.com/ffitgenius-3233');
      console.log('• Configurar variáveis: https://vercel.com/ffitgenius-3233/fitgenius/settings/environment-variables');
      console.log('• Logs de deploy: https://vercel.com/ffitgenius-3233/fitgenius');

    } else {
      console.log('\n⚠️ Deploy manual necessário');
      console.log('Execute: vercel --prod');
    }

  } catch (error) {
    console.error('\n💥 Erro durante o deploy:', error.message);

    console.log('\n🔄 Fallback - Deploy manual:');
    console.log('1. vercel login');
    console.log('2. vercel link');
    console.log('3. vercel --prod');
    console.log('4. Configure as variáveis de ambiente na dashboard');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  deployToVercel();
}

module.exports = { deployToVercel };