var app=function(){"use strict";function e(){}function t(e){return e()}function n(){return Object.create(null)}function o(e){e.forEach(t)}function r(e){return"function"==typeof e}function i(e,t){return e!=e?t==t:e!==t||e&&"object"==typeof e||"function"==typeof e}function s(e,t){e.appendChild(t)}function c(e){e.parentNode.removeChild(e)}function a(e){return document.createElement(e)}function l(e){return document.createTextNode(e)}function u(){return l(" ")}function h(e,t,n,o){return e.addEventListener(t,n,o),()=>e.removeEventListener(t,n,o)}function f(e,t,n){null==n?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}function d(e,t){t=""+t,e.wholeText!==t&&(e.data=t)}let g;function p(e){g=e}function m(e){(function(){if(!g)throw new Error("Function called outside component initialization");return g})().$$.on_mount.push(e)}const b=[],v=[],y=[],w=[],$=Promise.resolve();let x=!1;function _(e){y.push(e)}const P=new Set;let E=0;function S(){const e=g;do{for(;E<b.length;){const e=b[E];E++,p(e),T(e.$$)}for(p(null),b.length=0,E=0;v.length;)v.pop()();for(let e=0;e<y.length;e+=1){const t=y[e];P.has(t)||(P.add(t),t())}y.length=0}while(b.length);for(;w.length;)w.pop()();x=!1,P.clear(),p(e)}function T(e){if(null!==e.fragment){e.update(),o(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(_)}}const k=new Set;function R(e,t){-1===e.$$.dirty[0]&&(b.push(e),x||(x=!0,$.then(S)),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function C(i,s,a,l,u,h,f,d=[-1]){const m=g;p(i);const b=i.$$={fragment:null,ctx:null,props:h,update:e,not_equal:u,bound:n(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(s.context||(m?m.$$.context:[])),callbacks:n(),dirty:d,skip_bound:!1,root:s.target||m.$$.root};f&&f(b.root);let v=!1;if(b.ctx=a?a(i,s.props||{},((e,t,...n)=>{const o=n.length?n[0]:t;return b.ctx&&u(b.ctx[e],b.ctx[e]=o)&&(!b.skip_bound&&b.bound[e]&&b.bound[e](o),v&&R(i,e)),t})):[],b.update(),v=!0,o(b.before_update),b.fragment=!!l&&l(b.ctx),s.target){if(s.hydrate){const e=function(e){return Array.from(e.childNodes)}(s.target);b.fragment&&b.fragment.l(e),e.forEach(c)}else b.fragment&&b.fragment.c();s.intro&&((y=i.$$.fragment)&&y.i&&(k.delete(y),y.i(w))),function(e,n,i,s){const{fragment:c,on_mount:a,on_destroy:l,after_update:u}=e.$$;c&&c.m(n,i),s||_((()=>{const n=a.map(t).filter(r);l?l.push(...n):o(n),e.$$.on_mount=[]})),u.forEach(_)}(i,s.target,s.anchor,s.customElement),S()}var y,w;p(m)}const L="application/font-woff",A="image/jpeg",N={woff:L,woff2:L,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:A,jpeg:A,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml"};function M(e){const t=function(e){const t=/\.([^./]*?)$/g.exec(e);return t?t[1]:""}(e).toLowerCase();return N[t]||""}function U(e){return-1!==e.search(/^(data:)/)}function V(e,t){return`data:${t};base64,${e}`}const I=(()=>{let e=0;return()=>(e+=1,`u${`0000${(Math.random()*36**4<<0).toString(36)}`.slice(-4)}${e}`)})();function O(e){const t=[];for(let n=0,o=e.length;n<o;n+=1)t.push(e[n]);return t}function H(e,t){const n=window.getComputedStyle(e).getPropertyValue(t);return parseFloat(n.replace("px",""))}function D(e){return new Promise(((t,n)=>{const o=new Image;o.onload=()=>t(o),o.onerror=n,o.crossOrigin="anonymous",o.decoding="sync",o.src=e}))}async function j(e,t,n){const o="http://www.w3.org/2000/svg",r=document.createElementNS(o,"svg"),i=document.createElementNS(o,"foreignObject");return r.setAttribute("width",`${t}`),r.setAttribute("height",`${n}`),r.setAttribute("viewBox",`0 0 ${t} ${n}`),i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("x","0"),i.setAttribute("y","0"),i.setAttribute("externalResourcesRequired","true"),r.appendChild(i),i.appendChild(e),async function(e){return Promise.resolve().then((()=>(new XMLSerializer).serializeToString(e))).then(encodeURIComponent).then((e=>`data:image/svg+xml;charset=utf-8,${e}`))}(r)}const B={};function F(e,t){const n=function(e,t){let n=e.replace(/\?.*/,"");return t&&(n=e),/ttf|otf|eot|woff2?/i.test(n)&&(n=n.replace(/.*\//,"")),n}(e,t.includeQueryParams);if(null!=B[n])return B[n];t.cacheBust&&(e+=(/\?/.test(e)?"&":"?")+(new Date).getTime());const o=window.fetch(e,t.fetchRequestInit).then((e=>e.blob().then((t=>({blob:t,contentType:e.headers.get("Content-Type")||""}))))).then((({blob:e,contentType:t})=>new Promise(((n,o)=>{const r=new FileReader;r.onloadend=()=>n({contentType:t,blob:r.result}),r.onerror=o,r.readAsDataURL(e)})))).then((({blob:e,contentType:t})=>{return{contentType:t,blob:(n=e,n.split(/,/)[1])};var n})).catch((n=>{let o="";if(t.imagePlaceholder){const e=t.imagePlaceholder.split(/,/);e&&e[1]&&(o=e[1])}let r=`Failed to fetch resource: ${e}`;return n&&(r="string"==typeof n?n:n.message),r&&console.error(r),{blob:o,contentType:""}}));return B[n]=o,o}function z(e,t,n){const o=`.${e}:${t}`,r=n.cssText?function(e){const t=e.getPropertyValue("content");return`${e.cssText} content: '${t.replace(/'|"/g,"")}';`}(n):function(e){return O(e).map((t=>`${t}: ${e.getPropertyValue(t)}${e.getPropertyPriority(t)?" !important":""};`)).join(" ")}(n);return document.createTextNode(`${o}{${r}}`)}function W(e,t,n){const o=window.getComputedStyle(e,n),r=o.getPropertyValue("content");if(""===r||"none"===r)return;const i=I();try{t.className=`${t.className} ${i}`}catch(e){return}const s=document.createElement("style");s.appendChild(z(i,n,o)),t.appendChild(s)}async function q(e,t){return e instanceof HTMLCanvasElement?async function(e){const t=e.toDataURL();return"data:,"===t?Promise.resolve(e.cloneNode(!1)):D(t)}(e):e instanceof HTMLVideoElement&&e.poster?async function(e,t){return Promise.resolve(e.poster).then((e=>F(e,t))).then((t=>V(t.blob,M(e.poster)||t.contentType))).then((e=>D(e)))}(e,t):Promise.resolve(e.cloneNode(!1))}async function G(e,t){return t instanceof Element?Promise.resolve().then((()=>function(e,t){const n=window.getComputedStyle(e),o=t.style;o&&(n.cssText?(o.cssText=n.cssText,o.transformOrigin=n.transformOrigin):O(n).forEach((e=>{let t=n.getPropertyValue(e);if("font-size"===e&&t.endsWith("px")){const e=Math.floor(parseFloat(t.substring(0,t.length-2)))-.1;t=`${e}px`}o.setProperty(e,t,n.getPropertyPriority(e))})))}(e,t))).then((()=>function(e,t){W(e,t,":before"),W(e,t,":after")}(e,t))).then((()=>function(e,t){e instanceof HTMLTextAreaElement&&(t.innerHTML=e.value),e instanceof HTMLInputElement&&t.setAttribute("value",e.value)}(e,t))).then((()=>function(e,t){if(e instanceof HTMLSelectElement){const n=t,o=Array.from(n.children).find((t=>e.value===t.getAttribute("value")));o&&o.setAttribute("selected","")}}(e,t))).then((()=>t)):Promise.resolve(t)}async function X(e,t,n){return n||!t.filter||t.filter(e)?Promise.resolve(e).then((e=>q(e,t))).then((n=>async function(e,t,n){var o;const r=null!=(i=e).tagName&&"SLOT"===i.tagName.toUpperCase()&&e.assignedNodes?O(e.assignedNodes()):O((null!==(o=e.shadowRoot)&&void 0!==o?o:e).childNodes);var i;return 0===r.length||e instanceof HTMLVideoElement?Promise.resolve(t):r.reduce(((e,o)=>e.then((()=>X(o,n))).then((e=>{e&&t.appendChild(e)}))),Promise.resolve()).then((()=>t))}(e,n,t))).then((t=>G(e,t))):Promise.resolve(null)}const K=/url\((['"]?)([^'"]+?)\1\)/g,Q=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,Y=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function Z(e){const t=[];return e.replace(K,((e,n,o)=>(t.push(o),e))),t.filter((e=>!U(e)))}function J(e,t,n,o,r){const i=n?function(e,t){if(e.match(/^[a-z]+:\/\//i))return e;if(e.match(/^\/\//))return window.location.protocol+e;if(e.match(/^[a-z]+:/i))return e;const n=document.implementation.createHTMLDocument(),o=n.createElement("base"),r=n.createElement("a");return n.head.appendChild(o),n.body.appendChild(r),t&&(o.href=t),r.href=e,r.href}(t,n):t;return Promise.resolve(i).then((e=>r?r(e):F(e,o))).then((e=>"string"==typeof e?V(e,M(t)):V(e.blob,M(t)||e.contentType))).then((n=>e.replace(function(e){const t=e.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1");return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`,"g")}(t),`$1${n}$3`))).then((e=>e),(()=>i))}function ee(e){return-1!==e.search(K)}async function te(e,t,n){if(!ee(e))return Promise.resolve(e);const o=function(e,{preferredFontFormat:t}){return t?e.replace(Y,(e=>{for(;;){const[n,,o]=Q.exec(e)||[];if(!o)return"";if(o===t)return`src: ${n};`}})):e}(e,n);return Promise.resolve(o).then(Z).then((e=>e.reduce(((e,o)=>e.then((e=>J(e,o,t,n)))),Promise.resolve(o))))}async function ne(e,t){return e instanceof Element?Promise.resolve(e).then((e=>async function(e,t){var n;const o=null===(n=e.style)||void 0===n?void 0:n.getPropertyValue("background");return o?Promise.resolve(o).then((e=>te(e,null,t))).then((t=>(e.style.setProperty("background",t,e.style.getPropertyPriority("background")),e))):Promise.resolve(e)}(e,t))).then((e=>async function(e,t){if((!(e instanceof HTMLImageElement)||U(e.src))&&(!(e instanceof SVGImageElement)||U(e.href.baseVal)))return Promise.resolve(e);const n=e instanceof HTMLImageElement?e.src:e.href.baseVal;return Promise.resolve(n).then((e=>F(e,t))).then((e=>V(e.blob,M(n)||e.contentType))).then((t=>new Promise(((n,o)=>{e.onload=n,e.onerror=o,e instanceof HTMLImageElement?(e.srcset="",e.src=t):e.href.baseVal=t})))).then((()=>e),(()=>e))}(e,t))).then((e=>async function(e,t){const n=O(e.childNodes).map((e=>ne(e,t)));return Promise.all(n).then((()=>e))}(e,t))):Promise.resolve(e)}const oe={};function re(e){const t=oe[e];if(null!=t)return t;const n=window.fetch(e).then((t=>({url:e,cssText:t.text()})));return oe[e]=n,n}async function ie(e,t){return e.cssText.then((n=>{let o=n;const r=/url\(["']?([^"')]+)["']?\)/g,i=(o.match(/url\([^)]+\)/g)||[]).map((n=>{let i=n.replace(r,"$1");return i.startsWith("https://")||(i=new URL(i,e.url).href),window.fetch(i,t.fetchRequestInit).then((e=>e.blob())).then((e=>new Promise(((t,r)=>{const i=new FileReader;i.onloadend=()=>{o=o.replace(n,`url(${i.result})`),t([n,i.result])},i.onerror=r,i.readAsDataURL(e)}))))}));return Promise.all(i).then((()=>o))}))}function se(e){if(null==e)return[];const t=[];let n=e.replace(/(\/\*[\s\S]*?\*\/)/gi,"");const o=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");for(;;){const e=o.exec(n);if(null===e)break;t.push(e[0])}n=n.replace(o,"");const r=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,i=new RegExp("((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})","gi");for(;;){let e=r.exec(n);if(null===e){if(e=i.exec(n),null===e)break;r.lastIndex=i.lastIndex}else i.lastIndex=r.lastIndex;t.push(e[0])}return t}function ce(e){return e.filter((e=>e.type===CSSRule.FONT_FACE_RULE)).filter((e=>ee(e.style.getPropertyValue("src"))))}async function ae(e,t){return new Promise(((t,n)=>{null==e.ownerDocument&&n(new Error("Provided element is not within a Document")),t(O(e.ownerDocument.styleSheets))})).then((e=>async function(e,t){const n=[],o=[];return e.forEach((n=>{if("cssRules"in n)try{O(n.cssRules||[]).forEach(((e,r)=>{if(e.type===CSSRule.IMPORT_RULE){let i=r+1;const s=re(e.href).then((e=>e?ie(e,t):"")).then((e=>se(e).forEach((e=>{try{n.insertRule(e,e.startsWith("@import")?i+=1:n.cssRules.length)}catch(t){console.error("Error inserting rule from remote css",{rule:e,error:t})}})))).catch((e=>{console.error("Error loading remote css",e.toString())}));o.push(s)}}))}catch(r){const i=e.find((e=>null==e.href))||document.styleSheets[0];null!=n.href&&o.push(re(n.href).then((e=>e?ie(e,t):"")).then((e=>se(e).forEach((e=>{i.insertRule(e,n.cssRules.length)})))).catch((e=>{console.error("Error loading remote stylesheet",e.toString())}))),console.error("Error inlining remote css file",r.toString())}})),Promise.all(o).then((()=>(e.forEach((e=>{if("cssRules"in e)try{O(e.cssRules||[]).forEach((e=>{n.push(e)}))}catch(t){console.error(`Error while reading CSS rules from ${e.href}`,t.toString())}})),n)))}(e,t))).then(ce)}async function le(e,t){return(null!=t.fontEmbedCSS?Promise.resolve(t.fontEmbedCSS):async function(e,t){return ae(e,t).then((e=>Promise.all(e.map((e=>{const n=e.parentStyleSheet?e.parentStyleSheet.href:null;return te(e.cssText,n,t)}))))).then((e=>e.join("\n")))}(e,t)).then((t=>{const n=document.createElement("style"),o=document.createTextNode(t);return n.appendChild(o),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n),e}))}function ue(e,t={}){const n=t.width||function(e){const t=H(e,"border-left-width"),n=H(e,"border-right-width");return e.clientWidth+t+n}(e),o=t.height||function(e){const t=H(e,"border-top-width"),n=H(e,"border-bottom-width");return e.clientHeight+t+n}(e);return{width:n,height:o}}async function he(e,t={}){const{width:n,height:o}=ue(e,t);return Promise.resolve(e).then((e=>X(e,t,!0))).then((e=>le(e,t))).then((e=>ne(e,t))).then((e=>function(e,t){const{style:n}=e;t.backgroundColor&&(n.backgroundColor=t.backgroundColor),t.width&&(n.width=`${t.width}px`),t.height&&(n.height=`${t.height}px`);const o=t.style;return null!=o&&Object.keys(o).forEach((e=>{n[e]=o[e]})),e}(e,t))).then((e=>j(e,n,o)))}const fe=16384;async function de(e,t={}){return he(e,t).then(D).then((n=>{const o=document.createElement("canvas"),r=o.getContext("2d"),i=t.pixelRatio||function(){let e,t;try{t=process}catch(e){}const n=t&&t.env?t.env.devicePixelRatio:null;return n&&(e=parseInt(n,10),Number.isNaN(e)&&(e=1)),e||window.devicePixelRatio||1}(),{width:s,height:c}=ue(e,t),a=t.canvasWidth||s,l=t.canvasHeight||c;return o.width=a*i,o.height=l*i,t.skipAutoScale||function(e){(e.width>fe||e.height>fe)&&(e.width>fe&&e.height>fe?e.width>e.height?(e.height*=fe/e.width,e.width=fe):(e.width*=fe/e.height,e.height=fe):e.width>fe?(e.height*=fe/e.width,e.width=fe):(e.width*=fe/e.height,e.height=fe))}(o),o.style.width=`${a}`,o.style.height=`${l}`,t.backgroundColor&&(r.fillStyle=t.backgroundColor,r.fillRect(0,0,o.width,o.height)),r.drawImage(n,0,0,o.width,o.height),o}))}"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self&&self;var ge,pe,me=(ge=function(e,t){e.exports=function e(t,n,o){var r,i,s=window,c="application/octet-stream",a=o||c,l=t,u=!n&&!o&&l,h=document.createElement("a"),f=function(e){return String(e)},d=s.Blob||s.MozBlob||s.WebKitBlob||f,g=n||"download";if(d=d.call?d.bind(s):Blob,"true"===String(this)&&(a=(l=[l,a])[0],l=l[1]),u&&u.length<2048&&(g=u.split("/").pop().split("?")[0],h.href=u,-1!==h.href.indexOf(u))){var p=new XMLHttpRequest;return p.open("GET",u,!0),p.responseType="blob",p.onload=function(t){e(t.target.response,g,c)},setTimeout((function(){p.send()}),0),p}if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(l)){if(!(l.length>2096103.424&&d!==f))return navigator.msSaveBlob?navigator.msSaveBlob(y(l),g):w(l);a=(l=y(l)).type||c}else if(/([\x80-\xff])/.test(l)){for(var m=0,b=new Uint8Array(l.length),v=b.length;m<v;++m)b[m]=l.charCodeAt(m);l=new d([b],{type:a})}function y(e){for(var t=e.split(/[:;,]/),n=t[1],o=("base64"==t[2]?atob:decodeURIComponent)(t.pop()),r=o.length,i=0,s=new Uint8Array(r);i<r;++i)s[i]=o.charCodeAt(i);return new d([s],{type:n})}function w(e,t){if("download"in h)return h.href=e,h.setAttribute("download",g),h.className="download-js-link",h.innerHTML="downloading...",h.style.display="none",document.body.appendChild(h),setTimeout((function(){h.click(),document.body.removeChild(h),!0===t&&setTimeout((function(){s.URL.revokeObjectURL(h.href)}),250)}),66),!0;if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent))return/^data:/.test(e)&&(e="data:"+e.replace(/^data:([\w\/\-\+]+)/,c)),window.open(e)||confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")&&(location.href=e),!0;var n=document.createElement("iframe");document.body.appendChild(n),!t&&/^data:/.test(e)&&(e="data:"+e.replace(/^data:([\w\/\-\+]+)/,c)),n.src=e,setTimeout((function(){document.body.removeChild(n)}),333)}if(r=l instanceof d?l:new d([l],{type:a}),navigator.msSaveBlob)return navigator.msSaveBlob(r,g);if(s.URL)w(s.URL.createObjectURL(r),!0);else{if("string"==typeof r||r.constructor===f)try{return w("data:"+a+";base64,"+s.btoa(r))}catch(e){return w("data:"+a+","+encodeURIComponent(r))}(i=new FileReader).onload=function(e){w(this.result)},i.readAsDataURL(r)}return!0}},ge(pe={exports:{}},pe.exports),pe.exports);function be(t){let n,r,i,g,p,m,b,v,y,w,$,x,_,P,E,S,T,k,R,C,L,A,N,M,U,V,I,O,H,D,j,B,F,z,W,q,G,X,K,Q,Y,Z,J,ee,te,ne,oe,re,ie,se,ce=t[2].title+"",ae=t[2].language+"",le=t[2].vehicle+"",ue=t[2].motobike+"",he=t[2].auto+"",fe=t[2].generate+"",de=t[2].download+"",ge=t[2].footNote+"";return{c(){n=a("main"),r=a("h1"),i=l(ce),g=u(),p=a("div"),m=a("label"),b=a("b"),v=l(ae),y=u(),w=a("label"),$=a("input"),x=l("\n      Tiếng Việt"),_=u(),P=a("label"),E=a("input"),S=l("\n      English"),T=u(),k=a("div"),R=a("label"),C=a("b"),L=l(le),A=u(),N=a("label"),M=a("input"),U=u(),V=l(ue),I=u(),O=a("label"),H=a("input"),D=u(),j=l(he),B=u(),F=a("div"),z=a("div"),W=a("p"),q=l(t[4]),G=a("br"),X=l(t[5]),K=u(),Q=a("p"),Y=a("button"),Z=l(fe),J=u(),ee=a("button"),te=l(de),ne=u(),oe=a("p"),re=l(ge),f(m,"for",""),f($,"id","language-vi"),f($,"type","radio"),$.__value="vi",$.value=$.__value,t[10][0].push($),f(w,"for","language-vi"),f(E,"id","language-en"),f(E,"type","radio"),E.__value="en",E.value=E.__value,t[10][0].push(E),f(P,"for","language-en"),f(p,"id","language-options"),f(p,"align","center"),f(R,"for",""),f(M,"id","vehicle-motobike"),f(M,"type","radio"),M.__value="motobike",M.value=M.__value,t[10][1].push(M),f(N,"for","vehicle-motobike"),f(H,"id","vehicle-auto"),f(H,"type","radio"),H.__value="auto",H.value=H.__value,t[10][1].push(H),f(O,"for","vehicle-auto"),f(k,"id","vehicle-options"),f(k,"align","center"),f(k,"class","mt-1 svelte-179s3ia"),f(W,"class","svelte-179s3ia"),f(z,"id","plate"),f(z,"class","plate svelte-179s3ia"),f(F,"class","plate-container mt-1 svelte-179s3ia"),f(Y,"class","svelte-179s3ia"),f(ee,"class","svelte-179s3ia"),f(Q,"align","center"),f(Q,"class","mt-1 svelte-179s3ia"),f(oe,"class","mt-1 svelte-179s3ia"),f(n,"class","svelte-179s3ia")},m(e,o){!function(e,t,n){e.insertBefore(t,n||null)}(e,n,o),s(n,r),s(r,i),s(n,g),s(n,p),s(p,m),s(m,b),s(b,v),s(p,y),s(p,w),s(w,$),$.checked=$.__value===t[1],s(w,x),s(p,_),s(p,P),s(P,E),E.checked=E.__value===t[1],s(P,S),s(n,T),s(n,k),s(k,R),s(R,C),s(C,L),s(k,A),s(k,N),s(N,M),M.checked=M.__value===t[0],s(N,U),s(N,V),s(k,I),s(k,O),s(O,H),H.checked=H.__value===t[0],s(O,D),s(O,j),s(n,B),s(n,F),s(F,z),s(z,W),s(W,q),s(W,G),s(W,X),t[14](z),s(n,K),s(n,Q),s(Q,Y),s(Y,Z),s(Q,J),s(Q,ee),s(ee,te),s(n,ne),s(n,oe),s(oe,re),ie||(se=[h($,"change",t[9]),h($,"change",t[8]),h(E,"change",t[11]),h(E,"change",t[8]),h(M,"change",t[12]),h(M,"change",t[6]),h(H,"change",t[13]),h(H,"change",t[6]),h(Y,"click",t[6]),h(ee,"click",t[7])],ie=!0)},p(e,[t]){4&t&&ce!==(ce=e[2].title+"")&&d(i,ce),4&t&&ae!==(ae=e[2].language+"")&&d(v,ae),2&t&&($.checked=$.__value===e[1]),2&t&&(E.checked=E.__value===e[1]),4&t&&le!==(le=e[2].vehicle+"")&&d(L,le),1&t&&(M.checked=M.__value===e[0]),4&t&&ue!==(ue=e[2].motobike+"")&&d(V,ue),1&t&&(H.checked=H.__value===e[0]),4&t&&he!==(he=e[2].auto+"")&&d(j,he),16&t&&d(q,e[4]),32&t&&d(X,e[5]),4&t&&fe!==(fe=e[2].generate+"")&&d(Z,fe),4&t&&de!==(de=e[2].download+"")&&d(te,de),4&t&&ge!==(ge=e[2].footNote+"")&&d(re,ge)},i:e,o:e,d(e){e&&c(n),t[10][0].splice(t[10][0].indexOf($),1),t[10][0].splice(t[10][0].indexOf(E),1),t[10][1].splice(t[10][1].indexOf(M),1),t[10][1].splice(t[10][1].indexOf(H),1),t[14](null),ie=!1,o(se)}}}const ve="ABCDEFGHKLMNPSTUVXYZ";function ye(e=0,t=9){return Math.floor(Math.random()*(t-e))+e}function we(e,t,n){const o={en:{title:"Vietnamese Vehicle Plate Number",language:"Language",vehicle:"Vehicle",motobike:"Motobike",auto:"Auto",generate:"Generate",download:"Download",footNote:"* This generator is for testing purpose only."},vi:{title:"Bảng số xe Việt Nam",language:"Ngôn ngữ",vehicle:"Phương tiện",motobike:"Mô tô & xe máy",auto:"Ô tô",generate:"Tạo ngẫu nhiên",download:"Tải về",footNote:"* Tạo bảng số xe ngẫu nhiên cho mục đích kiểm thử."}};let r,i="motobike",s="vi",c=o[s];const a=[50,51,52,53,54,55,56,57,58,59];let l="",u="",h="";function f(){h=function(){const e=a[ye(0,a.length)],t=ve[ye(0,ve.length)];return n(4,l=`${e}-${t}${ye()}`),"auto"===i&&n(4,l=`${e}${t}`),n(5,u=`${ye()}${ye()}${ye()}.${ye()}${ye()}`),`${l} ${u}`}()}function d(){r&&async function(e,t={}){return de(e,t).then((e=>e.toDataURL()))}(r).then((function(e){console.log("Download plate number",h),me(e,`${h}.png`)}))}function g(){n(2,c=o[s])}m((()=>{const e=new URLSearchParams(window.location.search);e.get("lang")&&(n(1,s=e.get("lang")),g()),e.get("vehicle")&&n(0,i=e.get("vehicle")),f(),"download"===e.get("action")&&d()}));return[i,s,c,r,l,u,f,d,g,function(){s=this.__value,n(1,s)},[[],[]],function(){s=this.__value,n(1,s)},function(){i=this.__value,n(0,i)},function(){i=this.__value,n(0,i)},function(e){v[e?"unshift":"push"]((()=>{r=e,n(3,r)}))}]}return new class extends class{$destroy(){!function(e,t){const n=e.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}(this,1),this.$destroy=e}$on(e,t){const n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),()=>{const e=n.indexOf(t);-1!==e&&n.splice(e,1)}}$set(e){var t;this.$$set&&(t=e,0!==Object.keys(t).length)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}{constructor(e){super(),C(this,e,we,be,i,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
