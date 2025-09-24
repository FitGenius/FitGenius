'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Check,
  Crown,
  Star,
  Zap,
  Users,
  BarChart3,
  MessageCircle,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Plan {
  id: string;
  type: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  description: string;
  price: number;
  formattedPrice: string;
  currency: string;
  interval: string;
  maxClients: number | null;
  features: string[];
  stripePriceId: string | null;
  popular: boolean;
}

interface Subscription {
  id: string;
  plan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function ProfessionalBillingPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: string) => {
    if (checkoutLoading) return;

    setCheckoutLoading(planType);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType,
          successUrl: `${window.location.origin}/dashboard/professional/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/professional/billing?canceled=true`
        })
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Erro ao criar sessão de checkout');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Erro interno. Tente novamente.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/professional/billing`
        })
      });

      const data = await response.json();

      if (response.ok && data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      } else {
        alert(data.error || 'Erro ao acessar portal de billing');
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert('Erro interno. Tente novamente.');
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'FREE':
        return <Users size={24} className="text-blue-500" />;
      case 'PROFESSIONAL':
        return <Crown size={24} className="text-gold" />;
      case 'ENTERPRISE':
        return <Zap size={24} className="text-purple-500" />;
      default:
        return <Star size={24} className="text-foreground-secondary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Ativo', variant: 'default', className: 'bg-green-500 text-white' },
      CANCELED: { label: 'Cancelado', variant: 'secondary', className: 'bg-red-500 text-white' },
      PAST_DUE: { label: 'Vencido', variant: 'destructive', className: 'bg-yellow-500 text-black' },
      TRIALING: { label: 'Teste', variant: 'outline', className: 'bg-blue-500 text-white' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

    return (
      <Badge variant={config.variant as any} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isCurrentPlan = (planType: string) => {
    return subscription?.plan === planType;
  };

  const canUpgrade = (planType: string) => {
    if (!subscription) return planType !== 'FREE';

    const planOrder = { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 2 };
    const currentOrder = planOrder[subscription.plan];
    const targetOrder = planOrder[planType as keyof typeof planOrder];

    return targetOrder > currentOrder;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Planos & Faturamento</h1>
        <p className="text-foreground-secondary">
          Gerencie sua assinatura e escolha o melhor plano para seu negócio
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} className="text-gold" />
              Assinatura Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getPlanIcon(subscription.plan)}
                <div>
                  <h3 className="font-semibold text-foreground">
                    Plano {subscription.plan === 'FREE' ? 'Gratuito' :
                           subscription.plan === 'PROFESSIONAL' ? 'Profissional' : 'Enterprise'}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {subscription.cancelAtPeriodEnd
                      ? `Cancela em ${new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                      : `Renova em ${new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                    }
                  </p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
              {subscription.plan !== 'FREE' && (
                <Button
                  onClick={handleManageBilling}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings size={16} />
                  Gerenciar Cobrança
                  <ExternalLink size={14} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular ? 'ring-2 ring-gold' : ''
            } ${isCurrentPlan(plan.type) ? 'bg-surface-hover' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gold text-black">
                  <Star size={12} className="mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getPlanIcon(plan.type)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-foreground-secondary text-sm">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">
                  {plan.formattedPrice}
                </span>
                {plan.price > 0 && (
                  <span className="text-foreground-secondary">/mês</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                {isCurrentPlan(plan.type) ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano Atual
                  </Button>
                ) : canUpgrade(plan.type) ? (
                  <Button
                    onClick={() => handleUpgrade(plan.type)}
                    className="w-full"
                    disabled={!!checkoutLoading}
                  >
                    {checkoutLoading === plan.type ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                        Processando...
                      </div>
                    ) : plan.type === 'FREE' ? (
                      'Voltar ao Gratuito'
                    ) : (
                      'Fazer Upgrade'
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Plano Inferior
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare os Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3">Recursos</th>
                  <th className="text-center py-3">Gratuito</th>
                  <th className="text-center py-3">Profissional</th>
                  <th className="text-center py-3">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3">Máximo de clientes</td>
                  <td className="text-center py-3">3</td>
                  <td className="text-center py-3">30</td>
                  <td className="text-center py-3">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3">Avaliações físicas</td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Chat em tempo real</td>
                  <td className="text-center py-3">-</td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Analytics avançados</td>
                  <td className="text-center py-3">-</td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Suporte prioritário</td>
                  <td className="text-center py-3">-</td>
                  <td className="text-center py-3">
                    <Check size={16} className="text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3">24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}