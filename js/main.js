// Vanilla
document.addEventListener('DOMContentLoaded', function () {
	//getGPS();
	document.querySelector("button").onclick = function () {
		getGPS();
	};
	
	checkURL();
	toggleClearBtn();
	
	// set map height
	document.querySelector("#map").style.height = document.body.clientHeight +"px";
	
	window.onresize = function(event) {
    	document.querySelector("#map").style.height = document.body.clientHeight +"px";
	};
});

// fake service worker for enable "App Install Banner"
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('js/sw.js').then(function(registration) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  }).catch(function(err) {
    // registration failed :(
    console.log('ServiceWorker registration failed: ', err);
  });
}
// end : fake service worker for enable "App Install Banner"

var map, markerUser, markerQibla, maxZoomService;
var poly, geodesicPoly;
var center_changedTimeout;

function initializeMap() {
	var mapOptions = {
		zoom: 3,
		center: new google.maps.LatLng(0, 45),
		disableDefaultUI: false,
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DEFAULT,
			position: google.maps.ControlPosition.LEFT_BOTTOM
		},
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.DEFAULT,
			position: google.maps.ControlPosition.RIGHT_BOTTOM
		},
		scaleControl: true,
		streetViewControl: true,
		streetViewControlOptions: {
			position: google.maps.ControlPosition.RIGHT_BOTTOM
		}
	};

	map = new google.maps.Map(document.getElementById('map'), mapOptions);

	markerQibla = new google.maps.Marker({
		position: new google.maps.LatLng(21.422515, 39.826175),
		title: "Kaabah",
		map: map,
		icon: 'img/kaba32.png'
	});

	markerUser = new google.maps.Marker({
		position: new google.maps.LatLng(0, 45),
		map: map,
		title: '^_^',
		draggable: false
	});

	//google.maps.event.addListener(markerUser, 'position_changed', centerMap);

	map.addListener('center_changed', function () {
		clearTimeout(center_changedTimeout);

		center_changedTimeout = setTimeout(function () {
			markerUser.setMap(null);
			console.log(map.getCenter().lat());
			markerUser = new google.maps.Marker({
				position: new google.maps.LatLng(map.getCenter().lat(), map.getCenter().lng()),
				map: map,
				title: '^_^'
			});
			
			updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());

			updateDraw();
		}, 300);

	});
	
	map.addListener('zoom_changed', function () {
		updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
	});
	
	map.addListener('heading_changed', function () {
		updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
	});
	
	map.addListener('maptypeid_changed', function () {
		updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
	});
	
	map.addListener('tilt_changed', function () {
		updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
	});

	poly = new google.maps.Polyline({
		strokeColor: '#ff5722',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map: map,
	});

	geodesicPoly = new google.maps.Polyline({
		strokeColor: '#ff5722',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		geodesic: true,
		map: map
	});

	updateDraw();


	// autocomplete
	var input = /** @type {HTMLInputElement} */(
		document.getElementById('city'));

	var autocomplete = new google.maps.places.Autocomplete(input);

	// Get the full place details when the user selects a place from the
	// list of suggestions.
	google.maps.event.addListener(autocomplete, 'place_changed', function () {
		var place = autocomplete.getPlace();
		if (!place.geometry) {
			return;
		}

		map.panTo(place.geometry.location);
		updateURL(place.name, place.geometry.location.lat(), place.geometry.location.lng(), map.getZoom());

		markerUser.setMap(null);
		markerUser = new google.maps.Marker({
			position: place.geometry.location,
			map: map,
			title: '^_^'
		});

		maxZoomService = new google.maps.MaxZoomService();
		maxZoomService.getMaxZoomAtLatLng(place.geometry.location, function (data) {
			map.setZoom(data.zoom-1);
			console.log(data.zoom);
			//updateURL(place.name, map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
		});


		updateDraw();

	});
	// end : autocomplete

}

function getGPS() {
	console.log("Recherche GPS en cours...");

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, showError);
		document.querySelector("button").classList.add('gpsLoading');
	} else {
		console.log("Geolocation is not supported by this browser! Change browser or device please :)");
	}
}

function showPosition(position) {
	document.querySelector("button").classList.remove('gpsLoading');
	console.log("Position GPS OK.");
	console.log(position);

	map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
	
	updateURL("_", position.coords.latitude, position.coords.longitude, map.getZoom());

	maxZoomService = new google.maps.MaxZoomService();
	maxZoomService.getMaxZoomAtLatLng(new google.maps.LatLng(position.coords.latitude, position.coords.longitude), function (data) {
		map.setZoom(data.zoom-1);
		updateURL("_", map.getCenter().lat(), map.getCenter().lng(),map.getZoom());
	});

	markerUser.setMap(null);
	markerUser = new google.maps.Marker({
		position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
		map: map,
		title: 'Your position via GPS',
		draggable: false
	});

	//google.maps.event.addListener(markerUser, 'position_changed', centerMap);

	// draw line

	var bounds = new google.maps.LatLngBounds(markerUser.getPosition(), markerQibla.getPosition());
	//map.fitBounds(bounds);



	updateDraw();
}

function centerMap() {
	console.log(markerUser.getPosition());
	map.panTo(markerUser.getPosition());
}

function updateDraw() {
	var path = [markerUser.getPosition(), markerQibla.getPosition()];
	//poly.setPath(path);
	geodesicPoly.setPath(path);
	//var heading = google.maps.geometry.spherical.computeHeading(path[0], path[1]);
}

function showError(error) {
	document.querySelector("button").classList.remove('gpsLoading');
	switch (error.code) {
		case error.PERMISSION_DENIED:
			console.log("User denied the request for Geolocation.");
			break;
		case error.POSITION_UNAVAILABLE:
			console.log("Location information is unavailable.");
			break;
		case error.TIMEOUT:
			console.log("The request to get user location timed out.");
			break;
		case error.UNKNOWN_ERROR:
			console.log("An unknown error occurred.");
			break;
	}
}

function updateURL(label, lat,lng, zoom){
	history.replaceState("", "", "#"+label.replace(/ /ig,"_").replace(/[^a-zA-Z_\-0-9]+/g,'')
								+"_/"+lat +"/"+ lng+"/"+zoom
								+"/"+map.getMapTypeId()
								+"/"+((map.getHeading() == undefined)?0:map.getHeading())
								+"/"+map.getTilt());
	
	//getTilt() only available for SATELLITE and HYBRID
	/*document.location.hash = label.replace(/ /ig,"_").replace(/[^a-zA-Z_\-0-9]+/g,'')
								+"_/"+lat +"/"+ lng+"/"+zoom;*/
}


function checkURL(){
	if(document.location.hash != ""){
		var hashArray = document.location.hash.split("/");
		var isOK = true;
		
		try {
			if(hashArray.length>=4){
				if(isNaN(parseFloat(hashArray[1], 10)) || parseFloat(hashArray[1], 10)<-90  || parseFloat(hashArray[1], 10) > 90){
					isOK = false;
				}
				
				if(isNaN(parseFloat(hashArray[2], 10) || (parseFloat(hashArray[2], 10)<-180  || parseFloat(hashArray[2], 10) > 180)){
					isOK = false;
				}
				
				if(isNaN(parseInt(hashArray[3], 10))){
					isOK = false;
				}
				
				if(isOK){
					map.panTo(new google.maps.LatLng(hashArray[1], hashArray[2]));
					map.setZoom(parseInt(hashArray[3],10));
					
					if(hashArray[4] != undefined && hashArray[4].toUpperCase() == "HYBRID"){
						map.setMapTypeId(google.maps.MapTypeId.HYBRID);
					}
					
					if(hashArray[5] != undefined  ){ //TODO : test if heading is a number
						map.setOptions({"heading":parseInt(hashArray[5],10)});
					}
					
					if(hashArray[6] != undefined  ){ //TODO : test if tilt is a number
						map.setTilt(parseInt(hashArray[6],10));
					}
				}
				
			
			}else{
				getGPS();
			}
			
			
			
		}catch(err) {
			console.error(err.message);
			
			getGPS();
		}
	}else{
		getGPS();
	}
}


function toggleClearBtn(){
	if(document.getElementById("city").value == ""){
		document.getElementById("reset").style.visibility = "hidden";
	}else{
		document.getElementById("reset").style.visibility = "visible";
	}
}
