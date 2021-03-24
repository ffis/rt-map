import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Request, Response } from "express";
import { parseString } from "xml2js";
import { PythonShell } from "python-shell";

export function uploadController({datadir, utility}: {datadir: string, utility: string}) {
    return (req: Request, res: Response) => {
        if (!req.files || Array.isArray(req.files.map)) {
            res.status(400).send("No files were uploaded.");
            return;
        }

        const file = req.files.map;
        const dir = String(Date.now());
        const directory = resolve(datadir, dir);
        const filename = resolve(directory, "original");

        mkdirSync(directory);
        file.mv(filename, (err) => {
            if (err) {
                res.status(500).json(err);
                return;
            }

            const args = ["-l", "-p", "raster", "-w", "none", filename, directory];

            PythonShell.run(utility, {
                pythonPath: "python",
                mode: "text",
                scriptPath: resolve(__dirname, "..", "..", "lib"),
                args: args

            }, (err2, response) => {
                if (err2){
                    res.status(500).json([err2, response]);
                    return;
                }

                const xml = String(readFileSync(resolve(directory, "tilemapresource.xml"), "utf8"));
                parseString(xml, (err4, result) => {
                    if (err4) {
                        res.status(500).json(err4);
                        return;
                    }

                    const featureCollection = {id: dir, type: "FeatureCollection", "features": [], "properties": {title: ""}};

                    writeFileSync(resolve(directory, "tilemapresource.json"), JSON.stringify(result), "utf8");
                    writeFileSync(resolve(directory, "featurecollection.json"), JSON.stringify(featureCollection, null, "\t"), "utf8");

                    res.json({"id": dir});
                });
            });
        });
    };
}