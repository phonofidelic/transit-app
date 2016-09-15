var staticCacheName = 'transit-static-v3';

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			return cache.addAll([
				'index.html',
				'css/main.min.css',
				'app/app.min.js',
				'lib/deps.min.js',
				'css/deps.min.css',
				'app/templates/planTrip.html'
			]);
		})
	);
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return cacheName.startsWith('transit-') &&
						   cacheName != staticCacheName;
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', function(event) {
	if (event.request.url.indexOf('https://maps.googleapis.com') == -1) {
		console.log('fetch event for: ', event.request.url)
		var requestUrl = new URL(event.request.url);
		console.log('requestUrl: ', requestUrl);

		event.respondWith(
			caches.match(event.request).then(function(response) {
				if (response) {
					console.log('Found response in cache: ', response);
					return response;
				}
				console.log('No response found in cache. About to fetch from network...');
				return fetch(requestUrl, {mode: 'coors'}).then(function(response) {
					console.log('Response from network: ', response);
					return response;
				}).catch(function(err) {
					console.error('Fetch from network failed: ', err);
					throw err; 
				});
			})
		);
	}

	// if (event.request.url.indexOf('https://maps.googleapis.com'))
});

self.addEventListener('message', function(event) {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});//