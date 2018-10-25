import * as L from "leaflet";

export class LeafletOverlay {
	leafletMap;
	overlayName;

	featureGroup;
	isActive = false;


	constructor(leafletMap, overlayName, isActive = false) {
		this.isActive = isActive;
		this.leafletMap = leafletMap;
		this.overlayName = overlayName;
		this.init();
	}



	init() {
		this.featureGroup = new L.FeatureGroup();

		if (this.isActive === true) {
			this.leafletMap.map.addLayer(this.featureGroup);
		}
	}

	activate() {
		this.isActive = true;
	}

	deactivate() {
		this.isActive = false;
	}

	render() {
	}
}
