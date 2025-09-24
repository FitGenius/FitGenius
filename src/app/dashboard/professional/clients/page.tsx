'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Mail,
  Plus,
  Calendar,
  MessageCircle,
  Activity,
  MoreVertical,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Client {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    lastLogin: Date | null;
  };
  workouts: Array<{
    id: string;
    name: string;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    scheduledDate: Date | null;
    completedAt: Date | null;
  }>;
  _count: {
    workouts: number;
  };
}

interface Invite {
  id: string;
  email: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  inviteCode: string;
  expiresAt: Date;
  createdAt: Date;
  client: Client | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, invitesRes] = await Promise.all([
        fetch('/api/professional/clients'),
        fetch('/api/professional/invite')
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.invites || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) return;

    setSendingInvite(true);
    try {
      const response = await fetch('/api/professional/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          message: inviteMessage
        })
      });

      if (response.ok) {
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteForm(false);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Erro ao enviar convite');
    } finally {
      setSendingInvite(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Ativo', className: 'bg-accent-success text-white' },
      INACTIVE: { label: 'Inativo', className: 'bg-surface-secondary text-foreground-secondary' },
      SUSPENDED: { label: 'Suspenso', className: 'bg-accent-warning text-white' },
      PENDING: { label: 'Pendente', className: 'bg-gold/20 text-gold' },
      ACCEPTED: { label: 'Aceito', className: 'bg-accent-success/20 text-accent-success' },
      DECLINED: { label: 'Recusado', className: 'bg-accent-danger/20 text-accent-danger' },
      EXPIRED: { label: 'Expirado', className: 'bg-surface-secondary text-foreground-muted' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInviteIcon = (status: string) => {
    const iconProps = { size: 16 };
    switch (status) {
      case 'PENDING': return <Clock {...iconProps} className="text-gold" />;
      case 'ACCEPTED': return <CheckCircle {...iconProps} className="text-accent-success" />;
      case 'DECLINED': return <XCircle {...iconProps} className="text-accent-danger" />;
      case 'EXPIRED': return <AlertCircle {...iconProps} className="text-foreground-muted" />;
      default: return <Clock {...iconProps} className="text-gold" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Clientes</h1>
          <p className="text-foreground-secondary">
            Gerencie seus clientes e convites ({clients.length}/10 clientes)
          </p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-gold text-black hover:bg-gold-dark"
        >
          <Plus size={16} className="mr-2" />
          Convidar Cliente
        </Button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send size={20} className="text-gold" />
              Enviar Convite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email do Cliente
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mensagem Personalizada (Opcional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground resize-none"
                rows={3}
                placeholder="Olá! Gostaria de convidá-lo(a) para ser meu cliente..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={sendInvite}
                disabled={!inviteEmail || sendingInvite}
                className="bg-gold text-black hover:bg-gold-dark"
              >
                {sendingInvite ? 'Enviando...' : 'Enviar Convite'}
              </Button>
              <Button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteMessage('');
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Clients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-gold" />
                Clientes Ativos ({clients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-secondary">Nenhum cliente cadastrado</p>
                  <p className="text-foreground-muted text-sm">Envie um convite para começar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.id} className="p-4 rounded-lg bg-surface-hover border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                            <span className="text-gold font-semibold">
                              {client.user.name?.charAt(0) || client.user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {client.user.name || 'Nome não informado'}
                            </p>
                            <p className="text-sm text-foreground-secondary">{client.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(client.status)}
                              <span className="text-xs text-foreground-muted">
                                {client._count.workouts} treinos
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <MessageCircle size={14} className="mr-1" />
                            Chat
                          </Button>
                          <Button size="sm" variant="outline">
                            <Activity size={14} className="mr-1" />
                            Treinos
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreVertical size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Invites */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail size={20} className="text-gold" />
                Convites Pendentes ({invites.filter(i => i.status === 'PENDING').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-6">
                  <Mail size={32} className="text-foreground-muted mx-auto mb-2" />
                  <p className="text-sm text-foreground-secondary">Nenhum convite enviado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.slice(0, 5).map((invite) => (
                    <div key={invite.id} className="p-3 rounded-lg bg-surface border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {invite.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getInviteIcon(invite.status)}
                            {getStatusBadge(invite.status)}
                          </div>
                          <p className="text-xs text-foreground-muted mt-1">
                            Código: {invite.inviteCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}