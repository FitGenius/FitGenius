// Script para testar conexão com banco e criar usuário admin
require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
    console.log('🔍 Testando conexão com banco de dados...');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));

    try {
        // Testar conexão
        await prisma.$connect();
        console.log('✅ Conexão com banco estabelecida com sucesso!');

        // Verificar tabelas existentes
        console.log('\n📋 Verificando estrutura do banco...');

        // Tentar criar usuário admin
        console.log('\n👤 Criando usuário administrador...');

        const hashedPassword = await bcrypt.hash('admin123', 12);

        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@admin.com.br' },
            update: {
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                isActive: true
            },
            create: {
                email: 'admin@admin.com.br',
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                isActive: true,
                emailVerified: new Date()
            }
        });

        console.log('✅ Usuário admin criado/atualizado com sucesso!');
        console.log('📧 Email:', adminUser.email);
        console.log('👤 Nome:', adminUser.name);
        console.log('🔑 Role:', adminUser.role);
        console.log('🆔 ID:', adminUser.id);

        // Testar algumas queries básicas
        console.log('\n🧪 Testando queries básicas...');

        const userCount = await prisma.user.count();
        console.log(`📊 Total de usuários: ${userCount}`);

        // Verificar se as tabelas principais existem
        try {
            const exerciseCount = await prisma.exercise.count();
            console.log(`🏋️ Total de exercícios: ${exerciseCount}`);
        } catch (e) {
            console.log('⚠️ Tabela Exercise pode não existir ainda');
        }

        try {
            const professionalCount = await prisma.professional.count();
            console.log(`👨‍⚕️ Total de profissionais: ${professionalCount}`);
        } catch (e) {
            console.log('⚠️ Tabela Professional pode não existir ainda');
        }

    } catch (error) {
        console.error('❌ Erro na conexão com banco:', error.message);

        if (error.code === 'P1001') {
            console.log('🔧 Verifique se o PostgreSQL está rodando no EasyPanel');
            console.log('🔧 URL de conexão:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
        } else if (error.code === 'P1000') {
            console.log('🔧 Problema de autenticação com o banco');
            console.log('🔧 Verifique usuário e senha do PostgreSQL');
        } else {
            console.log('🔧 Erro específico:', error.code);
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexão fechada');
    }
}

// Executar teste
testDatabaseConnection()
    .then(() => {
        console.log('\n✅ Teste de conexão concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha no teste:', error);
        process.exit(1);
    });