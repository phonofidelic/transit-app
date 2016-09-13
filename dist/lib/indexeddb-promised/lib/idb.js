"use strict";!function(){function e(e){return Array.prototype.slice.call(e)}function t(e){return new Promise(function(t,n){e.onsuccess=function(){t(e.result)},e.onerror=function(){n(e.error)}})}function n(e,n,o){var r,i=new Promise(function(i,u){r=e[n].apply(e,o),t(r).then(i,u)});return i.request=r,i}function o(e,t,o){var r=n(e,t,o);return r.then(function(e){if(e)return new a(e,r.request)})}function r(e,t,n){n.forEach(function(n){Object.defineProperty(e.prototype,n,{get:function(){return this[t][n]}})})}function i(e,t,o,r){r.forEach(function(r){r in o.prototype&&(e.prototype[r]=function(){return n(this[t],r,arguments)})})}function u(e,t,n,o){o.forEach(function(o){o in n.prototype&&(e.prototype[o]=function(){return this[t][o].apply(this[t],arguments)})})}function c(e,t,n,r){r.forEach(function(r){r in n.prototype&&(e.prototype[r]=function(){return o(this[t],r,arguments)})})}function s(e){this._index=e}function a(e,t){this._cursor=e,this._request=t}function p(e){this._store=e}function f(e){this._tx=e,this.complete=new Promise(function(t,n){e.oncomplete=function(){t()},e.onerror=function(){n(e.error)}})}function d(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new f(n)}function l(e){this._db=e}r(s,"_index",["name","keyPath","multiEntry","unique"]),i(s,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),c(s,"_index",IDBIndex,["openCursor","openKeyCursor"]),r(a,"_cursor",["direction","key","primaryKey","value"]),i(a,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(e){e in IDBCursor.prototype&&(a.prototype[e]=function(){var n=this,o=arguments;return Promise.resolve().then(function(){return n._cursor[e].apply(n._cursor,o),t(n._request).then(function(e){if(e)return new a(e,n._request)})})})}),p.prototype.createIndex=function(){return new s(this._store.createIndex.apply(this._store,arguments))},p.prototype.index=function(){return new s(this._store.index.apply(this._store,arguments))},r(p,"_store",["name","keyPath","indexNames","autoIncrement"]),i(p,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getAllKeys","count"]),c(p,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),u(p,"_store",IDBObjectStore,["deleteIndex"]),f.prototype.objectStore=function(){return new p(this._tx.objectStore.apply(this._tx,arguments))},r(f,"_tx",["objectStoreNames","mode"]),u(f,"_tx",IDBTransaction,["abort"]),d.prototype.createObjectStore=function(){return new p(this._db.createObjectStore.apply(this._db,arguments))},r(d,"_db",["name","version","objectStoreNames"]),u(d,"_db",IDBDatabase,["deleteObjectStore","close"]),l.prototype.transaction=function(){return new f(this._db.transaction.apply(this._db,arguments))},r(l,"_db",["name","version","objectStoreNames"]),u(l,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(t){[p,s].forEach(function(n){n.prototype[t.replace("open","iterate")]=function(){var n=e(arguments),o=n[n.length-1],r=(this._store||this._index)[t].apply(this._store,n.slice(0,-1));r.onsuccess=function(){o(r.result)}}})}),[s,p].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,t){var n=this,o=[];return new Promise(function(r){n.iterateCursor(e,function(e){return e?(o.push(e.value),void 0!==t&&o.length==t?void r(o):void e["continue"]()):void r(o)})})})});var h={open:function(e,t,o){var r=n(indexedDB,"open",[e,t]),i=r.request;return i.onupgradeneeded=function(e){o&&o(new d(i.result,e.oldVersion,i.transaction))},r.then(function(e){return new l(e)})},"delete":function(e){return n(indexedDB,"deleteDatabase",[e])}};"undefined"!=typeof module?module.exports=h:self.idb=h}();