
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
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
        const prop_values = options.props || {};
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
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
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

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.29.4 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
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
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(10, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(9, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(8, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 256) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 1536) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [routes, location, base, basepath, url, $$scope, slots];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.29.4 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 530) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.29.4 */
    const file = "node_modules\\svelte-routing\\src\\Link.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*ariaCurrent*/ 4) && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
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
    	let $base;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Link", slots, ['default']);
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(14, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(15, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	const writable_props = ["to", "replace", "state", "getProps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		$base,
    		$location,
    		ariaCurrent
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("isPartiallyCurrent" in $$props) $$invalidate(12, isPartiallyCurrent = $$props.isPartiallyCurrent);
    		if ("isCurrent" in $$props) $$invalidate(13, isCurrent = $$props.isCurrent);
    		if ("props" in $$props) $$invalidate(1, props = $$props.props);
    		if ("ariaCurrent" in $$props) $$invalidate(2, ariaCurrent = $$props.ariaCurrent);
    	};

    	let ariaCurrent;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 16448) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 32769) {
    			 $$invalidate(12, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 32769) {
    			 $$invalidate(13, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 8192) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 45569) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		$$scope,
    		slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\bgimage.svelte generated by Svelte v3.29.4 */

    const file$1 = "src\\bgimage.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let p;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*header*/ ctx[1]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*underskrift*/ ctx[2]);
    			attr_dev(h1, "id", "header");
    			attr_dev(h1, "align", "center");
    			attr_dev(h1, "class", "svelte-16sacj");
    			add_location(h1, file$1, 7, 4, 176);
    			attr_dev(p, "id", "underskrift");
    			attr_dev(p, "align", "center");
    			attr_dev(p, "class", "svelte-16sacj");
    			add_location(p, file$1, 8, 4, 227);
    			attr_dev(div0, "id", "bgimage");
    			set_style(div0, "background-image", "url('" + /*url*/ ctx[0] + "')");
    			attr_dev(div0, "class", "slide svelte-16sacj");
    			add_location(div0, file$1, 6, 2, 99);
    			attr_dev(div1, "id", "main");
    			add_location(div1, file$1, 5, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 2) set_data_dev(t0, /*header*/ ctx[1]);
    			if (dirty & /*underskrift*/ 4) set_data_dev(t2, /*underskrift*/ ctx[2]);

    			if (dirty & /*url*/ 1) {
    				set_style(div0, "background-image", "url('" + /*url*/ ctx[0] + "')");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bgimage", slots, []);
    	let { url } = $$props;
    	let { header } = $$props;
    	let { underskrift } = $$props;
    	const writable_props = ["url", "header", "underskrift"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bgimage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    		if ("underskrift" in $$props) $$invalidate(2, underskrift = $$props.underskrift);
    	};

    	$$self.$capture_state = () => ({ url, header, underskrift });

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    		if ("underskrift" in $$props) $$invalidate(2, underskrift = $$props.underskrift);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, header, underskrift];
    }

    class Bgimage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { url: 0, header: 1, underskrift: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bgimage",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*url*/ ctx[0] === undefined && !("url" in props)) {
    			console.warn("<Bgimage> was created without expected prop 'url'");
    		}

    		if (/*header*/ ctx[1] === undefined && !("header" in props)) {
    			console.warn("<Bgimage> was created without expected prop 'header'");
    		}

    		if (/*underskrift*/ ctx[2] === undefined && !("underskrift" in props)) {
    			console.warn("<Bgimage> was created without expected prop 'underskrift'");
    		}
    	}

    	get url() {
    		throw new Error("<Bgimage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Bgimage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Bgimage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Bgimage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get underskrift() {
    		throw new Error("<Bgimage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set underskrift(value) {
    		throw new Error("<Bgimage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\sider\startside.svelte generated by Svelte v3.29.4 */
    const file$2 = "src\\sider\\startside.svelte";

    function create_fragment$4(ctx) {
    	let bgimage;
    	let t0;
    	let div;
    	let pre;
    	let current;

    	bgimage = new Bgimage({
    			props: {
    				header: "RHH",
    				underskrift: "Random Hell Hole",
    				url: "bilder/ng.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bgimage.$$.fragment);
    			t0 = space();
    			div = element("div");
    			pre = element("pre");
    			pre.textContent = "Denne siden handler om alle de tingene jeg kunne finne på.\r\n        Så her er en kolleksjon av noen.\r\n\r\n    Du kan trykke på meny knappen opp i høyre hjørnet til å komme\r\n        deg til forskjellige deler av nettsiden.\r\n\r\n    Du kan se timeplanen for å få en i det av ka du egentlig\r\n        bør gjøre enn å sove hele dagen.\r\n\r\n    Og du har spill delen der du kan game hele dagen for å glemme\r\n        hva du egentlig skal gjøre.\r\n\r\n    Denne nettsiden er lagd med svelte. For å se gjennom koden må\r\n        åpne alle svelt filene i txt. Svelte er likt som html, css og js.\r\n\r\n    Og som du kan se så er det ikke ett universalt stilark på alle sidene.\r\n        Dette er fordi svelte bygger seg mye mer på å stile individe deler av en\r\n        nettside. Og ikke hele siden om gangen. Så i stedet brukte jeg en svelte fil\r\n        som overskrift. Men brukte ikke en stilark på alt. Dette er den måten man kan\r\n        lage nettsider på... I følge broren min.\r\n\r\nBig Chungus refers to an image of the cartoon character Bugs Bunny, \r\n        usually captioned with the phrase \"Big Chungus\" and presented as a game for PlayStation 4 console. \r\n\r\n    The word \"chungus\" was coined by video game journalist Jim Sterling several \r\n    years before the meme became popular. \r\n\r\n    Starting in July 2019, the meme regained ironic popularity on iFunny and certain parts of Reddit, \r\n        particularly as a part of Reddit Moment memes.";
    			add_location(pre, file$2, 7, 4, 183);
    			attr_dev(div, "class", "start svelte-urw3mr");
    			add_location(div, file$2, 6, 0, 158);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bgimage, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, pre);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bgimage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bgimage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bgimage, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Startside", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Startside> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bgimage });
    	return [];
    }

    class Startside extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Startside",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\sider\timeplan.svelte generated by Svelte v3.29.4 */
    const file$3 = "src\\sider\\timeplan.svelte";

    function create_fragment$5(ctx) {
    	let bgimage;
    	let t0;
    	let button0;
    	let t2;
    	let table0;
    	let tr0;
    	let th0;
    	let t4;
    	let th1;
    	let t6;
    	let th2;
    	let t8;
    	let th3;
    	let t10;
    	let th4;
    	let t12;
    	let th5;
    	let t14;
    	let tr1;
    	let th6;
    	let t16;
    	let th7;
    	let t17;
    	let th8;
    	let t19;
    	let th9;
    	let t21;
    	let th10;
    	let t23;
    	let th11;
    	let t25;
    	let tr2;
    	let th12;
    	let t27;
    	let tr3;
    	let th13;
    	let t29;
    	let tr4;
    	let th14;
    	let t31;
    	let th15;
    	let t33;
    	let tr5;
    	let th16;
    	let t35;
    	let th17;
    	let t37;
    	let th18;
    	let t39;
    	let th19;
    	let t41;
    	let th20;
    	let t43;
    	let th21;
    	let t45;
    	let tr6;
    	let th22;
    	let t47;
    	let tr7;
    	let th23;
    	let t49;
    	let tr8;
    	let th24;
    	let t51;
    	let th25;
    	let t53;
    	let th26;
    	let t55;
    	let th27;
    	let t57;
    	let tr9;
    	let th28;
    	let t59;
    	let th29;
    	let t61;
    	let th30;
    	let t63;
    	let th31;
    	let t65;
    	let th32;
    	let t67;
    	let tr10;
    	let th33;
    	let t69;
    	let tr11;
    	let th34;
    	let t71;
    	let tr12;
    	let th35;
    	let t73;
    	let th36;
    	let t75;
    	let th37;
    	let t77;
    	let tr13;
    	let th38;
    	let t79;
    	let th39;
    	let t81;
    	let th40;
    	let t83;
    	let th41;
    	let t85;
    	let th42;
    	let t87;
    	let tr14;
    	let th43;
    	let t89;
    	let tr15;
    	let th44;
    	let t91;
    	let tr16;
    	let th45;
    	let t93;
    	let tr17;
    	let th46;
    	let t95;
    	let button1;
    	let t97;
    	let table1;
    	let tr18;
    	let th47;
    	let t99;
    	let th48;
    	let t101;
    	let th49;
    	let t103;
    	let th50;
    	let t105;
    	let th51;
    	let t107;
    	let th52;
    	let t109;
    	let tr19;
    	let th53;
    	let t111;
    	let th54;
    	let t112;
    	let th55;
    	let t114;
    	let th56;
    	let t116;
    	let th57;
    	let t118;
    	let th58;
    	let t120;
    	let tr20;
    	let th59;
    	let t122;
    	let tr21;
    	let th60;
    	let t124;
    	let tr22;
    	let th61;
    	let t126;
    	let th62;
    	let t128;
    	let tr23;
    	let th63;
    	let t130;
    	let th64;
    	let t132;
    	let th65;
    	let t134;
    	let th66;
    	let t136;
    	let th67;
    	let t138;
    	let th68;
    	let t140;
    	let tr24;
    	let th69;
    	let t142;
    	let tr25;
    	let th70;
    	let t144;
    	let tr26;
    	let th71;
    	let t146;
    	let th72;
    	let t148;
    	let th73;
    	let t150;
    	let th74;
    	let t152;
    	let tr27;
    	let th75;
    	let t154;
    	let th76;
    	let t156;
    	let th77;
    	let t158;
    	let th78;
    	let t160;
    	let th79;
    	let t162;
    	let tr28;
    	let th80;
    	let t164;
    	let tr29;
    	let th81;
    	let t166;
    	let tr30;
    	let th82;
    	let t168;
    	let th83;
    	let t170;
    	let th84;
    	let t172;
    	let tr31;
    	let th85;
    	let t174;
    	let th86;
    	let t176;
    	let th87;
    	let t178;
    	let th88;
    	let t180;
    	let th89;
    	let t182;
    	let tr32;
    	let th90;
    	let t184;
    	let tr33;
    	let th91;
    	let t186;
    	let tr34;
    	let th92;
    	let t188;
    	let tr35;
    	let th93;
    	let current;

    	bgimage = new Bgimage({
    			props: {
    				header: "Timeplaner",
    				underskrift: "",
    				url: "bilder/timeplan.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bgimage.$$.fragment);
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Partallsuker";
    			t2 = space();
    			table0 = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Tid:";
    			t4 = space();
    			th1 = element("th");
    			th1.textContent = "Mandag";
    			t6 = space();
    			th2 = element("th");
    			th2.textContent = "Tirsdag";
    			t8 = space();
    			th3 = element("th");
    			th3.textContent = "Onsdag";
    			t10 = space();
    			th4 = element("th");
    			th4.textContent = "Torsdag";
    			t12 = space();
    			th5 = element("th");
    			th5.textContent = "Fredag";
    			t14 = space();
    			tr1 = element("tr");
    			th6 = element("th");
    			th6.textContent = "8:00-8:30";
    			t16 = space();
    			th7 = element("th");
    			t17 = space();
    			th8 = element("th");
    			th8.textContent = "Informatikk";
    			t19 = space();
    			th9 = element("th");
    			th9.textContent = "Fysikk";
    			t21 = space();
    			th10 = element("th");
    			th10.textContent = "Matematikk";
    			t23 = space();
    			th11 = element("th");
    			th11.textContent = "Gym";
    			t25 = space();
    			tr2 = element("tr");
    			th12 = element("th");
    			th12.textContent = "8:30-9:00";
    			t27 = space();
    			tr3 = element("tr");
    			th13 = element("th");
    			th13.textContent = "9:00-9:30";
    			t29 = space();
    			tr4 = element("tr");
    			th14 = element("th");
    			th14.textContent = "9:30-9:45";
    			t31 = space();
    			th15 = element("th");
    			th15.textContent = "Friminutt";
    			t33 = space();
    			tr5 = element("tr");
    			th16 = element("th");
    			th16.textContent = "9:45-10:15";
    			t35 = space();
    			th17 = element("th");
    			th17.textContent = "Matematikk";
    			t37 = space();
    			th18 = element("th");
    			th18.textContent = "Informatikk";
    			t39 = space();
    			th19 = element("th");
    			th19.textContent = "Fysikk";
    			t41 = space();
    			th20 = element("th");
    			th20.textContent = "Informatikk";
    			t43 = space();
    			th21 = element("th");
    			th21.textContent = "Tysk";
    			t45 = space();
    			tr6 = element("tr");
    			th22 = element("th");
    			th22.textContent = "10:15-10:45";
    			t47 = space();
    			tr7 = element("tr");
    			th23 = element("th");
    			th23.textContent = "10:45-11:15";
    			t49 = space();
    			tr8 = element("tr");
    			th24 = element("th");
    			th24.textContent = "11:15-12:00";
    			t51 = space();
    			th25 = element("th");
    			th25.textContent = "Spising";
    			t53 = space();
    			th26 = element("th");
    			th26.textContent = "Midtime";
    			t55 = space();
    			th27 = element("th");
    			th27.textContent = "Spising";
    			t57 = space();
    			tr9 = element("tr");
    			th28 = element("th");
    			th28.textContent = "12:00-12:30";
    			t59 = space();
    			th29 = element("th");
    			th29.textContent = "Matematikk";
    			t61 = space();
    			th30 = element("th");
    			th30.textContent = "Norsk";
    			t63 = space();
    			th31 = element("th");
    			th31.textContent = "Historie";
    			t65 = space();
    			th32 = element("th");
    			th32.textContent = "Fysikk";
    			t67 = space();
    			tr10 = element("tr");
    			th33 = element("th");
    			th33.textContent = "12:30-13:00";
    			t69 = space();
    			tr11 = element("tr");
    			th34 = element("th");
    			th34.textContent = "13:00-13:30";
    			t71 = space();
    			tr12 = element("tr");
    			th35 = element("th");
    			th35.textContent = "13:30-13:45";
    			t73 = space();
    			th36 = element("th");
    			th36.textContent = "Spising";
    			t75 = space();
    			th37 = element("th");
    			th37.textContent = "Spising";
    			t77 = space();
    			tr13 = element("tr");
    			th38 = element("th");
    			th38.textContent = "13:45-14:15";
    			t79 = space();
    			th39 = element("th");
    			th39.textContent = "Tysk";
    			t81 = space();
    			th40 = element("th");
    			th40.textContent = "Norsk";
    			t83 = space();
    			th41 = element("th");
    			th41.textContent = "Kjemi";
    			t85 = space();
    			th42 = element("th");
    			th42.textContent = "Kjemi";
    			t87 = space();
    			tr14 = element("tr");
    			th43 = element("th");
    			th43.textContent = "14:15-14:45";
    			t89 = space();
    			tr15 = element("tr");
    			th44 = element("th");
    			th44.textContent = "14:45-15:15";
    			t91 = space();
    			tr16 = element("tr");
    			th45 = element("th");
    			th45.textContent = "15:15-15:45";
    			t93 = space();
    			tr17 = element("tr");
    			th46 = element("th");
    			th46.textContent = "15:45-16:15";
    			t95 = space();
    			button1 = element("button");
    			button1.textContent = "Oddetallsuker";
    			t97 = space();
    			table1 = element("table");
    			tr18 = element("tr");
    			th47 = element("th");
    			th47.textContent = "Tid:";
    			t99 = space();
    			th48 = element("th");
    			th48.textContent = "Mandag";
    			t101 = space();
    			th49 = element("th");
    			th49.textContent = "Tirsdag";
    			t103 = space();
    			th50 = element("th");
    			th50.textContent = "Onsdag";
    			t105 = space();
    			th51 = element("th");
    			th51.textContent = "Torsdag";
    			t107 = space();
    			th52 = element("th");
    			th52.textContent = "Fredag";
    			t109 = space();
    			tr19 = element("tr");
    			th53 = element("th");
    			th53.textContent = "8:00-8:30";
    			t111 = space();
    			th54 = element("th");
    			t112 = space();
    			th55 = element("th");
    			th55.textContent = "Informatikk";
    			t114 = space();
    			th56 = element("th");
    			th56.textContent = "Fysikk";
    			t116 = space();
    			th57 = element("th");
    			th57.textContent = "Matematikk";
    			t118 = space();
    			th58 = element("th");
    			th58.textContent = "Gym";
    			t120 = space();
    			tr20 = element("tr");
    			th59 = element("th");
    			th59.textContent = "8:30-9:00";
    			t122 = space();
    			tr21 = element("tr");
    			th60 = element("th");
    			th60.textContent = "9:00-9:30";
    			t124 = space();
    			tr22 = element("tr");
    			th61 = element("th");
    			th61.textContent = "9:30-9:45";
    			t126 = space();
    			th62 = element("th");
    			th62.textContent = "Friminutt";
    			t128 = space();
    			tr23 = element("tr");
    			th63 = element("th");
    			th63.textContent = "9:45-10:15";
    			t130 = space();
    			th64 = element("th");
    			th64.textContent = "Matematikk";
    			t132 = space();
    			th65 = element("th");
    			th65.textContent = "Informatikk";
    			t134 = space();
    			th66 = element("th");
    			th66.textContent = "Fysikk";
    			t136 = space();
    			th67 = element("th");
    			th67.textContent = "Informatikk";
    			t138 = space();
    			th68 = element("th");
    			th68.textContent = "Tysk";
    			t140 = space();
    			tr24 = element("tr");
    			th69 = element("th");
    			th69.textContent = "10:15-10:45";
    			t142 = space();
    			tr25 = element("tr");
    			th70 = element("th");
    			th70.textContent = "10:45-11:15";
    			t144 = space();
    			tr26 = element("tr");
    			th71 = element("th");
    			th71.textContent = "11:15-12:00";
    			t146 = space();
    			th72 = element("th");
    			th72.textContent = "Spising";
    			t148 = space();
    			th73 = element("th");
    			th73.textContent = "Midtime";
    			t150 = space();
    			th74 = element("th");
    			th74.textContent = "Spising";
    			t152 = space();
    			tr27 = element("tr");
    			th75 = element("th");
    			th75.textContent = "12:00-12:30";
    			t154 = space();
    			th76 = element("th");
    			th76.textContent = "Matematikk";
    			t156 = space();
    			th77 = element("th");
    			th77.textContent = "Norsk";
    			t158 = space();
    			th78 = element("th");
    			th78.textContent = "Historie";
    			t160 = space();
    			th79 = element("th");
    			th79.textContent = "Fysikk";
    			t162 = space();
    			tr28 = element("tr");
    			th80 = element("th");
    			th80.textContent = "12:30-13:00";
    			t164 = space();
    			tr29 = element("tr");
    			th81 = element("th");
    			th81.textContent = "13:00-13:30";
    			t166 = space();
    			tr30 = element("tr");
    			th82 = element("th");
    			th82.textContent = "13:30-13:45";
    			t168 = space();
    			th83 = element("th");
    			th83.textContent = "Spising";
    			t170 = space();
    			th84 = element("th");
    			th84.textContent = "Spising";
    			t172 = space();
    			tr31 = element("tr");
    			th85 = element("th");
    			th85.textContent = "13:45-14:15";
    			t174 = space();
    			th86 = element("th");
    			th86.textContent = "Tysk";
    			t176 = space();
    			th87 = element("th");
    			th87.textContent = "Norsk";
    			t178 = space();
    			th88 = element("th");
    			th88.textContent = "Kjemi";
    			t180 = space();
    			th89 = element("th");
    			th89.textContent = "Kjemi";
    			t182 = space();
    			tr32 = element("tr");
    			th90 = element("th");
    			th90.textContent = "14:15-14:45";
    			t184 = space();
    			tr33 = element("tr");
    			th91 = element("th");
    			th91.textContent = "14:45-15:15";
    			t186 = space();
    			tr34 = element("tr");
    			th92 = element("th");
    			th92.textContent = "15:15-15:45";
    			t188 = space();
    			tr35 = element("tr");
    			th93 = element("th");
    			th93.textContent = "15:45-16:15";
    			attr_dev(button0, "onclick", "partallsuker()");
    			attr_dev(button0, "id", "button");
    			attr_dev(button0, "align", "center");
    			attr_dev(button0, "class", "svelte-x2ud5m");
    			add_location(button0, file$3, 33, 0, 614);
    			attr_dev(th0, "class", "svelte-x2ud5m");
    			add_location(th0, file$3, 37, 4, 805);
    			attr_dev(th1, "class", "svelte-x2ud5m");
    			add_location(th1, file$3, 38, 4, 824);
    			attr_dev(th2, "class", "svelte-x2ud5m");
    			add_location(th2, file$3, 39, 4, 845);
    			attr_dev(th3, "class", "svelte-x2ud5m");
    			add_location(th3, file$3, 40, 4, 867);
    			attr_dev(th4, "class", "svelte-x2ud5m");
    			add_location(th4, file$3, 41, 4, 888);
    			attr_dev(th5, "class", "svelte-x2ud5m");
    			add_location(th5, file$3, 42, 4, 910);
    			attr_dev(tr0, "class", "timeplan2 svelte-x2ud5m");
    			attr_dev(tr0, "id", "timeplan");
    			add_location(tr0, file$3, 36, 0, 761);
    			attr_dev(th6, "class", "svelte-x2ud5m");
    			add_location(th6, file$3, 45, 4, 944);
    			attr_dev(th7, "rowspan", "4");
    			attr_dev(th7, "class", "svelte-x2ud5m");
    			add_location(th7, file$3, 46, 4, 968);
    			attr_dev(th8, "rowspan", "3");
    			attr_dev(th8, "class", "svelte-x2ud5m");
    			add_location(th8, file$3, 47, 4, 995);
    			attr_dev(th9, "rowspan", "3");
    			attr_dev(th9, "class", "svelte-x2ud5m");
    			add_location(th9, file$3, 48, 4, 1033);
    			attr_dev(th10, "rowspan", "3");
    			attr_dev(th10, "class", "svelte-x2ud5m");
    			add_location(th10, file$3, 49, 4, 1066);
    			attr_dev(th11, "rowspan", "3");
    			attr_dev(th11, "class", "svelte-x2ud5m");
    			add_location(th11, file$3, 50, 4, 1103);
    			add_location(tr1, file$3, 44, 0, 934);
    			attr_dev(th12, "class", "svelte-x2ud5m");
    			add_location(th12, file$3, 53, 4, 1146);
    			add_location(tr2, file$3, 52, 0, 1136);
    			attr_dev(th13, "class", "svelte-x2ud5m");
    			add_location(th13, file$3, 56, 4, 1183);
    			add_location(tr3, file$3, 55, 0, 1173);
    			attr_dev(th14, "class", "svelte-x2ud5m");
    			add_location(th14, file$3, 59, 4, 1220);
    			attr_dev(th15, "colspan", "4");
    			attr_dev(th15, "class", "svelte-x2ud5m");
    			add_location(th15, file$3, 60, 4, 1244);
    			add_location(tr4, file$3, 58, 0, 1210);
    			attr_dev(th16, "class", "svelte-x2ud5m");
    			add_location(th16, file$3, 63, 4, 1293);
    			attr_dev(th17, "rowspan", "3");
    			attr_dev(th17, "class", "svelte-x2ud5m");
    			add_location(th17, file$3, 64, 4, 1318);
    			attr_dev(th18, "rowspan", "3");
    			attr_dev(th18, "class", "svelte-x2ud5m");
    			add_location(th18, file$3, 65, 4, 1355);
    			attr_dev(th19, "rowspan", "3");
    			attr_dev(th19, "class", "svelte-x2ud5m");
    			add_location(th19, file$3, 66, 4, 1393);
    			attr_dev(th20, "rowspan", "3");
    			attr_dev(th20, "class", "svelte-x2ud5m");
    			add_location(th20, file$3, 67, 4, 1426);
    			attr_dev(th21, "rowspan", "3");
    			attr_dev(th21, "class", "svelte-x2ud5m");
    			add_location(th21, file$3, 68, 4, 1464);
    			add_location(tr5, file$3, 62, 0, 1283);
    			attr_dev(th22, "class", "svelte-x2ud5m");
    			add_location(th22, file$3, 71, 4, 1508);
    			add_location(tr6, file$3, 70, 0, 1498);
    			attr_dev(th23, "class", "svelte-x2ud5m");
    			add_location(th23, file$3, 74, 4, 1547);
    			add_location(tr7, file$3, 73, 0, 1537);
    			attr_dev(th24, "class", "svelte-x2ud5m");
    			add_location(th24, file$3, 77, 4, 1586);
    			attr_dev(th25, "colspan", "3");
    			attr_dev(th25, "class", "svelte-x2ud5m");
    			add_location(th25, file$3, 78, 4, 1612);
    			attr_dev(th26, "rowspan", "10");
    			attr_dev(th26, "class", "svelte-x2ud5m");
    			add_location(th26, file$3, 79, 4, 1646);
    			attr_dev(th27, "class", "svelte-x2ud5m");
    			add_location(th27, file$3, 80, 4, 1681);
    			add_location(tr8, file$3, 76, 0, 1576);
    			attr_dev(th28, "class", "svelte-x2ud5m");
    			add_location(th28, file$3, 83, 4, 1716);
    			attr_dev(th29, "rowspan", "3");
    			attr_dev(th29, "class", "svelte-x2ud5m");
    			add_location(th29, file$3, 84, 4, 1742);
    			attr_dev(th30, "rowspan", "3");
    			attr_dev(th30, "class", "svelte-x2ud5m");
    			add_location(th30, file$3, 85, 4, 1780);
    			attr_dev(th31, "rowspan", "3");
    			attr_dev(th31, "class", "svelte-x2ud5m");
    			add_location(th31, file$3, 86, 4, 1813);
    			attr_dev(th32, "rowspan", "3");
    			attr_dev(th32, "class", "svelte-x2ud5m");
    			add_location(th32, file$3, 87, 4, 1849);
    			add_location(tr9, file$3, 82, 0, 1706);
    			attr_dev(th33, "class", "svelte-x2ud5m");
    			add_location(th33, file$3, 90, 4, 1896);
    			add_location(tr10, file$3, 89, 0, 1886);
    			attr_dev(th34, "class", "svelte-x2ud5m");
    			add_location(th34, file$3, 93, 4, 1935);
    			add_location(tr11, file$3, 92, 0, 1925);
    			attr_dev(th35, "class", "svelte-x2ud5m");
    			add_location(th35, file$3, 96, 4, 1974);
    			attr_dev(th36, "colspan", "3");
    			attr_dev(th36, "class", "svelte-x2ud5m");
    			add_location(th36, file$3, 97, 4, 2000);
    			attr_dev(th37, "class", "svelte-x2ud5m");
    			add_location(th37, file$3, 98, 4, 2034);
    			add_location(tr12, file$3, 95, 0, 1964);
    			attr_dev(th38, "class", "svelte-x2ud5m");
    			add_location(th38, file$3, 101, 4, 2069);
    			attr_dev(th39, "rowspan", "3");
    			attr_dev(th39, "class", "svelte-x2ud5m");
    			add_location(th39, file$3, 102, 4, 2095);
    			attr_dev(th40, "rowspan", "3");
    			attr_dev(th40, "class", "svelte-x2ud5m");
    			add_location(th40, file$3, 103, 4, 2126);
    			attr_dev(th41, "rowspan", "3");
    			attr_dev(th41, "class", "svelte-x2ud5m");
    			add_location(th41, file$3, 104, 4, 2158);
    			attr_dev(th42, "rowspan", "3");
    			attr_dev(th42, "class", "svelte-x2ud5m");
    			add_location(th42, file$3, 105, 4, 2190);
    			add_location(tr13, file$3, 100, 0, 2059);
    			attr_dev(th43, "class", "svelte-x2ud5m");
    			add_location(th43, file$3, 108, 4, 2235);
    			add_location(tr14, file$3, 107, 0, 2225);
    			attr_dev(th44, "class", "svelte-x2ud5m");
    			add_location(th44, file$3, 111, 4, 2274);
    			add_location(tr15, file$3, 110, 0, 2264);
    			attr_dev(th45, "class", "svelte-x2ud5m");
    			add_location(th45, file$3, 114, 4, 2313);
    			add_location(tr16, file$3, 113, 0, 2303);
    			attr_dev(th46, "class", "svelte-x2ud5m");
    			add_location(th46, file$3, 117, 4, 2352);
    			add_location(tr17, file$3, 116, 0, 2342);
    			attr_dev(table0, "class", "timeplan svelte-x2ud5m");
    			set_style(table0, "background-color", "white");
    			add_location(table0, file$3, 35, 0, 701);
    			attr_dev(button1, "onclick", "oddetallsuker()");
    			attr_dev(button1, "id", "button");
    			attr_dev(button1, "align", "center");
    			attr_dev(button1, "class", "svelte-x2ud5m");
    			add_location(button1, file$3, 121, 4, 2397);
    			attr_dev(th47, "class", "svelte-x2ud5m");
    			add_location(th47, file$3, 124, 8, 2596);
    			attr_dev(th48, "class", "svelte-x2ud5m");
    			add_location(th48, file$3, 125, 8, 2619);
    			attr_dev(th49, "class", "svelte-x2ud5m");
    			add_location(th49, file$3, 126, 8, 2644);
    			attr_dev(th50, "class", "svelte-x2ud5m");
    			add_location(th50, file$3, 127, 8, 2670);
    			attr_dev(th51, "class", "svelte-x2ud5m");
    			add_location(th51, file$3, 128, 8, 2695);
    			attr_dev(th52, "class", "svelte-x2ud5m");
    			add_location(th52, file$3, 129, 8, 2721);
    			attr_dev(tr18, "class", "timeplan2 svelte-x2ud5m");
    			attr_dev(tr18, "id", "timeplan");
    			add_location(tr18, file$3, 123, 4, 2548);
    			attr_dev(th53, "class", "svelte-x2ud5m");
    			add_location(th53, file$3, 132, 8, 2767);
    			attr_dev(th54, "rowspan", "4");
    			attr_dev(th54, "class", "svelte-x2ud5m");
    			add_location(th54, file$3, 133, 8, 2795);
    			attr_dev(th55, "rowspan", "3");
    			attr_dev(th55, "class", "svelte-x2ud5m");
    			add_location(th55, file$3, 134, 8, 2826);
    			attr_dev(th56, "rowspan", "3");
    			attr_dev(th56, "class", "svelte-x2ud5m");
    			add_location(th56, file$3, 135, 8, 2868);
    			attr_dev(th57, "rowspan", "3");
    			attr_dev(th57, "class", "svelte-x2ud5m");
    			add_location(th57, file$3, 136, 8, 2905);
    			attr_dev(th58, "rowspan", "3");
    			attr_dev(th58, "class", "svelte-x2ud5m");
    			add_location(th58, file$3, 137, 8, 2946);
    			add_location(tr19, file$3, 131, 4, 2753);
    			attr_dev(th59, "class", "svelte-x2ud5m");
    			add_location(th59, file$3, 140, 8, 3001);
    			add_location(tr20, file$3, 139, 4, 2987);
    			attr_dev(th60, "class", "svelte-x2ud5m");
    			add_location(th60, file$3, 143, 8, 3050);
    			add_location(tr21, file$3, 142, 4, 3036);
    			attr_dev(th61, "class", "svelte-x2ud5m");
    			add_location(th61, file$3, 146, 8, 3099);
    			attr_dev(th62, "colspan", "4");
    			attr_dev(th62, "class", "svelte-x2ud5m");
    			add_location(th62, file$3, 147, 8, 3127);
    			add_location(tr22, file$3, 145, 4, 3085);
    			attr_dev(th63, "class", "svelte-x2ud5m");
    			add_location(th63, file$3, 150, 8, 3188);
    			attr_dev(th64, "rowspan", "3");
    			attr_dev(th64, "class", "svelte-x2ud5m");
    			add_location(th64, file$3, 151, 8, 3217);
    			attr_dev(th65, "rowspan", "3");
    			attr_dev(th65, "class", "svelte-x2ud5m");
    			add_location(th65, file$3, 152, 8, 3258);
    			attr_dev(th66, "rowspan", "3");
    			attr_dev(th66, "class", "svelte-x2ud5m");
    			add_location(th66, file$3, 153, 8, 3300);
    			attr_dev(th67, "rowspan", "3");
    			attr_dev(th67, "class", "svelte-x2ud5m");
    			add_location(th67, file$3, 154, 8, 3337);
    			attr_dev(th68, "rowspan", "3");
    			attr_dev(th68, "class", "svelte-x2ud5m");
    			add_location(th68, file$3, 155, 8, 3379);
    			add_location(tr23, file$3, 149, 4, 3174);
    			attr_dev(th69, "class", "svelte-x2ud5m");
    			add_location(th69, file$3, 158, 8, 3435);
    			add_location(tr24, file$3, 157, 4, 3421);
    			attr_dev(th70, "class", "svelte-x2ud5m");
    			add_location(th70, file$3, 161, 8, 3486);
    			add_location(tr25, file$3, 160, 4, 3472);
    			attr_dev(th71, "class", "svelte-x2ud5m");
    			add_location(th71, file$3, 164, 8, 3537);
    			attr_dev(th72, "colspan", "3");
    			attr_dev(th72, "class", "svelte-x2ud5m");
    			add_location(th72, file$3, 165, 8, 3567);
    			attr_dev(th73, "rowspan", "10");
    			attr_dev(th73, "class", "svelte-x2ud5m");
    			add_location(th73, file$3, 166, 8, 3605);
    			attr_dev(th74, "class", "svelte-x2ud5m");
    			add_location(th74, file$3, 167, 8, 3644);
    			add_location(tr26, file$3, 163, 4, 3523);
    			attr_dev(th75, "class", "svelte-x2ud5m");
    			add_location(th75, file$3, 170, 8, 3691);
    			attr_dev(th76, "rowspan", "3");
    			attr_dev(th76, "class", "svelte-x2ud5m");
    			add_location(th76, file$3, 171, 8, 3721);
    			attr_dev(th77, "rowspan", "3");
    			attr_dev(th77, "class", "svelte-x2ud5m");
    			add_location(th77, file$3, 172, 8, 3763);
    			attr_dev(th78, "rowspan", "3");
    			attr_dev(th78, "class", "svelte-x2ud5m");
    			add_location(th78, file$3, 173, 8, 3800);
    			attr_dev(th79, "rowspan", "3");
    			attr_dev(th79, "class", "svelte-x2ud5m");
    			add_location(th79, file$3, 174, 8, 3840);
    			add_location(tr27, file$3, 169, 4, 3677);
    			attr_dev(th80, "class", "svelte-x2ud5m");
    			add_location(th80, file$3, 177, 8, 3899);
    			add_location(tr28, file$3, 176, 4, 3885);
    			attr_dev(th81, "class", "svelte-x2ud5m");
    			add_location(th81, file$3, 180, 8, 3950);
    			add_location(tr29, file$3, 179, 4, 3936);
    			attr_dev(th82, "class", "svelte-x2ud5m");
    			add_location(th82, file$3, 183, 8, 4001);
    			attr_dev(th83, "colspan", "3");
    			attr_dev(th83, "class", "svelte-x2ud5m");
    			add_location(th83, file$3, 184, 8, 4031);
    			attr_dev(th84, "class", "svelte-x2ud5m");
    			add_location(th84, file$3, 185, 8, 4069);
    			add_location(tr30, file$3, 182, 4, 3987);
    			attr_dev(th85, "class", "svelte-x2ud5m");
    			add_location(th85, file$3, 188, 8, 4116);
    			attr_dev(th86, "rowspan", "3");
    			attr_dev(th86, "class", "svelte-x2ud5m");
    			add_location(th86, file$3, 189, 8, 4146);
    			attr_dev(th87, "rowspan", "3");
    			attr_dev(th87, "class", "svelte-x2ud5m");
    			add_location(th87, file$3, 190, 8, 4181);
    			attr_dev(th88, "rowspan", "3");
    			attr_dev(th88, "class", "svelte-x2ud5m");
    			add_location(th88, file$3, 191, 8, 4217);
    			attr_dev(th89, "rowspan", "3");
    			attr_dev(th89, "class", "svelte-x2ud5m");
    			add_location(th89, file$3, 192, 8, 4253);
    			add_location(tr31, file$3, 187, 4, 4102);
    			attr_dev(th90, "class", "svelte-x2ud5m");
    			add_location(th90, file$3, 195, 8, 4310);
    			add_location(tr32, file$3, 194, 4, 4296);
    			attr_dev(th91, "class", "svelte-x2ud5m");
    			add_location(th91, file$3, 198, 8, 4361);
    			add_location(tr33, file$3, 197, 4, 4347);
    			attr_dev(th92, "class", "svelte-x2ud5m");
    			add_location(th92, file$3, 201, 8, 4412);
    			add_location(tr34, file$3, 200, 4, 4398);
    			attr_dev(th93, "class", "svelte-x2ud5m");
    			add_location(th93, file$3, 204, 8, 4463);
    			add_location(tr35, file$3, 203, 4, 4449);
    			attr_dev(table1, "class", "timeplan svelte-x2ud5m");
    			set_style(table1, "background-color", "white");
    			add_location(table1, file$3, 122, 0, 2484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bgimage, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, table0, anchor);
    			append_dev(table0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t4);
    			append_dev(tr0, th1);
    			append_dev(tr0, t6);
    			append_dev(tr0, th2);
    			append_dev(tr0, t8);
    			append_dev(tr0, th3);
    			append_dev(tr0, t10);
    			append_dev(tr0, th4);
    			append_dev(tr0, t12);
    			append_dev(tr0, th5);
    			append_dev(table0, t14);
    			append_dev(table0, tr1);
    			append_dev(tr1, th6);
    			append_dev(tr1, t16);
    			append_dev(tr1, th7);
    			append_dev(tr1, t17);
    			append_dev(tr1, th8);
    			append_dev(tr1, t19);
    			append_dev(tr1, th9);
    			append_dev(tr1, t21);
    			append_dev(tr1, th10);
    			append_dev(tr1, t23);
    			append_dev(tr1, th11);
    			append_dev(table0, t25);
    			append_dev(table0, tr2);
    			append_dev(tr2, th12);
    			append_dev(table0, t27);
    			append_dev(table0, tr3);
    			append_dev(tr3, th13);
    			append_dev(table0, t29);
    			append_dev(table0, tr4);
    			append_dev(tr4, th14);
    			append_dev(tr4, t31);
    			append_dev(tr4, th15);
    			append_dev(table0, t33);
    			append_dev(table0, tr5);
    			append_dev(tr5, th16);
    			append_dev(tr5, t35);
    			append_dev(tr5, th17);
    			append_dev(tr5, t37);
    			append_dev(tr5, th18);
    			append_dev(tr5, t39);
    			append_dev(tr5, th19);
    			append_dev(tr5, t41);
    			append_dev(tr5, th20);
    			append_dev(tr5, t43);
    			append_dev(tr5, th21);
    			append_dev(table0, t45);
    			append_dev(table0, tr6);
    			append_dev(tr6, th22);
    			append_dev(table0, t47);
    			append_dev(table0, tr7);
    			append_dev(tr7, th23);
    			append_dev(table0, t49);
    			append_dev(table0, tr8);
    			append_dev(tr8, th24);
    			append_dev(tr8, t51);
    			append_dev(tr8, th25);
    			append_dev(tr8, t53);
    			append_dev(tr8, th26);
    			append_dev(tr8, t55);
    			append_dev(tr8, th27);
    			append_dev(table0, t57);
    			append_dev(table0, tr9);
    			append_dev(tr9, th28);
    			append_dev(tr9, t59);
    			append_dev(tr9, th29);
    			append_dev(tr9, t61);
    			append_dev(tr9, th30);
    			append_dev(tr9, t63);
    			append_dev(tr9, th31);
    			append_dev(tr9, t65);
    			append_dev(tr9, th32);
    			append_dev(table0, t67);
    			append_dev(table0, tr10);
    			append_dev(tr10, th33);
    			append_dev(table0, t69);
    			append_dev(table0, tr11);
    			append_dev(tr11, th34);
    			append_dev(table0, t71);
    			append_dev(table0, tr12);
    			append_dev(tr12, th35);
    			append_dev(tr12, t73);
    			append_dev(tr12, th36);
    			append_dev(tr12, t75);
    			append_dev(tr12, th37);
    			append_dev(table0, t77);
    			append_dev(table0, tr13);
    			append_dev(tr13, th38);
    			append_dev(tr13, t79);
    			append_dev(tr13, th39);
    			append_dev(tr13, t81);
    			append_dev(tr13, th40);
    			append_dev(tr13, t83);
    			append_dev(tr13, th41);
    			append_dev(tr13, t85);
    			append_dev(tr13, th42);
    			append_dev(table0, t87);
    			append_dev(table0, tr14);
    			append_dev(tr14, th43);
    			append_dev(table0, t89);
    			append_dev(table0, tr15);
    			append_dev(tr15, th44);
    			append_dev(table0, t91);
    			append_dev(table0, tr16);
    			append_dev(tr16, th45);
    			append_dev(table0, t93);
    			append_dev(table0, tr17);
    			append_dev(tr17, th46);
    			insert_dev(target, t95, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t97, anchor);
    			insert_dev(target, table1, anchor);
    			append_dev(table1, tr18);
    			append_dev(tr18, th47);
    			append_dev(tr18, t99);
    			append_dev(tr18, th48);
    			append_dev(tr18, t101);
    			append_dev(tr18, th49);
    			append_dev(tr18, t103);
    			append_dev(tr18, th50);
    			append_dev(tr18, t105);
    			append_dev(tr18, th51);
    			append_dev(tr18, t107);
    			append_dev(tr18, th52);
    			append_dev(table1, t109);
    			append_dev(table1, tr19);
    			append_dev(tr19, th53);
    			append_dev(tr19, t111);
    			append_dev(tr19, th54);
    			append_dev(tr19, t112);
    			append_dev(tr19, th55);
    			append_dev(tr19, t114);
    			append_dev(tr19, th56);
    			append_dev(tr19, t116);
    			append_dev(tr19, th57);
    			append_dev(tr19, t118);
    			append_dev(tr19, th58);
    			append_dev(table1, t120);
    			append_dev(table1, tr20);
    			append_dev(tr20, th59);
    			append_dev(table1, t122);
    			append_dev(table1, tr21);
    			append_dev(tr21, th60);
    			append_dev(table1, t124);
    			append_dev(table1, tr22);
    			append_dev(tr22, th61);
    			append_dev(tr22, t126);
    			append_dev(tr22, th62);
    			append_dev(table1, t128);
    			append_dev(table1, tr23);
    			append_dev(tr23, th63);
    			append_dev(tr23, t130);
    			append_dev(tr23, th64);
    			append_dev(tr23, t132);
    			append_dev(tr23, th65);
    			append_dev(tr23, t134);
    			append_dev(tr23, th66);
    			append_dev(tr23, t136);
    			append_dev(tr23, th67);
    			append_dev(tr23, t138);
    			append_dev(tr23, th68);
    			append_dev(table1, t140);
    			append_dev(table1, tr24);
    			append_dev(tr24, th69);
    			append_dev(table1, t142);
    			append_dev(table1, tr25);
    			append_dev(tr25, th70);
    			append_dev(table1, t144);
    			append_dev(table1, tr26);
    			append_dev(tr26, th71);
    			append_dev(tr26, t146);
    			append_dev(tr26, th72);
    			append_dev(tr26, t148);
    			append_dev(tr26, th73);
    			append_dev(tr26, t150);
    			append_dev(tr26, th74);
    			append_dev(table1, t152);
    			append_dev(table1, tr27);
    			append_dev(tr27, th75);
    			append_dev(tr27, t154);
    			append_dev(tr27, th76);
    			append_dev(tr27, t156);
    			append_dev(tr27, th77);
    			append_dev(tr27, t158);
    			append_dev(tr27, th78);
    			append_dev(tr27, t160);
    			append_dev(tr27, th79);
    			append_dev(table1, t162);
    			append_dev(table1, tr28);
    			append_dev(tr28, th80);
    			append_dev(table1, t164);
    			append_dev(table1, tr29);
    			append_dev(tr29, th81);
    			append_dev(table1, t166);
    			append_dev(table1, tr30);
    			append_dev(tr30, th82);
    			append_dev(tr30, t168);
    			append_dev(tr30, th83);
    			append_dev(tr30, t170);
    			append_dev(tr30, th84);
    			append_dev(table1, t172);
    			append_dev(table1, tr31);
    			append_dev(tr31, th85);
    			append_dev(tr31, t174);
    			append_dev(tr31, th86);
    			append_dev(tr31, t176);
    			append_dev(tr31, th87);
    			append_dev(tr31, t178);
    			append_dev(tr31, th88);
    			append_dev(tr31, t180);
    			append_dev(tr31, th89);
    			append_dev(table1, t182);
    			append_dev(table1, tr32);
    			append_dev(tr32, th90);
    			append_dev(table1, t184);
    			append_dev(table1, tr33);
    			append_dev(tr33, th91);
    			append_dev(table1, t186);
    			append_dev(table1, tr34);
    			append_dev(tr34, th92);
    			append_dev(table1, t188);
    			append_dev(table1, tr35);
    			append_dev(tr35, th93);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bgimage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bgimage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bgimage, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(table0);
    			if (detaching) detach_dev(t95);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t97);
    			if (detaching) detach_dev(table1);
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
    	validate_slots("Timeplan", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timeplan> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bgimage });
    	return [];
    }

    class Timeplan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timeplan",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\sider\spill-bilde.svelte generated by Svelte v3.29.4 */

    const file$4 = "src\\sider\\spill-bilde.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t = text(/*header*/ ctx[1]);
    			attr_dev(h1, "id", "header");
    			attr_dev(h1, "align", "center");
    			attr_dev(h1, "class", "svelte-1crjwag");
    			add_location(h1, file$4, 8, 8, 169);
    			attr_dev(div0, "id", "bgimage");
    			set_style(div0, "background-image", "url('" + /*url*/ ctx[0] + "')");
    			attr_dev(div0, "class", "svelte-1crjwag");
    			add_location(div0, file$4, 7, 6, 102);
    			attr_dev(div1, "class", "main");
    			add_location(div1, file$4, 6, 4, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 2) set_data_dev(t, /*header*/ ctx[1]);

    			if (dirty & /*url*/ 1) {
    				set_style(div0, "background-image", "url('" + /*url*/ ctx[0] + "')");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Spill_bilde", slots, []);
    	let { url } = $$props;
    	let { header } = $$props;
    	const writable_props = ["url", "header"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spill_bilde> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    	};

    	$$self.$capture_state = () => ({ url, header });

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, header];
    }

    class Spill_bilde extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { url: 0, header: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spill_bilde",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*url*/ ctx[0] === undefined && !("url" in props)) {
    			console.warn("<Spill_bilde> was created without expected prop 'url'");
    		}

    		if (/*header*/ ctx[1] === undefined && !("header" in props)) {
    			console.warn("<Spill_bilde> was created without expected prop 'header'");
    		}
    	}

    	get url() {
    		throw new Error("<Spill_bilde>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Spill_bilde>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Spill_bilde>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Spill_bilde>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\sider\spill.svelte generated by Svelte v3.29.4 */
    const file$5 = "src\\sider\\spill.svelte";

    // (8:4) <Link to="snake">
    function create_default_slot(ctx) {
    	let spillbilde;
    	let current;

    	spillbilde = new Spill_bilde({
    			props: {
    				header: "Snake",
    				url: "bilder/Snake.png",
    				id: "snake"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(spillbilde.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spillbilde, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const spillbilde_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				spillbilde_changes.$$scope = { dirty, ctx };
    			}

    			spillbilde.$set(spillbilde_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spillbilde.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spillbilde.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spillbilde, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(8:4) <Link to=\\\"snake\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let bgimage;
    	let t;
    	let div;
    	let link;
    	let current;

    	bgimage = new Bgimage({
    			props: {
    				header: "Spill",
    				underskrift: "",
    				url: "bilder/gaming.png"
    			},
    			$$inline: true
    		});

    	link = new Link({
    			props: {
    				to: "snake",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bgimage.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(link.$$.fragment);
    			attr_dev(div, "class", "spill-holder svelte-1qwddxw");
    			add_location(div, file$5, 6, 0, 230);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bgimage, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(link, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bgimage.$$.fragment, local);
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bgimage.$$.fragment, local);
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bgimage, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(link);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Spill", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spill> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bgimage, SpillBilde: Spill_bilde, Link });
    	return [];
    }

    class Spill extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spill",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\beemovie.svelte generated by Svelte v3.29.4 */

    const file$6 = "src\\beemovie.svelte";

    function create_fragment$8(ctx) {
    	let pre;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			pre.textContent = "According to all known laws\r\n    of aviation,\r\n    \r\n      \r\n    there is no way a bee\r\n    should be able to fly.\r\n    \r\n      \r\n    Its wings are too small to get\r\n    its fat little body off the ground.\r\n    \r\n      \r\n    The bee, of course, flies anyway\r\n    \r\n      \r\n    because bees don't care\r\n    what humans think is impossible.\r\n    \r\n      \r\n    Yellow, black. Yellow, black.\r\n    Yellow, black. Yellow, black.\r\n    \r\n      \r\n    Ooh, black and yellow!\r\n    Let's shake it up a little.\r\n    \r\n      \r\n    Barry! Breakfast is ready!\r\n    \r\n      \r\n    Ooming!\r\n    \r\n      \r\n    Hang on a second.\r\n    \r\n      \r\n    Hello?\r\n    \r\n      \r\n    - Barry?\r\n    - Adam?\r\n    \r\n      \r\n    - Oan you believe this is happening?\r\n    - I can't. I'll pick you up.\r\n    \r\n      \r\n    Looking sharp.\r\n    \r\n      \r\n    Use the stairs. Your father\r\n    paid good money for those.\r\n    \r\n      \r\n    Sorry. I'm excited.\r\n    \r\n      \r\n    Here's the graduate.\r\n    We're very proud of you, son.\r\n    \r\n      \r\n    A perfect report card, all B's.\r\n    \r\n      \r\n    Very proud.\r\n    \r\n      \r\n    Ma! I got a thing going here.\r\n    \r\n      \r\n    - You got lint on your fuzz.\r\n    - Ow! That's me!\r\n    \r\n      \r\n    - Wave to us! We'll be in row 118,000.\r\n    - Bye!\r\n    \r\n      \r\n    Barry, I told you,\r\n    stop flying in the house!\r\n    \r\n      \r\n    - Hey, Adam.\r\n    - Hey, Barry.\r\n    \r\n      \r\n    - Is that fuzz gel?\r\n    - A little. Special day, graduation.\r\n    \r\n      \r\n    Never thought I'd make it.\r\n    \r\n      \r\n    Three days grade school,\r\n    three days high school.\r\n    \r\n      \r\n    Those were awkward.\r\n    \r\n      \r\n    Three days college. I'm glad I took\r\n    a day and hitchhiked around the hive.\r\n    \r\n      \r\n    You did come back different.\r\n    \r\n      \r\n    - Hi, Barry.\r\n    - Artie, growing a mustache? Looks good.\r\n    \r\n      \r\n    - Hear about Frankie?\r\n    - Yeah.\r\n    \r\n      \r\n    - You going to the funeral?\r\n    - No, I'm not going.\r\n    \r\n      \r\n    Everybody knows,\r\n    sting someone, you die.\r\n    \r\n      \r\n    Don't waste it on a squirrel.\r\n    Such a hothead.\r\n    \r\n      \r\n    I guess he could have\r\n    just gotten out of the way.\r\n    \r\n      \r\n    I love this incorporating\r\n    an amusement park into our day.\r\n    \r\n      \r\n    That's why we don't need vacations.\r\n    \r\n      \r\n    Boy, quite a bit of pomp...\r\n    under the circumstances.\r\n    \r\n      \r\n    - Well, Adam, today we are men.\r\n    - We are!\r\n    \r\n      \r\n    - Bee-men.\r\n    - Amen!\r\n    \r\n      \r\n    Hallelujah!\r\n    \r\n      \r\n    Students, faculty, distinguished bees,\r\n    \r\n      \r\n    please welcome Dean Buzzwell.\r\n    \r\n      \r\n    Welcome, New Hive Oity\r\n    graduating class of...\r\n    \r\n      \r\n    ...9:15.\r\n    \r\n      \r\n    That concludes our ceremonies.\r\n    \r\n      \r\n    And begins your career\r\n    at Honex Industries!\r\n    \r\n      \r\n    Will we pick ourjob today?\r\n    \r\n      \r\n    I heard it's just orientation.\r\n    \r\n      \r\n    Heads up! Here we go.\r\n    \r\n      \r\n    Keep your hands and antennas\r\n    inside the tram at all times.\r\n    \r\n      \r\n    - Wonder what it'll be like?\r\n    - A little scary.\r\n    \r\n      \r\n    Welcome to Honex,\r\n    a division of Honesco\r\n    \r\n      \r\n    and a part of the Hexagon Group.\r\n    \r\n      \r\n    This is it!\r\n    \r\n      \r\n    Wow.\r\n    \r\n      \r\n    Wow.\r\n    \r\n      \r\n    We know that you, as a bee,\r\n    have worked your whole life\r\n    \r\n      \r\n    to get to the point where you\r\n    can work for your whole life.\r\n    \r\n      \r\n    Honey begins when our valiant Pollen\r\n    Jocks bring the nectar to the hive.\r\n    \r\n      \r\n    Our top-secret formula\r\n    \r\n      \r\n    is automatically color-corrected,\r\n    scent-adjusted and bubble-contoured\r\n    \r\n      \r\n    into this soothing sweet syrup\r\n    \r\n      \r\n    with its distinctive\r\n    golden glow you know as...\r\n    \r\n      \r\n    Honey!\r\n    \r\n      \r\n    - That girl was hot.\r\n    - She's my cousin!\r\n    \r\n      \r\n    - She is?\r\n    - Yes, we're all cousins.\r\n    \r\n      \r\n    - Right. You're right.\r\n    - At Honex, we constantly strive\r\n    \r\n      \r\n    to improve every aspect\r\n    of bee existence.\r\n    \r\n      \r\n    These bees are stress-testing\r\n    a new helmet technology.\r\n    \r\n      \r\n    - What do you think he makes?\r\n    - Not enough.\r\n    \r\n      \r\n    Here we have our latest advancement,\r\n    the Krelman.\r\n    \r\n      \r\n    - What does that do?\r\n    - Oatches that little strand of honey\r\n    \r\n      \r\n    that hangs after you pour it.\r\n    Saves us millions.\r\n    \r\n      \r\n    Oan anyone work on the Krelman?\r\n    \r\n      \r\n    Of course. Most bee jobs are\r\n    small ones. But bees know\r\n    \r\n      \r\n    that every small job,\r\n    if it's done well, means a lot.\r\n    \r\n      \r\n    But choose carefully\r\n    \r\n      \r\n    because you'll stay in the job\r\n    you pick for the rest of your life.\r\n    \r\n      \r\n    The same job the rest of your life?\r\n    I didn't know that.\r\n    \r\n      \r\n    What's the difference?\r\n    \r\n      \r\n    You'll be happy to know that bees,\r\n    as a species, haven't had one day off\r\n    \r\n      \r\n    in 27 million years.\r\n    \r\n      \r\n    So you'll just work us to death?\r\n    \r\n      \r\n    We'll sure try.\r\n    \r\n      \r\n    Wow! That blew my mind!\r\n    \r\n      \r\n    \"What's the difference?\"\r\n    How can you say that?\r\n    \r\n      \r\n    One job forever?\r\n    That's an insane choice to have to make.\r\n    \r\n      \r\n    I'm relieved. Now we only have\r\n    to make one decision in life.\r\n    \r\n      \r\n    But, Adam, how could they\r\n    never have told us that?\r\n    \r\n      \r\n    Why would you question anything?\r\n    We're bees.\r\n    \r\n      \r\n    We're the most perfectly\r\n    functioning society on Earth.\r\n    \r\n      \r\n    You ever think maybe things\r\n    work a little too well here?\r\n    \r\n      \r\n    Like what? Give me one example.\r\n    \r\n      \r\n    I don't know. But you know\r\n    what I'm talking about.\r\n    \r\n      \r\n    Please clear the gate.\r\n    Royal Nectar Force on approach.\r\n    \r\n      \r\n    Wait a second. Oheck it out.\r\n    \r\n      \r\n    - Hey, those are Pollen Jocks!\r\n    - Wow.\r\n    \r\n      \r\n    I've never seen them this close.\r\n    \r\n      \r\n    They know what it's like\r\n    outside the hive.\r\n    \r\n      \r\n    Yeah, but some don't come back.\r\n    \r\n      \r\n    - Hey, Jocks!\r\n    - Hi, Jocks!\r\n    \r\n      \r\n    You guys did great!\r\n    \r\n      \r\n    You're monsters!\r\n    You're sky freaks! I love it! I love it!\r\n    \r\n      \r\n    - I wonder where they were.\r\n    - I don't know.\r\n    \r\n      \r\n    Their day's not planned.\r\n    \r\n      \r\n    Outside the hive, flying who knows\r\n    where, doing who knows what.\r\n    \r\n      \r\n    You can'tjust decide to be a Pollen\r\n    Jock. You have to be bred for that.\r\n    \r\n      \r\n    Right.\r\n    \r\n      \r\n    Look. That's more pollen\r\n    than you and I will see in a lifetime.\r\n    \r\n      \r\n    It's just a status symbol.\r\n    Bees make too much of it.\r\n    \r\n      \r\n    Perhaps. Unless you're wearing it\r\n    and the ladies see you wearing it.\r\n    \r\n      \r\n    Those ladies?\r\n    Aren't they our cousins too?\r\n    \r\n      \r\n    Distant. Distant.\r\n    \r\n      \r\n    Look at these two.\r\n    \r\n      \r\n    - Oouple of Hive Harrys.\r\n    - Let's have fun with them.\r\n    \r\n      \r\n    It must be dangerous\r\n    being a Pollen Jock.\r\n    \r\n      \r\n    Yeah. Once a bear pinned me\r\n    against a mushroom!\r\n    \r\n      \r\n    He had a paw on my throat,\r\n    and with the other, he was slapping me!\r\n    \r\n      \r\n    - Oh, my!\r\n    - I never thought I'd knock him out.\r\n    \r\n      \r\n    What were you doing during this?\r\n    \r\n      \r\n    Trying to alert the authorities.\r\n    \r\n      \r\n    I can autograph that.\r\n    \r\n      \r\n    A little gusty out there today,\r\n    wasn't it, comrades?\r\n    \r\n      \r\n    Yeah. Gusty.\r\n    \r\n      \r\n    We're hitting a sunflower patch\r\n    six miles from here tomorrow.\r\n    \r\n      \r\n    - Six miles, huh?\r\n    - Barry!\r\n    \r\n      \r\n    A puddle jump for us,\r\n    but maybe you're not up for it.\r\n    \r\n      \r\n    - Maybe I am.\r\n    - You are not!\r\n    \r\n      \r\n    We're going 0900 at J-Gate.\r\n    \r\n      \r\n    What do you think, buzzy-boy?\r\n    Are you bee enough?\r\n    \r\n      \r\n    I might be. It all depends\r\n    on what 0900 means.\r\n    \r\n      \r\n    Hey, Honex!\r\n    \r\n      \r\n    Dad, you surprised me.\r\n    \r\n      \r\n    You decide what you're interested in?\r\n    \r\n      \r\n    - Well, there's a lot of choices.\r\n    - But you only get one.\r\n    \r\n      \r\n    Do you ever get bored\r\n    doing the same job every day?\r\n    \r\n      \r\n    Son, let me tell you about stirring.\r\n    \r\n      \r\n    You grab that stick, and you just\r\n    move it around, and you stir it around.\r\n    \r\n      \r\n    You get yourself into a rhythm.\r\n    It's a beautiful thing.\r\n    \r\n      \r\n    You know, Dad,\r\n    the more I think about it,\r\n    \r\n      \r\n    maybe the honey field\r\n    just isn't right for me.\r\n    \r\n      \r\n    You were thinking of what,\r\n    making balloon animals?\r\n    \r\n      \r\n    That's a bad job\r\n    for a guy with a stinger.\r\n    \r\n      \r\n    Janet, your son's not sure\r\n    he wants to go into honey!\r\n    \r\n      \r\n    - Barry, you are so funny sometimes.\r\n    - I'm not trying to be funny.\r\n    \r\n      \r\n    You're not funny! You're going\r\n    into honey. Our son, the stirrer!\r\n    \r\n      \r\n    - You're gonna be a stirrer?\r\n    - No one's listening to me!\r\n    \r\n      \r\n    Wait till you see the sticks I have.\r\n    \r\n      \r\n    I could say anything right now.\r\n    I'm gonna get an ant tattoo!\r\n    \r\n      \r\n    Let's open some honey and celebrate!\r\n    \r\n      \r\n    Maybe I'll pierce my thorax.\r\n    Shave my antennae.\r\n    \r\n      \r\n    Shack up with a grasshopper. Get\r\n    a gold tooth and call everybody \"dawg\"!\r\n    \r\n      \r\n    I'm so proud.\r\n    \r\n      \r\n    - We're starting work today!\r\n    - Today's the day.\r\n    \r\n      \r\n    Oome on! All the good jobs\r\n    will be gone.\r\n    \r\n      \r\n    Yeah, right.\r\n    \r\n      \r\n    Pollen counting, stunt bee, pouring,\r\n    stirrer, front desk, hair removal...\r\n    \r\n      \r\n    - Is it still available?\r\n    - Hang on. Two left!\r\n    \r\n      \r\n    One of them's yours! Oongratulations!\r\n    Step to the side.\r\n    \r\n      \r\n    - What'd you get?\r\n    - Picking crud out. Stellar!\r\n    \r\n      \r\n    Wow!\r\n    \r\n      \r\n    Oouple of newbies?\r\n    \r\n      \r\n    Yes, sir! Our first day! We are ready!\r\n    \r\n      \r\n    Make your choice.\r\n    \r\n      \r\n    - You want to go first?\r\n    - No, you go.\r\n    \r\n      \r\n    Oh, my. What's available?\r\n    \r\n      \r\n    Restroom attendant's open,\r\n    not for the reason you think.\r\n    \r\n      \r\n    - Any chance of getting the Krelman?\r\n    - Sure, you're on.\r\n    \r\n      \r\n    I'm sorry, the Krelman just closed out.\r\n    \r\n      \r\n    Wax monkey's always open.\r\n    \r\n      \r\n    The Krelman opened up again.\r\n    \r\n      \r\n    What happened?\r\n    \r\n      \r\n    A bee died. Makes an opening. See?\r\n    He's dead. Another dead one.\r\n    \r\n      \r\n    Deady. Deadified. Two more dead.\r\n    \r\n      \r\n    Dead from the neck up.\r\n    Dead from the neck down. That's life!\r\n    \r\n      \r\n    Oh, this is so hard!\r\n    \r\n      \r\n    Heating, cooling,\r\n    stunt bee, pourer, stirrer,\r\n    \r\n      \r\n    humming, inspector number seven,\r\n    lint coordinator, stripe supervisor,\r\n    \r\n      \r\n    mite wrangler. Barry, what\r\n    do you think I should... Barry?\r\n    \r\n      \r\n    Barry!\r\n    \r\n      \r\n    All right, we've got the sunflower patch\r\n    in quadrant nine...\r\n    \r\n      \r\n    What happened to you?\r\n    Where are you?\r\n    \r\n      \r\n    - I'm going out.\r\n    - Out? Out where?\r\n    \r\n      \r\n    - Out there.\r\n    - Oh, no!\r\n    \r\n      \r\n    I have to, before I go\r\n    to work for the rest of my life.\r\n    \r\n      \r\n    You're gonna die! You're crazy! Hello?\r\n    \r\n      \r\n    Another call coming in.\r\n    \r\n      \r\n    If anyone's feeling brave,\r\n    there's a Korean deli on 83rd\r\n    \r\n      \r\n    that gets their roses today.\r\n    \r\n      \r\n    Hey, guys.\r\n    \r\n      \r\n    - Look at that.\r\n    - Isn't that the kid we saw yesterday?\r\n    \r\n      \r\n    Hold it, son, flight deck's restricted.\r\n    \r\n      \r\n    It's OK, Lou. We're gonna take him up.\r\n    \r\n      \r\n    Really? Feeling lucky, are you?\r\n    \r\n      \r\n    Sign here, here. Just initial that.\r\n    \r\n      \r\n    - Thank you.\r\n    - OK.\r\n    \r\n      \r\n    You got a rain advisory today,\r\n    \r\n      \r\n    and as you all know,\r\n    bees cannot fly in rain.\r\n    \r\n      \r\n    So be careful. As always,\r\n    watch your brooms,\r\n    \r\n      \r\n    hockey sticks, dogs,\r\n    birds, bears and bats.\r\n    \r\n      \r\n    Also, I got a couple of reports\r\n    of root beer being poured on us.\r\n    \r\n      \r\n    Murphy's in a home because of it,\r\n    babbling like a cicada!\r\n    \r\n      \r\n    - That's awful.\r\n    - And a reminder for you rookies,\r\n    \r\n      \r\n    bee law number one,\r\n    absolutely no talking to humans!\r\n    \r\n      \r\n    All right, launch positions!\r\n    \r\n      \r\n    Buzz, buzz, buzz, buzz! Buzz, buzz,\r\n    buzz, buzz! Buzz, buzz, buzz, buzz!\r\n    \r\n      \r\n    Black and yellow!\r\n    \r\n      \r\n    Hello!\r\n    \r\n      \r\n    You ready for this, hot shot?\r\n    \r\n      \r\n    Yeah. Yeah, bring it on.\r\n    \r\n      \r\n    Wind, check.\r\n    \r\n      \r\n    - Antennae, check.\r\n    - Nectar pack, check.\r\n    \r\n      \r\n    - Wings, check.\r\n    - Stinger, check.\r\n    \r\n      \r\n    Scared out of my shorts, check.\r\n    \r\n      \r\n    OK, ladies,\r\n    \r\n      \r\n    let's move it out!\r\n    \r\n      \r\n    Pound those petunias,\r\n    you striped stem-suckers!\r\n    \r\n      \r\n    All of you, drain those flowers!\r\n    \r\n      \r\n    Wow! I'm out!\r\n    \r\n      \r\n    I can't believe I'm out!\r\n    \r\n      \r\n    So blue.\r\n    \r\n      \r\n    I feel so fast and free!\r\n    \r\n      \r\n    Box kite!\r\n    \r\n      \r\n    Wow!\r\n    \r\n      \r\n    Flowers!\r\n    \r\n      \r\n    This is Blue Leader.\r\n    We have roses visual.\r\n    \r\n      \r\n    Bring it around 30 degrees and hold.\r\n    \r\n      \r\n    Roses!\r\n    \r\n      \r\n    30 degrees, roger. Bringing it around.\r\n    \r\n      \r\n    Stand to the side, kid.\r\n    It's got a bit of a kick.\r\n    \r\n      \r\n    That is one nectar collector!\r\n    \r\n      \r\n    - Ever see pollination up close?\r\n    - No, sir.\r\n    \r\n      \r\n    I pick up some pollen here, sprinkle it\r\n    over here. Maybe a dash over there,\r\n    \r\n      \r\n    a pinch on that one.\r\n    See that? It's a little bit of magic.\r\n    \r\n      \r\n    That's amazing. Why do we do that?\r\n    \r\n      \r\n    That's pollen power. More pollen, more\r\n    flowers, more nectar, more honey for us.\r\n    \r\n      \r\n    Oool.\r\n    \r\n      \r\n    I'm picking up a lot of bright yellow.\r\n    Oould be daisies. Don't we need those?\r\n    \r\n      \r\n    Oopy that visual.\r\n    \r\n      \r\n    Wait. One of these flowers\r\n    seems to be on the move.\r\n    \r\n      \r\n    Say again? You're reporting\r\n    a moving flower?\r\n    \r\n      \r\n    Affirmative.\r\n    \r\n      \r\n    That was on the line!\r\n    \r\n      \r\n    This is the coolest. What is it?\r\n    \r\n      \r\n    I don't know, but I'm loving this color.\r\n    \r\n      \r\n    It smells good.\r\n    Not like a flower, but I like it.\r\n    \r\n      \r\n    Yeah, fuzzy.\r\n    \r\n      \r\n    Ohemical-y.\r\n    \r\n      \r\n    Oareful, guys. It's a little grabby.\r\n    \r\n      \r\n    My sweet lord of bees!\r\n    \r\n      \r\n    Oandy-brain, get off there!\r\n    \r\n      \r\n    Problem!\r\n    \r\n      \r\n    - Guys!\r\n    - This could be bad.\r\n    \r\n      \r\n    Affirmative.\r\n    \r\n      \r\n    Very close.\r\n    \r\n      \r\n    Gonna hurt.\r\n    \r\n      \r\n    Mama's little boy.\r\n    \r\n      \r\n    You are way out of position, rookie!\r\n    \r\n      \r\n    Ooming in at you like a missile!\r\n    \r\n      \r\n    Help me!\r\n    \r\n      \r\n    I don't think these are flowers.\r\n    \r\n      \r\n    - Should we tell him?\r\n    - I think he knows.\r\n    \r\n      \r\n    What is this?!\r\n    \r\n      \r\n    Match point!\r\n    \r\n      \r\n    You can start packing up, honey,\r\n    because you're about to eat it!\r\n    \r\n      \r\n    Yowser!\r\n    \r\n      \r\n    Gross.\r\n    \r\n      \r\n    There's a bee in the car!\r\n    \r\n      \r\n    - Do something!\r\n    - I'm driving!\r\n    \r\n      \r\n    - Hi, bee.\r\n    - He's back here!\r\n    \r\n      \r\n    He's going to sting me!\r\n    \r\n      \r\n    Nobody move. If you don't move,\r\n    he won't sting you. Freeze!\r\n    \r\n      \r\n    He blinked!\r\n    \r\n      \r\n    Spray him, Granny!\r\n    \r\n      \r\n    What are you doing?!\r\n    \r\n      \r\n    Wow... the tension level\r\n    out here is unbelievable.\r\n    \r\n      \r\n    I gotta get home.\r\n    \r\n      \r\n    Oan't fly in rain.\r\n    \r\n      \r\n    Oan't fly in rain.\r\n    \r\n      \r\n    Oan't fly in rain.\r\n    \r\n      \r\n    Mayday! Mayday! Bee going down!\r\n    \r\n      \r\n    Ken, could you close\r\n    the window please?\r\n    \r\n      \r\n    Ken, could you close\r\n    the window please?\r\n    \r\n      \r\n    Oheck out my new resume.\r\n    I made it into a fold-out brochure.\r\n    \r\n      \r\n    You see? Folds out.\r\n    \r\n      \r\n    Oh, no. More humans. I don't need this.\r\n    \r\n      \r\n    What was that?\r\n    \r\n      \r\n    Maybe this time. This time. This time.\r\n    This time! This time! This...\r\n    \r\n      \r\n    Drapes!\r\n    \r\n      \r\n    That is diabolical.\r\n    \r\n      \r\n    It's fantastic. It's got all my special\r\n    skills, even my top-ten favorite movies.\r\n    \r\n      \r\n    What's number one? Star Wars?\r\n    \r\n      \r\n    Nah, I don't go for that...\r\n    \r\n      \r\n    ...kind of stuff.\r\n    \r\n      \r\n    No wonder we shouldn't talk to them.\r\n    They're out of their minds.\r\n    \r\n      \r\n    When I leave a job interview, they're\r\n    flabbergasted, can't believe what I say.\r\n    \r\n      \r\n    There's the sun. Maybe that's a way out.\r\n    \r\n      \r\n    I don't remember the sun\r\n    having a big 75 on it.\r\n    \r\n      \r\n    I predicted global warming.\r\n    \r\n      \r\n    I could feel it getting hotter.\r\n    At first I thought it was just me.\r\n    \r\n      \r\n    Wait! Stop! Bee!\r\n    \r\n      \r\n    Stand back. These are winter boots.\r\n    \r\n      \r\n    Wait!\r\n    \r\n      \r\n    Don't kill him!\r\n    \r\n      \r\n    You know I'm allergic to them!\r\n    This thing could kill me!\r\n    \r\n      \r\n    Why does his life have\r\n    less value than yours?\r\n    \r\n      \r\n    Why does his life have any less value\r\n    than mine? Is that your statement?\r\n    \r\n      \r\n    I'm just saying all life has value. You\r\n    don't know what he's capable of feeling.\r\n    \r\n      \r\n    My brochure!\r\n    \r\n      \r\n    There you go, little guy.\r\n    \r\n      \r\n    I'm not scared of him.\r\n    It's an allergic thing.\r\n    \r\n      \r\n    Put that on your resume brochure.\r\n    \r\n      \r\n    My whole face could puff up.\r\n    \r\n      \r\n    Make it one of your special skills.\r\n    \r\n      \r\n    Knocking someone out\r\n    is also a special skill.\r\n    \r\n      \r\n    Right. Bye, Vanessa. Thanks.\r\n    \r\n      \r\n    - Vanessa, next week? Yogurt night?\r\n    - Sure, Ken. You know, whatever.\r\n    \r\n      \r\n    - You could put carob chips on there.\r\n    - Bye.\r\n    \r\n      \r\n    - Supposed to be less calories.\r\n    - Bye.\r\n    \r\n      \r\n    I gotta say something.\r\n    \r\n      \r\n    She saved my life.\r\n    I gotta say something.\r\n    \r\n      \r\n    All right, here it goes.\r\n    \r\n      \r\n    Nah.\r\n    \r\n      \r\n    What would I say?\r\n    \r\n      \r\n    I could really get in trouble.\r\n    \r\n      \r\n    It's a bee law.\r\n    You're not supposed to talk to a human.\r\n    \r\n      \r\n    I can't believe I'm doing this.\r\n    \r\n      \r\n    I've got to.\r\n    \r\n      \r\n    Oh, I can't do it. Oome on!\r\n    \r\n      \r\n    No. Yes. No.\r\n    \r\n      \r\n    Do it. I can't.\r\n    \r\n      \r\n    How should I start it?\r\n    \"You like jazz?\" No, that's no good.\r\n    \r\n      \r\n    Here she comes! Speak, you fool!\r\n    \r\n      \r\n    Hi!\r\n    \r\n      \r\n    I'm sorry.\r\n    \r\n      \r\n    - You're talking.\r\n    - Yes, I know.\r\n    \r\n      \r\n    You're talking!\r\n    \r\n      \r\n    I'm so sorry.\r\n    \r\n      \r\n    No, it's OK. It's fine.\r\n    I know I'm dreaming.\r\n    \r\n      \r\n    But I don't recall going to bed.\r\n    \r\n      \r\n    Well, I'm sure this\r\n    is very disconcerting.\r\n    \r\n      \r\n    This is a bit of a surprise to me.\r\n    I mean, you're a bee!\r\n    \r\n      \r\n    I am. And I'm not supposed\r\n    to be doing this,\r\n    \r\n      \r\n    but they were all trying to kill me.\r\n    \r\n      \r\n    And if it wasn't for you...\r\n    \r\n      \r\n    I had to thank you.\r\n    It's just how I was raised.\r\n    \r\n      \r\n    That was a little weird.\r\n    \r\n      \r\n    - I'm talking with a bee.\r\n    - Yeah.\r\n    \r\n      \r\n    I'm talking to a bee.\r\n    And the bee is talking to me!\r\n    \r\n      \r\n    I just want to say I'm grateful.\r\n    I'll leave now.\r\n    \r\n      \r\n    - Wait! How did you learn to do that?\r\n    - What?\r\n    \r\n      \r\n    The talking thing.\r\n    \r\n      \r\n    Same way you did, I guess.\r\n    \"Mama, Dada, honey.\" You pick it up.\r\n    \r\n      \r\n    - That's very funny.\r\n    - Yeah.\r\n    \r\n      \r\n    Bees are funny. If we didn't laugh,\r\n    we'd cry with what we have to deal with.\r\n    \r\n      \r\n    Anyway...\r\n    \r\n      \r\n    Oan I...\r\n    \r\n      \r\n    ...get you something?\r\n    - Like what?\r\n    \r\n      \r\n    I don't know. I mean...\r\n    I don't know. Ooffee?\r\n    \r\n      \r\n    I don't want to put you out.\r\n    \r\n      \r\n    It's no trouble. It takes two minutes.\r\n    \r\n      \r\n    - It's just coffee.\r\n    - I hate to impose.\r\n    \r\n      \r\n    - Don't be ridiculous!\r\n    - Actually, I would love a cup.\r\n    \r\n      \r\n    Hey, you want rum cake?\r\n    \r\n      \r\n    - I shouldn't.\r\n    - Have some.\r\n    \r\n      \r\n    - No, I can't.\r\n    - Oome on!\r\n    \r\n      \r\n    I'm trying to lose a couple micrograms.\r\n    \r\n      \r\n    - Where?\r\n    - These stripes don't help.\r\n    \r\n      \r\n    You look great!\r\n    \r\n      \r\n    I don't know if you know\r\n    anything about fashion.\r\n    \r\n      \r\n    Are you all right?\r\n    \r\n      \r\n    No.\r\n    \r\n      \r\n    He's making the tie in the cab\r\n    as they're flying up Madison.\r\n    \r\n      \r\n    He finally gets there.\r\n    \r\n      \r\n    He runs up the steps into the church.\r\n    The wedding is on.\r\n    \r\n      \r\n    And he says, \"Watermelon?\r\n    I thought you said Guatemalan.\r\n    \r\n      \r\n    Why would I marry a watermelon?\"\r\n    \r\n      \r\n    Is that a bee joke?\r\n    \r\n      \r\n    That's the kind of stuff we do.\r\n    \r\n      \r\n    Yeah, different.\r\n    \r\n      \r\n    So, what are you gonna do, Barry?\r\n    \r\n      \r\n    About work? I don't know.\r\n    \r\n      \r\n    I want to do my part for the hive,\r\n    but I can't do it the way they want.\r\n    \r\n      \r\n    I know how you feel.\r\n    \r\n      \r\n    - You do?\r\n    - Sure.\r\n    \r\n      \r\n    My parents wanted me to be a lawyer or\r\n    a doctor, but I wanted to be a florist.\r\n    \r\n      \r\n    - Really?\r\n    - My only interest is flowers.\r\n    \r\n      \r\n    Our new queen was just elected\r\n    with that same campaign slogan.\r\n    \r\n      \r\n    Anyway, if you look...\r\n    \r\n      \r\n    There's my hive right there. See it?\r\n    \r\n      \r\n    You're in Sheep Meadow!\r\n    \r\n      \r\n    Yes! I'm right off the Turtle Pond!\r\n    \r\n      \r\n    No way! I know that area.\r\n    I lost a toe ring there once.\r\n    \r\n      \r\n    - Why do girls put rings on their toes?\r\n    - Why not?\r\n    \r\n      \r\n    - It's like putting a hat on your knee.\r\n    - Maybe I'll try that.\r\n    \r\n      \r\n    - You all right, ma'am?\r\n    - Oh, yeah. Fine.\r\n    \r\n      \r\n    Just having two cups of coffee!\r\n    \r\n      \r\n    Anyway, this has been great.\r\n    Thanks for the coffee.\r\n    \r\n      \r\n    Yeah, it's no trouble.\r\n    \r\n      \r\n    Sorry I couldn't finish it. If I did,\r\n    I'd be up the rest of my life.\r\n    \r\n      \r\n    Are you...?\r\n    \r\n      \r\n    Oan I take a piece of this with me?\r\n    \r\n      \r\n    Sure! Here, have a crumb.\r\n    \r\n      \r\n    - Thanks!\r\n    - Yeah.\r\n    \r\n      \r\n    All right. Well, then...\r\n    I guess I'll see you around.\r\n    \r\n      \r\n    Or not.\r\n    \r\n      \r\n    OK, Barry.\r\n    \r\n      \r\n    And thank you\r\n    so much again... for before.\r\n    \r\n      \r\n    Oh, that? That was nothing.\r\n    \r\n      \r\n    Well, not nothing, but... Anyway...\r\n    \r\n      \r\n    This can't possibly work.\r\n    \r\n      \r\n    He's all set to go.\r\n    We may as well try it.\r\n    \r\n      \r\n    OK, Dave, pull the chute.\r\n    \r\n      \r\n    - Sounds amazing.\r\n    - It was amazing!\r\n    \r\n      \r\n    It was the scariest,\r\n    happiest moment of my life.\r\n    \r\n      \r\n    Humans! I can't believe\r\n    you were with humans!\r\n    \r\n      \r\n    Giant, scary humans!\r\n    What were they like?\r\n    \r\n      \r\n    Huge and crazy. They talk crazy.\r\n    \r\n      \r\n    They eat crazy giant things.\r\n    They drive crazy.\r\n    \r\n      \r\n    - Do they try and kill you, like on TV?\r\n    - Some of them. But some of them don't.\r\n    \r\n      \r\n    - How'd you get back?\r\n    - Poodle.\r\n    \r\n      \r\n    You did it, and I'm glad. You saw\r\n    whatever you wanted to see.\r\n    \r\n      \r\n    You had your \"experience.\" Now you\r\n    can pick out yourjob and be normal.\r\n    \r\n      \r\n    - Well...\r\n    - Well?\r\n    \r\n      \r\n    Well, I met someone.\r\n    \r\n      \r\n    You did? Was she Bee-ish?\r\n    \r\n      \r\n    - A wasp?! Your parents will kill you!\r\n    - No, no, no, not a wasp.\r\n    \r\n      \r\n    - Spider?\r\n    - I'm not attracted to spiders.\r\n    \r\n      \r\n    I know it's the hottest thing,\r\n    with the eight legs and all.\r\n    \r\n      \r\n    I can't get by that face.\r\n    \r\n      \r\n    So who is she?\r\n    \r\n      \r\n    She's... human.\r\n    \r\n      \r\n    No, no. That's a bee law.\r\n    You wouldn't break a bee law.\r\n    \r\n      \r\n    - Her name's Vanessa.\r\n    - Oh, boy.\r\n    \r\n      \r\n    She's so nice. And she's a florist!\r\n    \r\n      \r\n    Oh, no! You're dating a human florist!\r\n    \r\n      \r\n    We're not dating.\r\n    \r\n      \r\n    You're flying outside the hive, talking\r\n    to humans that attack our homes\r\n    \r\n      \r\n    with power washers and M-80s!\r\n    One-eighth a stick of dynamite!\r\n    \r\n      \r\n    She saved my life!\r\n    And she understands me.\r\n    \r\n      \r\n    This is over!\r\n    \r\n      \r\n    Eat this.\r\n    \r\n      \r\n    This is not over! What was that?\r\n    \r\n      \r\n    - They call it a crumb.\r\n    - It was so stingin' stripey!\r\n    \r\n      \r\n    And that's not what they eat.\r\n    That's what falls off what they eat!\r\n    \r\n      \r\n    - You know what a Oinnabon is?\r\n    - No.\r\n    \r\n      \r\n    It's bread and cinnamon and frosting.\r\n    They heat it up...\r\n    \r\n      \r\n    Sit down!\r\n    \r\n      \r\n    ...really hot!\r\n    - Listen to me!\r\n    \r\n      \r\n    We are not them! We're us.\r\n    There's us and there's them!\r\n    \r\n      \r\n    Yes, but who can deny\r\n    the heart that is yearning?\r\n    \r\n      \r\n    There's no yearning.\r\n    Stop yearning. Listen to me!\r\n    \r\n      \r\n    You have got to start thinking bee,\r\n    my friend. Thinking bee!\r\n    \r\n      \r\n    - Thinking bee.\r\n    - Thinking bee.\r\n    \r\n      \r\n    Thinking bee! Thinking bee!\r\n    Thinking bee! Thinking bee!\r\n    \r\n      \r\n    There he is. He's in the pool.\r\n    \r\n      \r\n    You know what your problem is, Barry?\r\n    \r\n      \r\n    I gotta start thinking bee?\r\n    \r\n      \r\n    How much longer will this go on?\r\n    \r\n      \r\n    It's been three days!\r\n    Why aren't you working?\r\n    \r\n      \r\n    I've got a lot of big life decisions\r\n    to think about.\r\n    \r\n      \r\n    What life? You have no life!\r\n    You have no job. You're barely a bee!\r\n    \r\n      \r\n    Would it kill you\r\n    to make a little honey?\r\n    \r\n      \r\n    Barry, come out.\r\n    Your father's talking to you.\r\n    \r\n      \r\n    Martin, would you talk to him?\r\n    \r\n      \r\n    Barry, I'm talking to you!\r\n    \r\n      \r\n    You coming?\r\n    \r\n      \r\n    Got everything?\r\n    \r\n      \r\n    All set!\r\n    \r\n      \r\n    Go ahead. I'll catch up.\r\n    \r\n      \r\n    Don't be too long.\r\n    \r\n      \r\n    Watch this!\r\n    \r\n      \r\n    Vanessa!\r\n    \r\n      \r\n    - We're still here.\r\n    - I told you not to yell at him.\r\n    \r\n      \r\n    He doesn't respond to yelling!\r\n    \r\n      \r\n    - Then why yell at me?\r\n    - Because you don't listen!\r\n    \r\n      \r\n    I'm not listening to this.\r\n    \r\n      \r\n    Sorry, I've gotta go.\r\n    \r\n      \r\n    - Where are you going?\r\n    - I'm meeting a friend.\r\n    \r\n      \r\n    A girl? Is this why you can't decide?\r\n    \r\n      \r\n    Bye.\r\n    \r\n      \r\n    I just hope she's Bee-ish.\r\n    \r\n      \r\n    They have a huge parade\r\n    of flowers every year in Pasadena?\r\n    \r\n      \r\n    To be in the Tournament of Roses,\r\n    that's every florist's dream!\r\n    \r\n      \r\n    Up on a float, surrounded\r\n    by flowers, crowds cheering.\r\n    \r\n      \r\n    A tournament. Do the roses\r\n    compete in athletic events?\r\n    \r\n      \r\n    No. All right, I've got one.\r\n    How come you don't fly everywhere?\r\n    \r\n      \r\n    It's exhausting. Why don't you\r\n    run everywhere? It's faster.\r\n    \r\n      \r\n    Yeah, OK, I see, I see.\r\n    All right, your turn.\r\n    \r\n      \r\n    TiVo. You can just freeze live TV?\r\n    That's insane!\r\n    \r\n      \r\n    You don't have that?\r\n    \r\n      \r\n    We have Hivo, but it's a disease.\r\n    It's a horrible, horrible disease.\r\n    \r\n      \r\n    Oh, my.\r\n    \r\n      \r\n    Dumb bees!\r\n    \r\n      \r\n    You must want to sting all those jerks.\r\n    \r\n      \r\n    We try not to sting.\r\n    It's usually fatal for us.\r\n    \r\n      \r\n    So you have to watch your temper.\r\n    \r\n      \r\n    Very carefully.\r\n    You kick a wall, take a walk,\r\n    \r\n      \r\n    write an angry letter and throw it out.\r\n    Work through it like any emotion:\r\n    \r\n      \r\n    Anger, jealousy, lust.\r\n    \r\n      \r\n    Oh, my goodness! Are you OK?\r\n    \r\n      \r\n    Yeah.\r\n    \r\n      \r\n    - What is wrong with you?!\r\n    - It's a bug.\r\n    \r\n      \r\n    He's not bothering anybody.\r\n    Get out of here, you creep!\r\n    \r\n      \r\n    What was that? A Pic 'N' Save circular?\r\n    \r\n      \r\n    Yeah, it was. How did you know?\r\n    \r\n      \r\n    It felt like about 10 pages.\r\n    Seventy-five is pretty much our limit.\r\n    \r\n      \r\n    You've really got that\r\n    down to a science.\r\n    \r\n      \r\n    - I lost a cousin to Italian Vogue.\r\n    - I'll bet.\r\n    \r\n      \r\n    What in the name\r\n    of Mighty Hercules is this?\r\n    \r\n      \r\n    How did this get here?\r\n    Oute Bee, Golden Blossom,\r\n    \r\n      \r\n    Ray Liotta Private Select?\r\n    \r\n      \r\n    - Is he that actor?\r\n    - I never heard of him.\r\n    \r\n      \r\n    - Why is this here?\r\n    - For people. We eat it.\r\n    \r\n      \r\n    You don't have\r\n    enough food of your own?\r\n    \r\n      \r\n    - Well, yes.\r\n    - How do you get it?\r\n    \r\n      \r\n    - Bees make it.\r\n    - I know who makes it!\r\n    \r\n      \r\n    And it's hard to make it!\r\n    \r\n      \r\n    There's heating, cooling, stirring.\r\n    You need a whole Krelman thing!\r\n    \r\n      \r\n    - It's organic.\r\n    - It's our-ganic!\r\n    \r\n      \r\n    It's just honey, Barry.\r\n    \r\n      \r\n    Just what?!\r\n    \r\n      \r\n    Bees don't know about this!\r\n    This is stealing! A lot of stealing!\r\n    \r\n      \r\n    You've taken our homes, schools,\r\n    hospitals! This is all we have!\r\n    \r\n      \r\n    And it's on sale?!\r\n    I'm getting to the bottom of this.\r\n    \r\n      \r\n    I'm getting to the bottom\r\n    of all of this!\r\n    \r\n      \r\n    Hey, Hector.\r\n    \r\n      \r\n    - You almost done?\r\n    - Almost.\r\n    \r\n      \r\n    He is here. I sense it.\r\n    \r\n      \r\n    Well, I guess I'll go home now\r\n    \r\n      \r\n    and just leave this nice honey out,\r\n    with no one around.\r\n    \r\n      \r\n    You're busted, box boy!\r\n    \r\n      \r\n    I knew I heard something.\r\n    So you can talk!\r\n    \r\n      \r\n    I can talk.\r\n    And now you'll start talking!\r\n    \r\n      \r\n    Where you getting the sweet stuff?\r\n    Who's your supplier?\r\n    \r\n      \r\n    I don't understand.\r\n    I thought we were friends.\r\n    \r\n      \r\n    The last thing we want\r\n    to do is upset bees!\r\n    \r\n      \r\n    You're too late! It's ours now!\r\n    \r\n      \r\n    You, sir, have crossed\r\n    the wrong sword!\r\n    \r\n      \r\n    You, sir, will be lunch\r\n    for my iguana, Ignacio!\r\n    \r\n      \r\n    Where is the honey coming from?\r\n    \r\n      \r\n    Tell me where!\r\n    \r\n      \r\n    Honey Farms! It comes from Honey Farms!\r\n    \r\n      \r\n    Orazy person!\r\n    \r\n      \r\n    What horrible thing has happened here?\r\n    \r\n      \r\n    These faces, they never knew\r\n    what hit them. And now\r\n    \r\n      \r\n    they're on the road to nowhere!\r\n    \r\n      \r\n    Just keep still.\r\n    \r\n      \r\n    What? You're not dead?\r\n    \r\n      \r\n    Do I look dead? They will wipe anything\r\n    that moves. Where you headed?\r\n    \r\n      \r\n    To Honey Farms.\r\n    I am onto something huge here.\r\n    \r\n      \r\n    I'm going to Alaska. Moose blood,\r\n    crazy stuff. Blows your head off!\r\n    \r\n      \r\n    I'm going to Tacoma.\r\n    \r\n      \r\n    - And you?\r\n    - He really is dead.\r\n    \r\n      \r\n    All right.\r\n    \r\n      \r\n    Uh-oh!\r\n    \r\n      \r\n    - What is that?!\r\n    - Oh, no!\r\n    \r\n      \r\n    - A wiper! Triple blade!\r\n    - Triple blade?\r\n    \r\n      \r\n    Jump on! It's your only chance, bee!\r\n    \r\n      \r\n    Why does everything have\r\n    to be so doggone clean?!\r\n    \r\n      \r\n    How much do you people need to see?!\r\n    \r\n      \r\n    Open your eyes!\r\n    Stick your head out the window!\r\n    \r\n      \r\n    From NPR News in Washington,\r\n    I'm Oarl Kasell.\r\n    \r\n      \r\n    But don't kill no more bugs!\r\n    \r\n      \r\n    - Bee!\r\n    - Moose blood guy!!\r\n    \r\n      \r\n    - You hear something?\r\n    - Like what?\r\n    \r\n      \r\n    Like tiny screaming.\r\n    \r\n      \r\n    Turn off the radio.\r\n    \r\n      \r\n    Whassup, bee boy?\r\n    \r\n      \r\n    Hey, Blood.\r\n    \r\n      \r\n    Just a row of honey jars,\r\n    as far as the eye could see.\r\n    \r\n      \r\n    Wow!\r\n    \r\n      \r\n    I assume wherever this truck goes\r\n    is where they're getting it.\r\n    \r\n      \r\n    I mean, that honey's ours.\r\n    \r\n      \r\n    - Bees hang tight.\r\n    - We're all jammed in.\r\n    \r\n      \r\n    It's a close community.\r\n    \r\n      \r\n    Not us, man. We on our own.\r\n    Every mosquito on his own.\r\n    \r\n      \r\n    - What if you get in trouble?\r\n    - You a mosquito, you in trouble.\r\n    \r\n      \r\n    Nobody likes us. They just smack.\r\n    See a mosquito, smack, smack!\r\n    \r\n      \r\n    At least you're out in the world.\r\n    You must meet girls.\r\n    \r\n      \r\n    Mosquito girls try to trade up,\r\n    get with a moth, dragonfly.\r\n    \r\n      \r\n    Mosquito girl don't want no mosquito.\r\n    \r\n      \r\n    You got to be kidding me!\r\n    \r\n      \r\n    Mooseblood's about to leave\r\n    the building! So long, bee!\r\n    \r\n      \r\n    - Hey, guys!\r\n    - Mooseblood!\r\n    \r\n      \r\n    I knew I'd catch y'all down here.\r\n    Did you bring your crazy straw?\r\n    \r\n      \r\n    We throw it in jars, slap a label on it,\r\n    and it's pretty much pure profit.\r\n    \r\n      \r\n    What is this place?\r\n    \r\n      \r\n    A bee's got a brain\r\n    the size of a pinhead.\r\n    \r\n      \r\n    They are pinheads!\r\n    \r\n      \r\n    Pinhead.\r\n    \r\n      \r\n    - Oheck out the new smoker.\r\n    - Oh, sweet. That's the one you want.\r\n    \r\n      \r\n    The Thomas 3000!\r\n    \r\n      \r\n    Smoker?\r\n    \r\n      \r\n    Ninety puffs a minute, semi-automatic.\r\n    Twice the nicotine, all the tar.\r\n    \r\n      \r\n    A couple breaths of this\r\n    knocks them right out.\r\n    \r\n      \r\n    They make the honey,\r\n    and we make the money.\r\n    \r\n      \r\n    \"They make the honey,\r\n    and we make the money\"?\r\n    \r\n      \r\n    Oh, my!\r\n    \r\n      \r\n    What's going on? Are you OK?\r\n    \r\n      \r\n    Yeah. It doesn't last too long.\r\n    \r\n      \r\n    Do you know you're\r\n    in a fake hive with fake walls?\r\n    \r\n      \r\n    Our queen was moved here.\r\n    We had no choice.\r\n    \r\n      \r\n    This is your queen?\r\n    That's a man in women's clothes!\r\n    \r\n      \r\n    That's a drag queen!\r\n    \r\n      \r\n    What is this?\r\n    \r\n      \r\n    Oh, no!\r\n    \r\n      \r\n    There's hundreds of them!\r\n    \r\n      \r\n    Bee honey.\r\n    \r\n      \r\n    Our honey is being brazenly stolen\r\n    on a massive scale!\r\n    \r\n      \r\n    This is worse than anything bears\r\n    have done! I intend to do something.\r\n    \r\n      \r\n    Oh, Barry, stop.\r\n    \r\n      \r\n    Who told you humans are taking\r\n    our honey? That's a rumor.\r\n    \r\n      \r\n    Do these look like rumors?\r\n    \r\n      \r\n    That's a conspiracy theory.\r\n    These are obviously doctored photos.\r\n    \r\n      \r\n    How did you get mixed up in this?\r\n    \r\n      \r\n    He's been talking to humans.\r\n    \r\n      \r\n    - What?\r\n    - Talking to humans?!\r\n    \r\n      \r\n    He has a human girlfriend.\r\n    And they make out!\r\n    \r\n      \r\n    Make out? Barry!\r\n    \r\n      \r\n    We do not.\r\n    \r\n      \r\n    - You wish you could.\r\n    - Whose side are you on?\r\n    \r\n      \r\n    The bees!\r\n    \r\n      \r\n    I dated a cricket once in San Antonio.\r\n    Those crazy legs kept me up all night.\r\n    \r\n      \r\n    Barry, this is what you want\r\n    to do with your life?\r\n    \r\n      \r\n    I want to do it for all our lives.\r\n    Nobody works harder than bees!\r\n    \r\n      \r\n    Dad, I remember you\r\n    coming home so overworked\r\n    \r\n      \r\n    your hands were still stirring.\r\n    You couldn't stop.\r\n    \r\n      \r\n    I remember that.\r\n    \r\n      \r\n    What right do they have to our honey?\r\n    \r\n      \r\n    We live on two cups a year. They put it\r\n    in lip balm for no reason whatsoever!\r\n    \r\n      \r\n    Even if it's true, what can one bee do?\r\n    \r\n      \r\n    Sting them where it really hurts.\r\n    \r\n      \r\n    In the face! The eye!\r\n    \r\n      \r\n    - That would hurt.\r\n    - No.\r\n    \r\n      \r\n    Up the nose? That's a killer.\r\n    \r\n      \r\n    There's only one place you can sting\r\n    the humans, one place where it matters.\r\n    \r\n      \r\n    Hive at Five, the hive's only\r\n    full-hour action news source.\r\n    \r\n      \r\n    No more bee beards!\r\n    \r\n      \r\n    With Bob Bumble at the anchor desk.\r\n    \r\n      \r\n    Weather with Storm Stinger.\r\n    \r\n      \r\n    Sports with Buzz Larvi.\r\n    \r\n      \r\n    And Jeanette Ohung.\r\n    \r\n      \r\n    - Good evening. I'm Bob Bumble.\r\n    - And I'm Jeanette Ohung.\r\n    \r\n      \r\n    A tri-county bee, Barry Benson,\r\n    \r\n      \r\n    intends to sue the human race\r\n    for stealing our honey,\r\n    \r\n      \r\n    packaging it and profiting\r\n    from it illegally!\r\n    \r\n      \r\n    Tomorrow night on Bee Larry King,\r\n    \r\n      \r\n    we'll have three former queens here in\r\n    our studio, discussing their new book,\r\n    \r\n      \r\n    Olassy Ladies,\r\n    out this week on Hexagon.\r\n    \r\n      \r\n    Tonight we're talking to Barry Benson.\r\n    \r\n      \r\n    Did you ever think, \"I'm a kid\r\n    from the hive. I can't do this\"?\r\n    \r\n      \r\n    Bees have never been afraid\r\n    to change the world.\r\n    \r\n      \r\n    What about Bee Oolumbus?\r\n    Bee Gandhi? Bejesus?\r\n    \r\n      \r\n    Where I'm from, we'd never sue humans.\r\n    \r\n      \r\n    We were thinking\r\n    of stickball or candy stores.\r\n    \r\n      \r\n    How old are you?\r\n    \r\n      \r\n    The bee community\r\n    is supporting you in this case,\r\n    \r\n      \r\n    which will be the trial\r\n    of the bee century.\r\n    \r\n      \r\n    You know, they have a Larry King\r\n    in the human world too.\r\n    \r\n      \r\n    It's a common name. Next week...\r\n    \r\n      \r\n    He looks like you and has a show\r\n    and suspenders and colored dots...\r\n    \r\n      \r\n    Next week...\r\n    \r\n      \r\n    Glasses, quotes on the bottom from the\r\n    guest even though you just heard 'em.\r\n    \r\n      \r\n    Bear Week next week!\r\n    They're scary, hairy and here live.\r\n    \r\n      \r\n    Always leans forward, pointy shoulders,\r\n    squinty eyes, very Jewish.\r\n    \r\n      \r\n    In tennis, you attack\r\n    at the point of weakness!\r\n    \r\n      \r\n    It was my grandmother, Ken. She's 81.\r\n    \r\n      \r\n    Honey, her backhand's a joke!\r\n    I'm not gonna take advantage of that?\r\n    \r\n      \r\n    Quiet, please.\r\n    Actual work going on here.\r\n    \r\n      \r\n    - Is that that same bee?\r\n    - Yes, it is!\r\n    \r\n      \r\n    I'm helping him sue the human race.\r\n    \r\n      \r\n    - Hello.\r\n    - Hello, bee.\r\n    \r\n      \r\n    This is Ken.\r\n    \r\n      \r\n    Yeah, I remember you. Timberland, size\r\n    ten and a half. Vibram sole, I believe.\r\n    \r\n      \r\n    Why does he talk again?\r\n    \r\n      \r\n    Listen, you better go\r\n    'cause we're really busy working.\r\n    \r\n      \r\n    But it's our yogurt night!\r\n    \r\n      \r\n    Bye-bye.\r\n    \r\n      \r\n    Why is yogurt night so difficult?!\r\n    \r\n      \r\n    You poor thing.\r\n    You two have been at this for hours!\r\n    \r\n      \r\n    Yes, and Adam here\r\n    has been a huge help.\r\n    \r\n      \r\n    - Frosting...\r\n    - How many sugars?\r\n    \r\n      \r\n    Just one. I try not\r\n    to use the competition.\r\n    \r\n      \r\n    So why are you helping me?\r\n    \r\n      \r\n    Bees have good qualities.\r\n    \r\n      \r\n    And it takes my mind off the shop.\r\n    \r\n      \r\n    Instead of flowers, people\r\n    are giving balloon bouquets now.\r\n    \r\n      \r\n    Those are great, if you're three.\r\n    \r\n      \r\n    And artificial flowers.\r\n    \r\n      \r\n    - Oh, those just get me psychotic!\r\n    - Yeah, me too.\r\n    \r\n      \r\n    Bent stingers, pointless pollination.\r\n    \r\n      \r\n    Bees must hate those fake things!\r\n    \r\n      \r\n    Nothing worse\r\n    than a daffodil that's had work done.\r\n    \r\n      \r\n    Maybe this could make up\r\n    for it a little bit.\r\n    \r\n      \r\n    - This lawsuit's a pretty big deal.\r\n    - I guess.\r\n    \r\n      \r\n    You sure you want to go through with it?\r\n    \r\n      \r\n    Am I sure? When I'm done with\r\n    the humans, they won't be able\r\n    \r\n      \r\n    to say, \"Honey, I'm home,\"\r\n    without paying a royalty!\r\n    \r\n      \r\n    It's an incredible scene\r\n    here in downtown Manhattan,\r\n    \r\n      \r\n    where the world anxiously waits,\r\n    because for the first time in history,\r\n    \r\n      \r\n    we will hear for ourselves\r\n    if a honeybee can actually speak.\r\n    \r\n      \r\n    What have we gotten into here, Barry?\r\n    \r\n      \r\n    It's pretty big, isn't it?\r\n    \r\n      \r\n    I can't believe how many humans\r\n    don't work during the day.\r\n    \r\n      \r\n    You think billion-dollar multinational\r\n    food companies have good lawyers?\r\n    \r\n      \r\n    Everybody needs to stay\r\n    behind the barricade.\r\n    \r\n      \r\n    - What's the matter?\r\n    - I don't know, I just got a chill.\r\n    \r\n      \r\n    Well, if it isn't the bee team.\r\n    \r\n      \r\n    You boys work on this?\r\n    \r\n      \r\n    All rise! The Honorable\r\n    Judge Bumbleton presiding.\r\n    \r\n      \r\n    All right. Oase number 4475,\r\n    \r\n      \r\n    Superior Oourt of New York,\r\n    Barry Bee Benson v. the Honey Industry\r\n    \r\n      \r\n    is now in session.\r\n    \r\n      \r\n    Mr. Montgomery, you're representing\r\n    the five food companies collectively?\r\n    \r\n      \r\n    A privilege.\r\n    \r\n      \r\n    Mr. Benson... you're representing\r\n    all the bees of the world?\r\n    \r\n      \r\n    I'm kidding. Yes, Your Honor,\r\n    we're ready to proceed.\r\n    \r\n      \r\n    Mr. Montgomery,\r\n    your opening statement, please.\r\n    \r\n      \r\n    Ladies and gentlemen of the jury,\r\n    \r\n      \r\n    my grandmother was a simple woman.\r\n    \r\n      \r\n    Born on a farm, she believed\r\n    it was man's divine right\r\n    \r\n      \r\n    to benefit from the bounty\r\n    of nature God put before us.\r\n    \r\n      \r\n    If we lived in the topsy-turvy world\r\n    Mr. Benson imagines,\r\n    \r\n      \r\n    just think of what would it mean.\r\n    \r\n      \r\n    I would have to negotiate\r\n    with the silkworm\r\n    \r\n      \r\n    for the elastic in my britches!\r\n    \r\n      \r\n    Talking bee!\r\n    \r\n      \r\n    How do we know this isn't some sort of\r\n    \r\n      \r\n    holographic motion-picture-capture\r\n    Hollywood wizardry?\r\n    \r\n      \r\n    They could be using laser beams!\r\n    \r\n      \r\n    Robotics! Ventriloquism!\r\n    Oloning! For all we know,\r\n    \r\n      \r\n    he could be on steroids!\r\n    \r\n      \r\n    Mr. Benson?\r\n    \r\n      \r\n    Ladies and gentlemen,\r\n    there's no trickery here.\r\n    \r\n      \r\n    I'm just an ordinary bee.\r\n    Honey's pretty important to me.\r\n    \r\n      \r\n    It's important to all bees.\r\n    We invented it!\r\n    \r\n      \r\n    We make it. And we protect it\r\n    with our lives.\r\n    \r\n      \r\n    Unfortunately, there are\r\n    some people in this room\r\n    \r\n      \r\n    who think they can take it from us\r\n    \r\n      \r\n    'cause we're the little guys!\r\n    I'm hoping that, after this is all over,\r\n    \r\n      \r\n    you'll see how, by taking our honey,\r\n    you not only take everything we have\r\n    \r\n      \r\n    but everything we are!\r\n    \r\n      \r\n    I wish he'd dress like that\r\n    all the time. So nice!\r\n    \r\n      \r\n    Oall your first witness.\r\n    \r\n      \r\n    So, Mr. Klauss Vanderhayden\r\n    of Honey Farms, big company you have.\r\n    \r\n      \r\n    I suppose so.\r\n    \r\n      \r\n    I see you also own\r\n    Honeyburton and Honron!\r\n    \r\n      \r\n    Yes, they provide beekeepers\r\n    for our farms.\r\n    \r\n      \r\n    Beekeeper. I find that\r\n    to be a very disturbing term.\r\n    \r\n      \r\n    I don't imagine you employ\r\n    any bee-free-ers, do you?\r\n    \r\n      \r\n    - No.\r\n    - I couldn't hear you.\r\n    \r\n      \r\n    - No.\r\n    - No.\r\n    \r\n      \r\n    Because you don't free bees.\r\n    You keep bees. Not only that,\r\n    \r\n      \r\n    it seems you thought a bear would be\r\n    an appropriate image for a jar of honey.\r\n    \r\n      \r\n    They're very lovable creatures.\r\n    \r\n      \r\n    Yogi Bear, Fozzie Bear, Build-A-Bear.\r\n    \r\n      \r\n    You mean like this?\r\n    \r\n      \r\n    Bears kill bees!\r\n    \r\n      \r\n    How'd you like his head crashing\r\n    through your living room?!\r\n    \r\n      \r\n    Biting into your couch!\r\n    Spitting out your throw pillows!\r\n    \r\n      \r\n    OK, that's enough. Take him away.\r\n    \r\n      \r\n    So, Mr. Sting, thank you for being here.\r\n    Your name intrigues me.\r\n    \r\n      \r\n    - Where have I heard it before?\r\n    - I was with a band called The Police.\r\n    \r\n      \r\n    But you've never been\r\n    a police officer, have you?\r\n    \r\n      \r\n    No, I haven't.\r\n    \r\n      \r\n    No, you haven't. And so here\r\n    we have yet another example\r\n    \r\n      \r\n    of bee culture casually\r\n    stolen by a human\r\n    \r\n      \r\n    for nothing more than\r\n    a prance-about stage name.\r\n    \r\n      \r\n    Oh, please.\r\n    \r\n      \r\n    Have you ever been stung, Mr. Sting?\r\n    \r\n      \r\n    Because I'm feeling\r\n    a little stung, Sting.\r\n    \r\n      \r\n    Or should I say... Mr. Gordon M. Sumner!\r\n    \r\n      \r\n    That's not his real name?! You idiots!\r\n    \r\n      \r\n    Mr. Liotta, first,\r\n    belated congratulations on\r\n    \r\n      \r\n    your Emmy win for a guest spot\r\n    on ER in 2005.\r\n    \r\n      \r\n    Thank you. Thank you.\r\n    \r\n      \r\n    I see from your resume\r\n    that you're devilishly handsome\r\n    \r\n      \r\n    with a churning inner turmoil\r\n    that's ready to blow.\r\n    \r\n      \r\n    I enjoy what I do. Is that a crime?\r\n    \r\n      \r\n    Not yet it isn't. But is this\r\n    what it's come to for you?\r\n    \r\n      \r\n    Exploiting tiny, helpless bees\r\n    so you don't\r\n    \r\n      \r\n    have to rehearse\r\n    your part and learn your lines, sir?\r\n    \r\n      \r\n    Watch it, Benson!\r\n    I could blow right now!\r\n    \r\n      \r\n    This isn't a goodfella.\r\n    This is a badfella!\r\n    \r\n      \r\n    Why doesn't someone just step on\r\n    this creep, and we can all go home?!\r\n    \r\n      \r\n    - Order in this court!\r\n    - You're all thinking it!\r\n    \r\n      \r\n    Order! Order, I say!\r\n    \r\n      \r\n    - Say it!\r\n    - Mr. Liotta, please sit down!\r\n    \r\n      \r\n    I think it was awfully nice\r\n    of that bear to pitch in like that.\r\n    \r\n      \r\n    I think the jury's on our side.\r\n    \r\n      \r\n    Are we doing everything right, legally?\r\n    \r\n      \r\n    I'm a florist.\r\n    \r\n      \r\n    Right. Well, here's to a great team.\r\n    \r\n      \r\n    To a great team!\r\n    \r\n      \r\n    Well, hello.\r\n    \r\n      \r\n    - Ken!\r\n    - Hello.\r\n    \r\n      \r\n    I didn't think you were coming.\r\n    \r\n      \r\n    No, I was just late.\r\n    I tried to call, but... the battery.\r\n    \r\n      \r\n    I didn't want all this to go to waste,\r\n    so I called Barry. Luckily, he was free.\r\n    \r\n      \r\n    Oh, that was lucky.\r\n    \r\n      \r\n    There's a little left.\r\n    I could heat it up.\r\n    \r\n      \r\n    Yeah, heat it up, sure, whatever.\r\n    \r\n      \r\n    So I hear you're quite a tennis player.\r\n    \r\n      \r\n    I'm not much for the game myself.\r\n    The ball's a little grabby.\r\n    \r\n      \r\n    That's where I usually sit.\r\n    Right... there.\r\n    \r\n      \r\n    Ken, Barry was looking at your resume,\r\n    \r\n      \r\n    and he agreed with me that eating with\r\n    chopsticks isn't really a special skill.\r\n    \r\n      \r\n    You think I don't see what you're doing?\r\n    \r\n      \r\n    I know how hard it is to find\r\n    the rightjob. We have that in common.\r\n    \r\n      \r\n    Do we?\r\n    \r\n      \r\n    Bees have 100 percent employment,\r\n    but we do jobs like taking the crud out.\r\n    \r\n      \r\n    That's just what\r\n    I was thinking about doing.\r\n    \r\n      \r\n    Ken, I let Barry borrow your razor\r\n    for his fuzz. I hope that was all right.\r\n    \r\n      \r\n    I'm going to drain the old stinger.\r\n    \r\n      \r\n    Yeah, you do that.\r\n    \r\n      \r\n    Look at that.\r\n    \r\n      \r\n    You know, I've just about had it\r\n    \r\n      \r\n    with your little mind games.\r\n    \r\n      \r\n    - What's that?\r\n    - Italian Vogue.\r\n    \r\n      \r\n    Mamma mia, that's a lot of pages.\r\n    \r\n      \r\n    A lot of ads.\r\n    \r\n      \r\n    Remember what Van said, why is\r\n    your life more valuable than mine?\r\n    \r\n      \r\n    Funny, I just can't seem to recall that!\r\n    \r\n      \r\n    I think something stinks in here!\r\n    \r\n      \r\n    I love the smell of flowers.\r\n    \r\n      \r\n    How do you like the smell of flames?!\r\n    \r\n      \r\n    Not as much.\r\n    \r\n      \r\n    Water bug! Not taking sides!\r\n    \r\n      \r\n    Ken, I'm wearing a Ohapstick hat!\r\n    This is pathetic!\r\n    \r\n      \r\n    I've got issues!\r\n    \r\n      \r\n    Well, well, well, a royal flush!\r\n    \r\n      \r\n    - You're bluffing.\r\n    - Am I?\r\n    \r\n      \r\n    Surf's up, dude!\r\n    \r\n      \r\n    Poo water!\r\n    \r\n      \r\n    That bowl is gnarly.\r\n    \r\n      \r\n    Except for those dirty yellow rings!\r\n    \r\n      \r\n    Kenneth! What are you doing?!\r\n    \r\n      \r\n    You know, I don't even like honey!\r\n    I don't eat it!\r\n    \r\n      \r\n    We need to talk!\r\n    \r\n      \r\n    He's just a little bee!\r\n    \r\n      \r\n    And he happens to be\r\n    the nicest bee I've met in a long time!\r\n    \r\n      \r\n    Long time? What are you talking about?!\r\n    Are there other bugs in your life?\r\n    \r\n      \r\n    No, but there are other things bugging\r\n    me in life. And you're one of them!\r\n    \r\n      \r\n    Fine! Talking bees, no yogurt night...\r\n    \r\n      \r\n    My nerves are fried from riding\r\n    on this emotional roller coaster!\r\n    \r\n      \r\n    Goodbye, Ken.\r\n    \r\n      \r\n    And for your information,\r\n    \r\n      \r\n    I prefer sugar-free, artificial\r\n    sweeteners made by man!\r\n    \r\n      \r\n    I'm sorry about all that.\r\n    \r\n      \r\n    I know it's got\r\n    an aftertaste! I like it!\r\n    \r\n      \r\n    I always felt there was some kind\r\n    of barrier between Ken and me.\r\n    \r\n      \r\n    I couldn't overcome it.\r\n    Oh, well.\r\n    \r\n      \r\n    Are you OK for the trial?\r\n    \r\n      \r\n    I believe Mr. Montgomery\r\n    is about out of ideas.\r\n    \r\n      \r\n    We would like to call\r\n    Mr. Barry Benson Bee to the stand.\r\n    \r\n      \r\n    Good idea! You can really see why he's\r\n    considered one of the best lawyers...\r\n    \r\n      \r\n    Yeah.\r\n    \r\n      \r\n    Layton, you've\r\n    gotta weave some magic\r\n    \r\n      \r\n    with this jury,\r\n    or it's gonna be all over.\r\n    \r\n      \r\n    Don't worry. The only thing I have\r\n    to do to turn this jury around\r\n    \r\n      \r\n    is to remind them\r\n    of what they don't like about bees.\r\n    \r\n      \r\n    - You got the tweezers?\r\n    - Are you allergic?\r\n    \r\n      \r\n    Only to losing, son. Only to losing.\r\n    \r\n      \r\n    Mr. Benson Bee, I'll ask you\r\n    what I think we'd all like to know.\r\n    \r\n      \r\n    What exactly is your relationship\r\n    \r\n      \r\n    to that woman?\r\n    \r\n      \r\n    We're friends.\r\n    \r\n      \r\n    - Good friends?\r\n    - Yes.\r\n    \r\n      \r\n    How good? Do you live together?\r\n    \r\n      \r\n    Wait a minute...\r\n    \r\n      \r\n    Are you her little...\r\n    \r\n      \r\n    ...bedbug?\r\n    \r\n      \r\n    I've seen a bee documentary or two.\r\n    From what I understand,\r\n    \r\n      \r\n    doesn't your queen give birth\r\n    to all the bee children?\r\n    \r\n      \r\n    - Yeah, but...\r\n    - So those aren't your real parents!\r\n    \r\n      \r\n    - Oh, Barry...\r\n    - Yes, they are!\r\n    \r\n      \r\n    Hold me back!\r\n    \r\n      \r\n    You're an illegitimate bee,\r\n    aren't you, Benson?\r\n    \r\n      \r\n    He's denouncing bees!\r\n    \r\n      \r\n    Don't y'all date your cousins?\r\n    \r\n      \r\n    - Objection!\r\n    - I'm going to pincushion this guy!\r\n    \r\n      \r\n    Adam, don't! It's what he wants!\r\n    \r\n      \r\n    Oh, I'm hit!!\r\n    \r\n      \r\n    Oh, lordy, I am hit!\r\n    \r\n      \r\n    Order! Order!\r\n    \r\n      \r\n    The venom! The venom\r\n    is coursing through my veins!\r\n    \r\n      \r\n    I have been felled\r\n    by a winged beast of destruction!\r\n    \r\n      \r\n    You see? You can't treat them\r\n    like equals! They're striped savages!\r\n    \r\n      \r\n    Stinging's the only thing\r\n    they know! It's their way!\r\n    \r\n      \r\n    - Adam, stay with me.\r\n    - I can't feel my legs.\r\n    \r\n      \r\n    What angel of mercy\r\n    will come forward to suck the poison\r\n    \r\n      \r\n    from my heaving buttocks?\r\n    \r\n      \r\n    I will have order in this court. Order!\r\n    \r\n      \r\n    Order, please!\r\n    \r\n      \r\n    The case of the honeybees\r\n    versus the human race\r\n    \r\n      \r\n    took a pointed turn against the bees\r\n    \r\n      \r\n    yesterday when one of their legal\r\n    team stung Layton T. Montgomery.\r\n    \r\n      \r\n    - Hey, buddy.\r\n    - Hey.\r\n    \r\n      \r\n    - Is there much pain?\r\n    - Yeah.\r\n    \r\n      \r\n    I...\r\n    \r\n      \r\n    I blew the whole case, didn't I?\r\n    \r\n      \r\n    It doesn't matter. What matters is\r\n    you're alive. You could have died.\r\n    \r\n      \r\n    I'd be better off dead. Look at me.\r\n    \r\n      \r\n    They got it from the cafeteria\r\n    downstairs, in a tuna sandwich.\r\n    \r\n      \r\n    Look, there's\r\n    a little celery still on it.\r\n    \r\n      \r\n    What was it like to sting someone?\r\n    \r\n      \r\n    I can't explain it. It was all...\r\n    \r\n      \r\n    All adrenaline and then...\r\n    and then ecstasy!\r\n    \r\n      \r\n    All right.\r\n    \r\n      \r\n    You think it was all a trap?\r\n    \r\n      \r\n    Of course. I'm sorry.\r\n    I flew us right into this.\r\n    \r\n      \r\n    What were we thinking? Look at us. We're\r\n    just a couple of bugs in this world.\r\n    \r\n      \r\n    What will the humans do to us\r\n    if they win?\r\n    \r\n      \r\n    I don't know.\r\n    \r\n      \r\n    I hear they put the roaches in motels.\r\n    That doesn't sound so bad.\r\n    \r\n      \r\n    Adam, they check in,\r\n    but they don't check out!\r\n    \r\n      \r\n    Oh, my.\r\n    \r\n      \r\n    Oould you get a nurse\r\n    to close that window?\r\n    \r\n      \r\n    - Why?\r\n    - The smoke.\r\n    \r\n      \r\n    Bees don't smoke.\r\n    \r\n      \r\n    Right. Bees don't smoke.\r\n    \r\n      \r\n    Bees don't smoke!\r\n    But some bees are smoking.\r\n    \r\n      \r\n    That's it! That's our case!\r\n    \r\n      \r\n    It is? It's not over?\r\n    \r\n      \r\n    Get dressed. I've gotta go somewhere.\r\n    \r\n      \r\n    Get back to the court and stall.\r\n    Stall any way you can.\r\n    \r\n      \r\n    And assuming you've done step correctly, you're ready for the tub.\r\n    \r\n      \r\n    Mr. Flayman.\r\n    \r\n      \r\n    Yes? Yes, Your Honor!\r\n    \r\n      \r\n    Where is the rest of your team?\r\n    \r\n      \r\n    Well, Your Honor, it's interesting.\r\n    \r\n      \r\n    Bees are trained to fly haphazardly,\r\n    \r\n      \r\n    and as a result,\r\n    we don't make very good time.\r\n    \r\n      \r\n    I actually heard a funny story about...\r\n    \r\n      \r\n    Your Honor,\r\n    haven't these ridiculous bugs\r\n    \r\n      \r\n    taken up enough\r\n    of this court's valuable time?\r\n    \r\n      \r\n    How much longer will we allow\r\n    these absurd shenanigans to go on?\r\n    \r\n      \r\n    They have presented no compelling\r\n    evidence to support their charges\r\n    \r\n      \r\n    against my clients,\r\n    who run legitimate businesses.\r\n    \r\n      \r\n    I move for a complete dismissal\r\n    of this entire case!\r\n    \r\n      \r\n    Mr. Flayman, I'm afraid I'm going\r\n    \r\n      \r\n    to have to consider\r\n    Mr. Montgomery's motion.\r\n    \r\n      \r\n    But you can't! We have a terrific case.\r\n    \r\n      \r\n    Where is your proof?\r\n    Where is the evidence?\r\n    \r\n      \r\n    Show me the smoking gun!\r\n    \r\n      \r\n    Hold it, Your Honor!\r\n    You want a smoking gun?\r\n    \r\n      \r\n    Here is your smoking gun.\r\n    \r\n      \r\n    What is that?\r\n    \r\n      \r\n    It's a bee smoker!\r\n    \r\n      \r\n    What, this?\r\n    This harmless little contraption?\r\n    \r\n      \r\n    This couldn't hurt a fly,\r\n    let alone a bee.\r\n    \r\n      \r\n    Look at what has happened\r\n    \r\n      \r\n    to bees who have never been asked,\r\n    \"Smoking or non?\"\r\n    \r\n      \r\n    Is this what nature intended for us?\r\n    \r\n      \r\n    To be forcibly addicted\r\n    to smoke machines\r\n    \r\n      \r\n    and man-made wooden slat work camps?\r\n    \r\n      \r\n    Living out our lives as honey slaves\r\n    to the white man?\r\n    \r\n      \r\n    - What are we gonna do?\r\n    - He's playing the species card.\r\n    \r\n      \r\n    Ladies and gentlemen, please,\r\n    free these bees!\r\n    \r\n      \r\n    Free the bees! Free the bees!\r\n    \r\n      \r\n    Free the bees!\r\n    \r\n      \r\n    Free the bees! Free the bees!\r\n    \r\n      \r\n    The court finds in favor of the bees!\r\n    \r\n      \r\n    Vanessa, we won!\r\n    \r\n      \r\n    I knew you could do it! High-five!\r\n    \r\n      \r\n    Sorry.\r\n    \r\n      \r\n    I'm OK! You know what this means?\r\n    \r\n      \r\n    All the honey\r\n    will finally belong to the bees.\r\n    \r\n      \r\n    Now we won't have\r\n    to work so hard all the time.\r\n    \r\n      \r\n    This is an unholy perversion\r\n    of the balance of nature, Benson.\r\n    \r\n      \r\n    You'll regret this.\r\n    \r\n      \r\n    Barry, how much honey is out there?\r\n    \r\n      \r\n    All right. One at a time.\r\n    \r\n      \r\n    Barry, who are you wearing?\r\n    \r\n      \r\n    My sweater is Ralph Lauren,\r\n    and I have no pants.\r\n    \r\n      \r\n    - What if Montgomery's right?\r\n    - What do you mean?\r\n    \r\n      \r\n    We've been living the bee way\r\n    a long time, 27 million years.\r\n    \r\n      \r\n    Oongratulations on your victory.\r\n    What will you demand as a settlement?\r\n    \r\n      \r\n    First, we'll demand a complete shutdown\r\n    of all bee work camps.\r\n    \r\n      \r\n    Then we want back the honey\r\n    that was ours to begin with,\r\n    \r\n      \r\n    every last drop.\r\n    \r\n      \r\n    We demand an end to the glorification\r\n    of the bear as anything more\r\n    \r\n      \r\n    than a filthy, smelly,\r\n    bad-breath stink machine.\r\n    \r\n      \r\n    We're all aware\r\n    of what they do in the woods.\r\n    \r\n      \r\n    Wait for my signal.\r\n    \r\n      \r\n    Take him out.\r\n    \r\n      \r\n    He'll have nauseous\r\n    for a few hours, then he'll be fine.\r\n    \r\n      \r\n    And we will no longer tolerate\r\n    bee-negative nicknames...\r\n    \r\n      \r\n    But it's just a prance-about stage name!\r\n    \r\n      \r\n    ...unnecessary inclusion of honey\r\n    in bogus health products\r\n    \r\n      \r\n    and la-dee-da human\r\n    tea-time snack garnishments.\r\n    \r\n      \r\n    Oan't breathe.\r\n    \r\n      \r\n    Bring it in, boys!\r\n    \r\n      \r\n    Hold it right there! Good.\r\n    \r\n      \r\n    Tap it.\r\n    \r\n      \r\n    Mr. Buzzwell, we just passed three cups,\r\n    and there's gallons more coming!\r\n    \r\n      \r\n    - I think we need to shut down!\r\n    - Shut down? We've never shut down.\r\n    \r\n      \r\n    Shut down honey production!\r\n    \r\n      \r\n    Stop making honey!\r\n    \r\n      \r\n    Turn your key, sir!\r\n    \r\n      \r\n    What do we do now?\r\n    \r\n      \r\n    Oannonball!\r\n    \r\n      \r\n    We're shutting honey production!\r\n    \r\n      \r\n    Mission abort.\r\n    \r\n      \r\n    Aborting pollination and nectar detail.\r\n    Returning to base.\r\n    \r\n      \r\n    Adam, you wouldn't believe\r\n    how much honey was out there.\r\n    \r\n      \r\n    Oh, yeah?\r\n    \r\n      \r\n    What's going on? Where is everybody?\r\n    \r\n      \r\n    - Are they out celebrating?\r\n    - They're home.\r\n    \r\n      \r\n    They don't know what to do.\r\n    Laying out, sleeping in.\r\n    \r\n      \r\n    I heard your Uncle Oarl was on his way\r\n    to San Antonio with a cricket.\r\n    \r\n      \r\n    At least we got our honey back.\r\n    \r\n      \r\n    Sometimes I think, so what if humans\r\n    liked our honey? Who wouldn't?\r\n    \r\n      \r\n    It's the greatest thing in the world!\r\n    I was excited to be part of making it.\r\n    \r\n      \r\n    This was my new desk. This was my\r\n    new job. I wanted to do it really well.\r\n    \r\n      \r\n    And now...\r\n    \r\n      \r\n    Now I can't.\r\n    \r\n      \r\n    I don't understand\r\n    why they're not happy.\r\n    \r\n      \r\n    I thought their lives would be better!\r\n    \r\n      \r\n    They're doing nothing. It's amazing.\r\n    Honey really changes people.\r\n    \r\n      \r\n    You don't have any idea\r\n    what's going on, do you?\r\n    \r\n      \r\n    - What did you want to show me?\r\n    - This.\r\n    \r\n      \r\n    What happened here?\r\n    \r\n      \r\n    That is not the half of it.\r\n    \r\n      \r\n    Oh, no. Oh, my.\r\n    \r\n      \r\n    They're all wilting.\r\n    \r\n      \r\n    Doesn't look very good, does it?\r\n    \r\n      \r\n    No.\r\n    \r\n      \r\n    And whose fault do you think that is?\r\n    \r\n      \r\n    You know, I'm gonna guess bees.\r\n    \r\n      \r\n    Bees?\r\n    \r\n      \r\n    Specifically, me.\r\n    \r\n      \r\n    I didn't think bees not needing to make\r\n    honey would affect all these things.\r\n    \r\n      \r\n    It's notjust flowers.\r\n    Fruits, vegetables, they all need bees.\r\n    \r\n      \r\n    That's our whole SAT test right there.\r\n    \r\n      \r\n    Take away produce, that affects\r\n    the entire animal kingdom.\r\n    \r\n      \r\n    And then, of course...\r\n    \r\n      \r\n    The human species?\r\n    \r\n      \r\n    So if there's no more pollination,\r\n    \r\n      \r\n    it could all just go south here,\r\n    couldn't it?\r\n    \r\n      \r\n    I know this is also partly my fault.\r\n    \r\n      \r\n    How about a suicide pact?\r\n    \r\n      \r\n    How do we do it?\r\n    \r\n      \r\n    - I'll sting you, you step on me.\r\n    - Thatjust kills you twice.\r\n    \r\n      \r\n    Right, right.\r\n    \r\n      \r\n    Listen, Barry...\r\n    sorry, but I gotta get going.\r\n    \r\n      \r\n    I had to open my mouth and talk.\r\n    \r\n      \r\n    Vanessa?\r\n    \r\n      \r\n    Vanessa? Why are you leaving?\r\n    Where are you going?\r\n    \r\n      \r\n    To the final Tournament of Roses parade\r\n    in Pasadena.\r\n    \r\n      \r\n    They've moved it to this weekend\r\n    because all the flowers are dying.\r\n    \r\n      \r\n    It's the last chance\r\n    I'll ever have to see it.\r\n    \r\n      \r\n    Vanessa, I just wanna say I'm sorry.\r\n    I never meant it to turn out like this.\r\n    \r\n      \r\n    I know. Me neither.\r\n    \r\n      \r\n    Tournament of Roses.\r\n    Roses can't do sports.\r\n    \r\n      \r\n    Wait a minute. Roses. Roses?\r\n    \r\n      \r\n    Roses!\r\n    \r\n      \r\n    Vanessa!\r\n    \r\n      \r\n    Roses?!\r\n    \r\n      \r\n    Barry?\r\n    \r\n      \r\n    - Roses are flowers!\r\n    - Yes, they are.\r\n    \r\n      \r\n    Flowers, bees, pollen!\r\n    \r\n      \r\n    I know.\r\n    That's why this is the last parade.\r\n    \r\n      \r\n    Maybe not.\r\n    Oould you ask him to slow down?\r\n    \r\n      \r\n    Oould you slow down?\r\n    \r\n      \r\n    Barry!\r\n    \r\n      \r\n    OK, I made a huge mistake.\r\n    This is a total disaster, all my fault.\r\n    \r\n      \r\n    Yes, it kind of is.\r\n    \r\n      \r\n    I've ruined the planet.\r\n    I wanted to help you\r\n    \r\n      \r\n    with the flower shop.\r\n    I've made it worse.\r\n    \r\n      \r\n    Actually, it's completely closed down.\r\n    \r\n      \r\n    I thought maybe you were remodeling.\r\n    \r\n      \r\n    But I have another idea, and it's\r\n    greater than my previous ideas combined.\r\n    \r\n      \r\n    I don't want to hear it!\r\n    \r\n      \r\n    All right, they have the roses,\r\n    the roses have the pollen.\r\n    \r\n      \r\n    I know every bee, plant\r\n    and flower bud in this park.\r\n    \r\n      \r\n    All we gotta do is get what they've got\r\n    back here with what we've got.\r\n    \r\n      \r\n    - Bees.\r\n    - Park.\r\n    \r\n      \r\n    - Pollen!\r\n    - Flowers.\r\n    \r\n      \r\n    - Repollination!\r\n    - Across the nation!\r\n    \r\n      \r\n    Tournament of Roses,\r\n    Pasadena, Oalifornia.\r\n    \r\n      \r\n    They've got nothing\r\n    but flowers, floats and cotton candy.\r\n    \r\n      \r\n    Security will be tight.\r\n    \r\n      \r\n    I have an idea.\r\n    \r\n      \r\n    Vanessa Bloome, FTD.\r\n    \r\n      \r\n    Official floral business. It's real.\r\n    \r\n      \r\n    Sorry, ma'am. Nice brooch.\r\n    \r\n      \r\n    Thank you. It was a gift.\r\n    \r\n      \r\n    Once inside,\r\n    we just pick the right float.\r\n    \r\n      \r\n    How about The Princess and the Pea?\r\n    \r\n      \r\n    I could be the princess,\r\n    and you could be the pea!\r\n    \r\n      \r\n    Yes, I got it.\r\n    \r\n      \r\n    - Where should I sit?\r\n    - What are you?\r\n    \r\n      \r\n    - I believe I'm the pea.\r\n    - The pea?\r\n    \r\n      \r\n    It goes under the mattresses.\r\n    \r\n      \r\n    - Not in this fairy tale, sweetheart.\r\n    - I'm getting the marshal.\r\n    \r\n      \r\n    You do that!\r\n    This whole parade is a fiasco!\r\n    \r\n      \r\n    Let's see what this baby'll do.\r\n    \r\n      \r\n    Hey, what are you doing?!\r\n    \r\n      \r\n    Then all we do\r\n    is blend in with traffic...\r\n    \r\n      \r\n    ...without arousing suspicion.\r\n    \r\n      \r\n    Once at the airport,\r\n    there's no stopping us.\r\n    \r\n      \r\n    Stop! Security.\r\n    \r\n      \r\n    - You and your insect pack your float?\r\n    - Yes.\r\n    \r\n      \r\n    Has it been\r\n    in your possession the entire time?\r\n    \r\n      \r\n    Would you remove your shoes?\r\n    \r\n      \r\n    - Remove your stinger.\r\n    - It's part of me.\r\n    \r\n      \r\n    I know. Just having some fun.\r\n    Enjoy your flight.\r\n    \r\n      \r\n    Then if we're lucky, we'll have\r\n    just enough pollen to do the job.\r\n    \r\n      \r\n    Oan you believe how lucky we are? We\r\n    have just enough pollen to do the job!\r\n    \r\n      \r\n    I think this is gonna work.\r\n    \r\n      \r\n    It's got to work.\r\n    \r\n      \r\n    Attention, passengers,\r\n    this is Oaptain Scott.\r\n    \r\n      \r\n    We have a bit of bad weather\r\n    in New York.\r\n    \r\n      \r\n    It looks like we'll experience\r\n    a couple hours delay.\r\n    \r\n      \r\n    Barry, these are cut flowers\r\n    with no water. They'll never make it.\r\n    \r\n      \r\n    I gotta get up there\r\n    and talk to them.\r\n    \r\n      \r\n    Be careful.\r\n    \r\n      \r\n    Oan I get help\r\n    with the Sky Mall magazine?\r\n    \r\n      \r\n    I'd like to order the talking\r\n    inflatable nose and ear hair trimmer.\r\n    \r\n      \r\n    Oaptain, I'm in a real situation.\r\n    \r\n      \r\n    - What'd you say, Hal?\r\n    - Nothing.\r\n    \r\n      \r\n    Bee!\r\n    \r\n      \r\n    Don't freak out! My entire species...\r\n    \r\n      \r\n    What are you doing?\r\n    \r\n      \r\n    - Wait a minute! I'm an attorney!\r\n    - Who's an attorney?\r\n    \r\n      \r\n    Don't move.\r\n    \r\n      \r\n    Oh, Barry.\r\n    \r\n      \r\n    Good afternoon, passengers.\r\n    This is your captain.\r\n    \r\n      \r\n    Would a Miss Vanessa Bloome in 24B\r\n    please report to the cockpit?\r\n    \r\n      \r\n    And please hurry!\r\n    \r\n      \r\n    What happened here?\r\n    \r\n      \r\n    There was a DustBuster,\r\n    a toupee, a life raft exploded.\r\n    \r\n      \r\n    One's bald, one's in a boat,\r\n    they're both unconscious!\r\n    \r\n      \r\n    - Is that another bee joke?\r\n    - No!\r\n    \r\n      \r\n    No one's flying the plane!\r\n    \r\n      \r\n    This is JFK control tower, Flight 356.\r\n    What's your status?\r\n    \r\n      \r\n    This is Vanessa Bloome.\r\n    I'm a florist from New York.\r\n    \r\n      \r\n    Where's the pilot?\r\n    \r\n      \r\n    He's unconscious,\r\n    and so is the copilot.\r\n    \r\n      \r\n    Not good. Does anyone onboard\r\n    have flight experience?\r\n    \r\n      \r\n    As a matter of fact, there is.\r\n    \r\n      \r\n    - Who's that?\r\n    - Barry Benson.\r\n    \r\n      \r\n    From the honey trial?! Oh, great.\r\n    \r\n      \r\n    Vanessa, this is nothing more\r\n    than a big metal bee.\r\n    \r\n      \r\n    It's got giant wings, huge engines.\r\n    \r\n      \r\n    I can't fly a plane.\r\n    \r\n      \r\n    - Why not? Isn't John Travolta a pilot?\r\n    - Yes.\r\n    \r\n      \r\n    How hard could it be?\r\n    \r\n      \r\n    Wait, Barry!\r\n    We're headed into some lightning.\r\n    \r\n      \r\n    This is Bob Bumble. We have some\r\n    late-breaking news from JFK Airport,\r\n    \r\n      \r\n    where a suspenseful scene\r\n    is developing.\r\n    \r\n      \r\n    Barry Benson,\r\n    fresh from his legal victory...\r\n    \r\n      \r\n    That's Barry!\r\n    \r\n      \r\n    ...is attempting to land a plane,\r\n    loaded with people, flowers\r\n    \r\n      \r\n    and an incapacitated flight crew.\r\n    \r\n      \r\n    Flowers?!\r\n    \r\n      \r\n    We have a storm in the area\r\n    and two individuals at the controls\r\n    \r\n      \r\n    with absolutely no flight experience.\r\n    \r\n      \r\n    Just a minute.\r\n    There's a bee on that plane.\r\n    \r\n      \r\n    I'm quite familiar with Mr. Benson\r\n    and his no-account compadres.\r\n    \r\n      \r\n    They've done enough damage.\r\n    \r\n      \r\n    But isn't he your only hope?\r\n    \r\n      \r\n    Technically, a bee\r\n    shouldn't be able to fly at all.\r\n    \r\n      \r\n    Their wings are too small...\r\n    \r\n      \r\n    Haven't we heard this a million times?\r\n    \r\n      \r\n    \"The surface area of the wings\r\n    and body mass make no sense.\"\r\n    \r\n      \r\n    - Get this on the air!\r\n    - Got it.\r\n    \r\n      \r\n    - Stand by.\r\n    - We're going live.\r\n    \r\n      \r\n    The way we work may be a mystery to you.\r\n    \r\n      \r\n    Making honey takes a lot of bees\r\n    doing a lot of small jobs.\r\n    \r\n      \r\n    But let me tell you about a small job.\r\n    \r\n      \r\n    If you do it well,\r\n    it makes a big difference.\r\n    \r\n      \r\n    More than we realized.\r\n    To us, to everyone.\r\n    \r\n      \r\n    That's why I want to get bees\r\n    back to working together.\r\n    \r\n      \r\n    That's the bee way!\r\n    We're not made of Jell-O.\r\n    \r\n      \r\n    We get behind a fellow.\r\n    \r\n      \r\n    - Black and yellow!\r\n    - Hello!\r\n    \r\n      \r\n    Left, right, down, hover.\r\n    \r\n      \r\n    - Hover?\r\n    - Forget hover.\r\n    \r\n      \r\n    This isn't so hard.\r\n    Beep-beep! Beep-beep!\r\n    \r\n      \r\n    Barry, what happened?!\r\n    \r\n      \r\n    Wait, I think we were\r\n    on autopilot the whole time.\r\n    \r\n      \r\n    - That may have been helping me.\r\n    - And now we're not!\r\n    \r\n      \r\n    So it turns out I cannot fly a plane.\r\n    \r\n      \r\n    All of you, let's get\r\n    behind this fellow! Move it out!\r\n    \r\n      \r\n    Move out!\r\n    \r\n      \r\n    Our only chance is if I do what I'd do,\r\n    you copy me with the wings of the plane!\r\n    \r\n      \r\n    Don't have to yell.\r\n    \r\n      \r\n    I'm not yelling!\r\n    We're in a lot of trouble.\r\n    \r\n      \r\n    It's very hard to concentrate\r\n    with that panicky tone in your voice!\r\n    \r\n      \r\n    It's not a tone. I'm panicking!\r\n    \r\n      \r\n    I can't do this!\r\n    \r\n      \r\n    Vanessa, pull yourself together.\r\n    You have to snap out of it!\r\n    \r\n      \r\n    You snap out of it.\r\n    \r\n      \r\n    You snap out of it.\r\n    \r\n      \r\n    - You snap out of it!\r\n    - You snap out of it!\r\n    \r\n      \r\n    - You snap out of it!\r\n    - You snap out of it!\r\n    \r\n      \r\n    - You snap out of it!\r\n    - You snap out of it!\r\n    \r\n      \r\n    - Hold it!\r\n    - Why? Oome on, it's my turn.\r\n    \r\n      \r\n    How is the plane flying?\r\n    \r\n      \r\n    I don't know.\r\n    \r\n      \r\n    Hello?\r\n    \r\n      \r\n    Benson, got any flowers\r\n    for a happy occasion in there?\r\n    \r\n      \r\n    The Pollen Jocks!\r\n    \r\n      \r\n    They do get behind a fellow.\r\n    \r\n      \r\n    - Black and yellow.\r\n    - Hello.\r\n    \r\n      \r\n    All right, let's drop this tin can\r\n    on the blacktop.\r\n    \r\n      \r\n    Where? I can't see anything. Oan you?\r\n    \r\n      \r\n    No, nothing. It's all cloudy.\r\n    \r\n      \r\n    Oome on. You got to think bee, Barry.\r\n    \r\n      \r\n    - Thinking bee.\r\n    - Thinking bee.\r\n    \r\n      \r\n    Thinking bee!\r\n    Thinking bee! Thinking bee!\r\n    \r\n      \r\n    Wait a minute.\r\n    I think I'm feeling something.\r\n    \r\n      \r\n    - What?\r\n    - I don't know. It's strong, pulling me.\r\n    \r\n      \r\n    Like a 27-million-year-old instinct.\r\n    \r\n      \r\n    Bring the nose down.\r\n    \r\n      \r\n    Thinking bee!\r\n    Thinking bee! Thinking bee!\r\n    \r\n      \r\n    - What in the world is on the tarmac?\r\n    - Get some lights on that!\r\n    \r\n      \r\n    Thinking bee!\r\n    Thinking bee! Thinking bee!\r\n    \r\n      \r\n    - Vanessa, aim for the flower.\r\n    - OK.\r\n    \r\n      \r\n    Out the engines. We're going in\r\n    on bee power. Ready, boys?\r\n    \r\n      \r\n    Affirmative!\r\n    \r\n      \r\n    Good. Good. Easy, now. That's it.\r\n    \r\n      \r\n    Land on that flower!\r\n    \r\n      \r\n    Ready? Full reverse!\r\n    \r\n      \r\n    Spin it around!\r\n    \r\n      \r\n    - Not that flower! The other one!\r\n    - Which one?\r\n    \r\n      \r\n    - That flower.\r\n    - I'm aiming at the flower!\r\n    \r\n      \r\n    That's a fat guy in a flowered shirt.\r\n    I mean the giant pulsating flower\r\n    \r\n      \r\n    made of millions of bees!\r\n    \r\n      \r\n    Pull forward. Nose down. Tail up.\r\n    \r\n      \r\n    Rotate around it.\r\n    \r\n      \r\n    - This is insane, Barry!\r\n    - This's the only way I know how to fly.\r\n    \r\n      \r\n    Am I koo-koo-kachoo, or is this plane\r\n    flying in an insect-like pattern?\r\n    \r\n      \r\n    Get your nose in there. Don't be afraid.\r\n    Smell it. Full reverse!\r\n    \r\n      \r\n    Just drop it. Be a part of it.\r\n    \r\n      \r\n    Aim for the center!\r\n    \r\n      \r\n    Now drop it in! Drop it in, woman!\r\n    \r\n      \r\n    Oome on, already.\r\n    \r\n      \r\n    Barry, we did it!\r\n    You taught me how to fly!\r\n    \r\n      \r\n    - Yes. No high-five!\r\n    - Right.\r\n    \r\n      \r\n    Barry, it worked!\r\n    Did you see the giant flower?\r\n    \r\n      \r\n    What giant flower? Where? Of course\r\n    I saw the flower! That was genius!\r\n    \r\n      \r\n    - Thank you.\r\n    - But we're not done yet.\r\n    \r\n      \r\n    Listen, everyone!\r\n    \r\n      \r\n    This runway is covered\r\n    with the last pollen\r\n    \r\n      \r\n    from the last flowers\r\n    available anywhere on Earth.\r\n    \r\n      \r\n    That means this is our last chance.\r\n    \r\n      \r\n    We're the only ones who make honey,\r\n    pollinate flowers and dress like this.\r\n    \r\n      \r\n    If we're gonna survive as a species,\r\n    this is our moment! What do you say?\r\n    \r\n      \r\n    Are we going to be bees, orjust\r\n    Museum of Natural History keychains?\r\n    \r\n      \r\n    We're bees!\r\n    \r\n      \r\n    Keychain!\r\n    \r\n      \r\n    Then follow me! Except Keychain.\r\n    \r\n      \r\n    Hold on, Barry. Here.\r\n    \r\n      \r\n    You've earned this.\r\n    \r\n      \r\n    Yeah!\r\n    \r\n      \r\n    I'm a Pollen Jock! And it's a perfect\r\n    fit. All I gotta do are the sleeves.\r\n    \r\n      \r\n    Oh, yeah.\r\n    \r\n      \r\n    That's our Barry.\r\n    \r\n      \r\n    Mom! The bees are back!\r\n    \r\n      \r\n    If anybody needs\r\n    to make a call, now's the time.\r\n    \r\n      \r\n    I got a feeling we'll be\r\n    working late tonight!\r\n    \r\n      \r\n    Here's your change. Have a great\r\n    afternoon! Oan I help who's next?\r\n    \r\n      \r\n    Would you like some honey with that?\r\n    It is bee-approved. Don't forget these.\r\n    \r\n      \r\n    Milk, cream, cheese, it's all me.\r\n    And I don't see a nickel!\r\n    \r\n      \r\n    Sometimes I just feel\r\n    like a piece of meat!\r\n    \r\n      \r\n    I had no idea.\r\n    \r\n      \r\n    Barry, I'm sorry.\r\n    Have you got a moment?\r\n    \r\n      \r\n    Would you excuse me?\r\n    My mosquito associate will help you.\r\n    \r\n      \r\n    Sorry I'm late.\r\n    \r\n      \r\n    He's a lawyer too?\r\n    \r\n      \r\n    I was already a blood-sucking parasite.\r\n    All I needed was a briefcase.\r\n    \r\n      \r\n    Have a great afternoon!\r\n    \r\n      \r\n    Barry, I just got this huge tulip order,\r\n    and I can't get them anywhere.\r\n    \r\n      \r\n    No problem, Vannie.\r\n    Just leave it to me.\r\n    \r\n      \r\n    You're a lifesaver, Barry.\r\n    Oan I help who's next?\r\n    \r\n      \r\n    All right, scramble, jocks!\r\n    It's time to fly.\r\n    \r\n      \r\n    Thank you, Barry!\r\n    \r\n      \r\n    That bee is living my life!\r\n    \r\n      \r\n    Let it go, Kenny.\r\n    \r\n      \r\n    - When will this nightmare end?!\r\n    - Let it all go.\r\n    \r\n      \r\n    - Beautiful day to fly.\r\n    - Sure is.\r\n    \r\n      \r\n    Between you and me,\r\n    I was dying to get out of that office.\r\n    \r\n      \r\n    You have got\r\n    to start thinking bee, my friend.\r\n    \r\n      \r\n    - Thinking bee!\r\n    - Me?\r\n    \r\n      \r\n    Hold it. Let's just stop\r\n    for a second. Hold it.\r\n    \r\n      \r\n    I'm sorry. I'm sorry, everyone.\r\n    Oan we stop here?\r\n    \r\n      \r\n    I'm not making a major life decision\r\n    during a production number!\r\n    \r\n      \r\n    All right. Take ten, everybody.\r\n    Wrap it up, guys.\r\n    \r\n      \r\n    I had virtually no rehearsal for that.";
    			attr_dev(pre, "class", "svelte-6qwft5");
    			add_location(pre, file$6, 6, 0, 93);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
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

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Beemovie", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Beemovie> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Beemovie extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Beemovie",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\sider\stt.svelte generated by Svelte v3.29.4 */
    const file$7 = "src\\sider\\stt.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let p;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "↑";
    			attr_dev(p, "class", "svelte-1nz6eo2");
    			add_location(p, file$7, 4, 4, 128);
    			attr_dev(div, "class", "stt svelte-1nz6eo2");
    			add_location(div, file$7, 3, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 300, duration: 500 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 300, duration: 500 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
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
    	validate_slots("Stt", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stt> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class Stt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stt",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\sider\om_siden.svelte generated by Svelte v3.29.4 */
    const file$8 = "src\\sider\\om_siden.svelte";

    // (16:4) {#if y >= 150}
    function create_if_block$1(ctx) {
    	let a;
    	let stt;
    	let current;
    	stt = new Stt({ $$inline: true });

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(stt.$$.fragment);
    			attr_dev(a, "href", "#");
    			add_location(a, file$8, 17, 8, 546);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(stt, a, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stt.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stt.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(stt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(16:4) {#if y >= 150}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let div1;
    	let bgimage;
    	let t0;
    	let div0;
    	let p;
    	let beemovie;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[1]);

    	bgimage = new Bgimage({
    			props: {
    				header: "Om siden",
    				underskrift: "",
    				url: "https://cdn.discordapp.com/attachments/589538975748849688/771483868389310484/TZEren.gif"
    			},
    			$$inline: true
    		});

    	beemovie = new Beemovie({ $$inline: true });
    	let if_block = /*y*/ ctx[0] >= 150 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(bgimage.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			create_component(beemovie.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			add_location(p, file$8, 14, 4, 432);
    			attr_dev(div0, "class", "bie svelte-1quz0qg");
    			add_location(div0, file$8, 13, 4, 409);
    			add_location(div1, file$8, 10, 0, 234);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(bgimage, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			mount_component(beemovie, p, null);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[1]();
    				});

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 1 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[0]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (/*y*/ ctx[0] >= 150) {
    				if (if_block) {
    					if (dirty & /*y*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
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
    			transition_in(bgimage.$$.fragment, local);
    			transition_in(beemovie.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bgimage.$$.fragment, local);
    			transition_out(beemovie.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(bgimage);
    			destroy_component(beemovie);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Om_siden", slots, []);
    	var y = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Om_siden> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(0, y = window.pageYOffset);
    	}

    	$$self.$capture_state = () => ({ fade, Beemovie, Bgimage, Stt, y });

    	$$self.$inject_state = $$props => {
    		if ("y" in $$props) $$invalidate(0, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [y, onwindowscroll];
    }

    class Om_siden extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Om_siden",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\sidebar.svelte generated by Svelte v3.29.4 */

    const file$9 = "src\\sidebar.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let t0;
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			p = element("p");
    			p.textContent = "Lagd av Fabian Ø. Tangen 2020©";
    			attr_dev(p, "id", "cc");
    			set_style(p, "margin-top", "50px");
    			attr_dev(p, "class", "svelte-1rg39at");
    			add_location(p, file$9, 12, 4, 205);
    			attr_dev(div, "id", "mySidebar");
    			set_style(div, "width", /*sideBarWidth*/ ctx[0] + "px");
    			attr_dev(div, "class", "sidebar svelte-1rg39at");
    			add_location(div, file$9, 8, 2, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, p);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*sideBarWidth*/ 1) {
    				set_style(div, "width", /*sideBarWidth*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, ['default']);
    	let { sideBarWidth } = $$props;
    	let { mainMarginLeft } = $$props;
    	let { openNav } = $$props;
    	const writable_props = ["sideBarWidth", "mainMarginLeft", "openNav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sideBarWidth" in $$props) $$invalidate(0, sideBarWidth = $$props.sideBarWidth);
    		if ("mainMarginLeft" in $$props) $$invalidate(1, mainMarginLeft = $$props.mainMarginLeft);
    		if ("openNav" in $$props) $$invalidate(2, openNav = $$props.openNav);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ sideBarWidth, mainMarginLeft, openNav });

    	$$self.$inject_state = $$props => {
    		if ("sideBarWidth" in $$props) $$invalidate(0, sideBarWidth = $$props.sideBarWidth);
    		if ("mainMarginLeft" in $$props) $$invalidate(1, mainMarginLeft = $$props.mainMarginLeft);
    		if ("openNav" in $$props) $$invalidate(2, openNav = $$props.openNav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sideBarWidth, mainMarginLeft, openNav, $$scope, slots];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			sideBarWidth: 0,
    			mainMarginLeft: 1,
    			openNav: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sideBarWidth*/ ctx[0] === undefined && !("sideBarWidth" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'sideBarWidth'");
    		}

    		if (/*mainMarginLeft*/ ctx[1] === undefined && !("mainMarginLeft" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'mainMarginLeft'");
    		}

    		if (/*openNav*/ ctx[2] === undefined && !("openNav" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'openNav'");
    		}
    	}

    	get sideBarWidth() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sideBarWidth(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mainMarginLeft() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mainMarginLeft(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get openNav() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openNav(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\sider\snake.svelte generated by Svelte v3.29.4 */

    function create_fragment$c(ctx) {
    	let bgimage;
    	let current;

    	bgimage = new Bgimage({
    			props: {
    				header: "Kommer snart!",
    				url: "bilder/snake.png",
    				underskrift: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bgimage.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bgimage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bgimage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bgimage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bgimage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Snake", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snake> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bgimage });
    	return [];
    }

    class Snake extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snake",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\index.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$a = "src\\index.svelte";

    // (30:4) <Link to="/">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Startside");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(30:4) <Link to=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (31:4) <Link to="timeplan">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Timeplan");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(31:4) <Link to=\\\"timeplan\\\">",
    		ctx
    	});

    	return block;
    }

    // (32:4) <Link to="spill">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Spill");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(32:4) <Link to=\\\"spill\\\">",
    		ctx
    	});

    	return block;
    }

    // (33:4) <Link to="om_siden">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Om siden");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(33:4) <Link to=\\\"om_siden\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) <Sidebar sideBarWidth={sideBarWidth} mainMarginLeft={mainMarginLeft} openNav={openNav}>
    function create_default_slot_1(ctx) {
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let link3;
    	let current;

    	link0 = new Link({
    			props: {
    				to: "/",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				to: "timeplan",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link2 = new Link({
    			props: {
    				to: "spill",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link3 = new Link({
    			props: {
    				to: "om_siden",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link0.$$.fragment);
    			t0 = space();
    			create_component(link1.$$.fragment);
    			t1 = space();
    			create_component(link2.$$.fragment);
    			t2 = space();
    			create_component(link3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(link1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(link2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(link3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    			const link3_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link3_changes.$$scope = { dirty, ctx };
    			}

    			link3.$set(link3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(link3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(link1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(link2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(link3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(29:2) <Sidebar sideBarWidth={sideBarWidth} mainMarginLeft={mainMarginLeft} openNav={openNav}>",
    		ctx
    	});

    	return block;
    }

    // (28:0) <Router url="/">
    function create_default_slot$1(ctx) {
    	let sidebar;
    	let t0;
    	let div;
    	let button;
    	let t2;
    	let route0;
    	let t3;
    	let route1;
    	let t4;
    	let route2;
    	let t5;
    	let route3;
    	let t6;
    	let route4;
    	let current;
    	let mounted;
    	let dispose;

    	sidebar = new Sidebar({
    			props: {
    				sideBarWidth: /*sideBarWidth*/ ctx[0],
    				mainMarginLeft: /*mainMarginLeft*/ ctx[1],
    				openNav: /*openNav*/ ctx[2],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route0 = new Route({
    			props: { path: "timeplan", component: Timeplan },
    			$$inline: true
    		});

    	route1 = new Route({
    			props: { path: "spill", component: Spill },
    			$$inline: true
    		});

    	route2 = new Route({
    			props: { path: "om_siden", component: Om_siden },
    			$$inline: true
    		});

    	route3 = new Route({
    			props: { path: "/", component: Startside },
    			$$inline: true
    		});

    	route4 = new Route({
    			props: { path: "snake", component: Snake },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div = element("div");
    			button = element("button");
    			button.textContent = "☰ Meny";
    			t2 = space();
    			create_component(route0.$$.fragment);
    			t3 = space();
    			create_component(route1.$$.fragment);
    			t4 = space();
    			create_component(route2.$$.fragment);
    			t5 = space();
    			create_component(route3.$$.fragment);
    			t6 = space();
    			create_component(route4.$$.fragment);
    			attr_dev(button, "class", "openbtn svelte-24m7ja");
    			add_location(button, file$a, 35, 4, 1024);
    			attr_dev(div, "id", "main");
    			set_style(div, "margin-left", /*mainMarginLeft*/ ctx[1] + "px");
    			attr_dev(div, "class", "svelte-24m7ja");
    			add_location(div, file$a, 34, 2, 963);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t2);
    			mount_component(route0, div, null);
    			append_dev(div, t3);
    			mount_component(route1, div, null);
    			append_dev(div, t4);
    			mount_component(route2, div, null);
    			append_dev(div, t5);
    			mount_component(route3, div, null);
    			append_dev(div, t6);
    			mount_component(route4, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*openNav*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const sidebar_changes = {};
    			if (dirty & /*sideBarWidth*/ 1) sidebar_changes.sideBarWidth = /*sideBarWidth*/ ctx[0];
    			if (dirty & /*mainMarginLeft*/ 2) sidebar_changes.mainMarginLeft = /*mainMarginLeft*/ ctx[1];

    			if (dirty & /*$$scope*/ 16) {
    				sidebar_changes.$$scope = { dirty, ctx };
    			}

    			sidebar.$set(sidebar_changes);

    			if (!current || dirty & /*mainMarginLeft*/ 2) {
    				set_style(div, "margin-left", /*mainMarginLeft*/ ctx[1] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    			destroy_component(route3);
    			destroy_component(route4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(28:0) <Router url=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				url: "/",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope, mainMarginLeft, sideBarWidth*/ 19) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Src", slots, []);
    	let isOpen = true;
    	let sideBarWidth = 0;
    	let mainMarginLeft = 0;

    	function openNav() {
    		console.log("HERE");

    		if (isOpen) {
    			$$invalidate(0, sideBarWidth = 250);
    			$$invalidate(1, mainMarginLeft = 250);
    		} else {
    			$$invalidate(0, sideBarWidth = 0);
    			$$invalidate(1, mainMarginLeft = 0);
    		}

    		isOpen = !isOpen;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Src> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Link,
    		Route,
    		Startside,
    		Timeplan,
    		Spill,
    		Omsiden: Om_siden,
    		Sidebar,
    		Snake,
    		isOpen,
    		sideBarWidth,
    		mainMarginLeft,
    		openNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("isOpen" in $$props) isOpen = $$props.isOpen;
    		if ("sideBarWidth" in $$props) $$invalidate(0, sideBarWidth = $$props.sideBarWidth);
    		if ("mainMarginLeft" in $$props) $$invalidate(1, mainMarginLeft = $$props.mainMarginLeft);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sideBarWidth, mainMarginLeft, openNav];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    var app = new Src({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
