var fileio = {
  "readdir": Function.prototype,
  "stat": Function.prototype,
  "readFile": Function.prototype,
  "writeFile": Function.prototype,
  "sendMessage": function(type,param,callback) {
    var req = new XMLHttpRequest();
    req.onload = function() {
      callback(JSON.parse(this.responseText));
    }
    req.open("GET",`/data_request?type=${type}&param=${encodeURIComponent(param)}`);
    req.send();
  }
}
var DATA_FOLDER = "";
