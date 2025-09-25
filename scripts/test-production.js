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
  console.log('🧪 Executando testes de produção...\n');

  for (const test of tests) {
    try {
      console.log(`📋 Testando: ${test.name}`);
      console.log(`   URL: ${test.url}`);

      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'User-Agent': 'FitGenius-Test/1.0'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.status < 500) {
        console.log(`   ✅ ${test.name} - OK`);
      } else {
        console.log(`   ⚠️ ${test.name} - Erro de servidor`);
      }

    } catch (error) {
      console.log(`   ❌ ${test.name} - Falha: ${error.message}`);
    }

    console.log('');
  }

  console.log('🏁 Testes concluídos!');
}

runTests();