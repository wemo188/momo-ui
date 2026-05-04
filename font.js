(function(){
'use strict';
var App=window.App;if(!App)return;

var DB_NAME='GlobalFontDB';
var STORE_NAME='fontFiles';

var BUILTIN=[
  {name:'系统默认',family:'-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif'},
  {name:'霞鹜文楷',family:'"LXGW WenKai",cursive'},
  {name:'思源宋体',family:'"Noto Serif SC",serif'},
  {name:'思源黑体',family:'"Noto Sans SC",sans-serif'},
  {name:'站酷小薇',family:'"ZCOOL XiaoWei",serif'},
  {name:'马善政楷',family:'"Ma Shan Zheng",cursive'}
];

var DEF_CFG={selected:'系统默认',previewText:'你好世界，这是一段预览文字。\nHello World, The quick brown fox jumps over the lazy dog.'};

var _db=null;

function openDB(cb){
  try{
    var req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'name'});};
    req.onsuccess=function(e){_db=e.target.result;if(cb)cb();};
    req.onerror=function(){if(cb)cb();};
  }catch(e){if(cb)cb();}
}

function saveFont(name,dataUrl,cb){
  if(!_db){if(cb)cb(false);return;}
  var tx=_db.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).put({name:name,dataUrl:dataUrl,time:Date.now()});
  tx.oncomplete=function(){if(cb)cb(true);};
  tx.onerror=function(){if(cb)cb(false);};
}

function deleteFont(name,cb){
  if(!_db){if(cb)cb();return;}
  var tx=_db.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).delete(name);
  tx.oncomplete=function(){if(cb)cb();};
  tx.onerror=function(){if(cb)cb();};
}

function getAllFonts(cb){
  if(!_db){cb([]);return;}
  var tx=_db.transaction(STORE_NAME,'readonly');
  var req=tx.objectStore(STORE_NAME).getAll();
  req.onsuccess=function(){cb(req.result||[]);};
  req.onerror=function(){cb([]);};
}

function loadFontFace(name,dataUrl){
  var ff=new FontFace(name,'url('+dataUrl+')');
  return ff.load().then(function(loaded){document.fonts.add(loaded);return true;}).catch(function(){return false;});
}

var Font={
  config:{},
  customList:[],

  load:function(){
    Font.config=App.LS.get('fontConfig')||JSON.parse(JSON.stringify(DEF_CFG));
    Font.customList=App.LS.get('fontCustomList')||[];
    /* 兼容旧数据：没有 scale 的补上默认 1 */
    Font.customList.forEach(function(f){if(f.scale==null)f.scale=1;});
  },

  save:function(){
    App.LS.set('fontConfig',Font.config);
    App.LS.set('fontCustomList',Font.customList);
  },

  getFamily:function(name){
    for(var i=0;i<BUILTIN.length;i++){if(BUILTIN[i].name===name)return BUILTIN[i].family;}
    for(var j=0;j<Font.customList.length;j++){if(Font.customList[j].name===name)return Font.customList[j].family;}
    return BUILTIN[0].family;
  },

  /* ★ 获取指定字体的缩放倍数（内置字体返回1） */
  getScale:function(name){
    for(var j=0;j<Font.customList.length;j++){if(Font.customList[j].name===name)return Font.customList[j].scale||1;}
    return 1;
  },

  apply:function(){
    var family=Font.getFamily(Font.config.selected||'系统默认');
    document.body.style.fontFamily=family;
  },

  open:function(){
    Font.load();
    var panel=App.$('#fontPanel');if(!panel)return;
    getAllFonts(function(fonts){
      var promises=[];
      fonts.forEach(function(f){promises.push(loadFontFace(f.name,f.dataUrl));});
      Promise.all(promises).then(function(){
        Font.render(panel);
        panel.classList.remove('hidden');
        setTimeout(function(){panel.classList.add('show');},20);
      });
    });
  },

  close:function(){
    var panel=App.$('#fontPanel');if(!panel)return;
    panel.classList.remove('show');
    setTimeout(function(){panel.classList.add('hidden');},350);
  },

  render:function(panel){
    var selected=Font.config.selected||'系统默认';
    var previewText=Font.config.previewText||DEF_CFG.previewText;
    var selectedFamily=Font.getFamily(selected);

    var builtinHtml=BUILTIN.map(function(f){
      var isActive=selected===f.name;
      return '<div class="ft-item'+(isActive?' active':'')+'" data-fname="'+App.escAttr(f.name)+'" data-family="'+App.escAttr(f.family)+'">' +
        '<div class="ft-item-preview" style="font-family:'+f.family+';">你好世界 Hello 永</div>' +
        '<div class="ft-item-name">'+App.esc(f.name)+'</div>' +
        '<div class="ft-item-check"></div>' +
      '</div>';
    }).join('');

    var customHtml='';
    if(Font.customList.length){
      customHtml=Font.customList.map(function(f,ci){
        var isActive=selected===f.name;
        var sc=f.scale!=null?f.scale:1;
        return '<div class="ft-custom-card'+(isActive?' active':'')+'" data-fname="'+App.escAttr(f.name)+'" data-family="'+App.escAttr(f.family)+'" data-custom="1">' +
          '<div class="ft-custom-top">' +
            '<div class="ft-item-preview" style="font-family:'+f.family+';font-size:'+Math.round(17*sc)+'px;">你好世界 Hello 永</div>' +
            '<div class="ft-item-name">'+App.esc(f.fileName||f.name)+'</div>' +
            '<div class="ft-del-btn" data-del="'+App.escAttr(f.name)+'">' +
              '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/></svg>' +
            '</div>' +
            '<div class="ft-item-check"></div>' +
          '</div>' +
          '<div class="ft-scale-row">' +
            '<span class="ft-scale-label">视觉大小补偿</span>' +
            '<input type="range" class="ft-scale-slider" data-ci="'+ci+'" min="0.6" max="1.6" step="0.05" value="'+sc+'">' +
            '<span class="ft-scale-val" id="ftScaleVal'+ci+'">'+sc+'x</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    panel.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:56px 16px 12px;background:#fff;border-bottom:1px solid rgba(126,163,201,.2);flex-shrink:0;z-index:10;">' +
        '<button id="ftCloseBtn" type="button" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:#7a9ab8;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg></button>' +
        '<span style="font-size:16px;font-weight:800;color:#2e4258;letter-spacing:1px;">字体设置</span>' +
        '<div style="width:36px;"></div>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;">' +

        /* 预览区 */
        '<div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 4px 20px rgba(126,163,201,.08);border:1px solid rgba(126,163,201,.15);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:800;color:#2e4258;display:flex;align-items:center;gap:6px;"><div style="width:4px;height:12px;background:#7a9ab8;border-radius:2px;"></div>预览</div>' +
            '<div style="font-size:11px;color:#8aa0b8;font-weight:600;">'+App.esc(selected)+'</div>' +
          '</div>' +
          '<div id="ftPreview" style="padding:20px;background:rgba(126,163,201,.04);border:1px solid rgba(126,163,201,.12);border-radius:14px;min-height:120px;font-family:'+selectedFamily+';font-size:18px;line-height:1.8;color:#2e4258;white-space:pre-wrap;word-break:break-word;transition:font-family .3s;">'+
            App.esc(previewText)+
          '</div>' +
          '<textarea id="ftPreviewInput" placeholder="自定义预览文字..." style="width:100%;margin-top:12px;padding:10px 14px;border:1.5px solid rgba(126,163,201,.2);border-radius:10px;font-size:13px;color:#2e4258;outline:none;font-family:inherit;resize:none;background:rgba(255,255,255,.8);box-sizing:border-box;min-height:50px;">'+App.esc(previewText)+'</textarea>' +
        '</div>' +

        /* 内置字体 */
        '<div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 4px 20px rgba(126,163,201,.08);border:1px solid rgba(126,163,201,.15);">' +
          '<div style="font-size:14px;font-weight:800;color:#2e4258;margin-bottom:14px;display:flex;align-items:center;gap:6px;"><div style="width:4px;height:12px;background:#5a9e6f;border-radius:2px;"></div>内置字体</div>' +
          '<div class="ft-list" id="ftBuiltinList">'+builtinHtml+'</div>' +
        '</div>' +

        /* 自定义字体 */
        '<div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:30px;box-shadow:0 4px 20px rgba(126,163,201,.08);border:1px solid rgba(126,163,201,.15);">' +
          '<div style="font-size:14px;font-weight:800;color:#2e4258;margin-bottom:14px;display:flex;align-items:center;gap:6px;"><div style="width:4px;height:12px;background:#c9706b;border-radius:2px;"></div>自定义字体</div>' +
          '<div id="ftUploadArea" style="width:100%;height:54px;border:2px dashed rgba(126,163,201,.4);border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:700;color:#7a9ab8;cursor:pointer;background:rgba(126,163,201,.05);margin-bottom:16px;-webkit-tap-highlight-color:transparent;">' +
            '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            '上传字体文件' +
          '</div>' +
          '<input type="file" id="ftFileInput" accept=".ttf,.otf,.woff,.woff2" hidden>' +
          '<div class="ft-list" id="ftCustomList">'+(customHtml||'<div style="text-align:center;color:#bbb;font-size:12px;padding:16px 0;">暂无自定义字体</div>')+'</div>' +
        '</div>' +

      '</div>';

    Font.bindEvents(panel);
  },

  bindEvents:function(panel){
    panel.querySelector('#ftCloseBtn').addEventListener('click',function(){Font.close();});
    App.bindSwipeBack(panel,function(){Font.close();});

    // 预览文字
    var previewInput=panel.querySelector('#ftPreviewInput');
    if(previewInput){
      previewInput.addEventListener('input',function(){
        var text=this.value||DEF_CFG.previewText;
        Font.config.previewText=text;
        Font.save();
        var preview=panel.querySelector('#ftPreview');
        if(preview)preview.textContent=text;
      });
    }

    // 上传
    panel.querySelector('#ftUploadArea').addEventListener('click',function(){panel.querySelector('#ftFileInput').click();});
    panel.querySelector('#ftFileInput').addEventListener('change',function(e){
      var file=e.target.files[0];if(!file)return;
      var rawName=file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g,'_');
      var fontName='Custom_'+rawName+'_'+Date.now();
      App.showToast('加载字体中...');
      var reader=new FileReader();
      reader.onload=function(ev){
        var dataUrl=ev.target.result;
        loadFontFace(fontName,dataUrl).then(function(ok){
          if(!ok){App.showToast('字体加载失败');return;}
          saveFont(fontName,dataUrl,function(success){
            if(!success){App.showToast('保存失败');return;}
            var family="'"+fontName+"',sans-serif";
            Font.customList.push({name:fontName,family:family,fileName:file.name,scale:1});
            Font.config.selected=fontName;
            Font.save();
            Font.apply();
            Font.render(panel);
            App.showToast('字体已添加：'+file.name);
          });
        });
      };
      reader.readAsDataURL(file);
      e.target.value='';
    });

    // 选择内置字体
    panel.querySelectorAll('.ft-item').forEach(function(item){
      item.addEventListener('click',function(e){
        if(e.target.closest('.ft-del-btn'))return;
        Font.config.selected=item.dataset.fname;
        Font.save();
        Font.apply();
        Font.render(panel);
      });
    });

    // 选择自定义字体（点击整个卡片）
    panel.querySelectorAll('.ft-custom-card').forEach(function(card){
      card.addEventListener('click',function(e){
        if(e.target.closest('.ft-del-btn'))return;
        if(e.target.closest('.ft-scale-slider'))return;
        Font.config.selected=card.dataset.fname;
        Font.save();
        Font.apply();
        Font.render(panel);
      });
    });

    // ★ 缩放滑块
    panel.querySelectorAll('.ft-scale-slider').forEach(function(slider){
      slider.addEventListener('input',function(e){
        e.stopPropagation();
        var ci=parseInt(slider.dataset.ci);
        var val=parseFloat(slider.value);
        var valEl=panel.querySelector('#ftScaleVal'+ci);
        if(valEl)valEl.textContent=val+'x';

        // 更新数据
        if(Font.customList[ci]){
          Font.customList[ci].scale=val;
          Font.save();
        }

        // 更新同卡片的预览字
        var card=slider.closest('.ft-custom-card');
        if(card){
          var prev=card.querySelector('.ft-item-preview');
          if(prev)prev.style.fontSize=Math.round(17*val)+'px';
        }

        // 如果当前选中的就是这个字体，更新大预览区
        if(Font.customList[ci]&&Font.config.selected===Font.customList[ci].name){
          var preview=panel.querySelector('#ftPreview');
          if(preview)preview.style.fontSize=Math.round(18*val)+'px';
        }
      });
      // 阻止滑块的 click 冒泡到卡片
      slider.addEventListener('click',function(e){e.stopPropagation();});
    });

    // 删除自定义字体
    panel.querySelectorAll('.ft-del-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var name=btn.dataset.del;if(!name)return;
        if(!confirm('删除这个字体？'))return;
        deleteFont(name,function(){
          Font.customList=Font.customList.filter(function(f){return f.name!==name;});
          if(Font.config.selected===name)Font.config.selected='系统默认';
          Font.save();
          Font.apply();
          Font.render(panel);
          App.showToast('已删除');
        });
      });
    });
  },

  init:function(){
    openDB(function(){
      Font.load();
      getAllFonts(function(fonts){
        fonts.forEach(function(f){loadFontFace(f.name,f.dataUrl);});
        Font.apply();
      });
    });
    App.font=Font;
  }
};

App.register('font',Font);
})();