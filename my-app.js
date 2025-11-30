const dropArea = document.getElementById('uploadDrop');
const dropBody = document.querySelector('.main');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let completed = 0; let addedFiles = false; let completedCount = 0;
let uploadedFiles = []; let allAddedFiles = [];
let compressedFiles = {};
let webpEncoder = null;
let processCount = 0;
let compressionStatus = {beforeSize:0, afterSize: 0, saved: 0, percent: 0};
let animatingRocket = false;
let woofyIdleInterVal, woofyEarsInterVal, woofyEarsRInterVal;
let quality = 0.70; let maxWH = false; let webpConversion = 0; let imagePrefix = ''; let settingsChanged = false;

//Init App
document.addEventListener("DOMContentLoaded", function() {

   //Set Previous Settings
   setDefaultSettings();

   //Initate WebpEncoder
   const module = webp_enc();
   module.then((obj) =>{
      webpEncoder = obj; 
      //console.log(obj.version());
   });

   //Handle Drag/Drop Events
   ['dragenter', 'dragover'].forEach(eventName => {   dropArea.addEventListener(eventName, highlight, false); })
   dropArea.addEventListener('dragleave', unhighlight, false);
   dropArea.addEventListener('drop', handleDrop, false);
   //Handle Window Drop
   window.addEventListener('dragenter', (event)=> { 
      event.preventDefault(); event.stopPropagation();
      if(addedFiles){
         document.querySelector('.uploadDropWrap').classList.add('uploadDropWrap--popup');
      }
   }, false);
   dropBody.addEventListener('dragleave', (event)=> { 
      event.preventDefault(); event.stopPropagation();
      if(addedFiles){
         if( event.target === document.querySelector('.main')){
            document.querySelector('.uploadDropWrap').classList.remove('uploadDropWrap--popup');
         }
      }
   }, false);
   

   //Handle Form Upload Events
   document.querySelector('.form_file_upload_field').onchange = function(){
      hideDropField();
      animateRocket();
      const formFiles = document.querySelector('.form_file_upload_field').files;
      allAddedFiles.push(formFiles);
      processFiles(formFiles);
   }
   document.getElementById('uploadDropButton').addEventListener('click', () => {
      document.querySelector('.form_file_upload_field').click();
   });
   document.getElementById('uploadControlButton').addEventListener('click', () => {
      document.querySelector('.form_file_upload_field').click();
   });
   document.getElementById('clear_added_files').addEventListener('click', () => {
      uploadedFiles = []; compressedFiles = {}; completed = 0;
      document.querySelector('#fileList ul').innerHTML = '';
      document.querySelector('.compression_status').classList.remove('compression_status--complete')
      document.querySelector('.compression_status').innerHTML= '';
      updateElementStatus(completed);
      showDropField();
      
   });

   //Mobile Changes
   if(isMobile){
      document.querySelector('.dropboxTitle').textContent = 'Select .png or .jpg files to Compress!';
      document.querySelector('.woofy_speech_bubble__text').textContent = 'Select Images to Get Started!';
      document.querySelector('#uploadControlButton i').textContent = 'Add';
      document.querySelector('#clear_added_files i').textContent = 'Clear';
   }

   //Woofy
   woofyIdle();
   setTimeout(() => {
      document.querySelector('.woofy_speech_bubble').classList.add('woofy_speech_bubble--show');
   }, 400);

   //Animation
   document.addEventListener('compression_start', function (e) {
      if(woofyIdleInterVal) {clearInterval(woofyIdleInterVal)};
      if(woofyEarsInterVal) {clearInterval(woofyEarsInterVal)};
      if(woofyEarsRInterVal) {clearInterval(woofyEarsRInterVal)};
      document.querySelector('.woofy__suit').classList.add('woofy__suit--show');
      document.querySelector('.woofy__suit_helmet').classList.add('woofy__suit_helmet--show');
      document.querySelector('.woofy_speech_bubble').classList.remove('woofy_speech_bubble--show');
      document.getElementById('compress_progress').classList.remove('compression_complete');
      setTimeout(() => {
         document.querySelector('.woofy_speech_bubble__text').textContent = 'WEEEEEEEE!!!!!';
         document.querySelector('.woofy_speech_bubble').classList.add('woofy_speech_bubble--show');
      }, 300);
      
   }, false);

   document.addEventListener('compression_complete', function (e) { 
      if(animatingRocket === false){
         animatingRocket = true;
         const rocket = document.querySelector('.content_animation_rocket');
         setTimeout(() => {
            rocket.style.transition = 'none';
            rocket.style.opacity = 0;
            rocket.style.bottom = '-500px';
         }, 600);

         setTimeout(() => {
            rocket.style.transition = 'all 0.6s ease-in';
         }, 650);
         setTimeout(() => {
            rocket.style.opacity = 1;
            rocket.style.bottom = '-70px';
            animatingRocket = false;
            document.querySelector('.woofy_speech_bubble').classList.remove('woofy_speech_bubble--show');
         }, 700);
         setTimeout(() => {
            document.querySelector('.woofy__suit').classList.remove('woofy__suit--show');
            document.querySelector('.woofy__suit_helmet').classList.remove('woofy__suit_helmet--show');
            document.querySelector('.woofy_speech_bubble__text').textContent = 'All Done!!!!!';
            document.querySelector('.woofy_speech_bubble').classList.add('woofy_speech_bubble--show');
         }, 1400);
         //Share Buttons
         setTimeout(() => {
            const alreadyShared = localStorage.getItem('shared');
            if(!alreadyShared){
               const socialIcons = shareButtonsHTML();
               document.querySelector('.woofy_speech_bubble__text').innerHTML = socialIcons;
            }
         }, 3400);
      }
      setTimeout(() => {
         document.getElementById('compress_progress').classList.add('compression_complete');
         document.querySelector('.compression_status').classList.add('compression_status--complete');
         const totalReducedVerb = compressionStatus.afterSize ? ' Reduced '+readableFileSize(compressionStatus.saved, true)+' <span>('+compressionStatus.percent+'%)</span>' : '';
         document.querySelector('.compression_status').innerHTML = `✔ Compressed ${Object.keys(compressedFiles).length}/${uploadedFiles.length} Images. ${totalReducedVerb}`;
      }, 1000);
      woofyIdle();

   }, false);

   //Handle Errors
   document.addEventListener('compression_error', function (e) { 
      if(e.detail.error){
         document.querySelector('.woofy_speech_bubble').classList.remove('woofy_speech_bubble--show');
         document.querySelector('.woofy_speech_bubble__text').textContent = e.detail.error;
         setTimeout(() => {
            document.querySelector('.woofy_speech_bubble').classList.add('woofy_speech_bubble--show', 'woofy_speech_bubble--error');
         }, 300);
         setTimeout(() => {
            document.querySelector('.woofy_speech_bubble').classList.remove('woofy_speech_bubble--show', 'woofy_speech_bubble--error');
         }, 2000);
      }
   }, false);

   /* Only register a service worker if it's supported */
   if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
      caches.keys().then(function(cacheNames) {
         cacheNames.forEach(function(cacheName) {
            if(['compressimage_io_cachev2', 'cachev1'].includes(cacheName)){
               caches.delete(cacheName);
            }
         });
       });
   }
});

window.addEventListener("load", function(){
   setTimeout(() => {
      //Lazy Load Images
      const lazyImages = document.querySelectorAll('.lazyImg');
      if(lazyImages.length > 0){
         for (let i = 0; i < lazyImages.length; ++i) {
            const origImg = lazyImages[i].dataset.src;
            if(origImg){
               lazyImages[i].src  = origImg;
            }
         }
      }
   }, 2000);
});

//Functions
function demoCompare(original){
   document.querySelector('.info_compare_slider').classList.remove('info_compare_slider-active_original', 'info_compare_slider-active_compressed');
   document.querySelector('.info_compare_slider').classList.add(original ? 'info_compare_slider-active_original' : 'info_compare_slider-active_compressed');
}

function shareButtonsHTML(){
   const siteURL = location.href
   const fbIcon = '<a href="https://www.facebook.com/sharer.php?u='+siteURL+'" onclick="socialClicked()" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><g fill="#4264ce"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131c.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></g><rect x="0" y="0" width="16" height="16" fill="rgba(0, 0, 0, 0)" /></svg></a>';
   const twIcon = '<a href="https://twitter.com/share?url='+siteURL+'" onclick="socialClicked()" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578a9.3 9.3 0 0 1-2.958 1.13a4.66 4.66 0 0 0-7.938 4.25a13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.737 4.568a4.692 4.692 0 0 1-2.104.08a4.661 4.661 0 0 0 4.352 3.234a9.348 9.348 0 0 1-5.786 1.995a9.5 9.5 0 0 1-1.112-.065a13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254c0-.2-.005-.402-.014-.602a9.47 9.47 0 0 0 2.323-2.41l.002-.003z" fill="#54bdff"/></g></svg></a>';
   const lnIcon = '<a href="https://www.linkedin.com/shareArticle?mini=true&amp;url='+siteURL+'" onclick="socialClicked()" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 2.838A1.838 1.838 0 0 1 2.838 1H21.16A1.837 1.837 0 0 1 23 2.838V21.16A1.838 1.838 0 0 1 21.161 23H2.838A1.838 1.838 0 0 1 1 21.161V2.838zm8.708 6.55h2.979v1.496c.43-.86 1.53-1.634 3.183-1.634c3.169 0 3.92 1.713 3.92 4.856v5.822h-3.207v-5.106c0-1.79-.43-2.8-1.522-2.8c-1.515 0-2.145 1.089-2.145 2.8v5.106H9.708V9.388zm-5.5 10.403h3.208V9.25H4.208v10.54zM7.875 5.812a2.063 2.063 0 1 1-4.125 0a2.063 2.063 0 0 1 4.125 0z" fill="#257fa9"/></g></svg></a>';
   const socialIcons = '<div>'+fbIcon+twIcon+lnIcon+'</div>';
   return'<div style="color:#1b2023">Introduce me to your Friends?'+socialIcons+'</div>';
}

function socialClicked(){
   console.log('shared');
   localStorage.setItem('shared', 1);
}

function highlight(e) {
   e.preventDefault(); e.stopPropagation();
   dropArea.classList.add('highlight');
}

function unhighlight(e) {
   e.preventDefault(); e.stopPropagation();
   dropArea.classList.remove('highlight');
}
function handleDrop(e) {
   e.preventDefault();
   e.stopPropagation();
   document.querySelector('.uploadDropWrap').classList.remove('uploadDropWrap--popup');
   dropArea.classList.remove('highlight');
   let dt = e.dataTransfer;
   let files = dt.files;
   if(files){
      let NoImages =  ([...files]).find((file) => file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png' ) === undefined ? true : false;
      if(NoImages){
         const compressErrorEvent = new CustomEvent('compression_error', { detail: { error: 'Only JPG & PNG Files Please!' } });
         return document.dispatchEvent(compressErrorEvent);
      }

      hideDropField();
      animateRocket();
      allAddedFiles.push(files);
      processFiles(files);
   }
}

function hideDropField(){
   if(!addedFiles){ 
      addedFiles = true;
      document.querySelector('.uploadDropWrap').style.display ='none';
      document.querySelector('#theFiles').style.display ='block';
      document.querySelector('#theApp').classList.add('addedFiles');
   }
}

function showDropField(){
   addedFiles = false;
   document.querySelector('.uploadDropWrap').style.display ='block';
   document.querySelector('#theFiles').style.display ='none';
   document.querySelector('#theApp').classList.remove('addedFiles');
}

function animateRocket(){
   setTimeout(() => {
      document.querySelector('.content_animation_rocket').style.bottom = '900px';
      document.querySelector('.bloom').classList.add('bloom--show');
   }, 300);
   setTimeout(() => {
      document.querySelector('.bloom').classList.remove('bloom--show');
   }, 700);
}

async function processFiles(files){
   const promises  = [];
   //console.log(dt);
   const compressStartEvent = new CustomEvent('compression_start');
   document.dispatchEvent(compressStartEvent);
   // console.log('Processing Start!!!!' , `${new Date().getMinutes()}:${new Date().getSeconds()}`);
   const filesToCompress = [];

   for (let i = 0; i < files.length; i++) {
      const UID  = create_UUID();
      const file = files[i];
      //Compress JPG
      if( file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png'){
         const imageBase64 = await window.imageCompression.getDataUrlFromFile(file);
         const newNFile = {id: UID, fileName:file.name, size: parseFloat(file.size.toFixed(1)), sizeAfter:0, image: imageBase64 };
         // console.log(newNFile);
         filesToCompress.push(newNFile);
         uploadedFiles.push(newNFile);
         renderFile(newNFile);
         processCount++;
         updateProcessingStatus(processCount, files.length);
      }
   }

   //Reset Process Count
   processCount = 0;

   filesToCompress.forEach((newFile, index)=> {
      const file = files[index];
      if(webpConversion === 1){
         //Convert Image to WebP
         ConvertToWebP(newFile.image).then((compressedIMGBlob)=> {
            //console.log(compressedIMGBlob);
            completeCompression(newFile, compressedIMGBlob);
         });
      }else{
         //Compress JPG
         if( file.type === 'image/jpg' || file.type === 'image/jpeg'){
            const promiseJ = compressJpg(file).then((compressedIMGBlob)=> {
               completeCompression(newFile, compressedIMGBlob.size < file.size ? compressedIMGBlob : file);
            })
            promises.push(promiseJ);
         }
         //Compress PNG
         if(file.type === 'image/png'){
            const options = {   maxSizeMB: 2,  maxWidthOrHeight: maxWH ? maxWH : 5000,  useWebWorker: true,  maxIteration: 10  }
            const promiseP = imageCompression(file, options).then((compressedIMGBlob)=>{
               completeCompression(newFile, compressedIMGBlob.size < file.size ? compressedIMGBlob : file);
            })
            promises.push(promiseP);
         }
      }
   })


}

function updateStatus(){
   const total = uploadedFiles.length;
   const converted = Object.keys(compressedFiles).length;
   const completedProgress = (converted/total*100).toFixed(0);
   completed = completedProgress && (completed < 101) ? parseInt(completedProgress, 10) : 0;
   //console.log(total, converted, completed);
   updateElementStatus(completed);

   if(total === converted){
      //console.warn('All Done!!!', completed);
      //completed = 0;
      //updateElementStatus(completed);
      const completeEvent = new CustomEvent('compression_complete');
      document.dispatchEvent(completeEvent);
   }
}

function updateElementStatus(completed){
   if(completed < 101){
      let totalUploadSize = 0; let totalAfterCompress = 0;
      uploadedFiles.forEach((item)=> {   totalUploadSize = totalUploadSize + item.size; })
      Object.keys(compressedFiles).forEach((itemKey)=> {   totalAfterCompress = totalAfterCompress + compressedFiles[itemKey].sizeAfter;  });
      const compressedPercent = (totalAfterCompress/totalUploadSize*100).toFixed(0);
      const compressedPercentR = compressedPercent > 2 ? 100 - compressedPercent : 0; 
      const totalSaved = totalUploadSize - totalAfterCompress;
      //console.log(totalUploadSize, totalAfterCompress, compressedPercent);
      compressionStatus = { beforeSize: totalUploadSize, afterSize: totalAfterCompress, saved: totalSaved, percent: compressedPercentR}
      const totalReducedVerb = 'Total Reduced '+readableFileSize(totalSaved, true)+' <span>('+compressedPercentR+'%)</span>';
      document.querySelector('#progressbar span').style.width = completed+'%';
      document.querySelector('.fileList_footer__beforeAfter').innerHTML = readableFileSize(totalUploadSize, true)+' → <strong>'+readableFileSize(totalAfterCompress, true)+'</strong>';
      document.querySelector('.fileList_footer__totalSaving').innerHTML = totalReducedVerb;
      document.querySelector('.file_download').dataset.compressed = completed;
      document.querySelector('.compression_status').innerHTML = `Compressing ${Object.keys(compressedFiles).length}/${uploadedFiles.length} Images...`;
      animateProgressCount( completed );
   }
}

function updateProcessingStatus(completeCount, totalFiles){
   const complete = totalFiles === completeCount;
   document.querySelector('.fileList_footer__beforeAfter').style.display = complete ? 'block' : 'none';
   document.querySelector('.fileList_footer__totalSaving').style.display = complete ? 'block' : 'none';
   document.querySelector('.fileList_footer__processing').style.display = complete ? 'none' : 'block';
   document.querySelector('.fileList_footer__processing').innerHTML = `Processing ${completeCount}/${totalFiles} Images...`;
   document.querySelector('.compression_status').innerHTML = `Processing ${completeCount}/${totalFiles} Images...`;
   
}

function renderFile(file){
   //console.log(file);
   let finalHTML = '';
   if(file && file.fileName){
      const fHTML = '<li id="'+file.id+'">'+fileHTML(file)+'</li>';
      finalHTML += fHTML;
   }
   document.querySelector('#fileList ul').insertAdjacentHTML( 'beforeend', finalHTML ); ;

}

function fileHTML(file, done=false){
   const compressedPercent = done ? Math.round(file.sizeAfter/file.size*100) - 100 : 0;
   const doneIcon = done ? '<span class="file_done_icon"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#4bd37b"/><path fill="#fff" d="M46 14L25 35.6l-7-7.2l-7 7.2L25 50l28-28.8z"/><rect x="0" y="0" width="64" height="64" fill="rgba(0, 0, 0, 0)" /></svg></span>' : '';
   const downloadButton = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 8zM4 19h16v2H4z" fill="#999999"/></svg>';
   const viewIcon = '<svg onclick="compareImages(\''+file.id+'\')" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M16.325 14.899l5.38 5.38a1.008 1.008 0 0 1-1.427 1.426l-5.38-5.38a8 8 0 1 1 1.426-1.426zM10 16a6 6 0 1 0 0-12a6 6 0 0 0 0 12zm3-5h-2v2a1 1 0 0 1-2 0v-2H7a1 1 0 0 1 0-2h2V7a1 1 0 1 1 2 0v2h2a1 1 0 0 1 0 2z" fill="#ffffff" fill-rule="evenodd"/><rect x="0" y="0" width="24" height="24" fill="rgba(0, 0, 0, 0)" /></svg>';
   return doneIcon+'<div class="img_wrapper"><img src="'+file.image+'" onclick="compareImages(\''+file.id+'\')">'+(doneIcon && viewIcon)+'</div><div class="fileContent"><span class="fileTitle">'+file.fileName+'</strong></span><span class="fileSize">'+readableFileSize(file.size, true)+' → <strong>'+readableFileSize(file.sizeAfter, true)+'</span></div><div class="fileNewDownload" onclick="downloadFile(\''+file.id+'\')">'+downloadButton+'</div><div class="fileNewSize">'+compressedPercent+'%</div>';
}

function reRenderFile(file){
   document.getElementById(file.id).innerHTML = fileHTML(file, true);
   document.getElementById(file.id).classList.add('file_converted');
}

function create_UUID(){
   let dt = new Date().getTime();
   const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
   });
   return uuid;
}

function compressJpg(file){
   return new Promise((resolve, reject) => {
      new Compressor(file, {
            quality: quality,
            maxWidth: maxWH ? maxWH : 5000,
            maxHeight: maxWH ? maxWH : 5000,
            convertSize: 10000000,
            success: (result) => {
               resolve(new File([result], file.name, {type: result.type}))
            },
            error: error => reject(error)
      })
   });
}

function readableFileSize(bytes, si) {;
   const thresh = si ? 1000 : 1024;
   if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
   }
   const units = si ? ['kB','MB','GB','TB'] : ['KiB', 'MiB', 'GiB', 'TiB' ];
   let u = -1;
   do {
      bytes /= thresh;
      ++u;
   } while (Math.abs(bytes) >= thresh && u < units.length - 1);
   return bytes.toFixed(1) + ' ' + units[u];
}

function dataURLtoUint8(dataurl) {
   let arr = dataurl.split(','),
       mime = arr[0].match(/:(.*?);/)[1],
       bstr = atob(arr[1]),
       n = bstr.length,
       u8arr = new Uint8Array(n);
   while (n--) {
       u8arr[n] = bstr.charCodeAt(n);
   }
   return u8arr;
}


function animateProgressCount( target ) {
   const elem = document.querySelector('#compress_progress i');
   let number = parseInt(elem.textContent, 10);
   if(number < target) {
       const interval = setInterval(function() {
         elem.textContent = number;
         elem.parentElement.dataset.compressed = target;
           if (number >= target) {
               clearInterval(interval);
               return;
           }
           number++;
       }, 10);
   }
   if(target < number) {
      elem.textContent = target;
      elem.parentElement.dataset.compressed = 0;
   }

}

function downloadFile(fileID){
   const file = compressedFiles[fileID];
   const fileName = generateFileName(file.fileName, file.newImage && file.newImage.type ? file.newImage.type : false);
   if(file.newImage){
      saveAs(file.newImage, fileName);
   }
}

function generateFileName(fileName, fileType, fileNameIndex=null){
   let newFileName = fileName;
   if(imagePrefix){
      newFileName = newFileName.replace('.jpg',imagePrefix+'.jpg').replace('.jpeg',imagePrefix+'.jpg').replace('.png',imagePrefix+'.png')
   }
   if(fileType && fileType.includes('webp')){
      newFileName = newFileName.replace('.jpg','.webp').replace('.jpeg','.webp').replace('.png','.webp');
   }

   if(fileNameIndex && fileNameIndex > 0){
      newFileName = newFileName.replace('.jpg',fileNameIndex+'.jpg').replace('.png',fileNameIndex+'.png').replace('.webp',fileNameIndex+'.webp');
   }

   return newFileName;
}

function zipFiles(){
   if(Object.keys(compressedFiles).length !== uploadedFiles.length){ return console.log('Zip Aborted! Not All files has been Compressed yet!'); }
   console.log('Zipping Files...');
   document.querySelector('.file_download button i').innerHTML = 'Zipping Files...';
   const zip = new JSZip();
   let fileNames = [];
   Object.keys(compressedFiles).forEach((fileID)=> {
      const file = compressedFiles[fileID];
      const filenameCount = fileNames.filter(x => x === file.fileName);
      const fileNameIndex = filenameCount && filenameCount.length > 0 ? filenameCount.length : '';  
      const fileName = generateFileName(file.fileName, file.newImage && file.newImage.type ? file.newImage.type : false, fileNameIndex);
      if(file.newImage){
         fileNames.push(file.fileName);
         zip.file(fileName, file.newImage);
      }
   })
   zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "compressimage-io.zip");
      fileNames = [];
      console.log('Zipping Files Compltete!!');
      document.querySelector('.file_download button i').innerHTML = 'Download Zip';
   });
}

function updateQuality(value, changeComplete){
   //console.log(value);
   if(value){
      quality = parseInt(value, 10) /100;
      document.querySelector('.setting_image_quality__val').textContent = value+'%';
      if(changeComplete){
         localStorage.setItem('compression_strength', quality);
      }
   }
   showRecompress();
}

function updateMaxSize(value, changeComplete){
   const liveValue = document.querySelector('#setting_image_widthHeight').value;
   //console.log(liveValue);
   if(liveValue){
      maxWH = parseInt(value, 10);
      if(changeComplete){
         localStorage.setItem('compression_maxWidthHeight', maxWH);
      }
   }else{
      maxWH = '';
      if(changeComplete){
         localStorage.setItem('compression_maxWidthHeight', '');
      }
   }
   showRecompress();
}

function updateImagePrefix(value, changeComplete){
   const liveValue = document.querySelector('#setting_image_prefix').value;
   //console.log(liveValue);
   if(liveValue){
      imagePrefix = liveValue;
      if(changeComplete){
         localStorage.setItem('compression_prefix', imagePrefix);
      }
   }else{
      imagePrefix = '';
      if(changeComplete){
         localStorage.setItem('compression_prefix', '');
      }
   }
   showRecompress();
}

function updateWebpSetting(){
   const value = document.querySelector('#setting_image_webp').checked;
   if(value){
      webpConversion = 1;
   }else{
      webpConversion = 0;
   }
   localStorage.setItem('compression_webpConversion', webpConversion);
   showRecompress();
}

function showSettings(){
   const settingsBox = document.querySelector('#fileControls');
   if(settingsBox.classList.toString().includes('show_settings')){
      settingsBox.classList.remove('show_settings');
      localStorage.setItem('compression_strength', quality);
      localStorage.setItem('compression_maxWidthHeight', maxWH);
      localStorage.setItem('compression_webpConversion', webpConversion);
      localStorage.setItem('compression_prefix', imagePrefix);
   }else{
      settingsBox.classList.add('show_settings');
   }
}

function setDefaultSettings(){
   const compression_strength = localStorage.getItem('compression_strength');
   const compression_maxWidthHeight = localStorage.getItem('compression_maxWidthHeight');
   const compression_WebpConversion = localStorage.getItem('compression_webpConversion');
   const compression_prefix = localStorage.getItem('compression_prefix');
   if(compression_strength){ 
      quality = parseFloat(compression_strength, 10)
      document.querySelector('#setting_image_quality').value = quality * 100;
      document.querySelector('.setting_image_quality__val').textContent = (quality * 100)+'%';
   }
   if(compression_maxWidthHeight){ 
      maxWH = parseInt(compression_maxWidthHeight, 10);
      if(maxWH){
         document.querySelector('#setting_image_widthHeight').value = maxWH;
      }
   }
   if(compression_prefix){ 
      imagePrefix = compression_prefix;
      document.querySelector('#setting_image_prefix').value = imagePrefix;
   }
   if(parseInt(compression_WebpConversion, 10)){
      webpConversion = 1;
      document.querySelector('#setting_image_webp').checked = true;
   }
}

function showRecompress(){
   const recompressBtn = document.getElementById('recompress');
   if(!recompressBtn.classList.contains('recompress--show') && allAddedFiles.length > 0){
      recompressBtn.classList.add('recompress--show');
   }
}

function recompress(){
   const recompressBtn = document.getElementById('recompress');
   if(recompressBtn.classList.contains('recompress--show') && allAddedFiles.length > 0){
      document.querySelector('#fileList ul').innerHTML = '';
      completed = 0; completedCount =0;
      compressedFiles = {};
      uploadedFiles = [];

      processFiles(allAddedFiles[0]);

      document.getElementById('fileControls').classList.remove('show_settings');
      recompressBtn.classList.remove('recompress--show');
   }
}

function compareImages(fileID){
   const file = compressedFiles[fileID];
   if(file && file.newImage){
      const beforeImage = document.querySelector('.before_image');
      const afterImage = document.querySelector('.after_image');
      const compareElement = document.getElementById('compare');
      const compareInnerElement = document.querySelector('.compare__inner');
      
      beforeImage.innerHTML = '<img src="'+file.image+'" />';
      afterImage.innerHTML = '<img src="'+window.URL.createObjectURL(file.newImage)+'" />';
      beforeImage.dataset.size="Before ("+readableFileSize(file.size, true)+")";
      afterImage.dataset.size="After ("+readableFileSize(file.sizeAfter, true)+")";
      
      setTimeout(() => {
         const afterImageElement = document.querySelector('.after_image img');
         const natWidth = afterImageElement.naturalWidth;
         const natHeight = afterImageElement.naturalHeight;
         
         if(natHeight > natWidth &&  natHeight > (window.innerHeight * 90/100)){
            compareElement.classList.add('compare--portrait');
         }
         if(natWidth < 1200 && natHeight < (window.innerHeight * 90/100)){
            compareElement.classList.add('compare--imageHeight');
            compareInnerElement.style.width = natWidth+'px';
         }
         compareElement.classList.add('compare--show');
      }, 100);

   }
}

function closeCompare(){
   document.querySelector('.uploadDropWrap').classList.remove('uploadDropWrap--popup');
   document.getElementById('compare').classList.remove('compare--show', 'compare--portrait', 'compare--imageHeight');
   document.querySelector('.compare__inner').style.width = null;
   document.querySelector('.before_image').innerHTML = ''; document.querySelector('.before_image').dataset.size="Before (0 Kb)";
   document.querySelector('.after_image').innerHTML = ''; document.querySelector('.after_image').dataset.size="After (0 Kb)";
}

function moveCompareSlider(){
   document.querySelector('.before_image').style.width = document.getElementById("compare_slider").value+"%";
}

function woofyIdle(){
   woofyIdleInterVal = setInterval(function() {
      const eyes = document.querySelector('.woofy__eyes');
      const eyes_closed = document.querySelector('.woofy__eyes_closed');
      eyes.style.display ='none'; eyes_closed.style.display ='block';
      setTimeout(() => { eyes.style.display ='block';  eyes_closed.style.display ='none';  }, 200);
   }, 3600);

   woofyEarsInterVal = setInterval(function() {
      const ears_left = document.querySelector('.woofy__ears_left');
      ears_left.style.backgroundPosition ='-326px -385px'; 
      setTimeout(() => {   ears_left.style.backgroundPosition ='-550px -385px';   }, 3500);
   }, 6200);
   woofyEarsRInterVal = setInterval(function() {
      const ears_right = document.querySelector('.woofy__ears_right');
      ears_right.style.backgroundPosition ='-432px -385px';
      setTimeout(() => {  ears_right.style.backgroundPosition ='-655px -385px';  }, 3500);
   }, 9200);
}

async function encodeWebP(image)  {
   return new Promise((resolve, reject) => {
      //console.log('Version:', webpEncoder.version().toString(16));
      const result = webpEncoder.encode(image.data, image.width, image.height, {
         quality: (quality * 100),
         target_size: 0,
         target_PSNR: 0,
         method: 4,
         sns_strength: 50,
         filter_strength: 60,
         filter_sharpness: 0,
         filter_type: 1,
         partitions: 0,
         segments: 4,
         pass: 1,
         show_compressed: 0,
         preprocessing: 0,
         autofilter: 0,
         partition_limit: 0,
         alpha_compression: 1,
         alpha_filtering: 1,
         alpha_quality: 100,
         lossless: 0,
         exact: 0,
         image_hint: 0,
         emulate_jpeg_size: 0,
         thread_level: 0,
         low_memory: 0,
         near_lossless: 100,
         use_delta_palette: 0,
         use_sharp_yuv: 0,
      });
      const blob = new Blob([result], {type: 'image/webp'});

      webpEncoder.free_result();
      
      resolve( blob );

   });
};

async function ConvertToWebP(imageData){
      const img = document.createElement('img');
      img.src = imageData; let imgLoadedSize = {}; 
      await new Promise(resolve => img.onload = function(){
         const imgData = {width: img.width, height: img.height};
         imgLoadedSize = imgData;
         resolve(imgData);
      });

      const canvas = document.createElement('canvas');
      let imgWidth = img.width || img.naturalWidth;
      let imgHeight = img.height || img.naturalHeight;
      canvas.width = imgWidth; canvas.height = imgHeight; 
      //console.log(imgWidth, imgHeight);

      if(maxWH){
         if (imgWidth > imgHeight) {
            canvas.width = maxWH
            canvas.height = (imgHeight / imgWidth) * maxWH
            img.width = maxWH; img.height = canvas.height;
         } else {
            canvas.width = (imgWidth / imgHeight) * maxWH
            canvas.height = maxWH;
            img.height = maxWH; img.width = canvas.width;
         }
      }

      //[canvas.width, canvas.height] = [img.width, img.height];
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const webPCompImage = ctx.getImageData(0, 0, img.width, img.height);
      return encodeWebP(webPCompImage);
}

function completeCompression(newFile, compressedIMGBlob){
   if(compressedIMGBlob){
      const UID = newFile && newFile.id;
      if(!compressedFiles[UID]){
         const updatedFile = {...newFile, newImage: compressedIMGBlob, sizeAfter: parseFloat(compressedIMGBlob.size.toFixed(1)), converted: true};
         compressedFiles[UID] = (updatedFile);
         //console.log(updatedFiles);
         reRenderFile(updatedFile);
         updateStatus();
      }
      return compressedIMGBlob;
   }
}
