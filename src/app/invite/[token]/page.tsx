'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { signIn } from 'next-auth/react';

interface InvitationData {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    businessType: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  status: string;
}

interface FormData {
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Convite não encontrado ou expirado');
        } else if (response.status === 410) {
          setError('Este convite já foi usado ou cancelado');
        } else {
          setError('Erro ao carregar convite');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setInvitation(data.invitation);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation) return;

    // Validation
    if (!formData.password || formData.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Você deve aceitar os termos e condições');
      return;
    }

    setCreating(true);
    try {
      // Accept invitation and create account
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aceitar convite');
      }

      const result = await response.json();

      toast.success('Conta criada com sucesso! Fazendo login...');

      // Auto login
      const loginResult = await signIn('credentials', {
        email: invitation.email,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.push(`/admin?tenant=${invitation.tenant.id}`);
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Erro ao aceitar convite');
    } finally {
      setCreating(false);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Expirado</h1>
          <p className="text-gray-600 mb-6">
            Este convite expirou em {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${invitation.tenant.primaryColor}, ${invitation.tenant.secondaryColor})`
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 m-4 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {invitation.tenant.logo && (
            <img
              src={invitation.tenant.logo}
              alt={invitation.tenant.name}
              className="h-12 mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Você foi convidado!
          </h1>
          <p className="text-gray-600">
            <strong>{invitation.invitedBy.name}</strong> convidou você para se juntar ao{' '}
            <strong style={{ color: invitation.tenant.primaryColor }}>
              {invitation.tenant.name}
            </strong>
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nome:</span>
              <span className="font-medium">{invitation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cargo:</span>
              <span className="font-medium">{invitation.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expira em:</span>
              <span className="font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criar Senha
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="Digite uma senha segura"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 8 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              placeholder="Digite a senha novamente"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
              className="mt-1 mr-2"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
              Eu aceito os{' '}
              <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">
                termos e condições
              </a>{' '}
              e a{' '}
              <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">
                política de privacidade
              </a>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <button
            onClick={acceptInvitation}
            disabled={creating || !formData.acceptTerms}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            style={{
              backgroundColor: invitation.tenant.primaryColor,
            }}
          >
            {creating ? 'Criando conta...' : 'Aceitar Convite e Começar'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full mt-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Já tenho uma conta
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Powered by <span className="font-semibold">FitGenius</span>
        </div>
      </div>
    </div>
  );
}