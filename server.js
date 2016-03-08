var express = require('express');
var app = express();
var multer  = require('multer');
var serverPort = 8080;

//Storage definition for incoming file
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname+'/repo')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
  }
});

//Single file api call to multer as only one file gets associated with an incoming request
var upload = multer({ storage : storage }).single('file');

//Handling POST requests - File uploads
app.post('/upload', function (req, res, next) {
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error occurred while uploading file");
            console.log("Error occured while uploading file - " + req.file.filename);
        }
        res.end("File is uploaded");
    });
});

//Handling GET requests
app.get('/', function(req, res) {
    app.use("/", express.static(__dirname));
    res.sendFile(__dirname + '/index.html');
});

//Listen on specified port
app.listen(serverPort,function(){
    console.log("Server listening on " + serverPort);
});