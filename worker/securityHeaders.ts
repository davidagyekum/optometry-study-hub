export const APPLICATION_HTML_SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  return contentType.includes('text/html');
}

export function withApplicationSecurityHeaders(response: Response): Response {
  if (!isHtmlResponse(response)) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(APPLICATION_HTML_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
