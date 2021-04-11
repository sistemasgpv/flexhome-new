
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
            mount_component(component, options.target, options.anchor);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.2' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    const proyectos = writable([]);

    const modelos = writable([]);

    const atributos = writable([]);

    const menuState = writable({}); //atrributes open or closed

    const categorias = writable({});

    const cart = writable([]);

    const loadingOpciones = writable(false);

    function showAttribute(atr) {
      menuState.update((ms) => {
        Object.keys(ms).forEach((_atr) => {
          ms[_atr] = atr == _atr;
        });
        return ms;
      });

      //scroll into view
      document.getElementById(atr).scrollIntoView(true, { behavior: "smooth" });
    }

    //proyect and modelo selection
    const currentSelection = writable({
      proyect: null,
      modelo: null,
    });

    function getCategoriasFromAtributos() {
      let cat = {
        all: true,
      };
      get_store_value(atributos).forEach((atr) => {
        if (atr.fields.Categoría) {
          atr.fields.Categoría.forEach((catName) => {
            cat[catName] = false;
          });
        }
      });
      categorias.set(cat);
    }

    function getAtributos() {
      let ms = {}; //menu state

      axios$1.get("https://enl4yiidhnuij8n.m.pipedream.net").then((res) => {
        res.data.forEach((att) => {
          att.opciones = [];

          //open all attrbutes by default
          ms[att.fields.Nombre] = true;
        });
        menuState.set(ms);
        atributos.set(res.data);
        getCategoriasFromAtributos();
      });
    }

    function getProyectos() {
      axios$1.get("https://en57ds8aebutpuq.m.pipedream.net").then((res) => {
        proyectos.set(res.data);
        if (!get_store_value(currentSelection).proyect) {
          currentSelection.update((cs) => {
            cs.proyect = res.data[0];
            return cs;
          });
        }
      });
    }

    function getModelos() {
      axios$1.get("https://enw9gnpjz0b6y3s.m.pipedream.net").then((res) => {
        modelos.set(res.data);
      });
    }

    function getOpciones(vivienda) {
      loadingOpciones.set(true);
      axios$1
        .get(`https://enombb1z99rtf6o.m.pipedream.net?vivienda=${vivienda}`)
        .then((res) => {
          res.data.sort((a, b) => {
            return a.fields.orden - b.fields.orden;
          });

          let atts = get_store_value(atributos);

          //put opciones in each atributo
          res.data.forEach((opcione) => {
            let attName = opcione.fields.atributo_nombre;
            atts
              .find((att) => {
                return att.fields.Nombre == attName;
              })
              .opciones.push(opcione);
          });

          //put first option in each atriuto in cart
          let c = [];
          atts.forEach((att) => {
            c.push(att.opciones[0]);
          });
          cart.set(c);

          atributos.set(atts);
          loadingOpciones.set(false);

          console.log(atts);
        });
    }

    getProyectos();
    getAtributos();
    getModelos();

    /* src\Categorias.svelte generated by Svelte v3.32.2 */

    const { Object: Object_1 } = globals;
    const file = "src\\Categorias.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (17:2) {#each Object.keys($categorias) as categoria}
    function create_each_block(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t0;
    	let div2;
    	let t1_value = /*categoria*/ ctx[3] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*categoria*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(div0, "class", "switch-thumb");
    			toggle_class(div0, "switch-thumb-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[3]]);
    			add_location(div0, file, 24, 8, 749);
    			attr_dev(div1, "class", "switch-bg");
    			toggle_class(div1, "switch-bg-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[3]]);
    			add_location(div1, file, 23, 6, 672);
    			attr_dev(div2, "class", "switch-title");
    			add_location(div2, file, 29, 6, 877);
    			attr_dev(div3, "class", "switch");
    			add_location(div3, file, 17, 4, 561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, t1);
    			append_dev(div3, t2);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$categorias, Object*/ 1) {
    				toggle_class(div0, "switch-thumb-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[3]]);
    			}

    			if (dirty & /*$categorias, Object*/ 1) {
    				toggle_class(div1, "switch-bg-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[3]]);
    			}

    			if (dirty & /*$categorias*/ 1 && t1_value !== (t1_value = /*categoria*/ ctx[3] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(17:2) {#each Object.keys($categorias) as categoria}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let each_value = Object.keys(/*$categorias*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Categorias";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "categorias-title");
    			add_location(div0, file, 14, 0, 434);
    			attr_dev(div1, "class", "categorias");
    			add_location(div1, file, 15, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*switchClicked, Object, $categorias*/ 3) {
    				each_value = Object.keys(/*$categorias*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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

    function instance($$self, $$props, $$invalidate) {
    	let $categorias;
    	validate_store(categorias, "categorias");
    	component_subscribe($$self, categorias, $$value => $$invalidate(0, $categorias = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Categorias", slots, []);

    	function switchClicked(categoria) {
    		set_store_value(categorias, $categorias[categoria] = !$categorias[categoria], $categorias);

    		if (categoria != "all") {
    			//if user turned all categories (execpt for all) off we switch all on, otherwise switch all off
    			set_store_value(categorias, $categorias.all = !Object.keys($categorias).some(cat => cat != "all" ? $categorias[cat] : false), $categorias);
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Categorias> was created with unknown prop '${key}'`);
    	});

    	const click_handler = categoria => {
    		switchClicked(categoria);
    	};

    	$$self.$capture_state = () => ({ categorias, switchClicked, $categorias });
    	return [$categorias, switchClicked, click_handler];
    }

    class Categorias extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Categorias",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      // These options are needed to round to whole numbers if that's what you want.
      //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
      maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
    });

    function formatCurrency(amount) {
      return formatter.format(amount);
    }

    /* src\Opcione.svelte generated by Svelte v3.32.2 */
    const file$1 = "src\\Opcione.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*opcione*/ ctx[0].fields.opción_nombre + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = /*opcione*/ ctx[0].fields.descripción + "";
    	let t3;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*formattedPrecio*/ ctx[1]);
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "+";
    			attr_dev(img, "class", "opcione-img");
    			if (img.src !== (img_src_value = /*opcione*/ ctx[0].fields.Render[0].thumbnails.large.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 27, 2, 721);
    			attr_dev(div0, "class", "opcione-title");
    			add_location(div0, file$1, 35, 2, 890);
    			attr_dev(div1, "class", "opcione-description");
    			add_location(div1, file$1, 36, 2, 957);
    			attr_dev(div2, "class", "opcione-price");
    			add_location(div2, file$1, 37, 2, 1028);
    			attr_dev(div3, "class", "opcione-plus-btn");
    			add_location(div3, file$1, 38, 2, 1082);
    			attr_dev(div4, "class", "opcione");
    			toggle_class(div4, "selected", /*selected*/ ctx[2]);
    			add_location(div4, file$1, 26, 0, 658);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, img);
    			append_dev(div4, t0);
    			append_dev(div4, div0);
    			append_dev(div0, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div2);
    			append_dev(div2, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "load", /*load_handler*/ ctx[8], false, false, false),
    					listen_dev(div4, "click", /*setCartItem*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*opcione*/ 1 && img.src !== (img_src_value = /*opcione*/ ctx[0].fields.Render[0].thumbnails.large.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*opcione*/ 1 && t1_value !== (t1_value = /*opcione*/ ctx[0].fields.opción_nombre + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*opcione*/ 1 && t3_value !== (t3_value = /*opcione*/ ctx[0].fields.descripción + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*formattedPrecio*/ 2) set_data_dev(t5, /*formattedPrecio*/ ctx[1]);

    			if (dirty & /*selected*/ 4) {
    				toggle_class(div4, "selected", /*selected*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let formattedPrecio;
    	let cartIdx;
    	let attName;
    	let selected;
    	let $cart;
    	validate_store(cart, "cart");
    	component_subscribe($$self, cart, $$value => $$invalidate(6, $cart = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Opcione", slots, []);
    	const dispatch = createEventDispatcher();
    	let { opcione } = $$props;

    	function setCartItem() {
    		//find atributo index
    		set_store_value(cart, $cart[cartIdx] = opcione, $cart);
    	}

    	const writable_props = ["opcione"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Opcione> was created with unknown prop '${key}'`);
    	});

    	const load_handler = () => {
    		dispatch("img-loaded");
    	};

    	$$self.$$set = $$props => {
    		if ("opcione" in $$props) $$invalidate(0, opcione = $$props.opcione);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		cart,
    		formatCurrency,
    		dispatch,
    		opcione,
    		setCartItem,
    		formattedPrecio,
    		cartIdx,
    		$cart,
    		attName,
    		selected
    	});

    	$$self.$inject_state = $$props => {
    		if ("opcione" in $$props) $$invalidate(0, opcione = $$props.opcione);
    		if ("formattedPrecio" in $$props) $$invalidate(1, formattedPrecio = $$props.formattedPrecio);
    		if ("cartIdx" in $$props) $$invalidate(5, cartIdx = $$props.cartIdx);
    		if ("attName" in $$props) $$invalidate(7, attName = $$props.attName);
    		if ("selected" in $$props) $$invalidate(2, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*opcione*/ 1) {
    			$$invalidate(1, formattedPrecio = formatCurrency(opcione.fields.precio));
    		}

    		if ($$self.$$.dirty & /*opcione*/ 1) {
    			$$invalidate(7, attName = opcione.fields.atributo_nombre);
    		}

    		if ($$self.$$.dirty & /*$cart, attName*/ 192) {
    			$$invalidate(5, cartIdx = $cart.findIndex(item => {
    				return attName == item.fields.atributo_nombre;
    			}));
    		}

    		if ($$self.$$.dirty & /*cartIdx, $cart, opcione*/ 97) {
    			$$invalidate(2, selected = cartIdx >= 0 && $cart[cartIdx].fields.opción_nombre == opcione.fields.opción_nombre);
    		}
    	};

    	return [
    		opcione,
    		formattedPrecio,
    		selected,
    		dispatch,
    		setCartItem,
    		cartIdx,
    		$cart,
    		attName,
    		load_handler
    	];
    }

    class Opcione extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { opcione: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Opcione",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*opcione*/ ctx[0] === undefined && !("opcione" in props)) {
    			console.warn("<Opcione> was created without expected prop 'opcione'");
    		}
    	}

    	get opcione() {
    		throw new Error("<Opcione>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opcione(value) {
    		throw new Error("<Opcione>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Opciones.svelte generated by Svelte v3.32.2 */
    const file$2 = "src\\Opciones.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (34:2) {#if opciones}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*opciones*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*opciones, opcioneLoaded*/ 5) {
    				each_value = /*opciones*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:2) {#if opciones}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {#each opciones as opcione}
    function create_each_block$1(ctx) {
    	let opcione;
    	let current;

    	opcione = new Opcione({
    			props: { opcione: /*opcione*/ ctx[8] },
    			$$inline: true
    		});

    	opcione.$on("img-loaded", /*opcioneLoaded*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(opcione.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(opcione, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const opcione_changes = {};
    			if (dirty & /*opciones*/ 1) opcione_changes.opcione = /*opcione*/ ctx[8];
    			opcione.$set(opcione_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(opcione.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(opcione.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(opcione, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(35:4) {#each opciones as opcione}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let if_block = /*opciones*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "opciones");
    			add_location(div, file$2, 32, 0, 590);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[5](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*opciones*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*opciones*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Opciones", slots, []);
    	let { opciones = [] } = $$props;
    	let { isOpen = false } = $$props;
    	let opcionesDiv;
    	let maxHeight = 0;
    	let opcionesLoaded = 0;

    	async function calcHeight() {
    		await tick();
    		$$invalidate(4, maxHeight = opcionesDiv.scrollHeight);
    	}

    	function opcioneLoaded() {
    		opcionesLoaded++;

    		if (opcionesLoaded >= opciones.length) {
    			calcHeight();
    		}
    	}

    	const writable_props = ["opciones", "isOpen"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Opciones> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			opcionesDiv = $$value;
    			(($$invalidate(1, opcionesDiv), $$invalidate(3, isOpen)), $$invalidate(4, maxHeight));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("opciones" in $$props) $$invalidate(0, opciones = $$props.opciones);
    		if ("isOpen" in $$props) $$invalidate(3, isOpen = $$props.isOpen);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		Opcione,
    		opciones,
    		isOpen,
    		opcionesDiv,
    		maxHeight,
    		opcionesLoaded,
    		calcHeight,
    		opcioneLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("opciones" in $$props) $$invalidate(0, opciones = $$props.opciones);
    		if ("isOpen" in $$props) $$invalidate(3, isOpen = $$props.isOpen);
    		if ("opcionesDiv" in $$props) $$invalidate(1, opcionesDiv = $$props.opcionesDiv);
    		if ("maxHeight" in $$props) $$invalidate(4, maxHeight = $$props.maxHeight);
    		if ("opcionesLoaded" in $$props) opcionesLoaded = $$props.opcionesLoaded;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*opcionesDiv, isOpen, maxHeight*/ 26) {
    			{
    				if (opcionesDiv) {
    					$$invalidate(1, opcionesDiv.style.maxHeight = isOpen ? maxHeight + "px" : "0px", opcionesDiv);
    				}
    			}
    		}
    	};

    	return [opciones, opcionesDiv, opcioneLoaded, isOpen, maxHeight, div_binding];
    }

    class Opciones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { opciones: 0, isOpen: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Opciones",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get opciones() {
    		throw new Error("<Opciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opciones(value) {
    		throw new Error("<Opciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		throw new Error("<Opciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<Opciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Atributo.svelte generated by Svelte v3.32.2 */
    const file$3 = "src\\Atributo.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0_value = /*atributo*/ ctx[0].fields.Nombre + "";
    	let t0;
    	let div_id_value;
    	let t1;
    	let opciones;
    	let current;
    	let mounted;
    	let dispose;

    	opciones = new Opciones({
    			props: {
    				opciones: /*atributo*/ ctx[0].opciones,
    				isOpen: /*isOpen*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(opciones.$$.fragment);
    			attr_dev(div, "id", div_id_value = /*atributo*/ ctx[0].name);
    			attr_dev(div, "class", "atributo-title");
    			toggle_class(div, "disabled", /*disabled*/ ctx[1]);
    			add_location(div, file$3, 32, 0, 724);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(opciones, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*atributo*/ 1) && t0_value !== (t0_value = /*atributo*/ ctx[0].fields.Nombre + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*atributo*/ 1 && div_id_value !== (div_id_value = /*atributo*/ ctx[0].name)) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*disabled*/ 2) {
    				toggle_class(div, "disabled", /*disabled*/ ctx[1]);
    			}

    			const opciones_changes = {};
    			if (dirty & /*atributo*/ 1) opciones_changes.opciones = /*atributo*/ ctx[0].opciones;
    			if (dirty & /*isOpen*/ 8) opciones_changes.isOpen = /*isOpen*/ ctx[3];
    			opciones.$set(opciones_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(opciones.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(opciones.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_component(opciones, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $menuState;
    	let $categorias;
    	validate_store(menuState, "menuState");
    	component_subscribe($$self, menuState, $$value => $$invalidate(2, $menuState = $$value));
    	validate_store(categorias, "categorias");
    	component_subscribe($$self, categorias, $$value => $$invalidate(5, $categorias = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Atributo", slots, []);
    	let { atributo } = $$props;
    	let disabled;
    	let isOpen;
    	let isEmpty;
    	const writable_props = ["atributo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Atributo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		if (disabled) return;
    		set_store_value(menuState, $menuState[atributo.fields.Nombre] = !$menuState[atributo.fields.Nombre], $menuState);
    	};

    	$$self.$$set = $$props => {
    		if ("atributo" in $$props) $$invalidate(0, atributo = $$props.atributo);
    	};

    	$$self.$capture_state = () => ({
    		menuState,
    		categorias,
    		Opciones,
    		atributo,
    		disabled,
    		isOpen,
    		isEmpty,
    		$menuState,
    		$categorias
    	});

    	$$self.$inject_state = $$props => {
    		if ("atributo" in $$props) $$invalidate(0, atributo = $$props.atributo);
    		if ("disabled" in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ("isOpen" in $$props) $$invalidate(3, isOpen = $$props.isOpen);
    		if ("isEmpty" in $$props) $$invalidate(4, isEmpty = $$props.isEmpty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*atributo*/ 1) {
    			{
    				$$invalidate(4, isEmpty = !atributo || atributo.opciones.length == 0);
    			}
    		}

    		if ($$self.$$.dirty & /*isEmpty, $categorias, atributo*/ 49) {
    			{
    				if (isEmpty) {
    					$$invalidate(1, disabled = true);
    				} else if ($categorias.all) {
    					$$invalidate(1, disabled = false);
    				} else if (atributo.fields.Categoría) {
    					//check if at least 1 category of the attribute is switched on in $categories
    					$$invalidate(1, disabled = atributo.fields.Categoría.some(cat => !$categorias[cat]));
    				} else {
    					$$invalidate(1, disabled = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$menuState, atributo, disabled*/ 7) {
    			{
    				$$invalidate(3, isOpen = $menuState[atributo.fields.Nombre] && !disabled);
    			}
    		}
    	};

    	return [atributo, disabled, $menuState, isOpen, isEmpty, $categorias, click_handler];
    }

    class Atributo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { atributo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Atributo",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*atributo*/ ctx[0] === undefined && !("atributo" in props)) {
    			console.warn("<Atributo> was created without expected prop 'atributo'");
    		}
    	}

    	get atributo() {
    		throw new Error("<Atributo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set atributo(value) {
    		throw new Error("<Atributo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Atributos.svelte generated by Svelte v3.32.2 */
    const file$4 = "src\\Atributos.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (7:2) {#each $atributos as atributo}
    function create_each_block$2(ctx) {
    	let atributo;
    	let current;

    	atributo = new Atributo({
    			props: { atributo: /*atributo*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(atributo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(atributo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const atributo_changes = {};
    			if (dirty & /*$atributos*/ 1) atributo_changes.atributo = /*atributo*/ ctx[1];
    			atributo.$set(atributo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(atributo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(atributo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(atributo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(7:2) {#each $atributos as atributo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	let each_value = /*$atributos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "opciones-container");
    			add_location(div, file$4, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$atributos*/ 1) {
    				each_value = /*$atributos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $atributos;
    	validate_store(atributos, "atributos");
    	component_subscribe($$self, atributos, $$value => $$invalidate(0, $atributos = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Atributos", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Atributos> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ atributos, Atributo, $atributos });
    	return [$atributos];
    }

    class Atributos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Atributos",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\SideItem.svelte generated by Svelte v3.32.2 */
    const file$5 = "src\\SideItem.svelte";

    function create_fragment$5(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let div4;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let t3_value = (/*title*/ ctx[2] ? /*title*/ ctx[2] : "") + "";
    	let t3;
    	let t4;
    	let div3;

    	let t5_value = (Number.isInteger(/*price*/ ctx[3])
    	? formatCurrency(/*price*/ ctx[3])
    	: "") + "";

    	let t5;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t1 = text(/*cat*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			attr_dev(div0, "class", "select-img");

    			set_style(div0, "background-image", /*imgUrl*/ ctx[0]
    			? "url(" + /*imgUrl*/ ctx[0] + ")"
    			: "grey");

    			add_location(div0, file$5, 9, 2, 183);
    			attr_dev(div1, "class", "select-cat");
    			add_location(div1, file$5, 14, 4, 305);
    			attr_dev(div2, "class", "select-title");
    			add_location(div2, file$5, 15, 4, 346);
    			attr_dev(div3, "class", "select-price");
    			add_location(div3, file$5, 18, 4, 418);
    			add_location(div4, file$5, 13, 2, 294);
    			attr_dev(div5, "class", "select-item");
    			add_location(div5, file$5, 8, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imgUrl*/ 1) {
    				set_style(div0, "background-image", /*imgUrl*/ ctx[0]
    				? "url(" + /*imgUrl*/ ctx[0] + ")"
    				: "grey");
    			}

    			if (dirty & /*cat*/ 2) set_data_dev(t1, /*cat*/ ctx[1]);
    			if (dirty & /*title*/ 4 && t3_value !== (t3_value = (/*title*/ ctx[2] ? /*title*/ ctx[2] : "") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*price*/ 8 && t5_value !== (t5_value = (Number.isInteger(/*price*/ ctx[3])
    			? formatCurrency(/*price*/ ctx[3])
    			: "") + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SideItem", slots, []);
    	let { imgUrl } = $$props;
    	let { cat } = $$props;
    	let { title } = $$props;
    	let { price } = $$props;
    	const writable_props = ["imgUrl", "cat", "title", "price"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SideItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("imgUrl" in $$props) $$invalidate(0, imgUrl = $$props.imgUrl);
    		if ("cat" in $$props) $$invalidate(1, cat = $$props.cat);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("price" in $$props) $$invalidate(3, price = $$props.price);
    	};

    	$$self.$capture_state = () => ({
    		formatCurrency,
    		imgUrl,
    		cat,
    		title,
    		price
    	});

    	$$self.$inject_state = $$props => {
    		if ("imgUrl" in $$props) $$invalidate(0, imgUrl = $$props.imgUrl);
    		if ("cat" in $$props) $$invalidate(1, cat = $$props.cat);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("price" in $$props) $$invalidate(3, price = $$props.price);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imgUrl, cat, title, price];
    }

    class SideItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { imgUrl: 0, cat: 1, title: 2, price: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideItem",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*imgUrl*/ ctx[0] === undefined && !("imgUrl" in props)) {
    			console.warn("<SideItem> was created without expected prop 'imgUrl'");
    		}

    		if (/*cat*/ ctx[1] === undefined && !("cat" in props)) {
    			console.warn("<SideItem> was created without expected prop 'cat'");
    		}

    		if (/*title*/ ctx[2] === undefined && !("title" in props)) {
    			console.warn("<SideItem> was created without expected prop 'title'");
    		}

    		if (/*price*/ ctx[3] === undefined && !("price" in props)) {
    			console.warn("<SideItem> was created without expected prop 'price'");
    		}
    	}

    	get imgUrl() {
    		throw new Error("<SideItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgUrl(value) {
    		throw new Error("<SideItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cat() {
    		throw new Error("<SideItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cat(value) {
    		throw new Error("<SideItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<SideItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<SideItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<SideItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<SideItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SelectModelo.svelte generated by Svelte v3.32.2 */
    const file$6 = "src\\SelectModelo.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (30:2) {#if $currentSelection.proyect}
    function create_if_block_3(ctx) {
    	let sideitem;
    	let current;

    	sideitem = new SideItem({
    			props: {
    				imgUrl: /*$currentSelection*/ ctx[4].proyect.fields.imágenThumbnail[0].url,
    				cat: "Proyect",
    				title: /*$currentSelection*/ ctx[4].proyect.fields.Nombre,
    				price: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sideitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sideitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sideitem_changes = {};
    			if (dirty & /*$currentSelection*/ 16) sideitem_changes.imgUrl = /*$currentSelection*/ ctx[4].proyect.fields.imágenThumbnail[0].url;
    			if (dirty & /*$currentSelection*/ 16) sideitem_changes.title = /*$currentSelection*/ ctx[4].proyect.fields.Nombre;
    			sideitem.$set(sideitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sideitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sideitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sideitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(30:2) {#if $currentSelection.proyect}",
    		ctx
    	});

    	return block;
    }

    // (39:2) {#if $currentSelection.modelo}
    function create_if_block_2(ctx) {
    	let sideitem;
    	let current;

    	sideitem = new SideItem({
    			props: {
    				imgUrl: /*$currentSelection*/ ctx[4].modelo.fields.imágenThumbnail[0].url,
    				cat: "Modelo",
    				title: /*$currentSelection*/ ctx[4].modelo.fields.Nombre,
    				price: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sideitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sideitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sideitem_changes = {};
    			if (dirty & /*$currentSelection*/ 16) sideitem_changes.imgUrl = /*$currentSelection*/ ctx[4].modelo.fields.imágenThumbnail[0].url;
    			if (dirty & /*$currentSelection*/ 16) sideitem_changes.title = /*$currentSelection*/ ctx[4].modelo.fields.Nombre;
    			sideitem.$set(sideitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sideitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sideitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sideitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(39:2) {#if $currentSelection.modelo}",
    		ctx
    	});

    	return block;
    }

    // (50:0) {#if loading || showSelect}
    function create_if_block$1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "select-modal");
    			add_location(div, file$6, 50, 2, 1084);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_2*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 150 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 150 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(50:0) {#if loading || showSelect}",
    		ctx
    	});

    	return block;
    }

    // (60:4) {:else}
    function create_else_block(ctx) {
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t4;
    	let div3;
    	let each_value_1 = /*$proyectos*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$modelos*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Select Project";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Select Model";
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "modal-title");
    			add_location(div0, file$6, 61, 8, 1353);
    			attr_dev(div1, "class", "select-proyectos");
    			add_location(div1, file$6, 62, 8, 1408);
    			attr_dev(div2, "class", "modal-title");
    			add_location(div2, file$6, 81, 8, 1954);
    			attr_dev(div3, "class", "select-modelos");
    			add_location(div3, file$6, 82, 8, 2007);
    			attr_dev(div4, "class", "select-modal-bg");
    			add_location(div4, file$6, 60, 6, 1314);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$proyectos, $currentSelection*/ 17) {
    				each_value_1 = /*$proyectos*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$modelos, $currentSelection, getOpciones, showSelect*/ 22) {
    				each_value = /*$modelos*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(60:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:4) {#if loading}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "loading";
    			attr_dev(div, "class", "loading");
    			add_location(div, file$6, 58, 6, 1259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(58:4) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (64:10) {#each $proyectos as proyect}
    function create_each_block_1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*proyect*/ ctx[12].fields.Nombre + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(img, "class", "proyect-img");
    			if (img.src !== (img_src_value = /*proyect*/ ctx[12].fields.imágenThumbnail[1].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 68, 14, 1635);
    			attr_dev(div0, "class", "proyect-title");
    			add_location(div0, file$6, 74, 14, 1797);
    			attr_dev(div1, "class", "select-proyect");
    			toggle_class(div1, "selected", /*proyect*/ ctx[12] == /*$currentSelection*/ ctx[4].proyect);
    			add_location(div1, file$6, 64, 12, 1493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$proyectos*/ 1 && img.src !== (img_src_value = /*proyect*/ ctx[12].fields.imágenThumbnail[1].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$proyectos*/ 1 && t1_value !== (t1_value = /*proyect*/ ctx[12].fields.Nombre + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$proyectos, $currentSelection*/ 17) {
    				toggle_class(div1, "selected", /*proyect*/ ctx[12] == /*$currentSelection*/ ctx[4].proyect);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(64:10) {#each $proyectos as proyect}",
    		ctx
    	});

    	return block;
    }

    // (84:10) {#each $modelos as modelo}
    function create_each_block$3(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*modelo*/ ctx[9].fields.Nombre + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*modelo*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(img, "class", "modelo-img");
    			if (img.src !== (img_src_value = /*modelo*/ ctx[9].fields.imágenThumbnail[1].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 93, 14, 2434);
    			attr_dev(div0, "class", "modelo-title");
    			add_location(div0, file$6, 98, 14, 2592);
    			attr_dev(div1, "class", "select-modelo");
    			toggle_class(div1, "selected", /*modelo*/ ctx[9] == /*$currentSelection*/ ctx[4].modelo);
    			add_location(div1, file$6, 84, 12, 2087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", stop_propagation(click_handler_1), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$modelos*/ 2 && img.src !== (img_src_value = /*modelo*/ ctx[9].fields.imágenThumbnail[1].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$modelos*/ 2 && t1_value !== (t1_value = /*modelo*/ ctx[9].fields.Nombre + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$modelos, $currentSelection*/ 18) {
    				toggle_class(div1, "selected", /*modelo*/ ctx[9] == /*$currentSelection*/ ctx[4].modelo);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(84:10) {#each $modelos as modelo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let t4;
    	let t5;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$currentSelection*/ ctx[4].proyect && create_if_block_3(ctx);
    	let if_block1 = /*$currentSelection*/ ctx[4].modelo && create_if_block_2(ctx);
    	let if_block2 = (/*loading*/ ctx[3] || /*showSelect*/ ctx[2]) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Editar";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Mi Casa";
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(div0, "class", "editar");
    			add_location(div0, file$6, 20, 2, 391);
    			attr_dev(div1, "class", "select-section-title");
    			add_location(div1, file$6, 28, 2, 503);
    			attr_dev(div2, "class", "mi-casa");
    			add_location(div2, file$6, 19, 0, 366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t4);
    			if (if_block1) if_block1.m(div2, null);
    			insert_dev(target, t5, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$currentSelection*/ ctx[4].proyect) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$currentSelection*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div2, t4);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$currentSelection*/ ctx[4].modelo) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$currentSelection*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*loading*/ ctx[3] || /*showSelect*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*loading, showSelect*/ 12) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t5);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let loading;
    	let $loadingOpciones;
    	let $proyectos;
    	let $modelos;
    	let $currentSelection;
    	validate_store(loadingOpciones, "loadingOpciones");
    	component_subscribe($$self, loadingOpciones, $$value => $$invalidate(5, $loadingOpciones = $$value));
    	validate_store(proyectos, "proyectos");
    	component_subscribe($$self, proyectos, $$value => $$invalidate(0, $proyectos = $$value));
    	validate_store(modelos, "modelos");
    	component_subscribe($$self, modelos, $$value => $$invalidate(1, $modelos = $$value));
    	validate_store(currentSelection, "currentSelection");
    	component_subscribe($$self, currentSelection, $$value => $$invalidate(4, $currentSelection = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectModelo", slots, []);
    	let showSelect = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectModelo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(2, showSelect = true);
    	};

    	const click_handler_1 = modelo => {
    		set_store_value(currentSelection, $currentSelection.modelo = modelo, $currentSelection);
    		getOpciones(modelo.fields.Nombre);
    		$$invalidate(2, showSelect = false);
    	};

    	const click_handler_2 = () => {
    		if (!loading) $$invalidate(2, showSelect = false);
    	};

    	$$self.$capture_state = () => ({
    		modelos,
    		proyectos,
    		currentSelection,
    		getOpciones,
    		loadingOpciones,
    		fade,
    		SideItem,
    		showSelect,
    		loading,
    		$loadingOpciones,
    		$proyectos,
    		$modelos,
    		$currentSelection
    	});

    	$$self.$inject_state = $$props => {
    		if ("showSelect" in $$props) $$invalidate(2, showSelect = $$props.showSelect);
    		if ("loading" in $$props) $$invalidate(3, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$loadingOpciones, $proyectos, $modelos*/ 35) {
    			$$invalidate(3, loading = $loadingOpciones || $proyectos.length == 0 || $modelos.length == 0);
    		}
    	};

    	return [
    		$proyectos,
    		$modelos,
    		showSelect,
    		loading,
    		$currentSelection,
    		$loadingOpciones,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class SelectModelo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectModelo",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Listo.svelte generated by Svelte v3.32.2 */

    const { Object: Object_1$1 } = globals;
    const file$7 = "src\\Listo.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (24:4) {#if Object.keys($cart).length > 0}
    function create_if_block$2(ctx) {
    	let div;
    	let each_value = Object.keys(/*$cart*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "listo-items");
    			add_location(div, file$7, 24, 6, 725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*showAttribute, Object, $cart, dispatch, formatCurrency*/ 5) {
    				each_value = Object.keys(/*$cart*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(24:4) {#if Object.keys($cart).length > 0}",
    		ctx
    	});

    	return block;
    }

    // (26:8) {#each Object.keys($cart) as item, idx}
    function create_each_block$4(ctx) {
    	let div3;
    	let div0;
    	let t0_value = `${/*idx*/ ctx[9]}.${/*item*/ ctx[7]}:` + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = `${/*$cart*/ ctx[0][/*item*/ ctx[7]].fields.opción_nombre}` + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = formatCurrency(/*$cart*/ ctx[0][/*item*/ ctx[7]].fields.precio) + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*item*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(div0, "class", "listo-item-atributo");
    			add_location(div0, file$7, 33, 12, 996);
    			attr_dev(div1, "class", "listo-item-nombre");
    			add_location(div1, file$7, 36, 12, 1098);
    			attr_dev(div2, "class", "listo-item-precio");
    			add_location(div2, file$7, 39, 12, 1218);
    			attr_dev(div3, "class", "listo-item");
    			add_location(div3, file$7, 26, 10, 811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, t4);
    			append_dev(div3, t5);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$cart*/ 1 && t0_value !== (t0_value = `${/*idx*/ ctx[9]}.${/*item*/ ctx[7]}:` + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$cart*/ 1 && t2_value !== (t2_value = `${/*$cart*/ ctx[0][/*item*/ ctx[7]].fields.opción_nombre}` + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$cart*/ 1 && t4_value !== (t4_value = formatCurrency(/*$cart*/ ctx[0][/*item*/ ctx[7]].fields.precio) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(26:8) {#each Object.keys($cart) as item, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t1;
    	let div1;
    	let t2_value = formatCurrency(/*total*/ ctx[1]) + "";
    	let t2;
    	let t3;
    	let show_if = Object.keys(/*$cart*/ ctx[0]).length > 0;
    	let t4;
    	let div2;
    	let div4_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "COSTO ESTIMADO DE ATRIBUTOS";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			div2 = element("div");
    			div2.textContent = "← Back";
    			attr_dev(div0, "class", "listo-title");
    			add_location(div0, file$7, 21, 4, 558);
    			attr_dev(div1, "class", "listo-total");
    			add_location(div1, file$7, 22, 4, 622);
    			attr_dev(div2, "class", "listo-close-btn");
    			add_location(div2, file$7, 46, 4, 1394);
    			attr_dev(div3, "class", "listo-bg");
    			add_location(div3, file$7, 20, 2, 505);
    			attr_dev(div4, "class", "listo");
    			add_location(div4, file$7, 13, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[5], false, false, false),
    					listen_dev(div3, "click", stop_propagation(/*click_handler*/ ctx[3]), false, false, true),
    					listen_dev(div4, "click", /*click_handler_3*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*total*/ 2) && t2_value !== (t2_value = formatCurrency(/*total*/ ctx[1]) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$cart*/ 1) show_if = Object.keys(/*$cart*/ ctx[0]).length > 0;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div3, t4);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 150 }, true);
    				div4_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 150 }, false);
    			div4_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			if (detaching && div4_transition) div4_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let total;
    	let $cart;
    	validate_store(cart, "cart");
    	component_subscribe($$self, cart, $$value => $$invalidate(0, $cart = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Listo", slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Listo> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler_1 = item => {
    		showAttribute(item);
    		dispatch("closeListo");
    	};

    	const click_handler_2 = () => {
    		dispatch("closeListo");
    	};

    	const click_handler_3 = () => {
    		dispatch("closeListo");
    	};

    	$$self.$capture_state = () => ({
    		cart,
    		showAttribute,
    		createEventDispatcher,
    		formatCurrency,
    		fade,
    		dispatch,
    		total,
    		$cart
    	});

    	$$self.$inject_state = $$props => {
    		if ("total" in $$props) $$invalidate(1, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$cart*/ 1) {
    			$$invalidate(1, total = Object.keys($cart).reduce(
    				(acc, item) => {
    					return acc + $cart[item].fields.precio;
    				},
    				0
    			));
    		}
    	};

    	return [
    		$cart,
    		total,
    		dispatch,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Listo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Listo",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Cart.svelte generated by Svelte v3.32.2 */
    const file$8 = "src\\Cart.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:2) {#each $cart as item}
    function create_each_block$5(ctx) {
    	let sideitem;
    	let current;

    	sideitem = new SideItem({
    			props: {
    				imgUrl: /*item*/ ctx[4].fields.Render[0].thumbnails.small.url,
    				title: /*item*/ ctx[4].fields.opción_nombre,
    				cat: /*item*/ ctx[4].fields.atributo_nombre,
    				price: /*item*/ ctx[4].fields.precio
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sideitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sideitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sideitem_changes = {};
    			if (dirty & /*$cart*/ 1) sideitem_changes.imgUrl = /*item*/ ctx[4].fields.Render[0].thumbnails.small.url;
    			if (dirty & /*$cart*/ 1) sideitem_changes.title = /*item*/ ctx[4].fields.opción_nombre;
    			if (dirty & /*$cart*/ 1) sideitem_changes.cat = /*item*/ ctx[4].fields.atributo_nombre;
    			if (dirty & /*$cart*/ 1) sideitem_changes.price = /*item*/ ctx[4].fields.precio;
    			sideitem.$set(sideitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sideitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sideitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sideitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(18:2) {#each $cart as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div4;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let current;
    	let each_value = /*$cart*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Mis Atributos";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Total";
    			t4 = space();
    			div3 = element("div");
    			t5 = text(/*totalFormatted*/ ctx[1]);
    			attr_dev(div0, "class", "select-section-title");
    			add_location(div0, file$8, 14, 0, 393);
    			add_location(div1, file$8, 16, 0, 450);
    			attr_dev(div2, "class", "cart-total");
    			add_location(div2, file$8, 28, 2, 727);
    			attr_dev(div3, "class", "cart-sum-num");
    			add_location(div3, file$8, 29, 2, 766);
    			attr_dev(div4, "class", "cart-sum");
    			add_location(div4, file$8, 27, 0, 701);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cart*/ 1) {
    				each_value = /*$cart*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*totalFormatted*/ 2) set_data_dev(t5, /*totalFormatted*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let total;
    	let totalFormatted;
    	let $cart;
    	validate_store(cart, "cart");
    	component_subscribe($$self, cart, $$value => $$invalidate(0, $cart = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cart", slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cart> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		cart,
    		createEventDispatcher,
    		SideItem,
    		dispatch,
    		formatCurrency,
    		total,
    		$cart,
    		totalFormatted
    	});

    	$$self.$inject_state = $$props => {
    		if ("total" in $$props) $$invalidate(2, total = $$props.total);
    		if ("totalFormatted" in $$props) $$invalidate(1, totalFormatted = $$props.totalFormatted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$cart*/ 1) {
    			$$invalidate(2, total = $cart.reduce(
    				(acc, item) => {
    					return acc + item.fields.precio;
    				},
    				0
    			));
    		}

    		if ($$self.$$.dirty & /*total*/ 4) {
    			$$invalidate(1, totalFormatted = formatCurrency(total));
    		}
    	};

    	return [$cart, totalFormatted, total];
    }

    class Cart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cart",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.32.2 */
    const file$9 = "src\\App.svelte";

    // (42:2) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let categorias;
    	let t0;
    	let atributos;
    	let t1;
    	let div2;
    	let div1;
    	let selectmodelo;
    	let t2;
    	let cart;
    	let current;
    	categorias = new Categorias({ $$inline: true });
    	atributos = new Atributos({ $$inline: true });
    	selectmodelo = new SelectModelo({ $$inline: true });
    	cart = new Cart({ $$inline: true });
    	cart.$on("showListo", /*showListo_handler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(categorias.$$.fragment);
    			t0 = space();
    			create_component(atributos.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(selectmodelo.$$.fragment);
    			t2 = space();
    			create_component(cart.$$.fragment);
    			attr_dev(div0, "class", "col-left");
    			add_location(div0, file$9, 42, 4, 1301);
    			attr_dev(div1, "class", "col-right-sticky");
    			add_location(div1, file$9, 47, 6, 1415);
    			attr_dev(div2, "class", "col-right");
    			add_location(div2, file$9, 46, 4, 1384);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(categorias, div0, null);
    			append_dev(div0, t0);
    			mount_component(atributos, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			mount_component(selectmodelo, div1, null);
    			append_dev(div1, t2);
    			mount_component(cart, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(categorias.$$.fragment, local);
    			transition_in(atributos.$$.fragment, local);
    			transition_in(selectmodelo.$$.fragment, local);
    			transition_in(cart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(categorias.$$.fragment, local);
    			transition_out(atributos.$$.fragment, local);
    			transition_out(selectmodelo.$$.fragment, local);
    			transition_out(cart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(categorias);
    			destroy_component(atributos);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(selectmodelo);
    			destroy_component(cart);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(42:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#if showPopup}
    function create_if_block_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Under Maintenance";
    			attr_dev(div, "class", "popup svelte-2n80wz");
    			add_location(div, file$9, 40, 4, 1242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(40:2) {#if showPopup}",
    		ctx
    	});

    	return block;
    }

    // (60:0) {#if showListo}
    function create_if_block$3(ctx) {
    	let listo;
    	let current;
    	listo = new Listo({ $$inline: true });
    	listo.$on("closeListo", /*closeListo_handler*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(listo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(60:0) {#if showListo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let if_block1_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showPopup*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*showListo*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div, "class", "main-app");
    			add_location(div, file$9, 38, 0, 1195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block0.p(ctx, dirty);

    			if (/*showListo*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*showListo*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let showListo = false;
    	let showPopup = false;

    	//get css link from webflow and append (so we wont have to copy paste every webflow publish)
    	//remove before build
    	onMount(() => {
    		if (document.location.hostname == "localhost") {
    			axios$1.get("https://flexhome-3be182.webflow.io/").then(res => {
    				let cssUrl = res.data.match(/https:.*\.css/gm);
    				var link = document.createElement("link");
    				link.href = cssUrl;
    				link.type = "text/css";
    				link.rel = "stylesheet";
    				link.media = "screen,print";
    				document.getElementsByTagName("head")[0].appendChild(link);
    			});
    		}
    	}); // //remomve this part if sebastian gets back to me
    	// setInterval(async () => {
    	//   showPopup = false;
    	//   await tick;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const showListo_handler = () => {
    		$$invalidate(0, showListo = true);
    	};

    	const closeListo_handler = () => {
    		$$invalidate(0, showListo = false);
    	};

    	$$self.$capture_state = () => ({
    		Categorias,
    		Atributos,
    		SelectModelo,
    		Listo,
    		Cart,
    		onMount,
    		tick,
    		axios: axios$1,
    		showListo,
    		showPopup
    	});

    	$$self.$inject_state = $$props => {
    		if ("showListo" in $$props) $$invalidate(0, showListo = $$props.showListo);
    		if ("showPopup" in $$props) $$invalidate(1, showPopup = $$props.showPopup);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showListo, showPopup, showListo_handler, closeListo_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
      target: document.getElementById("app-container"),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
