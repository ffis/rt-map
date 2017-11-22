(function(logger){
	'use strict';

	const path = require('path'),
		fs = require('fs'),
		express = require('express'),
		bodyParser = require('body-parser'),
		fileUpload = require('express-fileupload'),
		PythonShell = require('python-shell'),
		archiver = require('archiver'),
		parseString = require('xml2js').parseString,
		app = express(),
		config = require('./config.json');

	if (typeof config.utility !== 'string'){
		throw new Error('Utility not properly configured on config.json file');
	}

	const staticResources = {
		'rastercoords.js': 'node_modules/leaflet-rastercoords/rastercoords.js',
		'leaflet.js': 'node_modules/leaflet/dist/leaflet.js',
		'leaflet.css': 'node_modules/leaflet/dist/leaflet.css'
	};

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
			const now = new Date(),
				dir = String(now.getTime()),
				directory = path.join(config.datadir, dir),
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
						fs.writeFileSync(path.join(directory, 'sprites.json'), JSON.stringify({id: dir, title: '', sprites: []}), 'utf8');

						res.json({'id': dir});
					});
				});
			});
		})
		.use('/api/map/:id/sprites.json', bodyParser.json()).post('/api/map/:id/sprites.json', function(req, res){
			const directory = path.join(config.datadir, String(parseInt(req.params.id, 10)));
			const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
			fs.writeFileSync(path.join(directory, 'sprites.json'), body, 'utf8');

			res.json(body);
		})
		.get('/api/map/:id/**', function(req, res){
			const id = parseInt(req.params.id, 10),
				directory = path.join(config.datadir, String(id)),
				prefix = '/api/map/' + id + '/';

			if (parseInt(req.params.id, 10) > 0){
				const filename = req.originalUrl.replace(prefix, '');

				res.sendFile(filename, {root: directory});
			} else {
				res.status(404).send('Not found');
			}
		})
		.get('/api/download/:id', function(req, res){
			if (parseInt(req.params.id, 10) > 0){
				const directory = path.join(config.datadir, String(parseInt(req.params.id, 10)));
				fs.stat(directory, function(err, stats){
					if (err){
						res.status(404).send('Not found');
					}

					if (stats.isDirectory()){
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
					} else {
						res.status(404).send('Not found');
					}
				});
			} else {
				res.status(404).send('Not found');
			}
		});

	Object.keys(staticResources).forEach(function(name){
		app.get('/' + name, function(req, res){
			res.sendFile(staticResources[name], {root: __dirname});
		});
	});

	app.use(express.static(path.join(__dirname, 'public')))
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
