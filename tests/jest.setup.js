import '@testing-library/jest-dom';

// Mock des variables d'environnement
process.env.NEXT_PUBLIC_NETWORK_URL = 'https://rpc.gnosischain.com';
process.env.NEXT_PUBLIC_CHAIN_ID = '100';

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de window.ethereum
const ethereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  autoRefreshOnNetworkChange: true,
};

Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: ethereum,
}); 