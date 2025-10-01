import '@testing-library/jest-dom';

// Mock fetch globally for tests
global.fetch = vi.fn();

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 11),
  },
});