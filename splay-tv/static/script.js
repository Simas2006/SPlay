var fs = require("fs");
var DATA_FOLDER = __dirname + "/../data";

var currentPage = "home";
var queue = [];
var aa; // Audio Agent
var pf = { // Page Functions
  "home": {load: Function.prototype},
  "mlibrary": {
    "path": "/",
    "selected": null,
    "load": function() {
      pf.mlibrary.path = "/";
      pf.mlibrary.renderLinks();
    },
    "back": function() {
      if ( pf.mlibrary.path == "/" ) {
        openPage("home");
        return;
      }
      pf.mlibrary.path = pf.mlibrary.path.split("/").slice(0,-2).concat([""]).join("/");
      pf.mlibrary.renderLinks();
    },
    "toggleSelect": function() {
      if ( pf.mlibrary.selected.filter(item => ! item).length > 0 ) {
        pf.mlibrary.selected = pf.mlibrary.selected.map(item => true);
      } else {
        pf.mlibrary.selected = pf.mlibrary.selected.map(item => false);
      }
      pf.mlibrary.renderLinks();
    },
    "addToQueue": function() {
      fs.readdir(`${DATA_FOLDER}/music/${pf.mlibrary.path}`,function(err,list) {
        if ( err ) throw err;
        list = list.filter((item,index) => pf.mlibrary.selected[index]).map(item => `${pf.mlibrary.path}${item}`);
        var pnsFlag = queue.length <= 0;
        queue = queue.concat(list);
        openPage("home");
        if ( pnsFlag ) aa.playNextSong();
      });
    },
    "renderLinks": function() {
      fs.readdir(`${DATA_FOLDER}/music/${pf.mlibrary.path}`,function(err,list) {
        if ( err ) throw err;
        fs.stat(`${DATA_FOLDER}/music/${pf.mlibrary.path}/${list[0]}`,function(err,stats) {
          var isDir = stats.isDirectory();
          if ( ! isDir ) {
            if ( ! pf.mlibrary.selected ) pf.mlibrary.selected = list.map(item => false);
            document.getElementById("mlibrary-button1").style.display = "inline";
            document.getElementById("mlibrary-button2").style.display = "inline";
            if ( pf.mlibrary.selected.filter(item => ! item).length > 0 ) document.getElementById("mlibrary-button1").innerText = "Select All";
            else document.getElementById("mlibrary-button1").innerText = "Deselect All";
          } else {
            document.getElementById("mlibrary-button1").style.display = "none";
            document.getElementById("mlibrary-button2").style.display = "none";
          }
          var div = document.getElementById("mlibrary-items");
          while ( div.firstChild ) {
            div.removeChild(div.firstChild);
          }
          for ( var i = 0; i < list.length; i++ ) {
            var a = document.createElement("a");
            a.innerText = list[i];
            if ( ! isDir ) a.style.color = pf.mlibrary.selected[i] ? "#00aa00" : "blue";
            a["data-index"] = i;
            a.onclick = function() {
              var index = parseInt(this["data-index"]);
              if ( isDir ) {
                pf.mlibrary.path += list[index] + "/";
                pf.mlibrary.selected = null;
              } else {
                pf.mlibrary.selected[index] = ! pf.mlibrary.selected[index];
              }
              pf.mlibrary.renderLinks();
            }
            div.appendChild(a);
          }
        });
      });
    }
  }
}

class AudioAgent {
  constructor() {
    this.audio = document.getElementById("audio");
    this.audio.onloadeddata = this.audio.play;
    this.audio.onended = _ => this.playNextSong();
  }
  playNextSong() {
    if ( queue.length <= 0 ) {
      this.audio.src = "about:blank";
    } else {
      this.audio.src = encodeURIComponent(`${DATA_FOLDER}/music/${queue[0]}`).split("%2F").join("/");
      queue = queue.slice(1);
    }
  }
}

function openPage(page) {
  document.getElementById(`page-${currentPage}`).style.display = "none";
  document.getElementById(`page-${page}`).style.display = "block";
  currentPage = page;
  pf[page].load();
}

window.onload = function() {
  aa = new AudioAgent();
  openPage("home");
}
