export class MapHelper {


	static latLngsToObjectArray(latLngs) {
		var latLngsArray = [];

		latLngs.forEach(function (o) {
			latLngsArray.push({lat: o.lat, lng: o.lng});
		});

		return latLngsArray;
	}

}
