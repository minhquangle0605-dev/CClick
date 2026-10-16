import vi from '@locales/vi.json';

export function text(key: string): string {
  return (vi as Record<string, string>)[key] ?? key;
}
