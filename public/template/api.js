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

	//This method is called to let you know which of the elements that loadElements
	//method have downloaded have at least one sprite that represents them.
	rtMapAPI.prototype.setVisible = function(elements){
		this.elements = elements;
	};

	//This method sets an interval of the time the map should ask for new updates.
	rtMapAPI.prototype.setRefreshTimeout = function(cb) {
		setInterval(cb, 30000); //this time is in milliseconds. In this example it says refresh each 30 seconds
	};

	//promise based, this function runs when the map has been loaded before the data has been retrieved for the first time
	rtMapAPI.prototype.loadElements = function() {
		return $.getJSON('testdata.json');
	};

	//this function runs after the map has been loaded with all the sprites drawn
	rtMapAPI.prototype.ready = function() {
		
	};

	//this function runs for each loaded element to know which of them belongs to which sprite
	rtMapAPI.prototype.matches = function(element, featureProperties) {
		return featureProperties.id === element.name; /* you should probably want to change "name" attribute to what it belongs */
	};

	//This method should return a text that is rendered like a tooltip text.
	rtMapAPI.prototype.getPopupText = function(elements){
		return elements.map(function(element){
			return element.name + ' ' + element.mySpecialAttributeDetails + ' <a href="#">' + element.mySpecialAttribute + '</a>';
		}).join(', ');
	};

	//This method sets for an _sprite_ how it should be drawn depending on which elements have been matched using the _matches_ method.
	rtMapAPI.prototype.style = function(elements){
		return {
			fillColor: (elements.length === 1 ? (elements[0].attr === 'specialValue' ? '#4E2AFC' : '#FC4E2A') : '#FC4AE2'),
			weight: 2,
			opacity: elements.length === 0 ? 0 : 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: elements.length === 0 ? 0 : 0.01 * elements[0].mySpecialAttribute
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
