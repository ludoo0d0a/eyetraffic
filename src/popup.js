/**
 * Main popup
 *
 * @author Ludovic Valente
 * @web pitaso.com
 * @web xeoos.fr
 */
//UTF8: é
var isDebug = false, values = [], prefs, tid, disabled=false;

//var backgroundPage = chrome.extension.getBackgroundPage();
function initPopup(){
    var mapsel = localStorage.getItem('tab-maps')||'map-tomtom';
    var camsel = localStorage.getItem('tab-cams')||'cam-A1';
    var timesel = localStorage.getItem('tab-times')||'time-FRANCE';
    
    jQuery('#times').tabs({
        activate: function(event, ui){
            var gid='tab-times', id = ui.newPanel[0].id;
    		localStorage.setItem(gid,id);
        }
    });
    jQuery('#cams').tabs({
        activate: function(event, ui){
            loadContent(ui.newPanel, 'tab-cams');
        }
    });

	jQuery('#maps').tabs({
        activate: function(event, ui){
            loadContent(ui.newPanel, 'tab-maps');
        }
    });
    
    i18n();
    if (isDebug) {
        jQuery('.debug').removeClass('debug');
    }
    $('#_status').click(function(){
    	startStatus(true);
    });
    
    
    updateOnce();
    jQuery('#refresh').button().click(update);
    jQuery('#convert').button().click(convert);
    
    //load first tab
    selectTab('times', timesel);
    selectTab('maps', mapsel);
    selectTab('cams', camsel);

    startStatus();
}
function startStatus(toggle){
	var bstatus = localStorage.getItem('status')||'';
	if (toggle){
		bstatus=(bstatus)?'':'disabled';
	}
	if (bstatus){
		//Stop
		disabled=true;
		bstatus='disabled';
		clearInterval(tid);
		tid=0;
	}else{
		//Start
		disabled=false;
		bstatus='';
		window.setTimeout(function(){
	        update();
	        tid = window.setInterval(update, 30000);
	    }, 1000);
	}
	disableBadge(bstatus);
	localStorage.setItem('status', bstatus);
}

function disableBadge(disabled){
	var badgeid = (prefs) ? prefs.badge.id : false;
	//Stop tictac
    //Disable badge
    req('status', function(a){
        
    }, {
        disabled:disabled,
        id: badgeid
    });
}
function selectTab(tabId, mapsel){
    var tabEl=$('#'+tabId), gid='tab-'+tabId;
    var i = $('#'+mapsel).prevAll('.tab-content').length;
    if (i==0){
    	tabEl.tabs( "load", 1 );
    	var panel1 = $('.tab-content',tabEl).first();
    	loadContent(panel1, gid);
    }
    tabEl.tabs('option', 'active', i);
}
function loadContent(panel, gid){
    var id = panel[0].id;
    localStorage.setItem(gid,id);
    loadHtml(panel, id);
}
function updateOnce(){
    req('prefs', function(p){
        prefs = p;
        setTimeout(function(){
        	createCams(false)
        });
        if (p.options){
        	//Display at open
        	setTimeout(function(){
        		onUpdateFlashs(p.options.flash);
        	},100);
        }
    });
}

function update(){
    if (disabled){
    	return ;
    }
    req('updatetimes', onUpdateTimes);
	//req('updateservices', onUpdateServices);
    req('updatealerts', onUpdateAlerts);
    req('updateflashs', onUpdateFlashs);
    //req('updatetunnel', onUpdateTunnel);
    updateCams();
    renderPlots();
}

function changebadgeref(event){
    var id = event.data.id;
    req('updateprefs', function(p){
        //alert('Change done!');
        jQuery('#times').find('a.selected').removeClass('selected');
        jQuery('#lk' + id).addClass('selected');
        prefs = p;
        renderPlots();
    }, {
        badge: {
            id: id
        }
    });
}

function renderPlots(){
    var badgeid = (prefs) ? prefs.badge.id : false;
    req('history', function(a){
        $('#history').sparkline(a.values, {
            fillColor: false,
            normalRangeMin: a.limit.orange,
            normalRangeMax: a.limit.red,
            normalRangeColor: '#FDFF94'
        });
        var last = a.values[a.values.length - 1];
        $('#history').attr('title', 'History on last hour - ' + last + 'min - Orange:' + a.limit.orange + 'min - Red:' + a.limit.red + 'min');
    }, {
        id: badgeid
    });
}

function onUpdateServices(fragments){
	//TODO : color polyline (use direction.getPolyline to be smoother ?)
	//http://www.birdtheme.org/useful/googletool.html
	//http://code.google.com/apis/maps/documentation/utilities/polylineutility.html
	/*jQuery.each(fragments, function(i, t){
       //statusId 1 : fluide ->  
    });*/
}

function onUpdateTimes(fragments){
    var badgeid = (prefs) ? prefs.badge.id : false;
    jQuery.each(fragments, function(zone, times){
        var el = jQuery('#time-' + zone);
        if (el) {
            el.html('');
            jQuery.each(times, function(i, t){
                //var label = (timeMappings[t.id]) ? (timeMappings[t.id].text) : t.code;
				//label += '(' + t.id + ')';
				var label = t.text;
                var link = jQuery('<a href="#" id="lk' + t.id + '">' + label + '</a>').bind('click', {
                    id: t.id
                }, changebadgeref);
                if (badgeid == t.id) {
                    link.addClass('selected');
                }
                link.appendTo(el);
                el.append(' : ' + t.time + '<br/>');
            });
        }
    });
}

var xtplAlert;
function onUpdateAlerts(channel){
    if (channel && channel.item) {
        jQuery('#alert').html('');
        items = channel.item;
        if (!jQuery.isArray(items)) {
            items = [items];
        }
        if (!xtplAlert) {
            xtplAlert = tplAlert;
            //xtplAlert = $.template(tplAlert);
        }
        jQuery.each(items, function(i, item){
            //title,description,pubDate
        	var d = getMoment(item.pubDate);
            item.date = d.fromNow();
            item.description =item.description||''; 
            var output = Mustache.render(xtplAlert, item);
            //jQuery('#alert').prepend(xtplAlert, item);
            jQuery('#alert').prepend(output);
        });
    } else {
        jQuery('#alert').html(LANG.NOTRAFFICINFO);
    }
}

function onUpdateFlashs(news){
    if (news) {
        var html = '<span class="title">' + news.title + '</span><br/>' + news.content;
        jQuery('#flashinfo').html(html).show();
    } else {
        jQuery('#flashinfo').html('').hide();
    }
}

function onUpdateTunnel(o){
    if (o) {
        jQuery.each(o.data, function(i, a){
			jQuery('#tu_'+i).text(a.current+'min');
			jQuery('#tu_'+i).css('background-color', o.colors[i]);
		});
    }
}


function req(message, cb, data){
    if (chrome.extension) {
        var o = data || {};
        o.message = message;
        chrome.extension.sendRequest(o, cb);
    }
}

function updateCams(){
    jQuery('.izi').each(function(i, a){
        var img = jQuery(a).find('.icam');
        if (img && img.id) {
            var url = getUrlCam(img.id.replace('icam', ''));
            img.attr('src', url);
            a.href = url;
        }
    });
}

function getUrlCam(id){
    return urlCam.replace('{0}', id).replace('{1}', (new Date()).getTime());
}

function getUrlMap(id){
    return urlMap.replace('{0}', id);
}

function createCams(static){
    var i = 0;
    jQuery.each(dcams, function(road, dcam){
        var el = jQuery('#cam-' + road);
        if (el) {
            createMenuCams(el, dcam);
            createImageCams(el, dcam, true, static);
            createImageCams(el, dcam, false, static);
            var url = getUrlMap(road);
            var div = jQuery('<div class="body zmap"><img src="' + url + '"/></div>').hide();
            el.append(div);
        }
    });
    
    
    jQuery('a.izi').fancyZoom({
    	directory:'images/fancyzoom',
    	overlay:0.8,
    	scaleImg: true,
    	closeOnClick: true
    });
}

function createMenuCams(el, dcam){
    var nav = jQuery('<div class="nav"></div>');
    console.log(dcam.start + ',' + dcam.end);
    var ain = jQuery('<a class="ain selected">' + dcam.start + '-' + dcam.end + '</a>').attr('href', '#').click(changeMenuCams);
    var aout = jQuery('<a class="aout">' + dcam.end + '-' + dcam.start + '</a>').attr('href', '#').click(changeMenuCams);
    var amap = jQuery('<a class="amap">' + LANG.map + '</a>').attr('href', '#').click(changeMenuCams);
    nav.append(ain).append('&nbsp;&nbsp;&nbsp;').append(aout).append('&nbsp;&nbsp;&nbsp;').append(amap);
    el.append(nav);
}

function changeMenuCams(e){
    var el = jQuery(e.target);
    if (el.hasClass('selected')) {
        return;
    }
    var id = el.get(0).className.replace(/^a/, '');
    var content = el.parents('.ui-tabs-panel');
    content.find('a').removeClass("selected");
    el.addClass("selected");
    content.find('.body').hide();
    content.find('.z' + id).show();
}

function createImageCams(el, dcam, isin, static){
    var txt = ((isin) ? 'in' : 'out'), html = '<div class="body z' + txt + '">';
    //var div = jQuery('<div class="body z' + txt + '"></div>');
    jQuery.each((isin) ? dcam.camsin : dcam.camsout, function(id, cam){
        var u = (static) ? urlCamNa : getUrlCam(id), t = id + ' - ' + cam.text;
        html += '<div class="cam">' +
        '<a class="izi" href="#fz'+id+'" title="'+t+'">' +
        '<img class="icam" alt="'+cam.text+'" id="icam'+id+'" src="'+u+'"/>' +
        '</a>' +
        
        '<div class="fzc" id="fz'+id+'" style="display:none;">' +
        '<img src="'+u+'"/>' +
        '<div class="overlay-text">'+cam.text+'</div>'+
        '</div>' +
        
        '<span>' +
        cam.text +
        '</span></div>';
        //alert(id+':'+cam.text);
        //div.append('<div class="cam">' + id +' - ' + cam.text +'</div>');
    });
    html += '</div>';
    //el.html(html);
    var nel = jQuery(html);
    el.append(nel);
    
    nel.toggle(isin);
}

function xhr(a, cb){
    if (typeof chrome !== 'undefined' && typeof chrome.extension !== 'undefined') {
        a.message = 'xhr';
        chrome.extension.sendRequest(a, cb);
    } else {
        /*a.success = cb;
         a.type = a.method;
         $.ajax(a);*/
    }
}

function getHtml(id){
    if (id === 'map-bison') {
        var url = 'http://www.bison-fute.equipement.gouv.fr/astec_acai/internet/ie1_myrabel.html?langue=fr&evt=1';
        //return '<iframe src="'+url+'" frameborder="0" scrolling="no" width="590" height="480"></iframe>';
        return writeIframe(id,url,590,480);
    } else if (id === 'map-tomtom') {
        var w = 590 + 360;
		var url = 'http://routes.tomtom.com/map/?center=49.490%2C5.980&zoom=8&map=basic';
		//return '<div id="tomtomwrap"><div id="tomtomoffset"><iframe src="'+url+'" frameborder="0" scrolling="no" width="'+w+'" height="480"></iframe></div></div>';
		return writeIframe(id,url,w,480);
    }else if (id === 'map-custom') {
		var url = 'maps.html';
		//return '<div id="goowrap"><div id="goooffset"><iframe src="'+url+'" frameborder="0" scrolling="no" width="'+w+'" height="480"></iframe></div></div>';
		return writeIframe(id,url,590,480);
    } else if (id === 'map-cita') {
	   var url = 'http://www.cita.lu',w=600,h=444;
	   return writeIframe(id,url,w,h);
     } else if (id === 'map-tunnel') {
        return '<img src="http://tunnel.cita.lu/img/trajets-map.png" height="350"/>';
    } else if (id === 'map-google') {
       var url = 'gmap.html',w=630,h=380; //same as CSS #gmap
	   return writeIframe(id,url,w,h);
    }else if (id === 'map-ir57') {
		var w = 2000, h=2000;
		var url = 'http://www.inforoute57.fr';
		//return '<div id="irwrap"><div id="iroffset"><iframe src="'+url+'" frameborder="0" scrolling="no" width="'+w+'" height="'+h+'"></iframe></div></div>';
		return writeIframe(id,url);
    
    } else if (id === 'map-rtl') {
		var html = '<div id="ctn-map-rtl" style="position: relative; left: 0px; top: 0px; z-index: 0; height:620px;">';
html += '<div style="width: 288px; height: 307px; position: absolute; left: 4px; top: 307px; "><img style="width: 288px; height: 307px; " src="http://images.newmedia.lu/trafic_map/tiles/2x/complete2_2x_2_6.png"></div>';
html += '<div style="width: 288px; height: 307px; position: absolute; left: 292px; top: 307px; "><img style="width: 288px; height: 307px; " src="http://images.newmedia.lu/trafic_map/tiles/2x/complete2_2x_3_6.png"></div>';
html += '<div style="width: 288px; height: 307px; position: absolute; left: 292px; top: 0px; "><img style="width: 288px; height: 307px; " src="http://images.newmedia.lu/trafic_map/tiles/2x/complete2_2x_3_5.png"></div>';
html += '<div style="width: 288px; height: 307px; position: absolute; left: 4px; top: 0px; "><img style="width: 288px; height: 307px; " src="http://images.newmedia.lu/trafic_map/tiles/2x/complete2_2x_2_5.png"></div>';
html += '</div>';
html += '<script>refreshMapRtl();setInterval(refreshMapRtl,10000);</script>';
return html;
		
		//return '<img id="img-'+id+'"" />'+
		//'<script>refreshMapRtl();setInterval(refreshMapRtl,10000);</script>';
		
    } else if (id === 'map-mobilinfo') {
		var w=800, h=600;
		var url = 'http://www.mobilinfo.be/mobilinfo/';
		return writeIframe(id,url,w,h,'http://trafic.lesoir.be');
    } else if (id === 'map-wallonie') {
		var w=800, h=670;
		var url = 'http://trafiroutes.wallonie.be/trafiroutes/maptempsreel/';
		return writeIframe(id,url,w,h);
    } else if (id === 'map-verkehrsinfo') {
		var w=800, h=670;
		var url = 'http://www.verkehrsinfo.de';
		return writeIframe(id,url,w,h);
    }  else if (id === 'map-swr3') {
		var w=800, h=670;
		var url = 'http://www.swr3.de/info/verkehr/stauanzeige/SWR3-Verkehrszentrum/-/id=64076/did=929404/urt9vu/index.html';
		return writeIframe(id,url,w,h);
    }else {
        return '';
    }
}
function writeIframe(id,url,w,h,page){
	w=w||800;
	h=h||600;
	page=page||url;
	var html='<div class="overview"><a target="blank" href="'+page+'">Source</a></div>';
	html+='<div class="mwrap"><div class="moffset"><iframe src="'+url+'" frameborder="0" scrolling="no" width="'+w+'" height="'+h+'"></iframe></div></div>';
	return html;
}
function renderCita(){
	var map = new OpenLayers.Map({
	    div: "map-cita-ol",
	    layers: [
	        new OpenLayers.Layer.WMS(
	            "WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0",
	            {layers: "basic"}
	        ),
	        new OpenLayers.Layer.Vector("KML", {
	            strategies: [new OpenLayers.Strategy.Fixed()],
	            protocol: new OpenLayers.Protocol.HTTP({
	                url: "http://www.cita.lu/kml/services_axe.kml?src=EyeTraffic",
	                format: new OpenLayers.Format.KML({
	                    extractStyles: true, 
	                    extractAttributes: true,
	                    maxDepth: 2
	                })
	            })
	        })
	    ],
	    center: new OpenLayers.LonLat(6.13, 49.61),
	    zoom: 11
	});

}
function loadHtml(el, id){
    if (!el){
    	el = $('#' + id);
    }
    if (!el.attr('loaded')) {
        var html = getHtml(id);
        if (html) {
            el.html(html);
        }
        el.attr('loaded', 1);
    }
}

function convert(){
    xhr({
        method: 'GET',
        url: 'data/cams.xml',
        dataType: 'xml'
    }, function(xhr){
        var o = JSON.parse(xhr.responseJson);
        var r = {
            markers: []
        };
        jQuery.each(o.markers.marker, function(i, marker){
            var html = Base64.decode(marker['@html']);
            var cam, titre, localite, label = '';
            
            var m = /cccam_(\d+)/.exec(html);
            if (m && m[1]) {
                cam = parseInt(m[1], 10);
            }
            
            m = /titrepopup2\">([^<]+)/.exec(html);
            if (m && m[1]) {
                titre = m[1];
            }
            
            m = /localitepopup2\">([^<]+)/.exec(html);
            if (m && m[1]) {
                localite = m[1];
            }
            
            label = 'Camera ' + cam + '-' + titre + ',' + localite;
            
            //lat,lng,html
            r.markers.push({
                lat: parseFloat(marker['@lat'], 10),
                lng: parseFloat(marker['@lng'], 10),
                html: html,
                cam: cam,
                titre: titre,
                localite: localite,
                label: label
            });
        });
        jQuery('#res').val(JSON.stringify(r));
    });
}

function i18n(){
	function upd(id){
		jQuery('#'+id).text(LANG[id]);
	}
	upd('refresh');
	upd('_info');
	upd('_times');
	upd('_cams');
	upd('_maps');
    
}

function refreshMapRtl(){
	/*var url = 'http://images.newmedia.lu/trafic_map/feature.jpg';
	jQuery('#img-map-rtl').attr('src',url+'?r='+rnd);
	*/
	jQuery('#ctn-map-rtl img').each(function(i,el){
		var url=jQuery(el).attr('src');
		if (url){
			var rnd = Math.round(1+Math.random()*10000);
			url = url.replace(/\?r=.*/,'')+'?r='+rnd;
			jQuery(el).attr('src',url);
		}
	});
	
}


$(function() {
  initPopup();
});