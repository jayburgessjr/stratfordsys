// Stratford AI Service Worker
// Advanced offline functionality for financial data application

const CACHE_NAME = 'stratford-ai-v1.0.1'
const DATA_CACHE_NAME = 'stratford-ai-data-v1.0.1'

// Critical resources for offline functionality
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Static assets will be added by Next.js build process
]

// API endpoints to cache for offline access
const DATA_URLS = [
  '/api/market-data/',
  '/api/portfolios/',
  '/api/news/',
  '/api/system/health',
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('[SW] Install event')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching static resources')
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event')

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Remove old caches
            return cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (isDataRequest(request.url)) {
    event.respondWith(handleDataRequest(request))
  } else if (isStaticAsset(request.url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request))
  } else {
    event.respondWith(handleOtherRequests(request))
  }
})

// Data request handler - Cache First with Network Fallback
async function handleDataRequest(request) {
  const cacheName = DATA_CACHE_NAME

  try {
    // Check cache first for financial data
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      // Check if cached data is still fresh (based on cache headers)
      const cacheDate = cachedResponse.headers.get('date')
      const cacheAge = Date.now() - new Date(cacheDate).getTime()
      const maxAge = getMaxAgeForEndpoint(request.url)

      if (cacheAge < maxAge) {
        console.log('[SW] Serving fresh cached data:', request.url)

        // Start background fetch to update cache
        updateCacheInBackground(request, cacheName)

        return cachedResponse
      }
    }

    // Fetch from network
    console.log('[SW] Fetching from network:', request.url)
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)

      // Clone response for caching
      const responseClone = networkResponse.clone()

      // Add cache headers for freshness tracking
      const responseWithHeaders = new Response(await responseClone.blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'date': new Date().toISOString(),
          'sw-cached': 'true'
        }
      })

      cache.put(request, responseWithHeaders)
    }

    return networkResponse

  } catch (error) {
    console.log('[SW] Network failed, serving cached data:', request.url)

    // Network failed, try to serve stale cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for critical data
    return createOfflineResponse(request)
  }
}

// Static asset handler - Cache First
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', request.url)
    throw error
  }
}

// Navigation handler - Network First with Cache Fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    // Network failed, serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Serve offline page for navigation requests
    return caches.match('/offline.html')
  }
}

// Default handler for other requests
async function handleOtherRequests(request) {
  try {
    return await fetch(request)
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || createOfflineResponse(request)
  }
}

// Background cache update
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request.clone())

    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)

      const responseWithHeaders = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'date': new Date().toISOString(),
          'sw-cached': 'true'
        }
      })

      cache.put(request, responseWithHeaders)
      console.log('[SW] Background cache update completed:', request.url)
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error)
  }
}

// Utility functions
function isDataRequest(url) {
  return DATA_URLS.some(dataUrl => url.includes(dataUrl))
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(url)
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function getMaxAgeForEndpoint(url) {
  // Different cache durations for different endpoints
  if (url.includes('/api/market-data/')) {
    return 30 * 1000 // 30 seconds for market data
  } else if (url.includes('/api/portfolios/')) {
    return 5 * 60 * 1000 // 5 minutes for portfolio data
  } else if (url.includes('/api/news/')) {
    return 10 * 60 * 1000 // 10 minutes for news
  } else {
    return 60 * 1000 // 1 minute default
  }
}

function createOfflineResponse(request) {
  if (request.url.includes('/api/')) {
    // Return offline API response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  }

  // Return generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  })
}

// Message handling for cache management
self.addEventListener('message', event => {
  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CLEAR_CACHE':
      clearCache(payload.cacheName)
        .then(() => {
          event.ports[0].postMessage({ success: true })
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
      break

    case 'CACHE_URL':
      cacheUrl(payload.url)
        .then(() => {
          event.ports[0].postMessage({ success: true })
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
      break

    case 'GET_CACHE_SIZE':
      getCacheSize()
        .then(size => {
          event.ports[0].postMessage({ success: true, size })
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
      break
  }
})

// Cache management functions
async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName)
  } else {
    const cacheNames = await caches.keys()
    return Promise.all(cacheNames.map(name => caches.delete(name)))
  }
}

async function cacheUrl(url) {
  const cache = await caches.open(DATA_CACHE_NAME)
  const response = await fetch(url)
  return cache.put(url, response)
}

async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()

    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }

  return totalSize
}

// Periodic cache cleanup
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(performCacheCleanup())
  }
})

async function performCacheCleanup() {
  console.log('[SW] Performing periodic cache cleanup')

  const cache = await caches.open(DATA_CACHE_NAME)
  const requests = await cache.keys()
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const request of requests) {
    const response = await cache.match(request)
    if (response) {
      const cacheDate = response.headers.get('date')
      if (cacheDate) {
        const age = now - new Date(cacheDate).getTime()
        if (age > maxAge) {
          await cache.delete(request)
          console.log('[SW] Cleaned up old cache entry:', request.url)
        }
      }
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-trades') {
    event.waitUntil(syncPendingTrades())
  } else if (event.tag === 'background-sync-portfolio') {
    event.waitUntil(syncPortfolioUpdates())
  }
})

async function syncPendingTrades() {
  // Implement offline trade sync logic
  console.log('[SW] Syncing pending trades')
}

async function syncPortfolioUpdates() {
  // Implement offline portfolio update sync
  console.log('[SW] Syncing portfolio updates')
}

console.log('[SW] Stratford AI Service Worker loaded')