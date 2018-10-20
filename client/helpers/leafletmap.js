LeafletMap = function(divId, dataLayers) {
	this.divId = divId;
	this.dataLayers = dataLayers;

	this.map;
	this.drawControl;
	this.currentLayer = null;
	this.currentDataLayer = null;
	this.dataLayerControl = null;
	this.overlays = null;
	this.layers = null;
	this._inDeleteMode = false;
	this._showMeasurements = false;
	this._showLabels = true;

	this.init();
};


LeafletMap.prototype.init = function () {

	var mapExtent = [12.40396534, 51.39629483, 12.40688955, 51.39867101];
	var mapMinZoom = 16;
	var mapMaxZoom = 23;
	var bounds = new L.LatLngBounds(
		new L.LatLng(mapExtent[1], mapExtent[0]),
		new L.LatLng(mapExtent[3], mapExtent[2]));

	this.map  = L.map(this.divId, {
		/*renderer: L.svg({
			padding: 2
		}),
		tileSize: 255,*/
		/*zoom: 0,
		maxZoom: 7,
		minZoom: 0,
		crs: L.CRS.Simple,
		maxBounds: L.GeoJSON.coordsToLatLngs(northEast, southWest),*/
		maxBounds: bounds
	});

	this.map.on('baselayerchange', $.proxy(function(e) {
		this.switchLayer(e.layer);
	}, this));

	this.overlays = {};
	this.overlays["Measurements"] = new L.FeatureGroup();
	this.overlays["Labels"] = new L.FeatureGroup();
	this.map.addLayer(this.overlays["Labels"]);
	this.renderLayers();

	this.map.on("overlayadd", $.proxy(function (o) {
		if (o.layer === this.overlays["Measurements"]) this._showMeasurements = true;
		if (o.layer === this.overlays["Labels"]) this._showLabels = true;

		this.renderParts();
	}, this));

	this.map.on("overlayremove", $.proxy(function (o) {
		if (o.layer == this.overlays["Measurements"]) this._showMeasurements = false;
		if (o.layer == this.overlays["Labels"]) this._showLabels = false;

		this.renderParts();
	}, this));


	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		maxNativeZoom: 19,
		attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}).addTo(this.map);

	tileLayer = L.tileLayer('/map-tiles/{z}/{x}/{y}.png', {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		bounds: bounds
	}).addTo(this.map);


	L.control.scale().addTo(this.map);

	this.map.setView(bounds.getCenter(), 2);


	this.map.on('draw:created', $.proxy(this.DrawEventHandler.drawCreated, this));
	this.map.on('draw:deleted', $.proxy(this.DrawEventHandler.drawDeleted, this));
	this.map.on('draw:edited', $.proxy(this.DrawEventHandler.drawEdited, this));
	this.map.on('draw:deletestart', $.proxy(function(e) {
		this._inDeleteMode = true;
	}, this));
	this.map.on('draw:deletestop', $.proxy(function(e) {
		this._inDeleteMode = false;
	}, this));

	for (key in this.dataLayers) {
		value = this.dataLayers[key];
		value.bindToData(this);
	}


};

LeafletMap.prototype.addDataLayer = function (dataLayer) {
	if (this.dataLayers == null) this.dataLayers = [];


	this.dataLayers.push(dataLayer);

	for (key in this.dataLayers) {
		value = this.dataLayers[key];
		value.bindToData(this);
	}

	this.renderLayers();


}

LeafletMap.prototype.removeDataLayer = function (id) {
	for (key in this.dataLayers) {
		value = this.dataLayers[key];

		if (value.layerName == id) {
			this.map.removeLayer(value.featureGroup);
			delete this.dataLayers[key];
		}
		this.switchToDefaultLayer();
		this.renderLayers();
	}
}

LeafletMap.prototype.renderLayers = function () {

	layers = {};

	for (key in this.dataLayers) {
		value = this.dataLayers[key];
		layers[value.name] = value.featureGroup;
	}

	if (this.dataLayerControl != null) this.map.removeControl(this.dataLayerControl);

	this.dataLayerControl = L.control.layers(layers, this.overlays, { collapsed: false });
	this.dataLayerControl.addTo(this.map);

	var defaultLayer = layers[Object.keys(layers)[0]];
	this.switchLayer(defaultLayer);

}


LeafletMap.prototype.renderMeasurements = function() {

	var value;
	for (var key in this.currentLayer._layers) {
		value = this.currentLayer._layers[key];

		if (this._showMeasurements === true) {
			value.showMeasurements({showOnHover: true})
		} else {
			value.hideMeasurements();
		}
	}
}

LeafletMap.prototype.renderLabels = function() {
	for (key in this.currentLayer._layers) {
		value = this.currentLayer._layers[key];

		if (this._showLabels == true) {
			value.openTooltip();
		} else {
			value.closeTooltip();
		}
	}
}

LeafletMap.prototype.renderParts = function() {
	this.renderMeasurements();
	this.renderLabels();
}

LeafletMap.prototype.switchToDefaultLayer = function() {
	var layer = null;

	for (key in this.dataLayers) {
		value = this.dataLayers[key];
		layer = value.featureGroup;
		break;
	}
	this.switchLayer(layer);

}

LeafletMap.prototype.switchLayer = function (layer) {

	if (layer == null) {
		layer = new L.FeatureGroup();
	}

	this.currentLayer = layer;
	this.currentDataLayer = this.determineDataLayer(layer);

	this.map.addLayer(layer);
	this.drawEditControl(layer);
	this.renderParts();
}

LeafletMap.prototype.determineDataLayer = function (layer) {

	for (key in this.dataLayers) {
		value = this.dataLayers[key];

		if (value.featureGroup == layer) {
			return value;
		}
	}
	return null;
}

LeafletMap.prototype.drawEditControl = function(editLayer) {
	if (Roles.userIsInRole(Meteor.userId(), ['areas-editor'])) {

		if (this.drawControl != null) this.map.removeControl(this.drawControl);

		this.drawControl = new L.Control.Draw({
			draw: {
				polygon: {
					allowIntersection: false,
					showArea: true,
				},

				rect: {
					shapeOptions: {
						color: 'green'
					},
				},
				polyline: false,
				polyline: false,
				circle: false,
				marker: false
			},

			edit: {
				remove: true,
				featureGroup: editLayer,
				edit: {
					moveMarkers: true,
					selectedPathOptions: {
						maintainColor: true
					}
				}
			}
		});
		this.map.addControl(this.drawControl);
	}
}


LeafletMap.prototype.drawArea = function(areaDocument, areaLayer) {
	polygon = L.polygon(areaDocument.latLngs, { color: areaDocument.color } );
	polygon._leaflet_id = areaDocument._id;
	polygon.addTo(areaLayer);

	polygon.on("click", $.proxy(function(e) {
		if (e.target.editing._enabled !== true && !this._inDeleteMode) {
			Router.go('editAreaPage', { _id: e.target._leaflet_id });
		}
	}, this));

	polygon.bindTooltip(areaDocument.title, {permanent: true, offset: [0,0], direction:"center", className: "no-tooltip"});
	this.renderParts();
}

LeafletMap.prototype.removeArea = function(areaDocument, areaLayer) {
	layers = areaLayer._layers;
	var key, val;

	for (key in layers) {
		val = layers[key];

		if (val._leaflet_id === areaDocument._id) {
			areaLayer.removeLayer(val);
		}
	}
	this.renderParts();
}


LeafletMap.prototype.DrawEventHandler = {
	/**
	 *
	 * @param e
	 */
	drawCreated: function (e) {
		var layer = e.layer;
		var latLngs = MapHelper.latLngsToObjectArray(layer._latlngs[0]);

		this.currentDataLayer.handleDrawCreated({
			latLngs: latLngs
		});
	},

	/**
	 *
	 * @param e
	 */
	drawEdited: function (e) {
		var key, val, latLngs;

		for (key in e.layers._layers) {
			val = e.layers._layers[key];
			latLngs = MapHelper.latLngsToObjectArray(val._latlngs[0]);

			this.currentDataLayer.handleDrawEdited(key, {
				latLngs: latLngs
			});

		}
	},

	/**
	 *
	 * @param e
	 */
	drawDeleted: function (e) {
		var allLayers = e.layers._layers;
		var key, id;

		for (key in allLayers) {
			id = allLayers[key]._leaflet_id;
			this.currentDataLayer.handleDrawDeleted(id);
		}
	},
}
