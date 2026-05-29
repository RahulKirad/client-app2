/** True when the site is served on the German marketing domain (e.g. cottonunique.de). */
export function isGermanHostname(hostname?: string): boolean {
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : ''))
    .replace(/^www\./i, '')
    .toLowerCase();
  return host === 'cottonunique.de' || host.endsWith('.de');
}
