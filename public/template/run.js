;(function (window, jQuery, logger) {
	'use strict';

	function getMapDetails(){
		return jQuery.getJSON('map/tilemapresource.json').then(function(o){

			if (typeof o !== 'object' || typeof o.TileMap !== 'object' || typeof o.TileMap.BoundingBox !== 'object' ||
				typeof o.TileMap.BoundingBox[0] !== 'object' || typeof o.TileMap.BoundingBox[0].$ !== 'object'){
				return cb({err: 'Not valid file'});
			}

			return {
				width: o.TileMap.BoundingBox[0].$.maxx - o.TileMap.BoundingBox[0].$.minx,
				height: o.TileMap.BoundingBox[0].$.maxy - o.TileMap.BoundingBox[0].$.miny,
				minZoom: 0,
				maxZoom: o.TileMap.TileSets[0].TileSet.length - 1
			};
		});
	}

	function getSprites(){
		return jQuery.getJSON('map/featurecollection.json');
	}

	function getElements(){
		return window.rtMapAPI.loadElements();
	}

	function layerFeatures(map, rc, featurecollection) {
		var layer = window.L.geoJson(featurecollection, {
			style: function(feature){
				return rtMapAPI.style(feature.properties.elements);
			},
			coordsToLatLng: function (coords) {
				if (Array.isArray(coords[0])){
					return coords.map(function(c){
						return rc.unproject(c);
					});
				}

				return rc.unproject(coords);
			},
			onEachFeature: function (feature, layer) {
				if (feature.properties && feature.properties.elements && feature.properties.elements.length > 0) {
					layer.bindPopup(rtMapAPI.getPopupText(feature.properties.elements));
				}

				layer.on(rtMapAPI.on);
			},
			pointToLayer: function (feature, latlng) {
				return window.L.circleMarker(latlng, {
					radius: 8,
					fillColor: '#800080',
					color: '#D107D1',
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8
				});
			}
		});

		rtMapAPI.setGeoJSON(layer);
		map.addLayer(layer);

		return layer;
	}

	getMapDetails().then(function(details){
		var minZoom = details.minZoom;
		var maxZoom = details.maxZoom;
		var img = [details.width, details.height];

		var map = window.L.map('map', {minZoom: minZoom, maxZoom: maxZoom});

		var rc = new window.L.RasterCoords(map, img);
		map.setView(rc.unproject([details.width / 2, details.height / 2]), maxZoom / 2);

		window.L.tileLayer('./map/{z}/{x}/{y}.png', {noWrap: true, attribution: 'Map'}).addTo(map);

		getSprites().then(function(featurecollection){
			if (typeof featurecollection.title === 'string' && featurecollection.title.trim() !== ''){
				document.title = featurecollection.title.trim();
			}

			getElements().then(function(elements){
				featurecollection.features.forEach(function(feature){
					feature.properties.elements = [];

					elements.forEach(function(element){
						if (window.rtMapAPI.matches(element, feature.properties)){
							feature.properties.elements.push(element);
						}
					});
				})

				window.L.control.layers({}, {
					'Sprites': layerFeatures(map, rc, featurecollection.features)
				}).addTo(map);

				window.rtMapAPI.ready();
			});
		});
	});

})(window, jQuery, console);
