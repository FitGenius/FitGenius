import { ReactNode } from 'react';
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
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'professional' | 'client';
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const professionalMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard/professional' },
    { icon: Users, label: 'Clientes', href: '/dashboard/professional/clients' },
    { icon: Dumbbell, label: 'Treinos', href: '/dashboard/professional/workouts' },
    { icon: Target, label: 'Nutrição', href: '/dashboard/professional/nutrition' },
    { icon: Calendar, label: 'Agenda', href: '/dashboard/professional/schedule' },
    { icon: BarChart3, label: 'Relatórios', href: '/dashboard/professional/reports' },
    { icon: CreditCard, label: 'Financeiro', href: '/dashboard/professional/billing' },
    { icon: MessageCircle, label: 'Mensagens', href: '/messages' },
  ];

  const clientMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard/client' },
    { icon: Dumbbell, label: 'Meus Treinos', href: '/dashboard/client/workouts' },
    { icon: Target, label: 'Nutrição', href: '/dashboard/client/nutrition' },
    { icon: BarChart3, label: 'Analytics', href: '/client/analytics' },
    { icon: Trophy, label: 'Conquistas', href: '/client/gamification' },
    { icon: Calendar, label: 'Agenda', href: '/dashboard/client/schedule' },
    { icon: MessageCircle, label: 'Mensagens', href: '/messages' },
  ];

  const menuItems = userType === 'professional' ? professionalMenuItems : clientMenuItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Dumbbell size={32} className="text-gold" />
            <h1 className="gradient-text text-xl font-bold">FitGenius</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-surface">
          <div className="space-y-2">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors w-full"
            >
              <Settings size={20} />
              Configurações
            </Link>
            <Button
              variant="ghost"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors w-full justify-start"
            >
              <LogOut size={20} />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}