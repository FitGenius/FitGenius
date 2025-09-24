import nodemailer from 'nodemailer';

interface InvitationEmailData {
  email: string;
  name: string;
  tenantName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
}

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { email, name, tenantName, inviterName, inviteUrl, role } = data;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convite para ${tenantName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚀 Você foi convidado!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            ${inviterName} convidou você para se juntar ao ${tenantName}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            Olá <strong>${name}</strong>,
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            Você foi convidado para se juntar ao <strong>${tenantName}</strong> como <strong>${role}</strong>
            na plataforma FitGenius. Nossa plataforma oferece uma experiência completa de fitness com IA integrada.
          </p>

          <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">O que você terá acesso:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin-bottom: 8px;">Dashboard personalizado com métricas em tempo real</li>
              <li style="margin-bottom: 8px;">Sistema completo de gerenciamento de treinos</li>
              <li style="margin-bottom: 8px;">IA Assistant para recomendações personalizadas</li>
              <li style="margin-bottom: 8px;">Relatórios avançados e análise de desempenho</li>
              <li style="margin-bottom: 8px;">Ferramentas de colaboração em equipe</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteUrl}"
               style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px;
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
                      box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">
              Aceitar Convite e Começar
            </a>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 30px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⏰ <strong>Este convite expira em 7 dias.</strong> Não perca a oportunidade de se juntar à equipe!
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
            Se você não conseguir clicar no botão acima, copie e cole este link no seu navegador:<br>
            <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            Se você precisar de ajuda ou tiver dúvidas, entre em contato conosco em
            <a href="mailto:support@fitgenius.com" style="color: #6366f1;">support@fitgenius.com</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 FitGenius. Todos os direitos reservados.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
            Transformando fitness através de tecnologia inteligente
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    🚀 Você foi convidado para o ${tenantName}!

    Olá ${name},

    ${inviterName} convidou você para se juntar ao ${tenantName} como ${role} na plataforma FitGenius.

    Para aceitar o convite e começar a usar a plataforma, acesse:
    ${inviteUrl}

    O que você terá acesso:
    • Dashboard personalizado com métricas em tempo real
    • Sistema completo de gerenciamento de treinos
    • IA Assistant para recomendações personalizadas
    • Relatórios avançados e análise de desempenho
    • Ferramentas de colaboração em equipe

    ⏰ Este convite expira em 7 dias.

    Se você precisar de ajuda, entre em contato: support@fitgenius.com

    © 2024 FitGenius - Transformando fitness através de tecnologia inteligente
  `;

  try {
    const result = await transporter.sendMail({
      from: `"FitGenius" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🚀 Convite para ${tenantName} - FitGenius`,
      text: textTemplate,
      html: htmlTemplate,
    });

    console.log(`Invitation email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send invitation email to ${email}:`, error);
    throw new Error('Failed to send invitation email');
  }
}

export async function sendWelcomeEmail(data: {
  email: string;
  name: string;
  tenantName: string;
  loginUrl: string;
  role: string;
}) {
  const { email, name, tenantName, loginUrl, role } = data;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao ${tenantName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Bem-vindo ao ${tenantName}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Sua conta foi criada com sucesso
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            Olá <strong>${name}</strong>,
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 30px 0;">
            Parabéns! Sua conta no <strong>${tenantName}</strong> foi criada com sucesso.
            Você agora tem acesso como <strong>${role}</strong> a uma plataforma completa de fitness com IA integrada.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}"
               style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px;
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Fazer Login Agora
            </a>
          </div>

          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #047857; font-size: 16px;">💡 Primeiros Passos:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #065f46;">
              <li style="margin-bottom: 8px;">Complete seu perfil na seção "Meu Perfil"</li>
              <li style="margin-bottom: 8px;">Explore o dashboard e familiarize-se com as funcionalidades</li>
              <li style="margin-bottom: 8px;">Configure suas preferências de treino</li>
              <li style="margin-bottom: 8px;">Comece a criar e gerenciar treinos</li>
            </ol>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
            Se você precisar de ajuda para começar, nossa equipe de suporte está disponível em
            <a href="mailto:support@fitgenius.com" style="color: #10b981;">support@fitgenius.com</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${tenantName}. Powered by FitGenius.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await transporter.sendMail({
      from: `"${tenantName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 Bem-vindo ao ${tenantName}!`,
      html: htmlTemplate,
    });

    console.log(`Welcome email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    throw new Error('Failed to send welcome email');
  }
}