var staticCacheName = 'transit-static-v1';

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			return cache.addAll([
				'css/main.css'
			]);
		})
	);
});

self.addEventListener('fetch', function(event) {
	// var requestUrl = new URL(event.request.url);
	console.log('event: ', event);

	event.respondWith(
		new Response('Hello World')
	);
})

// console.log('hello world');