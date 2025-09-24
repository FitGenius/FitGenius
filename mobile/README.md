# FitGenius Mobile App

Aplicativo móvel nativo desenvolvido em React Native para a plataforma FitGenius - seu personal trainer inteligente com tecnologia avançada de IA.

## 🚀 Funcionalidades Principais

### 📊 Dashboard Inteligente
- Visão geral de métricas de saúde e fitness em tempo real
- Integração com dados de wearables (Apple Health, Google Fit)
- Estatísticas de passos, calorias queimadas e atividades
- Sequência de treinos e metas personalizadas
- Notificações contextuais baseadas em progresso

### 🏋️‍♂️ Sistema de Treinos Avançado
- Biblioteca completa de exercícios categorizados
- Sessões de treino com cronômetro e tracking em tempo real
- Sistema de descanso inteligente com vibração
- Registro detalhado de séries, repetições e pesos
- Sincronização automática com wearables
- Histórico completo de performance

### 🤖 AI Assistant Integrado
- Chat inteligente com processamento de linguagem natural
- Recomendações personalizadas de treinos
- Análise de progresso com insights baseados em IA
- Suporte de áudio com text-to-speech
- Dicas de nutrição contextualizadas
- Motivação personalizada baseada em padrões de uso

### 🥗 Nutrição Inteligente
- Tracking completo de macronutrientes
- Contador de calorias com visualizações interativas
- Registro de refeições com histórico
- Metas nutricionais personalizadas
- Hidratação com lembretes inteligentes
- Integração com dados de exercícios para cálculo de necessidades

### 📈 Análise de Progresso
- Gráficos interativos de evolução (peso, gordura corporal, massa muscular)
- Sistema de conquistas e marcos
- Metas inteligentes com tracking automático
- Análise de tendências e padrões
- Relatórios semanais e mensais
- Comparações temporais detalhadas

### 📍 Gym Finder com Geolocalização
- Localização automática de academias próximas
- Mapas interativos com informações detalhadas
- Sistema de avaliações e comentários
- Filtros por distância, preço e comodidades
- Integração com rotas e navegação
- Informações de funcionamento em tempo real

### 🔄 Funcionalidades Offline
- Sincronização inteligente em background
- Cache otimizado para uso sem internet
- Queue de ações para sincronização posterior
- Backup automático de dados críticos
- Recuperação de dados após reconexão

### 📱 Experiência Mobile Nativa
- Interface otimizada para iOS e Android
- Notificações push contextuais
- Integração profunda com sensores do dispositivo
- Suporte a modo escuro automático
- Gestos nativos e animações fluidas
- Performance otimizada para diferentes dispositivos

## 🛠️ Tecnologias Utilizadas

### Frontend Mobile
- **React Native** 0.72.6 - Framework principal
- **Expo** ~49.0.15 - Plataforma de desenvolvimento
- **TypeScript** 5.1.3 - Tipagem estática
- **React Navigation** 6.x - Navegação nativa
- **React Native Reanimated** - Animações performáticas
- **Expo Vector Icons** - Biblioteca de ícones

### Integração com Saúde
- **Expo Sensors** - Acesso a pedômetro e sensores
- **React Native Health** - Integração com Apple Health
- **Google Fit API** - Integração com Google Fit
- **Expo Location** - Serviços de geolocalização
- **React Native Maps** - Mapas interativos

### Armazenamento e Sync
- **AsyncStorage** - Armazenamento local
- **NetInfo** - Status de conectividade
- **Background Fetch** - Sincronização em background
- **Task Manager** - Tarefas em segundo plano

### UI/UX Avançada
- **React Native SVG** - Gráficos vetoriais
- **React Native SVG Charts** - Gráficos interativos
- **Expo Linear Gradient** - Gradientes nativos
- **React Native Gesture Handler** - Gestos avançados

### Notificações e Audio
- **Expo Notifications** - Sistema de notificações
- **Expo Speech** - Text-to-speech
- **Expo AV** - Reprodução de mídia

## 🏗️ Arquitetura do Projeto

```
mobile/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   ├── contexts/            # Context providers (Auth, Theme, Health, etc.)
│   ├── navigation/          # Configuração de navegação
│   ├── screens/            # Telas da aplicação
│   │   ├── DashboardScreen.tsx
│   │   ├── WorkoutsScreen.tsx
│   │   ├── WorkoutSessionScreen.tsx
│   │   ├── AIAssistantScreen.tsx
│   │   ├── NutritionScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── GymFinderScreen.tsx
│   │   └── ...
│   ├── services/           # Serviços e integrações
│   │   ├── HealthService.ts
│   │   ├── WearableService.ts
│   │   ├── NotificationService.ts
│   │   └── OfflineService.ts
│   └── store/              # Estado global (Redux Toolkit)
├── assets/                 # Recursos estáticos
├── App.tsx                # Componente raiz
└── package.json
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 16+
- Expo CLI
- iOS Simulator (para iOS) ou Android Studio (para Android)
- Dispositivos físicos para teste de sensores

### Instalação
```bash
cd mobile/
npm install
```

### Executar em Desenvolvimento
```bash
# iOS
npm run ios

# Android
npm run android

# Web (para desenvolvimento)
npm run web

# Expo Development Build
npm start
```

### Build de Produção
```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

## 🔐 Configuração de Permissões

### iOS (Info.plist)
```xml
<key>NSHealthShareUsageDescription</key>
<string>Este app precisa acessar dados de saúde para tracking de fitness</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Este app precisa salvar dados de treino no Apple Health</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Localização usada para encontrar academias próximas</string>
<key>NSMotionUsageDescription</key>
<string>Dados de movimento para contagem de passos</string>
```

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
```

## 🔗 Integração com Backend

A aplicação se conecta com a API REST do FitGenius:
- **Base URL**: `https://api.fitgenius.com`
- **Autenticação**: JWT Bearer Token
- **Endpoints**: Workout tracking, nutrition, progress, AI recommendations

### Principais Endpoints Utilizados:
- `GET /api/user/profile` - Perfil do usuário
- `POST /api/workouts` - Criar sessão de treino
- `GET /api/nutrition/today` - Dados nutricionais
- `POST /api/ai/chat` - Chat com AI Assistant
- `GET /api/gyms/nearby` - Academias próximas

## 📱 Funcionalidades por Plataforma

### iOS
- ✅ Integração com Apple Health
- ✅ Notificações ricas com ações
- ✅ Siri Shortcuts (planejado)
- ✅ Apple Watch companion (planejado)

### Android
- ✅ Integração com Google Fit
- ✅ Widget de tela inicial
- ✅ Tasker integration (planejado)
- ✅ Wear OS companion (planejado)

## 🧪 Testes e Qualidade

### Estrutura de Testes
```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

### Métricas de Performance
- Bundle size otimizado
- Startup time < 3s
- 60 FPS em animações
- Baixo consumo de bateria

## 🚀 Features Futuras (Roadmap)

### Próximas Versões
- [ ] Integração com mais wearables (Fitbit, Garmin)
- [ ] Social features e challenges
- [ ] Coaching de voz durante treinos
- [ ] Análise de forma com AI (câmera)
- [ ] Integração com equipamentos de academia
- [ ] Modo offline completo
- [ ] Apple Watch / Wear OS apps
- [ ] Gamificação avançada

### Integrações Planejadas
- [ ] Spotify/Apple Music para playlists de treino
- [ ] MyFitnessPal para dados nutricionais
- [ ] Strava para atividades outdoor
- [ ] Whoop/Oura para recovery metrics

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](../LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: support@fitgenius.com
- 💬 Discord: [FitGenius Community](https://discord.gg/fitgenius)
- 📚 Documentação: [docs.fitgenius.com](https://docs.fitgenius.com)

---

**FitGenius Mobile** - Transformando fitness através de tecnologia inteligente 🏋️‍♂️✨