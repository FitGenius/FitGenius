'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se já foi instalado anteriormente
    const installed = localStorage.getItem('fitgenius_pwa_installed');
    if (installed === 'true') {
      setIsInstalled(true);
      return;
    }

    // Escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Mostrar prompt após 30 segundos ou 3 navegações
      const visitCount = parseInt(localStorage.getItem('fitgenius_visit_count') || '0');
      localStorage.setItem('fitgenius_visit_count', (visitCount + 1).toString());

      if (visitCount >= 2) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando app é instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('fitgenius_pwa_installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA instalado');
        setIsInstalled(true);
        localStorage.setItem('fitgenius_pwa_installed', 'true');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Não mostrar novamente por 7 dias
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('fitgenius_install_dismissed', dismissedUntil.toString());
  };

  // Instruções para iOS
  const IOSInstructions = () => (
    <Card className="border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gold" />
          Instalar FitGenius no iPhone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Toque no botão de compartilhar <span className="text-blue-500">⎙</span> no Safari</li>
          <li>2. Role para baixo e toque em "Adicionar à Tela de Início"</li>
          <li>3. Toque em "Adicionar" no canto superior direito</li>
        </ol>
        <Button
          variant="outline"
          onClick={() => setShowPrompt(false)}
          className="w-full"
        >
          Entendi
        </Button>
      </CardContent>
    </Card>
  );

  // Prompt para Android/Desktop
  const InstallCard = () => (
    <Card className="border-gold/20 bg-background/95 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-gold" />
              Instalar FitGenius
            </CardTitle>
            <CardDescription className="mt-2">
              Instale o app para acesso rápido e recursos offline
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Acesso offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Notificações</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Tela cheia</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Atalho direto</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-gold hover:bg-gold/90 text-background"
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar Agora
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1"
          >
            Mais Tarde
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Badge de instalação bem-sucedida
  const InstalledBadge = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="border-green-500/50 bg-green-500/10">
        <CardContent className="pt-6 px-6 pb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">FitGenius instalado com sucesso!</span>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isInstalled) {
    return (
      <AnimatePresence>
        {isInstalled && (
          <InstalledBadge />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          {isIOS ? <IOSInstructions /> : <InstallCard />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente de botão para instalar manualmente
export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA instalado via botão');
        setCanInstall(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar:', error);
    }
  };

  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      className="border-gold text-gold hover:bg-gold hover:text-background"
    >
      <Download className="w-4 h-4 mr-2" />
      Instalar App
    </Button>
  );
}