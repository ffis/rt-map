# RT-MAP

Real time map manager

# Vagrant version 

## Prerequisites
* Vagrant 1.8.1 or greater

## Instructions

* Download Vagrant file
* Run ```vagrant up```

Then it will need about 4-5 minutes depending on your bandwidth. When it ends you can see a message like:

```text
Listening on port: 10101
```

Open your browser on http://localhost:10101/ and enjoy.


# Local version

If vagrant version is too hard to deploy then try with the local version.

## Prerequisites

* Python 2.7 branch ( sudo apt-get install python )
* Python-gdal 1.11 or greater ( sudo apt-get install python-gdal )
* Git 2.7.4 or greater (sudo apt-get install git)

## Installation

```bash
git clone https://github.com/ffis/rt-map
cd rt-map
npm install
vim config.json  # config default port and datadir directory
npm test
```

If all the tests have passed then you may run the application.

## Run the application

```bash
node .
```

Then open your browser (a recent one). The default URL is: http://localhost:[config.json.port]/
where config.json.port is the parameter you may have changed on _config.json_ file.


## Copyright notes:


This software uses a modified version of  gdal2tiles.py named gdal2tiles-leaflet, available under MIT license following this link: https://github.com/commenthol/gdal2tiles-leaflet This code belongs to:
* Copyright (c) 2008, Klokan Petr Pridal
* Copyright (c) 2010-2013, Even Rouault
