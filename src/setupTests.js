// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Create mock for Supabase
jest.mock('./utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue({ id: 'mock-subscription-id' }),
    removeSubscription: jest.fn(),
    data: [],
    error: null,
    single: jest.fn().mockReturnThis(),
  },
  setAdminToken: jest.fn(),
  setVisitorToken: jest.fn(),
  clearTokens: jest.fn(),
}));

// Mock window.location methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost',
    pathname: '/',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Create mock for environment variables
process.env = {
  ...process.env,
  REACT_APP_TITLE: 'HYROX Customer Support (Test)',
  REACT_APP_BASE_URL: 'http://localhost:3000',
  REACT_APP_SUPABASE_URL: 'http://localhost:8000',
  REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
}; 