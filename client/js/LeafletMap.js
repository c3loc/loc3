import { LeafletDrawEventHandler } from './LeafletDrawEventHandler';
import { MeasurementOverlay } from './MeasurementOverlay';

import * as L from "leaflet";
import {LabelOverlay} from "./LabelOverlay";
import {OpenStreetMapOverlay} from "./OpenStreetMapOverlay";

export class LeafletMap {

	divId = null;
	dataLayers = null;

	overlays = [];
	layers = [];

	map = null;
	drawControl = null;
	currentLayer = null;
	currentDataLayer = null;

	_inDeleteMode = null;
	drawEventHandler = null;

	minZoom = 16;
	maxZoom = 23;

	constructor(divId) {
		this.divId = divId;
		this.init();
	}


	init() {

		var mapExtent = [12.40396534, 51.39629483, 12.40688955, 51.39867101];
		var bounds = new L.LatLngBounds(
			new L.LatLng(mapExtent[1], mapExtent[0]),
			new L.LatLng(mapExtent[3], mapExtent[2]));

		this.map  = L.map(this.divId, {
			//maxBounds: bounds
		});

		this.drawEventHandler = new LeafletDrawEventHandler(this);

		this.map.on('baselayerchange', $.proxy(function(e) {
			this.switchLayer(e.layer);
		}, this));

		this.overlays.push(new LabelOverlay(this, "Labels", true));
		this.overlays.push(new MeasurementOverlay(this, "Measurements", false));
		this.overlays.push(new OpenStreetMapOverlay(this, "OSM", true));


		this.map.on("overlayadd", $.proxy(function (o) {
			for (var key in this.overlays) {
				let overlay = this.overlays[key];
				if (o.layer === overlay.featureGroup) {
					overlay.activate();
				}
			}
			this.renderParts();
		}, this));

		this.map.on("overlayremove", $.proxy(function (o) {
			for (var key in this.overlays) {
				let overlay = this.overlays[key];
				if (o.layer === overlay.featureGroup) {
					overlay.deactivate();
				}
			}
			this.renderParts();
		}, this));

		L.tileLayer('/map-tiles/{z}/{x}/{y}.png', {
			minZoom: this.minZoom,
			maxZoom: this.maxZoom,
			bounds: bounds
		}).addTo(this.map);

		var mapExtent2 = [12.40314095, 51.39684087, 12.40718382, 51.39878730];
		L.tileLayer('/map-tiles-2/{z}/{x}/{y}.png', {
			minZoom: 16,
			maxZoom: 23,
			bounds: new L.LatLngBounds(
				new L.LatLng(mapExtent2[1], mapExtent2[0]),
				new L.LatLng(mapExtent2[3], mapExtent2[2])
			)
		}).addTo(this.map);

		L.control.scale().addTo(this.map);

		this.map.setView(bounds.getCenter(), 2);

		for (key in this.dataLayers) {
			var value = this.dataLayers[key];
			value.bindToData(this);
		}

		this.renderLayers();
	}


	addDataLayer(dataLayer) {
		if (this.dataLayers == null) this.dataLayers = [];
		this.dataLayers.push(dataLayer);
		for (key in this.dataLayers) {
			var value = this.dataLayers[key];
			value.bindToData(this);
		}
		this.renderLayers();
	}


	removeDataLayer(id) {
		for (key in this.dataLayers) {
			var value = this.dataLayers[key];

			if (value.layerName === id) {
				this.map.removeLayer(value.featureGroup);
				delete this.dataLayers[key];
			}
			this.switchToDefaultLayer();
			this.renderLayers();
		}
	}

	renderLayers() {
		let layers = [];

		for (key in this.dataLayers) {
			var value = this.dataLayers[key];
			layers[value.name] = value.featureGroup;
		}

		if (this.dataLayerControl != null) this.map.removeControl(this.dataLayerControl);

		let overlayControl = [];

		this.overlays.forEach(function(overlay) {
			overlayControl[overlay.overlayName] = overlay.featureGroup;
		});

		this.dataLayerControl = L.control.layers(layers, overlayControl, { collapsed: false }); // todo replace this.null with a list of FeatureGroups which will be toggled
		this.dataLayerControl.addTo(this.map);

		var defaultLayer = layers[Object.keys(layers)[0]];
		this.switchLayer(defaultLayer);
	}


	renderParts() {
		for (key in this.overlays) {
			this.overlays[key].render();
		}
	}

	switchToDefaultLayer() {
		let layer;
		for (key in this.dataLayers) {
			let value = this.dataLayers[key];
			layer = value.featureGroup;
			//TODO: WHY?      break;
		}
		this.switchLayer(layer);
	}


	switchLayer(layer) {
		if (layer == null) {
			layer = new L.FeatureGroup();
		}

		this.currentLayer = layer;
		this.currentDataLayer = this.determineDataLayer(layer);

		this.map.addLayer(layer);
		this.drawEditControl(layer);
		this.renderParts();
	}


	determineDataLayer(layer) {
		for (key in this.dataLayers) {
			let value = this.dataLayers[key];

			if (value.featureGroup === layer) {
				return value;
			}
		}
		return null;
	}


	drawEditControl(editLayer) {
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

	drawArea(areaDocument, areaLayer) {
		let polygon = L.polygon(areaDocument.latLngs, { color: areaDocument.color} );
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


	removeArea(areaDocument, areaLayer) {
		let layers = areaLayer._layers;
		var key, val;

		for (key in layers) {
			val = layers[key];

			if (val._leaflet_id === areaDocument._id) {
				areaLayer.removeLayer(val);
			}
		}
		this.renderParts();
	}
}
