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
        list = list.filter((item,index) => pf.mlibrary.selected[index])
          .map(item => {return {
            "type": "library",
            "path": `${pf.mlibrary.path}${item}`
          }});
        queue = queue.concat(list);
        openPage("home");
        if ( ! aa.songActive ) aa.playNextSong();
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

var ytPlayer;
class AudioAgent {
  constructor() {
    this.audio = document.getElementById("audio");
    this.audio.onloadeddata = _ => {
      this.audio.play();
      this.togglePlay(true);
    }
    this.audio.onended = _ => this.playNextSong();
    this.playing = false;
    this.volume = 50;
    this.previousVolume = null;
    this.songActive = false;
    this.songType = null;
  }
  playNextSong() {
    if ( this.songType == "youtube" ) ytPlayer.parentElement.removeChild(ytPlayer);
    if ( queue.length <= 0 ) {
      this.audio.src = "about:blank";
      this.songType = null;
      this.songActive = false;
      this.playing = false;
      this.audio.pause();
      document.getElementById("home-pauseButton").innerText = "▶";
    } else {
      this.songType = queue[0].type;
      this.songActive = true;
      if ( queue[0].type == "library" ) {
        this.audio.src = encodeURIComponent(`${DATA_FOLDER}/music/${queue[0].path}`).split("%2F").join("/");
      } else if ( queue[0].type == "youtube" ) {
        ytPlayer = document.createElement("webview");
        ytPlayer.preload = "../yt-injection.js";
        ytPlayer.src = queue[0].path;
        ytPlayer.addEventListener("ipc-message",event => {
          if ( event.channel == "video-end" ) this.playNextSong();
        });
        document.getElementById("ytPlayer-box").appendChild(ytPlayer);
        this.togglePlay(true);
      }
      queue = queue.slice(1);
    }
  }
  togglePlay(setPlaying) {
    if ( ! this.songActive ) return;
    if ( setPlaying && this.playing ) return;
    this.playing = ! this.playing;
    if ( this.playing ) {
      if ( this.songType == "library" ) this.audio.play();
      else if ( this.songType == "youtube" ) ytPlayer.send("video-command","play");
      document.getElementById("home-pauseButton").innerText = "||";
    } else {
      if ( this.songType == "library" ) this.audio.pause();
      else if ( this.songType == "youtube" ) ytPlayer.send("video-command","pause");
      document.getElementById("home-pauseButton").innerText = "▶";
    }
  }
  rewindSong() {
    if ( this.songType == "library" ) this.audio.currentTime = 0;
    else if ( this.songType == "youtube" ) ytPlayer.send("video-command","rewind");
    this.togglePlay(true);
  }
  changeVolume(amount) {
    if ( this.volume + amount < 0 || this.volume + amount > 100 ) return;
    if ( amount != 0 ) {
      this.volume += amount;
      this.previousVolume = null;
    } else {
      if ( ! this.previousVolume ) {
        this.previousVolume = this.volume;
        this.volume = 0;
      } else {
        this.volume = this.previousVolume;
        this.previousVolume = null;
      }
    }
    if ( this.songType == "library" ) this.audio.volume = this.volume / 100;
    else if ( this.songType == "youtube" ) ytPlayer.send("video-command","setvol",this.volume);
    document.getElementById("home-volumeButton").innerText = `${this.volume}%`;
  }
  shuffleQueue() {
    for ( var i = queue.length - 1; i > 0; i-- ) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = queue[i];
      queue[i] = queue[j];
      queue[j] = temp;
    }
  }
  clearQueue() {
    queue = [];
    this.playNextSong();
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
