# MEDLINEInserter

MEDLINEInserter is a Node.js application designed for MEDLINE®/PubMed® Data licensees to download (via FTP), convert (using the module MEDLINEXMLToJSON), and insert the data into a Mongo database.

We are in no way affiliated with MEDLINE® or PubMed®. We're only a MEDLINE® licensed library that want to share this software with the public so that anyone with a MEDLINE license can easier utilize MEDLINE® metadata for improving healthcare.

Wikipedia has an article regarding MEDLINE® here https://en.wikipedia.org/wiki/MEDLINE and PubMed here https://en.wikipedia.org/wiki/PubMed

The U.S. National Library of Medicine have a page about MEDLINE® here http://www.nlm.nih.gov/pubs/factsheets/medline.html

## Dependencies
[MEDLINEXMLToJSON](https://github.com/ldbib/MEDLINEXMLToJSON) developed by [Emil Hemdal](https://github.com/emilhem) for [ldbib](https://github.com/ldbib).
[node-ftp](https://github.com/mscdex/node-ftp) by [Brian White](https://github.com/mscdex).
[mongodb](http://mongodb.github.io/node-mongodb-native/) ([GitHub](https://github.com/mongodb/node-mongodb-native)) by [MongoDB](https://github.com/mongodb).

## Installation
```
git clone git@github.com:ldbib/MEDLINEInserter.git
```
```
npm install medlinexmltojson ftp mongodb
```
Rename config.sample.js to config.js and modify it to suit your needs.

## License
This project is released under the terms of the [GNU AGPL version 3](https://www.gnu.org/licenses/agpl.html)

## Author
[Emil Hemdal](https://github.com/emilhem)

## Changelog

### Version 0.0.1 - 12th of August 2014
Development in progress...
