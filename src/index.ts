
import { resolve } from "path";
import { stat, writeFileSync } from "fs";
import express, { json, Request, Response, static as expressstatic } from "express";

import fileUpload from "express-fileupload";
import archiver from "archiver";

import { uploadController } from "./controllers/upload";

const app = express();
const config = require("../config.json");

if (typeof config.utility !== "string"){
	throw new Error("Utility not properly configured on config.json file");
}

if (typeof config.datadir !== "string"){
	throw new Error("Data directory not properly configured on config.json file");
}

const datadir = resolve(__dirname, "..", config.datadir);

const staticResources = {
	"jquery.min.js": "node_modules/jquery/dist/jquery.min.js",
	"rastercoords.js": "node_modules/leaflet-rastercoords/rastercoords.js",
	"leaflet.js": "node_modules/leaflet/dist/leaflet.js",
	"leaflet.css": "node_modules/leaflet/dist/leaflet.css"
};


app
	.get("/api/config", (_req: Request, res: Response) => {
		res.json(config.clientconfig);
	})
	.use(fileUpload({safeFileNames: true}))
	.post("/api/upload", uploadController({datadir, utility: config.utility}))
	.use("/api/map/:id/featurecollection.json", json()).post("/api/map/:id/featurecollection.json", function(req, res){
		const directory = resolve(datadir, String(parseInt(req.params.id, 10)));
		const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body, null, "\t");
		writeFileSync(resolve(directory, "featurecollection.json"), body, "utf8");

		res.json(body);
	})
	.get("/api/map/:id/**", function(req, res, next){
		const id = parseInt(req.params.id, 10),
			directory = resolve(config.datadir, String(id)),
			prefix = "/api/map/" + id + "/";

		if (parseInt(req.params.id, 10) > 0){
			const filename = req.originalUrl.replace(prefix, "");

			stat(resolve(directory, filename), function(err, stats){
				if (err){
					return next();
				}
				if (stats.isFile()){
					return res.sendFile(filename, {root: directory});
				}

				next();
			});

		} else {
			res.status(404).send("Not found");
		}
	})
	.get("/api/download/:id", function(req, res){
		if (parseInt(req.params.id, 10) > 0){
			const directory = resolve(datadir, String(parseInt(req.params.id, 10)));
			stat(directory, function(err, stats){
				if (err){
					res.status(404).send("Not found");
				}

				if (stats.isDirectory()){
					res.writeHead(200, {
						"Content-Type": "application/zip",
						"Content-disposition": "attachment; filename=map.zip"
					});
					const zip = archiver("zip", {"zlib": {"level": 9}});
					zip.pipe(res);

					zip.file(resolve(__dirname, "..", "node_modules/jquery/dist/jquery.min.js"), {name: "jquery.min.js"});
					zip.file(resolve(__dirname, "..", "node_modules/leaflet-rastercoords/rastercoords.js"), {name: "rastercoords.js"});
					zip.file(resolve(__dirname, "..", "node_modules/leaflet/dist/leaflet.js"), {name: "leaflet.js"});
					zip.file(resolve(__dirname, "..", "node_modules/leaflet/dist/leaflet.css"), {name: "leaflet.css"});
					zip.file(resolve(__dirname, "..", "node_modules/leaflet/dist/images/layers.png"), {name: "images/layers.png"});
					zip.file(resolve(__dirname, "..", "public/template/index.html"), {name: "index.html"});
					zip.file(resolve(__dirname, "..", "public/template/api.js"), {name: "api.js"});
					zip.file(resolve(__dirname, "..", "public/template/run.js"), {name: "run.js"});
					zip.file(resolve(__dirname, "..", "public/template/style.css"), {name: "style.css"});

					zip.directory(directory, "map");
					zip.finalize();
				} else {
					res.status(404).send("Not found");
				}
			});
		} else {
			res.status(404).send("Not found");
		}
	});

Object.keys(staticResources).forEach((name: string) => {
	app.get("/" + name, (_req: Request, res: Response) => {
		res.sendFile((staticResources as any)[name], {root: resolve(__dirname, "..")});
	});
});

app.use(expressstatic(resolve(__dirname, "..", "public")))
	.use(function(req, res, next) {
		if (req.originalUrl.endsWith(".png")){
			return res.redirect("/blank.png");
		}
		next();
	})
	.listen(config.port, function(){
		console.log("Listening on port:", config.port);
	});

