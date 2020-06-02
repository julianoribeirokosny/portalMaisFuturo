'use strict';

// Load generated static asset caching.
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

// Register routes for user uploaded images.
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|mp4)$/,
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
);

// Routes for all dynamic HTML pages.
workbox.routing.registerRoute(
  // Cache HTML files
  /[^\.]*/, 
  // Use cache but update in the background ASAP
  workbox.strategies.staleWhileRevalidate({
    // Use a custom cache name
    cacheName: 'html-cache',
    plugins: [
      new workbox.broadcastUpdate.Plugin('portalUpdateIndex', {headersToCheck: ['content-length', 'etag', 'last-modified']})
    ]    
  })
);

// Special routes to enable offline for Google Analytics.
workbox.googleAnalytics.initialize();
