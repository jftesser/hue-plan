"use strict";
var xhr = require('./xhr');
var Snap = require('snapsvg');
var tinycolor = require('tinycolor2');
var Vec2 = require('vec2');


var hueToggle = function(ind) {
  xhr({url: 'http://10.0.1.12/api/newdeveloper/lights/'+ind})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
      	var newstate = true;
      	if (resp.state.on) {
      		newstate = false;
      	}
      	var st_alpha = 0.0;
      	var en_alpha = 0.0;
      	if (newstate) {
      		en_alpha = 1.0;
      	} else {
      		st_alpha = 1.0;
      	}
      	var light_geom = lights[ind-1].geom.select("#light"+ind);
      	Snap.animate( st_alpha, en_alpha, function( value ) { light_geom.selectAll("path").attr({"fill-opacity": value}); }, 500 ,mina.easein); 

        xhr({
          verb: 'PUT',
          url: 'http://10.0.1.12/api/newdeveloper/lights/'+ind+'/state',
          data: JSON.stringify({
            on: newstate
          })
        });
      });
};

var convertStateToColor = function(state) {
	// 255 65535
	return tinycolor({h: state.hue/65535.0*360, s: state.sat/255.0, v: state.bri/255.0});
}

var getHueColor = function(ind) {
	return xhr({url: 'http://10.0.1.12/api/newdeveloper/lights/'+ind})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
        var color = convertStateToColor(resp.state);
        
    	lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({fill: color.toHexString()});
    	if (resp.state.on == false) {
    		console.log("off "+ind);
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 0.0});
    	} else {
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 1.0});
    	}
    	lights[ind-1].color = color;
      });
}


var background = "#FFFFFF";
var lights = [];

var tc_background = tinycolor(background);

var light_cnt = 5; // this will change!

document.body.style.background = background;


function tweenColor(s,at,st,g) {
  var st_hsl = st.toHsl();
  var g_hsl = g.toHsl();
  var st_h_vec = new Vec2(Math.cos(st_hsl.h/360.0*2*Math.PI),Math.sin(st_hsl.h/360.0*2*Math.PI));
  var g_h_vec = new Vec2(Math.cos(g_hsl.h/360.0*2*Math.PI),Math.sin(g_hsl.h/360.0*2*Math.PI));
  st_h_vec.multiply(1.0-at,false);
  g_h_vec.multiply(at,false);
  var vec = st_h_vec.add(g_h_vec,true);
  var ang = Math.atan2(vec.y,vec.x);
  if (ang < 0) ang += 2*Math.PI;
  var calced_h = ang/(2*Math.PI)*360.0;
  var c_hsv = { 
    h:calced_h,
    s:st_hsl.s*(1.0-at)+g_hsl.a*at,
    l:st_hsl.l
  };

  var calced = tinycolor(c_hsv);

  s.selectAll("path").attr({fill: calced.toHexString() });
}


document.addEventListener("DOMContentLoaded", function(event) { 
  var s = Snap("#svg_holder");

  var s_apt = Snap();
  s.append(s_apt);
  s_apt.attr({width:"100%", height:"100%"});
  Snap.load("apartment.svg", function (f) {
    //f.select("#light1").selectAll("path").attr({fill: "#bada55"});
    for (var i=1; i<=light_cnt; i++) {
    	var l = f.select("#hue"+i.toString());
    	var ind = i;
    	l.click((function(ind) { return function(){ 
    		console.log("toggling "+ind);
    		hueToggle(ind);
    		};})(ind));
    	var c = tinycolor("#FFFFFF");
    	lights.push({geom:l,color:c});
    	getHueColor(i);
	}
    s_apt.append(f);
    s_apt.width = "100%";
  });

  
  var layout_svgs = function() {
    //var gw = window.innerWidth;
    //var gh = window.innerHeight;

    var gw = document.body.clientWidth;
    var gh = document.body.clientHeight;

    var div = document.getElementById('rotator');

    /*if (gw > gh) {
      // we should rotate!
      document.body.style.width = "94%";
      document.body.style.height = "90%";
      document.body.style.margin = "5% 1% 5% 5%"
      div.style.setProperty("-webkit-transform", "rotate(-90deg) translate(-"+(gh*0.925).toString()+"px,-"+(gw*0.025).toString()+"px)", null);
      div.style.setProperty("-webkit-transform-origin", "0px 0px", null);
      gw = document.body.clientWidth;
      gh = document.body.clientHeight;
      div.style.width = gh.toString()+"px";
      div.style.height = gw.toString()+"px";
      gw = document.body.clientHeight;
      gh = document.body.clientWidth;
    } else {
      document.body.style.width = "90%";
      document.body.style.height = "94%";
      document.body.style.margin = "5% 5% 1% 5%"
      div.style.setProperty("-webkit-transform", "rotate(-0deg)", null);
      gw = document.body.clientWidth;
      gh = document.body.clientHeight;
      div.style.width = gw.toString()+"px";
      div.style.height = gh.toString()+"px";
    }*/

  };

  window.onresize = function(event) {
    layout_svgs();
  };

  layout_svgs();
});