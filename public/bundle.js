var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const WOFF = 'application/font-woff';
    const JPEG = 'image/jpeg';
    const mimes = {
        woff: WOFF,
        woff2: WOFF,
        ttf: 'application/font-truetype',
        eot: 'application/vnd.ms-fontobject',
        png: 'image/png',
        jpg: JPEG,
        jpeg: JPEG,
        gif: 'image/gif',
        tiff: 'image/tiff',
        svg: 'image/svg+xml',
    };
    function getExtension(url) {
        const match = /\.([^./]*?)$/g.exec(url);
        return match ? match[1] : '';
    }
    function getMimeType(url) {
        const extension = getExtension(url).toLowerCase();
        return mimes[extension] || '';
    }
    function resolveUrl(url, baseUrl) {
        // url is absolute already
        if (url.match(/^[a-z]+:\/\//i)) {
            return url;
        }
        // url is absolute already, without protocol
        if (url.match(/^\/\//)) {
            return window.location.protocol + url;
        }
        // dataURI, mailto:, tel:, etc.
        if (url.match(/^[a-z]+:/i)) {
            return url;
        }
        const doc = document.implementation.createHTMLDocument();
        const base = doc.createElement('base');
        const a = doc.createElement('a');
        doc.head.appendChild(base);
        doc.body.appendChild(a);
        if (baseUrl) {
            base.href = baseUrl;
        }
        a.href = url;
        return a.href;
    }
    function isDataUrl(url) {
        return url.search(/^(data:)/) !== -1;
    }
    function makeDataUrl(content, mimeType) {
        return `data:${mimeType};base64,${content}`;
    }
    function parseDataUrlContent(dataURL) {
        return dataURL.split(/,/)[1];
    }
    const uuid = (() => {
        // generate uuid for className of pseudo elements.
        // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
        let counter = 0;
        // ref: http://stackoverflow.com/a/6248722/2519373
        const random = () => 
        // eslint-disable-next-line no-bitwise
        `0000${((Math.random() * 36 ** 4) << 0).toString(36)}`.slice(-4);
        return () => {
            counter += 1;
            return `u${random()}${counter}`;
        };
    })();
    function toArray(arrayLike) {
        const arr = [];
        for (let i = 0, l = arrayLike.length; i < l; i += 1) {
            arr.push(arrayLike[i]);
        }
        return arr;
    }
    function px(node, styleProperty) {
        const val = window.getComputedStyle(node).getPropertyValue(styleProperty);
        return parseFloat(val.replace('px', ''));
    }
    function getNodeWidth(node) {
        const leftBorder = px(node, 'border-left-width');
        const rightBorder = px(node, 'border-right-width');
        return node.clientWidth + leftBorder + rightBorder;
    }
    function getNodeHeight(node) {
        const topBorder = px(node, 'border-top-width');
        const bottomBorder = px(node, 'border-bottom-width');
        return node.clientHeight + topBorder + bottomBorder;
    }
    function getPixelRatio() {
        let ratio;
        let FINAL_PROCESS;
        try {
            FINAL_PROCESS = process;
        }
        catch (e) {
            // pass
        }
        const val = FINAL_PROCESS && FINAL_PROCESS.env
            ? FINAL_PROCESS.env.devicePixelRatio
            : null;
        if (val) {
            ratio = parseInt(val, 10);
            if (Number.isNaN(ratio)) {
                ratio = 1;
            }
        }
        return ratio || window.devicePixelRatio || 1;
    }
    function createImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.decoding = 'sync';
            img.src = url;
        });
    }
    async function svgToDataURL(svg) {
        return Promise.resolve()
            .then(() => new XMLSerializer().serializeToString(svg))
            .then(encodeURIComponent)
            .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
    }
    async function nodeToDataURL(node, width, height) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        const foreignObject = document.createElementNS(xmlns, 'foreignObject');
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        foreignObject.setAttribute('width', '100%');
        foreignObject.setAttribute('height', '100%');
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        foreignObject.setAttribute('externalResourcesRequired', 'true');
        svg.appendChild(foreignObject);
        foreignObject.appendChild(node);
        return svgToDataURL(svg);
    }

    const cache = {};
    function getCacheKey(url, includeQueryParams) {
        let key = url.replace(/\?.*/, '');
        if (includeQueryParams) {
            key = url;
        }
        // font resource
        if (/ttf|otf|eot|woff2?/i.test(key)) {
            key = key.replace(/.*\//, '');
        }
        return key;
    }
    function getBlobFromURL(url, options) {
        const cacheKey = getCacheKey(url, options.includeQueryParams);
        if (cache[cacheKey] != null) {
            return cache[cacheKey];
        }
        // cache bypass, we don't have CORS issues with cached images
        // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
        if (options.cacheBust) {
            // eslint-disable-next-line no-param-reassign
            url += (/\?/.test(url) ? '&' : '?') + new Date().getTime();
        }
        const failed = (reason) => {
            let placeholder = '';
            if (options.imagePlaceholder) {
                const parts = options.imagePlaceholder.split(/,/);
                if (parts && parts[1]) {
                    placeholder = parts[1];
                }
            }
            let msg = `Failed to fetch resource: ${url}`;
            if (reason) {
                msg = typeof reason === 'string' ? reason : reason.message;
            }
            if (msg) {
                console.error(msg);
            }
            return {
                blob: placeholder,
                contentType: '',
            };
        };
        const deferred = window
            .fetch(url, options.fetchRequestInit)
            .then((res) => 
        // eslint-disable-next-line promise/no-nesting
        res.blob().then((blob) => ({
            blob,
            contentType: res.headers.get('Content-Type') || '',
        })))
            .then(({ blob, contentType }) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({
                contentType,
                blob: reader.result,
            });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }))
            .then(({ blob, contentType }) => ({
            contentType,
            blob: parseDataUrlContent(blob),
        }))
            // on failed
            .catch(failed);
        // cache result
        cache[cacheKey] = deferred;
        return deferred;
    }

    function formatCSSText(style) {
        const content = style.getPropertyValue('content');
        return `${style.cssText} content: '${content.replace(/'|"/g, '')}';`;
    }
    function formatCSSProperties(style) {
        return toArray(style)
            .map((name) => {
            const value = style.getPropertyValue(name);
            const priority = style.getPropertyPriority(name);
            return `${name}: ${value}${priority ? ' !important' : ''};`;
        })
            .join(' ');
    }
    function getPseudoElementStyle(className, pseudo, style) {
        const selector = `.${className}:${pseudo}`;
        const cssText = style.cssText
            ? formatCSSText(style)
            : formatCSSProperties(style);
        return document.createTextNode(`${selector}{${cssText}}`);
    }
    function clonePseudoElement(nativeNode, clonedNode, pseudo) {
        const style = window.getComputedStyle(nativeNode, pseudo);
        const content = style.getPropertyValue('content');
        if (content === '' || content === 'none') {
            return;
        }
        const className = uuid();
        try {
            clonedNode.className = `${clonedNode.className} ${className}`;
        }
        catch (err) {
            return;
        }
        const styleElement = document.createElement('style');
        styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
        clonedNode.appendChild(styleElement);
    }
    function clonePseudoElements(nativeNode, clonedNode) {
        clonePseudoElement(nativeNode, clonedNode, ':before');
        clonePseudoElement(nativeNode, clonedNode, ':after');
    }

    async function cloneCanvasElement(node) {
        const dataURL = node.toDataURL();
        if (dataURL === 'data:,') {
            return Promise.resolve(node.cloneNode(false));
        }
        return createImage(dataURL);
    }
    async function cloneVideoElement(node, options) {
        return Promise.resolve(node.poster)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(node.poster) || data.contentType))
            .then((dataURL) => createImage(dataURL));
    }
    async function cloneSingleNode(node, options) {
        if (node instanceof HTMLCanvasElement) {
            return cloneCanvasElement(node);
        }
        if (node instanceof HTMLVideoElement && node.poster) {
            return cloneVideoElement(node, options);
        }
        return Promise.resolve(node.cloneNode(false));
    }
    const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
    async function cloneChildren(nativeNode, clonedNode, options) {
        var _a;
        const children = isSlotElement(nativeNode) && nativeNode.assignedNodes
            ? toArray(nativeNode.assignedNodes())
            : toArray(((_a = nativeNode.shadowRoot) !== null && _a !== void 0 ? _a : nativeNode).childNodes);
        if (children.length === 0 || nativeNode instanceof HTMLVideoElement) {
            return Promise.resolve(clonedNode);
        }
        return children
            .reduce((deferred, child) => deferred
            // eslint-disable-next-line no-use-before-define
            .then(() => cloneNode(child, options))
            .then((clonedChild) => {
            // eslint-disable-next-line promise/always-return
            if (clonedChild) {
                clonedNode.appendChild(clonedChild);
            }
        }), Promise.resolve())
            .then(() => clonedNode);
    }
    function cloneCSSStyle(nativeNode, clonedNode) {
        const source = window.getComputedStyle(nativeNode);
        const target = clonedNode.style;
        if (!target) {
            return;
        }
        if (source.cssText) {
            target.cssText = source.cssText;
            target.transformOrigin = source.transformOrigin;
        }
        else {
            toArray(source).forEach((name) => {
                let value = source.getPropertyValue(name);
                if (name === 'font-size' && value.endsWith('px')) {
                    const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
                    value = `${reducedFont}px`;
                }
                target.setProperty(name, value, source.getPropertyPriority(name));
            });
        }
    }
    function cloneInputValue(nativeNode, clonedNode) {
        if (nativeNode instanceof HTMLTextAreaElement) {
            clonedNode.innerHTML = nativeNode.value;
        }
        if (nativeNode instanceof HTMLInputElement) {
            clonedNode.setAttribute('value', nativeNode.value);
        }
    }
    function cloneSelectValue(nativeNode, clonedNode) {
        if (nativeNode instanceof HTMLSelectElement) {
            const clonedSelect = clonedNode;
            const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute('value'));
            if (selectedOption) {
                selectedOption.setAttribute('selected', '');
            }
        }
    }
    async function decorate(nativeNode, clonedNode) {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve()
            .then(() => cloneCSSStyle(nativeNode, clonedNode))
            .then(() => clonePseudoElements(nativeNode, clonedNode))
            .then(() => cloneInputValue(nativeNode, clonedNode))
            .then(() => cloneSelectValue(nativeNode, clonedNode))
            .then(() => clonedNode);
    }
    async function cloneNode(node, options, isRoot) {
        if (!isRoot && options.filter && !options.filter(node)) {
            return Promise.resolve(null);
        }
        return Promise.resolve(node)
            .then((clonedNode) => cloneSingleNode(clonedNode, options))
            .then((clonedNode) => cloneChildren(node, clonedNode, options))
            .then((clonedNode) => decorate(node, clonedNode));
    }

    const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
    const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
    const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
    function toRegex(url) {
        // eslint-disable-next-line no-useless-escape
        const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
        return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, 'g');
    }
    function parseURLs(cssText) {
        const result = [];
        cssText.replace(URL_REGEX, (raw, quotation, url) => {
            result.push(url);
            return raw;
        });
        return result.filter((url) => !isDataUrl(url));
    }
    function embed(cssText, resourceURL, baseURL, options, get) {
        const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
        return Promise.resolve(resolvedURL)
            .then((url) => get ? get(url) : getBlobFromURL(url, options))
            .then((data) => {
            if (typeof data === 'string') {
                return makeDataUrl(data, getMimeType(resourceURL));
            }
            return makeDataUrl(data.blob, getMimeType(resourceURL) || data.contentType);
        })
            .then((dataURL) => cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`))
            .then((content) => content, () => resolvedURL);
    }
    function filterPreferredFontFormat(str, { preferredFontFormat }) {
        return !preferredFontFormat
            ? str
            : str.replace(FONT_SRC_REGEX, (match) => {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
                    if (!format) {
                        return '';
                    }
                    if (format === preferredFontFormat) {
                        return `src: ${src};`;
                    }
                }
            });
    }
    function shouldEmbed(url) {
        return url.search(URL_REGEX) !== -1;
    }
    async function embedResources(cssText, baseUrl, options) {
        if (!shouldEmbed(cssText)) {
            return Promise.resolve(cssText);
        }
        const filteredCSSText = filterPreferredFontFormat(cssText, options);
        return Promise.resolve(filteredCSSText)
            .then(parseURLs)
            .then((urls) => urls.reduce((deferred, url) => 
        // eslint-disable-next-line promise/no-nesting
        deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText)));
    }

    async function embedBackground(clonedNode, options) {
        var _a;
        const background = (_a = clonedNode.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue('background');
        if (!background) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(background)
            .then((cssString) => embedResources(cssString, null, options))
            .then((cssString) => {
            clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
            return clonedNode;
        });
    }
    async function embedImageNode(clonedNode, options) {
        if (!(clonedNode instanceof HTMLImageElement && !isDataUrl(clonedNode.src)) &&
            !(clonedNode instanceof SVGImageElement &&
                !isDataUrl(clonedNode.href.baseVal))) {
            return Promise.resolve(clonedNode);
        }
        const src = clonedNode instanceof HTMLImageElement
            ? clonedNode.src
            : clonedNode.href.baseVal;
        return Promise.resolve(src)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(src) || data.contentType))
            .then((dataURL) => new Promise((resolve, reject) => {
            clonedNode.onload = resolve;
            clonedNode.onerror = reject;
            if (clonedNode instanceof HTMLImageElement) {
                clonedNode.srcset = '';
                clonedNode.src = dataURL;
            }
            else {
                clonedNode.href.baseVal = dataURL;
            }
        }))
            .then(() => clonedNode, () => clonedNode);
    }
    async function embedChildren(clonedNode, options) {
        const children = toArray(clonedNode.childNodes);
        // eslint-disable-next-line no-use-before-define
        const deferreds = children.map((child) => embedImages(child, options));
        return Promise.all(deferreds).then(() => clonedNode);
    }
    async function embedImages(clonedNode, options) {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(clonedNode)
            .then((node) => embedBackground(node, options))
            .then((node) => embedImageNode(node, options))
            .then((node) => embedChildren(node, options));
    }

    function applyStyleWithOptions(node, options) {
        const { style } = node;
        if (options.backgroundColor) {
            style.backgroundColor = options.backgroundColor;
        }
        if (options.width) {
            style.width = `${options.width}px`;
        }
        if (options.height) {
            style.height = `${options.height}px`;
        }
        const manual = options.style;
        if (manual != null) {
            Object.keys(manual).forEach((key) => {
                style[key] = manual[key];
            });
        }
        return node;
    }

    const cssFetchCache = {};
    function fetchCSS(url) {
        const cache = cssFetchCache[url];
        if (cache != null) {
            return cache;
        }
        const deferred = window.fetch(url).then((res) => ({
            url,
            cssText: res.text(),
        }));
        cssFetchCache[url] = deferred;
        return deferred;
    }
    async function embedFonts(meta, options) {
        return meta.cssText.then((raw) => {
            let cssText = raw;
            const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
            const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
            const loadFonts = fontLocs.map((location) => {
                let url = location.replace(regexUrl, '$1');
                if (!url.startsWith('https://')) {
                    url = new URL(url, meta.url).href;
                }
                // eslint-disable-next-line promise/no-nesting
                return window
                    .fetch(url, options.fetchRequestInit)
                    .then((res) => res.blob())
                    .then((blob) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Side Effect
                        cssText = cssText.replace(location, `url(${reader.result})`);
                        resolve([location, reader.result]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            });
            // eslint-disable-next-line promise/no-nesting
            return Promise.all(loadFonts).then(() => cssText);
        });
    }
    function parseCSS(source) {
        if (source == null) {
            return [];
        }
        const result = [];
        const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
        // strip out comments
        let cssText = source.replace(commentsRegex, '');
        // eslint-disable-next-line prefer-regex-literals
        const keyframesRegex = new RegExp('((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})', 'gi');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const matches = keyframesRegex.exec(cssText);
            if (matches === null) {
                break;
            }
            result.push(matches[0]);
        }
        cssText = cssText.replace(keyframesRegex, '');
        const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
        // to match css & media queries together
        const combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
            '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
        // unified regex
        const unifiedRegex = new RegExp(combinedCSSRegex, 'gi');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let matches = importRegex.exec(cssText);
            if (matches === null) {
                matches = unifiedRegex.exec(cssText);
                if (matches === null) {
                    break;
                }
                else {
                    importRegex.lastIndex = unifiedRegex.lastIndex;
                }
            }
            else {
                unifiedRegex.lastIndex = importRegex.lastIndex;
            }
            result.push(matches[0]);
        }
        return result;
    }
    async function getCSSRules(styleSheets, options) {
        const ret = [];
        const deferreds = [];
        // First loop inlines imports
        styleSheets.forEach((sheet) => {
            if ('cssRules' in sheet) {
                try {
                    toArray(sheet.cssRules || []).forEach((item, index) => {
                        if (item.type === CSSRule.IMPORT_RULE) {
                            let importIndex = index + 1;
                            const url = item.href;
                            const deferred = fetchCSS(url)
                                .then((metadata) => metadata ? embedFonts(metadata, options) : '')
                                .then((cssText) => parseCSS(cssText).forEach((rule) => {
                                try {
                                    sheet.insertRule(rule, rule.startsWith('@import')
                                        ? (importIndex += 1)
                                        : sheet.cssRules.length);
                                }
                                catch (error) {
                                    console.error('Error inserting rule from remote css', {
                                        rule,
                                        error,
                                    });
                                }
                            }))
                                .catch((e) => {
                                console.error('Error loading remote css', e.toString());
                            });
                            deferreds.push(deferred);
                        }
                    });
                }
                catch (e) {
                    const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
                    if (sheet.href != null) {
                        deferreds.push(fetchCSS(sheet.href)
                            .then((metadata) => metadata ? embedFonts(metadata, options) : '')
                            .then((cssText) => parseCSS(cssText).forEach((rule) => {
                            inline.insertRule(rule, sheet.cssRules.length);
                        }))
                            .catch((err) => {
                            console.error('Error loading remote stylesheet', err.toString());
                        }));
                    }
                    console.error('Error inlining remote css file', e.toString());
                }
            }
        });
        return Promise.all(deferreds).then(() => {
            // Second loop parses rules
            styleSheets.forEach((sheet) => {
                if ('cssRules' in sheet) {
                    try {
                        toArray(sheet.cssRules || []).forEach((item) => {
                            ret.push(item);
                        });
                    }
                    catch (e) {
                        console.error(`Error while reading CSS rules from ${sheet.href}`, e.toString());
                    }
                }
            });
            return ret;
        });
    }
    function getWebFontRules(cssRules) {
        return cssRules
            .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
            .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
    }
    async function parseWebFontRules(node, options) {
        return new Promise((resolve, reject) => {
            if (node.ownerDocument == null) {
                reject(new Error('Provided element is not within a Document'));
            }
            resolve(toArray(node.ownerDocument.styleSheets));
        })
            .then((styleSheets) => getCSSRules(styleSheets, options))
            .then(getWebFontRules);
    }
    async function getWebFontCSS(node, options) {
        return parseWebFontRules(node, options)
            .then((rules) => Promise.all(rules.map((rule) => {
            const baseUrl = rule.parentStyleSheet
                ? rule.parentStyleSheet.href
                : null;
            return embedResources(rule.cssText, baseUrl, options);
        })))
            .then((cssTexts) => cssTexts.join('\n'));
    }
    async function embedWebFonts(clonedNode, options) {
        return (options.fontEmbedCSS != null
            ? Promise.resolve(options.fontEmbedCSS)
            : getWebFontCSS(clonedNode, options)).then((cssText) => {
            const styleNode = document.createElement('style');
            const sytleContent = document.createTextNode(cssText);
            styleNode.appendChild(sytleContent);
            if (clonedNode.firstChild) {
                clonedNode.insertBefore(styleNode, clonedNode.firstChild);
            }
            else {
                clonedNode.appendChild(styleNode);
            }
            return clonedNode;
        });
    }

    function getImageSize(node, options = {}) {
        const width = options.width || getNodeWidth(node);
        const height = options.height || getNodeHeight(node);
        return { width, height };
    }
    async function toSvg(node, options = {}) {
        const { width, height } = getImageSize(node, options);
        return Promise.resolve(node)
            .then((nativeNode) => cloneNode(nativeNode, options, true))
            .then((clonedNode) => embedWebFonts(clonedNode, options))
            .then((clonedNode) => embedImages(clonedNode, options))
            .then((clonedNode) => applyStyleWithOptions(clonedNode, options))
            .then((clonedNode) => nodeToDataURL(clonedNode, width, height));
    }
    const dimensionCanvasLimit = 16384; // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
    function checkCanvasDimensions(canvas) {
        if (canvas.width > dimensionCanvasLimit ||
            canvas.height > dimensionCanvasLimit) {
            if (canvas.width > dimensionCanvasLimit &&
                canvas.height > dimensionCanvasLimit) {
                if (canvas.width > canvas.height) {
                    canvas.height *= dimensionCanvasLimit / canvas.width;
                    canvas.width = dimensionCanvasLimit;
                }
                else {
                    canvas.width *= dimensionCanvasLimit / canvas.height;
                    canvas.height = dimensionCanvasLimit;
                }
            }
            else if (canvas.width > dimensionCanvasLimit) {
                canvas.height *= dimensionCanvasLimit / canvas.width;
                canvas.width = dimensionCanvasLimit;
            }
            else {
                canvas.width *= dimensionCanvasLimit / canvas.height;
                canvas.height = dimensionCanvasLimit;
            }
        }
    }
    async function toCanvas(node, options = {}) {
        return toSvg(node, options)
            .then(createImage)
            .then((img) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const ratio = options.pixelRatio || getPixelRatio();
            const { width, height } = getImageSize(node, options);
            const canvasWidth = options.canvasWidth || width;
            const canvasHeight = options.canvasHeight || height;
            canvas.width = canvasWidth * ratio;
            canvas.height = canvasHeight * ratio;
            if (!options.skipAutoScale) {
                checkCanvasDimensions(canvas);
            }
            canvas.style.width = `${canvasWidth}`;
            canvas.style.height = `${canvasHeight}`;
            if (options.backgroundColor) {
                context.fillStyle = options.backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas;
        });
    }
    async function toPng(node, options = {}) {
        return toCanvas(node, options).then((canvas) => canvas.toDataURL());
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var download = createCommonjsModule(function (module, exports) {
    //download.js v4.2, by dandavis; 2008-2016. [MIT] see http://danml.com/download.html for tests/usage
    // v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
    // v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
    // v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
    // v4 adds AMD/UMD, commonJS, and plain browser support
    // v4.1 adds url download capability via solo URL argument (same domain/CORS only)
    // v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
    // https://github.com/rndme/download

    (function (root, factory) {
    	{
    		// Node. Does not work with strict CommonJS, but
    		// only CommonJS-like environments that support module.exports,
    		// like Node.
    		module.exports = factory();
    	}
    }(commonjsGlobal, function () {

    	return function download(data, strFileName, strMimeType) {

    		var self = window, // this script is only for browsers anyway...
    			defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
    			mimeType = strMimeType || defaultMime,
    			payload = data,
    			url = !strFileName && !strMimeType && payload,
    			anchor = document.createElement("a"),
    			toString = function(a){return String(a);},
    			myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
    			fileName = strFileName || "download",
    			blob,
    			reader;
    			myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
    	  
    		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
    			payload=[payload, mimeType];
    			mimeType=payload[0];
    			payload=payload[1];
    		}


    		if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
    			fileName = url.split("/").pop().split("?")[0];
    			anchor.href = url; // assign href prop to temp anchor
    		  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
            		var ajax=new XMLHttpRequest();
            		ajax.open( "GET", url, true);
            		ajax.responseType = 'blob';
            		ajax.onload= function(e){ 
    				  download(e.target.response, fileName, defaultMime);
    				};
            		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
    			    return ajax;
    			} // end if valid url?
    		} // end if url?


    		//go ahead and download dataURLs right away
    		if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)){
    		
    			if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
    				payload=dataUrlToBlob(payload);
    				mimeType=payload.type || defaultMime;
    			}else {			
    				return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
    					navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
    					saver(payload) ; // everyone else can save dataURLs un-processed
    			}
    			
    		}else {//not data url, is it a string with special needs?
    			if(/([\x80-\xff])/.test(payload)){			  
    				var i=0, tempUiArr= new Uint8Array(payload.length), mx=tempUiArr.length;
    				for(i;i<mx;++i) tempUiArr[i]= payload.charCodeAt(i);
    			 	payload=new myBlob([tempUiArr], {type: mimeType});
    			}		  
    		}
    		blob = payload instanceof myBlob ?
    			payload :
    			new myBlob([payload], {type: mimeType}) ;


    		function dataUrlToBlob(strUrl) {
    			var parts= strUrl.split(/[:;,]/),
    			type= parts[1],
    			decoder= parts[2] == "base64" ? atob : decodeURIComponent,
    			binData= decoder( parts.pop() ),
    			mx= binData.length,
    			i= 0,
    			uiArr= new Uint8Array(mx);

    			for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

    			return new myBlob([uiArr], {type: type});
    		 }

    		function saver(url, winMode){

    			if ('download' in anchor) { //html5 A[download]
    				anchor.href = url;
    				anchor.setAttribute("download", fileName);
    				anchor.className = "download-js-link";
    				anchor.innerHTML = "downloading...";
    				anchor.style.display = "none";
    				document.body.appendChild(anchor);
    				setTimeout(function() {
    					anchor.click();
    					document.body.removeChild(anchor);
    					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
    				}, 66);
    				return true;
    			}

    			// handle non-a[download] safari as best we can:
    			if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
    				if(/^data:/.test(url))	url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
    				if(!window.open(url)){ // popup blocked, offer direct download:
    					if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
    				}
    				return true;
    			}

    			//do iframe dataURL download (old ch+FF):
    			var f = document.createElement("iframe");
    			document.body.appendChild(f);

    			if(!winMode && /^data:/.test(url)){ // force a mime that will download:
    				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
    			}
    			f.src=url;
    			setTimeout(function(){ document.body.removeChild(f); }, 333);

    		}//end saver




    		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
    			return navigator.msSaveBlob(blob, fileName);
    		}

    		if(self.URL){ // simple fast and modern way using Blob and URL:
    			saver(self.URL.createObjectURL(blob), true);
    		}else {
    			// handle non-Blob()+non-URL browsers:
    			if(typeof blob === "string" || blob.constructor===toString ){
    				try{
    					return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
    				}catch(y){
    					return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
    				}
    			}

    			// Blob but not URL support:
    			reader=new FileReader();
    			reader.onload=function(e){
    				saver(this.result);
    			};
    			reader.readAsDataURL(blob);
    		}
    		return true;
    	}; /* end download() */
    }));
    });

    /* App.svelte generated by Svelte v3.49.0 */
    const file = "App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0_value = /*locale*/ ctx[2].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let label0;
    	let b0;
    	let t2_value = /*locale*/ ctx[2].language + "";
    	let t2;
    	let t3;
    	let label1;
    	let input0;
    	let t4;
    	let t5;
    	let label2;
    	let input1;
    	let t6;
    	let t7;
    	let div1;
    	let label3;
    	let b1;
    	let t8_value = /*locale*/ ctx[2].vehicle + "";
    	let t8;
    	let t9;
    	let label4;
    	let input2;
    	let t10;
    	let t11_value = /*locale*/ ctx[2].motobike + "";
    	let t11;
    	let t12;
    	let label5;
    	let input3;
    	let t13;
    	let t14_value = /*locale*/ ctx[2].auto + "";
    	let t14;
    	let t15;
    	let div3;
    	let div2;
    	let p0;
    	let t16;
    	let br;
    	let t17;
    	let t18;
    	let p1;
    	let button0;
    	let t19_value = /*locale*/ ctx[2].generate + "";
    	let t19;
    	let t20;
    	let button1;
    	let t21_value = /*locale*/ ctx[2].download + "";
    	let t21;
    	let t22;
    	let p2;
    	let t23_value = /*locale*/ ctx[2].footNote + "";
    	let t23;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			b0 = element("b");
    			t2 = text(t2_value);
    			t3 = space();
    			label1 = element("label");
    			input0 = element("input");
    			t4 = text("\n      Tiếng Việt");
    			t5 = space();
    			label2 = element("label");
    			input1 = element("input");
    			t6 = text("\n      English");
    			t7 = space();
    			div1 = element("div");
    			label3 = element("label");
    			b1 = element("b");
    			t8 = text(t8_value);
    			t9 = space();
    			label4 = element("label");
    			input2 = element("input");
    			t10 = space();
    			t11 = text(t11_value);
    			t12 = space();
    			label5 = element("label");
    			input3 = element("input");
    			t13 = space();
    			t14 = text(t14_value);
    			t15 = space();
    			div3 = element("div");
    			div2 = element("div");
    			p0 = element("p");
    			t16 = text(/*line1*/ ctx[4]);
    			br = element("br");
    			t17 = text(/*line2*/ ctx[5]);
    			t18 = space();
    			p1 = element("p");
    			button0 = element("button");
    			t19 = text(t19_value);
    			t20 = space();
    			button1 = element("button");
    			t21 = text(t21_value);
    			t22 = space();
    			p2 = element("p");
    			t23 = text(t23_value);
    			add_location(h1, file, 118, 1, 2563);
    			add_location(b0, file, 122, 6, 2638);
    			attr_dev(label0, "for", "");
    			add_location(label0, file, 121, 4, 2617);
    			attr_dev(input0, "id", "language-vi");
    			attr_dev(input0, "type", "radio");
    			input0.__value = "vi";
    			input0.value = input0.__value;
    			/*$$binding_groups*/ ctx[10][0].push(input0);
    			add_location(input0, file, 126, 6, 2713);
    			attr_dev(label1, "for", "language-vi");
    			add_location(label1, file, 125, 4, 2681);
    			attr_dev(input1, "id", "language-en");
    			attr_dev(input1, "type", "radio");
    			input1.__value = "en";
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[10][0].push(input1);
    			add_location(input1, file, 131, 6, 2880);
    			attr_dev(label2, "for", "language-en");
    			add_location(label2, file, 130, 4, 2848);
    			attr_dev(div0, "align", "center");
    			add_location(div0, file, 120, 2, 2592);
    			add_location(b1, file, 138, 6, 3078);
    			attr_dev(label3, "for", "");
    			add_location(label3, file, 137, 4, 3057);
    			attr_dev(input2, "id", "vehicle-motobike");
    			attr_dev(input2, "type", "radio");
    			input2.__value = "motobike";
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[10][1].push(input2);
    			add_location(input2, file, 142, 6, 3157);
    			attr_dev(label4, "for", "vehicle-motobike");
    			add_location(label4, file, 141, 4, 3120);
    			attr_dev(input3, "id", "vehicle-auto");
    			attr_dev(input3, "type", "radio");
    			input3.__value = "auto";
    			input3.value = input3.__value;
    			/*$$binding_groups*/ ctx[10][1].push(input3);
    			add_location(input3, file, 147, 6, 3336);
    			attr_dev(label5, "for", "vehicle-auto");
    			add_location(label5, file, 146, 4, 3303);
    			attr_dev(div1, "align", "center");
    			attr_dev(div1, "class", "mt-1 svelte-16zq4nk");
    			add_location(div1, file, 136, 2, 3019);
    			add_location(br, file, 154, 16, 3583);
    			attr_dev(p0, "class", "svelte-16zq4nk");
    			add_location(p0, file, 154, 6, 3573);
    			attr_dev(div2, "class", "frame svelte-16zq4nk");
    			add_location(div2, file, 153, 4, 3547);
    			attr_dev(div3, "class", "plate-container mt-1 svelte-16zq4nk");
    			add_location(div3, file, 152, 2, 3477);
    			attr_dev(button0, "class", "svelte-16zq4nk");
    			add_location(button0, file, 159, 4, 3658);
    			attr_dev(button1, "class", "svelte-16zq4nk");
    			add_location(button1, file, 162, 4, 3731);
    			attr_dev(p1, "align", "center");
    			attr_dev(p1, "class", "mt-1 svelte-16zq4nk");
    			add_location(p1, file, 158, 2, 3622);
    			attr_dev(p2, "class", "mt-1 svelte-16zq4nk");
    			add_location(p2, file, 167, 2, 3810);
    			attr_dev(main, "class", "svelte-16zq4nk");
    			add_location(main, file, 117, 0, 2555);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, label0);
    			append_dev(label0, b0);
    			append_dev(b0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, label1);
    			append_dev(label1, input0);
    			input0.checked = input0.__value === /*language*/ ctx[1];
    			append_dev(label1, t4);
    			append_dev(div0, t5);
    			append_dev(div0, label2);
    			append_dev(label2, input1);
    			input1.checked = input1.__value === /*language*/ ctx[1];
    			append_dev(label2, t6);
    			append_dev(main, t7);
    			append_dev(main, div1);
    			append_dev(div1, label3);
    			append_dev(label3, b1);
    			append_dev(b1, t8);
    			append_dev(div1, t9);
    			append_dev(div1, label4);
    			append_dev(label4, input2);
    			input2.checked = input2.__value === /*vehicle*/ ctx[0];
    			append_dev(label4, t10);
    			append_dev(label4, t11);
    			append_dev(div1, t12);
    			append_dev(div1, label5);
    			append_dev(label5, input3);
    			input3.checked = input3.__value === /*vehicle*/ ctx[0];
    			append_dev(label5, t13);
    			append_dev(label5, t14);
    			append_dev(main, t15);
    			append_dev(main, div3);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t16);
    			append_dev(p0, br);
    			append_dev(p0, t17);
    			/*div3_binding*/ ctx[14](div3);
    			append_dev(main, t18);
    			append_dev(main, p1);
    			append_dev(p1, button0);
    			append_dev(button0, t19);
    			append_dev(p1, t20);
    			append_dev(p1, button1);
    			append_dev(button1, t21);
    			append_dev(main, t22);
    			append_dev(main, p2);
    			append_dev(p2, t23);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[9]),
    					listen_dev(input0, "change", /*doChangeLanguage*/ ctx[8], false, false, false),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[11]),
    					listen_dev(input1, "change", /*doChangeLanguage*/ ctx[8], false, false, false),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[12]),
    					listen_dev(input2, "change", /*doGenerate*/ ctx[6], false, false, false),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[13]),
    					listen_dev(input3, "change", /*doGenerate*/ ctx[6], false, false, false),
    					listen_dev(button0, "click", /*doGenerate*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*doDownload*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*locale*/ 4 && t0_value !== (t0_value = /*locale*/ ctx[2].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*locale*/ 4 && t2_value !== (t2_value = /*locale*/ ctx[2].language + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*language*/ 2) {
    				input0.checked = input0.__value === /*language*/ ctx[1];
    			}

    			if (dirty & /*language*/ 2) {
    				input1.checked = input1.__value === /*language*/ ctx[1];
    			}

    			if (dirty & /*locale*/ 4 && t8_value !== (t8_value = /*locale*/ ctx[2].vehicle + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*vehicle*/ 1) {
    				input2.checked = input2.__value === /*vehicle*/ ctx[0];
    			}

    			if (dirty & /*locale*/ 4 && t11_value !== (t11_value = /*locale*/ ctx[2].motobike + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*vehicle*/ 1) {
    				input3.checked = input3.__value === /*vehicle*/ ctx[0];
    			}

    			if (dirty & /*locale*/ 4 && t14_value !== (t14_value = /*locale*/ ctx[2].auto + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*line1*/ 16) set_data_dev(t16, /*line1*/ ctx[4]);
    			if (dirty & /*line2*/ 32) set_data_dev(t17, /*line2*/ ctx[5]);
    			if (dirty & /*locale*/ 4 && t19_value !== (t19_value = /*locale*/ ctx[2].generate + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*locale*/ 4 && t21_value !== (t21_value = /*locale*/ ctx[2].download + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*locale*/ 4 && t23_value !== (t23_value = /*locale*/ ctx[2].footNote + "")) set_data_dev(t23, t23_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*$$binding_groups*/ ctx[10][0].splice(/*$$binding_groups*/ ctx[10][0].indexOf(input0), 1);
    			/*$$binding_groups*/ ctx[10][0].splice(/*$$binding_groups*/ ctx[10][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[10][1].splice(/*$$binding_groups*/ ctx[10][1].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[10][1].splice(/*$$binding_groups*/ ctx[10][1].indexOf(input3), 1);
    			/*div3_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const alphabet = "ABCDEFGHIJKLMNPQRSTUVWXYZ";

    function randomNumber(min = 0, max = 9) {
    	return Math.floor(Math.random() * (max - min)) + min;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const locales = {
    		en: {
    			title: "Vietnamese Vehicle Plate Number",
    			language: "Language",
    			vehicle: "Vehicle",
    			motobike: "Motobike",
    			auto: "Auto",
    			generate: "Generate",
    			download: "Download",
    			footNote: "* This generator is for testing purpose only."
    		},
    		vi: {
    			title: "Bảng số xe Việt Nam",
    			language: "Ngôn ngữ",
    			vehicle: "Phương tiện",
    			motobike: "Mô tô & xe máy",
    			auto: "Ô tô",
    			generate: "Tạo ngẫu nhiên",
    			download: "Tải về",
    			footNote: "* Tạo bảng số xe ngẫu nhiên cho mục đích kiểm thử."
    		}
    	};

    	let vehicle = "motobike";
    	let language = "vi";
    	let locale = locales[language];
    	let plateNumberElement;
    	const hcmNo = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
    	let line1 = "";
    	let line2 = "";

    	function randomPlateNumber() {
    		const regionNo = hcmNo[randomNumber(0, hcmNo.length)];
    		const randomletter = alphabet[randomNumber(0, alphabet.length)];
    		$$invalidate(4, line1 = `${regionNo}-${randomletter}${randomNumber()}`);

    		if (vehicle === "auto") {
    			$$invalidate(4, line1 = `${regionNo}${randomletter}`);
    		}

    		$$invalidate(5, line2 = `${randomNumber()}${randomNumber()}${randomNumber()}.${randomNumber()}${randomNumber()}`);
    		return `${line1} ${line2}`;
    	}

    	let plateNumber = randomPlateNumber();

    	function doGenerate() {
    		plateNumber = randomPlateNumber();
    	}

    	function doDownload() {
    		if (plateNumberElement) {
    			toPng(plateNumberElement).then(function (dataUrl) {
    				download(dataUrl, `${plateNumber}.png`);
    			});
    		}
    	}

    	function doChangeLanguage() {
    		$$invalidate(2, locale = locales[language]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], []];

    	function input0_change_handler() {
    		language = this.__value;
    		$$invalidate(1, language);
    	}

    	function input1_change_handler() {
    		language = this.__value;
    		$$invalidate(1, language);
    	}

    	function input2_change_handler() {
    		vehicle = this.__value;
    		$$invalidate(0, vehicle);
    	}

    	function input3_change_handler() {
    		vehicle = this.__value;
    		$$invalidate(0, vehicle);
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			plateNumberElement = $$value;
    			$$invalidate(3, plateNumberElement);
    		});
    	}

    	$$self.$capture_state = () => ({
    		toPng,
    		download,
    		locales,
    		vehicle,
    		language,
    		locale,
    		plateNumberElement,
    		hcmNo,
    		alphabet,
    		randomNumber,
    		line1,
    		line2,
    		randomPlateNumber,
    		plateNumber,
    		doGenerate,
    		doDownload,
    		doChangeLanguage
    	});

    	$$self.$inject_state = $$props => {
    		if ('vehicle' in $$props) $$invalidate(0, vehicle = $$props.vehicle);
    		if ('language' in $$props) $$invalidate(1, language = $$props.language);
    		if ('locale' in $$props) $$invalidate(2, locale = $$props.locale);
    		if ('plateNumberElement' in $$props) $$invalidate(3, plateNumberElement = $$props.plateNumberElement);
    		if ('line1' in $$props) $$invalidate(4, line1 = $$props.line1);
    		if ('line2' in $$props) $$invalidate(5, line2 = $$props.line2);
    		if ('plateNumber' in $$props) plateNumber = $$props.plateNumber;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		vehicle,
    		language,
    		locale,
    		plateNumberElement,
    		line1,
    		line2,
    		doGenerate,
    		doDownload,
    		doChangeLanguage,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		div3_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
