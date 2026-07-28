import { describe, expect, it } from 'vitest';
import {
  APPLICATION_HTML_SECURITY_HEADERS,
  withApplicationSecurityHeaders,
} from '@/worker/securityHeaders';

describe('Worker application security headers', () => {
  it.each([
    ['normal HTML', 200],
    ['HTML error', 500],
  ])('adds the safe policy to %s responses', (_label, status) => {
    const source = new Response('<!doctype html><h1>Study Hub</h1>', {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-existing': 'preserved',
      },
    });
    const secured = withApplicationSecurityHeaders(source);
    expect(secured.status).toBe(status);
    expect(secured.headers.get('x-existing')).toBe('preserved');
    for (const [name, value] of Object.entries(APPLICATION_HTML_SECURITY_HEADERS)) {
      expect(secured.headers.get(name)).toBe(value);
    }
  });

  it('leaves the image optimization response body and headers untouched', async () => {
    const source = new Response(new Uint8Array([1, 2, 3]), {
      headers: {
        'content-type': 'image/webp',
        etag: '"image"',
      },
    });
    const secured = withApplicationSecurityHeaders(source);
    expect(secured).toBe(source);
    expect(secured.headers.get('x-frame-options')).toBeNull();
    expect([...new Uint8Array(await secured.arrayBuffer())]).toEqual([1, 2, 3]);
  });

  it('does not rewrite redirects without HTML content', () => {
    const redirect = new Response(null, {
      status: 302,
      headers: { location: '/practice' },
    });
    expect(withApplicationSecurityHeaders(redirect)).toBe(redirect);
  });
});
