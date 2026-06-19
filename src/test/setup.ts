import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Розмонтовуємо дерево після кожного тесту, щоб тести не впливали один на одного.
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// ── Поліфіли середовища jsdom, яких потребує Ant Design та код застосунку ──

// matchMedia — використовується responsive-хуками antd.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ResizeObserver — потрібен компонентам antd (Image, Input тощо).
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// scrollIntoView — викликається у MessageList для автоскролу.
Element.prototype.scrollIntoView = vi.fn();

// objectURL API — у jsdom відсутній; використовується для прев'ю файлів.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
