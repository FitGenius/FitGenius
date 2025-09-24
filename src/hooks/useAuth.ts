import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: string;
  role?: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
}

export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Ainda está carregando
    if (status === 'loading') return;

    // Não está autenticado e precisa de redirecionamento
    if (!session && options.redirectTo) {
      router.push(options.redirectTo);
    }

    // Está autenticado mas deveria redirecionar (útil para páginas de login)
    if (session && options.redirectIfAuthenticated) {
      router.push(options.redirectIfAuthenticated);
    }

    // Verificar role específico
    if (session && options.role && session.user.role !== options.role) {
      // Redirecionar para o dashboard correto baseado no role
      const redirectPath = session.user.role === 'PROFESSIONAL'
        ? '/dashboard/professional'
        : '/dashboard/client';
      router.push(redirectPath);
    }
  }, [session, status, router, options]);

  // Helpers functions
  const isAuthenticated = !!session;
  const isLoading = status === 'loading';
  const isProfessional = session?.user?.role === 'PROFESSIONAL';
  const isClient = session?.user?.role === 'CLIENT';
  const isAdmin = session?.user?.role === 'ADMIN';

  // User data helpers
  const userId = session?.user?.id;
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const userRole = session?.user?.role;

  // Professional specific data
  const professionalId = session?.user?.professional?.id;
  const professionalData = session?.user?.professional;

  // Client specific data
  const clientId = session?.user?.client?.id;
  const clientData = session?.user?.client;

  return {
    // Session data
    session,
    status,

    // Auth states
    isAuthenticated,
    isLoading,

    // Role checks
    isProfessional,
    isClient,
    isAdmin,

    // User data
    user: session?.user,
    userId,
    userName,
    userEmail,
    userRole,

    // Role specific data
    professionalId,
    professionalData,
    clientId,
    clientData,

    // Functions
    requireAuth: () => {
      if (!session && status !== 'loading') {
        router.push('/auth/signin');
      }
    },

    requireRole: (role: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN') => {
      if (session && session.user.role !== role) {
        const redirectPath = session.user.role === 'PROFESSIONAL'
          ? '/dashboard/professional'
          : '/dashboard/client';
        router.push(redirectPath);
      }
    }
  };
}

// Hook para páginas que requerem autenticação
export function useRequireAuth(redirectTo = '/auth/signin') {
  return useAuth({ redirectTo });
}

// Hook para páginas de professional
export function useRequireProfessional() {
  return useAuth({
    redirectTo: '/auth/signin',
    role: 'PROFESSIONAL'
  });
}

// Hook para páginas de client
export function useRequireClient() {
  return useAuth({
    redirectTo: '/auth/signin',
    role: 'CLIENT'
  });
}

// Hook para páginas públicas (redireciona se autenticado)
export function usePublicPage(redirectTo?: string) {
  const { session } = useSession();

  const redirect = redirectTo || (
    session?.user?.role === 'PROFESSIONAL'
      ? '/dashboard/professional'
      : '/dashboard/client'
  );

  return useAuth({ redirectIfAuthenticated: redirect });
}