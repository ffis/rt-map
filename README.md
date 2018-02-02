# RT-MAP

Real time map manager.

![RT-Map Explanation](./rt-map-explanation.png?d=1)


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

Let's imagine that we have an indoor map, for example a hospital service indoor map.
What we want to do is see how evolves the capacity or occupation over the time
or best say, in real time.

### What do we need?

We need:

+ Before start requisites:
  - an indoor map in high resolution, let's say of at least 2000px of width and 1000px of height.
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

### Before start requisites:

* An indoor map in high resolution:

[![Example of Phase 1](https://annieheatoncapstone.files.wordpress.com/2011/02/patient-room-floor.jpg) Example of an image that should work perfectly with this software](https://annieheatoncapstone.files.wordpress.com/2011/02/patient-room-floor.jpg)

Note this image is not related to us and credit belongs to its owner.

* A web service with real time information

Here you may have an url that returns data in a web the browser can handle like _JSON_, _XML_ or _CSV_. For example, in _JSON_ it might look like this:
```json
[  
    {  
        "patient":{  
            "name":"Loksly",
            "fullname":"B. Loksly",
            "gender":"male"
        },
        "room":"1A"
    },
    {  
        "patient":{  
            "name":"Diana",
            "fullname":"D. Loksly",
            "gender":"female"
        },
        "room":"1B"
    }
]
```

Note here the _"room"_ attribute is what you will need to match with the name of the assets you will enter in Phase 1.


### Phase 1

Now that the application is listening on port 10101, open the browser on:
[http://localhost:10101/](http://localhost:10101/)

You'll se a window with a blue button that enables you to "Upload an image".
Press on it an choose your image.
After uploading it gets some time to process it and render the map.
When it ends you'll see the map and you can zoom using the wheel of the mouse,
you may also pan clicking on the map using drag and drop.
Most of this magic belongs to [leaflet](http://leafletjs.com/) team.

Let's continue with the beds of the hospital service example and suppose your assets,
have a rectangle figure. Press on _"Rectangle"_, enter the unique name of the asset on the field
_"name of the new sprite"_, click on the top-left corner of the asset and click on the bottom-right
corner of the asset. That's it. Change the name and repeat the process until no more assets left.
Just to use the same terminology let's call each of these rectangles _Sprite_.
When you are done go to the _"Details"_ section and enter the title of the map. Press on the
_"Send changes to server and refresh map"_ button. Now you can download the map using _"Download map"_
button.

If you need to change an Sprite, add a new one or delete save the link for later usage.
It will work unless you delete the _data_ directory you have set on _config.json_ file.


[![Example of Phase 1](https://img.youtube.com/vi/d0-uBRhWkgw/0.jpg) Example of Phase 1](https://www.youtube.com/watch?v=d0-uBRhWkgw)

### Phase 2

After you uncompress the zip file you'll see a directory with several files.
You may change what file you want to get your view but it should be enough to
keep your changes only on _api.js_ file.
This file has a default implementation where you have access to window, document, leafletmap and jQuery objects.

The main parts of the code you need to pay attention to are:


_**loadElements** method_: This method is called each time your data need to be retrieved, it should return a _Promise_.
The default implementation is a $.getJSON, but you may use another _Promise_ based method instead.
The _Promise_ should return an array of objects.

```js
rtMapAPI.prototype.loadElements = function() {
	return $.getJSON('testdata.json'); /* note you may add a callback=? parameter to use JSONP */
};
```


_**matches** method_: This method is called to check which of the elements downloaded using _loadElements_ method which _sprite_ represents it.
```featureProperties.id``` is the name you have entered on each _sprite_ on phase 1 and _name_ is the attribute that should have the same value if the element is occupying that sprite.

```js
rtMapAPI.prototype.matches = function(element, featureProperties) {
	return featureProperties.id === element.name; //you probably only want to change "name" to something different and keep the rest of the method as it is.
};
```


_**style** method_: This method sets for an _sprite_ how it should be drawn depending on which elements have been matched using the _matches_ method.

```js
rtMapAPI.prototype.style = function(elements){
	return {
		fillColor: (elements.length === 1 ? (elements[0].attr === 'specialValue' ? '#4E2AFC' : '#FC4E2A') : '#FC4AE2'),
		weight: 2,
		opacity: elements.length === 0 ? 0 : 1,
		color: 'white',
		dashArray: '3',
		fillOpacity: elements.length === 0 ? 0 : 0.01 * elements[0].mySpecialAttribute
	};
};
```

_**getPopupText** method_: This method should return a text that is rendered like a tooltip text.

```js
rtMapAPI.prototype.getPopupText = function(elements){
	return elements.map(function(element){
		return element.name + ' ' + element.mySpecialAttributeDetails + ' <a href="#">' + element.mySpecialAttribute + '</a>';
	}).join(', ');
};
```

_**setRefreshTimeout** method_: This method sets an interval of the time the map should ask for new updates.
In practice when the timeout happens the _loadElements_ method is called and the sprites are re-styled.

```js
rtMapAPI.prototype.setRefreshTimeout = function(cb) {
	setInterval(cb, 3000);
};
```

_**ready** method_: This method runs when the map has been loaded before the data has been retrieved for the first time.
```js
rtMapAPI.prototype.ready = function() {
	
};
```

_**setVisible** method_: This method is called to let you know which of the elements that _loadElements_
method have downloaded have a _sprite_ that represents them.

```js
rtMapAPI.prototype.setVisible = function(elements){
	this.elements = elements;
};
```


As an example of what you may get after a properly configured _api.js_ file look this video:

[![Example of a real map performance](https://img.youtube.com/vi/iFfwqODGM2o/0.jpg) Example of a real map performance](https://www.youtube.com/watch?v=iFfwqODGM2o)



## Copyright notes:

This software uses a modified version of  gdal2tiles.py named gdal2tiles-leaflet,
available under MIT license following this link: https://github.com/commenthol/gdal2tiles-leaflet
This code belongs to:
* Copyright (c) 2008, Klokan Petr Pridal
* Copyright (c) 2010-2013, Even Rouault


This software is available under MIT license:
* Copyright (c) 2018, FFIS
 
 Author: Loksly https://github.com/loksly/
