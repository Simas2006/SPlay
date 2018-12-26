var fs = require("fs");
var DATA_FOLDER = __dirname + "/../data";

var currentPage = "home";
var queue = [];
var aa; // Audio Agent
var pf = { // Page Functions
  "home": {
    "load": _ => pf.home.renderQueue(),
    "renderQueue": function() {
      var nowPlayingBox = document.getElementById("home-nowPlaying");
    },
    "generateQueueElement": function(type,title,subtitle,playlist) {
      var table = document.createElement("table");
      table.className = "queueElement";
      var row = document.createElement("tr");
      var col1 = document.createElement("td");
      col1.className = "typeData";
      var icon = document.createElement("p");
      icon.innerText = "♫";
      col1.appendChild(icon);
      row.appendChild(col1);
      var col2 = document.createElement("td");
      col2.className = "songData";
      var titleObj = document.createElement("p");
      titleObj.innerText = title;
      titleObj.className = "songTitleText";
      col2.appendChild(titleObj);
      var subtitleObj = document.createElement("p");
      subtitleObj.innerText = subtitle;
      col2.appendChild(subtitleObj);
      var playlistObj = document.createElement("p");
      playlistObj.innerText = playlist;
      col2.appendChild(playlistObj);
      row.appendChild(col2);
      var col3 = document.createElement("td");
      var button1 = document.createElement("button");
      button1.innerText = "⇡";
      col3.appendChild(button1);
      var button2 = document.createElement("button");
      button2.innerText = "↑";
      col3.appendChild(button2);
      row.appendChild(col3);
      var col4 = document.createElement("td");
      var button3 = document.createElement("button");
      button3.innerText = "X";
      col4.appendChild(button3);
      var button4 = document.createElement("button");
      button4.innerText = "↓";
      col4.appendChild(button4);
      row.appendChild(col4);
      table.appendChild(row);
      return table;
    }
  },
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
        if ( ! aa.currentSong ) aa.playNextSong();
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
  },
  "ytselect": {
    "webObj": null,
    "interval": null,
    "load": function() {
      pf.ytselect.webObj = document.createElement("webview");
      pf.ytselect.webObj.src = "https://www.youtube.com";
      pf.ytselect.webObj.className = "ytselect";
      document.getElementById("page-ytselect").appendChild(pf.ytselect.webObj);
      var currentState = false;
      pf.ytselect.interval = setInterval(function() {
        if ( pf.ytselect.webObj.getURL().startsWith("https://www.youtube.com/watch?v=") ) {
          if ( ! currentState ) {
            document.getElementById("ytselect-queueButton").disabled = "";
            document.getElementById("ytselect-queueButton").style.color = "black";
            currentState = true;
          }
        } else {
          if ( currentState ) {
            document.getElementById("ytselect-queueButton").disabled = "disabled";
            document.getElementById("ytselect-queueButton").style.color = "gray";
            currentState = false;
          }
        }
      },250);
    },
    "addToQueue": function() {
      var string = pf.ytselect.webObj.getURL().split("https://www.youtube.com/watch?v=").join("");
      string = string.slice(0,11);
      queue.push({
        "type": "youtube",
        "path": string
      });
      clearInterval(pf.ytselect.interval);
      document.getElementById("page-ytselect").removeChild(pf.ytselect.webObj);
      openPage("home");
      if ( ! aa.currentSong ) aa.playNextSong();
    },
    "exitPage": function() {
      clearInterval(pf.ytselect.interval);
      document.getElementById("page-ytselect").removeChild(pf.ytselect.webObj);
      openPage("home");
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
    this.songType = null;
    this.currentSong = null;
  }
  playNextSong() {
    if ( this.songType == "library" ) this.audio.pause();
    else if ( this.songType == "youtube" ) ytPlayer.parentElement.removeChild(ytPlayer);
    if ( queue.length <= 0 ) {
      this.audio.src = "about:blank";
      this.songType = null;
      this.currentSong = null;
      this.playing = false;
      this.audio.pause();
      document.getElementById("home-pauseButton").innerText = "▶";
    } else {
      this.songType = queue[0].type;
      this.currentSong = queue[0];
      if ( queue[0].type == "library" ) {
        this.audio.src = encodeURIComponent(`${DATA_FOLDER}/music/${queue[0].path}`).split("%2F").join("/");
        this.audio.volume = this.volume / 100;
      } else if ( queue[0].type == "youtube" ) {
        ytPlayer = document.createElement("webview");
        ytPlayer.preload = "../yt-injection.js";
        ytPlayer.src = `https://www.youtube.com/watch?v=${queue[0].path}`;
        ytPlayer.className = "hidden";
        ytPlayer.addEventListener("ipc-message",event => {
          if ( event.channel == "video-ready" ) ytPlayer.send("video-command","setvol",this.volume);
          else if ( event.channel == "video-end" ) this.playNextSong();
        });
        document.getElementById("ytPlayer-box").appendChild(ytPlayer);
        this.togglePlay(true);
      }
      queue = queue.slice(1);
    }
  }
  togglePlay(setPlaying) {
    if ( ! this.currentSong ) return;
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
  document.getElementById(`page-${page}`).style.display = page != "ytselect" ? "block" : "flex";
  currentPage = page;
  pf[page].load();
}

window.onload = function() {
  aa = new AudioAgent();
  openPage("home");
}
