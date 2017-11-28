window.rtMapAPI = (function(window, jQuery){
	'use strict';
	var instance = null;

	function rtMapAPI(){
	}

	rtMapAPI.prototype.setGeoJSON = function(geojson) {
		this.geojson = geojson;
	};

	rtMapAPI.prototype.setMap = function(map) {
		this.map = map;
	};

	rtMapAPI.prototype.setVisible = function(elements){
		this.elements = elements;
	};

	rtMapAPI.prototype.setRefreshTimeout = function(cb) {
		setInterval(cb, 3000);
	};

	//promise based, this function runs when the map has been loaded before the data has been retrieved for the first time
	rtMapAPI.prototype.loadElements = function() {
		return $.getJSON('testdata.json');
	};

	//this function runs after the map has been loaded with all the sprites drawn
	rtMapAPI.prototype.ready = function() {
		
	};

	//this function runs when the map has been loaded before the data has been retrieved for the first time
	rtMapAPI.prototype.matches = function(element, featureProperties) {
		return featureProperties.id === element.name;
	};

	rtMapAPI.prototype.getPopupText = function(elements){
		return elements.map(function(element){
			return element.name + ' ' + element.genero + ' <a href="#">' + element.edad + '</a>';
		}).join(', ');
	};

	rtMapAPI.prototype.style = function(elements){
		return {
			fillColor: (elements.length === 1 ? (elements[0].genero === 'hombre' ? '#4E2AFC' : '#FC4E2A') : '#FC4AE2'),
			weight: 2,
			opacity: elements.length === 0 ? 0 : 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: elements.length === 0 ? 0 : 0.01 * elements[0].edad
		};
	};

	//this function runs when the map has been loaded before the data has been retrieved for the first time
	rtMapAPI.prototype.on = {
		mouseover: function (e) {
			var layer = e.target;

			layer.setStyle({
				weight: 5,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.7
			});

			if (!window.L.Browser.ie && !window.L.Browser.opera && !window.L.Browser.edge) {
				layer.bringToFront();
			}
		},
		mouseout: function(e){
			instance.geojson.resetStyle(e.target);
		},
		click: function(e){

		}
	};

	instance = new rtMapAPI();

	return instance;
})(window, jQuery);
