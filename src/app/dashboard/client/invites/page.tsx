'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Send
} from 'lucide-react';

interface Invite {
  id: string;
  email: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  inviteCode: string;
  expiresAt: string;
  createdAt: string;
  professional: {
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [acceptingByCode, setAcceptingByCode] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/client/accept-invite');
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (inviteCode: string) => {
    setAcceptingInvite(inviteCode);
    try {
      const response = await fetch('/api/client/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Convite aceito! Você agora é cliente de ${data.professional.name}`);
        fetchInvites(); // Refresh data
      } else {
        alert(data.error || 'Erro ao aceitar convite');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('Erro ao aceitar convite');
    } finally {
      setAcceptingInvite(null);
    }
  };

  const acceptByCode = async () => {
    if (!inviteCode) return;

    setAcceptingByCode(true);
    try {
      await acceptInvite(inviteCode);
      setInviteCode('');
    } finally {
      setAcceptingByCode(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-gold/20 text-gold' },
      ACCEPTED: { label: 'Aceito', className: 'bg-accent-success/20 text-accent-success' },
      DECLINED: { label: 'Recusado', className: 'bg-accent-danger/20 text-accent-danger' },
      EXPIRED: { label: 'Expirado', className: 'bg-surface-secondary text-foreground-muted' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { size: 20 };
    switch (status) {
      case 'PENDING': return <Clock {...iconProps} className="text-gold" />;
      case 'ACCEPTED': return <CheckCircle {...iconProps} className="text-accent-success" />;
      case 'DECLINED': return <XCircle {...iconProps} className="text-accent-danger" />;
      case 'EXPIRED': return <AlertCircle {...iconProps} className="text-foreground-muted" />;
      default: return <Clock {...iconProps} className="text-gold" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando convites...</p>
        </div>
      </div>
    );
  }

  const pendingInvites = invites.filter(invite => invite.status === 'PENDING');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Convites de Profissionais</h1>
        <p className="text-foreground-secondary">
          Gerencie convites de profissionais para se tornar seu personal trainer
        </p>
      </div>

      {/* Accept by Code */}
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send size={20} className="text-gold" />
            Aceitar Convite por Código
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Tem um código de convite? Digite-o abaixo para aceitar:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
              placeholder="Digite o código do convite (ex: ABC123XY)"
              maxLength={8}
            />
            <Button
              onClick={acceptByCode}
              disabled={!inviteCode || acceptingByCode}
              className="bg-gold text-black hover:bg-gold-dark"
            >
              {acceptingByCode ? 'Aceitando...' : 'Aceitar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        {/* Pending Invites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} className="text-gold" />
              Convites Pendentes ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="text-center py-8">
                <Mail size={48} className="text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-secondary">Nenhum convite pendente</p>
                <p className="text-foreground-muted text-sm">
                  Quando um profissional te convidar, o convite aparecerá aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="p-4 rounded-lg bg-surface-hover border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                          <User size={24} className="text-gold" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {invite.professional.user.name}
                          </h3>
                          <p className="text-sm text-foreground-secondary mb-2">
                            {invite.professional.user.email}
                          </p>
                          {invite.message && (
                            <div className="p-3 bg-surface rounded border-l-4 border-gold mb-3">
                              <p className="text-sm text-foreground italic">"{invite.message}"</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-foreground-muted">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              Enviado em: {formatDate(invite.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              Expira em: {formatDate(invite.expiresAt)}
                            </span>
                            <span>Código: {invite.inviteCode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusIcon(invite.status)}
                        {getStatusBadge(invite.status)}
                        <Button
                          onClick={() => acceptInvite(invite.inviteCode)}
                          disabled={acceptingInvite === invite.inviteCode}
                          className="bg-gold text-black hover:bg-gold-dark"
                          size="sm"
                        >
                          {acceptingInvite === invite.inviteCode ? 'Aceitando...' : 'Aceitar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Invites History */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} className="text-gold" />
                Histórico de Convites ({invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(invite.status)}
                      <div>
                        <p className="font-medium text-foreground">
                          {invite.professional.user.name}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {formatDate(invite.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(invite.status)}
                      <span className="text-xs text-foreground-muted">
                        {invite.inviteCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}