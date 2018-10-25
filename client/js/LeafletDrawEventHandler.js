import {MapHelper} from "./MapHelper";


export class LeafletDrawEventHandler {

	leafletMap;

	constructor(leafletMap) {
		this.leafletMap = leafletMap;
		this.init();
	}

	init() {
		this.leafletMap.map.on('draw:created', $.proxy(this.drawCreated, this));
		this.leafletMap.map.on('draw:deleted', $.proxy(this.drawDeleted, this));
		this.leafletMap.map.on('draw:edited', $.proxy(this.drawEdited, this));
		this.leafletMap.map.on('draw:deletestart', $.proxy(this.startDeleteMode, this));
		this.leafletMap.map.on('draw:deletestop', $.proxy(this.endDeleteMode, this));
	}

	drawCreated(e) {
		var layer = e.layer;
		var latLngs = MapHelper.latLngsToObjectArray(layer._latlngs[0]);

		this.leafletMap.currentDataLayer.handleDrawCreated({
			latLngs: latLngs
		});
	}


	drawEdited(e) {
		var key, val, latLngs;

		for (key in e.layers._layers) {
			val = e.layers._layers[key];
			latLngs = MapHelper.latLngsToObjectArray(val._latlngs[0]);

			this.leafletMap.currentDataLayer.handleDrawEdited(key, {
				latLngs: latLngs
			});
		}
	}

	drawDeleted(e) {
		var allLayers = e.layers._layers;
		var key, id;

		for (key in allLayers) {
			id = allLayers[key]._leaflet_id;
			this.leafletMap.currentDataLayer.handleDrawDeleted(id);
		}
	}


	startDeleteMode(e) {
		this.leafletMap._inDeleteMode = true;
	}


	endDeleteMode(e) {
		this.leafletMap._inDeleteMode = false;
	}

}
