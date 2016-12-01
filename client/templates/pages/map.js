// on startup run resizing event
Meteor.startup(function() {
	$(window).resize(function() {
		$('#map').css('height', window.innerHeight - 82);
	});

	$(window).resize(); // trigger resize event
	$.getScript('js/leaflet-measure-path.js');
});

// create marker collection
Meteor.subscribe('areas');

Template.mapPage.rendered = function() {
	$('#map').css('height', window.innerHeight - 82);

	var leafletMap = new LeafletMap("map", [
		new LeafletDataLayer("Halle H", "halleh"),
		new LeafletDataLayer("Aufbau", "aufbau"),
		new LeafletDataLayer("Abbau", "abbau")
	]);
};
