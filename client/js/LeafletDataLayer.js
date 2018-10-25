import * as L from "leaflet";

export class LeafletDataLayer {
	name;
	layerName;
	featureGroup;

	constructor(name, layerName) {
		this.name = name;
		this.layerName = layerName;
		this.featureGroup = new L.FeatureGroup();
	}

	bindToData(leafletMap) {
		this.leafletMap = leafletMap;
		Areas.find({layer: this.layerName}).observe({
			_self: this,
			added: function (newDocument) {
				this._self.leafletMap.drawArea(newDocument, this._self.featureGroup);
			},
			removed: function (oldDocument) {
				this._self.leafletMap.removeArea(oldDocument, this._self.featureGroup);
			},
			changed: function (newDocument, oldDocument) {
				this._self.leafletMap.removeArea(oldDocument, this._self.featureGroup);
				this._self.leafletMap.drawArea(newDocument, this._self.featureGroup);
			}
		});
	}

	handleDrawCreated(document) {
		$.extend(document, {layer: this.layerName});
		return Areas.insert(document);
	}

	handleDrawEdited(id, document) {
		$.extend(document, {layer: this.layerName});
		return Areas.update(id, {
			$set: document
		});
	}

	handleDrawDeleted(id) {
		$.extend(document, {layer: this.layerName});
		return Areas.remove(id);
	}
}
