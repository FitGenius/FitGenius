'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  businessType: string;
  userRole: string;
  lastAccessed?: string;
}

function SelectTenantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const redirect = searchParams.get('redirect') || '/admin';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchUserTenants();
  }, [session, status]);

  const fetchUserTenants = async () => {
    try {
      const response = await fetch('/api/user/tenants');

      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const data = await response.json();
      setTenants(data.tenants || []);

      // Auto-select if user has only one tenant
      if (data.tenants.length === 1) {
        setSelectedTenant(data.tenants[0].id);
        handleTenantSelect(data.tenants[0].id);
        return;
      }

      // Auto-select the last accessed tenant
      const lastAccessedTenant = data.tenants.find((t: Tenant) => t.lastAccessed);
      if (lastAccessedTenant) {
        setSelectedTenant(lastAccessedTenant.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Erro ao carregar organizações');
      setLoading(false);
    }
  };

  const handleTenantSelect = async (tenantId: string) => {
    try {
      // Set the active tenant in session
      const response = await fetch('/api/user/set-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set active tenant');
      }

      // Redirect to the requested page
      router.push(redirect);
    } catch (error) {
      console.error('Error setting active tenant:', error);
      toast.error('Erro ao selecionar organização');
    }
  };

  const getBusinessTypeDisplay = (type: string) => {
    const types = {
      GYM: '🏋️‍♂️ Academia',
      CORPORATE: '🏢 Corporativo',
      PERSONAL_TRAINER: '💪 Personal Trainer',
      CLINIC: '🏥 Clínica',
      SPORTS_TEAM: '⚽ Equipe Esportiva',
    };
    return types[type as keyof typeof types] || type;
  };

  const getRoleDisplay = (role: string) => {
    const roles = {
      SUPER_ADMIN: 'Super Admin',
      TENANT_ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      TRAINER: 'Treinador',
      USER: 'Usuário',
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas organizações...</p>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a1 1 0 011-1h4a1 1 0 011 1v12M13 7h2m-2 4h2m-6-4h2m-2 4h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma Organização</h1>
          <p className="text-gray-600 mb-6">
            Você não está associado a nenhuma organização ainda.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Criar Nova Organização
            </button>
            <button
              onClick={() => router.push('/join-organization')}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Solicitar Acesso a uma Organização
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecionar Organização
          </h1>
          <p className="text-gray-600">
            Escolha qual organização você gostaria de acessar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
                selectedTenant === tenant.id ? 'border-indigo-500' : 'border-transparent'
              }`}
              onClick={() => setSelectedTenant(tenant.id)}
            >
              <div
                className="h-24 rounded-t-xl"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`
                }}
              />

              <div className="p-6 -mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-white rounded-full p-2 shadow-md mr-3">
                    {tenant.logo ? (
                      <img
                        src={tenant.logo}
                        alt={tenant.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: tenant.primaryColor }}
                      >
                        {tenant.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {tenant.slug}.fitgenius.com
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium">
                      {getBusinessTypeDisplay(tenant.businessType)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Seu cargo:</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${tenant.primaryColor}20`,
                        color: tenant.primaryColor
                      }}
                    >
                      {getRoleDisplay(tenant.userRole)}
                    </span>
                  </div>
                  {tenant.lastAccessed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Último acesso:</span>
                      <span className="font-medium">
                        {new Date(tenant.lastAccessed).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTenantSelect(tenant.id);
                  }}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: selectedTenant === tenant.id ? tenant.primaryColor : '#f3f4f6',
                    color: selectedTenant === tenant.id ? 'white' : '#374151'
                  }}
                >
                  {selectedTenant === tenant.id ? 'Acessar' : 'Selecionar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedTenant && (
          <div className="text-center mt-8">
            <button
              onClick={() => handleTenantSelect(selectedTenant)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-lg"
            >
              Continuar com Organização Selecionada
            </button>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-4"
          >
            + Criar Nova Organização
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Gerenciar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

export default function SelectTenantPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SelectTenantContent />
    </Suspense>
  );
}