/*

MEDLINE Inserter 0.0.1

Copyright 2014 Emil Hemdal <emil(at)hemdal(dot)se>
Copyright 2014 Landstinget Dalarna Bibliotek och informationscentral <webmaster(dot)lasarettsbiblioteken(at)ltdalarna(dot)se>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

(function() {
	"use strict";
	var medline2json 	= require("medlinexmltojson"),
		ftp 			= require("ftp"),
		fs 				= require("fs"),
		mongo 			= require("mongodb"),
		MongoDB 		= mongo.Db,
		Server 			= mongo.Server,
		BSON 			= mongo.BSONPure,
		config 			= require("./config.js");



	/*
	var c = new ftp();
	c.on('ready', function() {
		c.cwd("/nlmdata/.medleasebaseline/gz/", function(err, currentDir) {
			console.log("Directory changed.");
			console.log(currentDir);
			c.list(function(err, list) {
				console.log("Directory listing received.");
				console.log("Amount of items in directory: "+list.length);
				c.end();
			});
		});
	});

	c.on('greeting', function(msg) {
		console.log("Server greets you with: '"+msg+"'");
	});

	c.on('error', function(err) {
		console.log("Error occured!");
		console.log(err);
	});

	c.connect({
		host: 		"ftp.nlm.nih.gov",
		password: 	config.password
	});*/
}());
