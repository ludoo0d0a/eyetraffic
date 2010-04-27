var geocoder;
function searchMap(){
    var addressSource = document.getElementById("addressSource").value;
    if (geocoder) {
        geocoder.getLatLng(addressSource, function(point){
            if (point) {
                map.setCenter(point, 13);
                var marker = new GMarker(point);
                map.addOverlay(marker);
                marker.openInfoWindowHtml(addressSource);
            }
        });
    }
}

function saveLocation(){
    var point = map.getCenter();
    setCookie();
}

function resetLocation(){
    if (mylocation) {
        var point = new GLatLng(mylocation.lat, mylocation.lng);
        map.setCenter(point);
    }
}

function showRoute(showLoc){
    jQuery('#location').toggle(showLoc);
    jQuery('#route').toggle(!showLoc);
}

function showLocation(){
    showRoute(true);
}

var sizes = [{
    w: 400,
    h: 335
}, {
    w: 490,
    h: 445
}, {
    w: 700,
    h: 505
}, {
    w: 1000,
    h: 870
}];
function setSize(size){
    var m = sizes[size];
    if (m) {
        jQuery("#map_canvas").width(m.w).height(m.h);
        jQuery("#wrapper").width(m.w).height(m.h);
    }
}

var dirnRoute;
function getRoute(){
    if (!dirnRoute) {
        dirnRoute = new GDirections();
    }
    dirnRoute.clear();
    //, jQuery("#left")[0]
    dirnRoute = new GDirections(map);
    GEvent.addListener(dirnRoute, "error", function(){
        console.log('error');
    });
    GEvent.addListener(dirnRoute, "load", function(){
    });
    var source = jQuery("#routeA").val();
    var destination = jQuery("#routeB").val();
    dirnRoute.load("from: " + source + " to: " + destination);
}

function clearRoute(){
    if (dirnRoute) {
        dirnRoute.clear();
    }
}

function selcat(box, category){
    if (box.checked) {
        showcat(category);
    } else {
        hidecat(category);
    }
    // == rebuild the side bar
    makeSidebar();
}

function showcat(category){
    jQuery(gmarkers).each(function(i,marker){
        if (marker.category === category) {
            marker.show();
			ewindow.openOnMarker(marker,'Category:'+category);
        }
    });
    document.getElementById('cat_'+category).checked = true;
}

function hidecat(category){
    jQuery(gmarkers).each(function(i,marker){
        if (marker.category === category) {
            marker.hide();
        }
    });
    document.getElementById('cat_'+category).checked = false;
    // == close the info window, in case its open on a marker that we just hid
    map.closeInfoWindow();
}

function makeSidebar(){
	
}

function openall(){
	ewindow.openOnMarker(marker,html);
	//ewindow.openOnMap(point, html, offset)
}
