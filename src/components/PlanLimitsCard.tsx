'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Crown,
  Users,
  MessageCircle,
  Activity,
  Scale,
  AlertTriangle,
  Zap,
  ArrowUp
} from 'lucide-react';
import Link from 'next/link';

interface PlanLimits {
  plan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  planName: string;
  limits: {
    clients: {
      limit: number | null;
      current: number;
      remaining: number | null;
      unlimited: boolean;
    };
    messages: {
      limit: number | null;
      current: number;
      remaining: number | null;
      unlimited: boolean;
    };
    workouts: {
      limit: number | null;
      current: number;
      remaining: number | null;
      unlimited: boolean;
    };
    assessments: {
      limit: number | null;
      current: number;
      remaining: number | null;
      unlimited: boolean;
    };
  };
}

export function PlanLimitsCard() {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await fetch('/api/plan-limits');
      if (response.ok) {
        const data = await response.json();
        setLimits(data);
      }
    } catch (error) {
      console.error('Error fetching plan limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (!limit) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return <Users size={20} className="text-blue-500" />;
      case 'PROFESSIONAL':
        return <Crown size={20} className="text-gold" />;
      case 'ENTERPRISE':
        return <Zap size={20} className="text-purple-500" />;
      default:
        return <Users size={20} className="text-foreground-secondary" />;
    }
  };

  const getPlanBadge = (plan: string) => {
    const config = {
      FREE: { label: 'Gratuito', className: 'bg-blue-500 text-white' },
      PROFESSIONAL: { label: 'Profissional', className: 'bg-gold text-black' },
      ENTERPRISE: { label: 'Enterprise', className: 'bg-purple-500 text-white' },
    } as const;

    const planConfig = config[plan as keyof typeof config] || config.FREE;

    return (
      <Badge className={planConfig.className}>
        {planConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-hover rounded w-1/2"></div>
            <div className="h-2 bg-surface-hover rounded"></div>
            <div className="h-2 bg-surface-hover rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return null;
  }

  const hasWarnings = Object.values(limits.limits).some(
    limit => !limit.unlimited && limit.limit && (limit.current / limit.limit) >= 0.8
  );

  return (
    <Card className={hasWarnings ? 'border-yellow-500/50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getPlanIcon(limits.plan)}
            Uso do Plano
          </CardTitle>
          <div className="flex items-center gap-2">
            {getPlanBadge(limits.plan)}
            {limits.plan === 'FREE' && (
              <Link href="/dashboard/professional/billing">
                <Button size="sm" className="h-6 px-2 text-xs">
                  <ArrowUp size={12} className="mr-1" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clientes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-foreground-secondary" />
              <span className="text-sm font-medium">Clientes</span>
            </div>
            <div className="text-sm text-foreground-secondary">
              {limits.limits.clients.unlimited ? (
                <span className="text-green-500">Ilimitado</span>
              ) : (
                `${limits.limits.clients.current}/${limits.limits.clients.limit}`
              )}
            </div>
          </div>
          {!limits.limits.clients.unlimited && limits.limits.clients.limit && (
            <div className="flex items-center gap-2">
              <Progress
                value={getUsagePercentage(limits.limits.clients.current, limits.limits.clients.limit)}
                className="flex-1 h-2"
              />
              {limits.limits.clients.remaining !== null && limits.limits.clients.remaining <= 2 && (
                <AlertTriangle size={16} className="text-yellow-500" />
              )}
            </div>
          )}
        </div>

        {/* Mensagens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-foreground-secondary" />
              <span className="text-sm font-medium">Mensagens (mês)</span>
            </div>
            <div className="text-sm text-foreground-secondary">
              {limits.limits.messages.unlimited ? (
                <span className="text-green-500">Ilimitado</span>
              ) : (
                `${limits.limits.messages.current}/${limits.limits.messages.limit}`
              )}
            </div>
          </div>
          {!limits.limits.messages.unlimited && limits.limits.messages.limit && (
            <div className="flex items-center gap-2">
              <Progress
                value={getUsagePercentage(limits.limits.messages.current, limits.limits.messages.limit)}
                className="flex-1 h-2"
              />
              {limits.limits.messages.remaining !== null && limits.limits.messages.remaining <= 10 && (
                <AlertTriangle size={16} className="text-yellow-500" />
              )}
            </div>
          )}
        </div>

        {/* Treinos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-foreground-secondary" />
              <span className="text-sm font-medium">Treinos (mês)</span>
            </div>
            <div className="text-sm text-foreground-secondary">
              <span className="text-green-500">Ilimitado</span>
            </div>
          </div>
        </div>

        {/* Avaliações */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-foreground-secondary" />
              <span className="text-sm font-medium">Avaliações (mês)</span>
            </div>
            <div className="text-sm text-foreground-secondary">
              <span className="text-green-500">Ilimitado</span>
            </div>
          </div>
        </div>

        {/* Avisos e ações */}
        {hasWarnings && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Limite próximo!</p>
                <p className="text-foreground-secondary">
                  Você está próximo do limite do seu plano. Considere fazer upgrade.
                </p>
              </div>
            </div>
            {limits.plan === 'FREE' && (
              <Link href="/dashboard/professional/billing" className="mt-2 inline-block">
                <Button size="sm" className="h-7">
                  Fazer Upgrade
                </Button>
              </Link>
            )}
          </div>
        )}

        {limits.plan === 'FREE' && !hasWarnings && (
          <div className="mt-4 text-center">
            <Link href="/dashboard/professional/billing">
              <Button variant="outline" size="sm" className="w-full">
                <Crown size={14} className="mr-2" />
                Desbloquear Recursos Premium
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}