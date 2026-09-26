export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function haceDiasISO(dias: number): string {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}
