'use strict'

import cities from 'all-the-cities'
import KDBush from 'kdbush'
import * as geokdbush from '../index.js'

console.log('=== geokdbush benchmark ===')

const n = cities.length
const k = 1000

const randomPoints = []
for (let i = 0; i < k; i++)
	randomPoints.push({
		lon: -180 + 360 * Math.random(),
		lat: -60 + 140 * Math.random(),
	})

console.time(`index ${n} points`)

const index = new KDBush(cities.length)
for (const city of cities) {
	index.add(city.loc.coordinates[0], city.loc.coordinates[1])
}
index.finish()

console.timeEnd(`index ${n} points`)

console.time('query 1000 closest')
geokdbush.around(index, -119.7051, 34.4363, 1000)
console.timeEnd('query 1000 closest')

console.time('query 50000 closest')
geokdbush.around(index, -119.7051, 34.4363, 50000)
console.timeEnd('query 50000 closest')

console.time(`query all ${n}`)
geokdbush.around(index, -119.7051, 34.4363)
console.timeEnd(`query all ${n}`)

console.time(`${k} random queries of 1 closest`)
for (let i = 0; i < k; i++) geokdbush.around(index, randomPoints[i].lon, randomPoints[i].lat, 1)
console.timeEnd(`${k} random queries of 1 closest`)
