;(function (window, logger) {
	function downloadJSON(url, cb){
		var xhr = new window.XMLHttpRequest();
		xhr.open('GET', url);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onload = function() {
			return (xhr.status === 200) ? cb(null, JSON.parse(xhr.responseText)) : cb(xhr);
		};
		xhr.send();
	}

	function getDetails(cb){
		downloadJSON('map/tilemapresource.json', function(err, o){
			if (err){
				return cb(err);
			}

			if (typeof o !== 'object' || typeof o.TileMap !== 'object' || typeof o.TileMap.BoundingBox !== 'object' ||
				typeof o.TileMap.BoundingBox[0] !== 'object' || typeof o.TileMap.BoundingBox[0].$ !== 'object'){
				return cb({err: 'Not valid file'});
			}

			var obj = {
				width: o.TileMap.BoundingBox[0].$.maxx - o.TileMap.BoundingBox[0].$.minx,
				height: o.TileMap.BoundingBox[0].$.maxy - o.TileMap.BoundingBox[0].$.miny,
				minZoom: 0,
				maxZoom: o.TileMap.TileSets[0].TileSet.length - 1
			};

			return cb(null, obj);
		});
	}

	function getSprites(cb){
		downloadJSON('map/featurecollection.json', cb);
	}

	function layerFeatures(map, rc, featurecollection) {
		var layer = window.L.geoJson(featurecollection, {
			coordsToLatLng: function (coords) {
				if (Array.isArray(coords[0])){
					return coords.map(function(c){
						return rc.unproject(c);
					});
				}

				return rc.unproject(coords);
			},
			onEachFeature: function (feature, layer) {
				if (feature.properties && feature.properties.id) {
					layer.bindPopup(feature.properties.id);
				}
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

		map.addLayer(layer);

		return layer;
	}

	function init (mapid, details) {
		var minZoom = details.minZoom;
		var maxZoom = details.maxZoom;
		var img = [details.width, details.height];

		// create the map
		var map = window.L.map(mapid, {
			minZoom: minZoom,
			maxZoom: maxZoom
		});

		var rc = new window.L.RasterCoords(map, img);
		map.setView(rc.unproject([details.width / 2, details.height / 2]), maxZoom / 2);

		window.L.tileLayer('./map/{z}/{x}/{y}.png', {
			noWrap: true,
			attribution: 'Map'
		}).addTo(map);

		getSprites(function(err, featurecollection){
			if (err){
				logger.error(err);

				return;
			}
			window.L.control.layers({}, {
				'Sprites': layerFeatures(map, rc, featurecollection.features)
			}).addTo(map);
		});
	}

	getDetails(function(err, details){
		init('map', details);
	});

})(window, console);
