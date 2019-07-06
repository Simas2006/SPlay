var fs = require("fs");
var express = require("express");
var app = express();
var PORT = process.argv[2] || 8000;
var DATA_FOLDER = __dirname + "/../splay-tv/data";

app.use("/public",express.static(__dirname + "/public"));

app.get("/data_request",function(request,response) {
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
  }
});

app.listen(PORT,function() {
  console.log(`Listening on port ${PORT}`);
});
