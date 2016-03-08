"# fileUploader"
"# fileUploader"

This is a web component for uploading files into the server. The files can be either chosen using a button or can be dragged and dropped for being uploaded.
The upload progress for each file can also be monitored. If required, the files can also be deleted from the server.

Installation:
--------------

1. Install dependencies:
npm install

2. Start NodeJS server:
node server

Events:
--------
upload-start
        Fires when the upload process begins.

upload-done:
        Fires once the process of uploading all selected files is complete. Payload is as follows:
           {
               error: true
               , success: true
               , files: [ {
                name: ‚bad-file.jpg‘
                , status: ‚error‘
                , errorHttpCode: 404
                , fileSize: 8000 // in bytes
                }, {
                name: ‚good-file.jpg‘
                , status: ‚success‘
                , fileSize: 9000
                } ]
            }





