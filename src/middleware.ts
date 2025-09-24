import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/callback',
  '/api/auth/signout',
  '/api/auth/error'
];

// Rotas que requerem role específico
const professionalRoutes = [
  '/dashboard/professional',
  '/api/professional'
];

const clientRoutes = [
  '/dashboard/client',
  '/api/client'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a arquivos estáticos e _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // arquivos com extensão (imagens, etc)
  ) {
    return NextResponse.next();
  }

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Obter token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Se não está autenticado
  if (!token) {
    // Permitir acesso a rotas públicas
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirecionar para login se tentar acessar rota protegida
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Se está autenticado mas tentando acessar páginas de auth
  if (pathname.startsWith('/auth/')) {
    // Redirecionar baseado no role
    const redirectUrl = token.role === 'PROFESSIONAL'
      ? '/dashboard/professional'
      : '/dashboard/client';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Verificar permissões baseadas em role
  const isProfessionalRoute = professionalRoutes.some(route =>
    pathname.startsWith(route)
  );

  const isClientRoute = clientRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Proteger rotas de professional
  if (isProfessionalRoute && token.role !== 'PROFESSIONAL') {
    return NextResponse.redirect(new URL('/dashboard/client', request.url));
  }

  // Proteger rotas de client
  if (isClientRoute && token.role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/dashboard/professional', request.url));
  }

  // Adicionar informações do usuário ao header para uso nas páginas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', token.sub || '');
  requestHeaders.set('x-user-role', token.role as string || '');
  requestHeaders.set('x-user-email', token.email as string || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};