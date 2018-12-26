var {ipcRenderer} = require("electron");

window.onload = function() {
  var player = document.getElementById("movie_player");
  var interval = setInterval(function() {
    if ( player.getCurrentTime() + 0.5 >= player.getDuration() ) {
      ipcRenderer.sendToHost("video-end");
      clearInterval(interval);
    }
  },1000);
  setTimeout(function() {
    ipcRenderer.sendToHost("video-ready");
  },250);
  ipcRenderer.on("video-command",function(obj,command,param) {
    if ( command == "play" ) player.playVideo();
    else if ( command == "pause" ) player.pauseVideo();
    else if ( command == "setvol" ) player.setVolume(param);
    else if ( command == "rewind" ) player.seekTo(0);
  });
}
