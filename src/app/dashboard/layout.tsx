"use client";

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Users,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Calendar,
  MessageCircle,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Bell,
  User,
  Activity,
  Scale,
  Brain
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { AIChat, AIChatTrigger } from '@/components/ai/AIChat';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Menu items baseado no role do usuário
  const professionalMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard/professional' },
    { icon: Users, label: 'Clientes', href: '/dashboard/professional/clients' },
    { icon: Scale, label: 'Avaliações', href: '/dashboard/professional/assessments' },
    { icon: Activity, label: 'Exercícios', href: '/dashboard/professional/exercises' },
    { icon: Dumbbell, label: 'Treinos', href: '/dashboard/professional/workouts' },
    { icon: Target, label: 'Nutrição', href: '/dashboard/professional/nutrition' },
    { icon: Calendar, label: 'Agenda', href: '/dashboard/professional/schedule' },
    { icon: BarChart3, label: 'Relatórios', href: '/dashboard/professional/reports' },
    { icon: Brain, label: 'IA Insights', href: '/dashboard/professional/ai-insights' },
    { icon: CreditCard, label: 'Financeiro', href: '/dashboard/professional/billing' },
    { icon: MessageCircle, label: 'Mensagens', href: '/dashboard/professional/messages' },
    { icon: Settings, label: 'Configurações', href: '/dashboard/professional/settings' },
  ];

  const clientMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard/client' },
    { icon: Users, label: 'Convites', href: '/dashboard/client/invites' },
    { icon: Scale, label: 'Minhas Avaliações', href: '/dashboard/client/assessments' },
    { icon: Dumbbell, label: 'Meus Treinos', href: '/dashboard/client/workouts' },
    { icon: Target, label: 'Nutrição', href: '/dashboard/client/nutrition' },
    { icon: BarChart3, label: 'Progresso', href: '/dashboard/client/progress' },
    { icon: Calendar, label: 'Agenda', href: '/dashboard/client/schedule' },
    { icon: MessageCircle, label: 'Mensagens', href: '/dashboard/client/messages' },
    { icon: Settings, label: 'Configurações', href: '/dashboard/client/settings' },
  ];

  const menuItems = session?.user?.role === 'PROFESSIONAL' ? professionalMenuItems : clientMenuItems;

  useEffect(() => {
    // Fechar sidebar ao mudar de rota no mobile
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Dumbbell size={48} className="text-gold animate-pulse" />
          <p className="text-foreground-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Função para verificar se a rota está ativa
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard/professional' || href === '/dashboard/client') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Obter breadcrumbs
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';

    for (const path of paths) {
      currentPath += `/${path}`;
      const menuItem = menuItems.find(item => item.href === currentPath);
      const label = menuItem?.label || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="FitGenius" className="w-8 h-8" />
                <h1 className="gradient-text text-xl font-bold">FitGenius</h1>
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-foreground-secondary hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActiveRoute(item.href)
                        ? 'bg-gold/10 text-gold border-l-2 border-gold'
                        : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <User size={20} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-foreground-secondary truncate">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full mt-2 justify-start"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button & Breadcrumbs */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-foreground-secondary hover:text-foreground"
              >
                <Menu size={24} />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden md:flex items-center gap-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight size={14} className="text-foreground-muted" />}
                    <Link
                      href={crumb.href}
                      className={`hover:text-gold transition-colors ${
                        index === getBreadcrumbs().length - 1
                          ? 'text-foreground font-medium'
                          : 'text-foreground-secondary'
                      }`}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <User size={16} className="text-gold" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {session?.user?.name}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-20">
                      <div className="p-2">
                        <Link
                          href={`/dashboard/${session?.user?.role === 'PROFESSIONAL' ? 'professional' : 'client'}/profile`}
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-surface-hover transition-colors"
                        >
                          <User size={16} />
                          <span className="text-sm">Meu Perfil</span>
                        </Link>
                        <Link
                          href={`/dashboard/${session?.user?.role === 'PROFESSIONAL' ? 'professional' : 'client'}/settings`}
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-surface-hover transition-colors"
                        >
                          <Settings size={16} />
                          <span className="text-sm">Configurações</span>
                        </Link>
                        <hr className="my-2 border-border" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-surface-hover transition-colors text-left"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Sair</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* AI Chat */}
      {isChatOpen && (
        <AIChat
          isFloating={true}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {!isChatOpen && (
        <AIChatTrigger onClick={() => setIsChatOpen(true)} />
      )}
    </div>
  );
}