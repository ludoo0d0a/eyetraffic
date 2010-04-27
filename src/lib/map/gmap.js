var map, lastmarker, gmarkers=[], routemarkers = [], mylocation = false, ewindow;
var options = {
    nearRoad: true,
    drawDirection: true,
    memo: false
};
function getCurrentLocation(){
    if (google.loader.ClientLocation) {
        var cl = google.loader.ClientLocation;
        //location = [cl.address.city, cl.address.region, cl.address.country].join(', ');
        mylocation = {
            lat: cl.latitude,
            lng: cl.longitude,
            html: 'This is my position : ' + cl.latitude + ',' + cl.longitude
        };
        var point = new GLatLng(mylocation.lat, mylocation.lng);
        
		var markerOptions = {
			icon: getIconBlue()
		};
        createMarker(point, mylocation.html, 'position', markerOptions);
        map.setCenter(point, 10);
    }
}

function getJSON(url, cb){
    GDownloadUrl(url, cb);
	/*
	var p = 'file:///C:/Documents%20and%20Settings/Valente/My%20Documents/Aptana%20Studio%20Workspace/EyeTraffic/src/';
	p = '';
    jQuery.ajax({
        url: p + url,
        success: function(data){
            if (data) {
				var json = JSON.parse(data);
				cb(json);
			}
        }
    });*/
    //$.getJSON(url, cb);
}

function findNearest(point, points){
    var n = {};
    jQuery(points).each(function(i, p){
        var d = point.distanceFrom(p);
        if (!np || (np && d < ld)) {
            n = {
                point: p,
                distance: d
            };
        }
    });
    return n;
}

function calculateDistance(){
    var dist = 0;
    for (var i = 0; i < gpolys.length; i++) {
        dist += gpolys[i].Distance();
    }
    return "Path length: " + (dist / 1000).toFixed(2) + " km.<br/>" + (dist / 1609.344).toFixed(2) + " miles.";
}

function updateMarkers(){
    var o = [];
    jQuery(routemarkers).each(function(i, marker){
        var point = marker.getLatLng();
        o.push({
            i: marker.index + 1,
            lat: point.lat(),
            lng: point.lng(),
            html: marker.html,
            label: marker.getTitle()
        });
    });
    jQuery('#jmarkers').html(JSON.stringify(o));
}

function createMarker(point, html, category, options){
    var marker = new GMarker(point, options || {});
	marker.category=category;
    function openwindow(){
        marker.openInfoWindowHtml(html, {
            maxWidth: 200
        });
    }
    GEvent.addListener(marker, "click", openwindow);
    //GEvent.addListener(marker, "mouseover", openwindow);
    map.addOverlay(marker);
	gmarkers.push(marker);
    return marker;
}

function addEncodedPloyline(){
    var encodedPolyline = new GPolyline.fromEncoded({
        color: "#FF0000",
        weight: 10,
        points: "gxqmH_`kd@fEqbAwHcyAuo@g}@csAopAwqBal@k{BsVmb@_wA",
        levels: "BBBBBBBB",
        zoomFactor: 32,
        numLevels: 4
    });
    map.addOverlay(encodedPolyline);
}

function addOverlayWindows(map){
	ewindow = new EWindow(map, E_STYLE_1);
	map.addOverlay(ewindow);
}

function addOverlayRect(map){
    // Display a rectangle in the center of the map at about a quarter of
    // the size of the main map
    var bounds = map.getBounds();
    var southWest = bounds.getSouthWest();
    var northEast = bounds.getNorthEast();
    var lngDelta = (northEast.lng() - southWest.lng()) / 4;
    var latDelta = (northEast.lat() - southWest.lat()) / 4;
    var rectBounds = new GLatLngBounds(new GLatLng(southWest.lat() + latDelta, southWest.lng() + lngDelta), new GLatLng(northEast.lat() - latDelta, northEast.lng() - lngDelta));
    map.addOverlay(new Rectangle(rectBounds));
}

function getIconCafe(){
    var cafeIcon = new GIcon();
    cafeIcon.image = "http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe|996600";
    cafeIcon.shadow = "http://chart.apis.google.com/chart?chst=d_map_pin_shadow";
    cafeIcon.iconSize = new GSize(12, 20);
    cafeIcon.shadowSize = new GSize(22, 20);
    cafeIcon.iconAnchor = new GPoint(6, 20);
    cafeIcon.infoWindowAnchor = new GPoint(5, 1);
    return cafeIcon;
}
function getIconBlue(){
	var blueIcon = new GIcon(G_DEFAULT_ICON);
	blueIcon.image = "http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png";
	return blueIcon;
}
function getIconPause(){
	var blueIcon = new GIcon(G_DEFAULT_ICON);
	blueIcon.image = "http://www.google.com/intl/en_ALL/mapfiles/icon-dd-pause-trans.png";
	return blueIcon;
}
//http://maps.gstatic.com/intl/en_us/mapfiles/kml/paddle/go.png
//http://maps.gstatic.com/intl/en_us/mapfiles/kml/paddle/stop.png
//http://www.google.com/intl/en_ALL/mapfiles/icon-dd-play-trans.png
//http://www.google.com/intl/en_ALL/mapfiles/icon-dd-stop-trans.png

function initialize(){
    if (GBrowserIsCompatible()) {
        map = new GMap2(document.getElementById("map_canvas"));
        map.addControl(new GLargeMapControl());
        map.addControl(new GMapTypeControl());
        map.enableScrollWheelZoom();
        //map.setUIToDefault();
        map.setCenter(new GLatLng(49.53679545, 6.1338043), 10);//lux
        geocoder = new GClientGeocoder();
        if (options.memo) {
            var c = getCookie();
            if (c) {
                map.setCenter(new GLatLng(c.lat, c.lng), c.zoom, map.getMapTypes()[c.maptype]);
            }
        }
        //addEncodedPloyline();
        initRect();
        addOverlayRect(map);
        addOverlayCanvas(map);
		addOverlayWindows(map);
		
		var cafeIcon = getIconCafe();

        var dirnRoadClick = new GDirections();
        var dirnRoadDrag = new GDirections();
        //click put marker on the road
        GEvent.addListener(dirnRoadClick, "load", function(){
            var n = dirnRoadClick.getPolyline().getVertexCount();
            var p = dirnRoadClick.getPolyline().getVertex(n - 1);
            addMarker(p, 'route');
            if (options.drawDirection && routemarkers.length > 0) {
                map.addOverlay(dirnRoadClick.getPolyline());
            }
            updateMarkers();
        });
        //drag move marker on the road
        GEvent.addListener(dirnRoadDrag, "load", function(){
            var p = dirnRoadDrag.getPolyline().getVertex(0);
            lastmarker.setPoint(p);
            updateHtml(lastmarker, p);
            updateMarkers();
        });
        function updateHtml(marker, point){
            marker.bindInfoWindowHtml(getHtml(point, marker.index));
        }
        function getHtml(point, index){
            return 'Point ' + (index + 1) + '<br/>lat:' + point.lat() + '<br/>lng:' + point.lng();
        }
        function addMarker(point, category){
            var index = routemarkers.length;
            var marker = createMarker(point, getHtml(point, index), category,  {
                draggable: true,
                icon: cafeIcon
            });
            marker.index = index;
            routemarkers.push(marker);
            GEvent.addListener(marker, "dragend", function(point){
                lastmarker = marker;
                var p = marker.getPoint();
                if (options.nearRoad) {
                    dirnRoadDrag.loadFromWaypoints([p.toUrlValue(6), p.toUrlValue(6)], {
                        getPolyline: true
                    });
                } else {
                    updateHtml(marker, point);
                    updateMarkers();
                }
            });
        }
        GEvent.addListener(map, "click", function(overlay, point, overlaylatlng){
            if (overlay) {
                return false;
            }
            if (options.nearRoad) {
                var sp = (routemarkers && routemarkers.length > 0) ? (routemarkers[routemarkers.length - 1].getPoint()) : point.toUrlValue(6);
                dirnRoadClick.loadFromWaypoints([sp, point.toUrlValue(6)], {
                    getPolyline: true
                });
            } else {
                addMarker(point, 'route');
            }
        });
        renderMarkersCams();
        renderMarkersTimes();
    }
}
function renderMarkersCams(){
	renderMarkers(data_cams, 'cams');
	/*getJSON('data/cams.json', function(json){
		renderMarkers(json);
	});*/
}
function renderMarkersTimes(){
    var data_times = {
        markers: []
    };
    jQuery.each(timesCoords,function(i, o){
        data_times.markers.push({
            lat: o.lat,
            lng: o.lng,
            html: o.name + '(' + o.i + ')'
        });
    });
	var markerOptions = {
            icon: getIconPause()
        };
    renderMarkers(data_times, 'times', markerOptions);
}

function renderMarkers(json, category, options){
    jQuery(json.markers).each(function(i, marker){
        var point = new GLatLng(marker.lat, marker.lng);
        createMarker(point, marker.html, category, options);
    });
    jQuery(json.lines).each(function(i, line){
        var pts = [];
        for (var j = 0; j < line.points.length; j++) {
            pts[j] = new GLatLng(line.points[j].lat, line.points[j].lng);
        }
        map.addOverlay(new GPolyline(pts, line.colour, line.width));
    });
}

function terminate(){
    if (options.memo) {
        setCookie();
    }
    GUnload();
}

window.onunload = terminate;
