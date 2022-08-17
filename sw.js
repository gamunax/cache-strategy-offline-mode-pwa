const CACHE_NAME = 'cache-1';

const CACHE_STATIC_NAME = 'static-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';

const CACHE_DYNAMIC_LIMIT = 50;

function cacheClear(cacheName, numeroItems) {
    caches.open(cacheName)
        .then(cache => {
            return cache.keys().then(keys => {
                if (keys.length > numeroItems) {
                    cache.delete(keys[0]).then(
                        cacheClear(cacheName, numeroItems)
                    );
                }
            });
        });
}

self.addEventListener('install', e => {
    const cachePromise = caches.open(CACHE_STATIC_NAME).then(cache => {
        return cache.addAll([
            '/',
            '/index.html',
            '/css/style.css',
            '/img/main.jpg',
            '/img/no-img.jpg',
            '/js/app.js'
        ]);

    });

    const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME).then(cache => {
        return cache.addAll([
            'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
        ]);

    });

    e.waitUntil(Promise.all([cachePromise, cacheInmutable]));
});

self.addEventListener('fetch', e => {
    // * 1. cache only 
    // e.respondWith(caches.match(e.request));

    // * 2. Cache with network fallback
    // const response = caches.match(e.request).then(res => {
    //     if (res) return res;

    //     // not exists in cache, I have go to network
    //     return fetch(e.request).then(newResp => {
    //         caches.open(CACHE_DYNAMIC_NAME).then(cache => {
    //             cache.put(e.request, newResp);
    //             cacheClear(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
    //         });
    //         return newResp.clone();
    //     });
    // });

    // * 3. Network with cache fallback 
    // const response = fetch(e.request).then(res => {
    //     if (!res) return caches.match(e.request);

    //     console.log('res', res);
    //     caches.open(CACHE_DYNAMIC_NAME).then(cache => {
    //         cache.put(e.request, res);
    //         cacheClear(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
    //     });
    //     return res.clone();
    // }).catch(err => {
    //     return caches.match(e.request);
    // });

    // * 4. Cache with network update
    // rendimiento critico
    // Siempre estára un paso atrás

    // if (e.request.url.includes('bootstrap')) {
    //     return e.respondWith(caches.match(e.request));
    // }
    // const response = caches.open(CACHE_STATIC_NAME).then(cache => {
    //     return fetch(e.request).then(newRes => {
    //         cache.put(e.request, newRes);
    //         return cache.match(e.request);
    //     });
    // });

    // * 5. Cache & Network Race

    const response = new Promise((resolve, reject) => {
        let isRejected = false;
        const OnceFailed = () => {
            if (isRejected) {
                if (/\.(png|jpg)$/i.test(e.request.url)) {
                    resolve(caches.match('/img/no-img.jpg'));
                } else {
                    reject('not found answer');
                }
            } else {
                isRejected = true;
            }
        }

        fetch(e.request).then(res => {
            if(res.ok) {
                resolve(res);
            } else {
                OnceFailed();
            }
        }).catch(OnceFailed);

        caches.match(e.request).then(res => {
            if (res) {
                resolve(res);
            } else {
                OnceFailed();
            }
        }).catch(OnceFailed);
    });

    e.respondWith(response);
});