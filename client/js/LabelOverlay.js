import {LeafletOverlay} from "./LeafletOverlay";

export class LabelOverlay extends LeafletOverlay {

	render() {
		for (var key in this.leafletMap.currentLayer._layers) {
			let value = this.leafletMap.currentLayer._layers[key];
			if (this.isActive === true) {
				value.openTooltip();
			} else {
				value.closeTooltip();
			}
		}
	}
}
