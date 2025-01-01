# 🔄 LevinSwap Interface v2

Interface utilisateur décentralisée pour l'échange de tokens sur la blockchain Gnosis Chain, basée sur le protocole Uniswap v2.

## 🌟 Fonctionnalités

- 💱 Échange de tokens (Swap)
- 💧 Gestion des pools de liquidité
- 🔒 Intégration Web3 sécurisée
- 🌐 Support multilingue
- 📱 Interface responsive et moderne
- ⚡ Performances optimisées

## 🛠 Technologies

- **Framework**: Next.js
- **Langage**: TypeScript
- **UI**: Mantine UI
- **Web3**:
  - Ethers.js
  - Web3Modal
  - @realtoken/realt-commons (Provider Web3)
- **État**:
  - Jotai
  - Zustand
- **Tests**:
  - Jest + React Testing Library
  - Hardhat
  - Cypress
- **Gestion des packages**: pnpm

## 📋 Prérequis

- Node.js (via nvm pour la gestion des versions)
- pnpm
- Un wallet compatible Web3 (MetaMask, WalletConnect, etc.)
- Accès à la Gnosis Chain

## 🚀 Installation

1. Cloner le repository

```bash
git clone https://github.com/RealToken-Community/levinswap-interface.git
cd levinswap-interface
```

2. Installer les dépendances

```bash
pnpm install
```

3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir les variables nécessaires dans `.env.local`

4. Lancer le projet en développement

```bash
pnpm dev
```

## 🧪 Tests

Le projet utilise plusieurs niveaux de tests :

### Tests Unitaires et d'Intégration

```bash
# Lancer tous les tests
pnpm test

# Mode watch
pnpm test:watch

# Couverture de code
pnpm test:coverage
```

### Tests Web3

```bash
# Tests blockchain
pnpm test:web3
```

### Tests E2E

```bash
# Lancer les tests E2E
pnpm test:e2e

# Ouvrir Cypress
pnpm test:e2e:open
```

### Structure des Tests

```
tests/
├── unit/               # Tests unitaires
│   ├── utils/         # Tests des utilitaires
│   ├── hooks/         # Tests des hooks React
│   └── components/    # Tests des composants
├── integration/        # Tests d'intégration
│   ├── pages/         # Tests des pages
│   ├── features/      # Tests des fonctionnalités
│   └── flows/         # Tests des flux utilisateur
├── web3/              # Tests blockchain
│   ├── contracts/     # Tests des contrats
│   ├── transactions/ # Tests des transactions
│   └── providers/    # Tests des providers Web3
└── e2e/               # Tests end-to-end
    └── specs/         # Spécifications Cypress
```

## 🗺 Roadmap

### Interface

#### Phase 1 : Internationalisation et UI

- [ ] Configuration du système de traduction (i18n)
- [ ] Ajout des traductions FR/EN
- [ ] Mise à jour des logos et de l'identité visuelle
- [ ] Mise à jour des liens et références

#### Phase 2 : Amélioration Technique

- [ ] Amélioration de la gestion des erreurs
- [ ] Optimisation des performances
- [ ] Mise à jour des dépendances
- [ ] Documentation technique

### Testing

#### Phase 1 : Tests Unitaires

- [ ] Mise en place des tests pour les utilitaires
- [ ] Tests des hooks personnalisés
- [ ] Tests des composants React

#### Phase 2 : Tests d'Intégration

- [ ] Tests des pages principales
- [ ] Tests des fonctionnalités critiques
- [ ] Tests des flux utilisateur

#### Phase 3 : Tests Web3

- [ ] Tests des interactions avec les contrats
- [ ] Tests des transactions
- [ ] Tests des providers Web3

#### Phase 4 : Tests E2E

- [ ] Tests des parcours utilisateur complets
- [ ] Tests de performance
- [ ] Tests d'accessibilité

#### Phase 5 : Optimisation et Documentation

- [ ] Amélioration de la couverture de code
- [ ] Optimisation des tests
- [ ] Documentation complète des tests
- [ ] Guide utilisateur
- [ ] Documentation de déploiement

## 🏗 Structure du Projet

```
src/
├── abis/          # Définitions des contrats
├── app/           # Pages et routes Next.js
├── components/    # Composants React réutilisables
├── config/        # Configuration de l'application
├── constants/     # Constantes globales
├── hooks/         # Hooks React personnalisés
├── i18n/          # Internationalisation
├── providers/     # Providers React Context
├── services/      # Services externes
├── state/         # Gestion d'état global
├── store/         # Configuration du store
├── styles/        # Styles globaux
├── types/         # Types TypeScript
└── utils/         # Utilitaires
```

## 🔧 Contribution

Les contributions sont les bienvenues ! Veuillez consulter notre [guide de contribution](./CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence [MIT](./LICENSE).

## 🔗 Liens utiles

- [Site Web communautaire](https://www.realtoken.community/)
- [GitHub](https://github.com/RealToken-Community)
