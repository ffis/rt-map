(function(logger){
	'use strict';

	const path = require('path'),
		fs = require('fs'),
		express = require('express'),
		fileUpload = require('express-fileupload'),
		PythonShell = require('python-shell'),
		archiver = require('archiver'),
		parseString = require('xml2js').parseString,
		app = express(),
		config = require('./config.json');

	if (typeof config.utility !== 'string'){
		throw new Error('Utility not properly configured on config.json file');
	}

	app
		.get('/api/config', function(req, res){
			res.json(config.clientconfig);
		})
		.use(fileUpload({safeFileNames: true}))
		.post('/api/upload', function(req, res) {
			if (!req.files){
				return res.status(400).send('No files were uploaded.');
			}

			const file = req.files.map;
			const now = new Date();
			const directory = path.join(config.tmpdir, String(now.getTime())),
				filename = path.join(directory, 'original');

			fs.mkdirSync(directory);
			file.mv(filename, function(err) {
				if (err){
					return res.status(500).json(err);
				}

				const args = ['-l', '-p', 'raster', '-w', 'none', filename, directory];
				logger.log(args);
				PythonShell.run(config.utility, {
					mode: 'text',
					scriptPath: './lib',
					args: args
				}, function (err2, response) {
					if (err2){

						return res.status(500).json([err2, response]);
					}

					const xml = String(fs.readFileSync(path.join(directory, 'tilemapresource.xml'), 'utf8'));
					parseString(xml, function (err4, result) {
						if (err4){
							return res.status(500).json(err4);
						}
						fs.writeFileSync(path.join(directory, 'tilemapresource.json'), JSON.stringify(result), 'utf8');
						res.writeHead(200, {
							'Content-Type': 'application/zip',
							'Content-disposition': 'attachment; filename=map.zip'
						});

						const zip = archiver('zip', {'zlib': {'level': 9}});
						zip.pipe(res);
						zip.file(path.join(__dirname, 'node_modules/leaflet-rastercoords/rastercoords.js'), {name: 'rastercoords.js'});
						zip.file(path.join(__dirname, 'node_modules/leaflet/dist/leaflet.js'), {name: 'leaflet.js'});
						zip.file(path.join(__dirname, 'node_modules/leaflet/dist/leaflet.css'), {name: 'leaflet.css'});
						zip.file(path.join(__dirname, 'public/template/index.html'), {name: 'index.html'});
						zip.directory(directory, 'map');
						zip.finalize();
					});
				});
			});
		})
		.use(express.static(path.join(__dirname, 'public')))
		.use(function(req, res, next) {
			if (req.originalUrl.endsWith('.png')){
				return res.redirect('/blank.png');
			}
			next();
		})
		.listen(config.port, function(){
			logger.log('Listening on port:', config.port);
		});

})(console);
