(function(){
'use strict';
var App=window.App;if(!App)return;

var EMPTY={name:'',sub:'',avatar:'',tag1:'',tag2:''};
var DEF_SUB_L='✥ 同你奔赴一场风花雪月 ✥';
var DEF_SUB_R='◈ 与你共赏一阙火树银花 ◈';

var Cards={
  data:{},_dragOffsets:{},

  load:function(){
    Cards.data=App.LS.get('profileCards')||{};
    if(!Cards.data.left){Cards.data.left=JSON.parse(JSON.stringify(EMPTY));Cards.data.left.sub=DEF_SUB_L;}
    if(!Cards.data.right){Cards.data.right=JSON.parse(JSON.stringify(EMPTY));Cards.data.right.sub=DEF_SUB_R;}
    Cards._dragOffsets=App.LS.get('cardDragOffsets')||{};
  },
  save:function(){App.LS.set('profileCards',Cards.data);},
  saveDrag:function(){App.LS.set('cardDragOffsets',Cards._dragOffsets);},

  render:function(){
    var container=App.$('#cardRow');if(!container)return;
    var L=Cards.data.left,R=Cards.data.right;

    var lt1=L.tag1||'标签',lt2=L.tag2||'标签';
    var lt1C=L.tag1?'':' bx-tag-placeholder',lt2C=L.tag2?'':' bx-tag-placeholder';

    var lFront=L.avatar
      ?'<div class="bx-av-front" style="background-image:url(\''+App.esc(L.avatar)+'\')"></div>'
      :'<div class="bx-av-front"><div class="bx-av-placeholder"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span>点击设置</span></div></div>';

    var lName=L.name||'角色名',lSub=L.sub||DEF_SUB_L;
    var lNameC=L.name?'':' bx-name-placeholder';

    var rt1=R.tag1||'标签',rt2=R.tag2||'标签';
    var rt1C=R.tag1?'':' bx-ribbon-placeholder',rt2C=R.tag2?'':' bx-ribbon-placeholder';

    var rFront=R.avatar
      ?'<div class="bx-av-front" style="background-image:url(\''+App.esc(R.avatar)+'\')"></div>'
      :'<div class="bx-av-front"><div class="bx-av-placeholder"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span>点击设置</span></div></div>';

    var rName=R.name||'角色名',rSub=R.sub||DEF_SUB_R;
    var rNameC=R.name?'':' bx-name-placeholder';

    container.innerHTML=
      '<div class="left-area-wrapper">'+
        '<div class="bx-w" id="bx-2" data-side="left">'+
          '<div class="bx-tag-wrap">'+
            '<div class="bx-tag bx-tag1'+lt1C+'">'+App.esc(lt1)+'</div>'+
            '<div class="bx-tag bx-tag2'+lt2C+'">'+App.esc(lt2)+'</div>'+
          '</div>'+
          '<div class="bx-cw"><div class="bx-cd">'+
            '<div class="bx-av-box">'+lFront+'</div>'+
            '<div class="bx-name-bar">'+
              '<div class="bx-name'+lNameC+'">'+App.esc(lName)+'</div>'+
              '<div class="bx-sub">'+App.esc(lSub)+'</div>'+
            '</div>'+
          '</div></div>'+
        '</div>'+
        '<div class="left-search-area">'+
          '<div class="search-wrapper">'+
            '<div class="search-box">'+
              '<div class="avatar-area-left" data-side="search1">'+
                '<div class="avatar-preview" id="avatarPreview1">'+
                  '<svg viewBox="0 0 24 24" fill="none" stroke="#adcdea" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>'+
                '</div>'+
              '</div>'+
              '<input type="text" class="search-input-left" placeholder="我们相识...">'+
            '</div>'+
          '</div>'+
          '<div class="search-wrapper">'+
            '<div class="search-box-right">'+
              '<input type="text" class="search-input-right" placeholder="已经有...天">'+
              '<div class="avatar-area-right" data-side="search2">'+
                '<div class="avatar-preview" id="avatarPreview2">'+
                  '<svg viewBox="0 0 24 24" fill="none" stroke="#adcdea" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="card-right-area">'+
        '<div class="card-placeholder-icons">'+
          '<div class="card-ph-item"><div class="card-ph-icon"></div><div class="card-ph-label">占位符</div></div>'+
          '<div class="card-ph-item"><div class="card-ph-icon"></div><div class="card-ph-label">占位符</div></div>'+
        '</div>'+
        '<div class="bx-w" id="bx-1" data-side="right">'+
          '<div class="bx-cw"><div class="bx-cd">'+
            '<div class="bx-side-ribbon">'+
              '<div class="bx-ribbon-tab r1'+rt1C+'">'+App.esc(rt1)+'</div>'+
              '<div class="bx-ribbon-tab r2'+rt2C+'">'+App.esc(rt2)+'</div>'+
            '</div>'+
            '<div class="bx-av-box">'+rFront+'</div>'+
            '<div class="bx-name-bar">'+
              '<div class="bx-name'+rNameC+'">'+App.esc(rName)+'</div>'+
              '<div class="bx-sub">'+App.esc(rSub)+'</div>'+
            '</div>'+
          '</div></div>'+
        '</div>'+
      '</div>';

    Cards.bindEdit();
    Cards.applyDragOffsets();
    Cards.bindDrag();
    Cards.bindSearchUpload();
  },

  bindSearchUpload:function(){
    var leftInput=document.querySelector('.search-input-left');
    var leftSaved=App.LS.get('searchText_left');
    if(leftSaved&&leftInput)leftInput.value=leftSaved;
    if(leftInput)leftInput.addEventListener('input',function(){App.LS.set('searchText_left',this.value);});

    var rightInput=document.querySelector('.search-input-right');
    var rightSaved=App.LS.get('searchText_right');
    if(rightSaved&&rightInput)rightInput.value=rightSaved;
    if(rightInput)rightInput.addEventListener('input',function(){App.LS.set('searchText_right',this.value);});

    /* ★ 对话框头像：支持裁剪 */
    Cards._bindSearchAvatar('.avatar-area-left[data-side="search1"]','avatarPreview1','avatar_search1');
    Cards._bindSearchAvatar('.avatar-area-right[data-side="search2"]','avatarPreview2','avatar_search2');
  },

  _bindSearchAvatar:function(selector,previewId,storageKey){
    var area=document.querySelector(selector);
    var preview=document.getElementById(previewId);
    if(!area||!preview)return;

    area.addEventListener('click',function(){
      var input=document.createElement('input');
      input.type='file';input.accept='image/*';
      input.onchange=function(e){
        var file=e.target.files[0];if(!file)return;
        var reader=new FileReader();
        reader.onload=function(ev){
          if(App.cropImage){
            App.cropImage(ev.target.result,function(cropped){
              Cards._compressAndSetSearchAvatar(cropped,preview,storageKey);
            });
          } else {
            Cards._compressAndSetSearchAvatar(ev.target.result,preview,storageKey);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    var saved=App.LS.get(storageKey);
    if(saved){
      preview.innerHTML='';
      var img=document.createElement('img');img.src=saved;
      preview.appendChild(img);
    }
  },

  _compressAndSetSearchAvatar:function(src,preview,storageKey){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement('canvas'),max=200,w=img.width,h=img.height;
      if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      var compressed=canvas.toDataURL('image/jpeg',0.85);
      preview.innerHTML='';
      var newImg=document.createElement('img');newImg.src=compressed;
      preview.appendChild(newImg);
      App.LS.set(storageKey,compressed);
    };
    img.src=src;
  },

  bindEdit:function(){
    document.querySelectorAll('#cardRow .bx-w').forEach(function(card){
      var nameBar=card.querySelector('.bx-name-bar');
      if(nameBar)nameBar.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();Cards.openEdit(card.dataset.side,card);});
      var ph=card.querySelector('.bx-av-placeholder');
      if(ph)ph.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();Cards.openEdit(card.dataset.side,card);});
    });
  },

  applyDragOffsets:function(){
    ['bx-1','bx-2'].forEach(function(id){
      var el=App.$('#'+id);if(!el)return;
      var off=Cards._dragOffsets[id];
      if(off)el.style.transform='translate('+off.x+'px,'+off.y+'px)';
    });
  },

  bindDrag:function(){
    ['bx-1','bx-2'].forEach(function(id){
      var el=App.$('#'+id);if(!el)return;
      var avBox=el.querySelector('.bx-av-box');if(!avBox)return;
      var startX,startY,startOX,startOY,longPressed=false,timer,moved=false;

      avBox.addEventListener('touchstart',function(e){
        if(e.target.closest('.bx-av-placeholder'))return;
        var t=e.touches[0];startX=t.clientX;startY=t.clientY;longPressed=false;moved=false;
        timer=setTimeout(function(){
          longPressed=true;
          var off=Cards._dragOffsets[id]||{x:0,y:0};
          startOX=off.x;startOY=off.y;
          el.style.transition='none';el.style.opacity='0.9';el.style.zIndex='999';
          if(navigator.vibrate)navigator.vibrate(15);
        },500);
      },{passive:true});

      avBox.addEventListener('touchmove',function(e){
        var t=e.touches[0];
        if(timer&&!longPressed){if(Math.abs(t.clientX-startX)>8||Math.abs(t.clientY-startY)>8){clearTimeout(timer);timer=null;}return;}
        if(!longPressed)return;
        moved=true;e.preventDefault();e.stopPropagation();
        var nx=startOX+t.clientX-startX,ny=startOY+t.clientY-startY;
        el.style.transform='translate('+nx+'px,'+ny+'px)';
        Cards._dragOffsets[id]={x:nx,y:ny};
      },{passive:false});

      avBox.addEventListener('touchend',function(e){
        clearTimeout(timer);timer=null;
        el.style.opacity='';el.style.transition='';el.style.zIndex='';
        if(longPressed&&moved){Cards.saveDrag();e.stopPropagation();}
        longPressed=false;moved=false;
      });
    });
  },

  resetAllPositions:function(){
    Cards._dragOffsets={};Cards.saveDrag();
    ['bx-1','bx-2'].forEach(function(id){var el=App.$('#'+id);if(el)el.style.transform='';});
  },

  /* ★ 重写 openEdit：在卡片下方弹出 + 可拖拽 + 头像裁剪 */
  openEdit:function(side,cardEl){
    var d=Cards.data[side];
    var defSub=side==='left'?DEF_SUB_L:DEF_SUB_R;
    var old=App.$('#pcEditOverlay');if(old)old.remove();

    var overlay=document.createElement('div');
    overlay.id='pcEditOverlay';
    overlay.className='pc-edit-overlay';

    var panel=document.createElement('div');
    panel.className='pc-edit-panel';

    panel.innerHTML=
      '<div class="pc-edit-title" id="pcDragHandle">编辑'+(side==='left'?'左':'右')+'卡片</div>'+
      '<div class="pc-edit-group"><label class="pc-edit-label">头像</label><div class="pc-edit-upload-row"><input type="text" class="pc-edit-input" id="pcEditAvatar" placeholder="图片URL..." value="'+App.escAttr(d.avatar||'')+'"><label class="pc-edit-file-btn" for="pcEditFile"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></label><input type="file" id="pcEditFile" accept="image/*" hidden></div></div>'+
      '<div class="pc-edit-group"><label class="pc-edit-label">名字</label><input type="text" class="pc-edit-input" id="pcEditName" value="'+App.escAttr(d.name||'')+'"></div>'+
      '<div class="pc-edit-group"><label class="pc-edit-label">签名</label><input type="text" class="pc-edit-input" id="pcEditSub" value="'+App.escAttr(d.sub||defSub)+'"></div>'+
      '<div class="pc-edit-row2"><div class="pc-edit-group"><label class="pc-edit-label">标签1</label><input type="text" class="pc-edit-input" id="pcEditTag1" value="'+App.escAttr(d.tag1||'')+'"></div><div class="pc-edit-group"><label class="pc-edit-label">标签2</label><input type="text" class="pc-edit-input" id="pcEditTag2" value="'+App.escAttr(d.tag2||'')+'"></div></div>'+
      '<div class="pc-edit-btns"><button class="pc-edit-save" id="pcEditSaveBtn" type="button">保存</button><button class="pc-edit-cancel" id="pcEditCancelBtn" type="button">取消</button></div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    /* 定位在卡片下方 */
    if(cardEl){
      var rect=cardEl.getBoundingClientRect();
      var left=rect.left+rect.width/2-120;
      var top=rect.bottom+8;
      if(left<8)left=8;
      if(left+240>window.innerWidth)left=window.innerWidth-248;
      if(top+360>window.innerHeight)top=Math.max(10,window.innerHeight-370);
      panel.style.left=left+'px';
      panel.style.top=top+'px';
    } else {
      panel.style.left='50%';
      panel.style.top='50%';
      panel.style.transform='translate(-50%,-50%)';
    }

    /* ★ 拖拽 */
    var _drag={active:false,sx:0,sy:0,ox:0,oy:0};
    panel.addEventListener('touchstart',function(e){
  if(e.target.closest('button')||e.target.closest('input')||e.target.closest('label'))return;
      if(e.target.closest('button')||e.target.closest('input'))return;
      var t=e.touches[0];
      var pr=panel.getBoundingClientRect();
      panel.style.transform='none';
      panel.style.left=pr.left+'px';
      panel.style.top=pr.top+'px';
      _drag={active:true,sx:t.clientX,sy:t.clientY,ox:pr.left,oy:pr.top};
    },{passive:true});

    document.addEventListener('touchmove',function onMove(e){
      if(!_drag.active)return;e.preventDefault();
      var t=e.touches[0];
      panel.style.left=(_drag.ox+t.clientX-_drag.sx)+'px';
      panel.style.top=(_drag.oy+t.clientY-_drag.sy)+'px';
    },{passive:false});

    document.addEventListener('touchend',function onEnd(){_drag.active=false;});

    /* ★ 头像上传：支持裁剪 */
    panel.querySelector('#pcEditFile').addEventListener('change',function(e){
      var file=e.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(ev){
        if(App.cropImage){
          App.cropImage(ev.target.result,function(cropped){
            Cards._compressAvatar(cropped,function(compressed){
              panel.querySelector('#pcEditAvatar').value=compressed;
            });
          });
        } else {
          Cards._compressAvatar(ev.target.result,function(compressed){
            panel.querySelector('#pcEditAvatar').value=compressed;
          });
        }
      };
      reader.readAsDataURL(file);
    });

    panel.querySelector('#pcEditSaveBtn').addEventListener('click',function(){
      Cards.data[side]={
        avatar:panel.querySelector('#pcEditAvatar').value.trim(),
        name:panel.querySelector('#pcEditName').value.trim(),
        sub:panel.querySelector('#pcEditSub').value.trim(),
        tag1:panel.querySelector('#pcEditTag1').value.trim(),
        tag2:panel.querySelector('#pcEditTag2').value.trim()
      };
      Cards.save();Cards.render();overlay.remove();App.showToast('已保存');
    });

    panel.querySelector('#pcEditCancelBtn').addEventListener('click',function(){overlay.remove();});
    overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  },

  _compressAvatar:function(src,callback){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement('canvas'),max=400,w=img.width,h=img.height;
      if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      callback(canvas.toDataURL('image/jpeg',0.8));
    };
    img.src=src;
  },

  init:function(){Cards.load();Cards.render();}
};

App.register('cards',Cards);
})();