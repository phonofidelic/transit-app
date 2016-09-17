var staticCacheName = 'transit-static-v4';

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
});//

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
	// if (event.request.url.indexOf('.zip') != -1) {
	// 	console.log('zip request detected...')

	// 	var requestUrl = new URL(event.request.url);

	// 	event.respondWith(
	// 		caches.match(event.request).then(function(response) {
	// 			if (response) {
	// 				console.log('Found response in cache: ', response);
	// 				return response;
	// 			}
	// 			console.log('No response found in cache. About to fetch from network...');
	// 			var init = { 
	// 				headers: {
	// 					'Content-Type': 
	// 				}, 
	// 				mode: 'coors'}
	// 			return fetch(requestUrl, init).then(function(response) {
	// 				console.log('Response from network: ', response);
	// 				return response;
	// 			}).catch(function(err) {
	// 				console.error('Fetch from network failed: ', err);
	// 				throw err;
	// 			});
	// 		})
	// 	);
	// }

	if (event.request.url.indexOf('https://maps.googleapis.com') == -1 && event.request.url != 'http://www.broward.org/bct/google/latest/google_transit.zip') {
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
});

self.addEventListener('message', function(event) {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});

