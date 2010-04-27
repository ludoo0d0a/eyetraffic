/**
 * Config
 *
 * @author Ludovic Valente
 * @web pitaso.com
 * @web xeoos.fr
 */
//UTF8: �
//API maps
//http://econym.org.uk/gmap/
//http://code.google.com/apis/maps/documentation/reference.html
//Geoip
//http://www.geoipview.com/
//cartes
//www.guideroutier.lu/
//INFO
//http://www.acl.lu/fr/trafic_news/info_trafic_luxembourg
//www.vdl.lu/Environnement+et+mobilit�/Circulation/Trafic_Info.html
//temps
//www.guideroutier.lu/mobile/index.php
//cameras
//www.guideroutier.lu/mobile/camera.php
//www.driving.lu/index.php?module=auto&action=getListeCamera&idauto=1
//API googlemaps : http://www.guideroutier.lu/xmlgen.php?catid=0&localite=&numeromaison=undefined
//chantiers
//www.vdl.lu/Chantiers_de_courte_dur�e-path-1,641223,1445670.html
//www.vdl.lu/Chantiers_de_longue_dur�e-path-1,641223,1445670.html
//http://www2.pch.etat.lu/chantiers/tableau_chantiers_autoroutes.jsp
//http://www2.pch.etat.lu/chantiers/tableau_chantiers_autoroutes.jsp?type=1&service=all&show=longue
//www.pch.public.lu/chantiers/chantiers/chantiers.jsp?type=1&service=all
//www.pch.public.lu/chantiers/chantiers/chantiers.jsp?type=2&service=all
//API googlemaps : http://www.guideroutier.lu/xmlgen.php?catid=7&localite=&numeromaison=undefined
//radars
//www.police.public.lu/actualites/trafic/controles_radar/index.html
//API googlemaps : http://www.guideroutier.lu/xmlgen.php?catid=6&localite=&numeromaison=undefined
//parking
//www.driving.lu/index.php?module=auto&action=getGuidageParking
//www.vdl.lu/Guidage_parking.html
//API : service.vdl.lu/rss/circulation_guidageparking.php
function getGUID(){
    if (chrome.extension) {
        var url = chrome.extension.getURL('bg.html');
        var m = /:\/\/(\w+)/.exec(url);
        return m[1];
    } else {
        return false;
    }
}

var GUID = getGUID();
var LANGS = {
    en: {
        NOTRAFFICINFO: 'No traffic info',
        to: 'to',
        map: 'Map'
    }
};
var LANG = LANGS.en;
//Temps de parcours
var urlTime = 'http://www2.pch.etat.lu/info_trafic/temps_parcours/temps_parcours_convert.jsp';

var timesCoords = {
	treves: {
		i: 1,
		name: "Wasserbillig(Trèves)",
		lat: 49.723510000000005,
		lng: 6.48922
	},
	luxest: {
		i: 2,
		name: "Senningerberg(Lux Est)",
		lat: 49.64278,
		lng: 6.21759
	},
	hollerich: {
		i: 3,
		name: "Hollerich",
		lat: 49.585710000000006,
		lng: 6.132890000000001
	},
	gasperich: {
		i: 3.1,
		name: "Gasperich",
		lat: 49.59,
		lng: 6.133
	},
	bridel: {
		i: 4,
		name: "Bridel",
		lat: 49.627500000000005,
		lng: 6.075740000000001
	},
	belgique: {
		i: 5,
		name: "Belgique",
		lat: 49.638090000000005,
		lng: 5.909000000000001
	},
	esch: {
		i: 6,
		name: "Esch",
		lat: 49.519380000000005,
		lng: 6.000190000000001
	},
	france: {
		i: 7,
		name: "France",
		lat: 49.47281,
		lng: 6.12119
	},
	schengen: {
		i: 8,
		name: "Schengen(Allemagne)",
		lat: 49.4791,
		lng: 6.3656500000000005
	}
};
/*
var routes = [{belgique, france},{france, treves}];
	
};
*/
var timeMappings = {
    'FRANCE': {
        2: {
            code: 'A6_france',
			cat:'FRANCE',
			from:timesCoords.belgique,
			to:timesCoords.france,
            text: 'Belgique ' + LANG.to + ' France'
        },
        17: {
            code: 'A1_france',
			cat:'FRANCE',
			from:timesCoords.treves,
			to:timesCoords.france,
            text: 'Wasserbillig ' + LANG.to + ' France'
        },
        19: {
            code: 'A1_france',
			cat:'FRANCE',
			from:timesCoords.luxest,
			to:timesCoords.france,
            text: 'Senningerberg ' + LANG.to + ' France'
        },
        6: {
            code: 'A3_france',
			cat:'FRANCE',
			from:timesCoords.hollerich,
			to:timesCoords.france,
            text: 'Gasperich ' + LANG.to + ' France'
        }
    },
    'BELGIQUE': {
        4: {
            code: 'A3_belgique',
			cat:'BELGIQUE',
			from:timesCoords.france,
			to:timesCoords.belgique,
            text: 'France ' + LANG.to + ' Belgique'
        },
        14: {
            code: 'A13_belgique',
			cat:'BELGIQUE',
			from:timesCoords.schengen,
			to:timesCoords.belgique,
            text: 'Schengen ' + LANG.to + ' Belgique'
        },
        20: {
            code: 'A1_belgique',
			cat:'BELGIQUE',
			from:timesCoords.luxest,
			to:timesCoords.belgique,
            text: 'Senningerberg ' + LANG.to + ' Belgique'
        },
        5: {
            code: 'A6_belgique',
			cat:'BELGIQUE',
			from:timesCoords.bridel,
			to:timesCoords.belgique,
            text: 'Bridel ' + LANG.to + ' Belgique'
        }
    },
    'LUX-SUD': {
        1: {
            code: 'A6_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.belgique,
			to:timesCoords.gasperich,
            text: 'Belgique ' + LANG.to + ' Gasperich'
        },
        9: {
            code: 'A4_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.esch,
			to:timesCoords.gasperich,
            text: 'Esch ' + LANG.to + ' Gasperich'
        },
        3: {
            code: 'A3_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.esch,
			to:timesCoords.hollerich,
            text: 'Esch ' + LANG.to + ' Lux Hollerich'
        },
        12: {
            code: 'A13_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.schengen,
			to:timesCoords.gasperich,
            text: 'Schengen ' + LANG.to + ' Gasperich'
        },
        16: {
            code: 'A1_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.treves,
			to:timesCoords.gasperich,
            text: 'Wasserbillig ' + LANG.to + ' Gasperich'
        },
        18: {
            code: 'A1_lux_sud',
			cat:'LUX-SUD',
			from:timesCoords.luxest,
			to:timesCoords.gasperich,
            text: 'Senningerberg ' + LANG.to + ' Gasperich'
        }
    },
    'LUX-EST': {
        7: {
            code: 'A6_lux_est',
			cat:'LUX-EST',
			from:timesCoords.belgique,
			to:timesCoords.luxest,
            text: 'Belgique ' + LANG.to + ' Lux Est'
        },
        10: {
            code: 'A4_lux_est',
			cat:'LUX-EST',
			from:timesCoords.esch,
			to:timesCoords.luxest,
            text: 'Esch ' + LANG.to + ' Lux Est'
        },
        11: {
            code: 'A3_lux_est',
			cat:'LUX-EST',
			from:timesCoords.france,
			to:timesCoords.luxest,
            text: 'France ' + LANG.to + ' Lux Est'
        },
        13: {
            code: 'A13_lux_est',
			cat:'LUX-EST',
			from:timesCoords.schengen,
			to:timesCoords.luxest,
            text: 'Schengen ' + LANG.to + ' Lux Est'
        },
        15: {
            code: 'A1_lux_est',
			cat:'LUX-EST',
			from:timesCoords.treves,
			to:timesCoords.luxest,
            text: 'Wasserbillig ' + LANG.to + ' Lux Est'
        }
    },
    'LUX-HOL': {
        8: {
            code: 'A4_lux_hol',
			cat:'LUX-HOL',
			from:timesCoords.france,
			to:timesCoords.gasperich,
            text: 'France ' + LANG.to + ' Gasperich'
        }
    }
};
var reTime = /&(\d+)([^=]+)=([\w-]+)\s+(.*)/g;
//Service
//var urlService = 'http://www2.pch.etat.lu/info_trafic/niveau_service/niveau_service_convert.jsp';
//Alertes
var urlAlert = 'http://www.cita.lu/rss_feeds/rtl/index.xml';
var tplAlert = '<div class="news"><div class="desc">${description}</div><div class="date">${date}</div></div>';
var timeTexts = {};
function indexData(){
    jQuery.each(timeMappings, function(country, mapping){
        jQuery.each(mapping, function(id, o){
            timeTexts[id] = o.text;
        });
    });
}

indexData();
//Cams
//CITA
//var urlCam = 'http://www2.pch.etat.lu/info_trafic/cameras/images/cccam_{0}.jpg?cachekill=5058852'
var urlCam = 'http://www2.pch.etat.lu/info_trafic/cameras/images/cccam_{0}.jpg?cachekill={1}';
var urlFlashInfo = 'http://www.lesfrontaliers.lu/index.php';
var reFlashInfoLF = {
    main: /<div\s+id="info_flash">[^<]*<div[^>]*>(.*?<\/div>)/,
    title: /<b>(.*?)<\/b>/,
    content: /<div[^>]*>(.*?)<\/div>/
};
var urlMap = 'http://webfiles.luxweb.com/images/auto/traficCams/map{0}.jpg';
var urlStream = 'http://auto.rtl.lu/trafic/stream/';
var dcams = {
    'A1': {
        start: 'Luxembourg',
        end: 'Trèves',
        camsin: {
            46: {
                text: 'Croix de Gasperich - Tunnel Howald',
                x: 9,
                y: 9
            },
            70: {
                text: 'Croix de Gasperich - Tunnel Howald',
                x: 9,
                y: 9
            },
            81: {
                text: 'Tunnel Howald - Sandweiler',
                x: 9,
                y: 9
            },
            84: {
                text: 'Tunnel Howald - Sandweiler',
                x: 9,
                y: 9
            },
            86: {
                text: 'Sandweiler - Tunnel Cents',
                x: 9,
                y: 9
            },
            100: {
                text: 'Jonction Grünewald - Senningerberg',
                x: 9,
                y: 9
            },
            101: {
                text: 'Senningerberg - Cargo Center',
                x: 9,
                y: 9
            },
            103: {
                text: 'Cargo Center - Münsbach',
                x: 9,
                y: 9
            },
            110: {
                text: 'Münsbach - Flaxweiler',
                x: 9,
                y: 9
            },
            112: {
                text: 'Potaschbierg - Mertert',
                x: 9,
                y: 9
            },
            119: {
                text: 'Mertert - Aire de Wasserbillig',
                x: 9,
                y: 9
            }
        },
        camsout: {
            77: {
                text: 'Sandweiler - Tunnel Howald',
                x: 9,
                y: 9
            },
            91: {
                text: 'Kirchberg - Tunnel Cents',
                x: 9,
                y: 9
            },
            95: {
                text: 'Jonction Grünewald - Kirchberg',
                x: 9,
                y: 9
            },
            98: {
                text: 'Senningerberg - Jonction Grünewald',
                x: 9,
                y: 9
            },
            109: {
                text: 'Münsbach - Cargo Center',
                x: 9,
                y: 9
            },
            111: {
                text: 'Flaxweiler - Münsbach',
                x: 9,
                y: 9
            },
            114: {
                text: 'Mertert - Potaschbierg',
                x: 9,
                y: 9
            }
        }
    },
    'A3': {
        start: 'Luxembourg',
        end: 'France',
        camsin: {
            41: {
                text: 'Croix de Gasperich - Aire de Berchem',
                x: 9,
                y: 9
            },
            55: {
                text: 'Croix de Gasperich - Aire de Berchem',
                x: 9,
                y: 9
            },
            53: {
                text: 'Aire de Berchem - Bettembourg',
                x: 49.5364890954628,
                y: 6.11391305923462
            },
            59: {
                text: 'Bettembourg - Croix de Bettembourg',
                x: 9,
                y: 9
            }
        },
        camsout: {
            47: {
                text: 'Croix de Gasperich - Luxembourg',
                x: 9,
                y: 9
            },
            51: {
                text: 'Aire de Berchem - Croix de Gasperich',
                x: 9,
                y: 9
            },
            63: {
                text: 'Croix de Bettembourg - France',
                x: 9,
                y: 9
            },
            66: {
                text: 'France - Croix de Bettembourg',
                x: 9,
                y: 9
            }
        }
    },
    'A4': {
        start: 'Luxembourg',
        end: 'Esch',
        camsin: {
            31: {
                text: 'Luxembourg - Croix de Cessange',
                x: 9,
                y: 9
            },
            122: {
                text: 'Croix de Cessange - Leudelange',
                x: 9,
                y: 9
            },
            137: {
                text: 'Jonction de Foetz - Esch',
                x: 9,
                y: 9
            },
            139: {
                text: 'Esch - Jonction Lankelz',
                x: 9,
                y: 9
            }
        },
        camsout: {
            36: {
                text: 'Croix de Cessange - Luxembourg',
                x: 9,
                y: 9
            },
            120: {
                text: 'Leudelange - Croix de Cessange',
                x: 9,
                y: 9
            },
            125: {
                text: 'Pontpierre - Leudelange',
                x: 9,
                y: 9
            },
            133: {
                text: 'Jonction de Foetz - Pontpierre',
                x: 9,
                y: 9
            },
            140: {
                text: 'Jonction Lankelz - Esch',
                x: 9,
                y: 9
            }
        }
    },
    'A6': {
        start: 'Luxembourg',
        end: 'Belgique',
        camsin: {
            3: {
                text: 'Steinfort - Belgique',
                x: 9,
                y: 9
            },
            27: {
                text: 'Croix de Cessange - Bertrange',
                x: 9,
                y: 9
            }
        },
        camsout: {
            6: {
                text: 'Steinfort - Mamer',
                x: 9,
                y: 9
            },
            11: {
                text: 'Steinfort - Mamer',
                x: 9,
                y: 9
            },
            15: {
                text: 'Mamer - Bridel',
                x: 9,
                y: 9
            },
            17: {
                text: 'Mamer - Bridel',
                x: 9,
                y: 9
            },
            21: {
                text: 'Bridel - Strassen',
                x: 9,
                y: 9
            },
            30: {
                text: 'Bertrange - Croix de Cessange',
                x: 9,
                y: 9
            },
            37: {
                text: 'Croix de Cessange - Croix de Gasperich',
                x: 9,
                y: 9
            },
            42: {
                text: 'Croix de Cessange - Croix de Gasperich',
                x: 9,
                y: 9
            }
        }
    },
    'A13': {
        start: 'Longwy',
        end: 'Sarrebruck',
        camsin: {
            145: {
                text: 'Differdange - Tunnel Aessen',
                x: 9,
                y: 9
            },
            147: {
                text: 'Differdange - Tunnel Aessen',
                x: 9,
                y: 9
            },
            151: {
                text: 'Tunnel Aessen - Tunnel Ehlerange',
                x: 9,
                y: 9
            },
            162: {
                text: 'Kayl - Dudelange',
                x: 9,
                y: 9
            },
            164: {
                text: 'Dudelange - Croix de Bettembourg',
                x: 9,
                y: 9
            },
            204: {
                text: 'Hellange - Frisange',
                x: 9,
                y: 9
            },
            217: {
                text: 'Altwies - Mondorf',
                x: 9,
                y: 9
            },
            230: {
                text: 'Altwies - Mondorf',
                x: 9,
                y: 9
            },
            236: {
                text: 'Mondorf - Tunnel Markusbierg',
                x: 9,
                y: 9
            },
            268: {
                text: 'Schengen - Allemagne',
                x: 9,
                y: 9
            }
        },
        camsout: {
            142: {
                text: 'Jonction Lankelz - Tunnel Ehlerange',
                x: 9,
                y: 9
            },
            143: {
                text: 'Sanem - Pétange',
                x: 9,
                y: 9
            },
            154: {
                text: 'Jonction Lankelz - Tunnel Ehlerange',
                x: 9,
                y: 9
            },
            161: {
                text: 'Kayl - Schifflange',
                x: 9,
                y: 9
            },
            167: {
                text: 'Croix de Bettembourg - Dudelange',
                x: 9,
                y: 9
            },
            200: {
                text: 'Hellange - Croix de Bettembourg',
                x: 9,
                y: 9
            },
            215: {
                text: 'Altwies - Frisange',
                x: 9,
                y: 9
            },
            218: {
                text: 'Mondorf - Altwies',
                x: 9,
                y: 9
            },
            231: {
                text: 'Mondorf - Altwies',
                x: 9,
                y: 9
            },
            235: {
                text: 'Tunnel Markusbierg - Mondorf',
                x: 9,
                y: 9
            },
            237: {
                text: 'Tunnel Markusbierg - Mondorf',
                x: 9,
                y: 9
            },
            269: {
                text: 'Schengen - Tunnel Markusbierg',
                x: 9,
                y: 9
            }
        }
    },
    'A7': {
        start: 'Luxembourg',
        end: 'Nord',
        camsin: {
            403: {
                text: 'Tunnel Gousselerbierg',
                x: 9,
                y: 9
            },
            445: {
                text: 'Tunnel Mersch',
                x: 9,
                y: 9
            },
            458: {
                text: 'Mierscherbierg',
                x: 9,
                y: 9
            },
            471: {
                text: 'Colmar Berg',
                x: 9,
                y: 9
            }
        },
        camsout: {
            466: {
                text: 'Colmar Berg',
                x: 9,
                y: 9
            },
            455: {
                text: 'Tunnel Mersch',
                x: 9,
                y: 9
            },
            444: {
                text: 'Tunnel Gousselerbierg',
                x: 9,
                y: 9
            },
            402: {
                text: 'Lorentzweiler',
                x: 9,
                y: 9
            },
            400: {
                text: 'Tunnel Grouft - Lorentzweiler',
                x: 9,
                y: 9
            }
        }
    }
};

