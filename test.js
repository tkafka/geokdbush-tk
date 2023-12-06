'use strict'

import { test } from 'tape'
import haversine from 'haversine-distance'
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

test('search works across the 180 deg boundary', function (t) {
	function placeDistanceM(origin, place) {
		let distanceMeters = haversine({ lat: origin[0], lon: origin[1] }, { lat: place.loc.coordinates[1], lon: place.loc.coordinates[0] })
		// return distance in km rounded to 100 m
		return `${Math.round(distanceMeters / 100) / 10} km`
	}

	let placesToCheck = 10

	/// this point is on the east hempsphere, nearest place should be Konergino on the west hemispehere
	/// lat, lon
	let egwekinotMid = [66.4392631187067, 180.0]
	let egwekinotEastHemi = [66.4392631187067, 179.99]
	let egwekinotWestHemi = [66.4392631187067, -179.99]

	/// lon, lat
	const pointIdsEast = geokdbush.around(index, egwekinotEastHemi[1], egwekinotEastHemi[0], placesToCheck)
	const pointIdsWest = geokdbush.around(index, egwekinotWestHemi[1], egwekinotEastHemi[0], placesToCheck)

	const pointIdsEastSet = new Set(pointIdsEast)
	const pointIdsWestSet = new Set(pointIdsWest)

	t.same(pointIdsEastSet.size, placesToCheck, `Should return ${placesToCheck} places`)
	t.same(pointIdsWestSet.size, placesToCheck, `Should return ${placesToCheck} places`)

	/// `pointIdsEastSet.intersection(pointIdsWestSet)` is experimental
	/// replacement from https://exploringjs.com/impatient-js/ch_sets.html#missing-set-operations
	const intersection = new Set(Array.from(pointIdsEastSet).filter((x) => pointIdsWestSet.has(x)))
	t.same(intersection.size, placesToCheck, `Intersection should also have ${placesToCheck} as it should be the same places`)

	t.same(pointIdsEast.join('+'), pointIdsWest.join('+'), 'Should return same places')

	const pointsEast = pointIdsEast.map((id) => cities[id])
	t.ok(
		pointsEast.some((point) => point.loc.coordinates[0] < 0),
		'there should be some place in a western hemisphere for easter point',
	)

	// and vice versa
	const pointsWest = pointIdsWest.map((id) => cities[id])
	t.ok(
		pointsWest.some((point) => point.loc.coordinates[0] > 0),
		'there should be some place in a eastern hemisphere for western point',
	)

	console.log('Places east:', pointsEast.map((point) => `${point.name} (${placeDistanceM(egwekinotEastHemi, point)})`).join(', '))
	console.log('Places west:', pointsWest.map((point) => `${point.name} (${placeDistanceM(egwekinotWestHemi, point)})`).join(', '))

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
