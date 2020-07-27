var btoa = require('btoa');
var path = require('path');
var https = require('https');
var jsonfile = require('jsonfile');
var bodyParser = require('body-parser');

var exports = module.exports = {}
var config = {};
var file = './config/data.json';
var sandbox = "";
var username = "";
var password = "";
var auth = "";
var responseHeaders = "";
var responseBody = "";

readConfig = function() {
  jsonfile.readFile(file, function(err, obj) {
    config = obj;
  });
};

writeConfig = function() {

  var obj = {
     sandbox: sandbox,
     username: username,
     password: password,
  };
  jsonfile.writeFile(file, obj, function(err) {
    console.error(err)
  })
};

exports.start = function () {
  var express = require('express');
  
  var app = express();
  app.use(bodyParser.urlencoded({
    extended: false
  }))
  app.use(bodyParser.json());

  app.get('/', function(req, res) {
    app.use(express.static('html'));
    res.sendFile(path.join(__dirname + '/html/index.html'));
  });

  app.post('/saveConfig', function(req, res) {
    sandbox = req.body.sandbox;
    username = req.body.username;
    password = req.body.password;
    writeConfig();
  });
  
  app.get('/readConfig', function(req, res) {
    readConfig();
    res.send(config);
  });
  
   app.post('/connect', function(req, res) {
     sandbox = req.body.sandbox;
     username = req.body.username;
     password = req.body.password;
     connect(res);
     
  });
  
  app.get('/getBreakPoints', function(req, res) {
     sandbox = req.body.sandbox;
     username = req.body.username;
     password = req.body.password;
     getBreakPoints(res);
  });
  
  app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
  });
};

connect = function(nodeRes) {

  var options = {
    host: sandbox,
    port: '443',
    path: '/s/-/dw/debugger/v1_0/client',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': make_base_auth(username, password),
      'x-dw-client-id': 'debugger'
    }
  };

  var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);
    responseHeaders = res.headers;
    auth = res.req._headers.authorization;
   
    res.on('data', function(d) {
      process.stdout.write(d);
      nodeRes.send(d);    
    });

  });
  
  req.end();
};

getBreakPoints = function(nodeRes) {
    var options = {
    host: config.sandbox,
    port: '443',
    path: '/s/-/dw/debugger/v1_0/breakpoints',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      'x-dw-client-id': 'debugger'
    }
  };
  
    var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);

    res.on('data', function(d) {
      process.stdout.write(d);
      responseBody = d;
      nodeRes.send(d);
      
       req.end();
    });
  });
  
};



exports.init = function() {

};

make_base_auth = function(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return 'Basic ' + hash;
}