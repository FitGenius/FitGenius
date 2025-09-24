import { TenantContext } from './tenant-context';

export interface WhiteLabelConfig {
  branding: {
    logo: string;
    favicon: string;
    appName: string;
    tagline: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  domain: {
    customDomain?: string;
    subdomain: string;
    sslEnabled: boolean;
  };
  features: {
    hideAIBranding: boolean;
    customFooter: boolean;
    customEmailTemplates: boolean;
    customMobileApp: boolean;
    apiWhiteLabel: boolean;
  };
  content: {
    welcomeMessage: string;
    aboutText: string;
    termsUrl?: string;
    privacyUrl?: string;
    supportEmail: string;
    supportPhone?: string;
  };
  advanced: {
    customCSS?: string;
    customJS?: string;
    googleAnalytics?: string;
    customFonts: string[];
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
}

/**
 * Get white-label configuration for tenant
 */
export function getWhiteLabelConfig(tenantContext: TenantContext): WhiteLabelConfig {
  const settings = tenantContext.settings || {};
  const whiteLabelSettings = settings.whiteLabel || {};

  // Default configuration
  const defaultConfig: WhiteLabelConfig = {
    branding: {
      logo: tenantContext.logo || '/images/default-logo.png',
      favicon: '/images/default-favicon.ico',
      appName: tenantContext.name,
      tagline: 'Seu personal trainer inteligente',
      primaryColor: tenantContext.primaryColor || '#6366F1',
      secondaryColor: tenantContext.secondaryColor || '#8B5CF6',
      accentColor: '#10B981',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    domain: {
      subdomain: tenantContext.slug,
      sslEnabled: true,
      customDomain: tenantContext.domain,
    },
    features: {
      hideAIBranding: false,
      customFooter: false,
      customEmailTemplates: false,
      customMobileApp: false,
      apiWhiteLabel: false,
    },
    content: {
      welcomeMessage: `Bem-vindo ao ${tenantContext.name}!`,
      aboutText: `${tenantContext.name} - Transformando fitness através de tecnologia inteligente.`,
      supportEmail: tenantContext.email || 'support@fitgenius.com',
    },
    advanced: {
      customFonts: [],
      socialLinks: {},
    },
  };

  // Override with tenant-specific settings
  return mergeDeep(defaultConfig, whiteLabelSettings);
}

/**
 * Generate CSS variables for tenant theming
 */
export function generateTenantCSS(config: WhiteLabelConfig): string {
  return `
    :root {
      --tenant-primary: ${config.branding.primaryColor};
      --tenant-secondary: ${config.branding.secondaryColor};
      --tenant-accent: ${config.branding.accentColor};
      --tenant-background: ${config.branding.backgroundColor};
      --tenant-text: ${config.branding.textColor};
      --tenant-border-radius: ${config.branding.borderRadius};
      --tenant-font-family: ${config.branding.fontFamily};
    }

    .tenant-branded {
      --primary: ${config.branding.primaryColor};
      --secondary: ${config.branding.secondaryColor};
      --accent: ${config.branding.accentColor};
      --background: ${config.branding.backgroundColor};
      --foreground: ${config.branding.textColor};
      --border-radius: ${config.branding.borderRadius};
      font-family: ${config.branding.fontFamily};
    }

    .tenant-logo {
      background-image: url('${config.branding.logo}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .tenant-button-primary {
      background-color: ${config.branding.primaryColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: ${config.branding.borderRadius};
      font-family: ${config.branding.fontFamily};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tenant-button-primary:hover {
      background-color: ${adjustColor(config.branding.primaryColor, -10)};
      transform: translateY(-1px);
    }

    .tenant-button-secondary {
      background-color: ${config.branding.secondaryColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: ${config.branding.borderRadius};
      font-family: ${config.branding.fontFamily};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tenant-card {
      background: ${config.branding.backgroundColor};
      border: 1px solid ${adjustColor(config.branding.primaryColor, 80)};
      border-radius: ${config.branding.borderRadius};
      padding: 24px;
      color: ${config.branding.textColor};
    }

    .tenant-gradient {
      background: linear-gradient(135deg, ${config.branding.primaryColor}, ${config.branding.secondaryColor});
    }

    ${config.advanced.customCSS || ''}
  `;
}

/**
 * Generate HTML for tenant-specific head tags
 */
export function generateTenantHeadTags(config: WhiteLabelConfig): string {
  let headTags = `
    <title>${config.branding.appName} - ${config.branding.tagline}</title>
    <meta name="description" content="${config.content.aboutText}" />
    <meta name="theme-color" content="${config.branding.primaryColor}" />
    <link rel="icon" href="${config.branding.favicon}" />

    <!-- Open Graph -->
    <meta property="og:title" content="${config.branding.appName}" />
    <meta property="og:description" content="${config.content.aboutText}" />
    <meta property="og:image" content="${config.branding.logo}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${config.branding.appName}" />
    <meta name="twitter:description" content="${config.content.aboutText}" />
    <meta name="twitter:image" content="${config.branding.logo}" />
  `;

  // Add custom fonts
  if (config.advanced.customFonts.length > 0) {
    config.advanced.customFonts.forEach(font => {
      headTags += `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}" rel="stylesheet" />`;
    });
  }

  // Add Google Analytics
  if (config.advanced.googleAnalytics) {
    headTags += `
      <script async src="https://www.googletagmanager.com/gtag/js?id=${config.advanced.googleAnalytics}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.advanced.googleAnalytics}');
      </script>
    `;
  }

  // Add custom JavaScript
  if (config.advanced.customJS) {
    headTags += `<script>${config.advanced.customJS}</script>`;
  }

  return headTags;
}

/**
 * Get email template with tenant branding
 */
export function getTenantEmailTemplate(
  config: WhiteLabelConfig,
  templateName: string,
  variables: Record<string, any>
): { subject: string; html: string; text: string } {
  const templates = {
    welcome: {
      subject: `Bem-vindo ao ${config.branding.appName}!`,
      html: `
        <div style="font-family: ${config.branding.fontFamily}; max-width: 600px; margin: 0 auto;">
          <div style="background: ${config.branding.primaryColor}; color: white; padding: 40px 20px; text-align: center;">
            <img src="${config.branding.logo}" alt="${config.branding.appName}" style="height: 50px; margin-bottom: 20px;" />
            <h1 style="margin: 0; font-size: 28px;">${config.content.welcomeMessage}</h1>
          </div>

          <div style="padding: 40px 20px;">
            <p style="font-size: 16px; line-height: 1.6; color: ${config.branding.textColor};">
              Olá ${variables.name},
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: ${config.branding.textColor};">
              Estamos muito felizes em tê-lo conosco no ${config.branding.appName}!
              Você agora tem acesso a uma plataforma completa de fitness com IA integrada.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.loginUrl}"
                 style="background: ${config.branding.primaryColor}; color: white; padding: 15px 30px;
                        text-decoration: none; border-radius: ${config.branding.borderRadius};
                        font-weight: 600; display: inline-block;">
                Começar Agora
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 40px;">
              Se você precisar de ajuda, entre em contato conosco em
              <a href="mailto:${config.content.supportEmail}" style="color: ${config.branding.primaryColor};">
                ${config.content.supportEmail}
              </a>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; 2024 ${config.branding.appName}. Todos os direitos reservados.</p>
            ${!config.features.hideAIBranding ? '<p>Powered by FitGenius AI</p>' : ''}
          </div>
        </div>
      `,
      text: `
        ${config.content.welcomeMessage}

        Olá ${variables.name},

        Estamos muito felizes em tê-lo conosco no ${config.branding.appName}!
        Você agora tem acesso a uma plataforma completa de fitness com IA integrada.

        Para começar, acesse: ${variables.loginUrl}

        Se você precisar de ajuda, entre em contato: ${config.content.supportEmail}

        © 2024 ${config.branding.appName}
      `,
    },

    workout_reminder: {
      subject: `🏋️‍♂️ Hora do treino no ${config.branding.appName}!`,
      html: `
        <div style="font-family: ${config.branding.fontFamily}; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${config.branding.primaryColor}, ${config.branding.secondaryColor});
                      color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏋️‍♂️ Hora do Treino!</h1>
          </div>

          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; color: ${config.branding.textColor};">
              Olá ${variables.name},
            </p>

            <p style="font-size: 16px; color: ${config.branding.textColor};">
              Seu treino "${variables.workoutName}" está programado para agora!
            </p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${variables.workoutUrl}"
                 style="background: ${config.branding.primaryColor}; color: white; padding: 15px 30px;
                        text-decoration: none; border-radius: ${config.branding.borderRadius};
                        font-weight: 600; display: inline-block;">
                Iniciar Treino
              </a>
            </div>
          </div>
        </div>
      `,
      text: `
        🏋️‍♂️ Hora do Treino!

        Olá ${variables.name},

        Seu treino "${variables.workoutName}" está programado para agora!

        Iniciar: ${variables.workoutUrl}
      `,
    },
  };

  return templates[templateName as keyof typeof templates] || templates.welcome;
}

/**
 * Check if tenant has white-label feature enabled
 */
export function hasWhiteLabelAccess(tenantContext: TenantContext): boolean {
  const subscription = tenantContext.subscription;
  if (!subscription) return false;

  return subscription.features?.whiteLabel === true ||
         subscription.plan === 'enterprise';
}

/**
 * Generate tenant-specific mobile app config
 */
export function getTenantMobileConfig(config: WhiteLabelConfig) {
  return {
    appName: config.branding.appName,
    packageName: `com.${config.domain.subdomain}.fitgenius`,
    bundleId: `com.${config.domain.subdomain}.fitgenius`,
    colors: {
      primary: config.branding.primaryColor,
      secondary: config.branding.secondaryColor,
      accent: config.branding.accentColor,
    },
    logo: config.branding.logo,
    splash: {
      backgroundColor: config.branding.backgroundColor,
      image: config.branding.logo,
    },
    deepLinking: {
      scheme: config.domain.subdomain,
      domain: config.domain.customDomain || `${config.domain.subdomain}.fitgenius.com`,
    },
  };
}

// Utility functions
function mergeDeep(target: any, source: any): any {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}