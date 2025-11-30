const dropArea = document.getElementById('uploadDrop');
const dropBody = document.querySelector('.main');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let completed = 0; let addedFiles = false; let completedCount = 0;
let uploadedFiles = []; let allAddedFiles = [];
let compressedFiles = {};
let webpEncoder = null;
let processCount = 0;
let compressionStatus = {beforeSize:0, afterSize: 0, saved: 0, percent: 0};
let targetSizeKB = 150; let maxWH = false; let webpConversion = 0; let imagePrefix = ''; let settingsChanged = false;

//Init App
document.addEventListener("DOMContentLoaded", function() {

   //Set Previous Settings
   setDefaultSettings();

   //Initate WebpEncoder
   const module = webp_enc();
   module.then((obj) =>{
      webpEncoder = obj; 
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
      document.querySelector('#uploadControlButton i').textContent = 'Add';
      document.querySelector('#clear_added_files i').textContent = 'Clear';
   }

   //Animation
   document.addEventListener('compression_start', function (e) {
      document.getElementById('compress_progress').classList.remove('compression_complete');
   }, false);

   document.addEventListener('compression_complete', function (e) { 
      setTimeout(() => {
         document.getElementById('compress_progress').classList.add('compression_complete');
         document.querySelector('.compression_status').classList.add('compression_status--complete');
         const totalReducedVerb = compressionStatus.afterSize ? ' Reduced '+readableFileSize(compressionStatus.saved, true)+' <span>('+compressionStatus.percent+'%)</span>' : '';
         document.querySelector('.compression_status').innerHTML = `✔ Compressed ${Object.keys(compressedFiles).length}/${uploadedFiles.length} Images. ${totalReducedVerb}`;
      }, 1000);
   }, false);

   //Handle Errors
   document.addEventListener('compression_error', function (e) { 
      if(e.detail.error){
         alert(e.detail.error);
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

async function processFiles(files){
   const compressStartEvent = new CustomEvent('compression_start');
   document.dispatchEvent(compressStartEvent);
   
   const filesToCompress = [];

   // First pass: render all files
   for (let i = 0; i < files.length; i++) {
      const UID  = create_UUID();
      const file = files[i];
      if( file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png'){
         const imageBase64 = await window.imageCompression.getDataUrlFromFile(file);
         const newNFile = {id: UID, fileName:file.name, size: parseFloat(file.size.toFixed(1)), sizeAfter:0, image: imageBase64 };
         filesToCompress.push(newNFile);
         uploadedFiles.push(newNFile);
         renderFile(newNFile);
         processCount++;
         updateProcessingStatus(processCount, files.length);
      }
   }

   //Reset Process Count
   processCount = 0;

   // Second pass: compress all files in parallel
   const compressionPromises = filesToCompress.map(async (newFile, index) => {
      const file = files[index];
      
      if(webpConversion === 1){
         //Convert Image to WebP with adaptive compression
         const compressedIMGBlob = await compressToTargetSizeWebP(newFile.image, file);
         completeCompression(newFile, compressedIMGBlob);
      } else {
         //Adaptive compression based on file type
         if(file.type === 'image/jpg' || file.type === 'image/jpeg'){
            const compressedIMGBlob = await compressToTargetSizeJPG(file);
            completeCompression(newFile, compressedIMGBlob.size < file.size ? compressedIMGBlob : file);
         }
         
         if(file.type === 'image/png'){
            const compressedIMGBlob = await compressToTargetSizePNG(file);
            completeCompression(newFile, compressedIMGBlob.size < file.size ? compressedIMGBlob : file);
         }
      }
   });

   // Wait for all compressions to complete
   await Promise.all(compressionPromises);
}

// Adaptive compression for JPG - binary search for target size
async function compressToTargetSizeJPG(file) {
   const targetBytes = targetSizeKB * 1024;
   let quality = 0.95;
   let bestResult = null;
   let bestQuality = 0.70;
   
   // Try different quality levels
   while (quality >= 0.70) {
      const compressed = await compressJpg(file, quality);
      
      if (compressed.size <= targetBytes) {
         // Found a result within target - return immediately
         return compressed;
      }
      
      // Store best result in case we can't meet target
      if (!bestResult || compressed.size < bestResult.size) {
         bestResult = compressed;
         bestQuality = quality;
      }
      
      quality -= 0.05;
   }
   
   // Return best result we could achieve
   return bestResult || file;
}

// Adaptive compression for PNG - binary search for target size
async function compressToTargetSizePNG(file) {
   const targetBytes = targetSizeKB * 1024;
   let maxIteration = 5;
   let bestResult = null;
   
   // Try different iteration levels (5 down to 1 for speed)
   while (maxIteration >= 1) {
      const options = {   
         maxSizeMB: targetSizeKB / 1024,  
         maxWidthOrHeight: maxWH ? maxWH : 5000,  
         useWebWorker: true,  
         maxIteration: maxIteration  
      }
      
      const compressed = await imageCompression(file, options);
      
      if (compressed.size <= targetBytes) {
         return compressed;
      }
      
      if (!bestResult || compressed.size < bestResult.size) {
         bestResult = compressed;
      }
      
      maxIteration--;
   }
   
   return bestResult || file;
}

// Adaptive compression for WebP
async function compressToTargetSizeWebP(imageData, originalFile) {
   const targetBytes = targetSizeKB * 1024;
   let quality = 95;
   let bestResult = null;
   
   while (quality >= 70) {
      const compressed = await ConvertToWebP(imageData, quality);
      
      if (compressed.size <= targetBytes) {
         return compressed;
      }
      
      if (!bestResult || compressed.size < bestResult.size) {
         bestResult = compressed;
      }
      
      quality -= 5;
   }
   
   return bestResult || originalFile;
}

function updateStatus(){
   const total = uploadedFiles.length;
   const converted = Object.keys(compressedFiles).length;
   const completedProgress = (converted/total*100).toFixed(0);
   completed = completedProgress && (completed < 101) ? parseInt(completedProgress, 10) : 0;
   updateElementStatus(completed);

   if(total === converted){
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
   return doneIcon+'<div class="img_wrapper"><img src="'+file.image+'"></div><div class="fileContent"><span class="fileTitle">'+file.fileName+'</strong></span><span class="fileSize">'+readableFileSize(file.size, true)+' → <strong>'+readableFileSize(file.sizeAfter, true)+'</span></div><div class="fileNewDownload" onclick="downloadFile(\''+file.id+'\')">'+downloadButton+'</div><div class="fileNewSize">'+compressedPercent+'%</div>';
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

function compressJpg(file, quality){
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
      console.log('Zipping Files Complete!!');
      document.querySelector('.file_download button i').innerHTML = 'Download Zip';
   });
}

function updateTargetSize(value, changeComplete){
   if(value){
      targetSizeKB = parseInt(value, 10);
      document.querySelector('.setting_target_size_kb__val').textContent = value+' KB';
      if(changeComplete){
         localStorage.setItem('compression_targetSize', targetSizeKB);
      }
   }
   showRecompress();
}

function updateMaxSize(value, changeComplete){
   const liveValue = document.querySelector('#setting_image_widthHeight').value;
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
      localStorage.setItem('compression_targetSize', targetSizeKB);
      localStorage.setItem('compression_maxWidthHeight', maxWH);
      localStorage.setItem('compression_webpConversion', webpConversion);
      localStorage.setItem('compression_prefix', imagePrefix);
   }else{
      settingsBox.classList.add('show_settings');
   }
}

function setDefaultSettings(){
   const compression_targetSize = localStorage.getItem('compression_targetSize');
   const compression_maxWidthHeight = localStorage.getItem('compression_maxWidthHeight');
   const compression_WebpConversion = localStorage.getItem('compression_webpConversion');
   const compression_prefix = localStorage.getItem('compression_prefix');
   if(compression_targetSize){ 
      targetSizeKB = parseInt(compression_targetSize, 10)
      document.querySelector('#setting_target_size_kb').value = targetSizeKB;
      document.querySelector('.setting_target_size_kb__val').textContent = targetSizeKB+' KB';
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

async function encodeWebP(image, quality)  {
   return new Promise((resolve, reject) => {
      const result = webpEncoder.encode(image.data, image.width, image.height, {
         quality: quality,
         target_size: 0,
         target_PSNR: 0,
         method: 2,
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

async function ConvertToWebP(imageData, quality){
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

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const webPCompImage = ctx.getImageData(0, 0, img.width, img.height);
      return encodeWebP(webPCompImage, quality);
}

function completeCompression(newFile, compressedIMGBlob){
   if(compressedIMGBlob){
      const UID = newFile && newFile.id;
      if(!compressedFiles[UID]){
         const updatedFile = {...newFile, newImage: compressedIMGBlob, sizeAfter: parseFloat(compressedIMGBlob.size.toFixed(1)), converted: true};
         compressedFiles[UID] = (updatedFile);
         reRenderFile(updatedFile);
         updateStatus();
      }
      return compressedIMGBlob;
   }
}
