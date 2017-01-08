# EckerdEvents
Aggregates all the Facebook events from different pages and shows them in one convenient location.
[Live Demo Here] (https://raybb.github.io/EckerdEvents/)

On the back-end, this uses AWS Lambda to pull the events from a list of Facebook Pages every 24 hours.
Those events are then put into a Firebase Database.

On the front-end, the current events are pulled from firebase and the page is generated using Vue.jS.

To run this program you must put your facebook access token and firebase Certificate in the config.json file. See config_demo.json.



## Dependencies
[request](https://github.com/request/request),
[FireBase Admin](https://www.npmjs.com/package/firebase-admin),
[Wookmark](https://github.com/germanysbestkeptsecret/Wookmark-jQuery),
[Material Design Lite](https://github.com/google/material-design-lite),
[Vue.js](https://vuejs.org/),
