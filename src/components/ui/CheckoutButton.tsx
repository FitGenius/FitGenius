'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  planType: 'PROFESSIONAL' | 'ENTERPRISE';
  className?: string;
  children: React.ReactNode;
}

export function CheckoutButton({ planType, className, children }: CheckoutButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`relative ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
}