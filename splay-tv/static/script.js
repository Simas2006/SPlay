var fs = require("fs");
var DATA_FOLDER = __dirname + "/../data";

var currentPage = "home";
var queue = [];
var aa; // Audio Agent
var pf = { // Page Functions
  "home": {
    "load": Function.prototype,
    "renderQueue": function() {
      var nowPlayingDiv = document.getElementById("home-nowPlaying");
      while ( nowPlayingDiv.firstChild ) {
        nowPlayingDiv.removeChild(nowPlayingDiv.firstChild);
      }
      var arr = pf.home.convertData(aa.currentSong,"Nothing Playing");
      nowPlayingDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],arr[3],false));
      var queueDiv = document.getElementById("home-queue");
      while ( queueDiv.firstChild ) {
        queueDiv.removeChild(queueDiv.firstChild);
      }
      for ( var i = 0; i < queue.length; i++ ) {
        var arr = pf.home.convertData(queue[i],null);
        queueDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],arr[3],true,i));
      }
      if ( queue.length <= 0 ) {
        var arr = pf.home.convertData(null,"No Songs in Queue");
        queueDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],arr[3],false));
      }
    },
    "generateQueueElement": function(type,title,subtitle,playlist,showButtons,queueID) {
      var table = document.createElement("table");
      table.className = "queueElement";
      var row = document.createElement("tr");
      var col1 = document.createElement("td");
      col1.className = "typeData";
      var icon = document.createElement("p");
      icon.innerText = ["♫","▶"," "][["library","youtube","nothing"].indexOf(type)];
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
      if ( showButtons ) {
        button1.id = "bU:" + queueID;
        button1.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          queue.splice(0,0,queue.splice(index,1)[0]);
          pf.home.renderQueue();
        }
      }
      col3.appendChild(button1);
      var button2 = document.createElement("button");
      button2.innerText = "X";
      if ( showButtons ) {
        button2.id = "bD:" + queueID;
        button2.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          queue.splice(index,1);
          pf.home.renderQueue();
        }
      }
      col3.appendChild(button2);
      row.appendChild(col3);
      var col4 = document.createElement("td");
      var button3 = document.createElement("button");
      button3.innerText = "↑";
      if ( showButtons ) {
        button3.id = "bu:" + queueID;
        button3.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          if ( index <= 0 ) return;
          queue.splice(index - 1,0,queue.splice(index,1)[0]);
          pf.home.renderQueue();
        }
      }
      col4.appendChild(button3);
      var button4 = document.createElement("button");
      button4.innerText = "↓";
      if ( showButtons ) {
        button4.id = "bd:" + queueID;
        button4.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          if ( index + 1 >= queue.length ) return;
          queue.splice(index + 1,0,queue.splice(index,1)[0]);
          pf.home.renderQueue();
        }
      }
      col4.appendChild(button4);
      row.appendChild(col4);
      table.appendChild(row);
      if ( ! showButtons ) {
        var arr = [button1,button2,button3,button4];
        for ( var i = 0; i < arr.length; i++ ) {
          arr[i].className = "hidden";
          arr[i].disabled = "disabled";
        }
      }
      return table;
    },
    "convertData": function(obj,nothingText) {
      if ( ! obj ) {
        return [
          "nothing",
          nothingText,
          "",
          ""
        ];
      } else if ( obj.type == "library" ) {
        var path = obj.path.split("/");
        var songName = path[path.length - 1];
        for ( var i = 0; i < songName.length; i++ ) {
          if ( "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(songName.charAt(i)) > -1 ) break;
        }
        songName = songName.slice(i).split(".").slice(0,-1).join(".");
        var subtitle;
        if ( path.length == 3 ) subtitle = path[1];
        else subtitle = `${path[path.length - 2]} (${path[path.length - 3]})`;
        return [
          "library",
          songName,
          subtitle,
          obj.playlist || ""
        ];
      } else if ( obj.type == "youtube" ) {
        return [
          "youtube",
          obj.ytMetadata.title,
          obj.ytMetadata.author,
          obj.playlist || ""
        ];
      }
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
        else pf.home.renderQueue();
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
      pf.ytselect.webObj.preload = "../yt-select-injection.js";
      pf.ytselect.webObj.src = "https://www.youtube.com";
      pf.ytselect.webObj.className = "ytselect";
      document.getElementById("page-ytselect").appendChild(pf.ytselect.webObj);
      var currentState = false;
      document.getElementById("ytselect-queueButton").disabled = "disabled";
      document.getElementById("ytselect-queueButton").style.color = "gray";
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
      pf.ytselect.webObj.addEventListener("ipc-message",event => {
        if ( event.channel == "video-data" ) {
          var data = event.args[0];
          queue.push({
            "type": "youtube",
            "path": string,
            "ytMetadata": data
          });
          clearInterval(pf.ytselect.interval);
          document.getElementById("page-ytselect").removeChild(pf.ytselect.webObj);
          openPage("home");
          if ( ! aa.currentSong ) aa.playNextSong();
          else pf.home.renderQueue();
        }
      });
      pf.ytselect.webObj.send("video-data-req");
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
        ytPlayer.preload = "../yt-watch-injection.js";
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
    pf.home.renderQueue();
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
    pf.home.renderQueue();
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
  pf.home.renderQueue();
}
