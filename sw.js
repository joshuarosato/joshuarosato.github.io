// sw.js - Instant failover Service Worker
const MAIN_DOMAIN = 'example.com';
const PING_ENDPOINT = `https://${MAIN_DOMAIN}/robots.txt`;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Only intercept HTML document requests
  if (event.request.destination !== 'document') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip if already on main domain
  if (url.hostname === MAIN_DOMAIN) {
    return;
  }

  event.respondWith((async () => {
    try {
      const ping = await fetch(PING_ENDPOINT, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(1500)
      });
      
      if (ping.ok) {
        // Main site UP → Instant redirect
        const mainUrl = `https://${MAIN_DOMAIN}${url.pathname}${url.search}`;
        return Response.redirect(mainUrl, 302);
      }
    } catch (e) {
      console.log('Main site down, serving mirror');
    }
    
    // Serve mirror content
    return fetch(event.request);
  })());
});
