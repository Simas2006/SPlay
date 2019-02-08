var {ipcRenderer} = require("electron");

window.onload = function() {
  ipcRenderer.on("video-data-req",function(obj) {
    var player = document.getElementById("movie_player");
    ipcRenderer.sendToHost("video-data",{
      "title": player.getVideoData().title,
      "author": player.getVideoData().author
    });
  });
}
