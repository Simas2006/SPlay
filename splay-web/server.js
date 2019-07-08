var fs = require("fs");
var express = require("express");
var app = express();
var PORT = process.argv[2] || 8000;
var DATA_FOLDER = __dirname + "/../splay-tv/data";
var pendingRequests = {};

app.use("/public",express.static(__dirname + "/public"));

app.get("/data_request",function(request,response) {
  console.log(request.ip,request.query.type);
  if ( request.query.type == "list_music" ) {
    var path = request.query.param;
    fs.readdir(`${DATA_FOLDER}/music/${path}`,function(err,files) {
      if ( err ) throw err;
      files = files.filter(item => ! item.startsWith("."));
      fs.stat(`${DATA_FOLDER}/music/${path}/${files[0]}`,function(err,stats) {
        var hasDirectories = stats.isDirectory();
        response.send(JSON.stringify({
          "hasDirectories": hasDirectories,
          "files": files
        }));
      });
    });
  } else if ( request.query.type == "get_music_file" ) {
    var id = Math.floor(Math.random() * 1e16);
    while ( pendingRequests[id] ) {
      id = Math.floor(Math.random() * 1e16);
    }
    pendingRequests[id] = {
      "type": "music",
      "path": request.query.param,
      "ip": request.ip
    };
    response.send(id.toString());
  }
});

app.get("/large_data_request",function(request,response) {
  if ( pendingRequests[request.query.id] ) {
    var dataReq = pendingRequests[request.query.id];
    if ( request.ip != dataReq.ip ) {
      response.send("Error");
      return;
    }
    var stream = fs.createReadStream(`${DATA_FOLDER}/${dataReq.type}/${dataReq.path}`);
    response.set("Content-Type","audio/mp4");
    stream.pipe(response);
  }
});

app.listen(PORT,function() {
  console.log(`Listening on port ${PORT}`);
});
