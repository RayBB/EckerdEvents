"use strict";
var request   = require('request');
var firebase  = require('firebase-admin');
var config    = require( "./config.json" );
let cert = config.fireBaseCert;
let accessToken = config.facebookAccessToken;

firebase.initializeApp({
  credential: firebase.credential.cert(cert),
  databaseURL: "https://eckerdevents.firebaseio.com"
});


exports.addPages = addPages;

exports.handler = (event, context, callback) => {
	////Main Logic

	updateAllPagesInfo().then(function(pageInfo){
		console.log("Got IDs");
		var promiseArray = pageInfo.map(page => getEvents(page.id));
		console.log(promiseArray);
		Promise.all(promiseArray).then(values => {
			console.log("about to save");
			var finalArray = [];

      var hours24 = 1000 * 60 * 60 * 24;
      var now = new Date();
			values.forEach(arr => {finalArray = finalArray.concat(arr);});

		  	// make only events in the past 24 hours and after
		  	var current = finalArray.filter(item => (new Date(item.end_time) - now > -hours24));
		  	firebase.database().ref('currentEvents').set(current, function(){
		  		console.log("Current events sent to the server successfully!");
		  	});

		  	// Save all events
		  	firebase.database().ref('events').set(finalArray, function(){
		  		firebase.database().goOffline();
		  		console.log("All events sent to the server successfully!");
		  		callback(null, "Success!");
		  	});
		})
		.catch(reason => reject(reason));
	});


};//end export



//Adds sets the array of urls to firebase
function addPages(pagesArr){
	let pages = pagesArr.map(item => { return {url: item}; });
	firebase.database().ref('pages').set(pages,function(){console.log("pages sent!");});
}

// Grabs last 25 events posted by a page
function getEvents(pageId){
	var url = "https://graph.facebook.com/" + pageId + "/events?access_token=" + accessToken;
	console.log("getting " + url);
	return new Promise(function (resolve,reject) {
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				//console.log(response);
				var eventsArr = JSON.parse(body).data.map(eventt => eventt.id);
				console.log(eventsArr);
				resolve(getAllEvents(eventsArr));
		    }
		});
	});
}


//Get detailed events info for a page.
function getAllEvents(idArr){
	return new Promise(function(resolve, reject){
		var promiseArray = idArr.map(item => getEventData(item));

		Promise.all(promiseArray).then(values => {
			//console.log(values);
			resolve(values);// Resolves an array of detailed events for a page
		})
		.catch(reason => reject(reason));
	});
}



	// Gets detailed informaiton for a single event
function getEventData(eventId){
	var fields = "?fields=" + "id,interested_count,is_canceled,attending_count,category,"+
	"cover,description,end_time,maybe_count,name,owner,place,start_time,type,updated_time";

	var url = "https://graph.facebook.com/" + eventId + fields + "&access_token=" + accessToken;
	return new Promise(function(resolve, reject){
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				resolve(JSON.parse(body));
			} else {
				reject(error);
			}
		});
	});
}



// Returns array of page objects with id, url, and name
function updateAllPagesInfo(){
	console.log("Updating all pages!");
	return new Promise(function(resolve, reject){
		var pagesref = firebase.database().ref('pages');
		pagesref.once('value').then(function(snapshot){
			var pageData = snapshot.val();
			var promiseArray = []; // Array of promises to be waited for
			var updatedArray = []; // New array that will be sent to firebase
			console.log("updating ids");
			for (let i = 0; i < pageData.length; i++){
				let temp = pageData[i];
				if (typeof temp.id === 'undefined'){
					promiseArray.push(getPageIDfromURL(temp.url));
				} else{
					updatedArray.push(temp);
				}
			}

			Promise.all(promiseArray).then(values => {
				console.log("Uploading updated pages");
				updatedArray = updatedArray.concat(values);
			  	pagesref.set(updatedArray, function(){resolve(updatedArray);});
			}).catch(reason => reject(reason));

		});
	});

	//Returns obj with information of page
	function getPageIDfromURL(url){
		// Must set user agent so appropriate page is returned
		var headers = {
		"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.100 Safari/537.36"
		};
		url = url.match(/https:\/\/www.facebook.com\/[^/]*/)[0];
		return new Promise(function(resolve, reject){
			request({headers: headers, url:url}, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			  	var id = body.match(/fb:\/\/page\/\?id=\d*/g)[0].replace("fb://page/?id=","");
			  	var name = body.match('"pageName":"[^"]*')[0].replace('"pageName":"','');
			    console.log("Page ID: " + id);
			    var obj = {url: url, id: id, name: name};
				resolve(obj);
			  } else {
			  	reject("Error, no page ID found for " + url);
			  }
			});
		});
	}

}
