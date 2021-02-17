
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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

    const mock_opciones = [
      {
        id: "rec0WG26BqJMhyDZu",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén el espacio libre para hacer la instalación de la cocina de tu preferencia.",
          Render: [
            {
              id: "att8CpVlHSeM28Kgl",
              url:
                "https://dl.airtable.com/.attachments/da73fe0cadd5492dffc4977c4ce9630d/c14c7c28/greenlanesolo.bmp",
              filename: "greenlane solo.bmp",
              size: 6684438,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f80f02fd15ff2c1a5009e4caae6a3a6a/5fb54a9a.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fe0bead3b67616defaf2f847f26d44af/f63342ce.png",
                  width: 769,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac1785092776b59ef7eacd5f88e9337c/32e403d3.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec2ogQicdcDdofK7",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Transforma tu hogar en un espacio inteligente. Equípalo con elementos básicos de tecnología para aumentar la seguridad de tu vivienda y para controlar tus diferentes dispositivos electrónicos.",
          Render: [
            {
              id: "attwdZvP0ZFNTjRZd",
              url:
                "https://dl.airtable.com/.attachments/e4ad57b80bf4669235a0cad52ee923e4/968ea934/GREEPAQBASE.jpg",
              filename: "GREE PAQ BASE.jpg",
              size: 421273,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/cdb323d5ebd9032b613948c3deca8327/7125b3b8",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d129ecf1fe6ee17f154bcfbd4f66dec6/23d641bb",
                  width: 827,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/342f256702b02961fae374a59cdc235a/1154be9e",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Domótica",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec38nRWZ6nrH0io1",
        fields: {
          opción_nombre: "Opción B + Extra",
          descripción:
            "Descubre al parrillero experto que tienes dentro con un asador Napoleón y organiza las mejores reuniones. Haz de esas carnes asadas del fin de semana momentos inolvidables con tus familiares y amigos.",
          Render: [
            {
              id: "attrif5lYgZwC9L4B",
              url:
                "https://dl.airtable.com/.attachments/4048dd81d2871678b38f22fdd2f6d726/f04a8767/27_AREADEASADORBLANCOCONASADOR.png",
              filename: "27_AREA DE ASADOR BLANCO CON ASADOR.png",
              size: 15826562,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac127b556915217ed49918ddbef435b6/255f31b5",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/06fc802945a093b1152400e1c2c1bf93/8ddd58fb",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/98ba672822678c74b553c86c8754a5a7/27a367e8",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 130000,
          atributo_nombre: "Asadores",
        },
        createdTime: "2020-11-04T20:18:29.000Z",
      },
      {
        id: "rec3XTdCpHmE4mbNk",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén el espacio de tu alacena libre para instalar los muebles de tu preferencia.\n",
          Render: [
            {
              id: "att8CpVlHSeM28Kgl",
              url:
                "https://dl.airtable.com/.attachments/da73fe0cadd5492dffc4977c4ce9630d/c14c7c28/greenlanesolo.bmp",
              filename: "greenlane solo.bmp",
              size: 6684438,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f80f02fd15ff2c1a5009e4caae6a3a6a/5fb54a9a.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fe0bead3b67616defaf2f847f26d44af/f63342ce.png",
                  width: 769,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac1785092776b59ef7eacd5f88e9337c/32e403d3.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Muebles de Cocina",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec5NZFeWXxkoNFfi",
        fields: {
          opción_nombre: "Opción C",
          descripción:
            "Transforma tu hogar en un espacio inteligente. Equípalo con los elementos de tecnología más avanzados para aumentar la seguridad de tu vivienda y para controlar tus diferentes dispositivos electrónicos.",
          Render: [
            {
              id: "attY2aqEl1533NmwO",
              url:
                "https://dl.airtable.com/.attachments/b9b6a29961830ae4901a89143f5f9f58/1efc0de7/GREEPAQC.jpg",
              filename: "GREE PAQ C.jpg",
              size: 437075,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/bcb5736dac343079b0cc62a19237943f/a76e30dd",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/0d3930e472827d3887a9eb22736dbfe9/4b805f23",
                  width: 827,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/bad637ec54aef7282c3414b9f5e8cdfe/9bfd5d9b",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 60000,
          atributo_nombre: "Domótica",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec6Ubsef3hF6Xmen",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Integra un portón automático con diseño lineal contemporáneo y vistas en madera al acceso principal de tu hogar brindando mayor protección.",
          Render: [
            {
              id: "atthaF0jNiJ1qEu4H",
              url:
                "https://dl.airtable.com/.attachments/7e45f92e8d259541e0014777ce4598fe/4809ef64/07_INLANDPORTONCERCACASA011.png",
              filename: "07_INLAND PORTON CERCA CASA 01 (1).png",
              size: 18130424,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ee99e13172c17de9ab84cac353fac78d/4c5c1c65",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/37cb00c85d8743396be93114dcf7aa5b/2a098fee",
                  width: 795,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/700d2e6c07c89cf743db65d0d4653270/0643aa4f",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 65000,
          atributo_nombre: "Portones",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec85GQVDovPXdrgb",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Mantén todo organizado y a la mano al preparar tus mejores platillos y atender a tus visitas. Lógralo agregando divisores y estantes a tu despensa.",
          Render: [
            {
              id: "att1Dz3GzR8IzaCP5",
              url:
                "https://dl.airtable.com/.attachments/8ead6304a0d5f5886f4d4b2a350421d2/971eaee0/GREENLANEDESPENSA.jpg",
              filename: "GREENLANE DESPENSA.jpg",
              size: 4924547,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/0298c688fc7c1bf9391cf73539b8f10a/e9dca8d9",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/7c2a8b779913193dcd005430c62b3276/b61a284a",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/43b6467e36881a50a817f34a26f80efd/9417464c",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 65000,
          atributo_nombre: "Despensa",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec96MUTG1JQ2qwC8",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén tu espacio libre y listo para la instalación de tu cancelería. \n",
          Render: [
            {
              id: "attDzJujkDVJceXWJ",
              url:
                "https://dl.airtable.com/.attachments/4f387a7f0cd767ba51226275459f5aea/2b530dc0/2020-07-10_14h44_11.png",
              filename: "2020-07-10_14h44_11.png",
              size: 2310121,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/1b7ee48b70af9dcb6020ef41c71125a0/4e1fb8c8",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/eb95262ae73be0714dfea90bda27bd08/ad3157f5",
                  width: 796,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fa93eb35804e459e180a3a47f8f6afc4/1a73f577",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Cancelería",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rec9RJpH8hsUvUJOF",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Reviste con tonalidades claras y dale un estilo único a tu cocina con un ambiente más cálido para ti y tus invitados.",
          Render: [
            {
              id: "attmk50dTHjGzFP2d",
              url:
                "https://dl.airtable.com/.attachments/546b6f53f69b5503f433cdddc8d938c0/b9477aa2/GREENLANEMONARCABASALTOSINFIJOS.jpg",
              filename: "GREENLANE MONARCA BASALTO SIN FIJOS.jpg",
              size: 4315384,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/cb58bd84af9ca4dfc21b1f95f1e29335/3250e6c7",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/15299a8f421c8819468a7fd365070273/4ec73d58",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/41290e919c601a4d74c0a39b96b3311f/15de2801",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Tonalidades de Cocina",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recBcf7zBVagUYLcR",
        fields: {
          opción_nombre: "Opción C",
          descripción:
            "Reviste con las tonalidades medias y dale un estilo único a tu cocina con un ambiente más cálido para ti y tus invitados.",
          Render: [
            {
              id: "att9aMAw1xsgVpwvX",
              url:
                "https://dl.airtable.com/.attachments/df040d41f166ea2a8dde8578b3859ea4/f3e0f0d7/GREENLANEBAGNOLACASHMIRESINFIJOS.jpg",
              filename: "GREENLANE BAGNOLA CASHMIRE SIN FIJOS.jpg",
              size: 4624802,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/90b8dbbf54371efdb3b279a86cd8e0d8/c344ada0",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/78877e73a4814b6f7a7250ab05eedffc/bf9c0d65",
                  width: 824,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f04d506cd6aaf3e61997d77dc9c7d820/ef9d7686",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Tonalidades de Cocina",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recCuJ9xom75psGSY",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Lleva un estilo único a cada nivel de tu hogar  integrando duela en tono greige como parte de los acabados de tus pisos.",
          Render: [
            {
              id: "attTq6Y8fXuBGvfNM",
              url:
                "https://dl.airtable.com/.attachments/d3eec337d392e5b57976feca69cf2f77/fa88202f/Group44.jpg",
              filename: "Group 44.jpg",
              size: 2231495,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/723d3f460e2c6fe6b7b630291c35a1e6/118897c6",
                  width: 67,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d61f3bb9e36131cdb49731d1d77ab818/c22f9b8a",
                  width: 946,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fbb00d27c05e713c5929caedb7eb274c/59940561",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 32000,
          atributo_nombre: "Piso",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recGGflV5I3rCxqrf",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén tu espacio de despensa libre y listo para modularlo a tu preferencia.",
          Render: [
            {
              id: "att8CpVlHSeM28Kgl",
              url:
                "https://dl.airtable.com/.attachments/da73fe0cadd5492dffc4977c4ce9630d/c14c7c28/greenlanesolo.bmp",
              filename: "greenlane solo.bmp",
              size: 6684438,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f80f02fd15ff2c1a5009e4caae6a3a6a/5fb54a9a.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fe0bead3b67616defaf2f847f26d44af/f63342ce.png",
                  width: 769,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac1785092776b59ef7eacd5f88e9337c/32e403d3.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Despensa",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recGtM08bT1k95A8S",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "¡La mejor forma de enriquecer tu cocina! Si lo que buscas es potenciar tu espacio, compleméntalo con un refrigerador y una elegante campana  de diseñador.\n",
          Render: [
            {
              id: "attBwRMegJyXc0djD",
              url:
                "https://dl.airtable.com/.attachments/8e8d2c32d3d66a6718454e4949c97991/0d46dfbd/greenlaneequipos.bmp",
              filename: "greenlane equipos.bmp",
              size: 3275574,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d8564b43e1065f393c6a6e27b42b57c1/173d3ea3.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f69256ec661d2caa3bfb6fa66441580a/c67bb9c3.png",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/42c5c4843c89da623694021b6486c3e2/99ca836b.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 70000,
          atributo_nombre: "Equipamiento de Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recHcPkUGmGmzuVQ1",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Organiza las mejores reuniones y haz de esas carnes asadas del fin de semana momentos inolvidables con tus familiares y amigos. ¡Descubre al parrillero experto que tienes dentro!",
          Render: [
            {
              id: "atthDJVZTKHsat8K5",
              url:
                "https://dl.airtable.com/.attachments/b44f4035842ace9cb913419d5df5aa88/f679dd19/28_AREADEASADORBLANCOSINASADOR.png",
              filename: "28_AREA DE ASADOR BLANCO SIN ASADOR.png",
              size: 15813363,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d4d1304b2d7bae576007152af1298c44/ae16c6f4",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fc2edf0851d97283ce25d1373bd2edff/e3da48cc",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/47a0038e75ff36c22f5969a8da344b14/57051404",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 92000,
          atributo_nombre: "Asadores",
        },
        createdTime: "2020-11-04T20:15:02.000Z",
      },
      {
        id: "recIGiwHZfqLsm3nM",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Haz de tu nueva casa un hogar sustentable y ahorra en tu recibo de luz instalando paneles solares. El solo instalar 4 paneles solares, aproximadamente te permite mantener fresca una recpamara las 24 horas del día.",
          Render: [
            {
              id: "attAcPsMYzUzL3d5A",
              url:
                "https://dl.airtable.com/.attachments/cc5a59174e70f2618cdf7140d8625668/195cb051/31_AZOTEA4PANELES.png",
              filename: "31_AZOTEA 4 PANELES.png",
              size: 15617947,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/20a5ae10538b021a0f78cb451ba63ce8/a130dda1",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/924ba327adf3c68c515cd9f366a536b9/e7a9b161",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/5d03ae27826ef5ba396577074929dcf8/f3d4f2ce",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Paneles Solares",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recKf115tTXz19wJK",
        fields: {
          opción_nombre: "Opción C",
          descripción:
            "Integra un portón automático con diseño cuadricular al acceso principal de tu hogar brindando mayor protección.\n",
          Render: [
            {
              id: "attuN6Ej2NeS6PM1L",
              url:
                "https://dl.airtable.com/.attachments/b4640b02d59270d21b95b698976a0e5d/79833c2e/08_INLANDPORTONCERCACASA021.png",
              filename: "08_INLAND PORTON CERCA CASA 02 (1).png",
              size: 16284033,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/4dddcf0f8ab700c36484787a12e58c6d/19e304ab",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/2d569b9fe527014147e6a32e87a38fee/f26d5d3e",
                  width: 795,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/7edca58cd8aa648d2866ea9990949e5c/ad22e58c",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 65000,
          atributo_nombre: "Portones",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recKs0T8A9tffhFSR",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Transforma tu hogar en un espacio inteligente. Equípalo con elementos de tecnología avanzados para aumentar la seguridad de tu vivienda y para controlar tus diferentes dispositivos electrónicos.",
          Render: [
            {
              id: "attL8JEa3ut7SOUFj",
              url:
                "https://dl.airtable.com/.attachments/cb3c4611d41c2dfa2144bced8b0aaf22/68fbbdcb/GREEPAQB.jpg",
              filename: "GREE PAQ B.jpg",
              size: 434740,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/9610d0a95e730746d7ee2d3b19f7dd2b/e1f7fbea",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/6a5854cac1cac15a217b9e94a7760bb1/5e966976",
                  width: 827,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/dffc0b1ffe94464b5d6d779f590f8a5e/f534fa8e",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 45000,
          atributo_nombre: "Domótica",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recN5oEXgpe6POkG3",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Reviste con tonalidades oscuras y dale un estilo único a tu cocina con un ambiente más cálido para ti y tus invitados.",
          Render: [
            {
              id: "attJTA8CeWoiRcB9W",
              url:
                "https://dl.airtable.com/.attachments/483ed1317181f083f0e1e99c91fa68f6/7f859cc3/GREENLANEMARALUNGAANTRACITASINFIJOS.jpg",
              filename: "GREENLANE MARALUNGA ANTRACITA SIN FIJOS.jpg",
              size: 4222801,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a620de3821afb205aa4c0a02a2ab58ef/ffe3bc5d",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/06a045a29d6797dfe07d6163c2bd7479/d7c6ea55",
                  width: 824,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/89ce5583a9f488d1927ca593167f65cb/55d4ec16",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Tonalidades de Cocina",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recNCpKJxNxJBgoPy",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Incluye un clóset y vestidor color nogal con un diseño elegante y funcional para poner en orden tu habitación organizando tus prendas, zapatos y artículos de higiene personal.",
          Render: [
            {
              id: "attCLQ7qGD5vqt4w7",
              url:
                "https://dl.airtable.com/.attachments/c91aad2192feb1c8515ffbc04cadc9e0/7cb7281d/19_CLOSETSECRECSECNOGAL.png",
              filename: "19_CLOSET SEC REC SEC NOGAL.png",
              size: 13326231,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ab457e941861e0faa0dc7f73fbc6ec72/d15c4872",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fd6d17b27950326acec064f3d596d5d3/bb7a8252",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d5b8ad4bf1b3601d6aff5c1720ebac02/cdeb9a47",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 185000,
          atributo_nombre: "Clósets",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recNyXiZ5XS9wdYkJ",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Si lo que buscas es potenciar tu cocina, compleméntala con un refrigerador y una elegante campana.\n",
          Render: [
            {
              id: "attOGVG1IAWqdEqnp",
              url:
                "https://dl.airtable.com/.attachments/6f43e79ad6dadd88b779c1a7a280ba56/57a6c701/greenlaneequipos.bmp",
              filename: "greenlane equipos.bmp",
              size: 3275574,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/c49bc6c1e9173715ace43206e78ee526/0a7fb188.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/326daab562925299a6c5d0261aa9bd08/5baf221c.png",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/c957d5877831bafae57295131fd61d8b/38e8827f.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 50000,
          atributo_nombre: "Equipamiento de Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recOuIEIkD7wJyM6G",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén tu fachada limpia y el acceso principal sin restricción para tus vehículos. \n",
          Render: [
            {
              id: "attcETXKS542ReyfP",
              url:
                "https://dl.airtable.com/.attachments/3265fda32e5405a49c86d45089fc5687/b9b5b42a/35_INLANDFACHADASINPORTON.png",
              filename: "35_INLAND FACHADA SIN PORTON.png",
              size: 17255386,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/8c3344f5460b5b151674c5f6ecbdf5fd/0b959b3a",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/31777bca86e73d362724228e745bd740/ebf7cfc0",
                  width: 795,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/62fdc3510cf07e53d29f44a95ad636ef/af5b13b6",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Portones",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recP4ep8oFVZnVZ6Y",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén los espacios en tu cocina libres para instalar el refrigerador y campana de tu preferencia.",
          Render: [
            {
              id: "att8CpVlHSeM28Kgl",
              url:
                "https://dl.airtable.com/.attachments/da73fe0cadd5492dffc4977c4ce9630d/c14c7c28/greenlanesolo.bmp",
              filename: "greenlane solo.bmp",
              size: 6684438,
              type: "image/bmp",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f80f02fd15ff2c1a5009e4caae6a3a6a/5fb54a9a.png",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fe0bead3b67616defaf2f847f26d44af/f63342ce.png",
                  width: 769,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac1785092776b59ef7eacd5f88e9337c/32e403d3.png",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Equipamiento de Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recPt6cInNE8haIbo",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Haz de tu nueva casa un hogar sustentable y ahorra en tu recibo de luz instalando paneles solares. El solo instalar 6 paneles solares, aproximadamente te permite mantener fresca una recámara las 24 horas del día.",
          Render: [
            {
              id: "atteUVUzfQnrhejGz",
              url:
                "https://dl.airtable.com/.attachments/35a137ffbc1dd9ac9dc2f87d71842480/74a7ceba/32_AZOTEA6PANELES.png",
              filename: "32_AZOTEA 6 PANELES.png",
              size: 15881750,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/b0d0dc2ee5ea0f671af464b07c006db9/93f0d854",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/44a68c0a686c285ed8d91d51f7feb536/796cd3c5",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/5bc08e13e208d3e616280ef03777ec3d/7e56ad9a",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 20000,
          atributo_nombre: "Paneles Solares",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recQpdkX7SnTQrQWC",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Complementa tu escalera con un increíble barandal de cristal para darle un toque elegante a tu espacio y la seguridad que necesitas.",
          Render: [
            {
              id: "att0gYnDlb4OYe1AW",
              url:
                "https://dl.airtable.com/.attachments/301ba860c5145b468561388052624fe9/c1f42f2d/11_ESCALERASBARANDALDECRISTAL.png",
              filename: "11_ESCALERAS BARANDAL DE CRISTAL.png",
              size: 17727974,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ce1e232c08d22450585c6d67608e72f1/7ca54d0e",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/407247670b124f97203da2cee750c077/2734b7cc",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/3fdb2d2cebdd9bbb2b4014bc3216bc24/ba123504",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 60000,
          atributo_nombre: "Barandales",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recQtgk8pQTcFEfe5",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Incluye un clóset y vestidor color monarca con un diseño elegante y funcional para poner en orden tu habitación organizando tus prendas, zapatos y artículos de higiene personal.",
          Render: [
            {
              id: "attRRtfH1a555Hxk3",
              url:
                "https://dl.airtable.com/.attachments/0666270de7593096422943b94530bfaf/c6479279/18_CLOSETRECSEC.png",
              filename: "18_CLOSET REC SEC.png",
              size: 13794994,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/2b82cadff30e5fc712cdb1621df84f90/21528a58",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/60c6cf669740aa1703a2ca47140e0abf/4317c325",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a4341b53844a9c31dd1b2da1f9d88f55/09ad0c11",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 185000,
          atributo_nombre: "Clósets",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recUZYYQH85e3OsVY",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "¡Haz que el diseño de tu cocina no tenga comparación! Lógralo agregando unos muebles fijos decorativos a tu alacena.",
          Render: [
            {
              id: "attu16zSl5HJu17eI",
              url:
                "https://dl.airtable.com/.attachments/656849d821560c32ddb36249e1cd642b/be60c002/GREENLANEMONARCABASALTOCONFIJOS.jpg",
              filename: "GREENLANE MONARCA BASALTO CON FIJOS.jpg",
              size: 4377828,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f4507d721708f4bb7e1c99646e35c97b/def37721",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/e5213ed6f7287f237470e99f907622f5/fe0de6c8",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/2802ff0cd8408dfd98667339cf27162c/845aebf6",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 40000,
          atributo_nombre: "Muebles de Cocina",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recVWsERfw49CkFlp",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén el espacio libre para instalar un clóset a la medida y aprovechar tu espacio personal. ",
          Render: [
            {
              id: "att9ftGPl3PS5fAJl",
              url:
                "https://dl.airtable.com/.attachments/a55ac548bb37c47443021e156be63d21/623ec4e4/20_CLOSETRECSECSINMUEBLE_RGB.png",
              filename: "20_CLOSET REC SEC SIN MUEBLE_RGB.png",
              size: 12359500,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/8b624c8c96ebba2444431369032c0c99/41bb51c7",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/0d5057f7690b87f0d08167bad8d0ac53/cecf4928",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/62333ceb4c15d668fb1fc7cec8997b5e/7e50fd4d",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Clósets",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recW4CSec0elskXRn",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Lleva un estilo único a cada nivel de tu hogar  integrando duela en tono natural como parte de los acabados de tus pisos.",
          Render: [
            {
              id: "attTKxUR0TPTTV6VW",
              url:
                "https://dl.airtable.com/.attachments/3c6f0621510e1740d18137cae5eaa68b/8b67074c/Group43.jpg",
              filename: "Group 43.jpg",
              size: 2338381,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/dd96480542c57e25ca200a504b453643/ad92fb44",
                  width: 67,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/3a278fb02c7cce862abcdc866db4d6be/397c0e4d",
                  width: 946,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/aeda9465f44ffc4eac009b1602d78664/8101e0ae",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 32000,
          atributo_nombre: "Piso",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recXrKeQ39QTIL2sG",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Complementa tu escalera con un barandal de herrería para darle un toque elegante a tu espacio y la seguridad que necesitas.",
          Render: [
            {
              id: "attvIB3uUpey1TSnm",
              url:
                "https://dl.airtable.com/.attachments/280ae1fc4c6e45638fc86a845f4a56da/ec5f2fce/10_ESCALERASBARANDALMETALICO.png",
              filename: "10_ESCALERAS BARANDAL METALICO.png",
              size: 15720925,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a8202308f0671c37f51c678302c32044/47b554a6",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/e07e822209907913c11f4fcf70db6089/571e26e4",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/6ffae98ea23e11135f7b05cff98b0f69/316aa174",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Barandales",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recZeKER0w1GQ5WLo",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "La cocina es un lugar muy importante en tu casa, hazlo más cálido y funcional. Intégrala a tu casa con la propuesta más equipada y expresa el amor a tus seres queridos en tus platillos con deliciosas creaciones culinarias.",
          Render: [
            {
              id: "attnZGNIfQY5aML7t",
              url:
                "https://dl.airtable.com/.attachments/55da8258b94bc6250632c826bc8a0c75/b50f6dc1/2020-07-07_16h00_50.png",
              filename: "2020-07-07_16h00_50.png",
              size: 2068142,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/3ae98522f5c936231a1656c13f9f311a/8f52a26f",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a8557a3b616076a64d0b2fb2c9315db0/40a71313",
                  width: 770,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f599da9dc356e705c4ab593317119058/e0a27ec3",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 465000,
          atributo_nombre: "Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recbVvlPeOSQEe577",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Dale un estilo único a tu hogar con diferentes acabados en pisos.",
          Render: [
            {
              id: "attQF4iVRo0p0ElGc",
              url:
                "https://dl.airtable.com/.attachments/125f82797241874e1c95b338844f6b73/8839f26c/Group422.jpg",
              filename: "Group 42 (2).jpg",
              size: 2314678,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/db30ca250b5a359ef1aa8ea5f2d26445/d7ee51d3",
                  width: 66,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/9e77f09d2f46788716da15d1027e9dc7/f56335c3",
                  width: 945,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d68749ddf6a920e013700d6017c82a7f/6f8ab294",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Piso",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recdB7pLEC2Uh1TpO",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Extiende la naturaleza a tu patio sin necesidad de regarlo día con día. Decóralo con la instalación de un muro verde artificial y obtén un espacio agradable para reunirte con tus seres queridos.",
          Render: [
            {
              id: "att6pGUMWwRohQUSq",
              url:
                "https://dl.airtable.com/.attachments/f0058ffcd97ff3e0797e14660ae6467b/a1a5a318/30_PATIOCONMUROVERDE.png",
              filename: "30_PATIO CON MURO VERDE.png",
              size: 26015188,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a6ae035e4957e5b06fbc4f5f8f479931/66065a41",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/80146ade999b67060f24c5120c69e766/d226e378",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/9ef8c44ba6e8b704efd9032a3764548f/67c8e39b",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 72000,
          atributo_nombre: "Muro Verde",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recdSEQaV8QrRHuPE",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Integra un portón automático con diseño lineal contemporáneo al acceso principal de tu hogar brindando mayor protección.",
          Render: [
            {
              id: "att3QqU7uMvP1JYWk",
              url:
                "https://dl.airtable.com/.attachments/e24dfff0e4570ba5c718616e6112fdc4/3bfaecc7/09_INLANDCOCHERACERCACASA03.png",
              filename: "09_INLAND COCHERA CERCA CASA 03.png",
              size: 11971479,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d21acaca67def097a16a8f20d2227cda/ab7f4523",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/78084a7cc2ce387fcebd38a1420aaac7/c2af870a",
                  width: 795,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a4e9783a2c3eb6a9593f5cb000a44838/9894136f",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 65000,
          atributo_nombre: "Portones",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "receUFRxTCZSqav5r",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Haz de tu nueva casa un hogar sustentable y ahorra en tu recibo de luz instalando paneles solares. El solo instalar 8 paneles solares, aproximadamente te permite mantener fresca dos recámaras las 24 horas del día.",
          Render: [
            {
              id: "atteJ1ynI726mlbRe",
              url:
                "https://dl.airtable.com/.attachments/bbd140b9a4f21505cde4cf39ffd5babb/836372ee/33_AZOTEA8PANELES.png",
              filename: "33_AZOTEA 8 PANELES.png",
              size: 15978885,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/1c4370d6bd078ffcdd8226cd7952dae1/176a2622",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/09c3e02f65cc7efc212cd49ee842aa49/09e244ab",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/8c97ff5d083061cff9af5fa4ffd4eb32/ceec0d94",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 41000,
          atributo_nombre: "Paneles Solares",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recfcmBVKVhJsQOKZ",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Separa los espacios dentro de tu baño instalando cancelería de cristal templado con herrajes metálicos. Mejora la seguridad en el espacio y reduce accidentes con un cancel de 2.20 metros de altura que además resiste los cambios extremos en la temperatura. ",
          Render: [
            {
              id: "attaH5I9CwvgZGyrl",
              url:
                "https://dl.airtable.com/.attachments/346bc4d0142c8375a6c074e4e7eb0d78/4fd3d0e0/15_BAOPPALCANCEL2_20M_.png",
              filename: "15_BAÑO PPAL CANCEL 2_20 M_.png",
              size: 15410662,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/2e0aab17b00d660e90c82b435cd25cf1/87b29d97",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f04ffa47e3ae4d7760a7fd52852fd308/431c5df9",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/aba66bf104eb1bc09442efa80f971e67/c54f20b3",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 60000,
          atributo_nombre: "Cancelería",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rech0A1frvsxa1uVq",
        fields: {
          opción_nombre: "Opción B",
          descripción:
            "Separa los espacios dentro de tu baño instalando cancelería de cristal templado con herrajes metálicos. Mejora la seguridad en el espacio y reduce accidentes con un cancel de 3.00 metros de altura que además resiste los cambios extremos en la temperatura. ",
          Render: [
            {
              id: "att7XxqfWshypGBHQ",
              url:
                "https://dl.airtable.com/.attachments/0398e9462f5771123734ba645d09735f/9f985410/16_BAOPPACANCEL2_95.png",
              filename: "16_BAÑO PPAÑ CANCEL 2_95.png",
              size: 15237810,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/c3079efe9e51cbb52e61c87ed0b38c12/f9ef03a0",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/20e5aefa0347b6bce2bbb6f01ab9386a/92def9ca",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ca8df2fb82cd7b60c10fd5e470e22b18/e75954ed",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 80000,
          atributo_nombre: "Cancelería",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "rechXK6bgTf8gmhp8",
        fields: {
          opción_nombre: "Opción A + Extra",
          descripción:
            "Descubre al parrillero experto que tienes dentro con un asador Napoleón y organiza las mejores reuniones. Haz de esas carnes asadas del fin de semana momentos inolvidables con tus familiares y amigos.",
          Render: [
            {
              id: "attrif5lYgZwC9L4B",
              url:
                "https://dl.airtable.com/.attachments/4048dd81d2871678b38f22fdd2f6d726/f04a8767/27_AREADEASADORBLANCOCONASADOR.png",
              filename: "27_AREA DE ASADOR BLANCO CON ASADOR.png",
              size: 15826562,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ac127b556915217ed49918ddbef435b6/255f31b5",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/06fc802945a093b1152400e1c2c1bf93/8ddd58fb",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/98ba672822678c74b553c86c8754a5a7/27a367e8",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 130000,
          atributo_nombre: "Asadores",
        },
        createdTime: "2020-09-30T15:54:17.000Z",
      },
      {
        id: "reckgGgX2eXKTpZ7U",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Aprovecha el amplio espacio libre en la tercera planta de tu casa para adecuarlo a tus necesidades. ",
          Render: [
            {
              id: "attgSlpeXkVnrPb7R",
              url:
                "https://dl.airtable.com/.attachments/c78fb70c3f0824773deca3355d3b3037/f74e2f2e/GRE-TERCERNIVEL_basetrans.jpg",
              filename: "GRE-TERCER NIVEL_base trans.jpg",
              size: 4106400,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/72fee0bb4876b02ddb36720b1115d904/2968e48d",
                  width: 45,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/8af6604cb36d129346f0bb8acaef6626/cbcae5dd",
                  width: 640,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/813f19f06a640b927e5af38f013d3f4e/d7f4f574",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Flex Room",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recnNQbfZgLdww9SC",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Organiza las mejores reuniones y haz de esas carnes asadas del fin de semana momentos inolvidables con tus familiares y amigos. ¡Descubre al parrillero experto que tienes dentro!",
          Render: [
            {
              id: "atthDJVZTKHsat8K5",
              url:
                "https://dl.airtable.com/.attachments/b44f4035842ace9cb913419d5df5aa88/f679dd19/28_AREADEASADORBLANCOSINASADOR.png",
              filename: "28_AREA DE ASADOR BLANCO SIN ASADOR.png",
              size: 15813363,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d4d1304b2d7bae576007152af1298c44/ae16c6f4",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/fc2edf0851d97283ce25d1373bd2edff/e3da48cc",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/47a0038e75ff36c22f5969a8da344b14/57051404",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 80000,
          atributo_nombre: "Asadores",
        },
        createdTime: "2020-09-30T15:54:17.000Z",
      },
      {
        id: "recrYWKs1CDmpq4is",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "La cocina es un lugar muy importante en tu casa, hazlo más cálido y funcional. Intégrala a tu casa y expresa el amor a tus seres queridos en tus platillos con deliciosas creaciones culinarias.",
          Render: [
            {
              id: "attQgENZOqLHAGtxT",
              url:
                "https://dl.airtable.com/.attachments/34caff85647065f1bbcfe22df4df93ee/37276c3a/GREENLANESINEQUIPOSSINFIJOS.jpg",
              filename: "GREENLANE SIN EQUIPOS SIN FIJOS.jpg",
              size: 5496873,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f0c7caa9d42abf19eae73cd5fad5b88f/eda4cf81",
                  width: 54,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/73940750cdbd4fc43e06aca1ff387318/e2ab046c",
                  width: 768,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/ff5c312eef27fa10d92835bb58e166e3/d908d5de",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 425000,
          atributo_nombre: "Cocinas",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recrzEV6kgJpohclv",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén un amplio espacio libre en terraza para adecuarlo a tus necesidades. ",
          Render: [
            {
              id: "attHbAGUHREYcsbat",
              url:
                "https://dl.airtable.com/.attachments/874c52bfe5ddd936aed92e2152cc79fd/43733348/26_AREADEASADORESPACIOLIBRE.png",
              filename: "26_AREA DE ASADOR ESPACIO LIBRE.png",
              size: 15395249,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/9e5bbfc6db8c08c669dd9cb2e560eb02/5a5d0569",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/3ec7333dac2e94ccf5155e92269c7f78/7c9e3e8c",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/7927a50028626231d2167535ba13171c/fd1cce38",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Asadores",
        },
        createdTime: "2020-09-30T15:54:17.000Z",
      },
      {
        id: "recvZNqSoG4Dj9Plm",
        fields: {
          opción_nombre: "Básico",
          descripción:
            "Mantén libres las paredes de tu patio, deja volar tu imaginación y decóralas como siempre imaginaste. Disfruta un espacio más para reunirte con tus seres queridos.",
          Render: [
            {
              id: "attt4E0Ijnd72InL3",
              url:
                "https://dl.airtable.com/.attachments/e4e72e1f4716ff59beacd56a96fe7691/8e9c0e69/29_PATIOSINMUROVERDE.png",
              filename: "29_PATIO SIN MURO VERDE.png",
              size: 22938334,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/21f1ab57959e013f5a555c755ffec76b/62b0e681",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/3b6d11f103f2d2598b2f2785b1da8733/3a7782e7",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/2074a7ab2889723483ef6eefe77cd487/ee609e7b",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 0,
          atributo_nombre: "Muro Verde",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recwMcNUxbGTCdZ9O",
        fields: {
          opción_nombre: "Opción C",
          descripción:
            "Haz de tu nueva casa un hogar sustentable y ahorra en tu recibo de luz instalando paneles solares. El solo instalar 10 paneles solares, aproximadamente te permite mantener fresca tres recámaras las 24 horas del día.",
          Render: [
            {
              id: "att7aUOygSogmT2A2",
              url:
                "https://dl.airtable.com/.attachments/2752e55038dba2f951016c39fc41ca3b/1f0d4160/34_AZOTEA10PANELES.png",
              filename: "34_AZOTEA 10 PANELES.png",
              size: 16445104,
              type: "image/png",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/5ac4d9dbfa237fd0d4dbe89256eba85d/5855c845",
                  width: 56,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/e11ee3af254abdfa05ff930872f9e03e/426d6029",
                  width: 794,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/a846a70e0ab161e8dc46614699ff05dd/07c1c486",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 60000,
          atributo_nombre: "Paneles Solares",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "recwRymWVy2AIVlv5",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "¿Necesitas otra recámara, un gimnasio o bien una oficina, en el tercer nivel de tu casa? En Península Park Living lo puedes tener. Acondiciona tu espacio para que lo aproveches a tu manera.",
          Render: [
            {
              id: "attleiEsgloHOvmhI",
              url:
                "https://dl.airtable.com/.attachments/23f5a25c8a3f57ffea166364f9f615e5/a9c671a9/GRE-TERCERNIVEL_baseFLEXtrans.jpg",
              filename: "GRE-TERCER NIVEL_base FLEX trans.jpg",
              size: 4105829,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/029fc5226e5c784b21eeec12ca614491/efdc2660",
                  width: 45,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/d294ae93867ae676020a105d2fbd1a8f/db420437",
                  width: 640,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/f43e44b7457ecdc3fa26f3dc47c2b4f6/f47d0dc8",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 35000,
          atributo_nombre: "Flex Room",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
      {
        id: "reczLe4Q2klq9kc5W",
        fields: {
          opción_nombre: "Opción A",
          descripción:
            "Transforma tu hogar en un espacio inteligente. Equípalo con elementos de tecnología para aumentar la seguridad de tu vivienda y para controlar tus diferentes dispositivos electrónicos.",
          Render: [
            {
              id: "attNkdBJxQddpfztv",
              url:
                "https://dl.airtable.com/.attachments/88b2519c0a1de6f499541a4e1a44cb02/b5484285/GREEPAQA.jpg",
              filename: "GREE PAQ A.jpg",
              size: 435947,
              type: "image/jpeg",
              thumbnails: {
                small: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/4cd6e1cee0a548cd4b0a59b206f817d0/30551ea6",
                  width: 58,
                  height: 36,
                },
                large: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/9af265c514f2f4fb9c3bd963a3261281/3ef272c8",
                  width: 827,
                  height: 512,
                },
                full: {
                  url:
                    "https://dl.airtable.com/.attachmentThumbnails/1dbfdf3bc41f815f698c7a20dc6d1842/d2fae3e9",
                  width: 3000,
                  height: 3000,
                },
              },
            },
          ],
          detalleDePrecio:
            "¡Recibe y disfruta de tu vivienda personalizada 8 semanas después de tu escrituración!",
          precio: 25000,
          atributo_nombre: "Domótica",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
    ];

    const mock_modelos = [
      {
        id: "recj0jJ6DFRi3mmtx",
        fields: {
          Nombre: "Greenlane",
          Fraccionamiento: ["recunm26MjQp3daSq"],
          "Atributos en Viviendas":
            "Portones en Greenlane, Cocinas en Greenlane, Equipamiento de Cocinas en Greenlane, Muebles de Cocina en Greenlane, Despensa en Greenlane, Tonalidades de Cocina en Greenlane, Piso en Greenlane, Flex Room en Greenlane, Barandales en Greenlane, Asadores en Greenlane, Cancelería en Greenlane, Clósets en Greenlane, Domótica en Greenlane, Paneles Solares en Greenlane, Muro Verde en Greenlane",
          "Opciones de Atributos en Viviendas": [
            "recrzEV6kgJpohclv",
            "recnNQbfZgLdww9SC",
            "rechXK6bgTf8gmhp8",
            "recXrKeQ39QTIL2sG",
            "recQpdkX7SnTQrQWC",
            "rec96MUTG1JQ2qwC8",
            "recfcmBVKVhJsQOKZ",
            "rech0A1frvsxa1uVq",
            "recVWsERfw49CkFlp",
            "recNCpKJxNxJBgoPy",
            "recQtgk8pQTcFEfe5",
            "rec0WG26BqJMhyDZu",
            "recrYWKs1CDmpq4is",
            "recZeKER0w1GQ5WLo",
            "recGGflV5I3rCxqrf",
            "rec85GQVDovPXdrgb",
            "rec2ogQicdcDdofK7",
            "reczLe4Q2klq9kc5W",
            "recKs0T8A9tffhFSR",
            "rec5NZFeWXxkoNFfi",
            "recP4ep8oFVZnVZ6Y",
            "recNyXiZ5XS9wdYkJ",
            "recGtM08bT1k95A8S",
            "reckgGgX2eXKTpZ7U",
            "recwRymWVy2AIVlv5",
            "rec3XTdCpHmE4mbNk",
            "recUZYYQH85e3OsVY",
            "recvZNqSoG4Dj9Plm",
            "recdB7pLEC2Uh1TpO",
            "recIGiwHZfqLsm3nM",
            "recPt6cInNE8haIbo",
            "receUFRxTCZSqav5r",
            "recwMcNUxbGTCdZ9O",
            "recbVvlPeOSQEe577",
            "recW4CSec0elskXRn",
            "recCuJ9xom75psGSY",
            "recOuIEIkD7wJyM6G",
            "recdSEQaV8QrRHuPE",
            "rec6Ubsef3hF6Xmen",
            "recKf115tTXz19wJK",
            "rec9RJpH8hsUvUJOF",
            "recN5oEXgpe6POkG3",
            "recBcf7zBVagUYLcR",
            "recHcPkUGmGmzuVQ1",
            "rec38nRWZ6nrH0io1",
          ],
          idWebflow: "5f9c50cd2341d08171d1781b",
          "ID Salesforce": "176",
          "Opciones de Atributos en Viviendas copy": [
            "recjMo7p4my8BKmk1",
            "recf0AnyJmAWJZjR8",
            "rec9auiu0Z4RtProE",
            "recPEuq9NfFCVecrc",
            "recICXwgRYcC3U0V8",
            "rec1jw6cq7yzfTGBE",
            "rec7p6Neu16sFjYJv",
            "rec9dkdybBhgnuEUW",
            "recN9cQaZCTSPNPkV",
            "recFP9W2hTmsOJyO4",
            "recIG0wr9WIVS7pdB",
            "recS9qeplwyvu1NY0",
            "recjbGWLLIs5CTehY",
            "recRruQaKCQp3y6KU",
            "recyTZxePOSaP0AqL",
            "rec0iq2enukyaGBfH",
            "recUB02BWj1mqRpJD",
            "recrYYg9Mqa9mNm4s",
            "recCFK5rkfiYsKPRn",
            "recX0JRxG3m3BgPeO",
            "recHhYBr8LKIAo95u",
            "recFLHuiP3HSJG8jf",
            "recyGwcrVZQ3myK7o",
            "recctqsgMkMt6S96q",
            "reco4iyfFERjVovuB",
            "recVaDpV9NbnhPlMQ",
            "recMcIa9reUXghCUu",
            "recncxCb8MTmwCZkS",
            "rec5ORB4oIRDuu3ok",
            "recAT2I0JlfuFPdmi",
            "recHGQo17TtRuDSaU",
            "rec67p3QDIOBDDF4X",
            "recoZWZdhhvCPG98k",
            "rec38fx8YUHzRHf6D",
            "recOhm4xW634FN7QT",
            "recuHtlQ8sWOCVQRu",
            "recGHsQ14JWfW1W5c",
            "rec55o2tFeFa4aEOa",
            "recY7VExZ96ojqwdT",
            "recCsLdodZMieCGIg",
            "rec14tB0SnhDInTNb",
            "recFi8Qg0v3P2huFz",
            "rectpZjSl1ZZ7rVbn",
            "reczpzwdqsv5MX5Px",
            "recVl73fJccaUtsnx",
          ],
          "ID Salesforce 2": "176",
          "Opciones de Atributos en Viviendas 2 copy": [
            "recItxbcTWBrPbZnH",
            "recEHJrlyWDfXqWUO",
            "recyRDmhPz7aHg4rk",
            "recelDuWCPIV9FPuS",
            "rec7j6A3GyfVhlDYO",
            "recq0FaZfHBStkjEk",
            "recw6fR1jB9LTKBMb",
            "recyUthl0bkzBVhXC",
            "reccQlUXOcWb3esnB",
            "rec4wi0P6tpL2abRK",
            "rec7n9AeYwLe6y2gh",
            "rechQzica6BOIsq1G",
            "recISP0yAivoQkRkE",
            "recg8DUXzcTIhZJNA",
            "recXA8B1EoVt3rdtr",
            "recpZz61c4nRo7ein",
            "recji96oLT4FEi2Mj",
            "recQF7kWB0dsAeZ78",
            "rec1mT9e9PlhGbsU3",
            "recmHSVkvDpmPHshu",
            "rec6Y7FeXlN1OPM8a",
            "rec4sQy5EDKbX7LmV",
            "recXnFgeKzTmAZna4",
            "recBazw3BUPMkjM96",
            "recNLrC2ueUC9P8xh",
            "reckRMtIYneGvgYPw",
            "recbTReWgOXguIfXa",
            "recMTGGYXmWFK3Cny",
            "recuv0FRdiUWIVGr0",
            "recZAbMNyViNTgQpY",
            "rec6nZsOWtwaI4vdA",
            "recvOy7DsiRUR4i7D",
            "recNG5306RyV37Mb0",
            "recsPoBVNuKS58S9j",
            "recdYv8kLG6nTeKTz",
            "recToCpDX2Z7QmtUa",
            "rec5oBUOTjZyasz8S",
            "recuMx6guOItiBhRQ",
            "recnO4IkOJ9HxR9gz",
            "rec19Uhb2zPBs3jLW",
            "recqLCFNHXkWWOwQR",
            "rec4ZhU3P568gI7If",
            "recS68nFaB2ilSye3",
            "recY6IA0f2yo0oISd",
            "reck2g72yMft8U5qd",
          ],
          "Proyecto-Modelo": "Península-Greenlane",
        },
        createdTime: "2020-09-29T20:39:03.000Z",
      },
      {
        id: "recyqNCh3Wb7EzrvO",
        fields: {
          Nombre: "Inland",
          Fraccionamiento: ["recunm26MjQp3daSq"],
          "Atributos en Viviendas": "pe",
          "Opciones de Atributos en Viviendas": [
            "rec7fJPGqHOrsaJvx",
            "recW2fbab7utfklAX",
            "recNheqFQfYgbjvRx",
            "recmgbbFKgCubfls8",
            "recfUJqRoNJh3uh94",
            "recuRKXBlOhmp5owI",
            "recULnle4IcsKqIa7",
            "recC82VSjkClAI5Jq",
            "recRQlpSwYNumlXf0",
            "reckLXXmwH7CkrwGM",
            "recEQ2GZKRwcfByqQ",
            "recrUrixiJ9nVZ6DF",
            "recksBcqWn2eiPzci",
            "recTW55rc4EX6zEYe",
            "rec2mLCI17KZvI9Yb",
            "recX5OrNYbmQxbHsj",
            "recVEG180Mccv67nZ",
            "recIn77MaijeHzREb",
            "recm1fLSeLKnVHi6H",
            "recRGmQKcO9oxDPUt",
            "recQBwGLcrazoyQA9",
            "rec2IjktPZG3e7wDi",
            "recZv8PhJ1iiswq6k",
            "recBTUQ00wcMhJwq4",
            "recal9jpaphmyt3KE",
            "recuIcW8FNkTl9USf",
            "recgWSG9VtNqGTfl0",
            "recpp092eMPvCMWzz",
            "recZAep30iAt3XrxK",
            "rec7mwuOZYBLibuko",
            "recLXJ44XhRPiJwgu",
            "recH0jIFXPTXmE8OW",
            "recX03yDSf1Zjet7P",
            "receNersKBF0ArK2d",
            "rec0LUMCt9hdtbpU1",
            "recu4hM0bTQsdImic",
            "recZQbACIK3jAHRAz",
            "recV7t8Q8EZJ4NCRU",
            "recmJm1E4oTGaSVug",
            "rec7Fi5yEJgOm9n2o",
            "recjmOOvN4fpzTNEe",
            "recGyyEhMsbmAJCWQ",
            "recnni5sisXKU3cpV",
            "recf6TyHNsc4OAfl7",
            "recJGEvUzHi1Hne3j",
          ],
          idWebflow: "5f9c50d30e2086f9854b4053",
          "ID Salesforce": "177",
          "Opciones de Atributos en Viviendas copy": [
            "recZst1ZaNDaFDTu3",
            "recOfZntVdjcsNvzt",
            "recFuYCYAlNZoMFQ3",
            "recetVnYumrdoIvrE",
            "rec77tCa8Ty0gXr8A",
            "recm4u9U5U65Cyyve",
            "recMY7xxOO1bXTS9D",
            "reculM7b3qr4NbfIW",
            "recJ35Bbg4CdzO7ew",
            "reccYH9FgNWlxUGFi",
            "recw3MSiuXlVs4Ipm",
            "recj7buQ2PY68sgCb",
            "reccFloJGtRXviJbO",
            "recL9PhKWatGj2OXK",
            "recUzvO1LdzIIbjXH",
            "recPiyD6IhbzKERrP",
            "recNRqdrKS1VIzhmv",
            "recAARj5Uo8XU21DH",
            "receeZXbYRz68as5d",
            "recJT623WUY7K6ZTZ",
            "recIOgS4WxZiB10zF",
            "recUV3wMz5vMrAGCO",
            "recRIS1At771FZA5Q",
            "rect6E2jKC1vucGpA",
            "rec2yTvIUv65LWdJa",
            "recmVW8rpT9CyC4RL",
            "rec89CSsFzC9Tmpkw",
            "rechCKllYSEePf6y5",
            "recRNYBmKopcgqBwg",
            "recZzgG7J4quvEEjU",
            "recDatgnHnGyvcGf0",
            "reczd3UYHVIGz7iNs",
            "recPdNKWClQIwHD6l",
            "rec60YDLuHuJNUU1J",
            "recSYEYVdf6WGEzTx",
            "recmh1YjVZFbqbwhI",
            "recR3VMVsQS2Na1z5",
            "recNkdk9SKOshgMQq",
            "receW6dXOuIpnl5tM",
            "recZS2hRoP5xzCx1U",
            "recbzy0Oxa48MmXDK",
            "recyLiQAwy05NcMVm",
            "recfA2hL2yMt7wmor",
            "rec7jDK0xy1N13pkD",
            "recBToHdjN7KUQo2P",
          ],
          "ID Salesforce 2": "177",
          "Opciones de Atributos en Viviendas 2 copy": [
            "reco9C5MZnGtT4wxJ",
            "recdW8rgKNmvGe8C9",
            "rec4b7GLpVQiCdiTJ",
            "recDa4rLjWuwC98uk",
            "recwOCGXXtBjuo4bg",
            "recLLDdHUu9oQZbyU",
            "recbFgBkDo4ubkvcj",
            "recT2VbYS0un1CSLC",
            "rec8KeFY5EFwNfKhc",
            "recBFQds5nZELljIY",
            "recVKVW5jxoeGvls2",
            "recIOkyDRp1pmTTFR",
            "recBmuswv3UgJJmeu",
            "recaQYlxLKwZxtr0q",
            "recjgESOANC1WCW0n",
            "receZHHTxReSY5uuv",
            "reccyzhezs4eW0Upb",
            "recZh0nSJYbg8tEGn",
            "recDV81YNrCpmB58T",
            "rec8Af6QLu1qYxCWF",
            "rec7vpWRL72BPsDCl",
            "recjCcAzoFy5F1jFu",
            "recgp15niHakTqd8w",
            "recSNN66zc4OIDjsg",
            "recrf2zvJ59oZnQMQ",
            "recLC5ceetcVM3HUr",
            "recxQLWfu9Fs7N2nc",
            "recGjTp8NsHx3GJBL",
            "recgu7F9zYsvuRezW",
            "recogpKUyEtNJ5hmA",
            "rec2RCkawXJRJDjiG",
            "recYUcYLwvLZNyVQ8",
            "receUWOJrVT1K8g91",
            "recvH7Hyjhx21lx4p",
            "rechFN2I2P9fU5cWd",
            "recLYa26KzIuEC9ko",
            "recgK4QIhqVl1BECL",
            "recc1moWHkRLvHpT6",
            "recDDfhKD4LIBMIws",
            "recozblEdp8QN3a4A",
            "recAgH4BmK7r0NAGq",
            "recXsrUnl83o1DpY2",
            "recEhblyR8PMlXZr7",
            "recw0MONm846fu2nj",
            "rec0AxL08na38h15v",
          ],
          "Proyecto-Modelo": "Península-Inland",
        },
        createdTime: "2020-09-30T16:18:45.000Z",
      },
    ];

    const mock_proyectos = [
      {
        id: "recunm26MjQp3daSq",
        fields: {
          Nombre: "Península",
          Viviendas: ["recj0jJ6DFRi3mmtx", "recyqNCh3Wb7EzrvO"],
          "ID Salesforce": "53",
        },
        createdTime: "2020-09-29T20:39:18.000Z",
      },
    ];

    const mock_atributos = [
      {
        id: "recw6bvdSzBo77wgK",
        fields: { Nombre: "Asadores" },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recNdT3JemQx9earo",
        fields: { Nombre: "Barandales", Categoría: ["Entertrainment"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recbJcaO7iX2n5KpW",
        fields: { Nombre: "Cancelería", Categoría: ["Entertrainment"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recJmaYx4KfUuOWb6",
        fields: { Nombre: "Clósets", Categoría: ["Outdoors"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recpFsGpNYF87pO4Q",
        fields: { Nombre: "Cocinas", Categoría: ["Security"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recQ5IyAPoK2GsZ02",
        fields: { Nombre: "Despensa", Categoría: ["Entertrainment"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "rec0OEoRleuH8Ig9c",
        fields: { Nombre: "Domótica", Categoría: ["Outdoors"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recxhy4xe0k6jRK6s",
        fields: { Nombre: "Equipamiento de Cocinas", Categoría: ["Security"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "rectdzpunp5v4m0Mt",
        fields: { Nombre: "Flex Room", Categoría: ["Outdoors"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recV8GhwQt8myEWSb",
        fields: { Nombre: "Muebles de Cocina", Categoría: ["Entertrainment"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "rectYa095cYxcHIjQ",
        fields: { Nombre: "Muro Verde", Categoría: ["Outdoors"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recXPEDSNJsLJZbhn",
        fields: { Nombre: "Paneles Solares", Categoría: ["Outdoors"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recEMuAuU19hVExGr",
        fields: { Nombre: "Piso", Categoría: ["Outdoors", "Security"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "rec5Q5GN0NmjqIcMX",
        fields: { Nombre: "Portones", Categoría: ["Security"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
      {
        id: "recJvGc1BKlvCnrSc",
        fields: { Nombre: "Tonalidades de Cocina", Categoría: ["Entertrainment"] },
        createdTime: "2020-09-01T18:40:59.000Z",
      },
    ];

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
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

    const opciones = writable([]);

    const atributos = writable([]);

    const menuState = writable({}); //atrributes open or closed

    const opcionesByAtributo = derived(opciones, ($opciones) => {
      let byAtr = {};
      $opciones.map((o) => {
        let atr = o.fields.atributo_nombre;
        if (!byAtr[atr]) {
          byAtr[o.fields.atributo_nombre] = [o];
        } else {
          byAtr[o.fields.atributo_nombre].push(o);
        }
      });
      return byAtr;
    });

    const categorias = writable({});

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
      //local
      if (window.location.hostname == "localhost") {
        atributos.set(mock_atributos);
        getCategoriasFromAtributos();
        return;
      }

      axios$1.get("https://enl4yiidhnuij8n.m.pipedream.net").then((res) => {
        atributos.set(res.data);
        getCategoriasFromAtributos();
      });
    }

    function getProyectos() {
      //local
      if (window.location.hostname == "localhost") {
        proyectos.set(mock_proyectos);
        getModelos();
        return;
      }

      axios$1.get("https://en57ds8aebutpuq.m.pipedream.net").then((res) => {
        proyectos.set(res.data);
        getModelos();
      });
    }

    function getModelos() {
      //local
      if (window.location.hostname == "localhost") {
        modelos.set(mock_modelos);
        getOpciones(mock_modelos[0].fields.Nombre);
        return;
      }

      axios$1.get("https://enw9gnpjz0b6y3s.m.pipedream.net").then((res) => {
        modelos.set(res.data);
        getOpciones(res.data[0].fields.Nombre);
      });
    }

    function getOpciones(vivienda) {
      //local
      if (window.location.hostname == "localhost") {
        opciones.set(mock_opciones);
        return;
      }

      axios$1
        .get(`https://enombb1z99rtf6o.m.pipedream.net?vivienda=${vivienda}`)
        .then((res) => {
          opciones.set(res.data);
        });
    }

    getAtributos();
    getProyectos();

    /* src\Categorias.svelte generated by Svelte v3.32.2 */

    const { Object: Object_1 } = globals;
    const file = "src\\Categorias.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (7:2) {#each Object.keys($categorias) as categoria}
    function create_each_block(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t0;
    	let div2;
    	let t1_value = /*categoria*/ ctx[2] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*categoria*/ ctx[2]);
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
    			toggle_class(div0, "switch-thumb-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[2]]);
    			add_location(div0, file, 17, 8, 488);
    			attr_dev(div1, "class", "switch-bg");
    			toggle_class(div1, "switch-bg-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[2]]);
    			add_location(div1, file, 16, 6, 411);
    			attr_dev(div2, "class", "switch-title");
    			add_location(div2, file, 22, 6, 616);
    			attr_dev(div3, "class", "switch");
    			add_location(div3, file, 7, 4, 194);
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
    				toggle_class(div0, "switch-thumb-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[2]]);
    			}

    			if (dirty & /*$categorias, Object*/ 1) {
    				toggle_class(div1, "switch-bg-on", /*$categorias*/ ctx[0][/*categoria*/ ctx[2]]);
    			}

    			if (dirty & /*$categorias*/ 1 && t1_value !== (t1_value = /*categoria*/ ctx[2] + "")) set_data_dev(t1, t1_value);
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
    		source: "(7:2) {#each Object.keys($categorias) as categoria}",
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
    			div0.textContent = "Categoias";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "categorias-title");
    			add_location(div0, file, 4, 0, 68);
    			attr_dev(div1, "class", "categorias");
    			add_location(div1, file, 5, 0, 115);
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
    			if (dirty & /*$categorias, Object*/ 1) {
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
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Categorias> was created with unknown prop '${key}'`);
    	});

    	const click_handler = categoria => {
    		set_store_value(categorias, $categorias[categoria] = !$categorias[categoria], $categorias);

    		if (categoria != "all") {
    			set_store_value(categorias, $categorias.all = false, $categorias);
    		}
    	};

    	$$self.$capture_state = () => ({ categorias, $categorias });
    	return [$categorias, click_handler];
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
    	let t6_value = /*opcione*/ ctx[0].fields.precio + "";
    	let t6;
    	let t7;
    	let div3;

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
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "+";
    			attr_dev(img, "class", "opcione-img svelte-12khvuk");
    			if (img.src !== (img_src_value = /*opcione*/ ctx[0].fields.Render[0].thumbnails.large.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 5, 2, 71);
    			attr_dev(div0, "class", "opcione-title svelte-12khvuk");
    			add_location(div0, file$1, 10, 2, 179);
    			attr_dev(div1, "class", "opcione-description");
    			add_location(div1, file$1, 11, 2, 246);
    			attr_dev(div2, "class", "opcione-price");
    			add_location(div2, file$1, 12, 2, 317);
    			attr_dev(div3, "class", "opcione-plus-btn");
    			add_location(div3, file$1, 13, 2, 378);
    			attr_dev(div4, "class", "opcione svelte-12khvuk");
    			add_location(div4, file$1, 4, 0, 46);
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
    			append_dev(div2, t6);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*opcione*/ 1 && img.src !== (img_src_value = /*opcione*/ ctx[0].fields.Render[0].thumbnails.large.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*opcione*/ 1 && t1_value !== (t1_value = /*opcione*/ ctx[0].fields.opción_nombre + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*opcione*/ 1 && t3_value !== (t3_value = /*opcione*/ ctx[0].fields.descripción + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*opcione*/ 1 && t6_value !== (t6_value = /*opcione*/ ctx[0].fields.precio + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Opcione", slots, []);
    	let { opcione } = $$props;
    	const writable_props = ["opcione"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Opcione> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("opcione" in $$props) $$invalidate(0, opcione = $$props.opcione);
    	};

    	$$self.$capture_state = () => ({ opcione });

    	$$self.$inject_state = $$props => {
    		if ("opcione" in $$props) $$invalidate(0, opcione = $$props.opcione);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [opcione];
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
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (24:2) {#each opciones as opcione}
    function create_each_block$1(ctx) {
    	let opcione;
    	let current;

    	opcione = new Opcione({
    			props: { opcione: /*opcione*/ ctx[5] },
    			$$inline: true
    		});

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
    			if (dirty & /*opciones*/ 1) opcione_changes.opcione = /*opcione*/ ctx[5];
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
    		source: "(24:2) {#each opciones as opcione}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
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
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "opciones svelte-168x0zk");
    			add_location(div, file$2, 22, 0, 428);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[4](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*opciones*/ 1) {
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
    			/*div_binding*/ ctx[4](null);
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

    	onMount(async () => {
    		await tick();
    		$$invalidate(3, maxHeight = opcionesDiv.scrollHeight);
    	});

    	const writable_props = ["opciones", "isOpen"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Opciones> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			opcionesDiv = $$value;
    			(($$invalidate(1, opcionesDiv), $$invalidate(2, isOpen)), $$invalidate(3, maxHeight));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("opciones" in $$props) $$invalidate(0, opciones = $$props.opciones);
    		if ("isOpen" in $$props) $$invalidate(2, isOpen = $$props.isOpen);
    	};

    	$$self.$capture_state = () => ({
    		Opcione,
    		onMount,
    		tick,
    		opciones,
    		isOpen,
    		opcionesDiv,
    		maxHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("opciones" in $$props) $$invalidate(0, opciones = $$props.opciones);
    		if ("isOpen" in $$props) $$invalidate(2, isOpen = $$props.isOpen);
    		if ("opcionesDiv" in $$props) $$invalidate(1, opcionesDiv = $$props.opcionesDiv);
    		if ("maxHeight" in $$props) $$invalidate(3, maxHeight = $$props.maxHeight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*opcionesDiv, isOpen, maxHeight*/ 14) {
    			{
    				if (opcionesDiv) {
    					$$invalidate(1, opcionesDiv.style.maxHeight = isOpen ? maxHeight + "px" : "0px", opcionesDiv);
    				}
    			}
    		}
    	};

    	return [opciones, opcionesDiv, isOpen, maxHeight, div_binding];
    }

    class Opciones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { opciones: 0, isOpen: 2 });

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

    const { console: console_1 } = globals;
    const file$3 = "src\\Atributo.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0_value = /*atributo*/ ctx[0].fields.Nombre + "";
    	let t0;
    	let t1;
    	let opciones;
    	let current;
    	let mounted;
    	let dispose;

    	opciones = new Opciones({
    			props: {
    				opciones: /*$opcionesByAtributo*/ ctx[4][/*atributo*/ ctx[0].fields.Nombre],
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
    			attr_dev(div, "class", "atributo-title svelte-1hg1y");
    			toggle_class(div, "isDisabled", /*isDisabled*/ ctx[1]);
    			add_location(div, file$3, 25, 0, 547);
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

    			if (dirty & /*isDisabled*/ 2) {
    				toggle_class(div, "isDisabled", /*isDisabled*/ ctx[1]);
    			}

    			const opciones_changes = {};
    			if (dirty & /*$opcionesByAtributo, atributo*/ 17) opciones_changes.opciones = /*$opcionesByAtributo*/ ctx[4][/*atributo*/ ctx[0].fields.Nombre];
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
    	let isOpen;
    	let $categorias;
    	let $menuState;
    	let $opcionesByAtributo;
    	validate_store(categorias, "categorias");
    	component_subscribe($$self, categorias, $$value => $$invalidate(5, $categorias = $$value));
    	validate_store(menuState, "menuState");
    	component_subscribe($$self, menuState, $$value => $$invalidate(2, $menuState = $$value));
    	validate_store(opcionesByAtributo, "opcionesByAtributo");
    	component_subscribe($$self, opcionesByAtributo, $$value => $$invalidate(4, $opcionesByAtributo = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Atributo", slots, []);
    	let { atributo } = $$props;
    	let isDisabled;
    	const writable_props = ["atributo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Atributo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		set_store_value(menuState, $menuState[atributo.fields.Nombre] = !$menuState[atributo.fields.Nombre], $menuState);
    	};

    	$$self.$$set = $$props => {
    		if ("atributo" in $$props) $$invalidate(0, atributo = $$props.atributo);
    	};

    	$$self.$capture_state = () => ({
    		opcionesByAtributo,
    		menuState,
    		categorias,
    		Opciones,
    		atributo,
    		isDisabled,
    		$categorias,
    		isOpen,
    		$menuState,
    		$opcionesByAtributo
    	});

    	$$self.$inject_state = $$props => {
    		if ("atributo" in $$props) $$invalidate(0, atributo = $$props.atributo);
    		if ("isDisabled" in $$props) $$invalidate(1, isDisabled = $$props.isDisabled);
    		if ("isOpen" in $$props) $$invalidate(3, isOpen = $$props.isOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$categorias, atributo*/ 33) {
    			{
    				if ($categorias.all) {
    					$$invalidate(1, isDisabled = false);
    				} else if (atributo.fields.Categoría) {
    					$$invalidate(1, isDisabled = atributo.fields.Categoría.some(cat => {
    						return !$categorias[cat];
    					}));
    				} else {
    					$$invalidate(1, isDisabled = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*isDisabled*/ 2) {
    			console.log(isDisabled);
    		}

    		if ($$self.$$.dirty & /*$menuState, atributo*/ 5) {
    			$$invalidate(3, isOpen = $menuState[atributo.fields.Nombre]);
    		}
    	};

    	return [
    		atributo,
    		isDisabled,
    		$menuState,
    		isOpen,
    		$opcionesByAtributo,
    		$categorias,
    		click_handler
    	];
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
    			console_1.warn("<Atributo> was created without expected prop 'atributo'");
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

    /* src\App.svelte generated by Svelte v3.32.2 */
    const file$5 = "src\\App.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let categorias;
    	let t0;
    	let atributos;
    	let t1;
    	let div1;
    	let current;
    	categorias = new Categorias({ $$inline: true });
    	atributos = new Atributos({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(categorias.$$.fragment);
    			t0 = space();
    			create_component(atributos.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "col-left");
    			add_location(div0, file$5, 6, 2, 145);
    			attr_dev(div1, "class", "col-right");
    			add_location(div1, file$5, 10, 2, 220);
    			attr_dev(div2, "class", "main-app");
    			add_location(div2, file$5, 5, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(categorias, div0, null);
    			append_dev(div0, t0);
    			mount_component(atributos, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(categorias.$$.fragment, local);
    			transition_in(atributos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(categorias.$$.fragment, local);
    			transition_out(atributos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(categorias);
    			destroy_component(atributos);
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
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Categorias, Atributos });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
      target: document.getElementById("app-container"),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
