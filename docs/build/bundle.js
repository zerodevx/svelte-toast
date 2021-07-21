
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(claimed_nodes) {
            this.e = this.n = null;
            this.l = claimed_nodes;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                if (this.l) {
                    this.n = this.l;
                }
                else {
                    this.h(html);
                }
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
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

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
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
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
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

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
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

    const createToast = () => {
      const { subscribe, update } = writable([]);
      let count = 0;
      let defaults = {};
      const push = (msgOrComponent, opts = {}, props = {}) => {
        let msg, component;
        if (typeof (msgOrComponent) === 'string') {
          msg = msgOrComponent;
        } else {
          component = msgOrComponent;
        }    const entry = {
          msg,
          component,
          props,
          id: ++count,
          ...defaults,
          ...opts,
          theme: {
            ...defaults.theme, ...opts.theme
          }
        };
        update(n => entry.reversed ? [...n, entry] : [entry, ...n]);
        return count
      };
      const pop = id => {
        update(n => id ? n.filter(i => i.id !== id) : n.splice(1));
      };
      const set = (id, obj) => {
        update(n => {
          const idx = n.findIndex(i => i.id === id);
          if (idx > -1) {
            n[idx] = { ...n[idx], ...obj };
          }
          return n
        });
      };
      const _opts = (obj = {}) => {
        defaults = { ...defaults, ...obj, theme: { ...defaults.theme, ...obj.theme } };
        return defaults
      };
      return { subscribe, push, pop, set, _opts }
    };

    const toast = createToast();

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/ToastItem.svelte generated by Svelte v3.38.3 */
    const file$4 = "src/ToastItem.svelte";

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-1r0vvz1-style";
    	style.textContent = "._toastItem.svelte-1r0vvz1{width:var(--toastWidth,16rem);height:var(--toastHeight,auto);min-height:var(--toastMinHeight,3.5rem);margin:var(--toastMargin,0 0 0.5rem 0);background:var(--toastBackground,rgba(66,66,66,0.9));color:var(--toastColor,#FFF);box-shadow:var(--toastBoxShadow,0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06));border-radius:var(--toastBorderRadius,0.125rem);position:relative;display:flex;flex-direction:row;align-items:center;will-change:transform,opacity;-webkit-tap-highlight-color:transparent}._toastMsg.svelte-1r0vvz1{padding:var(--toastMsgPadding,0.75rem 0.5rem);flex:1 1 0%}._toastMsg.svelte-1r0vvz1 a{pointer-events:auto}._toastBtn.svelte-1r0vvz1{width:2rem;height:100%;font:1rem sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none;pointer-events:auto}._toastBar.svelte-1r0vvz1{display:block;-webkit-appearance:none;-moz-appearance:none;appearance:none;border:none;position:absolute;bottom:0;width:100%;height:6px;background:transparent}._toastBar.svelte-1r0vvz1::-webkit-progress-bar{background:transparent}._toastBar.svelte-1r0vvz1::-webkit-progress-value{background:var(--toastProgressBackground,rgba(33,150,243,0.75))}._toastBar.svelte-1r0vvz1::-moz-progress-bar{background:var(--toastProgressBackground,rgba(33,150,243,0.75))}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9hc3RJdGVtLnN2ZWx0ZSIsInNvdXJjZXMiOlsiVG9hc3RJdGVtLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuaW1wb3J0IHsgdHdlZW5lZCB9IGZyb20gJ3N2ZWx0ZS9tb3Rpb24nXG5pbXBvcnQgeyBsaW5lYXIgfSBmcm9tICdzdmVsdGUvZWFzaW5nJ1xuaW1wb3J0IHsgdG9hc3QgfSBmcm9tICcuL3N0b3Jlcy5qcydcblxuZXhwb3J0IGxldCBpdGVtXG5cbmNvbnN0IHByb2dyZXNzID0gdHdlZW5lZChpdGVtLmluaXRpYWwsIHsgZHVyYXRpb246IGl0ZW0uZHVyYXRpb24sIGVhc2luZzogbGluZWFyIH0pXG5cbmxldCBwcmV2UHJvZ3Jlc3MgPSBpdGVtLmluaXRpYWxcblxuJDogaWYgKHByZXZQcm9ncmVzcyAhPT0gaXRlbS5wcm9ncmVzcykge1xuICBpZiAoaXRlbS5wcm9ncmVzcyA9PT0gMSB8fCBpdGVtLnByb2dyZXNzID09PSAwKSB7XG4gICAgcHJvZ3Jlc3Muc2V0KGl0ZW0ucHJvZ3Jlc3MpLnRoZW4oKCkgPT4gdG9hc3QucG9wKGl0ZW0uaWQpKVxuICB9IGVsc2Uge1xuICAgIHByb2dyZXNzLnNldChpdGVtLnByb2dyZXNzKVxuICB9XG4gIHByZXZQcm9ncmVzcyA9IGl0ZW0ucHJvZ3Jlc3Ncbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4uX3RvYXN0SXRlbSB7XG4gIHdpZHRoOiB2YXIoLS10b2FzdFdpZHRoLDE2cmVtKTtcbiAgaGVpZ2h0OiB2YXIoLS10b2FzdEhlaWdodCxhdXRvKTtcbiAgbWluLWhlaWdodDogdmFyKC0tdG9hc3RNaW5IZWlnaHQsMy41cmVtKTtcbiAgbWFyZ2luOiB2YXIoLS10b2FzdE1hcmdpbiwwIDAgMC41cmVtIDApO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS10b2FzdEJhY2tncm91bmQscmdiYSg2Niw2Niw2NiwwLjkpKTtcbiAgY29sb3I6IHZhcigtLXRvYXN0Q29sb3IsI0ZGRik7XG4gIGJveC1zaGFkb3c6IHZhcigtLXRvYXN0Qm94U2hhZG93LDAgNHB4IDZweCAtMXB4IHJnYmEoMCwwLDAsMC4xKSwwIDJweCA0cHggLTFweCByZ2JhKDAsMCwwLDAuMDYpKTtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0tdG9hc3RCb3JkZXJSYWRpdXMsMC4xMjVyZW0pO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm0sb3BhY2l0eTtcbiAgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDtcbn1cbi5fdG9hc3RNc2cge1xuICBwYWRkaW5nOiB2YXIoLS10b2FzdE1zZ1BhZGRpbmcsMC43NXJlbSAwLjVyZW0pO1xuICBmbGV4OiAxIDEgMCU7XG59XG4uX3RvYXN0TXNnIDpnbG9iYWwoYSkge1xuICBwb2ludGVyLWV2ZW50czogYXV0bztcbn1cbi5fdG9hc3RCdG4ge1xuICB3aWR0aDogMnJlbTtcbiAgaGVpZ2h0OiAxMDAlO1xuICBmb250OiAxcmVtIHNhbnMtc2VyaWY7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIG91dGxpbmU6IG5vbmU7XG4gIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xufVxuLl90b2FzdEJhciB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICAtd2Via2l0LWFwcGVhcmFuY2U6IG5vbmU7XG4gIC1tb3otYXBwZWFyYW5jZTogbm9uZTtcbiAgYXBwZWFyYW5jZTogbm9uZTtcbiAgYm9yZGVyOiBub25lO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJvdHRvbTogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogNnB4O1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbn1cbi5fdG9hc3RCYXI6Oi13ZWJraXQtcHJvZ3Jlc3MtYmFyIHtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG59XG4uX3RvYXN0QmFyOjotd2Via2l0LXByb2dyZXNzLXZhbHVlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tdG9hc3RQcm9ncmVzc0JhY2tncm91bmQscmdiYSgzMywxNTAsMjQzLDAuNzUpKTtcbn1cbi5fdG9hc3RCYXI6Oi1tb3otcHJvZ3Jlc3MtYmFyIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tdG9hc3RQcm9ncmVzc0JhY2tncm91bmQscmdiYSgzMywxNTAsMjQzLDAuNzUpKTtcbn1cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJfdG9hc3RJdGVtXCI+XG4gIDxkaXYgY2xhc3M9XCJfdG9hc3RNc2dcIj5cbiAgICB7I2lmIGl0ZW0uY29tcG9uZW50fVxuICAgICAgPHN2ZWx0ZTpjb21wb25lbnQgdGhpcz1cIntpdGVtLmNvbXBvbmVudH1cIiB7Li4uaXRlbS5wcm9wc30gey4uLml0ZW0uaWR9IC8+XG4gICAgezplbHNlfVxuICAgICAge0BodG1sIGl0ZW0ubXNnfVxuICAgIHsvaWZ9XG4gIDwvZGl2PlxuXG4gIHsjaWYgaXRlbS5kaXNtaXNzYWJsZX1cbiAgPGRpdiBjbGFzcz1cIl90b2FzdEJ0blwiIHJvbGU9XCJidXR0b25cIiB0YWJpbmRleD1cIi0xXCIgb246Y2xpY2s9eygpID0+IHRvYXN0LnBvcChpdGVtLmlkKX0+4pyVPC9kaXY+XG4gIHsvaWZ9XG5cbiAgPHByb2dyZXNzIGNsYXNzPVwiX3RvYXN0QmFyXCIgdmFsdWU9eyRwcm9ncmVzc30+PC9wcm9ncmVzcz5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXNCQSxXQUFXLGVBQUMsQ0FBQyxBQUNYLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FDOUIsTUFBTSxDQUFFLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxDQUMvQixVQUFVLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDeEMsTUFBTSxDQUFFLElBQUksYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUN2QyxVQUFVLENBQUUsSUFBSSxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUNyRCxLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQzdCLFVBQVUsQ0FBRSxJQUFJLGdCQUFnQixDQUFDLDhEQUE4RCxDQUFDLENBQ2hHLGFBQWEsQ0FBRSxJQUFJLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUNoRCxRQUFRLENBQUUsUUFBUSxDQUNsQixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxHQUFHLENBQ25CLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFdBQVcsQ0FBRSxTQUFTLENBQUMsT0FBTyxDQUM5QiwyQkFBMkIsQ0FBRSxXQUFXLEFBQzFDLENBQUMsQUFDRCxVQUFVLGVBQUMsQ0FBQyxBQUNWLE9BQU8sQ0FBRSxJQUFJLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUM5QyxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEFBQ2QsQ0FBQyxBQUNELHlCQUFVLENBQUMsQUFBUSxDQUFDLEFBQUUsQ0FBQyxBQUNyQixjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDLEFBQ0QsVUFBVSxlQUFDLENBQUMsQUFDVixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osSUFBSSxDQUFFLElBQUksQ0FBQyxVQUFVLENBQ3JCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsZUFBZSxDQUFFLE1BQU0sQ0FDdkIsTUFBTSxDQUFFLE9BQU8sQ0FDZixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxJQUFJLEFBQ3RCLENBQUMsQUFDRCxVQUFVLGVBQUMsQ0FBQyxBQUNWLE9BQU8sQ0FBRSxLQUFLLENBQ2Qsa0JBQWtCLENBQUUsSUFBSSxDQUN4QixlQUFlLENBQUUsSUFBSSxDQUNyQixVQUFVLENBQUUsSUFBSSxDQUNoQixNQUFNLENBQUUsSUFBSSxDQUNaLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLE1BQU0sQ0FBRSxDQUFDLENBQ1QsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUNYLFVBQVUsQ0FBRSxXQUFXLEFBQ3pCLENBQUMsQUFDRCx5QkFBVSxzQkFBc0IsQUFBQyxDQUFDLEFBQ2hDLFVBQVUsQ0FBRSxXQUFXLEFBQ3pCLENBQUMsQUFDRCx5QkFBVSx3QkFBd0IsQUFBQyxDQUFDLEFBQ2xDLFVBQVUsQ0FBRSxJQUFJLHlCQUF5QixDQUFDLHFCQUFxQixDQUFDLEFBQ2xFLENBQUMsQUFDRCx5QkFBVSxtQkFBbUIsQUFBQyxDQUFDLEFBQzdCLFVBQVUsQ0FBRSxJQUFJLHlCQUF5QixDQUFDLHFCQUFxQixDQUFDLEFBQ2xFLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    // (84:4) {:else}
    function create_else_block(ctx) {
    	let html_tag;
    	let raw_value = /*item*/ ctx[0].msg + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && raw_value !== (raw_value = /*item*/ ctx[0].msg + "")) html_tag.p(raw_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(84:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#if item.component}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*item*/ ctx[0].props, /*item*/ ctx[0].id];
    	var switch_value = /*item*/ ctx[0].component;

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
    			const switch_instance_changes = (dirty & /*item*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [
    					get_spread_object(/*item*/ ctx[0].props),
    					get_spread_object(/*item*/ ctx[0].id)
    				])
    			: {};

    			if (switch_value !== (switch_value = /*item*/ ctx[0].component)) {
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
    		source: "(82:4) {#if item.component}",
    		ctx
    	});

    	return block;
    }

    // (89:2) {#if item.dismissable}
    function create_if_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "✕";
    			attr_dev(div, "class", "_toastBtn svelte-1r0vvz1");
    			attr_dev(div, "role", "button");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file$4, 89, 2, 2156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(89:2) {#if item.dismissable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let t1;
    	let progress_1;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[0].component) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*item*/ ctx[0].dismissable && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			progress_1 = element("progress");
    			attr_dev(div0, "class", "_toastMsg svelte-1r0vvz1");
    			add_location(div0, file$4, 80, 2, 1945);
    			attr_dev(progress_1, "class", "_toastBar svelte-1r0vvz1");
    			progress_1.value = /*$progress*/ ctx[1];
    			add_location(progress_1, file$4, 92, 2, 2262);
    			attr_dev(div1, "class", "_toastItem svelte-1r0vvz1");
    			add_location(div1, file$4, 79, 0, 1918);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, progress_1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, null);
    			}

    			if (/*item*/ ctx[0].dismissable) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty & /*$progress*/ 2) {
    				prop_dev(progress_1, "value", /*$progress*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
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
    	let $progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ToastItem", slots, []);
    	let { item } = $$props;
    	const progress = tweened(item.initial, { duration: item.duration, easing: identity });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(1, $progress = value));
    	let prevProgress = item.initial;
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToastItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toast.pop(item.id);

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		tweened,
    		linear: identity,
    		toast,
    		item,
    		progress,
    		prevProgress,
    		$progress
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("prevProgress" in $$props) $$invalidate(3, prevProgress = $$props.prevProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prevProgress, item*/ 9) {
    			if (prevProgress !== item.progress) {
    				if (item.progress === 1 || item.progress === 0) {
    					progress.set(item.progress).then(() => toast.pop(item.id));
    				} else {
    					progress.set(item.progress);
    				}

    				$$invalidate(3, prevProgress = item.progress);
    			}
    		}
    	};

    	return [item, $progress, progress, prevProgress, click_handler];
    }

    class ToastItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1r0vvz1-style")) add_css$2();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastItem",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<ToastItem> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<ToastItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<ToastItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SvelteToast.svelte generated by Svelte v3.38.3 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/SvelteToast.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-1wt6bln-style";
    	style.textContent = "ul.svelte-1wt6bln{top:var(--toastContainerTop,1.5rem);right:var(--toastContainerRight,2rem);bottom:var(--toastContainerBottom,auto);left:var(--toastContainerLeft,auto);position:fixed;margin:0;padding:0;list-style-type:none;pointer-events:none;z-index:9999}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ZlbHRlVG9hc3Quc3ZlbHRlIiwic291cmNlcyI6WyJTdmVsdGVUb2FzdC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbmltcG9ydCB7IGZhZGUsIGZseSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJ1xuaW1wb3J0IHsgZmxpcCB9IGZyb20gJ3N2ZWx0ZS9hbmltYXRlJ1xuaW1wb3J0IHsgdG9hc3QgfSBmcm9tICcuL3N0b3Jlcy5qcydcbmltcG9ydCBUb2FzdEl0ZW0gZnJvbSAnLi9Ub2FzdEl0ZW0uc3ZlbHRlJ1xuXG5leHBvcnQgbGV0IG9wdGlvbnMgPSB7fVxuY29uc3QgZGVmYXVsdHMgPSB7XG4gIGR1cmF0aW9uOiA0MDAwLFxuICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgaW5pdGlhbDogMSxcbiAgcHJvZ3Jlc3M6IDAsXG4gIHJldmVyc2VkOiBmYWxzZSxcbiAgaW50cm86IHsgeDogMjU2IH0sXG4gIHRoZW1lOiB7fVxufVxudG9hc3QuX29wdHMoZGVmYXVsdHMpXG4kOiB0b2FzdC5fb3B0cyhvcHRpb25zKVxuXG5jb25zdCBnZXRDc3MgPSB0aGVtZSA9PiBPYmplY3Qua2V5cyh0aGVtZSkucmVkdWNlKChhLCBjKSA9PiBgJHthfSR7Y306JHt0aGVtZVtjXX07YCwgJycpXG48L3NjcmlwdD5cblxuPHN0eWxlPlxudWwge1xuICB0b3A6IHZhcigtLXRvYXN0Q29udGFpbmVyVG9wLDEuNXJlbSk7XG4gIHJpZ2h0OiB2YXIoLS10b2FzdENvbnRhaW5lclJpZ2h0LDJyZW0pO1xuICBib3R0b206IHZhcigtLXRvYXN0Q29udGFpbmVyQm90dG9tLGF1dG8pO1xuICBsZWZ0OiB2YXIoLS10b2FzdENvbnRhaW5lckxlZnQsYXV0byk7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xuICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB6LWluZGV4OiA5OTk5O1xufVxuPC9zdHlsZT5cblxuPHVsIGNsYXNzPVwiX3RvYXN0Q29udGFpbmVyXCI+XG4gIHsjZWFjaCAkdG9hc3QgYXMgaXRlbSAoaXRlbS5pZCl9XG4gIDxsaVxuICAgIGluOmZseT17aXRlbS5pbnRyb31cbiAgICBvdXQ6ZmFkZVxuICAgIGFuaW1hdGU6ZmxpcD17eyBkdXJhdGlvbjogMjAwIH19XG4gICAgc3R5bGU9e2dldENzcyhpdGVtLnRoZW1lKX1cbiAgICA+XG4gICAgPFRvYXN0SXRlbSB7aXRlbX0gLz5cbiAgPC9saT5cbiAgey9lYWNofVxuPC91bD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1QkEsRUFBRSxlQUFDLENBQUMsQUFDRixHQUFHLENBQUUsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FDcEMsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQ3RDLE1BQU0sQ0FBRSxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUN4QyxJQUFJLENBQUUsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FDcEMsUUFBUSxDQUFFLEtBQUssQ0FDZixNQUFNLENBQUUsQ0FBQyxDQUNULE9BQU8sQ0FBRSxDQUFDLENBQ1YsZUFBZSxDQUFFLElBQUksQ0FDckIsY0FBYyxDQUFFLElBQUksQ0FDcEIsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (39:2) {#each $toast as item (item.id)}
    function create_each_block$1(key_1, ctx) {
    	let li;
    	let toastitem;
    	let t;
    	let li_style_value;
    	let li_intro;
    	let li_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	toastitem = new ToastItem({
    			props: { item: /*item*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(toastitem.$$.fragment);
    			t = space();
    			attr_dev(li, "style", li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme));
    			add_location(li, file$3, 39, 2, 854);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(toastitem, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const toastitem_changes = {};
    			if (dirty & /*$toast*/ 1) toastitem_changes.item = /*item*/ ctx[4];
    			toastitem.$set(toastitem_changes);

    			if (!current || dirty & /*$toast*/ 1 && li_style_value !== (li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme))) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    			add_transform(li, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: 200 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastitem.$$.fragment, local);

    			add_render_callback(() => {
    				if (li_outro) li_outro.end(1);
    				if (!li_intro) li_intro = create_in_transition(li, fly, /*item*/ ctx[4].intro);
    				li_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastitem.$$.fragment, local);
    			if (li_intro) li_intro.invalidate();
    			li_outro = create_out_transition(li, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(toastitem);
    			if (detaching && li_outro) li_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(39:2) {#each $toast as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$toast*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "_toastContainer svelte-1wt6bln");
    			add_location(ul, file$3, 37, 0, 788);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*getCss, $toast*/ 3) {
    				each_value = /*$toast*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	let $toast;
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(0, $toast = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvelteToast", slots, []);
    	let { options = {} } = $$props;

    	const defaults = {
    		duration: 4000,
    		dismissable: true,
    		initial: 1,
    		progress: 0,
    		reversed: false,
    		intro: { x: 256 },
    		theme: {}
    	};

    	toast._opts(defaults);
    	const getCss = theme => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, "");
    	const writable_props = ["options"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvelteToast> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		flip,
    		toast,
    		ToastItem,
    		options,
    		defaults,
    		getCss,
    		$toast
    	});

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options*/ 4) {
    			toast._opts(options);
    		}
    	};

    	return [$toast, getCss, options];
    }

    class SvelteToast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1wt6bln-style")) add_css$1();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvelteToast",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get options() {
    		throw new Error("<SvelteToast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<SvelteToast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var prism = {exports: {}};

    (function (module) {
    /* **********************************************
         Begin prism-core.js
    ********************************************** */

    /// <reference lib="WebWorker"/>

    var _self = (typeof window !== 'undefined')
    	? window   // if in browser
    	: (
    		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    			? self // if in worker
    			: {}   // if in node js
    	);

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     *
     * @license MIT <https://opensource.org/licenses/MIT>
     * @author Lea Verou <https://lea.verou.me>
     * @namespace
     * @public
     */
    var Prism = (function (_self) {

    	// Private helper vars
    	var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    	var uniqueId = 0;

    	// The grammar object for plaintext
    	var plainTextGrammar = {};


    	var _ = {
    		/**
    		 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
    		 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
    		 * additional languages or plugins yourself.
    		 *
    		 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
    		 *
    		 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
    		 * empty Prism object into the global scope before loading the Prism script like this:
    		 *
    		 * ```js
    		 * window.Prism = window.Prism || {};
    		 * Prism.manual = true;
    		 * // add a new <script> to load Prism's script
    		 * ```
    		 *
    		 * @default false
    		 * @type {boolean}
    		 * @memberof Prism
    		 * @public
    		 */
    		manual: _self.Prism && _self.Prism.manual,
    		disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

    		/**
    		 * A namespace for utility methods.
    		 *
    		 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
    		 * change or disappear at any time.
    		 *
    		 * @namespace
    		 * @memberof Prism
    		 */
    		util: {
    			encode: function encode(tokens) {
    				if (tokens instanceof Token) {
    					return new Token(tokens.type, encode(tokens.content), tokens.alias);
    				} else if (Array.isArray(tokens)) {
    					return tokens.map(encode);
    				} else {
    					return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    				}
    			},

    			/**
    			 * Returns the name of the type of the given value.
    			 *
    			 * @param {any} o
    			 * @returns {string}
    			 * @example
    			 * type(null)      === 'Null'
    			 * type(undefined) === 'Undefined'
    			 * type(123)       === 'Number'
    			 * type('foo')     === 'String'
    			 * type(true)      === 'Boolean'
    			 * type([1, 2])    === 'Array'
    			 * type({})        === 'Object'
    			 * type(String)    === 'Function'
    			 * type(/abc+/)    === 'RegExp'
    			 */
    			type: function (o) {
    				return Object.prototype.toString.call(o).slice(8, -1);
    			},

    			/**
    			 * Returns a unique number for the given object. Later calls will still return the same number.
    			 *
    			 * @param {Object} obj
    			 * @returns {number}
    			 */
    			objId: function (obj) {
    				if (!obj['__id']) {
    					Object.defineProperty(obj, '__id', { value: ++uniqueId });
    				}
    				return obj['__id'];
    			},

    			/**
    			 * Creates a deep clone of the given object.
    			 *
    			 * The main intended use of this function is to clone language definitions.
    			 *
    			 * @param {T} o
    			 * @param {Record<number, any>} [visited]
    			 * @returns {T}
    			 * @template T
    			 */
    			clone: function deepClone(o, visited) {
    				visited = visited || {};

    				var clone; var id;
    				switch (_.util.type(o)) {
    					case 'Object':
    						id = _.util.objId(o);
    						if (visited[id]) {
    							return visited[id];
    						}
    						clone = /** @type {Record<string, any>} */ ({});
    						visited[id] = clone;

    						for (var key in o) {
    							if (o.hasOwnProperty(key)) {
    								clone[key] = deepClone(o[key], visited);
    							}
    						}

    						return /** @type {any} */ (clone);

    					case 'Array':
    						id = _.util.objId(o);
    						if (visited[id]) {
    							return visited[id];
    						}
    						clone = [];
    						visited[id] = clone;

    						(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
    							clone[i] = deepClone(v, visited);
    						});

    						return /** @type {any} */ (clone);

    					default:
    						return o;
    				}
    			},

    			/**
    			 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
    			 *
    			 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
    			 *
    			 * @param {Element} element
    			 * @returns {string}
    			 */
    			getLanguage: function (element) {
    				while (element && !lang.test(element.className)) {
    					element = element.parentElement;
    				}
    				if (element) {
    					return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
    				}
    				return 'none';
    			},

    			/**
    			 * Returns the script element that is currently executing.
    			 *
    			 * This does __not__ work for line script element.
    			 *
    			 * @returns {HTMLScriptElement | null}
    			 */
    			currentScript: function () {
    				if (typeof document === 'undefined') {
    					return null;
    				}
    				if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
    					return /** @type {any} */ (document.currentScript);
    				}

    				// IE11 workaround
    				// we'll get the src of the current script by parsing IE11's error stack trace
    				// this will not work for inline scripts

    				try {
    					throw new Error();
    				} catch (err) {
    					// Get file src url from stack. Specifically works with the format of stack traces in IE.
    					// A stack will look like this:
    					//
    					// Error
    					//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
    					//    at Global code (http://localhost/components/prism-core.js:606:1)

    					var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
    					if (src) {
    						var scripts = document.getElementsByTagName('script');
    						for (var i in scripts) {
    							if (scripts[i].src == src) {
    								return scripts[i];
    							}
    						}
    					}
    					return null;
    				}
    			},

    			/**
    			 * Returns whether a given class is active for `element`.
    			 *
    			 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
    			 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
    			 * given class is just the given class with a `no-` prefix.
    			 *
    			 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
    			 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
    			 * ancestors have the given class or the negated version of it, then the default activation will be returned.
    			 *
    			 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
    			 * version of it, the class is considered active.
    			 *
    			 * @param {Element} element
    			 * @param {string} className
    			 * @param {boolean} [defaultActivation=false]
    			 * @returns {boolean}
    			 */
    			isActive: function (element, className, defaultActivation) {
    				var no = 'no-' + className;

    				while (element) {
    					var classList = element.classList;
    					if (classList.contains(className)) {
    						return true;
    					}
    					if (classList.contains(no)) {
    						return false;
    					}
    					element = element.parentElement;
    				}
    				return !!defaultActivation;
    			}
    		},

    		/**
    		 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
    		 *
    		 * @namespace
    		 * @memberof Prism
    		 * @public
    		 */
    		languages: {
    			/**
    			 * The grammar for plain, unformatted text.
    			 */
    			plain: plainTextGrammar,
    			plaintext: plainTextGrammar,
    			text: plainTextGrammar,
    			txt: plainTextGrammar,

    			/**
    			 * Creates a deep copy of the language with the given id and appends the given tokens.
    			 *
    			 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
    			 * will be overwritten at its original position.
    			 *
    			 * ## Best practices
    			 *
    			 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
    			 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
    			 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
    			 *
    			 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
    			 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
    			 *
    			 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
    			 * @param {Grammar} redef The new tokens to append.
    			 * @returns {Grammar} The new language created.
    			 * @public
    			 * @example
    			 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
    			 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
    			 *     // at its original position
    			 *     'comment': { ... },
    			 *     // CSS doesn't have a 'color' token, so this token will be appended
    			 *     'color': /\b(?:red|green|blue)\b/
    			 * });
    			 */
    			extend: function (id, redef) {
    				var lang = _.util.clone(_.languages[id]);

    				for (var key in redef) {
    					lang[key] = redef[key];
    				}

    				return lang;
    			},

    			/**
    			 * Inserts tokens _before_ another token in a language definition or any other grammar.
    			 *
    			 * ## Usage
    			 *
    			 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
    			 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
    			 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
    			 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
    			 * this:
    			 *
    			 * ```js
    			 * Prism.languages.markup.style = {
    			 *     // token
    			 * };
    			 * ```
    			 *
    			 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
    			 * before existing tokens. For the CSS example above, you would use it like this:
    			 *
    			 * ```js
    			 * Prism.languages.insertBefore('markup', 'cdata', {
    			 *     'style': {
    			 *         // token
    			 *     }
    			 * });
    			 * ```
    			 *
    			 * ## Special cases
    			 *
    			 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
    			 * will be ignored.
    			 *
    			 * This behavior can be used to insert tokens after `before`:
    			 *
    			 * ```js
    			 * Prism.languages.insertBefore('markup', 'comment', {
    			 *     'comment': Prism.languages.markup.comment,
    			 *     // tokens after 'comment'
    			 * });
    			 * ```
    			 *
    			 * ## Limitations
    			 *
    			 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
    			 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
    			 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
    			 * deleting properties which is necessary to insert at arbitrary positions.
    			 *
    			 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
    			 * Instead, it will create a new object and replace all references to the target object with the new one. This
    			 * can be done without temporarily deleting properties, so the iteration order is well-defined.
    			 *
    			 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
    			 * you hold the target object in a variable, then the value of the variable will not change.
    			 *
    			 * ```js
    			 * var oldMarkup = Prism.languages.markup;
    			 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
    			 *
    			 * assert(oldMarkup !== Prism.languages.markup);
    			 * assert(newMarkup === Prism.languages.markup);
    			 * ```
    			 *
    			 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
    			 * object to be modified.
    			 * @param {string} before The key to insert before.
    			 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
    			 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
    			 * object to be modified.
    			 *
    			 * Defaults to `Prism.languages`.
    			 * @returns {Grammar} The new grammar object.
    			 * @public
    			 */
    			insertBefore: function (inside, before, insert, root) {
    				root = root || /** @type {any} */ (_.languages);
    				var grammar = root[inside];
    				/** @type {Grammar} */
    				var ret = {};

    				for (var token in grammar) {
    					if (grammar.hasOwnProperty(token)) {

    						if (token == before) {
    							for (var newToken in insert) {
    								if (insert.hasOwnProperty(newToken)) {
    									ret[newToken] = insert[newToken];
    								}
    							}
    						}

    						// Do not insert token which also occur in insert. See #1525
    						if (!insert.hasOwnProperty(token)) {
    							ret[token] = grammar[token];
    						}
    					}
    				}

    				var old = root[inside];
    				root[inside] = ret;

    				// Update references in other language definitions
    				_.languages.DFS(_.languages, function (key, value) {
    					if (value === old && key != inside) {
    						this[key] = ret;
    					}
    				});

    				return ret;
    			},

    			// Traverse a language definition with Depth First Search
    			DFS: function DFS(o, callback, type, visited) {
    				visited = visited || {};

    				var objId = _.util.objId;

    				for (var i in o) {
    					if (o.hasOwnProperty(i)) {
    						callback.call(o, i, o[i], type || i);

    						var property = o[i];
    						var propertyType = _.util.type(property);

    						if (propertyType === 'Object' && !visited[objId(property)]) {
    							visited[objId(property)] = true;
    							DFS(property, callback, null, visited);
    						} else if (propertyType === 'Array' && !visited[objId(property)]) {
    							visited[objId(property)] = true;
    							DFS(property, callback, i, visited);
    						}
    					}
    				}
    			}
    		},

    		plugins: {},

    		/**
    		 * This is the most high-level function in Prism’s API.
    		 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
    		 * each one of them.
    		 *
    		 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
    		 *
    		 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
    		 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
    		 * @memberof Prism
    		 * @public
    		 */
    		highlightAll: function (async, callback) {
    			_.highlightAllUnder(document, async, callback);
    		},

    		/**
    		 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
    		 * {@link Prism.highlightElement} on each one of them.
    		 *
    		 * The following hooks will be run:
    		 * 1. `before-highlightall`
    		 * 2. `before-all-elements-highlight`
    		 * 3. All hooks of {@link Prism.highlightElement} for each element.
    		 *
    		 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
    		 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
    		 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
    		 * @memberof Prism
    		 * @public
    		 */
    		highlightAllUnder: function (container, async, callback) {
    			var env = {
    				callback: callback,
    				container: container,
    				selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    			};

    			_.hooks.run('before-highlightall', env);

    			env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    			_.hooks.run('before-all-elements-highlight', env);

    			for (var i = 0, element; (element = env.elements[i++]);) {
    				_.highlightElement(element, async === true, env.callback);
    			}
    		},

    		/**
    		 * Highlights the code inside a single element.
    		 *
    		 * The following hooks will be run:
    		 * 1. `before-sanity-check`
    		 * 2. `before-highlight`
    		 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
    		 * 4. `before-insert`
    		 * 5. `after-highlight`
    		 * 6. `complete`
    		 *
    		 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
    		 * the element's language.
    		 *
    		 * @param {Element} element The element containing the code.
    		 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
    		 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
    		 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
    		 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
    		 *
    		 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
    		 * asynchronous highlighting to work. You can build your own bundle on the
    		 * [Download page](https://prismjs.com/download.html).
    		 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
    		 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
    		 * @memberof Prism
    		 * @public
    		 */
    		highlightElement: function (element, async, callback) {
    			// Find language
    			var language = _.util.getLanguage(element);
    			var grammar = _.languages[language];

    			// Set language on the element, if not present
    			element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

    			// Set language on the parent, for styling
    			var parent = element.parentElement;
    			if (parent && parent.nodeName.toLowerCase() === 'pre') {
    				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
    			}

    			var code = element.textContent;

    			var env = {
    				element: element,
    				language: language,
    				grammar: grammar,
    				code: code
    			};

    			function insertHighlightedCode(highlightedCode) {
    				env.highlightedCode = highlightedCode;

    				_.hooks.run('before-insert', env);

    				env.element.innerHTML = env.highlightedCode;

    				_.hooks.run('after-highlight', env);
    				_.hooks.run('complete', env);
    				callback && callback.call(env.element);
    			}

    			_.hooks.run('before-sanity-check', env);

    			// plugins may change/add the parent/element
    			parent = env.element.parentElement;
    			if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
    				parent.setAttribute('tabindex', '0');
    			}

    			if (!env.code) {
    				_.hooks.run('complete', env);
    				callback && callback.call(env.element);
    				return;
    			}

    			_.hooks.run('before-highlight', env);

    			if (!env.grammar) {
    				insertHighlightedCode(_.util.encode(env.code));
    				return;
    			}

    			if (async && _self.Worker) {
    				var worker = new Worker(_.filename);

    				worker.onmessage = function (evt) {
    					insertHighlightedCode(evt.data);
    				};

    				worker.postMessage(JSON.stringify({
    					language: env.language,
    					code: env.code,
    					immediateClose: true
    				}));
    			} else {
    				insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    			}
    		},

    		/**
    		 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
    		 * and the language definitions to use, and returns a string with the HTML produced.
    		 *
    		 * The following hooks will be run:
    		 * 1. `before-tokenize`
    		 * 2. `after-tokenize`
    		 * 3. `wrap`: On each {@link Token}.
    		 *
    		 * @param {string} text A string with the code to be highlighted.
    		 * @param {Grammar} grammar An object containing the tokens to use.
    		 *
    		 * Usually a language definition like `Prism.languages.markup`.
    		 * @param {string} language The name of the language definition passed to `grammar`.
    		 * @returns {string} The highlighted HTML.
    		 * @memberof Prism
    		 * @public
    		 * @example
    		 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
    		 */
    		highlight: function (text, grammar, language) {
    			var env = {
    				code: text,
    				grammar: grammar,
    				language: language
    			};
    			_.hooks.run('before-tokenize', env);
    			env.tokens = _.tokenize(env.code, env.grammar);
    			_.hooks.run('after-tokenize', env);
    			return Token.stringify(_.util.encode(env.tokens), env.language);
    		},

    		/**
    		 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
    		 * and the language definitions to use, and returns an array with the tokenized code.
    		 *
    		 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
    		 *
    		 * This method could be useful in other contexts as well, as a very crude parser.
    		 *
    		 * @param {string} text A string with the code to be highlighted.
    		 * @param {Grammar} grammar An object containing the tokens to use.
    		 *
    		 * Usually a language definition like `Prism.languages.markup`.
    		 * @returns {TokenStream} An array of strings and tokens, a token stream.
    		 * @memberof Prism
    		 * @public
    		 * @example
    		 * let code = `var foo = 0;`;
    		 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
    		 * tokens.forEach(token => {
    		 *     if (token instanceof Prism.Token && token.type === 'number') {
    		 *         console.log(`Found numeric literal: ${token.content}`);
    		 *     }
    		 * });
    		 */
    		tokenize: function (text, grammar) {
    			var rest = grammar.rest;
    			if (rest) {
    				for (var token in rest) {
    					grammar[token] = rest[token];
    				}

    				delete grammar.rest;
    			}

    			var tokenList = new LinkedList();
    			addAfter(tokenList, tokenList.head, text);

    			matchGrammar(text, tokenList, grammar, tokenList.head, 0);

    			return toArray(tokenList);
    		},

    		/**
    		 * @namespace
    		 * @memberof Prism
    		 * @public
    		 */
    		hooks: {
    			all: {},

    			/**
    			 * Adds the given callback to the list of callbacks for the given hook.
    			 *
    			 * The callback will be invoked when the hook it is registered for is run.
    			 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
    			 *
    			 * One callback function can be registered to multiple hooks and the same hook multiple times.
    			 *
    			 * @param {string} name The name of the hook.
    			 * @param {HookCallback} callback The callback function which is given environment variables.
    			 * @public
    			 */
    			add: function (name, callback) {
    				var hooks = _.hooks.all;

    				hooks[name] = hooks[name] || [];

    				hooks[name].push(callback);
    			},

    			/**
    			 * Runs a hook invoking all registered callbacks with the given environment variables.
    			 *
    			 * Callbacks will be invoked synchronously and in the order in which they were registered.
    			 *
    			 * @param {string} name The name of the hook.
    			 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
    			 * @public
    			 */
    			run: function (name, env) {
    				var callbacks = _.hooks.all[name];

    				if (!callbacks || !callbacks.length) {
    					return;
    				}

    				for (var i = 0, callback; (callback = callbacks[i++]);) {
    					callback(env);
    				}
    			}
    		},

    		Token: Token
    	};
    	_self.Prism = _;


    	// Typescript note:
    	// The following can be used to import the Token type in JSDoc:
    	//
    	//   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

    	/**
    	 * Creates a new token.
    	 *
    	 * @param {string} type See {@link Token#type type}
    	 * @param {string | TokenStream} content See {@link Token#content content}
    	 * @param {string|string[]} [alias] The alias(es) of the token.
    	 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
    	 * @class
    	 * @global
    	 * @public
    	 */
    	function Token(type, content, alias, matchedStr) {
    		/**
    		 * The type of the token.
    		 *
    		 * This is usually the key of a pattern in a {@link Grammar}.
    		 *
    		 * @type {string}
    		 * @see GrammarToken
    		 * @public
    		 */
    		this.type = type;
    		/**
    		 * The strings or tokens contained by this token.
    		 *
    		 * This will be a token stream if the pattern matched also defined an `inside` grammar.
    		 *
    		 * @type {string | TokenStream}
    		 * @public
    		 */
    		this.content = content;
    		/**
    		 * The alias(es) of the token.
    		 *
    		 * @type {string|string[]}
    		 * @see GrammarToken
    		 * @public
    		 */
    		this.alias = alias;
    		// Copy of the full string this token was created from
    		this.length = (matchedStr || '').length | 0;
    	}

    	/**
    	 * A token stream is an array of strings and {@link Token Token} objects.
    	 *
    	 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
    	 * them.
    	 *
    	 * 1. No adjacent strings.
    	 * 2. No empty strings.
    	 *
    	 *    The only exception here is the token stream that only contains the empty string and nothing else.
    	 *
    	 * @typedef {Array<string | Token>} TokenStream
    	 * @global
    	 * @public
    	 */

    	/**
    	 * Converts the given token or token stream to an HTML representation.
    	 *
    	 * The following hooks will be run:
    	 * 1. `wrap`: On each {@link Token}.
    	 *
    	 * @param {string | Token | TokenStream} o The token or token stream to be converted.
    	 * @param {string} language The name of current language.
    	 * @returns {string} The HTML representation of the token or token stream.
    	 * @memberof Token
    	 * @static
    	 */
    	Token.stringify = function stringify(o, language) {
    		if (typeof o == 'string') {
    			return o;
    		}
    		if (Array.isArray(o)) {
    			var s = '';
    			o.forEach(function (e) {
    				s += stringify(e, language);
    			});
    			return s;
    		}

    		var env = {
    			type: o.type,
    			content: stringify(o.content, language),
    			tag: 'span',
    			classes: ['token', o.type],
    			attributes: {},
    			language: language
    		};

    		var aliases = o.alias;
    		if (aliases) {
    			if (Array.isArray(aliases)) {
    				Array.prototype.push.apply(env.classes, aliases);
    			} else {
    				env.classes.push(aliases);
    			}
    		}

    		_.hooks.run('wrap', env);

    		var attributes = '';
    		for (var name in env.attributes) {
    			attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    		}

    		return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    	};

    	/**
    	 * @param {RegExp} pattern
    	 * @param {number} pos
    	 * @param {string} text
    	 * @param {boolean} lookbehind
    	 * @returns {RegExpExecArray | null}
    	 */
    	function matchPattern(pattern, pos, text, lookbehind) {
    		pattern.lastIndex = pos;
    		var match = pattern.exec(text);
    		if (match && lookbehind && match[1]) {
    			// change the match to remove the text matched by the Prism lookbehind group
    			var lookbehindLength = match[1].length;
    			match.index += lookbehindLength;
    			match[0] = match[0].slice(lookbehindLength);
    		}
    		return match;
    	}

    	/**
    	 * @param {string} text
    	 * @param {LinkedList<string | Token>} tokenList
    	 * @param {any} grammar
    	 * @param {LinkedListNode<string | Token>} startNode
    	 * @param {number} startPos
    	 * @param {RematchOptions} [rematch]
    	 * @returns {void}
    	 * @private
    	 *
    	 * @typedef RematchOptions
    	 * @property {string} cause
    	 * @property {number} reach
    	 */
    	function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    		for (var token in grammar) {
    			if (!grammar.hasOwnProperty(token) || !grammar[token]) {
    				continue;
    			}

    			var patterns = grammar[token];
    			patterns = Array.isArray(patterns) ? patterns : [patterns];

    			for (var j = 0; j < patterns.length; ++j) {
    				if (rematch && rematch.cause == token + ',' + j) {
    					return;
    				}

    				var patternObj = patterns[j];
    				var inside = patternObj.inside;
    				var lookbehind = !!patternObj.lookbehind;
    				var greedy = !!patternObj.greedy;
    				var alias = patternObj.alias;

    				if (greedy && !patternObj.pattern.global) {
    					// Without the global flag, lastIndex won't work
    					var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
    					patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
    				}

    				/** @type {RegExp} */
    				var pattern = patternObj.pattern || patternObj;

    				for ( // iterate the token list and keep track of the current token/string position
    					var currentNode = startNode.next, pos = startPos;
    					currentNode !== tokenList.tail;
    					pos += currentNode.value.length, currentNode = currentNode.next
    				) {

    					if (rematch && pos >= rematch.reach) {
    						break;
    					}

    					var str = currentNode.value;

    					if (tokenList.length > text.length) {
    						// Something went terribly wrong, ABORT, ABORT!
    						return;
    					}

    					if (str instanceof Token) {
    						continue;
    					}

    					var removeCount = 1; // this is the to parameter of removeBetween
    					var match;

    					if (greedy) {
    						match = matchPattern(pattern, pos, text, lookbehind);
    						if (!match) {
    							break;
    						}

    						var from = match.index;
    						var to = match.index + match[0].length;
    						var p = pos;

    						// find the node that contains the match
    						p += currentNode.value.length;
    						while (from >= p) {
    							currentNode = currentNode.next;
    							p += currentNode.value.length;
    						}
    						// adjust pos (and p)
    						p -= currentNode.value.length;
    						pos = p;

    						// the current node is a Token, then the match starts inside another Token, which is invalid
    						if (currentNode.value instanceof Token) {
    							continue;
    						}

    						// find the last node which is affected by this match
    						for (
    							var k = currentNode;
    							k !== tokenList.tail && (p < to || typeof k.value === 'string');
    							k = k.next
    						) {
    							removeCount++;
    							p += k.value.length;
    						}
    						removeCount--;

    						// replace with the new match
    						str = text.slice(pos, p);
    						match.index -= pos;
    					} else {
    						match = matchPattern(pattern, 0, str, lookbehind);
    						if (!match) {
    							continue;
    						}
    					}

    					// eslint-disable-next-line no-redeclare
    					var from = match.index;
    					var matchStr = match[0];
    					var before = str.slice(0, from);
    					var after = str.slice(from + matchStr.length);

    					var reach = pos + str.length;
    					if (rematch && reach > rematch.reach) {
    						rematch.reach = reach;
    					}

    					var removeFrom = currentNode.prev;

    					if (before) {
    						removeFrom = addAfter(tokenList, removeFrom, before);
    						pos += before.length;
    					}

    					removeRange(tokenList, removeFrom, removeCount);

    					var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
    					currentNode = addAfter(tokenList, removeFrom, wrapped);

    					if (after) {
    						addAfter(tokenList, currentNode, after);
    					}

    					if (removeCount > 1) {
    						// at least one Token object was removed, so we have to do some rematching
    						// this can only happen if the current pattern is greedy

    						/** @type {RematchOptions} */
    						var nestedRematch = {
    							cause: token + ',' + j,
    							reach: reach
    						};
    						matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

    						// the reach might have been extended because of the rematching
    						if (rematch && nestedRematch.reach > rematch.reach) {
    							rematch.reach = nestedRematch.reach;
    						}
    					}
    				}
    			}
    		}
    	}

    	/**
    	 * @typedef LinkedListNode
    	 * @property {T} value
    	 * @property {LinkedListNode<T> | null} prev The previous node.
    	 * @property {LinkedListNode<T> | null} next The next node.
    	 * @template T
    	 * @private
    	 */

    	/**
    	 * @template T
    	 * @private
    	 */
    	function LinkedList() {
    		/** @type {LinkedListNode<T>} */
    		var head = { value: null, prev: null, next: null };
    		/** @type {LinkedListNode<T>} */
    		var tail = { value: null, prev: head, next: null };
    		head.next = tail;

    		/** @type {LinkedListNode<T>} */
    		this.head = head;
    		/** @type {LinkedListNode<T>} */
    		this.tail = tail;
    		this.length = 0;
    	}

    	/**
    	 * Adds a new node with the given value to the list.
    	 *
    	 * @param {LinkedList<T>} list
    	 * @param {LinkedListNode<T>} node
    	 * @param {T} value
    	 * @returns {LinkedListNode<T>} The added node.
    	 * @template T
    	 */
    	function addAfter(list, node, value) {
    		// assumes that node != list.tail && values.length >= 0
    		var next = node.next;

    		var newNode = { value: value, prev: node, next: next };
    		node.next = newNode;
    		next.prev = newNode;
    		list.length++;

    		return newNode;
    	}
    	/**
    	 * Removes `count` nodes after the given node. The given node will not be removed.
    	 *
    	 * @param {LinkedList<T>} list
    	 * @param {LinkedListNode<T>} node
    	 * @param {number} count
    	 * @template T
    	 */
    	function removeRange(list, node, count) {
    		var next = node.next;
    		for (var i = 0; i < count && next !== list.tail; i++) {
    			next = next.next;
    		}
    		node.next = next;
    		next.prev = node;
    		list.length -= i;
    	}
    	/**
    	 * @param {LinkedList<T>} list
    	 * @returns {T[]}
    	 * @template T
    	 */
    	function toArray(list) {
    		var array = [];
    		var node = list.head.next;
    		while (node !== list.tail) {
    			array.push(node.value);
    			node = node.next;
    		}
    		return array;
    	}


    	if (!_self.document) {
    		if (!_self.addEventListener) {
    			// in Node.js
    			return _;
    		}

    		if (!_.disableWorkerMessageHandler) {
    			// In worker
    			_self.addEventListener('message', function (evt) {
    				var message = JSON.parse(evt.data);
    				var lang = message.language;
    				var code = message.code;
    				var immediateClose = message.immediateClose;

    				_self.postMessage(_.highlight(code, _.languages[lang], lang));
    				if (immediateClose) {
    					_self.close();
    				}
    			}, false);
    		}

    		return _;
    	}

    	// Get current script and highlight
    	var script = _.util.currentScript();

    	if (script) {
    		_.filename = script.src;

    		if (script.hasAttribute('data-manual')) {
    			_.manual = true;
    		}
    	}

    	function highlightAutomaticallyCallback() {
    		if (!_.manual) {
    			_.highlightAll();
    		}
    	}

    	if (!_.manual) {
    		// If the document state is "loading", then we'll use DOMContentLoaded.
    		// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
    		// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
    		// might take longer one animation frame to execute which can create a race condition where only some plugins have
    		// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
    		// See https://github.com/PrismJS/prism/issues/2102
    		var readyState = document.readyState;
    		if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    			document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    		} else {
    			if (window.requestAnimationFrame) {
    				window.requestAnimationFrame(highlightAutomaticallyCallback);
    			} else {
    				window.setTimeout(highlightAutomaticallyCallback, 16);
    			}
    		}
    	}

    	return _;

    }(_self));

    if (module.exports) {
    	module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof commonjsGlobal !== 'undefined') {
    	commonjsGlobal.Prism = Prism;
    }

    // some additional documentation/types

    /**
     * The expansion of a simple `RegExp` literal to support additional properties.
     *
     * @typedef GrammarToken
     * @property {RegExp} pattern The regular expression of the token.
     * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
     * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
     * @property {boolean} [greedy=false] Whether the token is greedy.
     * @property {string|string[]} [alias] An optional alias or list of aliases.
     * @property {Grammar} [inside] The nested grammar of this token.
     *
     * The `inside` grammar will be used to tokenize the text value of each token of this kind.
     *
     * This can be used to make nested and even recursive language definitions.
     *
     * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
     * each another.
     * @global
     * @public
     */

    /**
     * @typedef Grammar
     * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
     * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
     * @global
     * @public
     */

    /**
     * A function which will invoked after an element was successfully highlighted.
     *
     * @callback HighlightCallback
     * @param {Element} element The element successfully highlighted.
     * @returns {void}
     * @global
     * @public
     */

    /**
     * @callback HookCallback
     * @param {Object<string, any>} env The environment variables of the hook.
     * @returns {void}
     * @global
     * @public
     */


    /* **********************************************
         Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
    	'comment': /<!--[\s\S]*?-->/,
    	'prolog': /<\?[\s\S]+?\?>/,
    	'doctype': {
    		// https://www.w3.org/TR/xml/#NT-doctypedecl
    		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    		greedy: true,
    		inside: {
    			'internal-subset': {
    				pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
    				lookbehind: true,
    				greedy: true,
    				inside: null // see below
    			},
    			'string': {
    				pattern: /"[^"]*"|'[^']*'/,
    				greedy: true
    			},
    			'punctuation': /^<!|>$|[[\]]/,
    			'doctype-tag': /^DOCTYPE/,
    			'name': /[^\s<>'"]+/
    		}
    	},
    	'cdata': /<!\[CDATA\[[\s\S]*?\]\]>/i,
    	'tag': {
    		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    		greedy: true,
    		inside: {
    			'tag': {
    				pattern: /^<\/?[^\s>\/]+/,
    				inside: {
    					'punctuation': /^<\/?/,
    					'namespace': /^[^\s>\/:]+:/
    				}
    			},
    			'special-attr': [],
    			'attr-value': {
    				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
    				inside: {
    					'punctuation': [
    						{
    							pattern: /^=/,
    							alias: 'attr-equals'
    						},
    						/"|'/
    					]
    				}
    			},
    			'punctuation': /\/?>/,
    			'attr-name': {
    				pattern: /[^\s>\/]+/,
    				inside: {
    					'namespace': /^[^\s>\/:]+:/
    				}
    			}

    		}
    	},
    	'entity': [
    		{
    			pattern: /&[\da-z]{1,8};/i,
    			alias: 'named-entity'
    		},
    		/&#x?[\da-f]{1,8};/i
    	]
    };

    Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    	Prism.languages.markup['entity'];
    Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', function (env) {

    	if (env.type === 'entity') {
    		env.attributes['title'] = env.content.replace(/&amp;/, '&');
    	}
    });

    Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    	/**
    	 * Adds an inlined language to markup.
    	 *
    	 * An example of an inlined language is CSS with `<style>` tags.
    	 *
    	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
    	 * case insensitive.
    	 * @param {string} lang The language key.
    	 * @example
    	 * addInlined('style', 'css');
    	 */
    	value: function addInlined(tagName, lang) {
    		var includedCdataInside = {};
    		includedCdataInside['language-' + lang] = {
    			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
    			lookbehind: true,
    			inside: Prism.languages[lang]
    		};
    		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    		var inside = {
    			'included-cdata': {
    				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    				inside: includedCdataInside
    			}
    		};
    		inside['language-' + lang] = {
    			pattern: /[\s\S]+/,
    			inside: Prism.languages[lang]
    		};

    		var def = {};
    		def[tagName] = {
    			pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
    			lookbehind: true,
    			greedy: true,
    			inside: inside
    		};

    		Prism.languages.insertBefore('markup', 'cdata', def);
    	}
    });
    Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    	/**
    	 * Adds an pattern to highlight languages embedded in HTML attributes.
    	 *
    	 * An example of an inlined language is CSS with `style` attributes.
    	 *
    	 * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
    	 * case insensitive.
    	 * @param {string} lang The language key.
    	 * @example
    	 * addAttribute('style', 'css');
    	 */
    	value: function (attrName, lang) {
    		Prism.languages.markup.tag.inside['special-attr'].push({
    			pattern: RegExp(
    				/(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
    				'i'
    			),
    			lookbehind: true,
    			inside: {
    				'attr-name': /^[^\s=]+/,
    				'attr-value': {
    					pattern: /=[\s\S]+/,
    					inside: {
    						'value': {
    							pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
    							lookbehind: true,
    							alias: [lang, 'language-' + lang],
    							inside: Prism.languages[lang]
    						},
    						'punctuation': [
    							{
    								pattern: /^=/,
    								alias: 'attr-equals'
    							},
    							/"|'/
    						]
    					}
    				}
    			}
    		});
    	}
    });

    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;

    Prism.languages.xml = Prism.languages.extend('markup', {});
    Prism.languages.ssml = Prism.languages.xml;
    Prism.languages.atom = Prism.languages.xml;
    Prism.languages.rss = Prism.languages.xml;


    /* **********************************************
         Begin prism-css.js
    ********************************************** */

    (function (Prism) {

    	var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

    	Prism.languages.css = {
    		'comment': /\/\*[\s\S]*?\*\//,
    		'atrule': {
    			pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
    			inside: {
    				'rule': /^@[\w-]+/,
    				'selector-function-argument': {
    					pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
    					lookbehind: true,
    					alias: 'selector'
    				},
    				'keyword': {
    					pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
    					lookbehind: true
    				}
    				// See rest below
    			}
    		},
    		'url': {
    			// https://drafts.csswg.org/css-values-3/#urls
    			pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
    			greedy: true,
    			inside: {
    				'function': /^url/i,
    				'punctuation': /^\(|\)$/,
    				'string': {
    					pattern: RegExp('^' + string.source + '$'),
    					alias: 'url'
    				}
    			}
    		},
    		'selector': {
    			pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
    			lookbehind: true
    		},
    		'string': {
    			pattern: string,
    			greedy: true
    		},
    		'property': {
    			pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
    			lookbehind: true
    		},
    		'important': /!important\b/i,
    		'function': {
    			pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
    			lookbehind: true
    		},
    		'punctuation': /[(){};:,]/
    	};

    	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    	var markup = Prism.languages.markup;
    	if (markup) {
    		markup.tag.addInlined('style', 'css');
    		markup.tag.addAttribute('style', 'css');
    	}

    }(Prism));


    /* **********************************************
         Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
    	'comment': [
    		{
    			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    			lookbehind: true,
    			greedy: true
    		},
    		{
    			pattern: /(^|[^\\:])\/\/.*/,
    			lookbehind: true,
    			greedy: true
    		}
    	],
    	'string': {
    		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    		greedy: true
    	},
    	'class-name': {
    		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    		lookbehind: true,
    		inside: {
    			'punctuation': /[.\\]/
    		}
    	},
    	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    	'boolean': /\b(?:true|false)\b/,
    	'function': /\b\w+(?=\()/,
    	'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    	'punctuation': /[{}[\];(),.:]/
    };


    /* **********************************************
         Begin prism-javascript.js
    ********************************************** */

    Prism.languages.javascript = Prism.languages.extend('clike', {
    	'class-name': [
    		Prism.languages.clike['class-name'],
    		{
    			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:prototype|constructor))/,
    			lookbehind: true
    		}
    	],
    	'keyword': [
    		{
    			pattern: /((?:^|\})\s*)catch\b/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    			lookbehind: true
    		},
    	],
    	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    	'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    	'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });

    Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

    Prism.languages.insertBefore('javascript', 'keyword', {
    	'regex': {
    		// eslint-disable-next-line regexp/no-dupe-characters-character-class
    		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    		lookbehind: true,
    		greedy: true,
    		inside: {
    			'regex-source': {
    				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
    				lookbehind: true,
    				alias: 'language-regex',
    				inside: Prism.languages.regex
    			},
    			'regex-delimiter': /^\/|\/$/,
    			'regex-flags': /^[a-z]+$/,
    		}
    	},
    	// This must be declared before keyword because we use "function" inside the look-forward
    	'function-variable': {
    		pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
    		alias: 'function'
    	},
    	'parameter': [
    		{
    			pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		}
    	],
    	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });

    Prism.languages.insertBefore('javascript', 'string', {
    	'hashbang': {
    		pattern: /^#!.*/,
    		greedy: true,
    		alias: 'comment'
    	},
    	'template-string': {
    		pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
    		greedy: true,
    		inside: {
    			'template-punctuation': {
    				pattern: /^`|`$/,
    				alias: 'string'
    			},
    			'interpolation': {
    				pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
    				lookbehind: true,
    				inside: {
    					'interpolation-punctuation': {
    						pattern: /^\$\{|\}$/,
    						alias: 'punctuation'
    					},
    					rest: Prism.languages.javascript
    				}
    			},
    			'string': /[\s\S]+/
    		}
    	}
    });

    if (Prism.languages.markup) {
    	Prism.languages.markup.tag.addInlined('script', 'javascript');

    	// add attribute support for all DOM events.
    	// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
    	Prism.languages.markup.tag.addAttribute(
    		/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    		'javascript'
    	);
    }

    Prism.languages.js = Prism.languages.javascript;


    /* **********************************************
         Begin prism-file-highlight.js
    ********************************************** */

    (function () {

    	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
    		return;
    	}

    	// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
    	if (!Element.prototype.matches) {
    		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    	}

    	var LOADING_MESSAGE = 'Loading…';
    	var FAILURE_MESSAGE = function (status, message) {
    		return '✖ Error ' + status + ' while fetching file: ' + message;
    	};
    	var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

    	var EXTENSIONS = {
    		'js': 'javascript',
    		'py': 'python',
    		'rb': 'ruby',
    		'ps1': 'powershell',
    		'psm1': 'powershell',
    		'sh': 'bash',
    		'bat': 'batch',
    		'h': 'c',
    		'tex': 'latex'
    	};

    	var STATUS_ATTR = 'data-src-status';
    	var STATUS_LOADING = 'loading';
    	var STATUS_LOADED = 'loaded';
    	var STATUS_FAILED = 'failed';

    	var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
    		+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

    	var lang = /\blang(?:uage)?-([\w-]+)\b/i;

    	/**
    	 * Sets the Prism `language-xxxx` or `lang-xxxx` class to the given language.
    	 *
    	 * @param {HTMLElement} element
    	 * @param {string} language
    	 * @returns {void}
    	 */
    	function setLanguageClass(element, language) {
    		var className = element.className;
    		className = className.replace(lang, ' ') + ' language-' + language;
    		element.className = className.replace(/\s+/g, ' ').trim();
    	}


    	Prism.hooks.add('before-highlightall', function (env) {
    		env.selector += ', ' + SELECTOR;
    	});

    	Prism.hooks.add('before-sanity-check', function (env) {
    		var pre = /** @type {HTMLPreElement} */ (env.element);
    		if (pre.matches(SELECTOR)) {
    			env.code = ''; // fast-path the whole thing and go to complete

    			pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

    			// add code element with loading message
    			var code = pre.appendChild(document.createElement('CODE'));
    			code.textContent = LOADING_MESSAGE;

    			var src = pre.getAttribute('data-src');

    			var language = env.language;
    			if (language === 'none') {
    				// the language might be 'none' because there is no language set;
    				// in this case, we want to use the extension as the language
    				var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
    				language = EXTENSIONS[extension] || extension;
    			}

    			// set language classes
    			setLanguageClass(code, language);
    			setLanguageClass(pre, language);

    			// preload the language
    			var autoloader = Prism.plugins.autoloader;
    			if (autoloader) {
    				autoloader.loadLanguages(language);
    			}

    			// load file
    			var xhr = new XMLHttpRequest();
    			xhr.open('GET', src, true);
    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4) {
    					if (xhr.status < 400 && xhr.responseText) {
    						// mark as loaded
    						pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

    						// highlight code
    						code.textContent = xhr.responseText;
    						Prism.highlightElement(code);

    					} else {
    						// mark as failed
    						pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

    						if (xhr.status >= 400) {
    							code.textContent = FAILURE_MESSAGE(xhr.status, xhr.statusText);
    						} else {
    							code.textContent = FAILURE_EMPTY_MESSAGE;
    						}
    					}
    				}
    			};
    			xhr.send(null);
    		}
    	});

    	Prism.plugins.fileHighlight = {
    		/**
    		 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
    		 *
    		 * Note: Elements which are already loaded or currently loading will not be touched by this method.
    		 *
    		 * @param {ParentNode} [container=document]
    		 */
    		highlight: function highlight(container) {
    			var elements = (container || document).querySelectorAll(SELECTOR);

    			for (var i = 0, element; (element = elements[i++]);) {
    				Prism.highlightElement(element);
    			}
    		}
    	};

    	var logged = false;
    	/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
    	Prism.fileHighlight = function () {
    		if (!logged) {
    			console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
    			logged = true;
    		}
    		Prism.plugins.fileHighlight.highlight.apply(this, arguments);
    	};

    }());
    }(prism));

    var prismNormalizeWhitespace = {exports: {}};

    (function (module) {
    (function () {

    	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
    		return;
    	}

    	var assign = Object.assign || function (obj1, obj2) {
    		for (var name in obj2) {
    			if (obj2.hasOwnProperty(name)) {
    				obj1[name] = obj2[name];
    			}
    		}
    		return obj1;
    	};

    	function NormalizeWhitespace(defaults) {
    		this.defaults = assign({}, defaults);
    	}

    	function toCamelCase(value) {
    		return value.replace(/-(\w)/g, function (match, firstChar) {
    			return firstChar.toUpperCase();
    		});
    	}

    	function tabLen(str) {
    		var res = 0;
    		for (var i = 0; i < str.length; ++i) {
    			if (str.charCodeAt(i) == '\t'.charCodeAt(0)) {
    				res += 3;
    			}
    		}
    		return str.length + res;
    	}

    	NormalizeWhitespace.prototype = {
    		setDefaults: function (defaults) {
    			this.defaults = assign(this.defaults, defaults);
    		},
    		normalize: function (input, settings) {
    			settings = assign(this.defaults, settings);

    			for (var name in settings) {
    				var methodName = toCamelCase(name);
    				if (name !== 'normalize' && methodName !== 'setDefaults' &&
    					settings[name] && this[methodName]) {
    					input = this[methodName].call(this, input, settings[name]);
    				}
    			}

    			return input;
    		},

    		/*
    		 * Normalization methods
    		 */
    		leftTrim: function (input) {
    			return input.replace(/^\s+/, '');
    		},
    		rightTrim: function (input) {
    			return input.replace(/\s+$/, '');
    		},
    		tabsToSpaces: function (input, spaces) {
    			spaces = spaces|0 || 4;
    			return input.replace(/\t/g, new Array(++spaces).join(' '));
    		},
    		spacesToTabs: function (input, spaces) {
    			spaces = spaces|0 || 4;
    			return input.replace(RegExp(' {' + spaces + '}', 'g'), '\t');
    		},
    		removeTrailing: function (input) {
    			return input.replace(/\s*?$/gm, '');
    		},
    		// Support for deprecated plugin remove-initial-line-feed
    		removeInitialLineFeed: function (input) {
    			return input.replace(/^(?:\r?\n|\r)/, '');
    		},
    		removeIndent: function (input) {
    			var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);

    			if (!indents || !indents[0].length) {
    				return input;
    			}

    			indents.sort(function (a, b) { return a.length - b.length; });

    			if (!indents[0].length) {
    				return input;
    			}

    			return input.replace(RegExp('^' + indents[0], 'gm'), '');
    		},
    		indent: function (input, tabs) {
    			return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join('\t') + '$&');
    		},
    		breakLines: function (input, characters) {
    			characters = (characters === true) ? 80 : characters|0 || 80;

    			var lines = input.split('\n');
    			for (var i = 0; i < lines.length; ++i) {
    				if (tabLen(lines[i]) <= characters) {
    					continue;
    				}

    				var line = lines[i].split(/(\s+)/g);
    				var len = 0;

    				for (var j = 0; j < line.length; ++j) {
    					var tl = tabLen(line[j]);
    					len += tl;
    					if (len > characters) {
    						line[j] = '\n' + line[j];
    						len = tl;
    					}
    				}
    				lines[i] = line.join('');
    			}
    			return lines.join('\n');
    		}
    	};

    	// Support node modules
    	if (module.exports) {
    		module.exports = NormalizeWhitespace;
    	}

    	// Exit if prism is not loaded
    	if (typeof Prism === 'undefined') {
    		return;
    	}

    	Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
    		'remove-trailing': true,
    		'remove-indent': true,
    		'left-trim': true,
    		'right-trim': true,
    		/*'break-lines': 80,
    		'indent': 2,
    		'remove-initial-line-feed': false,
    		'tabs-to-spaces': 4,
    		'spaces-to-tabs': 4*/
    	});

    	Prism.hooks.add('before-sanity-check', function (env) {
    		var Normalizer = Prism.plugins.NormalizeWhitespace;

    		// Check settings
    		if (env.settings && env.settings['whitespace-normalization'] === false) {
    			return;
    		}

    		// Check classes
    		if (!Prism.util.isActive(env.element, 'whitespace-normalization', true)) {
    			return;
    		}

    		// Simple mode if there is no env.element
    		if ((!env.element || !env.element.parentNode) && env.code) {
    			env.code = Normalizer.normalize(env.code, env.settings);
    			return;
    		}

    		// Normal mode
    		var pre = env.element.parentNode;
    		if (!env.code || !pre || pre.nodeName.toLowerCase() !== 'pre') {
    			return;
    		}

    		var children = pre.childNodes;
    		var before = '';
    		var after = '';
    		var codeFound = false;

    		// Move surrounding whitespace from the <pre> tag into the <code> tag
    		for (var i = 0; i < children.length; ++i) {
    			var node = children[i];

    			if (node == env.element) {
    				codeFound = true;
    			} else if (node.nodeName === '#text') {
    				if (codeFound) {
    					after += node.nodeValue;
    				} else {
    					before += node.nodeValue;
    				}

    				pre.removeChild(node);
    				--i;
    			}
    		}

    		if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
    			env.code = before + env.code + after;
    			env.code = Normalizer.normalize(env.code, env.settings);
    		} else {
    			// Preserve markup for keep-markup plugin
    			var html = before + env.element.innerHTML + after;
    			env.element.innerHTML = Normalizer.normalize(html, env.settings);
    			env.code = env.element.textContent;
    		}
    	});

    }());
    }(prismNormalizeWhitespace));

    /* docs/Prism.svelte generated by Svelte v3.38.3 */
    const file$2 = "docs/Prism.svelte";

    function create_fragment$2(ctx) {
    	let code0;
    	let t;
    	let pre;
    	let code1;
    	let code1_class_value;
    	let pre_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	let pre_levels = [
    		{
    			class: pre_class_value = "" + (/*prismClasses*/ ctx[5] + " " + /*classes*/ ctx[1])
    		},
    		/*$$restProps*/ ctx[6]
    	];

    	let pre_data = {};

    	for (let i = 0; i < pre_levels.length; i += 1) {
    		pre_data = assign(pre_data, pre_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			code0 = element("code");
    			if (default_slot) default_slot.c();
    			t = space();
    			pre = element("pre");
    			code1 = element("code");
    			set_style(code0, "display", "none");
    			add_location(code0, file$2, 77, 0, 2259);
    			attr_dev(code1, "class", code1_class_value = "language-" + /*language*/ ctx[0]);
    			add_location(code1, file$2, 81, 2, 2406);
    			set_attributes(pre, pre_data);
    			add_location(pre, file$2, 80, 0, 2330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code0, anchor);

    			if (default_slot) {
    				default_slot.m(code0, null);
    			}

    			/*code0_binding*/ ctx[13](code0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code1);
    			code1.innerHTML = /*formattedCode*/ ctx[4];
    			/*pre_binding*/ ctx[14](pre);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], !current ? -1 : dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*formattedCode*/ 16) code1.innerHTML = /*formattedCode*/ ctx[4];
    			if (!current || dirty & /*language*/ 1 && code1_class_value !== (code1_class_value = "language-" + /*language*/ ctx[0])) {
    				attr_dev(code1, "class", code1_class_value);
    			}

    			set_attributes(pre, pre_data = get_spread_update(pre_levels, [
    				(!current || dirty & /*prismClasses, classes*/ 34 && pre_class_value !== (pre_class_value = "" + (/*prismClasses*/ ctx[5] + " " + /*classes*/ ctx[1]))) && { class: pre_class_value },
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]
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
    			if (detaching) detach_dev(code0);
    			if (default_slot) default_slot.d(detaching);
    			/*code0_binding*/ ctx[13](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(pre);
    			/*pre_binding*/ ctx[14](null);
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
    	let prismClasses;

    	const omit_props_names = [
    		"code","language","showLineNumbers","normalizeWhiteSpace","normalizeWhiteSpaceConfig","classes"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Prism", slots, ['default']);
    	let { code = "" } = $$props;
    	let { language = "javascript" } = $$props;
    	let { showLineNumbers = false } = $$props;
    	let { normalizeWhiteSpace = true } = $$props;

    	let { normalizeWhiteSpaceConfig = {
    		"remove-trailing": true,
    		"remove-indent": true,
    		"left-trim": true,
    		"right-trim": true
    	} } = $$props;

    	let { classes = "" } = $$props;

    	// This is the fake coding element
    	let fakeCodeEl;

    	// This is pre Element
    	let preEl;

    	// This stored the formatted HTML to display
    	let formattedCode = "";

    	onMount(() => {
    		if (normalizeWhiteSpace) {
    			/* eslint no-undef: 'warn' */
    			Prism.plugins.NormalizeWhitespace.setDefaults(normalizeWhiteSpaceConfig);
    		}
    	});

    	afterUpdate(async node => {
    		// code variable if they are using a prop
    		// Have to use innerText because innerHTML will create weird escape characaters
    		if (fakeCodeEl && fakeCodeEl.innerText !== "") {
    			$$invalidate(7, code = fakeCodeEl.innerText);
    		}

    		// We need to wait till everything been rendered before we can
    		// call highlightAll and load all the plugins
    		await tick();

    		// This will make sure all the plugins are loaded
    		// Prism.highlight will not do that
    		Prism.highlightAllUnder(preEl);
    	});

    	function code0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			fakeCodeEl = $$value;
    			$$invalidate(2, fakeCodeEl);
    		});
    	}

    	function pre_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			preEl = $$value;
    			$$invalidate(3, preEl);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("code" in $$new_props) $$invalidate(7, code = $$new_props.code);
    		if ("language" in $$new_props) $$invalidate(0, language = $$new_props.language);
    		if ("showLineNumbers" in $$new_props) $$invalidate(8, showLineNumbers = $$new_props.showLineNumbers);
    		if ("normalizeWhiteSpace" in $$new_props) $$invalidate(9, normalizeWhiteSpace = $$new_props.normalizeWhiteSpace);
    		if ("normalizeWhiteSpaceConfig" in $$new_props) $$invalidate(10, normalizeWhiteSpaceConfig = $$new_props.normalizeWhiteSpaceConfig);
    		if ("classes" in $$new_props) $$invalidate(1, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		tick,
    		onMount,
    		code,
    		language,
    		showLineNumbers,
    		normalizeWhiteSpace,
    		normalizeWhiteSpaceConfig,
    		classes,
    		fakeCodeEl,
    		preEl,
    		formattedCode,
    		prismClasses
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("code" in $$props) $$invalidate(7, code = $$new_props.code);
    		if ("language" in $$props) $$invalidate(0, language = $$new_props.language);
    		if ("showLineNumbers" in $$props) $$invalidate(8, showLineNumbers = $$new_props.showLineNumbers);
    		if ("normalizeWhiteSpace" in $$props) $$invalidate(9, normalizeWhiteSpace = $$new_props.normalizeWhiteSpace);
    		if ("normalizeWhiteSpaceConfig" in $$props) $$invalidate(10, normalizeWhiteSpaceConfig = $$new_props.normalizeWhiteSpaceConfig);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("fakeCodeEl" in $$props) $$invalidate(2, fakeCodeEl = $$new_props.fakeCodeEl);
    		if ("preEl" in $$props) $$invalidate(3, preEl = $$new_props.preEl);
    		if ("formattedCode" in $$props) $$invalidate(4, formattedCode = $$new_props.formattedCode);
    		if ("prismClasses" in $$props) $$invalidate(5, prismClasses = $$new_props.prismClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*language, showLineNumbers, normalizeWhiteSpace*/ 769) {
    			// creates the prism classes
    			$$invalidate(5, prismClasses = `language-${language} ${showLineNumbers ? "line-numbers" : ""} ${normalizeWhiteSpace === true
			? ""
			: "no-whitespace-normalization"}`);
    		}

    		if ($$self.$$.dirty & /*code, language*/ 129) {
    			// Only run if Prism is defined and we code
    			if (typeof Prism !== "undefined" && code) {
    				$$invalidate(4, formattedCode = Prism.highlight(code, Prism.languages[language], language));
    			}
    		}
    	};

    	return [
    		language,
    		classes,
    		fakeCodeEl,
    		preEl,
    		formattedCode,
    		prismClasses,
    		$$restProps,
    		code,
    		showLineNumbers,
    		normalizeWhiteSpace,
    		normalizeWhiteSpaceConfig,
    		$$scope,
    		slots,
    		code0_binding,
    		pre_binding
    	];
    }

    class Prism_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			code: 7,
    			language: 0,
    			showLineNumbers: 8,
    			normalizeWhiteSpace: 9,
    			normalizeWhiteSpaceConfig: 10,
    			classes: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prism_1",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get code() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get language() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set language(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLineNumbers() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLineNumbers(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get normalizeWhiteSpace() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set normalizeWhiteSpace(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get normalizeWhiteSpaceConfig() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set normalizeWhiteSpaceConfig(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* docs/Dummy.svelte generated by Svelte v3.38.3 */

    const file$1 = "docs/Dummy.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("I am a Dummy.svelte component with property foo=");
    			t1 = text(/*foo*/ ctx[0]);
    			add_location(span, file$1, 3, 0, 38);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*foo*/ 1) set_data_dev(t1, /*foo*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
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
    	validate_slots("Dummy", slots, []);
    	let { foo } = $$props;
    	const writable_props = ["foo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dummy> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("foo" in $$props) $$invalidate(0, foo = $$props.foo);
    	};

    	$$self.$capture_state = () => ({ foo });

    	$$self.$inject_state = $$props => {
    		if ("foo" in $$props) $$invalidate(0, foo = $$props.foo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [foo];
    }

    class Dummy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { foo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dummy",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*foo*/ ctx[0] === undefined && !("foo" in props)) {
    			console.warn("<Dummy> was created without expected prop 'foo'");
    		}
    	}

    	get foo() {
    		throw new Error("<Dummy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set foo(value) {
    		throw new Error("<Dummy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var camelcase = {exports: {}};

    const preserveCamelCase = (string, locale) => {
    	let isLastCharLower = false;
    	let isLastCharUpper = false;
    	let isLastLastCharUpper = false;

    	for (let i = 0; i < string.length; i++) {
    		const character = string[i];

    		if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
    			string = string.slice(0, i) + '-' + string.slice(i);
    			isLastCharLower = false;
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = true;
    			i++;
    		} else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
    			string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = false;
    			isLastCharLower = true;
    		} else {
    			isLastCharLower = character.toLocaleLowerCase(locale) === character && character.toLocaleUpperCase(locale) !== character;
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = character.toLocaleUpperCase(locale) === character && character.toLocaleLowerCase(locale) !== character;
    		}
    	}

    	return string;
    };

    const preserveConsecutiveUppercase = input => {
    	return input.replace(/^[\p{Lu}](?![\p{Lu}])/gu, m1 => m1.toLowerCase());
    };

    const postProcess = (input, options) => {
    	return input.replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toLocaleUpperCase(options.locale))
    		.replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toLocaleUpperCase(options.locale));
    };

    const camelCase = (input, options) => {
    	if (!(typeof input === 'string' || Array.isArray(input))) {
    		throw new TypeError('Expected the input to be `string | string[]`');
    	}

    	options = {
    		pascalCase: false,
    		preserveConsecutiveUppercase: false,
    		...options
    	};

    	if (Array.isArray(input)) {
    		input = input.map(x => x.trim())
    			.filter(x => x.length)
    			.join('-');
    	} else {
    		input = input.trim();
    	}

    	if (input.length === 0) {
    		return '';
    	}

    	if (input.length === 1) {
    		return options.pascalCase ? input.toLocaleUpperCase(options.locale) : input.toLocaleLowerCase(options.locale);
    	}

    	const hasUpperCase = input !== input.toLocaleLowerCase(options.locale);

    	if (hasUpperCase) {
    		input = preserveCamelCase(input, options.locale);
    	}

    	input = input.replace(/^[_.\- ]+/, '');

    	if (options.preserveConsecutiveUppercase) {
    		input = preserveConsecutiveUppercase(input);
    	} else {
    		input = input.toLocaleLowerCase();
    	}

    	if (options.pascalCase) {
    		input = input.charAt(0).toLocaleUpperCase(options.locale) + input.slice(1);
    	}

    	return postProcess(input, options);
    };

    camelcase.exports = camelCase;
    // TODO: Remove this for the next major release
    camelcase.exports.default = camelCase;

    var camelCase$1 = camelcase.exports;

    /* docs/App.svelte generated by Svelte v3.38.3 */
    const file = "docs/App.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-eidnco-style";
    	style.textContent = ".colors.svelte-eidnco{--toastBackground:rgba(255,255,255,0.95);--toastColor:#424242;--toastProgressBackground:aquamarine}.bottom.svelte-eidnco{--toastContainerTop:auto;--toastContainerRight:auto;--toastContainerBottom:8rem;--toastContainerLeft:calc(50vw - 8rem)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuaW1wb3J0IHsgdGljayB9IGZyb20gJ3N2ZWx0ZSdcbmltcG9ydCB7IFN2ZWx0ZVRvYXN0LCB0b2FzdCB9IGZyb20gJy4uL3NyYydcbmltcG9ydCBQcmlzbSBmcm9tICcuL1ByaXNtLnN2ZWx0ZSdcbmltcG9ydCBEdW1teUNvbXBvbmVudCBmcm9tICcuL0R1bW15LnN2ZWx0ZSdcbmltcG9ydCBjYW1lbENhc2UgZnJvbSAnY2FtZWxjYXNlJ1xuXG4vLyBIb2lzdCB0byBgd2luZG93YCBmb3IgZGVidWdcbndpbmRvdy50b2FzdCA9IHRvYXN0XG5cbmxldCBzZWxlY3RlZFxubGV0IGNvZGUgPSAnLy8gVGFwIGEgYnV0dG9uIGJlbG93J1xubGV0IGNvbG9ycyA9IGZhbHNlXG5sZXQgYm90dG9tID0gZmFsc2VcbmxldCBvcHRpb25zID0ge31cblxuY29uc3QgaGFuZGxlQ2xpY2sgPSBidG4gPT4ge1xuICBzZWxlY3RlZCA9IGJ0bi5uYW1lXG4gIGNvZGUgPSBidG4uY29kZVxuICBidG4ucnVuKClcbiAgZ3RhZygnZXZlbnQnLCAndG9hc3QnLCB7IGV2ZW50X2xhYmVsOiBidG4ubmFtZSB9KVxufVxuXG5jb25zdCBidXR0b25zID0gW1xuICB7XG4gICAgbmFtZTogJ0RFRkFVTFQnLFxuICAgIGNvZGU6IGB0b2FzdC5wdXNoKCdIZWxsbyB3b3JsZCEnKWAsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcXVvdGVzXG4gICAgcnVuOiAoKSA9PiB7XG4gICAgICB0b2FzdC5wdXNoKCdIZWxsbyB3b3JsZCEnKVxuICAgIH1cbiAgfSxcbiAge1xuICAgIG5hbWU6ICdHUkVFTicsXG4gICAgY29kZTogYHRvYXN0LnB1c2goJ1N1Y2Nlc3MhJywge1xuICB0aGVtZToge1xuICAgICctLXRvYXN0QmFja2dyb3VuZCc6ICcjNDhCQjc4JyxcbiAgICAnLS10b2FzdFByb2dyZXNzQmFja2dyb3VuZCc6ICcjMkY4NTVBJ1xuICB9XG59KWAsXG4gICAgcnVuOiAoKSA9PiB7XG4gICAgICB0b2FzdC5wdXNoKCdTdWNjZXNzIScsIHsgdGhlbWU6IHsgJy0tdG9hc3RCYWNrZ3JvdW5kJzogJyM0OEJCNzgnLCAnLS10b2FzdFByb2dyZXNzQmFja2dyb3VuZCc6ICcjMkY4NTVBJyB9IH0pXG4gICAgfVxuICB9LFxuICB7XG4gICAgbmFtZTogJ1JFRCcsXG4gICAgY29kZTogYHRvYXN0LnB1c2goJ0RhbmdlciEnLCB7XG4gIHRoZW1lOiB7XG4gICAgJy0tdG9hc3RCYWNrZ3JvdW5kJzogJyNGNTY1NjUnLFxuICAgICctLXRvYXN0UHJvZ3Jlc3NCYWNrZ3JvdW5kJzogJyNDNTMwMzAnXG4gIH1cbn0pYCxcbiAgICBydW46ICgpID0+IHtcbiAgICAgIHRvYXN0LnB1c2goJ0RhbmdlciEnLCB7IHRoZW1lOiB7ICctLXRvYXN0QmFja2dyb3VuZCc6ICcjRjU2NTY1JywgJy0tdG9hc3RQcm9ncmVzc0JhY2tncm91bmQnOiAnI0M1MzAzMCcgfSB9KVxuICAgIH1cbiAgfSxcbiAge1xuICAgIG5hbWU6ICdSSUNIIEhUTUwnLFxuICAgIGNvZGU6IGB0b2FzdC5wdXNoKFxcYDxzdHJvbmc+WW91IHdvbiB0aGUgamFja3BvdCE8L3N0cm9uZz48YnI+XG4gIENsaWNrIDxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+aGVyZTwvYT4gZm9yIGRldGFpbHMhIPCfmJtcXGApYCxcbiAgICBydW46ICgpID0+IHtcbiAgICAgIHRvYXN0LnB1c2goJzxzdHJvbmc+WW91IHdvbiB0aGUgamFja3BvdCE8L3N0cm9uZz48YnI+Q2xpY2sgPGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj5oZXJlPC9hPiBmb3IgZGV0YWlscyEg8J+YmycpXG4gICAgfVxuICB9LFxuICB7XG4gICAgbmFtZTogJ0xPTkcgRFVSQVRJT04nLFxuICAgIGNvZGU6IGB0b2FzdC5wdXNoKCdXYXRjaGluZyB0aGUgcGFpbnQgZHJ5Li4uJywgeyBkdXJhdGlvbjogMjAwMDAgfSlgLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHF1b3Rlc1xuICAgIHJ1bjogKCkgPT4ge1xuICAgICAgdG9hc3QucHVzaCgnV2F0Y2hpbmcgdGhlIHBhaW50IGRyeS4uLicsIHsgZHVyYXRpb246IDIwMDAwIH0pXG4gICAgfVxuICB9LFxuICB7XG4gICAgbmFtZTogJ05PTi1ESVNNSVNTQUJMRScsXG4gICAgY29kZTogYHRvYXN0LnB1c2goJ1doZXJlIHRoZSBjbG9zZSBidG4/IT8nLCB7XG4gIGluaXRpYWw6IDAsXG4gIHByb2dyZXNzOiAwLFxuICBkaXNtaXNzYWJsZTogZmFsc2Vcbn0pYCxcbiAgICBydW46ICgpID0+IHtcbiAgICAgIHRvYXN0LnB1c2goJ1doZXJlIHRoZSBjbG9zZSBidG4/IT8nLCB7IGluaXRpYWw6IDAsIHByb2dyZXNzOiAwLCBkaXNtaXNzYWJsZTogZmFsc2UgfSlcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUkVNT1ZFIExBU1QgVE9BU1QnLFxuICAgIGNvZGU6IGAvLyBSZW1vdmUgdGhlIGxhdGVzdCB0b2FzdFxudG9hc3QucG9wKClcblxuLy8gT3IgcmVtb3ZlIGEgcGFydGljdWxhciBvbmVcbmNvbnN0IGlkID0gdG9hc3QucHVzaCgnWW8hJylcbnRvYXN0LnBvcChpZClgLFxuICAgIHJ1bjogKCkgPT4ge1xuICAgICAgdG9hc3QucG9wKClcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRkxJUCBQUk9HUkVTUyBCQVInLFxuICAgIGNvZGU6IGB0b2FzdC5wdXNoKCdQcm9ncmVzcyBiYXIgaXMgZmxpcHBlZCcsIHtcbiAgaW5pdGlhbDogMCxcbiAgcHJvZ3Jlc3M6IDFcbn0pYCxcbiAgICBydW46ICgpID0+IHtcbiAgICAgIHRvYXN0LnB1c2goJ1Byb2dyZXNzIGJhciBpcyBmbGlwcGVkJywgeyBpbml0aWFsOiAwLCBwcm9ncmVzczogMSB9KVxuICAgIH1cbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVU0UgQVMgTE9BRElORyBJTkRJQ0FUT1InLFxuICAgIGNvZGU6IGBjb25zdCBzbGVlcCA9IHQgPT4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHQpKVxuXG5jb25zdCBpZCA9IHRvYXN0LnB1c2goJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJywge1xuICBkdXJhdGlvbjogMzAwLFxuICBpbml0aWFsOiAwLFxuICBwcm9ncmVzczogMCxcbiAgZGlzbWlzc2FibGU6IGZhbHNlXG59KVxuXG5hd2FpdCBzbGVlcCg1MDApXG50b2FzdC5zZXQoaWQsIHsgcHJvZ3Jlc3M6IDAuMSB9KVxuXG5hd2FpdCBzbGVlcCgzMDAwKVxudG9hc3Quc2V0KGlkLCB7IHByb2dyZXNzOiAwLjcgfSlcblxuYXdhaXQgc2xlZXAoMTAwMClcbnRvYXN0LnNldChpZCwgeyBtc2c6ICdKdXN0IGEgYml0IG1vcmUnLCBwcm9ncmVzczogMC44IH0pXG5cbmF3YWl0IHNsZWVwKDIwMDApXG50b2FzdC5zZXQoaWQsIHsgcHJvZ3Jlc3M6IDEgfSlgLFxuICAgIHJ1bjogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2xlZXAgPSB0ID0+IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0KSlcbiAgICAgIGNvbnN0IGlkID0gdG9hc3QucHVzaCgnTG9hZGluZywgcGxlYXNlIHdhaXQuLi4nLCB7IGR1cmF0aW9uOiAzMDAsIGluaXRpYWw6IDAsIHByb2dyZXNzOiAwLCBkaXNtaXNzYWJsZTogZmFsc2UgfSlcbiAgICAgIGF3YWl0IHNsZWVwKDUwMClcbiAgICAgIHRvYXN0LnNldChpZCwgeyBwcm9ncmVzczogMC4xIH0pXG4gICAgICBhd2FpdCBzbGVlcCgzMDAwKVxuICAgICAgdG9hc3Quc2V0KGlkLCB7IHByb2dyZXNzOiAwLjcgfSlcbiAgICAgIGF3YWl0IHNsZWVwKDEwMDApXG4gICAgICB0b2FzdC5zZXQoaWQsIHsgbXNnOiAnSnVzdCBhIGJpdCBtb3JlJywgcHJvZ3Jlc3M6IDAuOCB9KVxuICAgICAgYXdhaXQgc2xlZXAoMjAwMClcbiAgICAgIHRvYXN0LnNldChpZCwgeyBwcm9ncmVzczogMSB9KVxuICAgIH1cbiAgfSxcbiAge1xuICAgIG5hbWU6ICdDSEFOR0UgREVGQVVMVCBDT0xPUlMnLFxuICAgIGNvZGU6IGA8c3R5bGU+XG4gIDpyb290IHtcbiAgICAtLXRvYXN0QmFja2dyb3VuZDogcmdiYSgyNTUsMjU1LDI1NSwwLjk1KTtcbiAgICAtLXRvYXN0Q29sb3I6ICM0MjQyNDI7XG4gICAgLS10b2FzdFByb2dyZXNzQmFja2dyb3VuZDogYXF1YW1hcmluZTtcbiAgfVxuPC9zdHlsZT5cbjxzY3JpcHQ+XG4gIHRvYXN0LnB1c2goJ0NoYW5nZWQgc29tZSBjb2xvcnMnKVxuPFxcL3NjcmlwdD5gLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4gICAgcnVuOiAoKSA9PiB7XG4gICAgICBjb2xvcnMgPSB0cnVlXG4gICAgICB0b2FzdC5wdXNoKCdDaGFuZ2VkIHNvbWUgY29sb3JzJylcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUE9TSVRJT04gVE8gQk9UVE9NJyxcbiAgICBjb2RlOiBgPHN0eWxlPlxuOnJvb3Qge1xuICAtLXRvYXN0Q29udGFpbmVyVG9wOiBhdXRvO1xuICAtLXRvYXN0Q29udGFpbmVyUmlnaHQ6IGF1dG87XG4gIC0tdG9hc3RDb250YWluZXJCb3R0b206IDhyZW07XG4gIC0tdG9hc3RDb250YWluZXJMZWZ0OiBjYWxjKDUwdncgLSA4cmVtKTtcbn1cbjwvc3R5bGU+XG5cbjxTdmVsdGVUb2FzdCBvcHRpb25zPXt7IHJldmVyc2VkOiB0cnVlLCBpbnRybzogeyB5OiAxOTIgfSB9fSAvPlxuXG48c2NyaXB0PlxuICB0b2FzdC5wdXNoKCdCb3R0b21zIHVwIScpXG48XFwvc2NyaXB0PmAsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbiAgICBydW46IGFzeW5jICgpID0+IHtcbiAgICAgIGJvdHRvbSA9IHRydWVcbiAgICAgIG9wdGlvbnMgPSB7IHJldmVyc2VkOiB0cnVlLCBpbnRybzogeyB5OiAxMjggfSB9XG4gICAgICBhd2FpdCB0aWNrKClcbiAgICAgIHRvYXN0LnB1c2goJ0JvdHRvbXMgdXAhJylcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVVNFIENPTVBPTkVOVCcsXG4gICAgY29kZTogYFxuICAgIHRvYXN0LnB1c2goRHVtbXlDb21wb25lbnQsIHt9LCB7Zm9vOiBcImJhclwifSlgLFxuICAgIHJ1bjogYXN5bmMgKCkgPT4ge1xuICAgICAgdG9hc3QucHVzaChEdW1teUNvbXBvbmVudCwge30sIHsgZm9vOiAnYmFyJyB9KVxuICAgIH1cbiAgfSxcbiAge1xuICAgIG5hbWU6ICdSRVNUT1JFIERFRkFVTFRTJyxcbiAgICBjb2RlOiAnLy8gQWxsIGRlZmF1bHQgc2V0dGluZ3MgcmVzdG9yZWQhJyxcbiAgICBydW46IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbG9ycyA9IGZhbHNlXG4gICAgICBib3R0b20gPSBmYWxzZVxuICAgICAgb3B0aW9ucyA9IHsgcmV2ZXJzZWQ6IGZhbHNlLCBpbnRybzogeyB4OiAyNTYgfSB9XG4gICAgICBhd2FpdCB0aWNrKClcbiAgICAgIHRvYXN0LnB1c2goJ0FsbCB0aGVtZXMgcmVzZXQhJylcbiAgICB9XG4gIH1cbl1cblxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbi5jb2xvcnMge1xuICAtLXRvYXN0QmFja2dyb3VuZDogcmdiYSgyNTUsMjU1LDI1NSwwLjk1KTtcbiAgLS10b2FzdENvbG9yOiAjNDI0MjQyO1xuICAtLXRvYXN0UHJvZ3Jlc3NCYWNrZ3JvdW5kOiBhcXVhbWFyaW5lO1xufVxuLmJvdHRvbSB7XG4gIC0tdG9hc3RDb250YWluZXJUb3A6IGF1dG87XG4gIC0tdG9hc3RDb250YWluZXJSaWdodDogYXV0bztcbiAgLS10b2FzdENvbnRhaW5lckJvdHRvbTogOHJlbTtcbiAgLS10b2FzdENvbnRhaW5lckxlZnQ6IGNhbGMoNTB2dyAtIDhyZW0pO1xufVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICA8ZGl2IGNsYXNzPVwidy1mdWxsIGgtNjQgcHgtMiBtdC00IG1iLThcIj5cbiAgICA8UHJpc20gY2xhc3Nlcz1cInctZnVsbCBoLWZ1bGwgYmctZ3JheS03MDAgdGV4dC1ncmF5LTIwMCBmb250LW1vbm8gc2hhZG93IHJvdW5kZWQtc20gb3ZlcmZsb3ctc2Nyb2xsIHAtNFwiPlxuICAgICAge2NvZGV9XG4gICAgPC9QcmlzbT5cbiAgPC9kaXY+XG5cbiAgPGRpdiBjbGFzcz1cImZsZXggZmxleC1yb3cgZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuXG4gICAgeyNlYWNoIGJ1dHRvbnMgYXMgYnRufVxuICAgIDxidXR0b25cbiAgICAgIGNsYXNzOnNlbGVjdGVkPXtzZWxlY3RlZCA9PT0gYnRuLm5hbWV9XG4gICAgICBvbjpjbGljaz17KCkgPT4geyBoYW5kbGVDbGljayhidG4pIH19XG4gICAgICBkYXRhLWJ0bj17Y2FtZWxDYXNlKGJ0bi5uYW1lKX1cbiAgICA+e2J0bi5uYW1lfTwvYnV0dG9uPlxuICAgIHsvZWFjaH1cblxuICA8L2Rpdj5cbjwvZGl2PlxuXG48ZGl2IGNsYXNzOmNvbG9ycyBjbGFzczpib3R0b20+XG4gIDxTdmVsdGVUb2FzdCB7b3B0aW9uc30gLz5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBNQSxPQUFPLGNBQUMsQ0FBQyxBQUNQLGlCQUFpQixDQUFFLHNCQUFzQixDQUN6QyxZQUFZLENBQUUsT0FBTyxDQUNyQix5QkFBeUIsQ0FBRSxVQUFVLEFBQ3ZDLENBQUMsQUFDRCxPQUFPLGNBQUMsQ0FBQyxBQUNQLG1CQUFtQixDQUFFLElBQUksQ0FDekIscUJBQXFCLENBQUUsSUFBSSxDQUMzQixzQkFBc0IsQ0FBRSxJQUFJLENBQzVCLG9CQUFvQixDQUFFLGlCQUFpQixBQUN6QyxDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (218:4) <Prism classes="w-full h-full bg-gray-700 text-gray-200 font-mono shadow rounded-sm overflow-scroll p-4">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*code*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*code*/ 2) set_data_dev(t, /*code*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(218:4) <Prism classes=\\\"w-full h-full bg-gray-700 text-gray-200 font-mono shadow rounded-sm overflow-scroll p-4\\\">",
    		ctx
    	});

    	return block;
    }

    // (225:4) {#each buttons as btn}
    function create_each_block(ctx) {
    	let button;
    	let t_value = /*btn*/ ctx[8].name + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*btn*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "data-btn", camelCase$1(/*btn*/ ctx[8].name));
    			toggle_class(button, "selected", /*selected*/ ctx[0] === /*btn*/ ctx[8].name);
    			add_location(button, file, 225, 4, 5430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selected, buttons*/ 65) {
    				toggle_class(button, "selected", /*selected*/ ctx[0] === /*btn*/ ctx[8].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(225:4) {#each buttons as btn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let prism;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let sveltetoast;
    	let current;

    	prism = new Prism_1({
    			props: {
    				classes: "w-full h-full bg-gray-700 text-gray-200 font-mono shadow rounded-sm overflow-scroll p-4",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*buttons*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	sveltetoast = new SvelteToast({
    			props: { options: /*options*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(prism.$$.fragment);
    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			create_component(sveltetoast.$$.fragment);
    			attr_dev(div0, "class", "w-full h-64 px-2 mt-4 mb-8");
    			add_location(div0, file, 216, 2, 5143);
    			attr_dev(div1, "class", "flex flex-row flex-wrap items-center justify-center");
    			add_location(div1, file, 222, 2, 5332);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file, 215, 0, 5117);
    			attr_dev(div3, "class", "svelte-eidnco");
    			toggle_class(div3, "colors", /*colors*/ ctx[2]);
    			toggle_class(div3, "bottom", /*bottom*/ ctx[3]);
    			add_location(div3, file, 235, 0, 5619);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(prism, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(sveltetoast, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const prism_changes = {};

    			if (dirty & /*$$scope, code*/ 2050) {
    				prism_changes.$$scope = { dirty, ctx };
    			}

    			prism.$set(prism_changes);

    			if (dirty & /*camelCase, buttons, selected, handleClick*/ 97) {
    				each_value = /*buttons*/ ctx[6];
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

    			const sveltetoast_changes = {};
    			if (dirty & /*options*/ 16) sveltetoast_changes.options = /*options*/ ctx[4];
    			sveltetoast.$set(sveltetoast_changes);

    			if (dirty & /*colors*/ 4) {
    				toggle_class(div3, "colors", /*colors*/ ctx[2]);
    			}

    			if (dirty & /*bottom*/ 8) {
    				toggle_class(div3, "bottom", /*bottom*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prism.$$.fragment, local);
    			transition_in(sveltetoast.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prism.$$.fragment, local);
    			transition_out(sveltetoast.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(prism);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(sveltetoast);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	window.toast = toast;
    	let selected;
    	let code = "// Tap a button below";
    	let colors = false;
    	let bottom = false;
    	let options = {};

    	const handleClick = btn => {
    		$$invalidate(0, selected = btn.name);
    		$$invalidate(1, code = btn.code);
    		btn.run();
    		gtag("event", "toast", { event_label: btn.name });
    	};

    	const buttons = [
    		{
    			name: "DEFAULT",
    			code: `toast.push('Hello world!')`, // eslint-disable-line quotes
    			run: () => {
    				toast.push("Hello world!");
    			}
    		},
    		{
    			name: "GREEN",
    			code: `toast.push('Success!', {
  theme: {
    '--toastBackground': '#48BB78',
    '--toastProgressBackground': '#2F855A'
  }
})`,
    			run: () => {
    				toast.push("Success!", {
    					theme: {
    						"--toastBackground": "#48BB78",
    						"--toastProgressBackground": "#2F855A"
    					}
    				});
    			}
    		},
    		{
    			name: "RED",
    			code: `toast.push('Danger!', {
  theme: {
    '--toastBackground': '#F56565',
    '--toastProgressBackground': '#C53030'
  }
})`,
    			run: () => {
    				toast.push("Danger!", {
    					theme: {
    						"--toastBackground": "#F56565",
    						"--toastProgressBackground": "#C53030"
    					}
    				});
    			}
    		},
    		{
    			name: "RICH HTML",
    			code: `toast.push(\`<strong>You won the jackpot!</strong><br>
  Click <a href="#" target="_blank">here</a> for details! 😛\`)`,
    			run: () => {
    				toast.push("<strong>You won the jackpot!</strong><br>Click <a href=\"#\" target=\"_blank\">here</a> for details! 😛");
    			}
    		},
    		{
    			name: "LONG DURATION",
    			code: `toast.push('Watching the paint dry...', { duration: 20000 })`, // eslint-disable-line quotes
    			run: () => {
    				toast.push("Watching the paint dry...", { duration: 20000 });
    			}
    		},
    		{
    			name: "NON-DISMISSABLE",
    			code: `toast.push('Where the close btn?!?', {
  initial: 0,
  progress: 0,
  dismissable: false
})`,
    			run: () => {
    				toast.push("Where the close btn?!?", {
    					initial: 0,
    					progress: 0,
    					dismissable: false
    				});
    			}
    		},
    		{
    			name: "REMOVE LAST TOAST",
    			code: `// Remove the latest toast
toast.pop()

// Or remove a particular one
const id = toast.push('Yo!')
toast.pop(id)`,
    			run: () => {
    				toast.pop();
    			}
    		},
    		{
    			name: "FLIP PROGRESS BAR",
    			code: `toast.push('Progress bar is flipped', {
  initial: 0,
  progress: 1
})`,
    			run: () => {
    				toast.push("Progress bar is flipped", { initial: 0, progress: 1 });
    			}
    		},
    		{
    			name: "USE AS LOADING INDICATOR",
    			code: `const sleep = t => new Promise(resolve => setTimeout(resolve, t))

const id = toast.push('Loading, please wait...', {
  duration: 300,
  initial: 0,
  progress: 0,
  dismissable: false
})

await sleep(500)
toast.set(id, { progress: 0.1 })

await sleep(3000)
toast.set(id, { progress: 0.7 })

await sleep(1000)
toast.set(id, { msg: 'Just a bit more', progress: 0.8 })

await sleep(2000)
toast.set(id, { progress: 1 })`,
    			run: async () => {
    				const sleep = t => new Promise(resolve => setTimeout(resolve, t));

    				const id = toast.push("Loading, please wait...", {
    					duration: 300,
    					initial: 0,
    					progress: 0,
    					dismissable: false
    				});

    				await sleep(500);
    				toast.set(id, { progress: 0.1 });
    				await sleep(3000);
    				toast.set(id, { progress: 0.7 });
    				await sleep(1000);
    				toast.set(id, { msg: "Just a bit more", progress: 0.8 });
    				await sleep(2000);
    				toast.set(id, { progress: 1 });
    			}
    		},
    		{
    			name: "CHANGE DEFAULT COLORS",
    			code: `<style>
  :root {
    --toastBackground: rgba(255,255,255,0.95);
    --toastColor: #424242;
    --toastProgressBackground: aquamarine;
  }
</style>
<script>
  toast.push('Changed some colors')
<\/script>`, // eslint-disable-line no-useless-escape
    			run: () => {
    				$$invalidate(2, colors = true);
    				toast.push("Changed some colors");
    			}
    		},
    		{
    			name: "POSITION TO BOTTOM",
    			code: `<style>
:root {
  --toastContainerTop: auto;
  --toastContainerRight: auto;
  --toastContainerBottom: 8rem;
  --toastContainerLeft: calc(50vw - 8rem);
}
</style>

<SvelteToast options={{ reversed: true, intro: { y: 192 } }} />

<script>
  toast.push('Bottoms up!')
<\/script>`, // eslint-disable-line no-useless-escape
    			run: async () => {
    				$$invalidate(3, bottom = true);
    				$$invalidate(4, options = { reversed: true, intro: { y: 128 } });
    				await tick();
    				toast.push("Bottoms up!");
    			}
    		},
    		{
    			name: "USE COMPONENT",
    			code: `
    toast.push(DummyComponent, {}, {foo: "bar"})`,
    			run: async () => {
    				toast.push(Dummy, {}, { foo: "bar" });
    			}
    		},
    		{
    			name: "RESTORE DEFAULTS",
    			code: "// All default settings restored!",
    			run: async () => {
    				$$invalidate(2, colors = false);
    				$$invalidate(3, bottom = false);
    				$$invalidate(4, options = { reversed: false, intro: { x: 256 } });
    				await tick();
    				toast.push("All themes reset!");
    			}
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = btn => {
    		handleClick(btn);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		SvelteToast,
    		toast,
    		Prism: Prism_1,
    		DummyComponent: Dummy,
    		camelCase: camelCase$1,
    		selected,
    		code,
    		colors,
    		bottom,
    		options,
    		handleClick,
    		buttons
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("code" in $$props) $$invalidate(1, code = $$props.code);
    		if ("colors" in $$props) $$invalidate(2, colors = $$props.colors);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("options" in $$props) $$invalidate(4, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, code, colors, bottom, options, handleClick, buttons, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-eidnco-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
