var gmarkers = [];
var ETF = {
    CAT_CAMS: 'cams',
    CAT_POSITION: 'position',
    CAT_ROUTE: 'route',
    CAT_TIMES: 'times',
    CAT_DIRS: 'directions',
    CAT_TRAFFIC: 'traffic',
    CAT_PARKING: 'parking',
    CAT_BUS: 'bus'
};

var options = {
    nearRoad: true,
    drawDirection: true,
    showcontrols: false,
    memo: false
};
//0:inconnu, 1:fluide, 3:ralenti, charge, sature
var COLORS_STATUS = {
    0: '#aaaaaa',
    1: '#00FF00',
    2: '#ffc83f',
    3: '#ffe100',
    4: '#FF0000',
    5: '#000000'
};
var INEXT = (typeof chrome !== 'undefined' && typeof chrome.extension !== 'undefined');

var FILTERS = {
    cams: {
        label: 'Cameras',
        tpl: '<div class="tipcam"><a href="javascript:centeretzoom({lat},{lng})">' +
        '<img src="http://www2.pch.etat.lu/info_trafic/cameras/images/cccam_{id}.jpg" height="80" width="120"/></a><br/>' +
        '<div class="titrepopup2">{cam}:{name}</div><div class="localitepopup2">{location}</div></div>',
        url: 'data/cams.json',
        data: 'data_cams',
        markerOptions: function(point, data, category){
            console.log(data);
			return $.extend(getIconRed(), {
                name: data.titre,
                cam: data.cam || '',
                id: data.cam || '',
                location: data.localite || ''                
            });
        }
    },
    position: {
        label: 'Current Position',
        tpl: 'This is my position : {lat},{lng}'
    },
    route: {
        label: 'Route',
        tpl: ''
    },
    times: {
        label: 'Times',
        tpl: '<span>{to}</span><span>{duration}</span><br/>',
        tplAll: '<table border="0" cellpadding="0" cellspacing="0"><tr><td width="100%" class="EWTitle" nowrap>{title}<\/td><\/tr><tr><td nowrap>{content}<\/td><\/tr><\/table>',
        markerOptions: function(point, data, category){
            return $.extend(getIconPause(), {
                title: data.name || ''
            });
        },
        mapping: function(input){
            var json = {
                markers: []
            };
            jQuery.each(timesCoords, function(i, data){
                json.markers.push({
                    location: i,
                    name: data.name,
                    lat: data.from.lat,
                    lng: data.from.lng
                });
            });
            return json;
        }
    },
    directions: {
        label: 'Directions',
        tpl: '<span class="mdir">{name}</span>',
        markerOptions: function(point, data, category){
            return $.extend(getIconBlueTiny(), {
                title: data.name || ''
            });
        },
        mapping: function(input){
            var json = {
                markers: []
            };
            jQuery.each(dirCoords, function(i, data){
                json.markers.push({
                    location: i,
                    name: i,
                    lat: data.lat,
                    lng: data.lng
                });
            });
            return json;
        }
    },
    traffic: {
        label: 'Traffic',
        fn: function(el){
            showTraffic(el);
        },
        tpl: ''
    },
    parking: {
        label: 'Parkings',
        tpl: '<div class="tip-parking">'+
		'<p>[{id}]Parking {name} - {status}</p>'+
		'<p>{percent}% : {actuel}/{total} <img src="{urlTendance}"/>::{tendance}</p>'+
		'<p><a target="_blankp" href="{url}"><img width="100px" src="{pic}"/></a></p>'+
		'</div>',
        url: 'http://service.vdl.lu/rss/circulation_guidageparking.php',
        options: {
            dataType: 'xml'
        },
        path: 'responseJson.rss.channel.item',
        data: 'data_parking',
        markerOptions: function(point, data, category){
			return $.extend(getIconRed(), {
                name: data.name,
                id: data.id || '',
                location: data.location || ''
            });
        },
        mapping: function(input){
            var json = {
                markers: []
            };
            
            jQuery.each(input, function(i, data){
                //for tpl
				if (data.id==19){
					console.log(data);
				}
				var o = {
					total: parseInt(data['vdlxml:total'],10),
					actuel: parseInt(data['vdlxml:actuel'],10),
					tendance: parseInt(data['vdlxml:tendance'],10),
					ouvert: data['vdlxml:ouvert'],
					complet: data['vdlxml:complet']
				};
				var percent= Math.round((o.actuel*100)/o.total);
				var status = (o.complet==1)?'Complet':((o.ouvert==1)?'Ouvert':'Fermé');
				var pt = 'flat';
				if (o.tendance > 0) {
					pt = 'up';
				} else if (o.tendance < 0) {
					pt = 'down';
				}
				var urlTendance= 'http://service.vdl.lu/export/graphics/arrow_'+pt+'.png';
                json.markers.push({
                    id: data.id||i,
					url:(data.guid)?('http://www.vdl.lu/index.php?id=11640&start=no&vdl_f=detail&vdl_id='+data.guid):'',
					location: data.title,
                    name: data.title,
                    lat: data['vdlxml:localisation']['vdlxml:localisationLatitude'],
                    lng: data['vdlxml:localisation']['vdlxml:localisationLongitude'],
					pic: data['vdlxml:divers']['vdlxml:pictureUrl'],
					total:o.total,
					actuel:o.actuel,
					status: status,
					tendance: o.tendance,
					urlTendance:urlTendance,
					percent:percent
                });
            });
            return json;
        }
    },
    bus: {
        label: 'Bus',
        tpl: ''
    }
};

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
        //jQuery("#wrapper").width(m.w).height(m.h);
    }
}

var dirnRoute;
//route with geocoding
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
        var d = dirnRoute.getDuration();
        console.log(d.html);
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

function showTraffic(box){
    if (box.checked) {
        //TODO: setInteral
        req('updateservices', onUpdateServices);
    } else {
        clearTraffic();
    }
}


function getHtmlTimes(marker, category, location){
    var content = '';
    jQuery.each(timeMappings, function(id, o){
        if (o.from === location) {
            content += fillTpl(FILTERS.times.tpl, o);
        }
    });
    var html = fillTpl(FILTERS.times.tplAll, {
        title: location,
        content: content
    });
    return html;
}
function getHtml(marker, category){
    var html = '';
    if (category === ETF.CAT_TIMES) {
        html = getHtmlTimes(marker, category, marker.data.location);
    } else {
        html = fillTpl(FILTERS[category || marker.category].tpl || '', marker.data);
    }
    return html;
}
function updateHtml(marker){
    marker.bindInfoWindowHtml(getHtml(marker));
}
function updateTime(marker){
    if (marker.data) {
        marker.duration = gtimes[marker.data.location] || '';
    }
}

var ewindows = [];
function addOverlayWindows(){
    var ewindow = new EWindow(map, E_STYLE_7, 'lib/map/ewindow/');
    map.addOverlay(ewindow);
    ewindows.push(ewindow);
    return ewindow;
}

var elprev = {};
function overwindow(event){
    var cat = event.data.category;
    if (elprev[cat]) {
        elprev[cat].css('z-index', 'auto');
    }
    var el = jQuery(this);
    el.css('z-index', 9999);
    elprev[cat] = el;
}

function selcat(box, category, status){
    if (status || box.checked) {
        showcat(category);
    } else {
        hidecat(category);
    }
    // == rebuild the side bar
    makeSidebar();
}

function showcat(cat){
    if (!FILTERS[cat].rendered) {
        renderMarker(cat, function(){
            displaycat(cat);
        });
    } else {
        displaycat(cat);
    }
}
function displaycat(category){
    jQuery(gmarkers).each(function(i, marker){
        if (marker.category === category) {
            marker.show();
            updateTime(marker);
            marker.ewindow = addOverlayWindows();
            jQuery(marker.ewindow.div1).bind('mouseover', {
                category: category
            }, overwindow);
            var html = getHtml(marker, category);
            marker.ewindow.openOnMarker(marker, html);
        }
    });
    document.getElementById('cat_' + category).checked = true;
}

function hidecat(category){
    jQuery(gmarkers).each(function(i, marker){
        if (marker.category === category) {
            marker.hide();
            if (marker.ewindow) {
                marker.ewindow.hide();
            }
        }
    });
    document.getElementById('cat_' + category).checked = false;
    // == close the info window, in case its open on a marker that we just hid
    map.closeInfoWindow();
}

function makeSidebar(){
    var el = jQuery('#sidebar_cats');
    el.html('');
    jQuery.each(timeMappings, function(key, o){
        jQuery('<a id="' + o.vid + '" href="#">' + o.text + '</a>').click(function(){
            var id = o.vid;
            renderRoute(id, o);
            el.find('.selected').each(function(){
                if (routes[this.id]) {
                    routes[this.id].clear();
                    delete routes[this.id];
                }
                jQuery(this).removeClass('selected');
            });
            jQuery(this).addClass('selected');
        }).appendTo(el).after('<br>');
    });
}

var jams = [];
function onUpdateServices(fragments){
    //TODO : color polyline (use direction.getPolyline to be smoother ?)
    //http://www.birdtheme.org/useful/googletool.html
    //http://code.google.com/apis/maps/documentation/utilities/polylineutility.html
    clearTraffic();
    jQuery.each(fragments, function(i, f){
        //statusId 0 inconnu, 1 : fluide ->  5?charge
        jams.push(drawPolyline(f.from, f.to, f.status));
    });
}
//Delete polylines
function clearTraffic(){
    jams = jams || [];
    jQuery.each(jams, function(i, jam){
        map.removeOverlay(jam);
    });
    jams = [];
}


function renderMarker(cat, cb){
	var f = FILTERS[cat];
	if (f && f.url) {
		if (INEXT) {
			getJSON(f.url, function(json){
				var o = json;
				if (f.path){
					var segs = f.path.split('.');
					$.each(segs, function(i,seg){
						if (seg) {
							o = o[seg] || {};
						}
					});
				}
				if (f.mapping) {
					o = f.mapping(o);
				}
				renderMarkers(o, cat);
				if (cb) {
					cb();
				}
			},f.options||{});
		} else {
			var o = window[f.data];
			/*if (f.mapping) {
				o = f.mapping(o);
			}*/
			renderMarkers(window[f.data], cat);
			if (cb) {
				cb();
			}
		}
		FILTERS[cat].rendered = true;
	}
}

function renderMarkers(json, category, options){
    options=options||FILTERS[category].markerOptions;
	jQuery(json.markers).each(function(i, marker){
        createMarker(marker, marker, category, options);
    });
    jQuery(json.lines).each(function(i, line){
        var pts = [];
        for (var j = 0; j < line.points.length; j++) {
            pts[j] = new GLatLng(line.points[j].lat, line.points[j].lng);
        }
        map.addOverlay(new GPolyline(pts, line.colour, line.width));
    });
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
    var out = JSON.stringify(o);
    
    out += logDirection(dirnRoadDrag);
    out += logDirection(dirnRoadClick);
    
    jQuery('#jmarkers').html(out);
}


function getJSON(url, cb, opt){
    if (INEXT) {
        opt = opt || {};
        opt.url = url;
        req('xhr', cb, opt);
    } else {
        GDownloadUrl(url, cb);
    }
}