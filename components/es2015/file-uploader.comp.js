/*import * as cssContent from 'stylesheets\main.css';*/
!(function(){

    "use strict";
    let template = `
<style>
@import url(stylesheets/componentDesign.css);
 </style>

    <form id="fileUpload" action="upload" method="post" enctype="multipart/form-data">
            <div class="componentContainer">
                <div class="dropfileshere" id="filedrop">
                    <p id="dropText"> Drop files here  or click on "Choose files" button </p>
                </div>
                <input type="file" id="fileSelector" class="fileSelector" multiple="multiple" is=”ebfileupload” accepted-file-extensions=”jpg,png” max-file-size=”200000”>
                <section class="messageHolder"></section>
            </div>
    </form>
    `;

    class FileUpload extends HTMLElement
    {
        constructor()
        {
           super();
            //Defining constants for Component attributes
           this.$MAXFILESIZEUNIT="max-file-size-unit";
           this.$MAXFILESIZE="max-file-size";
           this.$ACCEPTEDFILEEXTENSIONS="accepted-file-extensions";
           this.$ALLOWEDFILESIZEUNITS=["bytes", "KB", "MB", "GB"];
        }

        // Fires when an instance of the element is created.
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
                                        +      validFilesList[i].name + "</br>"
                                        +       "1024 X 768 Pixel</br>"
                                        +       fileSize + " MB</br>"
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
                            +      validFilesList[i].name + "</br>"
                            +       "1024 X 768 Pixel</br>"
                            +       fileSize + " MB</br>"
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

        //Extract image thumbnail
        getImgThumbNail(e)
        {
            var imageFIle = Array.prototype.slice.call(arguments)[0];
            this.shadowRoot.getElementById(imageFIle.name+"_preview").setAttribute("src" , Array.prototype.slice.call(arguments)[1].target.result);
        }

        //Uploading files to server
        upload(validFilesList){

            for (var i=0; i<validFilesList.length;i++)
            {
                //Section element
                let section = this.shadowRoot.getElementById(validFilesList[i].name+"_section");
                //Progress bar element
                let progressBar=this.shadowRoot.getElementById(validFilesList[i].name+"_progressBar");
                //Progress value element
                let progressText = this.shadowRoot.getElementById(validFilesList[i].name+"_progressText");

                //Form data object to store the file
                let formData  = new FormData();
                formData.append("file" , validFilesList[i]);

                //XHR to upload the file
                let httpReq=new XMLHttpRequest();

                //XHR event listeners
                httpReq.upload.addEventListener("loadstart", this.loadStartHandler.bind(this, validFilesList[i]));
                httpReq.upload.addEventListener("progress", this.progressHandler.bind(this, validFilesList[i]));

                //On load complete event
                httpReq.addEventListener("load", function(e)
                    {
                        if (httpReq.status===200)
                        {
                            section.innerHTML +="Upload success";
                        }else
                        {
                            section.innerHTML +="Upload failed with status code: " + httpReq.status;
                        }
                        //Hide the Progress bar

                        progressBar.className="elementHide";
                        progressText.className="elementHide";
                    });

                //Build and send the request
                httpReq.open("POST",this.$fileUpload.action,true);
                httpReq.setRequestHeader("FILENAME",validFilesList[i].name);
                //httpReq.setRequestHeader("content-type","multipart/form-data");
                httpReq.send(formData);


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

        loadStartHandler(e){
        //TODO: complete the event
        //var file = Array.prototype.slice.call(arguments)[0];
        }

        /*onloadHandler(e){

            console.log("upload complete");
            var file = Array.prototype.slice.call(arguments)[0];
            var event = Array.prototype.slice.call(arguments)[1];

             console.log(e);


            //Hide the Progress bar
            this.shadowRoot.getElementById(file.name+"_progressBar").className="elementHide";
            //Hide the Progress value
            this.shadowRoot.getElementById(file.name+"_progressText").className="elementHide";
            //Upload status message to user
            this.shadowRoot.getElementById(file.name+"_section").innerHTML +="Upload success";

            //console.log(httpReq.responseText);
        }*/

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

        fileDragHover(e)
        {
            e.stopPropagation();
            e.preventDefault();
            //console.log (e.type);
            //this.$componentContainer.className = (e.type == "dragover" ? "hover" : "componentContainer");
            //this.$filedrag.className = "hover";
        }

        //Calculate supplied file size in allowed units
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

        //Validating file size
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
        checkFileType(fileType)
        {
            let isValid=true;
            let fileExtensions=[];
            fileExtensions = this.$allowedFileExtensions.toLowerCase().split(",");

            if (this.$allowedFileExtensions == "-1")
            {
                isValid=true;
            }
            else
            {
                isValid = fileExtensions.indexOf(fileType.toLowerCase()) > -1 ? true : false;
            }
            return isValid;
        }
    }

    document.registerElement('file-upload', FileUpload);
})();
