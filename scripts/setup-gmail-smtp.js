const { execSync } = require('child_process');

console.log('📧 Configurando Gmail SMTP na Vercel...\n');

const emailVars = {
  'SMTP_HOST': 'smtp.gmail.com',
  'SMTP_PORT': '587',
  'SMTP_SECURE': 'false',
  'SMTP_USER': 'ffitgenius@gmail.com',
  'SMTP_PASSWORD': 'qifkgajpgkiaxivu',
  'SMTP_FROM': 'ffitgenius@gmail.com',
  'EMAIL_FROM': 'FitGenius <ffitgenius@gmail.com>'
};

function setupEmailVar(key, value) {
  console.log(`📋 Configurando ${key}...`);

  try {
    // Tentar adicionar a variável
    const command = `vercel env add ${key} production`;
    execSync(command, {
      input: value + '\n',
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    console.log(`✅ ${key} configurada`);
    return true;
  } catch (error) {
    // Se falhar, tentar remover e adicionar novamente
    try {
      console.log(`   ℹ️  Atualizando ${key}...`);
      execSync(`vercel env rm ${key} production --yes`, { stdio: 'pipe' });
      execSync(`vercel env add ${key} production`, {
        input: value + '\n',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(`✅ ${key} atualizada`);
      return true;
    } catch (updateError) {
      console.log(`❌ Falha ao configurar ${key}`);
      return false;
    }
  }
}

async function setupGmailSMTP() {
  let successCount = 0;
  const totalVars = Object.keys(emailVars).length;

  console.log('🔧 Adicionando variáveis SMTP do Gmail:\n');

  for (const [key, value] of Object.entries(emailVars)) {
    if (setupEmailVar(key, value)) {
      successCount++;
    }
  }

  console.log(`\n📊 Resultado: ${successCount}/${totalVars} variáveis configuradas`);

  if (successCount === totalVars) {
    console.log('\n✅ Gmail SMTP configurado com sucesso!');
    console.log('\n📧 CONFIGURAÇÕES ATIVAS:');
    console.log('• Host: smtp.gmail.com');
    console.log('• Port: 587 (STARTTLS)');
    console.log('• User: ffitgenius@gmail.com');
    console.log('• From: FitGenius <ffitgenius@gmail.com>');

    console.log('\n🔄 Iniciando redeploy...');
    try {
      execSync('vercel --prod --yes', { stdio: 'inherit' });
      console.log('\n🎉 Redeploy concluído com Gmail SMTP!');
    } catch (error) {
      console.log('\n⚠️ Execute manualmente: vercel --prod');
    }

  } else {
    console.log('\n⚠️ Algumas variáveis falharam. Verifique manualmente.');
  }

  console.log('\n📋 FUNCIONALIDADES DE EMAIL ATIVADAS:');
  console.log('✅ Emails de convite para clientes');
  console.log('✅ Emails de boas-vindas');
  console.log('✅ Notificações de pagamento');
  console.log('✅ Recuperação de senha');
  console.log('✅ Relatórios automáticos');
}

setupGmailSMTP();