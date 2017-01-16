if (window.location.href.search("all") > -1){
  console.log("all");
  var url = "https://eckerdevents.firebaseio.com/events.json";
} else {
  console.log("not all");
  var url = "https://eckerdevents.firebaseio.com/currentEvents.json";
}

//Polyfill's the remove method for older browsers
(function (arr) {
    arr.forEach(function (item) {
        item.remove = item.remove || function () {
            this.parentNode.removeChild(this);
        };
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

var request = new XMLHttpRequest();
var events, e2;

request.open('GET', url, true);
request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    events = JSON.parse(request.responseText);

    var e2 = events;
    for (var i = 0; i < e2.length; i++){
      // This adds anchor links to plaintext urls
      var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      var l = e2[i].description;
      if (l !== undefined) e2[i].description = l.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
    }

    document.getElementById('loading').remove();
    document.getElementById('eventContainer').style.visibility = "visible";
    setup();

  } else {
    // We reached our target server, but it returned an error
    console.log("Error connecting to firebase");
  }
};

request.send();


function updateWook(){
  console.log("wook updated");
  //wookmark.layout(true); This could be used if we didn't need search
  var options = {
    autoResize: true,
    offset: 8, // distance between
    outerOffset: 2
  }
  wookmark = new Wookmark('#eventContainer', options);
}

//sends update command repeatedly as animations happen
function repeat(n, obj){
  var n = (typeof n !== 'undefined') ?  n-1 : 20;
  updateWook();
  if (obj !== undefined) obj.classList.toggle('expanded');
  if (n > 0) setTimeout(function(){repeat(n);}, 50);
}


function setup(){
  var app4 = new Vue({
    el: '#app-4',
    data: {
      events: events || [],
      searchText: ""
    },
    computed: {
      sortedEvents : function(){
        var t = this.events.sort(function(a,b){
          return new Date(a.start_time) - new Date(b.start_time);
        });

        var st = this.searchText.toLowerCase();
        var searched = t.filter(function(obj){
          return JSON.stringify(obj).toLowerCase().indexOf(st) > -1;
        })
        return searched;
      }
    },
    methods: {
      getDate: function (event) {
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var d = new Date(event.start_time);
        var string = days[d.getDay()];
        string += " " + months[d.getMonth()].slice(0,3);
        string += " " + d.getDate() + " " + d.getFullYear() + " ";
        return string;
      },
      getTime: function (event){
        var string = "";
        var a = new Date(event.start_time);
        var b = new Date(event.end_time);
        function formatAMPM(date) {
          var hours = date.getHours();
          var minutes = date.getMinutes();
          var ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0'+minutes : minutes;
          var strTime = hours + ':' + minutes + ' ' + ampm;
          return strTime;
        }
        string += formatAMPM(a);
        string += " - ";
        string += event.end_time ? formatAMPM(b) : "?";
        return string;
      }
    }
  });
}
