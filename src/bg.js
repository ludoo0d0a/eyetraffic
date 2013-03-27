//UTF8: é
var defaultPrefs = {
    badge: {
        id: 6,
        interval: 10
    },
    limit: {
        orange: 10,
        red: 20
    },
    HTMLNotif:false
};

//TODO: recheck average values on a long period
var averages = {
    1: 13,
    2: 19,
    3: 9,
    4: 19,
    5: 7,
    6: 8,
    7: 17,
    8: 8,
    9: 10,
    10: 13,
    11: 13,
    12: 18,
    13: 22,
    14: 28,
    15: 14,
    16: 19,
    17: 26,
    18: 7,
    19: 14,
    20: 18
};

var BADGE_COLOR_FLASHINFO=[250, 136, 2, 255];//#FFDA2F
var lastFlash=false;
var prefs = getPrefs();
if (!prefs) {
    setPrefs(defaultPrefs);
}
if (!prefs.limit) {
    prefs.limit = defaultPrefs.limit;
}
//var notifier = new Notifier();
var tictac;
newTictac(true);

chrome.extension.onRequest.addListener(function(a, sender, callback){
    if (a.message === 'xhr') {
        request(a, false, callback);
    } else if (a.message === 'badge') {
        updateBadge(a, callback);
    } else if (a.message === 'prefs') {
        monitorAverages();
        prefs.options = {flash:lastFlash};
        callback(prefs);
    } else if (a.message === 'updatetimes') {
        updateTimes(a, callback);
    } else if (a.message === 'updateservices') {
        updateServices(a, callback);
    } else if (a.message === 'updatealerts') {
        updateAlerts(a, callback);
    } else if (a.message === 'updateflashs') {
        updateFlashs(a, callback);
    } else if (a.message === 'getflash') {
        getFlash(a, callback);
    } else if (a.message === 'updatetunnel') {
        updateTunnel(a, callback);
    } else if (a.message === 'updateprefs') {
        updateprefs(a, callback);
    } else if (a.message === 'history') {
        getHistory(a, callback);
    } else if (a.message === 'status') {
        changeStatus(a, callback);
    }
});


var historyValues = {};
function getHistory(a, cb){
    var values = historyValues[a.id];
    //fit data of 1 hour into 20 points
    if (!values) {
        return;
    }
    
    //Limit on 1 hour for 20px
    var rangetime = 3600, rangeplots = 20;
    interval = getInterval(); //60s
    var npts = Math.max(0, Math.round(rangetime / interval));
    var len = values.length;
    var size = Math.min(len, npts);
    var step = Math.max(1, Math.round(size / rangeplots));
    var res = [], start = Math.max(0, len - npts);
    for (var i = start; i < len; i += step) {
        res.push(values[i]);
    }
    
    var limit = getLimits(a.id);
    
    cb({
        limit: limit,
        values: res
    });
}

function showAverages(){
    //console.log("Averages:");
    var av = getAverages();
    //var o = JSON.stringify(av);
    //console.log(o);
}

function monitorAverages(){
    showAverages();
    window.setInterval(showAverages, 3600000);//1h
}

function getAverages(){
    var averageValues = {};
    $.each(historyValues, function(id, values){
        var sum = 0, len = values.length;
        for (var i = 0; i < len; i++) {
            sum += values[i];
        }
        averageValues[id] = Math.round(sum / len);
    });
    return averageValues;
}

function updateprefs(a, cb){
    if (a.badge) {
        prefs = getPrefs();
        if (a.badge.id) {
            prefs.badge.id = a.badge.id;
        }
        if (a.badge.interval) {
            prefs.badge.interval = a.badge.interval;
        }
        setPrefs(prefs);
        newTictac(true);
        cb(prefs);
    }
}

function setPrefs(prefs, cleanall){
    if (cleanall) {
        localStorage.clear();
    }
    localStorage.setItem('prefs', JSON.stringify(prefs));
}

function getPrefs(){
    var id;
    var textPrefs = localStorage.getItem('prefs');
    var prefs = (textPrefs) ? JSON.parse(textPrefs) : false;
    //prefs = checkPrefs(prefs);
    return prefs;
}

function getPref(option){
    if (prefs && typeof prefs[option] !== "undefined") {
        return prefs[option];
    } else {
        return false;
    }
}

function getLimits(id){
    return (averages[id]) ? {
        red: Math.round(averages[id] * 1.7),
        orange: Math.round(averages[id] * 1.2)
    } : prefs.limit;
}

function updateBadge(a, cb){
    //Send time to badge
    var time = 0, color = 'Green', bcolor = [0, 255, 0, 255];
    
    if (a.disabled){
    	time='x';
    	color='Grey';
    	bcolor=[120, 120, 120, 255];
    }else{
    	time=parseInt(a.time, 10);
	    var limit = getLimits(a.id);
	    if (time > limit.red) {
	        color = 'Red';
	        bcolor = [255, 0, 0, 255];
	    } else if (time > limit.orange) {
	        color = 'Orange';
	        bcolor = [255, 143, 53, 255];
	    }
	    if (lastFlash){
	    	bcolor = BADGE_COLOR_FLASHINFO; 
	    }
	    
    }
    chrome.browserAction.setBadgeText({
        text: '' + time
    });
    chrome.browserAction.setBadgeBackgroundColor({
        color: bcolor
    });
    var icon = 'images/16/Box_' + color + '.png';
    chrome.browserAction.setIcon({
        path: icon
    });
    
    var map = timeMappings[a.key] || {};
    var title = '' + (map.text || '...') + '\n' + time + ' minutes';
    chrome.browserAction.setTitle({
        title: title
    });
    
    //var geo = new Geolocation();
    //geo.getCurrentPosition();
    /*if (!notifier.notify(icon, title, 'Time is ' + time + ' minutes')){
     notifier.requestPermission(function(status){
     console.log('statusPermission='+status);
     });
     }
     */
    if (cb) {
        cb(null);
    }
}
function changeStatus(a, cb){
	if (a.disabled){
		stopTictac();
	}else{
		newTictac(true);
	}
	
}
function stopTictac(){
	if (tictac) {
        window.clearInterval(tictac);
    }
}
function newTictac(forceNow){
    //console.log('newTictac-'+forceNow);
    stopTictac();
    badgeprefs = getPref('badge');
    interval = getInterval();
    //console.log('interval='+interval+';id='+badgeprefs.id);
    tictac = window.setInterval(updateBg, interval * 1000);
    if (forceNow) {
        updateBg();
    }
}
function updateBg(){
	updateTimes();
	updateFlashs();
}

function getInterval(){
    return (badgeprefs && badgeprefs.interval) ? badgeprefs.interval : 60;
}

//Niveau de services
function updateServices(a, callback){
    //Temps de parcours
    var cfg = $.extend(mcfg, {
        method: 'GET',
        url: urlService
    });
    xhr(cfg, function(xhr){
        var m, times = {}, data = xhr.responseJson;
		var a = {}, pt={};
        $.each(data.collection.niveauService, function(i, o){
           
		    /*<fileDate>2011-01-26T13:47:29+01:00</fileDate>
             <fromNodeId>2001</fromNodeId>
             <fromNodeText>Croix de Gasperich</fromNodeText>
             <id>36829</id><statusId>1</statusId>
             <statusText>Fluide</statusText>
             <streetId>A1</streetId><streetName>Autoroute de Trèves</streetName>
             <toNodeId>2002</toNodeId>
             <toNodeText>Echangeur Itzig</toNodeText>
             */
            //var map = timeMappings[o.direction]||{};
            console.log(o.fromNodeId + ':"' + o.fromNodeText + '"');
			
			a[o.fromNodeId+'_'+o.toNodeId]={
				from:o.fromNodeText,
				to:o.toNodeText
			};	
			pt[o.fromNodeText]=o.fromNodeText;					
			pt[o.toNodeText]=o.toNodeText;
        });
		console.log('aa:');
		console.log(JSON.stringify(a));
		console.log('pt:');
		console.log(JSON.stringify(pt));
    });
}

//Temps de parcours etat.lu
function updateTimes(a, callback){
    //Temps de parcours
    var cfg = $.extend(mcfg, {
        method: 'GET',
        url: urlTime
    });
    xhr(cfg, function(xhr){
        var m, times = {}, data = xhr.responseJson;
        $.each(data.collection.tempsParcours, function(i, o){
            var map = timeMappings[o.direction] || {};
            var time = o.duree, key = o.direction, text = o.direction, date = o.fileDate;
            var id = map.vid, zone = map.cat, code = map.code;
            if (time === 'FLUIDE') {
                time = 0;
            } else {
                var n = /\d+/.exec(time);
                if (n) {
                    time = parseInt(n[0], 10);
                } else {
                    time = 0;
                }
            }
            
            if (!times[zone]) {
                times[zone] = [];
            }
            times[zone].push({
                id: id,
                code: code,
                time: time,
                text: text
            });
            if (!historyValues[id]) {
                historyValues[id] = [];
            }
            historyValues[id].push(time);
            if (badgeprefs && (''+badgeprefs.id) === (''+id)) {
                updateBadge({
                    id: id,
                    key: key,
                    time: time,
                    code: code
                });
            }
        });
        if (callback) {
            callback(times);
        }
    });
}

//alert info cita.lu
function updateAlerts(a, cb){
	updateAlert('incidents', a, function(o1){
		updateAlert('rtl', a, function(o2){
			updateAlert('chantiers', a, function(o3){
				if (cb){
					var a = jQuery.merge(o3,o2);
					a = jQuery.merge(a,o1);
					cb({item:a});
				}
			});
		});
	});
}
/*
function updateAlert(a, cb){
    xhr({
        method: 'GET',
        url: urlAlert,
        dataType: 'xml'
    }, function(xhr){
        var o = xhr.responseJson || {};
        var channel = o.rss.channel;
        //pubdate Wed, 27 Mar 2013 10:44:25 +0100
        if (cb) {
            cb(channel);
        }
    });
}*/
function updateAlert(id, a, cb){
    if (!urlAlerts[id]){
    	if (cb) {
            cb([]);
        }
    	return ;
    }
    xhr({
        method: 'GET',
        url: urlAlerts[id]
    }, function(xhr){
        var txt = xhr.responseText || '';
        var o = $(txt);//text2xml(o)
        var els = o.find('li');
        var items = [];
        els.each(function(i,el){
        	items.push({
	        	type:id,
	        	title:titleAlerts[id],
	        	description:jQuery.trim(el.childNodes[0].textContent),
	        	pubDate:jQuery.trim($(el).find('span.pubdate').text()) //27-03-2013 09:54:19
        	});
        });
        items = items.sort(function(a,b){
        	var ma = getMoment(a.pubDate), mb = getMoment(b.pubDate);
        	return ma.isBefore(mb)?-1:1;
        });
        
        if (cb) {
            cb(items);
        }
    });
}


//flashinfo lesfrontaliers.lu
function updateFlashs(a, callback){
    xhr({
        method: 'GET',
        url: urlFlashInfo,
        dataType: 'text'
    }, function(xhr){
        var  m, data = xhr.responseText;
        
        var page = $(data);
        var el = page.find('#infos-flash');
       
        //m = reFlashInfoLF.main.exec(data);
        if (el.length>0){
        //if (m && m[1]) {
        //    var n = reFlashInfoLF.title.exec(m[1]), p = reFlashInfoLF.content.exec(m[1]);
        //    var title = n[1], content = p[1];
        	el.find('img').each(function(i,el){
        		el.src=urlFlashRoot+el.attributes.src.value;
        	});
        	el.find('a').each(function(i,el){
        		el.href=urlFlashRoot+el.attributes.href.value;
        	});
        	var title= el.find('.views-field-title a').text();
        	var elContent =  el.find('.views-field-body .field-content');
            var newFlash = {
                title: title,
                content: elContent.html(),
                contentText:elContent.text()
            };
            toastFlash(newFlash);
            lastFlash=newFlash;
            //badge color now
            chrome.browserAction.setBadgeBackgroundColor({
        		color: BADGE_COLOR_FLASHINFO
    		});
            if (callback) {
                callback(lastFlash);
            }
        }else{
        	lastFlash=false;
        }
        
    });
}
function getFlash(a, callback){
	if (callback) {
       callback(lastFlash);
   }
}
function toastFlash(flash){
	if (!window.webkitNotifications) {
		return;
	}
	
	if (flash && (flash.title!=lastFlash.title || flash.content!=lastFlash.content)){
		//toast
		var notification;
		if (prefs.HTMLNotif && webkitNotifications.createHTMLNotification){
			notification = webkitNotifications.createHTMLNotification(
				  'toast.html'
			);
		}else{
			notification = webkitNotifications.createNotification(
			  'images/logo48.png',  
			  flash.title, 
			  flash.contentText
			);
		}
		notification.show();
	}
}

//temps tunnel.cita.lu
function updateTunnel(a, callback){
    xhr({
        method: 'GET',
        url: 'http://tunnel.cita.lu/reload.php',
        dataType: 'json'
    }, function(xhr){
        if (callback) {
            callback(xhr.responseJson);
        }
    });
}


function xhr(a, cb){
    request(a, true, cb);
}

function request(a, local, cb){
    var xhr = new XMLHttpRequest();
    var method = a.method || 'get';
    var url = a.url;
    if (a.parameters && (method.toLowerCase() == 'get')) {
        var params = [];
        for (var k in a.parameters) {
            params.push(k + '=' + encodeURIComponent(a.parameters[k]));
        }
        var sep = (url.indexOf('?') > 0) ? '&' : '?';
        url += sep + params.join('&');
    }
    if (a.username) {
        xhr.open(a.method || 'get', url, true, a.username, a.password);
    } else {
        xhr.open(a.method || 'get', url, true);
    }
    //headers
    if (a.headers) {
        for (var kh in a.headers) {
            xhr.setRequestHeader(kh, a.headers[kh]);
        }
    }
    if (cb) {
        a.onreadystatechange = true;//Chrome extesnion looks on readystatechange
    }
    xhr.onreadystatechange = function(o){
        if (xhr.readyState == 4) {
            var responseJson = false;
            if (a.dataType === 'xml' && xhr.responseXML) {
                responseJson = xml2json(xhr.responseXML, '');
                responseJson = JSON.parse(responseJson);
            }
            if (a.dataType === 'json') {
                responseJson = JSON.parse(xhr.responseText);
            }
            cb({
                responseJson: responseJson,
                responseText: xhr.responseText,
                responseHeaders: xhr.responseHeaders,
                status: xhr.status,
                statusText: xhr.statusText,
                request: a
            });
        }
    };
    try {
        xhr.send(a.data || {});
    } catch (e) {
        var o = {
            responseText: e.message || 'Error',
            status: (e.name || '') + ' ' + (e.code || 0),
            statusText: (e.name || '') + ' ' + (e.code || 0),
            error: e
        };
        if (local && typeof a.onerror === "function") {
            a.onerror.call(this, o);
        } else {
            cb(o);
        }
    }
}

function callb(cb, data){
    if (cb && typeof cb === 'function') {
        cb(data || null);
    }
}