const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔑 Configurando variáveis de ambiente na Vercel...\n');

// Função para executar comandos da Vercel
function runVercelCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} concluído`);
    return true;
  } catch (error) {
    console.log(`⚠️ Erro em ${description}: ${error.message}`);
    return false;
  }
}

function setupEnvironmentVariables() {
  console.log('🔧 Lendo variáveis do .env.production...');

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
      let value = valueParts.join('=');

      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');

      if (key && value && !value.includes('your-') && !value.includes('TBD')) {
        envVars[key.trim()] = value;
      }
    }
  });

  console.log(`✅ ${Object.keys(envVars).length} variáveis encontradas\n`);

  // Configurar cada variável na Vercel
  const vercelEnvVars = {
    'DATABASE_URL': envVars.DATABASE_URL,
    'DIRECT_URL': envVars.DIRECT_URL || envVars.DATABASE_URL,
    'NEXTAUTH_URL': 'https://fitgenius.vercel.app',
    'NEXTAUTH_SECRET': envVars.NEXTAUTH_SECRET,
    'NEXT_PUBLIC_SUPABASE_URL': envVars.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_KEY': envVars.SUPABASE_SERVICE_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'STRIPE_SECRET_KEY': envVars.STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET': envVars.STRIPE_WEBHOOK_SECRET,
    'STRIPE_PROFESSIONAL_PRICE_ID': envVars.STRIPE_PROFESSIONAL_PRICE_ID,
    'STRIPE_ENTERPRISE_PRICE_ID': envVars.STRIPE_ENTERPRISE_PRICE_ID,
    'JWT_SECRET': envVars.JWT_SECRET,
    'REFRESH_TOKEN_SECRET': envVars.REFRESH_TOKEN_SECRET,
    'NODE_ENV': 'production',
    'NEXT_PUBLIC_APP_URL': 'https://fitgenius.vercel.app',
    'NEXT_PUBLIC_API_URL': 'https://fitgenius.vercel.app/api'
  };

  console.log('🔧 Configurando variáveis na Vercel:');

  let successCount = 0;
  for (const [key, value] of Object.entries(vercelEnvVars)) {
    if (!value || value.includes('your-') || value.includes('TBD')) {
      console.log(`⚠️  Pulando ${key} (valor não definido)`);
      continue;
    }

    // Mascarar valor para log
    const maskedValue = value.length > 20 ? value.substring(0, 15) + '...' : value;
    console.log(`  ${key}: ${maskedValue}`);

    // Configurar na Vercel
    const command = `vercel env add ${key} production`;

    try {
      const child = execSync(command, {
        input: value + '\n',
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
      successCount++;
    } catch (error) {
      // Variável pode já existir, tentar atualizar
      console.log(`    ℹ️  Tentando atualizar ${key}...`);

      try {
        const rmCommand = `vercel env rm ${key} production --yes`;
        execSync(rmCommand, { stdio: 'pipe' });

        const addCommand = `vercel env add ${key} production`;
        execSync(addCommand, {
          input: value + '\n',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        successCount++;
      } catch (updateError) {
        console.log(`    ❌ Falha ao configurar ${key}`);
      }
    }
  }

  console.log(`\n✅ ${successCount}/${Object.keys(vercelEnvVars).length} variáveis configuradas\n`);

  return successCount > 0;
}

// Função principal
async function main() {
  try {
    console.log('1️⃣ Verificando projeto Vercel...');

    // Verificar se está logado
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      console.log('✅ Logado na Vercel');
    } catch (error) {
      console.log('🔑 Fazendo login na Vercel...');
      runVercelCommand('vercel login', 'Login na Vercel');
    }

    console.log('\n2️⃣ Configurando variáveis de ambiente...');
    if (setupEnvironmentVariables()) {
      console.log('3️⃣ Executando deploy...');
      if (runVercelCommand('vercel --prod --yes', 'Deploy em produção')) {
        console.log('\n🎉 Deploy concluído com sucesso!');

        console.log('\n📋 APLICAÇÃO IMPLANTADA:');
        console.log('🌐 URL: https://fitgenius.vercel.app');
        console.log('🔧 Dashboard: https://vercel.com/ffitgenius-3233/fitgenius');

        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('1. ✅ Testar a aplicação no ambiente de produção');
        console.log('2. 🔧 Configurar domínio customizado (opcional)');
        console.log('3. 🚀 Testar webhooks do Stripe');
        console.log('4. 📊 Monitorar logs e performance');
      }
    } else {
      console.log('❌ Falha na configuração de variáveis');
      console.log('\n💡 Configure manualmente:');
      console.log('https://vercel.com/ffitgenius-3233/fitgenius/settings/environment-variables');
    }

  } catch (error) {
    console.error('\n💥 Erro:', error.message);
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { setupEnvironmentVariables };