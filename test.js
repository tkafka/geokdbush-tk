'use strict'

import { test } from 'tape'
import cities from 'all-the-cities'
import KDBush from 'kdbush'
import * as geokdbush from './index.js'

// create
const index = new KDBush(cities.length)

// add
for (const city of cities) {
	index.add(city.loc.coordinates[0], city.loc.coordinates[1])
}

// perform the indexing
index.finish()

test('performs search according to maxResults', function (t) {
	const pointIds = geokdbush.around(index, -119.7051, 34.4363, 5)

	t.same(pointIds.map((id) => cities[id].name).join(', '), 'Mission Canyon, Santa Barbara, Montecito, Summerland, Goleta')

	t.end()
})

test('performs search within maxDistance', function (t) {
	const pointIds = geokdbush.around(index, 30.5, 50.5, Infinity, 20)

	t.same(
		pointIds.map((id) => cities[id].name).join(', '),
		'Kyiv, Vyshhorod, Pohreby, Kotsyubyns’ke, Horenka, Sofiyivska Borschagivka, Novi Petrivtsi, Vyshneve, Kriukivschina, Irpin, Hostomel, Chabany, Khotiv, Pukhivka',
	)

	t.end()
})

test('performs search using filter function', function (t) {
	const pointIds = geokdbush.around(index, 30.5, 50.5, 10, Infinity, (id) => cities[id].population > 1000000)

	t.same(pointIds.map((id) => cities[id].name).join(', '), 'Kyiv, Dnipro, Kharkiv, Minsk, Odessa, Donetsk, Warsaw, Bucharest, Moscow, Rostov-na-Donu')

	t.end()
})

const minPop = 0
test(`performs exhaustive search in correct order for cities with population above ${minPop}`, function (t) {
	/// if we consider all cities, we run out of RAM
	const pointIds = geokdbush.around(index, 30.5, 50.5, Infinity, Infinity, (id) => cities[id].population >= minPop)

	const origin = { lon: 30.5, lat: 50.5 }
	const sorted = cities
		.filter((city) => city.population >= minPop)
		.map((city) => ({ name: city.name, dist: geokdbush.distance(origin.lon, origin.lat, city.loc.coordinates[0], city.loc.coordinates[1]) }))
		.sort((a, b) => a.dist - b.dist)

	for (var i = 0; i < sorted.length; i++) {
		let pointCity = cities[pointIds[i]]
		const dist = geokdbush.distance(pointCity.loc.coordinates[0], pointCity.loc.coordinates[1], origin.lon, origin.lat)
		if (dist !== sorted[i].dist) {
			t.fail(`${pointCity.name} vs ${sorted[i].name}`)
			break
		}
	}
	t.pass('all points in correct order')

	t.end()
})

test('calculates great circle distance', function (t) {
	t.equal(10131.7396, Math.round(1e4 * geokdbush.distance(30.5, 50.5, -119.7, 34.4)) / 1e4)
	t.end()
})
