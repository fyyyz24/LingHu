const assert=require('node:assert/strict');
const {boot,read,sha}=require('../scripts/materials-lib.cjs');
const c=boot(),I=c.data.imports;
let checks=0;const check=(ok,msg)=>{assert.ok(ok,msg);checks++;};
const metadata={label:'胸片',caption:'教学参考，非该患者原片',author:'James Heilman, MD',license:'CC BY-SA 3.0',sourceNote:'公开 Effusion.png 文件，本地选择'};
const bytes=read('dist/assets/references/pleural-effusion.png');
c.btoa=s=>Buffer.from(s,'binary').toString('base64');
c.Image=class{constructor(){this.naturalWidth=1022;this.naturalHeight=1098;}set src(v){this.onload();}};
const file=(b,name='image.png')=>({name,size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)});
(async()=>{
  const image=await I.readLocalImage(file(bytes));
  check(sha(Buffer.from(image.dataUrl.split(',')[1],'base64'))===sha(bytes),'original image bytes preserved');
  check(image.width===1022&&image.height===1098,'decoded dimensions returned');
  for(const bad of [Buffer.from('<svg></svg>'),Buffer.alloc(0),Buffer.alloc(1100001)]){await assert.rejects(()=>I.readLocalImage(file(bad)));checks++;}
  c.Image=class{set src(v){this.onerror();}};await assert.rejects(()=>I.readLocalImage(file(bytes)),/解码/);checks++;
  const base=I.sample(),b=I.withLocalImage(base,image,metadata);
  check(base.assets.length===0&&b.assets.length===1,'merge does not mutate original JSON');
  check(I.validate(b).length===0,'local image without public URLs accepted');
  check(I.withLocalImage(base,null,metadata)===base,'optional image');
  for(const mutate of [x=>x.assets[0].sourceNote='',x=>x.assets[0].author='',x=>x.assets[0].license='',x=>x.assets[0].sourceUrl='javascript:alert(1)',x=>x.assets[0].licenseUrl='https://user:secret@example.com',x=>delete x.assets[0].sourceType]){const x=JSON.parse(JSON.stringify(b));mutate(x);check(I.validate(x).length>0,'missing/unsafe provenance rejected');}
  let saved;const storage={getItem(){return saved},setItem(k,v){saved=v}};const index=I.commit(b,storage);
  check(c.data.cases[index].hasImage,'imported case has image');
  check(c.data.evidence.all().find(x=>x.id==='case-6-image-0').sourceNote===metadata.sourceNote,'evidence retains local provenance');
  const r=boot();r.data.imports.restore(storage);check(r.data.resources[6].assets[0].src===image.dataUrl,'local image survives restore');
  check(!r.ClinicalExperience,'API namespace not leaked');
  const html=read('dist/index.html').toString();for(const id of ['caseImageFile','removeLocalImage','localImagePreview','exportImportBundle'])check(html.includes(`id="${id}"`),'image UI bound');
  // Exercise the same UI event handlers with controlled async image reads.
  const elements={};const elem=id=>elements[id]||=( {id,value:'',disabled:false,hidden:false,textContent:'',files:[],addEventListener(type,fn){this['on'+type]=fn},removeAttribute(k){delete this[k]}} );
  for(const id of ['caseImportForm','importPreview','confirmCaseImport','caseImageFile','localImagePreview','localImageStatus','removeLocalImage','exportImportBundle','caseImportFile','loadImportExample','caseImportText','confirmDeidentified','localImageLabel','localImageCaption','localImageAuthor','localImageLicense','localImageSource'])elem(id);
  c.document={getElementById:elem};c.recording=false;I.initUI();
  elem('loadImportExample').onclick();check(elem('caseImportText').value.includes('TEACHING-IMPORT-'),'template uses unique id');
  let decode,readyResolve;const ready=new Promise(resolve=>readyResolve=resolve); c.Image=class{constructor(){this.naturalWidth=10;this.naturalHeight=10;}set src(v){decode=()=>this.onload();readyResolve();}};
  elem('caseImageFile').files=[file(bytes)];const reading=elem('caseImageFile').onchange();await ready;
  elem('caseImportForm').onsubmit({preventDefault(){}});check(elem('importPreview').textContent.includes('仍在读取'),'submit waits for read');
  elem('removeLocalImage').onclick();decode();await reading;
  check(elem('localImagePreview').hidden&&!elem('localImagePreview').src,'removal cancels late image load');
  c.Image=class{constructor(){this.naturalWidth=1022;this.naturalHeight=1098;}set src(v){this.onload();}};
  elem('caseImageFile').files=[file(bytes)];await elem('caseImageFile').onchange();
  elem('localImageLabel').value=metadata.label;elem('localImageCaption').value=metadata.caption;elem('localImageAuthor').value=metadata.author;elem('localImageLicense').value=metadata.license;elem('localImageSource').value=metadata.sourceNote;elem('confirmDeidentified').checked=true;
  elem('caseImportForm').onsubmit({preventDefault(){}});
  check(!elem('confirmCaseImport').disabled&&!elem('exportImportBundle').disabled&&elem('importPreview').textContent.includes('含本地上传图片'),'uploaded image merges and validates in UI');
  elem('caseImportForm').oninput({target:elem('localImageCaption')});check(elem('confirmCaseImport').disabled&&elem('exportImportBundle').disabled,'editing metadata invalidates prior confirmation');
  elem('caseImageFile').files=[file(Buffer.from('<svg/>'))];await elem('caseImageFile').onchange();elem('caseImportForm').onsubmit({preventDefault(){}});check(elem('confirmCaseImport').disabled&&elem('importPreview').textContent.includes('不支持'),'invalid image cannot silently import text only');
  console.log(`PASS: ${checks} local image upload, metadata, preservation and async UI checks.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
