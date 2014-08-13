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
		es 				= require('event-stream'),
		mongo 			= require("mongodb"),
		MongoDB 		= mongo.Db,
		Server 			= mongo.Server,
		BSON 			= mongo.BSONPure,
		MongoClient 	= mongo.MongoClient,
		config 			= require("./config.js");

	var type = null,
		database = null,
		collection = null,
		actionHandlers = {};

	process.argv.forEach(function(val, index, array) {
		if(index === 2) {
			if(val === "baseline") {
				type = "baseline";
			} else if(val === "update") {
				type = "update";
			}
		} else if(index === 3) {
			database = val;
		} else if(index === 4) {
			collection = val;
		}
	});

	if(!type || !database || !collection) {
		console.error("arguments missing");
		console.log("arguments should be: node app.js type database collection");
		if(!type) {
			console.log("type has to be baseline or update");
		}
		process.exit(1);
	}

	if(type === "update") {
		fs.readFile("./lastUpdate.txt", {encoding: "utf8"}, function(err, data) {
			if(err) { // file does not exist
				update(null);
			} else {
				update(data);
			}
		});
	} else {
		console.log("This command will delete the collection "+collection+" and import\nnew metadata from the MEDLINE baseline files into "+collection);
		console.log("Are you sure that you want to do this? y/N");
		var stdin = process.stdin,
			esSplit = es.split();
		console.log("NOT PIPED YET!");
		console.log(stdin);
		stdin.pipe(esSplit)
			.on('data', parseCommand);
		console.log("PIPED!");
		console.log(stdin);
	}

	/*MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
		if(err) throw err;

		medline2json.parse("./extensive-test.xml", function(err, json) {
			if(err) throw err;
			var data = JSON.parse(json);

			db.collection(collection).insert(data, {safe: true, w:1}, function(err, records) {
				if(err) { console.error(err); }
				db.close();
			});

			//db.collection(collection).update(objects, {w:1, upsert: true, safe: true}, function(err, objects) {
			//	if(err) console.err(err.message);
			//});
		});
	});*/

	function importBaseline() {
		console.log("Importing baseline!");
	}

	var rgzipTest = /xml\.gz$/i;

	function update() {
		console.log("Updating!");
		var c = new ftp();
		c.on('ready', function() {
			console.log("FTP connected!");
			c.cwd("/nlmdata/.medlease/gz/", function(err, currentDir) {
				if(err) throw err;
				console.log("Directory changed to .medlease directory. Loading directory listing.");
				c.list(function(err, list) {
					console.log("Directory listing received. Items: "+list.length);

					var asdf = 0;

					fs.readdir("./downloaded/", function(err, files) {
						if(err) {
							//fixa så att den skapar mappen.
						} else {
							//fixa så att den tömmer mappen.
						}
					});

					function run() {
						if(list.length > 0 && asdf <= 30) {
							var working = data.shift();
							if(rgzipTest.test(working.name)) {
								c.get(working.name, function(err, stream) {
									if(err) throw err;
									stream.once('close', function() {
										run();
									});
									stream.pipe(fs.createWriteStream("./downloaded/"+working.name));
								});
							} else {
								run();
							}
						} else {
							console.log("Finished!");
							c.end();
						}
						asdf++;
					}
				});
			});
		});

		c.on('greeting', function(msg) {
			console.log("FTP server greets you with: '"+msg+"'");
		});

		c.on('error', function(err) {
			console.log("Error occured!");
			console.log(err);
		});

		c.connect({
			host: 		"ftp.nlm.nih.gov",
			password: 	config.password
		});
	}

	function parseCommand(command) {
		var words = command.trim();

		console.log("WORDS: "+words);

		if(words.toUpperCase() === "Y") {
			importBaseline();
		} else {
			process.exit(0);
		}
		console.log("UNPIPED!");

		stdin.unpipe(esSplit);
		console.log(stdin);
	}

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
