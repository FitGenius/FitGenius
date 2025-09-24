'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: 'Informações Básicas', description: 'Configure os dados básicos do seu negócio' },
  { id: 2, title: 'Personalização', description: 'Customize a aparência da sua plataforma' },
  { id: 3, title: 'Plano e Usuários', description: 'Escolha seu plano e defina limites de usuários' },
  { id: 4, title: 'Convite da Equipe', description: 'Convide sua equipe para usar a plataforma' },
  { id: 5, title: 'Configuração Final', description: 'Finalize a configuração e comece a usar' },
];

interface FormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  businessType: 'GYM' | 'CORPORATE' | 'PERSONAL_TRAINER' | 'CLINIC' | 'SPORTS_TEAM';
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  maxUsers: number;
  teamMembers: Array<{
    email: string;
    role: 'TENANT_ADMIN' | 'MANAGER' | 'TRAINER';
    name: string;
  }>;
  features: Record<string, boolean>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    businessType: 'GYM',
    primaryColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    logo: '',
    subscriptionPlan: 'basic',
    maxUsers: 100,
    teamMembers: [],
    features: {},
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    updateFormData({
      name,
      slug: generateSlug(name)
    });
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Create tenant
      const tenantResponse = await fetch('/api/enterprise/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          businessType: formData.businessType,
          subscriptionPlan: formData.subscriptionPlan,
          maxUsers: formData.maxUsers,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        }),
      });

      if (!tenantResponse.ok) {
        throw new Error('Falha ao criar tenant');
      }

      const { tenant } = await tenantResponse.json();

      // Send team invitations
      if (formData.teamMembers.length > 0) {
        await fetch(`/api/tenants/${tenant.id}/invitations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitations: formData.teamMembers
          }),
        });
      }

      toast.success('Configuração concluída com sucesso!');
      router.push(`/admin?tenant=${tenant.id}`);
    } catch (error) {
      console.error('Erro no onboarding:', error);
      toast.error('Erro ao finalizar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 formData={formData} updateFormData={updateFormData} onNameChange={handleNameChange} />;
      case 2:
        return <Step2 formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3 formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4 formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5 formData={formData} onComplete={completeOnboarding} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {ONBOARDING_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step.id}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {ONBOARDING_STEPS[currentStep - 1].title}
              </h2>
              <p className="text-gray-600">
                {ONBOARDING_STEPS[currentStep - 1].description}
              </p>
            </div>

            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {currentStep < ONBOARDING_STEPS.length ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Finalizando...' : 'Concluir Configuração'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Information
function Step1({
  formData,
  updateFormData,
  onNameChange
}: {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Empresa/Academia
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Academia FitMax"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Personalizada
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => updateFormData({ slug: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="fitmax"
            />
            <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
              .fitgenius.com
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de Contato
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="contato@fitmax.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Negócio
        </label>
        <select
          value={formData.businessType}
          onChange={(e) => updateFormData({ businessType: e.target.value as FormData['businessType'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="GYM">Academia/Ginásio</option>
          <option value="CORPORATE">Empresa/Corporativo</option>
          <option value="PERSONAL_TRAINER">Personal Trainer</option>
          <option value="CLINIC">Clínica de Fisioterapia</option>
          <option value="SPORTS_TEAM">Equipe Esportiva</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Endereço Completo
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Rua, número, bairro, cidade, estado, CEP"
        />
      </div>
    </div>
  );
}

// Step 2: Customization
function Step2({
  formData,
  updateFormData
}: {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cor Primária
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => updateFormData({ primaryColor: e.target.value })}
              className="w-12 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => updateFormData({ primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#6366F1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cor Secundária
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => updateFormData({ secondaryColor: e.target.value })}
              className="w-12 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => updateFormData({ secondaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#8B5CF6"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL do Logo
        </label>
        <input
          type="url"
          value={formData.logo}
          onChange={(e) => updateFormData({ logo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="https://exemplo.com/logo.png"
        />
        <p className="text-sm text-gray-500 mt-1">
          Recomendamos uma imagem PNG ou SVG com fundo transparente (máximo 2MB)
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pré-visualização</h3>
        <div
          className="rounded-lg p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
          }}
        >
          <div className="flex items-center space-x-3 mb-4">
            {formData.logo && (
              <img src={formData.logo} alt="Logo" className="h-8 w-8 object-contain" />
            )}
            <h4 className="text-xl font-bold">{formData.name || 'Sua Empresa'}</h4>
          </div>
          <p className="opacity-90">Bem-vindo à sua plataforma personalizada!</p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Plan and Users
function Step3({
  formData,
  updateFormData
}: {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}) {
  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 5,
      description: 'Ideal para pequenos negócios',
      features: ['Até 100 usuários', 'Relatórios básicos', 'Suporte por email'],
      maxUsers: 100,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 15,
      description: 'Para empresas em crescimento',
      features: ['Até 500 usuários', 'IA Assistant', 'Análises avançadas', 'API Access'],
      maxUsers: 500,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 25,
      description: 'Solução completa para grandes empresas',
      features: ['Usuários ilimitados', 'White-label', 'Suporte prioritário', 'Integrações personalizadas'],
      maxUsers: 10000,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              formData.subscriptionPlan === plan.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              updateFormData({
                subscriptionPlan: plan.id as FormData['subscriptionPlan'],
                maxUsers: plan.maxUsers
              });
            }}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500">/usuário/mês</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número Máximo de Usuários
        </label>
        <input
          type="number"
          value={formData.maxUsers}
          onChange={(e) => updateFormData({ maxUsers: parseInt(e.target.value) })}
          min="1"
          max="10000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Você pode alterar esse limite posteriormente conforme necessário
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Custo Estimado</h4>
            <p className="text-sm text-blue-700">
              ${(formData.maxUsers * plans.find(p => p.id === formData.subscriptionPlan)?.price || 5).toFixed(2)} por mês
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Team Invitations
function Step4({
  formData,
  updateFormData
}: {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}) {
  const addTeamMember = () => {
    const newTeamMembers = [...formData.teamMembers, { email: '', role: 'TRAINER' as const, name: '' }];
    updateFormData({ teamMembers: newTeamMembers });
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers[index] = { ...newTeamMembers[index], [field]: value };
    updateFormData({ teamMembers: newTeamMembers });
  };

  const removeTeamMember = (index: number) => {
    const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
    updateFormData({ teamMembers: newTeamMembers });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Convide membros da sua equipe para usar a plataforma. Eles receberão um email com instruções para criar suas contas.
        </p>
      </div>

      <div className="space-y-4">
        {formData.teamMembers.map((member, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
            <div>
              <input
                type="text"
                placeholder="Nome"
                value={member.name}
                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={member.email}
                onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <select
                value={member.role}
                onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TENANT_ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="TRAINER">Treinador</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => removeTeamMember(index)}
                className="w-full px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={addTeamMember}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Adicionar Membro da Equipe
        </button>
      </div>

      {formData.teamMembers.length === 0 && (
        <div className="text-center text-gray-500">
          <p>Você pode pular esta etapa e convidar membros posteriormente no painel administrativo.</p>
        </div>
      )}
    </div>
  );
}

// Step 5: Final Configuration
function Step5({
  formData,
  onComplete,
  isLoading
}: {
  formData: FormData;
  onComplete: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Configuração Finalizada!
        </h3>
        <p className="text-gray-600">
          Revise suas configurações antes de finalizar a criação da sua plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Informações Básicas</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Nome:</span> {formData.name}</p>
            <p><span className="font-medium">URL:</span> {formData.slug}.fitgenius.com</p>
            <p><span className="font-medium">Email:</span> {formData.email}</p>
            <p><span className="font-medium">Tipo:</span> {formData.businessType}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Plano e Usuários</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Plano:</span> {formData.subscriptionPlan}</p>
            <p><span className="font-medium">Máx. Usuários:</span> {formData.maxUsers}</p>
            <p><span className="font-medium">Equipe Convidada:</span> {formData.teamMembers.length} pessoas</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-800">Próximos Passos</h4>
            <div className="mt-2 text-sm text-green-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Sua plataforma será criada e configurada</li>
                <li>Os convites da equipe serão enviados por email</li>
                <li>Você será redirecionado para o painel administrativo</li>
                <li>Poderá começar a usar a plataforma imediatamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isLoading ? 'Criando Plataforma...' : '🚀 Finalizar e Começar'}
        </button>
      </div>
    </div>
  );
}