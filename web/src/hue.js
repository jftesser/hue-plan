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
      	hueSet(ind,newstate);
      });
};

var hueSet = function(ind, newstate) {
	var en_alpha = 0.0;
	if (newstate) en_alpha = 1.0;
	var light_geom = lights[ind-1].geom.select("#light"+ind);
    light_geom.selectAll("path").animate({"fill-opacity": en_alpha},500,mina.easein);

	xhr({
		verb: 'PUT',
		url: 'http://10.0.1.12/api/newdeveloper/lights/'+ind+'/state',
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
	return xhr({url: 'http://10.0.1.12/api/newdeveloper/lights/'+ind})
      .then(JSON.parse.bind(JSON))
      .then(function(resp){
        var color = convertStateToColor(resp.state);
        
    	lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({fill: color.toHexString()});
    	if (resp.state.on == false) {
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 0.0});
    	} else {
    		lights[ind-1].geom.select("#light"+ind).selectAll("path").attr({"fill-opacity": 1.0});
    	}
    	lights[ind-1].color = color;
      });
}


var background = "#FFFFFF";
var lights = [];

var rooms = [];

var living_inds = [1,2,3];
var office_inds = [3,4,5];

var tc_background = tinycolor(background);

var light_cnt = 5; // this will change!

document.body.style.background = background;


document.addEventListener("DOMContentLoaded", function(event) { 
  var s = Snap("#svg_holder");

  var s_apt = Snap();
  s.append(s_apt);
  s_apt.attr({width:"100%", height:"100%"});
  Snap.load("apartment.svg", function (f) {
    // set up lights
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