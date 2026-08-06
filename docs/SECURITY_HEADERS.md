# Worker response security

The Cloudflare Worker adds release-safe headers to HTML responses:

- `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

The helper preserves response status, body, redirects, cache headers, and
content type. Image responses keep their established behavior. Google Analytics
loads from www.googletagmanager.com only after explicit consent and sends to
Google Analytics collection endpoints; the current CSP does not define
script-src or connect-src. Any additional third-party asset, API or embedding
requirement must be reviewed against the content-security and privacy boundaries
before its origin is allowed.

Validate the policy with `tests/release/security-headers.test.ts` and confirm
the deployed response headers during the post-publish smoke check.
