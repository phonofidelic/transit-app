var staticCacheName = 'transit-static-v1';

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			return cache.addAll([
				// '/skeleton',
				'css/main.min.css',
				'app/app.min.js',
				'app/modules/planTrip/planTrip.html'
			]);
		})
	);
});

self.addEventListener('fetch', function(event) {
	console.log('fetch event for: ', event.request.url)
	var requestUrl = new URL(event.request.url);

	// if (requestUrl.origin === location.origin) {
	// 	if (requestUrl.pathname === '/') {
	// 		event.respondWith(caches.match('/skeleton'));
	// 		return;
	// 	}
	// }

	event.respondWith(
		caches.match(event.request).then(function(response) {
			if (response) {
				console.log('Found response in cache: ', response);
				return response;
			}
			console.log('No response found in cache. About to fetch from network...');
			return fetch(requestUrl).then(function(response) {
				console.log('Response from network: ', response);
				return response;
			}).catch(function(err) {
				console.error('Fetch from network failed: ', err);
				throw err;
			});
		})
	);
});

// console.log('hello world'); 