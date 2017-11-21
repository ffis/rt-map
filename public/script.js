/* global angular, window */
(function(angular, window){
	'use strict';

	angular.module('maprt', ['ngResource', 'ngFileUpload'
	]).factory('Config', ['$resource', function($resource){
		return $resource('/api/config');
	}]).factory('TileMapResource', ['$resource', function($resource){
		return $resource('/api/map/:id/tilemapresource.json', {id: '@id'});
	}]).factory('Sprites', ['$resource', function($resource){
		return $resource('/api/map/:id/sprites.json', {id: '@id'});
	}]).run(['$rootScope', 'Config', function($rootScope, Config){
		$rootScope.config = Config.get();
	}]).controller('Dashboard', ['$scope', '$log', '$window', '$q', 'Upload', 'TileMapResource', 'Sprites', function($scope, $log, $window, $q, Upload, TileMapResource, Sprites){

		$scope.sections = [{id: 'Start'}, {id: 'Sprites'}];
		$scope.selectedSection = 'Start';
		$scope.setSection = function(section){
			$scope.selectedSection = section.id;
		};

		$scope.submit = function($event) {
			$event.preventDefault();
			if ($scope.form.file.$valid && $scope.file) {
				$scope.upload($scope.file);
			}
		};

		$scope.sprites = [];

		var impar = false,
			coords = [],
			map,
			rc;

		$scope.numberofsides = 4;
		$scope.spritesLoader = '[]';
		$scope.layers = [];

		function noop(){}

		$scope.addPoint = noop;

		$scope.sync = function(){
			$scope.spritesLoader = angular.toJson($scope.sprites);
		};

		$scope.addSprite = function(s){
			$scope.sprites.push(s);
			$scope.spritesLoader = angular.toJson($scope.sprites);
		};

		$scope.loadSprites = function(){
			$scope.layers.forEach(function(layer){
				map.removeLayer(layer);
			});
			$scope.layers = [];
			$scope.sprites = angular.fromJson($scope.spritesLoader);
			$scope.sprites.forEach($scope.addToSpriteMap);
		};

		$scope.addLayer = function(layer){
			$scope.layers.push(layer);
			map.addLayer(layer);
		};

		$scope.addToSpriteMap = function(sprite){
			var points = sprite.points.map(function (point) {
				return rc.unproject([point.x, point.y]);
			});
			var layer = points.length === 2 ? window.L.rectangle([points]) : window.L.polygon([points]);
			$scope.addLayer(layer);
		};

		function addRectangle(rectangle){
			var sprite = {id: '', type: 'rectangle', points: rectangle};
			$scope.addSprite(sprite);
			$scope.addToSpriteMap(sprite);
		}

		function addPolygon(polygon){
			var sprite = {id: '', type: 'polygon', points: polygon};
			$scope.addSprite({id: '', type: 'polygon', points: polygon});
			$scope.addToSpriteMap(sprite);
		}

		function addPolygonPoint(latlng){
			coords.push(latlng);
			if (coords.length === parseInt($scope.numberofsides, 10)){
				addPolygon(coords);
				coords = [];
			}
		}

		function addRectanglePoint(latlng){
			coords.push(latlng);
			if (coords.length === 2){
				addRectangle(coords);
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
			map.on('click', onMapClick);
		};

		$scope.loadMap = function(id){
			var loads = [Sprites.get({id: id}), TileMapResource.get({id: id})];
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
				$scope.sprites = loads[0].sprites;
				$scope.sprites.forEach($scope.addToSpriteMap);
			});
		};

		$scope.saveSprites = function(){
			var newSave = new Sprites({id: $scope.mapid, sprites: $scope.sprites});
			newSave.$save();
		};

		$scope.download = function(){
			$window.location = '/api/download/' + $scope.mapid;
		};

		$scope.upload = function (file) {
			$log.log(file);
			Upload.upload({
				url: '/api/upload',
				data: {map: file}
			}).then(function (resp) {
				var answer = typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data;
				$scope.loadMap(answer.id);
			}, function (resp) {
				$log.error('Error status:', resp.status);
			});
		};

		$scope.loadMap(1511256908943);

	}]);

})(angular, window);
