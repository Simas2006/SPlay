var currentPage = "home";
var queue = [];
var pf = { // Page Functions
  "home": {
    "load": Function.prototype,
    "renderQueue": function() {
      var nowPlayingDiv = document.getElementById("home-nowPlaying");
      while ( nowPlayingDiv.firstChild ) {
        nowPlayingDiv.removeChild(nowPlayingDiv.firstChild);
      }
      var arr = pf.home.convertData(aa.currentSong,"Nothing Playing");
      nowPlayingDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],false));
      var queueDiv = document.getElementById("home-queue");
      while ( queueDiv.firstChild ) {
        queueDiv.removeChild(queueDiv.firstChild);
      }
      for ( var i = 0; i < queue.length; i++ ) {
        var arr = pf.home.convertData(queue[i],null);
        queueDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],true,i));
      }
      if ( queue.length <= 0 ) {
        var arr = pf.home.convertData(null,"No Songs in Queue");
        queueDiv.appendChild(pf.home.generateQueueElement(arr[0],arr[1],arr[2],false));
      }
    },
    "generateQueueElement": function(type,title,subtitle,showButtons,queueID) {
      var table = document.createElement("table");
      table.className = "queueElement";
      var row = document.createElement("tr");
      var col1 = document.createElement("td");
      col1.className = "typeData";
      var icon = document.createElement("p");
      icon.innerText = ["♫","▶"," "][["library","youtube","nothing"].indexOf(type)];
      if ( type == "youtube" ) {
        col1.style.backgroundColor = "red";
        icon.style.color = "white";
      }
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
          subtitle
        ];
      } else if ( obj.type == "youtube" ) {
        return [
          "youtube",
          obj.ytMetadata.title,
          obj.ytMetadata.author
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
        if ( ! pf.mlibrary.playlistMode ) openPage("home");
        else pf.mlibrary.playlistReturn([]);
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
      fileio.sendMessage("list_music",pf.mlibrary.path,function(data) {
        var list = data.files.filter((item,index) => pf.mlibrary.selected[index])
          .map(item => {return {
            "type": "library",
            "path": `${pf.mlibrary.path}${item}`
          }});
        if ( pf.mlibrary.playlistMode ) {
          pf.mlibrary.playlistReturn(list);
          return;
        }
        queue = queue.concat(list);
        openPage("home");
        if ( ! aa.currentSong ) aa.playNextSong();
        else pf.home.renderQueue();
        window.scrollTo(0,0);
      });
    },
    "renderLinks": function() {
      function merge(list,isDir) {
        if ( ! isDir ) {
          if ( ! pf.mlibrary.selected ) pf.mlibrary.selected = list.map(item => false);
          document.getElementById("mlibrary-button1").style.display = "inline";
          document.getElementById("mlibrary-button2").style.display = "inline";
          if ( pf.mlibrary.selected.filter(item => ! item).length > 0 || list.length <= 0 ) document.getElementById("mlibrary-button1").innerText = "Select All";
          else document.getElementById("mlibrary-button1").innerText = "Deselect All";
          document.getElementById("mlibrary-button2").innerText = `Add to ${! pf.mlibrary.playlistMode ? "Queue" : "Playlist"}`;
        } else {
          document.getElementById("mlibrary-button1").style.display = "none";
          document.getElementById("mlibrary-button2").style.display = "none";
        }
        document.getElementById("mlibrary-path").innerText = `Album: ${pf.mlibrary.path}`;
        var div = document.getElementById("mlibrary-items");
        while ( div.firstChild ) {
          div.removeChild(div.firstChild);
        }
        for ( var i = 0; i < list.length; i++ ) {
          var a = document.createElement("a");
          if ( ! isDir ) {
            for ( var j = 0; j < list[i].length; j++ ) {
              if ( "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(list[i].charAt(j)) > -1 ) break;
            }
            list[i] = list[i].slice(j).split(".").slice(0,-1).join(".");
          }
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
        if ( list.length <= 0 ) {
          var p = document.createElement("p");
          p.innerText = "No songs in album!";
          div.appendChild(p);
          document.getElementById("mlibrary-button1").disabled = "disabled";
          document.getElementById("mlibrary-button2").disabled = "disabled";
        } else {
          document.getElementById("mlibrary-button1").disabled = "";
          document.getElementById("mlibrary-button2").disabled = "";
        }
      }
      fileio.sendMessage("list_music",pf.mlibrary.path,function(data) {
        merge(data.files,data.hasDirectories);
      });
    }
  },
  "ytselect": {
    "load": Function.prototype
  },
  "playlist-main": {
    "load": function() {
      fileio.readFile(`${DATA_FOLDER}/playlists.json`,function(err,data) {
        if ( err ) throw err;
        var data = JSON.parse(data.toString());
        data = data.map((item,index) => {
          return {
            data: item,
            index: index
          }
        }).sort(function(a,b) {
          var names = [a,b].map(item => item.data.name.toLowerCase());
          if ( names[0] < names[1] ) return -1;
          else if ( names[0] > names[1] ) return 1;
          else return 0;
        });
        var table = document.getElementById("playlist-main-table");
        while ( table.firstChild ) {
          table.removeChild(table.firstChild);
        }
        for ( var i = 0; i < data.length; i++ ) {
          var row = document.createElement("tr");
          var col1 = document.createElement("td");
          col1.className = "titleCol";
          col1.innerText = data[i].data.name;
          row.appendChild(col1);
          var col2 = document.createElement("td");
          var button1 = document.createElement("button");
          button1.innerText = "Add to Queue";
          button1.id = "bp:" + i;
          button1.onclick = function() {
            var index = parseInt(this.id.split(":")[1]);
            queue = queue.concat(data[index].data.songs);
            openPage("home");
            if ( ! aa.currentSong ) aa.playNextSong();
            else pf.home.renderQueue();
          }
          col2.appendChild(button1);
          row.appendChild(col2);
          var col3 = document.createElement("td");
          var button2 = document.createElement("button");
          button2.innerText = "Edit Playlist";
          button2.id = "be:" + i;
          button2.onclick = function() {
            var index = parseInt(this.id.split(":")[1]);
            pf["playlist-edit"].currentPlaylistIndex = data[index].index;
            pf["playlist-edit"].currentPlaylist = data[index].data;
            openPage("playlist-edit");
          }
          col3.appendChild(button2);
          row.appendChild(col3);
          table.appendChild(row);
        }
      });
    },
    "addNewPlaylist": function(useQueue) {
      fileio.readFile(`${DATA_FOLDER}/playlists.json`,function(err,data) {
        if ( err ) throw err;
        data = JSON.parse(data.toString());
        var songs = [];
        if ( useQueue ) {
          if ( aa.currentSong ) songs.push(aa.currentSong);
          songs = songs.concat(queue);
        }
        data.push({
          name: "New Playlist",
          songs: songs
        });
        fileio.writeFile(`${DATA_FOLDER}/playlists.json`,JSON.stringify(data),function(err) {
          if ( err ) throw err;
          pf["playlist-edit"].currentPlaylistIndex = data.length - 1;
          pf["playlist-edit"].currentPlaylist = data[data.length - 1];
          openPage("playlist-edit");
        });
      });
    }
  },
  "playlist-edit": {
    "currentPlaylistIndex": null,
    "currentPlaylist": null,
    "load": function() {
      pf["playlist-edit"].renderPlaylist();
    },
    "renderPlaylist": function() {
      var obj = pf["playlist-edit"].currentPlaylist;
      document.getElementById("playlist-edit-title").value = obj.name;
      document.getElementById("playlist-edit-title").onchange = function() {
        obj.name = this.value;
      }
      document.getElementById("playlist-edit-empty").style.display = obj.songs.length == 0 ? "block" : "none";
      var table = document.getElementById("playlist-edit-table");
      while ( table.firstChild ) {
        table.removeChild(table.firstChild);
      }
      for ( var i = 0; i < obj.songs.length; i++ ) {
        var row = document.createElement("tr");
        row.className = "playlistElement";
        var col1 = document.createElement("td");
        var button1 = document.createElement("button");
        button1.innerText = "⇡";
        button1.id = "bT:" + i;
        button1.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          obj.songs.splice(0,0,obj.songs.splice(index,1)[0]);
          pf["playlist-edit"].renderPlaylist();
        }
        col1.appendChild(button1);
        var button2 = document.createElement("button");
        button2.innerText = "X";
        button2.id = "br:" + i;
        button2.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          obj.songs.splice(index,1);
          pf["playlist-edit"].renderPlaylist();
        }
        col1.appendChild(button2);
        row.appendChild(col1);
        var col2 = document.createElement("td");
        var button3 = document.createElement("button");
        button3.innerText = "↑";
        button3.id = "bm:" + i;
        button3.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          if ( index <= 0 ) return;
          obj.songs.splice(index - 1,0,obj.songs.splice(index,1)[0]);
          pf["playlist-edit"].renderPlaylist();
        }
        col2.appendChild(button3);
        var button4 = document.createElement("button");
        button4.innerText = "↓";
        button4.id = "bM:" + i;
        button4.onclick = function() {
          var index = parseInt(this.id.split(":")[1]);
          if ( index + 1 >= obj.songs.length ) return;
          obj.songs.splice(index + 1,0,obj.songs.splice(index,1)[0]);
          pf["playlist-edit"].renderPlaylist();
        }
        col2.appendChild(button4);
        row.appendChild(col2);
        var col3 = document.createElement("td");
        col3.className = "typeData";
        var icon = document.createElement("p");
        icon.innerText = ["♫","▶"][["library","youtube"].indexOf(obj.songs[i].type)];
        if ( obj.songs[i].type == "youtube" ) {
          col3.style.backgroundColor = "red";
          icon.style.color = "white";
        }
        col3.appendChild(icon);
        row.appendChild(col3);
        var col4 = document.createElement("td");
        col4.className = "songData";
        var title,subtitle;
        if ( obj.songs[i].type == "library" ) {
          var path = obj.songs[i].path.split("/");
          var title = path[path.length - 1];
          for ( var j = 0; j < title.length; j++ ) {
            if ( "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(title.charAt(j)) > -1 ) break;
          }
          title = title.slice(j).split(".").slice(0,-1).join(".");
          if ( path.length == 3 ) subtitle = path[1];
          else subtitle = `${path[path.length - 2]} (${path[path.length - 3]})`;
        } else if ( obj.songs[i].type == "youtube" ) {
          title = obj.songs[i].ytMetadata.title;
          subtitle = obj.songs[i].ytMetadata.author;
        }
        var titleObj = document.createElement("p");
        titleObj.innerText = title;
        titleObj.className = "songTitleText";
        col4.appendChild(titleObj);
        var subtitleObj = document.createElement("p");
        subtitleObj.innerText = subtitle;
        col4.appendChild(subtitleObj);
        row.appendChild(col4);
        table.appendChild(row);
      }
    },
    "addNewSong": function(type) {
      if ( type == "library" ) {
        pf.mlibrary.playlistMode = true;
        pf.mlibrary.playlistReturn = function(songs) {
          pf.mlibrary.playlistMode = false;
          pf["playlist-edit"].currentPlaylist.songs = pf["playlist-edit"].currentPlaylist.songs.concat(songs);
          openPage("playlist-edit");
          window.scrollTo(0,0);
        }
        openPage("mlibrary");
      } else if ( type == "youtube" ) {
        pf.ytselect.playlistMode = true;
        pf.ytselect.playlistReturn = function(song) {
          pf.ytselect.playlistMode = false;
          if ( song ) pf["playlist-edit"].currentPlaylist.songs.push(song);
          openPage("playlist-edit");
          window.scrollTo(0,0);
        }
        openPage("ytselect");
      }
    },
    "savePlaylist": function() {
      fileio.readFile(`${DATA_FOLDER}/playlists.json`,function(err,data) {
        if ( err ) throw err;
        data = JSON.parse(data.toString());
        data[pf["playlist-edit"].currentPlaylistIndex] = pf["playlist-edit"].currentPlaylist;
        fileio.writeFile(`${DATA_FOLDER}/playlists.json`,JSON.stringify(data),function(err) {
          if ( err ) throw err;
          openPage("playlist-main");
        });
      });
    },
    "deletePlaylist": function() {
      if ( ! confirm("Are you sure you want to permanently delete this playlist?") ) return;
      fileio.readFile(`${DATA_FOLDER}/playlists.json`,function(err,data) {
        if ( err ) throw err;
        data = JSON.parse(data.toString());
        data.splice(pf["playlist-edit"].currentPlaylistIndex,1);
        fileio.writeFile(`${DATA_FOLDER}/playlists.json`,JSON.stringify(data),function(err) {
          if ( err ) throw err;
          openPage("playlist-main");
        });
      });
    }
  },
  "photos-main": {
    "path": "/",
    "load": function() {
      pf["photos-main"].path = "/";
      pf["photos-main"].renderLinks();
    },
    "back": function() {
      if ( pf["photos-main"].path == "/" ) openPage("home");
      pf["photos-main"].path = pf["photos-main"].path.split("/").slice(0,-2).concat([""]).join("/");
      pf["photos-main"].renderLinks();
    },
    "renderLinks": function() {
      fileio.sendMessage("list_photos",pf["photos-main"].path,function(data) {
        var list = data.files;
        document.getElementById("photos-main-path").innerText = `Album: ${pf["photos-main"].path}`;
        var div = document.getElementById("photos-main-items");
        while ( div.firstChild ) {
          div.removeChild(div.firstChild);
        }
        for ( var i = 0; i < list.length; i++ ) {
          var a = document.createElement("a");
          a.innerText = list[i];
          a["data-index"] = i;
          a.onclick = function() {
            var index = parseInt(this["data-index"]);
            fileio.sendMessage("list_photos",`${pf["photos-main"].path}/${list[index]}`,function(subdata) {
              if ( subdata.hasDirectories ) {
                pf["photos-main"].path += list[index] + "/";
                pf["photos-main"].renderLinks();
              } else {
                pf["photos-view"].path = `${pf["photos-main"].path}/${list[index]}`.split("//").join("/");
                openPage("photos-view");
              }
            });
          }
          div.appendChild(a);
        }
        if ( list.length <= 0 ) {
          var p = document.createElement("p");
          p.innerText = "No photos in album!";
          div.appendChild(p);
        }
      });
    }
  },
  "photos-view": {
    "path": null,
    "files": null,
    "index": 0,
    "load": function() {
      fileio.sendMessage("list_photos",pf["photos-view"].path,function(data) {
        pf["photos-view"].index = 0;
        document.getElementById("photos-view-backward").disabled = "disabled";
        document.getElementById("photos-view-forward").disabled = "";
        pf["photos-view"].files = data.files.filter(item => ["jpg","png","tiff","gif"].indexOf(item.split(".").slice(-1)[0].toLowerCase()) > -1);
        document.getElementById("photos-view-path").innerText = `Album: ${pf["photos-view"].path}`;
        pf["photos-view"].path = encodeURIComponent(pf["photos-view"].path).split("%2F").join("/");
        document.body.style.margin = 0;
        document.getElementsByTagName("hr")[0].style.margin = 0;
        pf["photos-view"].showImage();
      });
    },
    "showImage": function() {
      fileio.sendMessage("get_photo_file",`${pf["photos-view"].path}/${pf["photos-view"].files[pf["photos-view"].index]}`,function(id) {
        document.getElementById("photos-view-name").innerText = pf["photos-view"].files[pf["photos-view"].index];
        var path = `/large_data_request?id=${id}`;
        var img = new Image();
        img.src = path;
        console.log(img);
        img.onload = function() {
          EXIF.getData(img,function() {
            var orientation = EXIF.getTag(this,"Orientation") || 1;
            var container = document.getElementById("photos-view-img-container");
            var fullHeight = window.innerHeight - (document.body.clientHeight - container.clientHeight);
            container.style.height = fullHeight + "px";
            var r,width,height;
            if ( [6,8].indexOf(orientation) <= -1 ) [width,height] = [img.width,img.height];
            else [width,height] = [img.height,img.width];
            if ( width > window.innerWidth || height > fullHeight ) {
              for ( r = 1; r > 0; r -= 0.001 ) {
                if ( r * width < window.innerWidth && r * height < fullHeight ) break;
              }
            } else {
              for ( r = 1; ; r += 0.001 ) {
                if ( r * width > window.innerWidth || r * height > fullHeight ) {
                  r -= 0.001;
                  break;
                }
              }
            }
            var styleEntries = [
              ["","center","center"],
              ["","center","center"],
              ["rotate(180deg)","center","center"],
              ["","center","center"],
              ["","center","center"],
              ["translateY(-100%) translateX(12.5%) rotate(90deg)","bottom left",""],
              ["","center","center"],
              ["translateX(-87.5%) rotate(270deg)","top right",""]
            ];
            var oldImgElement = document.getElementById("photos-view-img");
            container.removeChild(oldImgElement);
            img.id = "photos-view-img";
            img.style.width = (r * img.width) + "px";
            img.style.height = (r * img.height) + "px";
            img.style.transform = styleEntries[orientation - 1][0];
            img.style.transformOrigin = styleEntries[orientation - 1][1];
            container.style.alignItems = styleEntries[orientation - 1][2];
            img.style.display = "block";
            container.appendChild(img);
            document.getElementById("photos-view-backward").disabled = pf["photos-view"].index <= 0 ? "disabled" : "";
            document.getElementById("photos-view-forward").disabled = (pf["photos-view"].index + 1 >= pf["photos-view"].files.length) ? "disabled" : "";
          });
        }
      });
    },
    "movePicture": function(add) {
      if ( pf["photos-view"].index + add < 0 || pf["photos-view"].index + add >= pf["photos-view"].files.length ) return;
      pf["photos-view"].index += add;
      pf["photos-view"].showImage();
    },
    "exitPage": function() {
      document.getElementById("photos-view-img").style.display = "none";
      document.body.style.margin = "";
      document.getElementsByTagName("hr")[0].style.margin = "";
      openPage("home");
    }
  },
  "web": {
    "load": Function.prototype
  },
  "settings": {
    "load": Function.prototype
  }
}

var aa,ytPlayer;
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
    this.audio.pause();
    if ( queue.length <= 0 ) {
      this.audio.src = "";
      this.songType = null;
      this.currentSong = null;
      this.playing = false;
      this.audio.pause();
      document.getElementById("home-pauseButton").innerText = "▶";
    } else {
      this.songType = queue[0].type;
      this.currentSong = queue[0];
      fileio.sendMessage("get_music_file",queue[0].path,id => {
        this.audio.src = `/large_data_request?id=${id}`;
        this.audio.volume = this.volume / 100;
      });
      queue = queue.slice(1);
    }
    pf.home.renderQueue();
  }
  togglePlay(setPlaying) {
    if ( ! this.currentSong ) return;
    if ( setPlaying && this.playing ) return;
    this.playing = ! this.playing;
    if ( this.playing ) {
      this.audio.play();
      document.getElementById("home-pauseButton").innerText = "||";
    } else {
      this.audio.pause();
      document.getElementById("home-pauseButton").innerText = "▶";
    }
  }
  rewindSong() {
    this.audio.currentTime = 0;
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
    this.audio.volume = this.volume / 100;
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
  document.getElementById(`page-${page}`).style.display = "block";
  currentPage = page;
  pf[page].load();
}

window.onload = function() {
  aa = new AudioAgent();
  openPage("home");
  pf.home.renderQueue();
}
