var map, places = {};
//var lastmarker, gtimes = {},  routemarkers = [], mylocation = false;
var dirnRoadClick, dirnRoadDrag;

var initialLocation;
var browserSupportFlag = new Boolean();

function addControls(text, title, fn){

    addControl('Home', 'Locate me', function(){
        locateme();
    }, google.maps.ControlPosition.TOP_LEFT);
    addControl('Luxembourg', 'Luxembourg', function(){
        locate('lux');
    }, google.maps.ControlPosition.TOP_LEFT);
    
    $.each(FILTERS, function(id, o){
        //html.push('<span>' + o.label + ': <input type="checkbox" id="cat_' + id + '" /></span>');
        addControl(o.label, o.label, function(status){
            if (o.fn) {
                o.fn(this, id);
            } else {
                selcat(this, id, status);
            }
        });
    });
}
function addControl(text, title, fn, position){
    var c = $('<div class="gm-control" title="' + title + '"></div>');
    //var input = c.append('<input type="checkbox" style="vertical-align: middle; ">');
    c.append('<label style="vertical-align: middle; cursor: pointer; ">' + text + '</label>');
    google.maps.event.addDomListener(c[0], 'click', function(e){
        //$(e.target)
        var b = !$(this).hasClass('gm_selected');
        if (b) {
            $(this).siblings().removeClass('gm_selected');
            $(this).addClass('gm_selected');
        }else{
			//disable
			$(this).removeClass('gm_selected');
		}
		fn(b);
    });
    map.controls[position || google.maps.ControlPosition.BOTTOM_CENTER].push(c[0]);   
}

function initialize(){
    places.lux = new google.maps.LatLng(49.62672481765915, 6.24847412109375);
    
    var myOptions = {
        zoom: 10,
        center: places.lux,
        panControl: true,
        zoomControl: true,
        scaleControl: true,
        scaleControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT
        },
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
            //style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    
    addControls();
    
    /*    
     
     geocoder = new GClientGeocoder();
     //geocoder = new GClientGeocoder(new GGeocodeCache());
     if (options.memo) {
     var c = getCookie();
     if (c) {
     map.setCenter(new GLatLng(c.lat, c.lng), c.zoom, map.getMapTypes()[c.maptype]);
     }
     }
     */
    /*
     dirnRoadClick = new GDirections();
     dirnRoadDrag = new GDirections();
     //click put marker on the road
     google.maps.event.addListener(dirnRoadClick, "load", function(){
     var n = dirnRoadClick.getPolyline().getVertexCount();
     var p = dirnRoadClick.getPolyline().getVertex(n - 1);
     addMarker(p, ETF.CAT_ROUTE);
     if (options.drawDirection && routemarkers.length > 0) {
     map.addOverlay(dirnRoadClick.getPolyline());
     }
     updateMarkers();
     });
     //drag move marker on the road
     google.maps.event.addListener(dirnRoadDrag, "load", function(){
     var p = dirnRoadDrag.getPolyline().getVertex(0);
     lastmarker.setPoint(p);
     updateHtml(lastmarker);
     updateMarkers();
     });
     function addMarker(point, category){
     var index = routemarkers.length;
     var o = {
     index: index,
     category: category,
     lat: point.lat(),
     lng: point.lng()
     };
     var marker = createMarker(point, o, category, {
     draggable: true,
     icon: getIconCafe()
     });
     marker.index = index;
     routemarkers.push(marker);
     google.maps.event.addListener(marker, "dragend", function(point){
     lastmarker = marker;
     var p = marker.getPoint();
     if (options.nearRoad) {
     dirnRoadDrag.loadFromWaypoints([p.toUrlValue(6), p.toUrlValue(6)], {
     getPolyline: true
     });
     } else {
     updateHtml(marker);
     updateMarkers();
     }
     });
     }
     google.maps.event.addListener(map, "click", function(overlay, point, overlaylatlng){
     if (overlay) {
     return false;
     }
     if (options.nearRoad) {
     var sp = (routemarkers && routemarkers.length > 0) ? (routemarkers[routemarkers.length - 1].getPoint()) : point.toUrlValue(6);
     dirnRoadClick.loadFromWaypoints([sp, point.toUrlValue(6)], {
     getPolyline: true
     });
     } else {
     addMarker(point, ETF.CAT_ROUTE);
     }
     });
     */
}
function locate(place){
    if (place) {
        if (places[place]) {
            map.setCenter(places[place]);
        }
    } else {
        locateme();
    }
}
function locateme(){
    // Try W3C Geolocation (Preferred)
    if (navigator.geolocation) {
        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position){
            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            map.setCenter(initialLocation);
        }, function(){
            handleNoGeolocation(browserSupportFlag);
        });
        // Try Google Gears Geolocation
    } else if (google.gears) {
        browserSupportFlag = true;
        var geo = google.gears.factory.create('beta.geolocation');
        geo.getCurrentPosition(function(position){
            initialLocation = new google.maps.LatLng(position.latitude, position.longitude);
            map.setCenter(initialLocation);
        }, function(){
            handleNoGeoLocation(browserSupportFlag);
        });
        // Browser doesn't support Geolocation
    } else {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
    }
    
    function handleNoGeolocation(errorFlag){
        if (errorFlag == true) {
            alert("Geolocation service failed.");
            initialLocation = newyork;
        } else {
            alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
            initialLocation = siberia;
        }
        map.setCenter(initialLocation);
    }
}

function detectBrowser(){
    var useragent = navigator.userAgent;
    var mapdiv = document.getElementById("map_canvas");
    
    if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1) {
        mapdiv.style.width = '100%';
        mapdiv.style.height = '100%';
    } else {
        mapdiv.style.width = '600px';
        mapdiv.style.height = '800px';
    }
}
var singleTip = null;
function closewindow(){
	if (singleTip) {
		singleTip.close();
	}
}
function createMarker(point, data, category, options){
    var p;
    if (point && point.lat && typeof point.lat !== 'function') {
        p = new google.maps.LatLng(point.lat, point.lng);
    } else {
        p = point;
    }
    var opt = {};
    if (typeof options === 'function') {
        opt = options(point, data, category);
    } else {
        opt = options || {};
    }
    
    opt = $.extend(opt, {
        position: p,
        title: '',
        map: map,
        draggable: true
    });
    var marker = new google.maps.Marker(opt);
    marker.category = category;
    marker.data = data;
    var html = getHtml(marker, category);
    if (html) {
        function openwindow(){
            marker.tip = new google.maps.InfoWindow({
				html:html,
				maxWidth: 200
			});
			//marker.tip.setContent(html);
			marker.tip.open(map, marker);
			singleTip=marker.tip;
        }
		function opensinglewindow(){
			if (!singleTip) {
				singleTip = new google.maps.InfoWindow();
			}
			singleTip.setContent(html);
			singleTip.open(map, marker);
			//maxWidth: 200
        }

		var b = opt.windowbehavior||'mouseover';
		if (b=='click'){
			google.maps.event.addListener(marker, "click", openwindow);
			google.maps.event.addListener(map, 'click', closewindow);
		}else{
			google.maps.event.addListener(marker, 'mouseover', opensinglewindow);
			google.maps.event.addListener(marker, 'mouseout', closewindow);
			google.maps.event.addListener(map, 'click', closewindow);
		}
    }
    //map.addOverlay(marker);
    gmarkers[category]=gmarkers[category]||[];
	gmarkers[category].push(marker);
    return marker;
}
