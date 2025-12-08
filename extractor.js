// ==UserScript==
// @name         YouTube Transcript Overlay
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(async ()=>{
  const id=new URLSearchParams(location.search).get('v');
  if(!id)return;
  const cap=await fetch('/api/timedtext?v='+id+'&lang=en&fmt=json').then(r=>r.json()).catch(()=>null)
         || await fetch('/api/timedtext?v='+id+'&fmt=json').then(r=>r.json()).catch(()=>null);
  if(!cap){alert('No captions');return;}
  const txt=cap.events.map(e=>e.seg.map(s=>s.utf8).join(' ')).join('\n\n');
  showOverlay(txt);
  function showOverlay(t){
    if(document.getElementById('yt-txt-overlay'))return;
    const d=document.createElement('div');
    d.id='yt-txt-overlay';
    d.innerHTML=`
      <style>
        #yt-txt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);color:#fff;z-index:9999;font-family:system-ui;padding:2rem;display:flex;flex-direction:column}
        #yt-txt-overlay textarea{flex:1;width:100%;background:#1e1e1e;color:#fff;border:none;padding:1rem;font-size:14px;resize:none}
        #yt-txt-overlay button{margin:4px;padding:6px 12px;background:#0af;border:none;color:#fff;border-radius:3px;cursor:pointer}
        #yt-txt-overlay .bar{display:flex;gap:8px;margin-bottom:8px}
      </style>
      <div class=bar>
        <button onclick='this.parentElement.parentElement.remove()'>Close</button>
        <button onclick='document.execCommand("copy");alert("Copied")'>Copy</button>
        <button onclick='saveAs(document.querySelector("#yt-txt-overlay textarea").value)'>Download</button>
        <span style=margin-left:auto>Words: <b>${t.split(/\s+/).filter(Boolean).length}</b> | Chars: <b>${t.length}</b></span>
      </div>
      <textarea readonly>${t}</textarea>
    `;
    document.body.appendChild(d);
    d.querySelector('textarea').select();
  }
  function saveAs(str){const b=new Blob([str],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='transcript.txt';a.click();URL.revokeObjectURL(u);}
})();
