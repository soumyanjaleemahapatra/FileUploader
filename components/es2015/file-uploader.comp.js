!(function(){
    "use strict";
    let template = `
<style>
@import url(stylesheets/componentDesign.css);
 </style>

    <form id="fileUpload" action="upload" method="post" enctype="multipart/form-data">
            <div class="componentContainer">
                <section class="messageHolder" id="msgHolder"></section>
                <div class="dropfileshere" id="filedrop">
                    <p id="dropText"> Drop files here  or click on "Choose files" button </p>
                </div>
                <input type="file" id="fileSelector" class="fileSelector" multiple="multiple" is=”ebfileupload” accepted-file-extensions=”jpg,png” max-file-size=”200000”>

            </div>
    </form>
    `;

    class FileUpload extends HTMLElement
    {
        /**
         * Fires when callback for the component is created
         *
         */
        createdCallback(){

            //Variable declarations
            let errMsg="";

            //Defining constants for Component attributes
            this.$MAXFILESIZEUNIT="max-file-size-unit";
            this.$MAXFILESIZE="max-file-size";
            this.$ACCEPTEDFILEEXTENSIONS="accepted-file-extensions";
            this.$ALLOWEDFILESIZEUNITS=["bytes", "KB", "MB", "GB"];

            //Create shadowroot
            this.createShadowRoot().innerHTML=template;

            //Grab the elements from the shadow root
            this.$container = this.shadowRoot.querySelector('.container');
            this.$fileSelector = this.shadowRoot.querySelector('.fileSelector');
            this.$componentContainer = this.shadowRoot.querySelector('.componentContainer');
            this.$fileUpload = this.shadowRoot.querySelector('#fileUpload');
            this.$dropfileshere = this.shadowRoot.querySelector('.dropfileshere');
            this.$droptext = this.shadowRoot.querySelector('#dropText');
            this.$messageHolder = this.shadowRoot.querySelector('.messageHolder');

            //Event handlers
            //Event handler - File selection
            this.$fileSelector.addEventListener('change', this.filesSelected.bind(this) );

            //File drag n drop
            this.$componentContainer.addEventListener("dragover", this.fileDragHover.bind(this));
            this.$componentContainer.addEventListener("dragleave", this.fileDragHover.bind(this));
            this.$componentContainer.addEventListener("drop", this.filesSelected.bind(this));
            //TODO: this.$componentContainer.style.display = "block";

            //Global file validation requirements
            //Check for supplied valid file size unit
            if(this.getAttribute(this.$MAXFILESIZEUNIT) && this.$ALLOWEDFILESIZEUNITS.indexOf(this.getAttribute(this.$MAXFILESIZEUNIT))>0)
            {

                this.$fileSizeUnit=this.getAttribute(this.$MAXFILESIZEUNIT);
            }
            else
            {

                errMsg+= "<b>Warning:</b> Supplied file size unit is incorrect or not specified. Allowed file size units are - "
                    + this.$ALLOWEDFILESIZEUNITS
                    + ". Defaulting to bytes. </br>"
                this.$fileSizeUnit="bytes";
                this.$messageHolder.innerHTML+=errMsg;
                this.$messageHolder.className="messageHolderVisible";
            }

            //Validate maximum file size allowed
            this.$maxFileSize=this.getAttribute(this.$MAXFILESIZE)
            &&
            (!(this.getAttribute(this.$MAXFILESIZE)===""))
            &&
            (!(isNaN(this.getAttribute(this.$MAXFILESIZE))))
                ?
                this.getAttribute(this.$MAXFILESIZE)
                :
                -1;
            //Validate allowed extensions
            this.$allowedFileExtensions=this.getAttribute(this.$ACCEPTEDFILEEXTENSIONS)
            &&
            (!(this.getAttribute(this.$ACCEPTEDFILEEXTENSIONS)===""))
                ?
                this.getAttribute(this.$ACCEPTEDFILEEXTENSIONS)
                :
                -1;
        }

        /**
         * Fires when a file is selected through the choose button
         * or
         * Dragged and dropped over the component
         */
        filesSelected(e)
        {
            //Variable declaration
            let validFilesList=[];
            let invalidFilesList=[];
            let errMsg="";
            //Clear the error messages
            this.$messageHolder.innerHTML="";
            this.$messageHolder.className="messageHolder";

            //Grab files based on drag n drop event or File choose event
            if (e.type=="drop")
            {
                e.stopPropagation();
                e.preventDefault();
            }
            //List of all files selected
            let f = e.type=='change' ? this.$fileSelector.files : e.dataTransfer.files;

            // process all File objects
            for (var i=0; i<f.length;i++)
            {
                //Checking for valid files based on file type
                let isValidFileSize = this.checkFileSize(f[i].size);
                let suppFileSizeInUnits=this.calculateFileSizeInAllowedUnits(f[i].size);

                //Checking file type
                let fileSplits= f[i].name.split('.');
                let fileType =fileSplits[fileSplits.length-1];
                let isValidFileType = this.checkFileType(fileType);

                //Differentiate between valid and invalid files
                if (isValidFileSize && isValidFileType){
                    validFilesList.push(f[i]);
                }
                else
                {
                    invalidFilesList.push(f[i]);
                    if (!(isValidFileSize))
                    {
                        if (!(isValidFileType))
                        {
                            errMsg+= "<b>Error:</b>"
                                + f[i].name + "</br>"
                                + suppFileSizeInUnits + " " + this.$fileSizeUnit
                                + "</br>Invalid file type and file size exceeded maximum allowed value.</br>";
                        }
                        else
                        {
                            errMsg+= "<b>Error:</b>"
                                + f[i].name+ "</br>"
                                + suppFileSizeInUnits + " " + this.$fileSizeUnit
                                + "</br>File size exceeded maximum allowed value.</br>";
                        }
                    }
                    else
                    {
                        errMsg+= "<b>Error:</b>"
                            + f[i].name+ "</br>"
                            + suppFileSizeInUnits + " " + this.$fileSizeUnit
                            + "</br>Invalid file type.</br>";
                    }
                }
            }

            if (errMsg)
            {
                //Final note about requirements in error messages
                errMsg += "</br> <i>N.B: Allowed file types - " + this.$allowedFileExtensions
                    + ". Maximum allowed file size - " + this.$maxFileSize + " " + this.$fileSizeUnit + "<i>";
                //Display error messages
                this.$messageHolder.className="messageHolderVisible";
                this.$messageHolder.innerHTML=errMsg;
            }

            //Preview and upload
            this.previewFiles(validFilesList);
            this.upload(validFilesList);

        }

        /**
         * Generates preview for the files and
         * sets the file information besides the preview
         * based on the passed in array of valid files
         *
         * @param [File] validFilesList
         */
        previewFiles(validFilesList)
        {
            //Error message holder
            let errMsg="";
            //Inner HTML or preview container
            var filePreviewHTML = "";

            //Loop through all valid files for previewing
            for (var i=0; i<validFilesList.length;i++)
            {
                //Error message if an already selected file is selected again
                if (this.shadowRoot.getElementById(validFilesList[i].name+"_preview"))
                {
                    errMsg +="<b>" + validFilesList[i].name + " -</b> File already selected for preview.";

                }else
                {
                    var fileSize= (validFilesList[i].size/(1024*1024)).toFixed(2);

                    //Only preview image files
                    if(validFilesList[i].type.toLowerCase().indexOf('image')>-1)
                    {
                        //Reader to get Image source
                        var reader = new FileReader();
                        reader.addEventListener("load", this.getImgThumbNail.bind(this, validFilesList[i]));

                        // Read the image file as a data URL.
                        reader.readAsDataURL(validFilesList[i]);

                        //Build the containers for preview
                        filePreviewHTML +=
                            "<div class = 'filePreviewAndProgress' id='" + validFilesList[i].name + "_div'>"
                            +   "<figure class='previewImageContainer'> "
                            +       "<img id='" + validFilesList[i].name + "_preview' class='previewImage' src=''/>"
                            +       "<progress id='" + validFilesList[i].name + "_progressBar' class='progressBar' value='0' max='100'></progress>"
                            +       "<p id='" + validFilesList[i].name + "_progressText' class='progressVal'></p>"
                            +   "</figure>"
                            +   "<section id='" + validFilesList[i].name +"_section'>"
                            +     "<p id='" + validFilesList[i].name  + "_fileName'>"+ validFilesList[i].name + "</p>"
                            +      "<p id='" + validFilesList[i].name  + "_dim'> </p>"
                            +      "<p id='" + validFilesList[i].name  + "_size'>" + fileSize + " MB </p>"
                            +      "<p id='" + validFilesList[i].name  + "_status'> </p>"
                            +   "</section>"
                            + "</div>";
                    }
                    //Set no preview for any file other than Image files
                    else
                    {
                        filePreviewHTML +=
                            "<div class = 'filePreviewAndProgress' id='" + validFilesList[i].name + "_div'>"

                            +   "<div class='previewImageContainer'>"
                            +       "<div id='" + validFilesList[i].name + "_preview' class='previewImage'>No preview</div>"
                            +       "<progress id='" + validFilesList[i].name + "_progressBar' class='progressBar' value='0' max='100'></progress>"
                            +       "<p id='" + validFilesList[i].name + "_progressText' class='progressVal'></p>"
                            +   "</div>"

                            +   "<section id='" + validFilesList[i].name +"_section'>"
                            +     "<p id='" + validFilesList[i].name  + "_fileName'>"+ validFilesList[i].name + "</p>"
                            +     "<p id='" + validFilesList[i].name  + "_dim'> </p>"
                            +     "<p id='" + validFilesList[i].name  + "_size'>" + fileSize + " MB </p>"
                            +      "<p id='" + validFilesList[i].name  + "_status'> </p>"
                            +   "</section>"

                            + "</div>";
                    }
                }
            }
            //Display error messages
            if (errMsg)
            {
                //Display error messages
                this.$messageHolder.className="messageHolderVisible";
                this.$messageHolder.innerHTML=errMsg;
            }
            //Add the Preview HTML containers
            if (filePreviewHTML)
            {
                //Hide the drag n drop box before previewing selected files
                this.$droptext.className="elementHide";
                this.$dropfileshere.className = "dropfileshereNoColor";
                this.shadowRoot.getElementById("filedrop").innerHTML +=  filePreviewHTML;
            }
        }

        /**
         * Extracts and sets image thumbnails and
         * dimension for the preview in case of image files
         *
         */
        getImgThumbNail(e)
        {
            //Get src for the image thumbnail
            var imageFIle = Array.prototype.slice.call(arguments)[0];

            //Set image thumbnail
            this.shadowRoot.getElementById(imageFIle.name+"_preview").setAttribute("src" , Array.prototype.slice.call(arguments)[1].target.result);

            //Get dimensions of the image
            let dimensions= this.shadowRoot.getElementById(imageFIle.name+"_preview").naturalWidth
                + " x "
                + this.shadowRoot.getElementById(imageFIle.name+"_preview").naturalHeight
                +" Pixels";

            //Set dimensions for the image thumbnail
            this.shadowRoot.getElementById(imageFIle.name+"_dim").innerHTML=dimensions;
        }

        /**
         * Builds XHR for each selected file and adds them to a queue
         * Also dispatches files from the queue
         * Also dispatches events for document - 'upload-start' and 'upload-done'
         * with appropriate payload
         *
         *
         * @param [File] validFilesList
         */
        upload(validFilesList){

            //Queue to hold all XHRs
            var xhrQ = (function(){
                function xhrQ() {};
                xhrQ.prototype.running = false;
                xhrQ.prototype.queue = [];

                //Build the platform to add XHR send methods
                xhrQ.prototype.queueFunc = function(cb) {
                    let _this = this;

                    //Add the callback to the queue
                    this.queue.push(function(){
                        var finished = cb();
                        if(typeof finished === "undefined" || finished) {
                            _this.deQueue();
                        }
                    });

                    //Start if nothing is running at this point
                    if(!this.running) {
                        this.deQueue();
                    }
                }

                xhrQ.prototype.deQueue = function(){
                    this.running = false;
                    //Get the first element off the queue
                    var xhrSend = this.queue.shift();
                    if(xhrSend) {
                        this.running = true;
                        xhrSend();
                    }
                }
                return xhrQ;})();

            //Instantiate the queue to hold the XHRs
            var xhrQueue = new xhrQ;

            //Custom event to be fired after completion of all XHRs in queue
            var uploadDoneEvent = new CustomEvent(
                "upload-done",
                {
                    detail: {
                        error:false
                        , success:false
                        , files:[]
                    },
                    bubbles: true,
                    cancelable: true
                });

            for (var i=0; i<validFilesList.length;i++)
            {
                //File name
                let file = validFilesList[i];

                //Section element
                let section = this.shadowRoot.getElementById(file.name+"_section");

                //Progress bar element
                let progressBar=this.shadowRoot.getElementById(file.name+"_progressBar");

                //Progress value element
                let progressText = this.shadowRoot.getElementById(file.name+"_progressText");

                //status message element
                let statusMsg = this.shadowRoot.getElementById(validFilesList[i].name+"_status");

                //Message holder
                let msgHolder = this.shadowRoot.querySelector('.messageHolder');

                //Current file count required for custom event
                let curFileCount=i;

                //Form data object to store the file
                let formData  = new FormData();

                formData.append("file" , validFilesList[i]);

                //XHR to upload the file
                let httpReq=new XMLHttpRequest();

                //XHR event listener for progress event
                httpReq.upload.addEventListener("progress", this.progressHandler.bind(this, validFilesList[i]));

                //On load complete event
                httpReq.onreadystatechange = function (e)
                {
                    if (httpReq.readyState===4)
                    {
                        //Hide the Progress bar
                        progressBar.className="elementHide";
                        progressText.className="elementHide";
                        let fileData;
                        if (httpReq.status===200)
                        {
                            //Update the status message for the preview
                            statusMsg.className ="successStatusMsg";
                            statusMsg.innerHTML ="Upload success";

                            /*Add payload to upload-done custom event*/
                            fileData={
                                name:file.name
                                , status:"success"
                                , fileSize:file.size};
                        }else
                        {
                            //Update the status message for the preview
                            statusMsg.className ="errorStatusMsg";
                            statusMsg.innerHTML =" Upload failed";

                            /*Add payload to upload-done custom event*/
                            fileData={
                                name:file.name
                                , status:"error"
                                , errorHttpCode: httpReq.status
                                , fileSize:file.size};

                            //Display error message in Message holder
                            msgHolder.innerHTML += "Upload failed: " + file.name + "</br>";
                            msgHolder.className="messageHolderVisible";
                        }

                        //Add the file info of the payload to the custom event
                        uploadDoneEvent.detail.files.push(fileData);

                        //Determine and update payload about the success and error criteria for entire payload
                        if (!(uploadDoneEvent.detail.error))
                        {
                            uploadDoneEvent.detail.error= httpReq.status===200?false:true;
                        }

                        if (!(uploadDoneEvent.detail.success))
                        {
                            uploadDoneEvent.detail.success= httpReq.status===200?true:false;
                        }

                        //Fire the upload-done event when the upload process for all the files is complete
                        if (curFileCount===validFilesList.length-1)
                        {
                            document.dispatchEvent(uploadDoneEvent);
                        }
                    }

                }

                //Build and send the request
                httpReq.open("POST",this.$fileUpload.action,true);
                httpReq.setRequestHeader("FILENAME",validFilesList[i].name);

                //Fire the upload-start event only for the uploading of the first file in the queue
                if (i===0)
                {
                    //Update the custom events with payload
                    var uploadStartEvent = new CustomEvent(
                        "upload-started",
                        {
                            detail: {
                                status:"File upload started"
                            },
                            bubbles: true,
                            cancelable: true
                        });

                    document.dispatchEvent(uploadStartEvent);
                }

                //Add the XHR Send method for each file into the queue
                xhrQueue.queueFunc(function(){
                    try {
                        httpReq.send(formData);
                    }
                    catch(err) {
                        document.getElementById("msgHolder").innerHTML = err.message;
                    }

                });

                /*My trial code to configure event listeners with Promises*/
                /*
                 //Onload event call back functions for the corresponding Promise
                 var xhrCB = {
                 success : function(xhr){
                 console.log(xhr instanceof XMLHttpRequest);
                 console.log(xhr instanceof XMLHttpRequestProgressEvent);
                 if (xhr instanceof XMLHttpRequest)
                 {
                 //Setup the status message for preview
                 console.log("Uploaded");
                 //console.log(xhr instanceof XMLHttpRequest);
                 section.innerHTML +="Upload success";
                 progressBar.className="elementHide";
                 progressText.className="elementHide";
                 }else if (xhr instanceof XMLHttpRequestProgressEvent)
                 {
                 //console.log("Progressing");
                 }

                 },
                 error : function(data){
                 console.error("Failed!", error);
                 }
                 };

                 this.filePost(validFilesList[i],this.$fileUpload.action).then(xhrCB.success , xhrCB.error) ;
                 this.ajaxPost(validFilesList[i],this.$fileUpload.action).then(
                 function(fileName) {
                 console.log("Success!--" + fileName);
                 //console.log(section);
                 section.innerHTML +="Upload success";
                 },
                 function(error) {
                 console.error("Failed!", error);
                 });*/
            }
        }

        constructor()
        {
            super();
            //Defining constants for Component attributes
            this.$MAXFILESIZEUNIT="max-file-size-unit";
            this.$MAXFILESIZE="max-file-size";
            this.$ACCEPTEDFILEEXTENSIONS="accepted-file-extensions";
            this.$ALLOWEDFILESIZEUNITS=["bytes", "KB", "MB", "GB"];
        }

        /**
         * XHR event handler for Progress event
         * Updates the HTML5 progress bar and the progress value
         *
         */
        progressHandler(e)
        {
            var file = Array.prototype.slice.call(arguments)[0];
            var event = Array.prototype.slice.call(arguments)[1];

            if (event.lengthComputable)
            {
                //Set the value of progress text
                this.shadowRoot.getElementById(file.name+"_progressText").innerHTML
                    =  "Upload ("+Math.round((event.loaded/event.total)*100) + "%)";

                //Set the max and loaded values of progress bar
                this.shadowRoot.getElementById(file.name+"_progressBar").setAttribute('value', event.loaded);
                this.shadowRoot.getElementById(file.name+"_progressBar").setAttribute('max', event.total);
            }
        }

        /**
         * Event handler for file drag over event
         *
         */
        fileDragHover(e)
        {
            e.stopPropagation();
            e.preventDefault();
        }

        /**
         * calculateFileSizeInAllowedUnits() Calculates supplied file size in allowed units
         * based on the supplied file size (in bytes)
         *
         * @param <integer> fileSize
         */
        calculateFileSizeInAllowedUnits(fileSize)
        {
            let val=0;
            switch(this.$fileSizeUnit) {
                case "KB":
                    val =fileSize/1024;
                    break;
                case "MB":
                    val =fileSize/(1024*1024);
                    break;
                case "GB":
                    val =fileSize/(1024*1024*1024);
                    break;
                default:
                    val =fileSize;
            }
            return val.toFixed(2);
        }

        /**
         * Validates if a given file size is within the max limit
         *
         * @param <integer> fileSize
         */
        checkFileSize(fileSize) {
            let isValid=true;

            //Allow all file sizes if max-file-size is not set
            if (this.$maxFileSize>-1)
            {
                switch(this.$fileSizeUnit) {
                    case "KB":
                        isValid=fileSize<=this.$maxFileSize*1024;
                        break;
                    case "MB":
                        isValid=fileSize<=this.$maxFileSize*1024*1024;
                        break;
                    case "GB":
                        isValid=fileSize<=this.$maxFileSize*1024*1024;
                        break;
                    default:
                        isValid=fileSize<=this.$maxFileSize;
                }
            }
            else
            {
                isValid= true;
            }
            return isValid;
        }

        //Validating file type
        /**
         * Validates if a selected file type is allowed
         * based on the supplied list of file types
         *
         * @param <String> fileType
         */
        checkFileType(fileType)
        {
            let isValid=true;
            let fileExtensions=[];

            //Allow all file types if accepted-file-extensions is not set
            if (this.$allowedFileExtensions == "-1")
            {
                isValid=true;
            }
            else
            {
                fileExtensions = this.$allowedFileExtensions.toLowerCase().split(",");
                isValid = fileExtensions.indexOf(fileType.toLowerCase()) > -1 ? true : false;
            }
            return isValid;
        }
    }

    //Register the web component
    document.registerElement('file-upload', FileUpload);
})();
