const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy do FitGenius...\n');

// Verificar se é um repositório git
function checkGitRepo() {
  try {
    execSync('git status', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Inicializar repositório se necessário
function initGitRepo() {
  console.log('📂 Inicializando repositório Git...');
  try {
    execSync('git init', { stdio: 'inherit' });
    console.log('✅ Repositório Git inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Git:', error.message);
    throw error;
  }
}

// Verificar variáveis de ambiente essenciais
function checkEnvironmentVariables() {
  console.log('🔍 Verificando variáveis de ambiente...');

  const envFile = path.join(__dirname, '..', '.env.production');
  if (!fs.existsSync(envFile)) {
    console.error('❌ Arquivo .env.production não encontrado');
    throw new Error('Missing .env.production');
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missingVars = requiredVars.filter(varName =>
    !envContent.includes(varName) || envContent.includes(`${varName}=""`) || envContent.includes(`${varName}="your-`)
  );

  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente faltando ou não configuradas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    throw new Error('Missing environment variables');
  }

  console.log('✅ Todas as variáveis essenciais configuradas');
}

// Verificar dependências
function checkDependencies() {
  console.log('📦 Verificando dependências...');

  const packageJson = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJson)) {
    console.error('❌ package.json não encontrado');
    throw new Error('Missing package.json');
  }

  try {
    execSync('npm ls --production > /dev/null 2>&1', { stdio: 'pipe' });
    console.log('✅ Dependências verificadas');
  } catch (error) {
    console.log('📥 Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas');
  }
}

// Executar build de produção
function buildProduction() {
  console.log('🏗️ Executando build de produção...');

  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro no build:', error.message);
    throw error;
  }
}

// Preparar para deploy
function prepareForDeploy() {
  console.log('🔧 Preparando arquivos para deploy...');

  // Verificar se vercel.json existe
  const vercelConfig = path.join(__dirname, '..', 'vercel.json');
  if (!fs.existsSync(vercelConfig)) {
    console.log('📄 Criando vercel.json...');
    const vercelSettings = {
      "version": 2,
      "regions": ["gru1"],
      "env": {
        "DATABASE_URL": "@database_url",
        "NEXTAUTH_SECRET": "@nextauth_secret",
        "STRIPE_SECRET_KEY": "@stripe_secret",
        "STRIPE_WEBHOOK_SECRET": "@stripe_webhook_secret"
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
      }
    };

    fs.writeFileSync(vercelConfig, JSON.stringify(vercelSettings, null, 2));
    console.log('✅ vercel.json criado');
  } else {
    console.log('✅ vercel.json já existe');
  }

  console.log('✅ Preparação concluída');
}

// Commit mudanças
function commitChanges() {
  console.log('📝 Fazendo commit das mudanças...');

  try {
    // Verificar se há mudanças para commit
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim()) {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: production deployment setup with Stripe integration\\n\\n✨ Added Stripe products and webhook configuration\\n🔧 Updated environment variables for production\\n🚀 Ready for production deployment"', { stdio: 'inherit' });
      console.log('✅ Commit realizado');
    } else {
      console.log('✅ Nenhuma mudança para commit');
    }
  } catch (error) {
    console.log('ℹ️ Erro no commit (pode ser normal):', error.message);
  }
}

// Instruções para deploy manual
function showDeployInstructions() {
  console.log('\n🎯 PRÓXIMOS PASSOS PARA DEPLOY:\n');

  console.log('1️⃣ GITHUB (se ainda não está):');
  console.log('   • Criar repositório: https://github.com/new');
  console.log('   • git remote add origin https://github.com/seu-usuario/fitgenius.git');
  console.log('   • git branch -M main');
  console.log('   • git push -u origin main');

  console.log('\n2️⃣ VERCEL DEPLOY:');
  console.log('   • Acessar: https://vercel.com/new');
  console.log('   • Conectar repositório GitHub');
  console.log('   • Adicionar variáveis de ambiente do .env.production');
  console.log('   • Deploy automático!');

  console.log('\n3️⃣ VARIÁVEIS DE AMBIENTE NA VERCEL:');
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.production'), 'utf8');
  const envLines = envContent.split('\n').filter(line =>
    line.startsWith('DATABASE_URL') ||
    line.startsWith('NEXTAUTH_SECRET') ||
    line.startsWith('STRIPE_') ||
    line.startsWith('NEXT_PUBLIC_')
  );

  envLines.forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      console.log(`   ${key}=${value}`);
    }
  });

  console.log('\n4️⃣ PÓS-DEPLOY:');
  console.log('   • Testar webhook Stripe no dashboard');
  console.log('   • Executar: node scripts/test-production.js');
  console.log('   • Configurar domínio customizado');

  console.log('\n🎉 FITGENIUS PRONTO PARA O SUCESSO!');
}

// Execução principal
async function main() {
  try {
    // Verificações pré-deploy
    checkEnvironmentVariables();
    checkDependencies();

    // Se não é um repo Git, inicializar
    if (!checkGitRepo()) {
      initGitRepo();
    }

    // Build de produção
    buildProduction();

    // Preparar para deploy
    prepareForDeploy();

    // Commit mudanças
    commitChanges();

    // Mostrar instruções
    showDeployInstructions();

    console.log('\n✅ Preparação para deploy concluída com sucesso!');

  } catch (error) {
    console.error('\n💥 Erro durante a preparação:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };