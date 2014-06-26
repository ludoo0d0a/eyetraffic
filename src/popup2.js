/**
 * Main popup
 *
 * @author Ludovic Valente
 * @web pitaso.com
 * @web xeoos.fr
 */
//UTF8: é
(function( $ ) {
var isDebug = false, mapcams = false, /*lastCamId=0 ,*/ lastCamRoad='', values = [], prefs, tid, disabled=false;
moment.lang(lang);
//var backgroundPage = chrome.extension.getBackgroundPage();
function initPopup(){
    resizePopup();
    
    $('#refresh').click(updateData);
    //Click title open main
    $('.time-title').click(openmain);
    //Click cam open main
    $('.cam').click(openmain);
        
    i18n();
    startStatus();
}

function onNothing(){
}

function updateData(){
    if (disabled){
    	return ;
    }
    var animateClass='glyphicon-refresh-animate', el = $('#refresh');
    el.addClass(animateClass);
    window.setTimeout(function(){
	    req('updatetimes', onUpdateTimes, {single:true});
	    req('updatealerts', onUpdateAlerts, {chantiers:false});
	    req('updateflashs', onUpdateFlashs);

	    req('popupstatus', function(o){
	        loadMap(o.map);
	    	updateCams(o.cam);
	        window.setTimeout( function() {
	        	el.removeClass(animateClass);
	        }, 500 );
	    });
	    
    }, 100);
    
}

function openmain(){
	var url = chrome.extension.getURL('popup.html');
	window.location.href = url;
	chrome.tabs.create({url:url});
}

function resizePopup(){
	$(window.document.body).height($('.panel-menu').height());
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
	        updateData();
	        tid = window.setInterval(updateData, 30000);
	    }, 200);
	}
	disableBadge(bstatus);
	localStorage.setItem('status', bstatus);
	$(document.body).toggleClass('disabled', disabled);
	$('#_status').text(disabled?'On':'Off');
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

function changebadgeref(event){
    var id = event.data.id;
    req('updateprefs', function(p){
        //alert('Change done!');
        $('#times').find('a.selected').removeClass('selected');
        $('#lk' + id).addClass('selected');
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
	/*$.each(fragments, function(i, t){
       //statusId 1 : fluide ->  
    });*/
}

function onUpdateTimes(o){
    var badgeid = (prefs) ? prefs.badge.id : false;
    var t = o.time,text = '...';
    if (t){
    	text = t.text+' : '+t.time;
    }
    $('.time-title').html(text);
}

var xtplAlert;
function onUpdateAlerts(channel){
    var r = [], el = $('#alerts');
    if (channel && channel.item) {
        items = channel.item;
        if (!$.isArray(items)) {
            items = [items];
        }
        if (!xtplAlert) {
            xtplAlert = tplAlert;
        }
        $.each(items, function(i, item){
            r.push(formatAlert(item, xtplAlert));
        });
    } 
    var pb = $('#main .panel-body');
    if (r && r.length>0){
    	el.html(r.join(''));
    	pb.removeClass('hide-al');
    }else{
    	el.html(LANG.NOTRAFFICINFO);
    	pb.addClass('hide-al');
    }
}
function formatAlert(item, tpl){
	//title,description,pubDate
	var d = getMoment(item.pubDate);
    item.date = d.fromNow();
    item.description = item.description||'';
    item.title = item.title||'';
    var output = Mustache.render(tpl, item);
    //el.prepend(output);
    return output;
}
function onUpdateFlashs(news){
    var el = $('#flashinfo'), pb = $('#main .panel-body');
    console.log('flashinfo ');
    console.log(news);
    if (news) {
        var html = '<span class="title">' + news.title + '</span><br/>' + news.content;
        el.html(html);
        pb.removeClass('hide-fi');
    } else {
        el.html('');
        pb.addClass('hide-fi');
    }
}

function onUpdateTunnel(o){
    if (o) {
        $.each(o.data, function(i, a){
			$('#tu_'+i).text(a.current+'min');
			$('#tu_'+i).css('background-color', o.colors[i]);
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


function getUrlCam(id){
    return urlCam.replace('{0}', id).replace('{1}', (new Date()).getTime());
}

function getUrlMap(id){
    return urlMap.replace('{0}', id);
}

function updateCams(cam){
	prefetchcams();
	//Render default, if nothing 
	cam=cam||{};
	cam.road=cam.road||'A3';
	cam.dir=cam.dir||'in';
	
	//Same road do not need to render again
	if (lastCamRoad==cam.road) return;
	
	//lastCamId = cam.id;
    var i=0, r =[],s =[]; 
    
    //No dir
    var cams = $.extend(dcams[cam.road]['camsin'] ,dcams[cam.road]['camsout']);
    
    if (cams){
	    //$('#carousel-cam').destroy();
	    
	    if (!$('#carousel-cam').hasClass('carousel')){
		    //console.log('create carousel html');
		    $('#carousel-cam').addClass('carousel slide').attr('data-ride', 'carousel' ).append(
						  '<ol class="carousel-indicators"></ol>'+
						  '<div class="carousel-inner"></div>'+
						  '<a class="left carousel-control" href="#carousel-cam" data-slide="prev">'+
						    '<span class="glyphicon glyphicon-chevron-left"></span>'+
						  '</a>'+
						  '<a class="right carousel-control" href="#carousel-cam" data-slide="next">'+
						    '<span class="glyphicon glyphicon-chevron-right"></span>'+
						  '</a>'+
						'</div>'
			);
	    }
	    
	    lastCamRoad = cam.road;
	    $.each(cams, function(id,cam){
	    	//console.log('cam '+id);
	    	//var clsactive = (id==lastCamId)?'active':'';
	    	var clsactive = (i==0)?'active':'';
	    	var c = mapcams[id]; //.road
	    	var url = getUrlCam(id), text = lastCamRoad+ ' ' + cam.text;
	    	//console.log('url: '+url);
	    	//console.log('text: '+text);
	    	r.push('<li data-target="#carousel-cam" data-slide-to="'+i+'" class="'+clsactive+'"></li>');
	    	s.push('<div class="item '+clsactive+'">'+
					      '<img src="'+url+'" alt="Camera">'+
					      '<div class="carousel-caption">'+text+'</div>'+
					   '</div>');
			i++;
	    });
	    $('#carousel-cam .carousel-indicators').html(r.join(''));
	    $('#carousel-cam .carousel-inner').html(s.join(''));
	    
	    //console.log('fill '+i+' rows');

	    //console.log('make carousel');
	    //console.log('lastCamRoad= '+lastCamRoad);
	    
	    var elc = $('#carousel-cam');
	    elc.carousel({
		  interval: 2000
		});
		
		elc.carousel('cycle');
		
		$(document).bind('keyup', function(e) {
	        if(e.which == 39 || e.which == 32){
	            elc.carousel('next');
	        }
	        else if(e.which == 37){
	            elc.carousel('prev');
	        }
	    });
	}
} 
function prefetchcams(){
	if (!mapcams){
		mapcams = {};
		$.each(dcams, function(road,o){
			$.each(o.camsin, function(id,cam){
				mapcams[id]=$.extend({id:id, road:road, dir:'camsin'}, cam);
			});
			$.each(o.camsout, function(id,cam){
				mapcams[id]=$.extend({id:id, road:road, dir:'camsout'}, cam);
			});
	});
	}
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

function loadMap(map){
	var html = getHtml(map) || '';
	$('#map').html(html);
}
function loadTabContent(panel, gid){
    var id = panel[0].id;
    localStorage.setItem(gid,id);
    loadHtml(panel, id);
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
        $.each(o.markers.marker, function(i, marker){
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
        $('#res').val(JSON.stringify(r));
    });
}

function i18n(){
	function _(id){
		$('#'+id).text(LANG[id]);
	}
	_('refresh');
	_('_info');
	_('_times');
	_('_cams');
	_('_maps');
    
}

$(function() {
  initPopup();
});

})( jQuery );