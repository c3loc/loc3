import {LeafletOverlay} from "./LeafletOverlay";
import * as L from "leaflet";

export class OpenStreetMapOverlay extends LeafletOverlay {

	tileLayer;


	init() {
		super.init();

		this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 23,
			maxNativeZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		});
	}


	render() {
		if (this.isActive === true) {
			this.leafletMap.map.addLayer(this.tileLayer, false);
			this.tileLayer.bringToBack();
		} else {
			this.leafletMap.map.removeLayer(this.tileLayer);
		}
	}

}
