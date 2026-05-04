(function() {
  'use strict';
  var App = window.App;
  if (!App) return;

  // ============================
  //  IndexedDB 字体存储
  // ============================
  var FontDB = {
    dbName: 'EdenFontDB',
    storeName: 'fonts',
    db: null,

    init: function() {
      return new Promise(function(resolve, reject) {
        var request = indexedDB.open(FontDB.dbName, 1);
        request.onerror = function() { reject(request.error); };
        request.onsuccess = function() { FontDB.db = request.result; resolve(); };
        request.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(FontDB.storeName)) {
            db.createObjectStore(FontDB.storeName, { keyPath: 'name' });
          }
        };
      });
    },

    saveFont: function(name, dataUrl) {
      return new Promise(function(resolve, reject) {
        if (!FontDB.db) { reject('DB not ready'); return; }
        var tx = FontDB.db.transaction([FontDB.storeName], 'readwrite');
        var store = tx.objectStore(FontDB.storeName);
        store.put({ name: name, dataUrl: dataUrl, time: Date.now() }).onsuccess = function() { resolve(); };
        store.put({ name: name, dataUrl: dataUrl, time: Date.now() }).onerror = function() { reject(); };
      });
    },

    getFont: function(name) {
      return new Promise(function(resolve, reject) {
        if (!FontDB.db) { reject('DB not ready'); return; }
        var tx = FontDB.db.transaction([FontDB.storeName], 'readonly');
        var req = tx.objectStore(FontDB.storeName).get(name);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(); };
      });
    }
  };

  // ============================
  //  文字卡片
  // ============================
  var DRAG_DELAY = 500;

  var Eden = {
    data: {},

    DEFAULTS: {
      text: '全世界 最好的你˶ᵒ ᵕ ˂˶️ಣ',
      fontSize: 38,
      rotate: 0,
      spacing: 2,
      fontColor: '#1a1a1a',
      fontName: '',
      fontUrl: '',
      posX: 0,
      posY: 0
    },

    load: function() {
      var saved = App.LS.get('edenCard');
      var d = Eden.DEFAULTS;
      Eden.data = saved ? {
        text: saved.text != null ? saved.text : d.text,
        fontSize: saved.fontSize != null ? saved.fontSize : d.fontSize,
        rotate: saved.rotate != null ? saved.rotate : d.rotate,
        spacing: saved.spacing != null ? saved.spacing : d.spacing,
        fontColor: saved.fontColor || d.fontColor,
        fontName: saved.fontName || '',
        fontUrl: saved.fontUrl || '',
        posX: saved.posX != null ? saved.posX : d.posX,
        posY: saved.posY != null ? saved.posY : d.posY
      } : JSON.parse(JSON.stringify(d));
    },

    save: function() { App.LS.set('edenCard', Eden.data); },

    loadFontFromDB: function(fontName) {
      if (!fontName) return Promise.resolve(false);
      return FontDB.getFont(fontName).then(function(result) {
        return result && result.dataUrl ? Eden.loadFontFromUrl(result.dataUrl, fontName) : false;
      }).catch(function() { return false; });
    },

    loadFontFromUrl: function(url, customName) {
      var fontName = customName || 'EdenCustom_' + Date.now();
      var font = new FontFace(fontName, 'url(' + url + ')');
      return font.load().then(function(loaded) {
        document.fonts.add(loaded);
        var textEl = App.$('#edenText');
        if (textEl) textEl.style.fontFamily = "'" + fontName + "', cursive";
        return true;
      }).catch(function() { return false; });
    },

    uploadAndSaveFont: function(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          var dataUrl = ev.target.result;
          var fontName = 'EdenFont_' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9]/g, '_');
          FontDB.saveFont(fontName, dataUrl).then(function() {
            Eden.loadFontFromUrl(dataUrl, fontName).then(function() {
              Eden.data.fontName = fontName;
              Eden.data.fontUrl = '';
              Eden.save();
              resolve(fontName);
            }).catch(reject);
          }).catch(reject);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    apply: function() {
      var el = App.$('#edenText');
      if (!el) return;
      var d = Eden.data;
      el.textContent = d.text || '';
      el.style.fontSize = (d.fontSize || 28) + 'px';
      el.style.transform = 'rotate(' + (d.rotate || 0) + 'deg)';
      el.style.letterSpacing = (d.spacing || 0) + 'px';
      el.style.color = d.fontColor || '#1a1a1a';
      el.style.whiteSpace = 'pre-wrap';
      el.style.wordBreak = 'break-word';

      var card = App.$('#edenCard');
      if (card && (d.posX || d.posY)) {
        card.style.transform = 'translate(' + d.posX + 'px, ' + d.posY + 'px)';
      }

      if (d.fontName) Eden.loadFontFromDB(d.fontName);
      else if (d.fontUrl) Eden.loadFontFromUrl(d.fontUrl);
    },

    bindDrag: function() {
      var card = App.$('#edenCard');
      if (!card) return;
      var startX, startY, startPosX, startPosY, longPressed = false, timer, moved = false;

      card.addEventListener('touchstart', function(e) {
        if (e.target.closest('.eden-ctrl-wrap')) return;
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        longPressed = false;
        moved = false;
        var match = (card.style.transform || '').match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        startPosX = match ? parseFloat(match[1]) : (Eden.data.posX || 0);
        startPosY = match ? parseFloat(match[2]) : (Eden.data.posY || 0);
        timer = setTimeout(function() {
          longPressed = true;
          card.classList.add('dragging');
          if (navigator.vibrate) navigator.vibrate(15);
        }, DRAG_DELAY);
      }, { passive: true });

      card.addEventListener('touchmove', function(e) {
        var touch = e.touches[0];
        if (timer && !longPressed) {
          if (Math.abs(touch.clientX - startX) > 8 || Math.abs(touch.clientY - startY) > 8) { clearTimeout(timer); timer = null; }
          return;
        }
        if (!longPressed) return;
        e.preventDefault();
        moved = true;
        card.style.transform = 'translate(' + (startPosX + touch.clientX - startX) + 'px, ' + (startPosY + touch.clientY - startY) + 'px)';
        Eden.data.posX = startPosX + touch.clientX - startX;
        Eden.data.posY = startPosY + touch.clientY - startY;
      }, { passive: false });

      card.addEventListener('touchend', function(e) {
        clearTimeout(timer);
        timer = null;
        card.classList.remove('dragging');
        if (longPressed && moved) { Eden.save(); e.stopPropagation(); }
        longPressed = false;
        moved = false;
      });
    },

    openEdit: function() {
      var old = App.$('#edenEditOverlay');
      if (old) { old.remove(); return; }

      // 重新加载最新数据
      var saved = App.LS.get('edenCard');
      if (saved) {
        Object.keys(Eden.DEFAULTS).forEach(function(k) {
          Eden.data[k] = saved[k] != null ? saved[k] : Eden.DEFAULTS[k];
        });
      }

      var d = Eden.data;

      var overlay = document.createElement('div');
      overlay.id = 'edenEditOverlay';
      overlay.className = 'pc-edit-overlay';

      var panel = document.createElement('div');
      panel.className = 'pc-edit-panel';
      panel.style.width = '280px';
      panel.style.height = 'auto';
      panel.style.maxHeight = '420px';

      panel.innerHTML =
        '<div class="pc-header">文字卡片<div class="pc-close-btn" id="edenCloseBtn">×</div></div>' +
        '<div class="pc-body" style="gap:8px;">' +

          '<div class="pc-group"><span class="pc-label">文字内容</span>' +
            '<textarea id="edenTextInput" rows="2" style="width:100%;padding:7px 10px;font-size:12px;color:#000;background:rgba(255,255,255,0.5);border:1px solid rgba(0,0,0,0.15);border-radius:8px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box;">' + App.esc(d.text || '') + '</textarea>' +
          '</div>' +

          '<div class="pc-group"><span class="pc-label">字体</span>' +
            '<div style="display:flex;gap:6px;align-items:center;">' +
              '<input type="text" class="pc-input" id="edenFontUrl" placeholder="字体URL（留空用全局）" value="' + App.esc(d.fontUrl || '') + '" style="flex:1;">' +
              '<label style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.5);border:1px solid rgba(0,0,0,0.15);border-radius:8px;cursor:pointer;flex-shrink:0;" for="edenFontFile">' +
                '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:#000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
              '</label>' +
              '<input type="file" id="edenFontFile" accept=".ttf,.otf,.woff,.woff2" hidden>' +
            '</div>' +
          '</div>' +

          '<div class="pc-group"><span class="pc-label">字号</span>' +
            '<div class="pc-slider-row"><input type="range" class="pc-slider" id="edenSize" min="14" max="60" value="' + (d.fontSize || 28) + '"><span class="pc-slider-val" id="edenSizeVal">' + (d.fontSize || 28) + 'px</span></div>' +
          '</div>' +

          '<div class="pc-group"><span class="pc-label">倾斜</span>' +
            '<div class="pc-slider-row"><input type="range" class="pc-slider" id="edenRotate" min="-20" max="20" value="' + (d.rotate || 0) + '"><span class="pc-slider-val" id="edenRotateVal">' + (d.rotate || 0) + '°</span></div>' +
          '</div>' +

          '<div class="pc-group"><span class="pc-label">间距</span>' +
            '<div class="pc-slider-row"><input type="range" class="pc-slider" id="edenSpacing" min="0" max="20" value="' + (d.spacing || 2) + '"><span class="pc-slider-val" id="edenSpacingVal">' + (d.spacing || 2) + 'px</span></div>' +
          '</div>' +

          '<div class="pc-group"><span class="pc-label">字色</span>' +
            '<div class="pc-dot" id="edenColorDot" style="background:' + (d.fontColor || '#1a1a1a') + ';width:28px;height:28px;border-radius:8px;"></div>' +
          '</div>' +

        '</div>' +
        '<div class="pc-footer">' +
          '<button class="pc-btn pc-btn-save" id="edenSave" type="button">保 存</button>' +
          '<button class="pc-btn pc-btn-cancel" id="edenReset" type="button">重 置</button>' +
        '</div>';

      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      // 定位到卡片附近
      var edenCard = App.$('#edenCard');
      if (edenCard) {
        var rect = edenCard.getBoundingClientRect();
        var left = rect.left + rect.width / 2 - 140;
        if (left < 8) left = 8;
        if (left + 280 > window.innerWidth - 8) left = window.innerWidth - 288;
        var top = rect.bottom + 8;
        if (top + 420 > window.innerHeight - 10) top = Math.max(10, rect.top - 430);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
      }

      // 拖拽面板
      if (App.modules.cards && App.modules.cards._bindPanelDrag) {
        App.modules.cards._bindPanelDrag(panel);
      }

      // 当前字色
      var currentFontColor = d.fontColor || '#1a1a1a';

      // 字体上传
      panel.querySelector('#edenFontFile').addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        App.showToast('上传中...');
        Eden.uploadAndSaveFont(file).then(function() {
          panel.querySelector('#edenFontUrl').value = '(已保存) ' + file.name;
          App.showToast('字体已保存');
        }).catch(function() { App.showToast('上传失败'); });
      });

      // 实时预览
      function preview() {
        panel.querySelector('#edenSizeVal').textContent = panel.querySelector('#edenSize').value + 'px';
        panel.querySelector('#edenRotateVal').textContent = panel.querySelector('#edenRotate').value + '°';
        panel.querySelector('#edenSpacingVal').textContent = panel.querySelector('#edenSpacing').value + 'px';
        var el = App.$('#edenText');
        if (!el) return;
        el.textContent = panel.querySelector('#edenTextInput').value || '';
        el.style.fontSize = panel.querySelector('#edenSize').value + 'px';
        el.style.transform = 'rotate(' + panel.querySelector('#edenRotate').value + 'deg)';
        el.style.letterSpacing = panel.querySelector('#edenSpacing').value + 'px';
        el.style.color = currentFontColor;
        el.style.whiteSpace = 'pre-wrap';
        el.style.wordBreak = 'break-word';
      }

      ['edenSize', 'edenRotate', 'edenSpacing', 'edenTextInput'].forEach(function(id) {
        var el = panel.querySelector('#' + id);
        if (el) el.addEventListener('input', preview);
      });

      // 字色用调色盘
      panel.querySelector('#edenColorDot').addEventListener('click', function(e) {
        e.stopPropagation();
        if (!App.openColorPicker) return;
        App.openColorPicker(currentFontColor, function(hex) {
          currentFontColor = hex;
          panel.querySelector('#edenColorDot').style.background = hex;
          preview();
        }, function(hex) {
          currentFontColor = hex;
          panel.querySelector('#edenColorDot').style.background = hex;
          preview();
        }, 'eden_fontColor');
      });

      // 字体URL
      panel.querySelector('#edenFontUrl').addEventListener('change', function() {
        var url = this.value.trim();
        if (url && !url.startsWith('(已保存)')) Eden.loadFontFromUrl(url);
      });

      // 保存
      panel.querySelector('#edenSave').addEventListener('click', function(e) {
        e.stopPropagation();
        var fontUrl = panel.querySelector('#edenFontUrl').value.trim();
        if (fontUrl && !fontUrl.startsWith('(已保存)')) {
          Eden.data.fontName = '';
          Eden.data.fontUrl = fontUrl;
        }
        Eden.data.text = panel.querySelector('#edenTextInput').value;
        Eden.data.fontSize = parseInt(panel.querySelector('#edenSize').value);
        Eden.data.rotate = parseInt(panel.querySelector('#edenRotate').value);
        Eden.data.spacing = parseInt(panel.querySelector('#edenSpacing').value);
        Eden.data.fontColor = currentFontColor;
        Eden.save();
        Eden.apply();
        overlay.remove();
        App.showToast('已保存');
      });

      // 重置
      panel.querySelector('#edenReset').addEventListener('click', function(e) {
        e.stopPropagation();
        Eden.data = JSON.parse(JSON.stringify(Eden.DEFAULTS));
        Eden.save();
        Eden.apply();
        overlay.remove();
        App.showToast('已重置');
      });

      // 关闭
      panel.querySelector('#edenCloseBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        overlay.remove();
      });

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
      });
    },

    init: function() {
      FontDB.init().then(function() {
        Eden.load();
        Eden.apply();
        Eden.bindDrag();
        var el = App.$('#edenCard');
        if (el) el.addEventListener('click', function(e) {
          e.stopPropagation();
          Eden.openEdit();
        });
      }).catch(function() {
        Eden.load();
        Eden.apply();
        Eden.bindDrag();
        var el = App.$('#edenCard');
        if (el) el.addEventListener('click', function(e) {
          e.stopPropagation();
          Eden.openEdit();
        });
      });
    }
  };

  App.register('eden', Eden);
})();

