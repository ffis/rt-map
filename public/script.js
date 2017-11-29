/* global angular, window */
(function(angular, window){
	'use strict';

	function styleByFeature(){
		return {
			fillColor: '#FC4E2A',
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7
		};
	}

	angular.module('maprt', ['ngResource', 'ngFileUpload'
	]).factory('Config', ['$resource', function($resource){
		return $resource('/api/config');
	}]).factory('TileMapResource', ['$resource', function($resource){
		return $resource('/api/map/:id/tilemapresource.json', {id: '@id'});
	}]).factory('FeatureCollection', ['$resource', function($resource){
		return $resource('/api/map/:id/featurecollection.json', {id: '@id'});
	}]).config(['$locationProvider', function($locationProvider){
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
	}]).run(['$rootScope', 'Config', function($rootScope, Config){
		$rootScope.config = Config.get();

	}]).controller('Dashboard', ['$scope', '$log', '$window', '$q', '$location', 'Upload', 'TileMapResource', 'FeatureCollection',
		function($scope, $log, $window, $q, $location, Upload, TileMapResource, FeatureCollection){

			var coords = [],
				map,
				rc;

			$scope.uploading = false;
			$scope.filter = {properties: {id: ''}};
			$scope.newspritename = '';
			$scope.sections = [{id: 'Start'}, {id: 'Details'}];
			$scope.selectedSection = 'Start';
			$scope.setSection = function(section){
				$scope.selectedSection = section.id;
			};
//			$scope.autowidth = 0;
//			$scope.autoheight = 0;

			$scope.submit = function($event) {
				$event.preventDefault();
				if ($scope.form.file.$valid && $scope.file) {
					$scope.upload($scope.file);
				}
			};

			var featuresLayer = window.L.geoJSON([], {
				style: styleByFeature,
				coordsToLatLng: function (coordinates) {
					if (Array.isArray(coordinates[0])){
						return coordinates.map(function(c){
							return rc.unproject(c);
						});
					}

					return rc.unproject(coordinates);
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

			$scope.numberofsides = 4;
			$scope.layers = [];

			function noop(){}

			$scope.addPoint = noop;

			$scope.addSprite = function(s){
				$scope.featurecollection.features.push(s);
				$scope.sync();
			};

			$scope.redrawSprites = function(){
				$scope.layers.forEach(function(layer){
					map.removeLayer(layer);
				});
				$scope.layers = [];
				$scope.featurecollection.features.forEach($scope.addToSpriteMap);
			};

			$scope.deleteSprite = function(s){
				if ($scope.featurecollection.features.indexOf(s) >= 0){
					$scope.featurecollection.features.splice($scope.featurecollection.features.indexOf(s), 1);
					$scope.sync();
					$scope.redrawSprites();
				}
			};

			$scope.addLayer = function(layer){
				$scope.layers.push(layer);
				map.addLayer(layer);
			};

			$scope.addToSpriteMap = function(feature){
				featuresLayer.addData(feature);
			};

			function addRectangle(rectangle){
				var sprite = {type: 'Feature', geometry: {type: 'Polygon', coordinates: [rectangle]}, properties: {id: $scope.newspritename}};
				$scope.addSprite(sprite);
				$scope.addToSpriteMap(sprite);
			}
			function addPolygon(polygon){
				var sprite = {type: 'Feature', geometry: {type: 'Polygon', coordinates: [polygon]}, properties: {id: $scope.newspritename}};
				$scope.addSprite(sprite);
				$scope.addToSpriteMap(sprite);
			}

			function addPolygonPoint(latlng){
				coords.push([latlng.x, latlng.y]);
				if (coords.length === parseInt($scope.numberofsides, 10)){
					coords.push(coords[0]);
					addPolygon(coords);
					coords = [];
				}
			}

			function addRectanglePoint(latlng){

				coords.push([latlng.x, latlng.y]);

				if ($scope.autowidth && $scope.autoheight){
					coords.push([latlng.x + $scope.autowidth, latlng.y + $scope.autoheight]);
				}

				if (coords.length === 2){
					//change: [[x1, y1],[x2], [y2]]
					//to: [[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]
					var x1 = coords[0][0], y1 = coords[0][1],
						x2 = coords[1][0], y2 = coords[1][1];

					addRectangle([[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]);
					coords = [];
				}
			}

			function onMapClick(e){
				if (!$scope.editor){
					return;
				}

				var point = rc.project(e.latlng);
				point.x = Math.ceil(point.x);
				point.y = Math.ceil(point.y);
				$scope.addPoint(point);
			}

			$scope.addRectangle = function(){
				if ($scope.editor === 'rectangle'){
					$scope.editor = false;
					$scope.addPoint = noop;
				} else {
					$scope.editor = 'rectangle';
					$scope.addPoint = addRectanglePoint;
				}
				coords = [];
			};

			$scope.addPolygon = function(){
				if ($scope.editor === 'polygon'){
					$scope.editor = false;
					$scope.addPoint = noop;
				} else {
					$scope.editor = 'polygon';
					$scope.addPoint = addPolygonPoint;
				}
				coords = [];
			};

			$scope.mapInit = function(id, mapconfiguration){
				var minZoom = mapconfiguration.minZoom;
				var maxZoom = mapconfiguration.maxZoom;
				var img = [mapconfiguration.width, mapconfiguration.height];

				// create the map
				map = window.L.map('map', {
					minZoom: minZoom,
					maxZoom: maxZoom
				});

				rc = new window.L.RasterCoords(map, img);
				map.setView(rc.unproject([mapconfiguration.width / 2, mapconfiguration.height / 2]), maxZoom / 2);

				window.L.tileLayer('/api/map/' + id + '/{z}/{x}/{y}.png', {
					noWrap: true,
					attribution: 'Map'
				}).addTo(map);

				featuresLayer.addTo(map);
				map.on('click', onMapClick);
			};

			$scope.loadMap = function(id){
				var loads = [FeatureCollection.get({id: id}), TileMapResource.get({id: id})];
				$q.all(loads.map(function(o){ return o.$promise; })).then(function(){

					var o = loads[1];
					$scope.tilemap = o.TileMap;
					$scope.mapid = id;

					$scope.mapconfiguration = {
						width: o.TileMap.BoundingBox[0].$.maxx - o.TileMap.BoundingBox[0].$.minx,
						height: o.TileMap.BoundingBox[0].$.maxy - o.TileMap.BoundingBox[0].$.miny,
						minZoom: 0,
						maxZoom: o.TileMap.TileSets[0].TileSet.length - 1
					};
					$scope.mapInit(id, $scope.mapconfiguration);
					$scope.featurecollection = loads[0];
					$scope.featurecollection.features.forEach($scope.addToSpriteMap);
				});
			};

			$scope.sync = function(){
				var newSave = new FeatureCollection($scope.featurecollection);
				newSave.$save();
			};

			$scope.download = function(){
				$window.location = '/api/download/' + $scope.mapid;
			};

			$scope.upload = function (file) {
				$scope.uploading = true;
				Upload.upload({
					url: '/api/upload',
					data: {map: file}
				}).then(function (resp) {
					var answer = typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data;
					$window.location.href = '?id=' + answer.id;
				}, function (resp) {
					$log.error('Error status:', resp.status);
				});
			};

			var parameters = $location.search();
			if (typeof parameters.id === 'string' && (/\d+/).test(parameters.id)){
				$scope.loadMap(parseInt(parameters.id, 10));
			}
		}
	]);

})(angular, window);
