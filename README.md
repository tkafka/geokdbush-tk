## geokdbush [![Build Status](https://travis-ci.org/mourner/geokdbush.svg?branch=master)](https://travis-ci.org/mourner/geokdbush)

A geographic extension for [kdbush](https://github.com/mourner/kdbush),
the fastest static spatial index for points in JavaScript.

It implements fast [nearest neighbors](https://en.wikipedia.org/wiki/Nearest_neighbor_search) queries
for locations on Earth, taking Earth curvature and date line wrapping into account.
Inspired by [sphere-knn](https://github.com/darkskyapp/sphere-knn), but uses a different algorithm.

This works with `kdbush 4.x`, which doesn't store the whole objects, but only ids, so you have to keep the id-to-object lookup by yourself, and the `.around` method returns just ids.

### Example

```js
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

// create a point array
const points = [
	{ lat: 12.345, lon: 123.456 } // , ...
]

// create kdbush index of given length
let index = new KDBush(points.length)

// add locations
for (const point of points) {
	index.add(point.lon, point.lat)
}

// perform the indexing
index.finish()

// look up ids ...
const nearestIds = geokdbush.around(index, -119.7051, 34.4363, 1000)

// ... and optionally convert to points
const nearestPoints = nearestIds.map((id) => points[id])
```

### API

#### geokdbush.around(index, longitude, latitude[, maxResults, maxDistance, filterFn])

Returns an array of the closest ids (indices) of points from a given location in order of increasing distance.

- `index`: [kdbush](https://github.com/mourner/kdbush) index.
- `longitude`: query point longitude.
- `latitude`: query point latitude.
- `maxResults`: (optional) maximum number of points to return (`Infinity` by default).
- `maxDistance`: (optional) maximum distance in kilometers to search within (`Infinity` by default).
- `filterFn`: (optional) a function to filter the results (ids) with.

#### geokdbush.distance(longitude1, latitude1, longitude2, latitude2)

Returns great circle distance between two locations in kilometers.

### Performance

This library is incredibly fast.
The results below were obtained with `npm run bench`
(Node v7.7.2, Macbook Pro 15 mid-2012).

benchmark | geokdbush | sphere-knn | naive
--- | ---: | ---: | ---:
index 138398 points | 69ms | 967ms | n/a
query 1000 closest | 4ms | 4ms | 155ms
query 50000 closest | 31ms | 368ms | 155ms
query all 138398 | 80ms | 29.7s | 155ms
1000 queries of 1 | 55ms | 165ms | 18.4s
