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

Open your browser on [http://localhost:10101/](http://localhost:10101/) and enjoy.


# Local version

If vagrant version is too hard to deploy then try with the local version.

## Prerequisites

* Python, version 2.7 branch ( ```sudo apt-get install python``` )
* Python-gdal, version 1.11 or greater ( ```sudo apt-get install python-gdal``` )
* Git, version 2.7.4 or greater ( ```sudo apt-get install git``` )
* NodeJS LTS runtime with NPM, version 8 or greater (```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -; sudo apt-get -y install nodejs``` )

## Installation

Run this in terminal:

```bash
git clone https://github.com/ffis/rt-map
cd rt-map
npm install
vim config.json  # config default port and datadir directory
```

[![Installation process in video](https://img.youtube.com/vi/uhI4jy1_Hec/0.jpg) Installation process in video](https://www.youtube.com/watch?v=uhI4jy1_Hec)

## Run the application

```bash
node .
```

Then open your browser (a recent one). The default URL is: http://localhost:[config.json.port]/
where config.json.port is the parameter you may have changed on _config.json_ file.

## Example of usage

Let's image that we have an indoor map, for example a hospital service indoor map.
What we want to do is see how it evolves the capacity or occupation over the time
or best say, in real time.

### What do we need?

We need:

+ Before start requisites:
  - an indoor map in high resolution, lets say of at least 2000px of width and 1000px of height.
  - a web service that provides real time information related to what beds are being used and
  some details of who does.
+ Phase 1:
  - run the map manager
  - a couple of minutes to set where every bed is located.
  - download the map as zip
+ Phase 2:
  - unzip the downloaded file
  - configure the _api.js_ file
  - deploy using a lightweight web server

### Phase 1

Now that the application is listening on port 10101, open the browser on:
[http://localhost:10101/](http://localhost:10101/)

You'll se a window with a blue button that enables you to "Upload an image".
Press on it an choose your image.
After uploading it gets some time to process it and render the map.
When it ends you'll see the map and you zoom using the wheel of the mouse,
you may also pan clicking on the map using drag and drop.

Let's continue with the beds of the hospital service example and suppose your assets,
have a rectangle figure. Press on _"Rectangle"_, enter the unique name of the asset on the field
_"name of the new sprite"_, click on the top-left corner of the asset and click on the bottom-right
corner of the asset. That's it. Change the name and repeat the process until no more assets left.
When you are done go to the _"Details"_ section and enter the title of the map. Press on the
_"Send changes to server and refresh map"_ button. Now you can download the map using _"Download map"_
button.


[![Example of Phase 1](https://img.youtube.com/vi/d0-uBRhWkgw/0.jpg) Example of Phase 1](https://www.youtube.com/watch?v=d0-uBRhWkgw)

### Phase 2





## Copyright notes:


This software uses a modified version of  gdal2tiles.py named gdal2tiles-leaflet, available under MIT license following this link: https://github.com/commenthol/gdal2tiles-leaflet This code belongs to:
* Copyright (c) 2008, Klokan Petr Pridal
* Copyright (c) 2010-2013, Even Rouault


This software is available under MIT license:
* Copyright (c) 2017, FFIS

Author: Loksly
