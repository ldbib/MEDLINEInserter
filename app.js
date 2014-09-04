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
		zlib 			= require('zlib'),
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
		actionHandlers = {},
		baselineQuestion = 0;

	var rNonInt = /[^0-9]/,
		rgzipTest = /xml\.gz$/i,
		rMedlineNrExtract = /medline[0-9]+n([0-9]+)\.xml\.gz$/i;

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
		console.log("arguments should be: node app.js baseline/update database collection");
		process.exit(1);
	}

	if(type === "update") {
		fs.readFile("./lastUpdate.txt", {encoding: "utf8"}, function(err, data) {
			if(err) { // file does not exist
				update(null);
			} else {
				update(parseInt(data, 10));
			}
		});
	} else {
		//console.log("This command will delete the collection '"+collection+"' and import\nnew metadata from the MEDLINE baseline files into '"+collection+"'");
		//console.log("Are you sure that you want to do this? y/N");

		//console.log("Do you want to erase the database or continue? Yes/[number of the last successful importfile]/Cancel");

		console.log("New or continue? N/c (new will erase the selected collection)");

		var stdin = process.stdin,
			esSplit = es.split();
		//console.log("NOT PIPED YET!");
		//console.log(stdin);
		stdin.pipe(esSplit)
			.on('data', parseCommand);
		//console.log("PIPED!");
		//console.log(stdin);
	}

	function importBaseline(baselineNumber) {
		console.log("Importing baseline!");
		MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
			if(err) throw err;

			var coll = db.collection(collection);

			console.log("MongoDB connected!");

			if(baselineNumber < 0) {
				console.log("Removing old collection... (can take some time)");

				coll.remove({}, {w:1, j:1}, function(err, numberOfRemovedDocs) {
					if(err) throw err;
					console.log("'"+collection+"' collection removed! Adding indexes!");
					db.createIndex(collection, "article", function(err, name) {
						db.createIndex(collection, "journal.title", function(err, name) {
							db.createIndex(collection, "journal.issn", function(err, name) {
								db.createIndex(collection, "journal.eissn", function(err, name) {
									db.createIndex(collection, "journal.lissn", function(err, name) {
										db.createIndex(collection, "journal.pubDate.year", function(err, name) {
											db.createIndex(collection, "journal.volume", function(err, name) {
												db.createIndex(collection, "journal.issue", function(err, name) {
													db.createIndex(collection, "pagnation.fp", function(err, name) {
														db.createIndex(collection, "pagnation.lp", function(err, name) {
															db.createIndex(collection, "meshHeadings.descriptorName.text", function(err, name) {
																db.createIndex(collection, "meshHeadings.qualifierName.text", function(err, name) {
																	console.log("Indexes added! Connecting to FTP!");
																	startFTP();
																});
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			} else {
				startFTP();
			}

			function startFTP() {
				var c = new ftp();
				c.on('ready', function() {
					console.log("FTP connected!");
					c.cwd("/nlmdata/.medleasebaseline/gz/", function(err, currentDir) {
						if(err) throw err;
						console.log("Directory changed to .medleasebaseline directory. Loading directory listing.");
						c.list(function(err, list) {
							if(err) throw err;

							console.log("Directory listing received! Items: "+list.length);

							var newList = new Array();

							if(baselineNumber >= 0) {
								for(var i=0, ii=list.length; i<ii; i++) {
									if(rMedlineNrExtract.test(list[i].name)) {
										if(parseInt(rMedlineNrExtract.exec(list[i].name)[1], 10) >= baselineNumber) {
											newList.push(list[i].name);
										}
									}
								}
							} else {
								for(var i=0, ii=list.length; i<ii; i++) {
									if(rMedlineNrExtract.test(list[i].name)) {
										newList.push(list[i].name);
									}
								}
							}

							console.log("Files to process: "+newList.length);

							processFTP(c, coll, newList);
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
		});
	}

	function update(updateInfo) {
		console.log("Updating!");
		MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
			if(err) throw err;

			var coll = db.collection(collection);

			console.log("MongoDB connected!");

			console.log("Connecting to FTP!");
			startFTP();

			function startFTP() {
				var c = new ftp();
				c.on('ready', function() {
					console.log("FTP connected!");
					c.cwd("/nlmdata/.medlease/gz/", function(err, currentDir) {
						if(err) throw err;
						console.log("Directory changed to .medlease directory. Loading directory listing.");
						c.list(function(err, list) {
							if(err) throw err;

							console.log("Directory listing received! Items: "+list.length);

							var newList = new Array();

							if(updateInfo >= 0) {
								for(var i=0, ii=list.length; i<ii; i++) {
									if(rMedlineNrExtract.test(list[i].name)) {
										if(parseInt(rMedlineNrExtract.exec(list[i].name)[1], 10) >= updateInfo) {
											newList.push(list[i].name);
										}
									}
								}
							} else {
								for(var i=0, ii=list.length; i<ii; i++) {
									if(rMedlineNrExtract.test(list[i].name)) {
										newList.push(list[i].name);
									}
								}
							}

							console.log("Files to process: "+newList.length);

							processFTP(c, coll, newList);
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
		});
	}

	function parseCommand(command) {
		var words = command.trim();

		if(baselineQuestion === 0) {
			if(words.toUpperCase() === "N") {
				console.log("New choosen");
				importBaseline(-1);
				stdin.unpipe(esSplit);
			} else {
				console.log("Continue choosen");
				console.log("Which baseline file number were you on? (will start on this one)");
				baselineQuestion = 1;
			}
		} else if(baselineQuestion === 1) {
			if(!rNonInt.test(words)) {
				importBaseline(parseInt(words, 10));
				stdin.unpipe(esSplit);
			} else {
				console.log("Input invalid, try again!");
			}
		}
	}

	function processFTP(c, coll, list) {
		var inserted = 0, updated = 0;

		console.log("starting download");

		run();

		function run() {
			if(list.length > 0) {
				var working = list.shift();
				if(rgzipTest.test(working)) {
					console.log("Downloading: "+working);
					c.get(working, function(err, stream) {
						if(err) throw err;
						stream.once('close', function() {
							console.log("XML file downloaded");
							if(type === "update") {
								fs.writeFile("./lastUpdate.txt", parseInt(rMedlineNrExtract.exec(working)[1], 10)+"", function(err) {
									if(err) return console.error(err);
								})
							}
							run();
						});
						var gzip = zlib.createGunzip(),
							unshifted = 0;

						medline2json.parse(stream.pipe(gzip), true, function(err, json) {
							if(err) {
								if(unshifted < 3) {
									list.unshift(working);
									unshifted++;
								}
								return console.error(err);
							}
							if(!json) {
								return console.error("JSON is null!");
							}
							json = JSON.parse(json);

							if(json.delete) {
								var ids = [];
								for(var i=0,ii=json.delete.length; i<ii; i++) {
									ids.push(json.delete[i].pmid);
								}
								coll.remove({"_id": ids}, {safe: true, w:1}, function(err, obj) {
									if(err) {
										return console.error(err);
									}
								});
							} else {
								coll.findOne({"_id": json._id}, function(err, obj) {
									if(err) {
										return console.error(err);
									}
									if(obj) {
										coll.update({"_id": json._id}, json, {safe: true, w:1}, function(err, records) {
											if(err) {
												return console.error(err);
											}
											updated++;
										});
									} else {
										coll.insert(json, {safe: true, w:1}, function(err, records) {
											if(err) {
												return console.error(err);
											}
											inserted++;
										});
									}
								});
							}
						});
					});
				} else {
					run();
				}
			} else {
				console.log("Finished!");
				console.log(Date.now());
				console.log(inserted);
				console.log(updated);
				c.end();
			}
		}
	}
}());
