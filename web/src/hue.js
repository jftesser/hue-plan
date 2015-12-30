"use strict";
var xhr = require('./xhr');
var Snap = require('snapsvg');
var tinycolor = require('tinycolor2');
var Vec2 = require('vec2');
var bridge_ip = "10.0.1.23"

var getBridgeIP = function() {
  xhr({url: 'https://www.meethue.com/api/nupnp'})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
        bridge_ip = resp[0].internalipaddress;
      });
};

getBridgeIP();

var hueToggle = function(ind) {
  xhr({url: 'http://'+bridge_ip+'/api/newdeveloper/lights/'+ind})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
      	var newstate = true;
      	if (resp.state.on) {
      		newstate = false;
      	}
      	hueSet(ind,newstate);
      });
};

var hueSet = function(ind, newstate) {
	var en_alpha = 0.0;
	if (newstate) en_alpha = 1.0;
	var light_geom = lights[ind-1].geom.select("#light"+ind);
    light_geom.selectAll("path").animate({"fill-opacity": en_alpha},500,mina.easein);
    lights[ind-1].on = newstate;
	xhr({
		verb: 'PUT',
		url: 'http://'+bridge_ip+'/api/newdeveloper/lights/'+ind+'/state',
		data: JSON.stringify({
		on: newstate
		})
    });
}

var convertStateToColor = function(state) {
	// 255 65535
	return tinycolor({h: state.hue/65535.0*360, s: state.sat/255.0, v: state.bri/255.0});
}

var getHueColor = function(ind) {
	return xhr({url: 'http://'+bridge_ip+'/api/newdeveloper/lights/'+ind})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
        var color = convertStateToColor(resp.state);
        
    	lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({fill: color.toHexString()});
    	if (resp.state.on == false) {
    		lights[ind-1].on = false;
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 0.0});
    	} else {
    		lights[ind-1].on = true;
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 1.0});
    	}
    	lights[ind-1].color = color;
      });
}

var hueSetColor = function(ind) {
	var hsv = lights[ind-1].color.toHsv();
	xhr({
		verb: 'PUT',
		url: 'http://'+bridge_ip+'/api/newdeveloper/lights/'+ind+'/state',
		data: JSON.stringify({
		hue: Math.round(hsv.h/360.0*65535),
		sat: Math.round(hsv.s*255),
		bri: Math.round(hsv.v*255)
		})
    });
    lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({fill: lights[ind-1].color.toHexString()});
}

var offsetColor = function(dx,dy,color) {
	var div = document.getElementById('rotator');
	var sc = 360.0/(div.clientWidth*0.33);
	var calced_color = tinycolor(color.toString())

	sc = 100.0/(div.clientHeight*0.25);
	if (dy < 0) {
		// lighten
		calced_color.lighten(Math.abs(dy)*sc);
	}
	if (dy > 0) {
		// darken
		calced_color.darken(Math.abs(dy)*sc);
		calced_color.saturate(Math.abs(dy)*sc);
	}

  calced_color.spin(dx*sc);

	return calced_color;
}


var background = "#FFFFFF";
var lights = [];

var rooms = [];

var living_inds = [1,2,3];
var office_inds = [3,4,5];
var bedroom_inds = [6,7];

var tc_background = tinycolor(background);

var light_cnt = 7; // this will change!

document.body.style.background = background;


document.addEventListener("DOMContentLoaded", function(event) { 
  
  var s = Snap("#svg_holder");

  var s_apt = Snap();
  s.append(s_apt);
  s_apt.attr({width:"100%", height:"100%"});
  Snap.load("apartment.svg", function (f) {
    // set up lights
    for (var i=1; i<=light_cnt; i++) { (function(i) {
    	var l = f.select("#hue"+i.toString());
    	var c = tinycolor("#FFFFFF");
    	lights.push({geom:l,color:c,on:false,dx:0,dy:0,dragging:false});

    	/*l.click(function(){ 
    		console.log("toggling "+i);
    		hueToggle(i);
    		});*/
    	var minos = 5; // total guess

    	var start = function() {
    		lights[i-1].dx = 0;
    		lights[i-1].dy = 0;
        lights[i-1].dragging = true;
        if (lights[i-1].on) {
          Snap.animate(0,1,function(at){
            if (Math.abs(lights[i-1].dx) <= minos && Math.abs(lights[i-1].dy) <= minos) {
              var c = lights[i-1].color.toRgb();
              var calced = tinycolor({r:(c.r*at+255*(1-at)), g: (c.g*at+255*(1-at)), b: (c.b*at+255*(1-at))});
              document.body.style.background = calced.toHexString();
            }
          },300,mina.easein);
        }
    	}

    	
    	var move = function(dx,dy) {
    		// calculate offset and set background color
    		if (lights[i-1].on) {
	    		lights[i-1].dx = dx;
	    		lights[i-1].dy = dy;
	    		if (Math.abs(dx) > minos || Math.abs(dy) > minos) {
	    			var calced_color = offsetColor(dx,dy,lights[i-1].color);
	    			document.body.style.background = calced_color.toHexString();
	    		}
    		}
    	};
    	var stop = function() {
    		
    		if ((Math.abs(lights[i-1].dx) > minos || Math.abs(lights[i-1].dy) > minos) && lights[i-1].on) {
    			var calced_color = offsetColor(lights[i-1].dx,lights[i-1].dy,lights[i-1].color);
    			lights[i-1].color = calced_color;
				  lights[i-1].dx = 0;
    			lights[i-1].dy = 0;
    			hueSetColor(i);
    		} else {
    			hueToggle(i);
    		}

        lights[i-1].dragging = false;

        if (document.body.style.background != background) {
          Snap.animate(1,0,function(at){
            if (lights[i-1].dragging == false) {
              var c = lights[i-1].color.toRgb();
              var calced = tinycolor({r:(c.r*at+255*(1-at)), g: (c.g*at+255*(1-at)), b: (c.b*at+255*(1-at))});
              document.body.style.background = calced.toHexString();
            }
          },300,mina.easein);
        }
    	}

    	l.drag(move,start,stop);

    	getHueColor(i);

    })(i);
	}
	// set up rooms
	var roomOnOff = function(dy, inds, geom) {
		console.log("stopped dragging "+dy);
		if (dy < -5) {
			// turn on
			for (var i = 0; i < inds.length; i++) {
				hueSet(inds[i],true);
			};
		} else if (dy > 5) {
			// turn off
			for (var i = 0; i < inds.length; i++) {
				hueSet(inds[i],false);
			};
		}
		geom.selectAll("path").animate({fill: "#FFFFFF"},500,mina.easein,function(){geom.selectAll("path").animate({fill: "#0000000"},500,mina.easeout);});
	};
	// living
	var living_geom = f.select("#power_x5F_living");
	var living_dy;
	living_geom.drag(function(dx,dy) {living_dy = dy;},null,function(){
		roomOnOff(living_dy,living_inds,living_geom);
	});
	rooms.push({geom: living_geom, inds: living_inds});
	// office
	var office_geom = f.select("#power_x5F_office");
	var office_dy;
	office_geom.drag(function(dx,dy) {office_dy = dy;},null,function(){
		roomOnOff(office_dy,office_inds,office_geom);
	});
	rooms.push({geom: office_geom, inds: office_inds});
	// bedroom TK
  var bedroom_geom = f.select("#power_x5F_bedroom");
  var bedroom_dy;
  bedroom_geom.drag(function(dx,dy) {bedroom_dy = dy;},null,function(){
    roomOnOff(bedroom_dy,bedroom_inds,bedroom_geom);
  });
  rooms.push({geom: bedroom_geom, inds: bedroom_inds});

    s_apt.append(f);
    s_apt.width = "100%";

    layout_svgs();
  });

	/*var i;
    for (i=0; i<rooms.length;i++) {
    	rooms[i].geom.animate({transform: 'r90'},500,mina.easein);
    }*/

  
  var layout_svgs = function() {

    //var gw = window.innerWidth;
    //var gh = window.innerHeight;

    var gw = document.body.clientWidth;
    var gh = document.body.clientHeight;

    var div = document.getElementById('rotator');

    if (gh > gw) {
    	// we should rotate!
      	div.style.setProperty("-webkit-transform", "rotate(-90deg) translate(-"+(gh*1.0).toString()+"px,-"+(gw*0.0).toString()+"px)", null);
      	div.style.setProperty("-webkit-transform-origin", "0px 0px", null);
    	gw = document.body.clientWidth;
    	gh = document.body.clientHeight;
    	div.style.width = gh.toString()+"px";
    	div.style.height = gw.toString()+"px";
    	gw = document.body.clientHeight;
    	gh = document.body.clientWidth;

    	var i;
    	for (i=0; i<rooms.length;i++) {
    		rooms[i].geom.transform( 'r90');
    	}
    	for (i=0; i<lights.length;i++) {
    		lights[i].geom.transform( 'r90');
    	}
    } else {
      div.style.setProperty("-webkit-transform", "rotate(-0deg)", null);
      gw = document.body.clientWidth;
      gh = document.body.clientHeight;
      div.style.width = gw.toString()+"px";
      div.style.height = gh.toString()+"px";
      var i;
    	for (i=0; i<rooms.length;i++) {
    		rooms[i].geom.transform( 'r0');
    	}
    	for (i=0; i<lights.length;i++) {
    		lights[i].geom.transform( 'r0');
    	}
    }

    

  };

  window.onresize = function(event) {
    layout_svgs();
  };

  // query state of lights every second
  var color_checker = function(){
    var i;
    for (i=0; i<lights.length;i++) {
      if (lights[i].dragging == false) {
        getHueColor(i+1);
      }
    }

    getBridgeIP(); // maybe also try to update ip?

    setTimeout(color_checker, 1000);
  };

  setTimeout(color_checker, 5000); // but start five seconds from now
});