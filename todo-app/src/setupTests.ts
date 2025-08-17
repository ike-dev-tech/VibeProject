import '@testing-library/jest-dom';

// Mock crypto.randomUUID for Node.js environment
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});