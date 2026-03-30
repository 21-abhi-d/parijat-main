import "@testing-library/jest-dom";
import { vi } from "vitest";

// Silence env validation in tests
process.env.SKIP_ENV_VALIDATION = "1";

// Mock Next.js server-side APIs used in server components
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
  cookies: vi.fn(() => ({ get: vi.fn() })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
