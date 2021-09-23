
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function not_equal(a, b) {
        return a != a ? b == b : a !== b;
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
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.6' }, detail), true));
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

    /* src/Components/Button.svelte generated by Svelte v3.42.6 */

    const file$7 = "src/Components/Button.svelte";

    function create_fragment$9(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*caption*/ ctx[0]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*mode*/ ctx[1]) + " svelte-18k7uvz"));
    			add_location(button, file$7, 5, 0, 65);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*caption*/ 1) set_data_dev(t, /*caption*/ ctx[0]);

    			if (dirty & /*mode*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*mode*/ ctx[1]) + " svelte-18k7uvz"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
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
    	validate_slots('Button', slots, []);
    	let { caption } = $$props;
    	let { mode } = $$props;
    	const writable_props = ['caption', 'mode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('caption' in $$props) $$invalidate(0, caption = $$props.caption);
    		if ('mode' in $$props) $$invalidate(1, mode = $$props.mode);
    	};

    	$$self.$capture_state = () => ({ caption, mode });

    	$$self.$inject_state = $$props => {
    		if ('caption' in $$props) $$invalidate(0, caption = $$props.caption);
    		if ('mode' in $$props) $$invalidate(1, mode = $$props.mode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [caption, mode, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { caption: 0, mode: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*caption*/ ctx[0] === undefined && !('caption' in props)) {
    			console.warn("<Button> was created without expected prop 'caption'");
    		}

    		if (/*mode*/ ctx[1] === undefined && !('mode' in props)) {
    			console.warn("<Button> was created without expected prop 'mode'");
    		}
    	}

    	get caption() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const parseNumber = parseFloat;

    function joinCss(obj, separator = ';') {
      let texts;
      if (Array.isArray(obj)) {
        texts = obj.filter((text) => text);
      } else {
        texts = [];
        for (const prop in obj) {
          if (obj[prop]) {
            texts.push(`${prop}:${obj[prop]}`);
          }
        }
      }
      return texts.join(separator);
    }

    function getStyles(style, size, pull, fw) {
      let float;
      let width;
      const height = '1em';
      let lineHeight;
      let fontSize;
      let textAlign;
      let verticalAlign = '-.125em';
      const overflow = 'visible';

      if (fw) {
        textAlign = 'center';
        width = '1.25em';
      }

      if (pull) {
        float = pull;
      }

      if (size) {
        if (size == 'lg') {
          fontSize = '1.33333em';
          lineHeight = '.75em';
          verticalAlign = '-.225em';
        } else if (size == 'xs') {
          fontSize = '.75em';
        } else if (size == 'sm') {
          fontSize = '.875em';
        } else {
          fontSize = size.replace('x', 'em');
        }
      }

      return joinCss([
        joinCss({
          float,
          width,
          height,
          'line-height': lineHeight,
          'font-size': fontSize,
          'text-align': textAlign,
          'vertical-align': verticalAlign,
          'transform-origin': 'center',
          overflow,
        }),
        style,
      ]);
    }

    function getTransform(
      scale,
      translateX,
      translateY,
      rotate,
      flip,
      translateTimes = 1,
      translateUnit = '',
      rotateUnit = '',
    ) {
      let flipX = 1;
      let flipY = 1;

      if (flip) {
        if (flip == 'horizontal') {
          flipX = -1;
        } else if (flip == 'vertical') {
          flipY = -1;
        } else {
          flipX = flipY = -1;
        }
      }

      return joinCss(
        [
          `translate(${parseNumber(translateX) * translateTimes}${translateUnit},${parseNumber(translateY) * translateTimes}${translateUnit})`,
          `scale(${flipX * parseNumber(scale)},${flipY * parseNumber(scale)})`,
          rotate && `rotate(${rotate}${rotateUnit})`,
        ],
        ' ',
      );
    }

    /* node_modules/svelte-fa/src/fa.svelte generated by Svelte v3.42.6 */
    const file$6 = "node_modules/svelte-fa/src/fa.svelte";

    // (78:0) {#if i[4]}
    function create_if_block$3(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let g1_transform_value;
    	let g1_transform_origin_value;
    	let svg_class_value;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[7][4] == 'string') return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			add_location(g0, file$6, 91, 6, 1462);
    			attr_dev(g1, "transform", g1_transform_value = `translate(${/*i*/ ctx[7][0] / 2} ${/*i*/ ctx[7][1] / 2})`);
    			attr_dev(g1, "transform-origin", g1_transform_origin_value = `${/*i*/ ctx[7][0] / 4} 0`);
    			add_location(g1, file$6, 87, 4, 1351);
    			attr_dev(svg, "id", /*id*/ ctx[0]);
    			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*c*/ ctx[8]) + " svelte-1cj2gr0"));
    			attr_dev(svg, "style", /*s*/ ctx[9]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = `0 0 ${/*i*/ ctx[7][0]} ${/*i*/ ctx[7][1]}`);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$6, 78, 2, 1188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			if_block.m(g0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 1024) {
    				attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			}

    			if (dirty & /*i*/ 128 && g1_transform_value !== (g1_transform_value = `translate(${/*i*/ ctx[7][0] / 2} ${/*i*/ ctx[7][1] / 2})`)) {
    				attr_dev(g1, "transform", g1_transform_value);
    			}

    			if (dirty & /*i*/ 128 && g1_transform_origin_value !== (g1_transform_origin_value = `${/*i*/ ctx[7][0] / 4} 0`)) {
    				attr_dev(g1, "transform-origin", g1_transform_origin_value);
    			}

    			if (dirty & /*id*/ 1) {
    				attr_dev(svg, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*c*/ 256 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*c*/ ctx[8]) + " svelte-1cj2gr0"))) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*s*/ 512) {
    				attr_dev(svg, "style", /*s*/ ctx[9]);
    			}

    			if (dirty & /*i*/ 128 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*i*/ ctx[7][0]} ${/*i*/ ctx[7][1]}`)) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(78:0) {#if i[4]}",
    		ctx
    	});

    	return block;
    }

    // (99:8) {:else}
    function create_else_block$1(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path0_transform_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;
    	let path1_transform_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = /*i*/ ctx[7][4][0]);
    			attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[3] || /*color*/ ctx[1] || 'currentColor');

    			attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*primaryOpacity*/ ctx[4]
    			: /*secondaryOpacity*/ ctx[5]);

    			attr_dev(path0, "transform", path0_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path0, file$6, 99, 10, 1714);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[7][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[2] || /*color*/ ctx[1] || 'currentColor');

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*secondaryOpacity*/ ctx[5]
    			: /*primaryOpacity*/ ctx[4]);

    			attr_dev(path1, "transform", path1_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path1, file$6, 105, 10, 1975);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 128 && path0_d_value !== (path0_d_value = /*i*/ ctx[7][4][0])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 10 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[3] || /*color*/ ctx[1] || 'currentColor')) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 112 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*primaryOpacity*/ ctx[4]
    			: /*secondaryOpacity*/ ctx[5])) {
    				attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 128 && path0_transform_value !== (path0_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path0, "transform", path0_transform_value);
    			}

    			if (dirty & /*i*/ 128 && path1_d_value !== (path1_d_value = /*i*/ ctx[7][4][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 6 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[2] || /*color*/ ctx[1] || 'currentColor')) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 112 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*secondaryOpacity*/ ctx[5]
    			: /*primaryOpacity*/ ctx[4])) {
    				attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 128 && path1_transform_value !== (path1_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path1, "transform", path1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(99:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:8) {#if typeof i[4] == 'string'}
    function create_if_block_1$1(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;
    	let path_transform_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = /*i*/ ctx[7][4]);
    			attr_dev(path, "fill", path_fill_value = /*color*/ ctx[1] || /*primaryColor*/ ctx[2] || 'currentColor');
    			attr_dev(path, "transform", path_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path, file$6, 93, 10, 1526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 128 && path_d_value !== (path_d_value = /*i*/ ctx[7][4])) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 6 && path_fill_value !== (path_fill_value = /*color*/ ctx[1] || /*primaryColor*/ ctx[2] || 'currentColor')) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*i*/ 128 && path_transform_value !== (path_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path, "transform", path_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(93:8) {#if typeof i[4] == 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[7][4] && create_if_block$3(ctx);

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
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*i*/ ctx[7][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fa', slots, []);
    	let { class: clazz = '' } = $$props;
    	let { id = '' } = $$props;
    	let { style = '' } = $$props;
    	let { icon } = $$props;
    	let { size = '' } = $$props;
    	let { color = '' } = $$props;
    	let { fw = false } = $$props;
    	let { pull = '' } = $$props;
    	let { scale = 1 } = $$props;
    	let { translateX = 0 } = $$props;
    	let { translateY = 0 } = $$props;
    	let { rotate = '' } = $$props;
    	let { flip = false } = $$props;
    	let { spin = false } = $$props;
    	let { pulse = false } = $$props;
    	let { primaryColor = '' } = $$props;
    	let { secondaryColor = '' } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let c;
    	let s;
    	let transform;

    	const writable_props = [
    		'class',
    		'id',
    		'style',
    		'icon',
    		'size',
    		'color',
    		'fw',
    		'pull',
    		'scale',
    		'translateX',
    		'translateY',
    		'rotate',
    		'flip',
    		'spin',
    		'pulse',
    		'primaryColor',
    		'secondaryColor',
    		'primaryOpacity',
    		'secondaryOpacity',
    		'swapOpacity'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fa> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('class' in $$props) $$invalidate(11, clazz = $$props.class);
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('style' in $$props) $$invalidate(12, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(13, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(14, size = $$props.size);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(15, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(16, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(17, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(18, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(19, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(20, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(21, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(22, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(23, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(2, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(3, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(4, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(5, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(6, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$capture_state = () => ({
    		joinCss,
    		getStyles,
    		getTransform,
    		clazz,
    		id,
    		style,
    		icon,
    		size,
    		color,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		c,
    		s,
    		transform
    	});

    	$$self.$inject_state = $$props => {
    		if ('clazz' in $$props) $$invalidate(11, clazz = $$props.clazz);
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('style' in $$props) $$invalidate(12, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(13, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(14, size = $$props.size);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(15, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(16, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(17, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(18, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(19, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(20, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(21, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(22, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(23, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(2, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(3, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(4, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(5, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(6, swapOpacity = $$props.swapOpacity);
    		if ('i' in $$props) $$invalidate(7, i = $$props.i);
    		if ('c' in $$props) $$invalidate(8, c = $$props.c);
    		if ('s' in $$props) $$invalidate(9, s = $$props.s);
    		if ('transform' in $$props) $$invalidate(10, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8192) {
    			$$invalidate(7, i = icon && icon.icon || [0, 0, '', [], '']);
    		}

    		if ($$self.$$.dirty & /*clazz, spin, pulse*/ 12584960) {
    			$$invalidate(8, c = joinCss([clazz, 'fa', spin && 'spin', pulse && 'pulse'], ' '));
    		}

    		if ($$self.$$.dirty & /*style, size, pull, fw*/ 118784) {
    			$$invalidate(9, s = getStyles(style, size, pull, fw));
    		}

    		if ($$self.$$.dirty & /*scale, translateX, translateY, rotate, flip*/ 4063232) {
    			$$invalidate(10, transform = getTransform(scale, translateX, translateY, rotate, flip, 512));
    		}
    	};

    	return [
    		id,
    		color,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		c,
    		s,
    		transform,
    		clazz,
    		style,
    		icon,
    		size,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse
    	];
    }

    class Fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			class: 11,
    			id: 0,
    			style: 12,
    			icon: 13,
    			size: 14,
    			color: 1,
    			fw: 15,
    			pull: 16,
    			scale: 17,
    			translateX: 18,
    			translateY: 19,
    			rotate: 20,
    			flip: 21,
    			spin: 22,
    			pulse: 23,
    			primaryColor: 2,
    			secondaryColor: 3,
    			primaryOpacity: 4,
    			secondaryOpacity: 5,
    			swapOpacity: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fa",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[13] === undefined && !('icon' in props)) {
    			console.warn("<Fa> was created without expected prop 'icon'");
    		}
    	}

    	get class() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fw() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fw(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pull() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pull(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateX() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateX(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateY() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateY(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get swapOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set swapOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*!
     * Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     */
    var faArrowDown = {
      prefix: 'fas',
      iconName: 'arrow-down',
      icon: [448, 512, [], "f063", "M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"]
    };
    var faArrowUp = {
      prefix: 'fas',
      iconName: 'arrow-up',
      icon: [448, 512, [], "f062", "M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"]
    };

    /* src/Stocks/StockItem.svelte generated by Svelte v3.42.6 */
    const file$5 = "src/Stocks/StockItem.svelte";

    // (48:8) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let fa;
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let current;

    	fa = new Fa({
    			props: { icon: faArrowUp, size: "xs" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(fa.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text(/*dp*/ ctx[3]);
    			t2 = text("%");
    			attr_dev(p, "class", "positive-change svelte-1qplval");
    			add_location(p, file$5, 50, 16, 1414);
    			attr_dev(div, "class", "percent-change positive-percent svelte-1qplval");
    			add_location(div, file$5, 48, 12, 1302);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(fa, div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*dp*/ 8) set_data_dev(t1, /*dp*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(48:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:8) {#if dp < 0}
    function create_if_block_1(ctx) {
    	let div;
    	let fa;
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let current;

    	fa = new Fa({
    			props: { icon: faArrowDown, size: "xs" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(fa.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text(/*dp*/ ctx[3]);
    			t2 = text("%");
    			attr_dev(p, "class", "negative-change svelte-1qplval");
    			add_location(p, file$5, 45, 16, 1218);
    			attr_dev(div, "class", "percent-change negative-percent svelte-1qplval");
    			add_location(div, file$5, 43, 12, 1104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(fa, div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*dp*/ 8) set_data_dev(t1, /*dp*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(43:8) {#if dp < 0}",
    		ctx
    	});

    	return block;
    }

    // (57:8) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("+");
    			t1 = text(/*change*/ ctx[4]);
    			attr_dev(p, "class", "positive-change svelte-1qplval");
    			add_location(p, file$5, 57, 12, 1590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*change*/ 16) set_data_dev(t1, /*change*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(57:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:8) {#if change < 0}
    function create_if_block$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*change*/ ctx[4]);
    			attr_dev(p, "class", "negative-change svelte-1qplval");
    			add_location(p, file$5, 55, 12, 1522);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*change*/ 16) set_data_dev(t, /*change*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(55:8) {#if change < 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let div1;
    	let button0;
    	let t4;
    	let button1;
    	let t5;
    	let div3;
    	let p2;
    	let t6;
    	let t7;
    	let t8;
    	let current_block_type_index;
    	let if_block0;
    	let t9;
    	let current;

    	button0 = new Button({
    			props: { caption: "Update", mode: "update" },
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[6]);

    	button1 = new Button({
    			props: { caption: "Delete", mode: "delete" },
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[7]);
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*dp*/ ctx[3] < 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*change*/ ctx[4] < 0) return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(/*tickerSymbol*/ ctx[1]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*stockName*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			create_component(button0.$$.fragment);
    			t4 = space();
    			create_component(button1.$$.fragment);
    			t5 = space();
    			div3 = element("div");
    			p2 = element("p");
    			t6 = text("$");
    			t7 = text(/*price*/ ctx[2]);
    			t8 = space();
    			if_block0.c();
    			t9 = space();
    			if_block1.c();
    			attr_dev(p0, "id", "subtitle");
    			attr_dev(p0, "class", "svelte-1qplval");
    			add_location(p0, file$5, 17, 12, 471);
    			attr_dev(p1, "id", "title");
    			attr_dev(p1, "class", "svelte-1qplval");
    			add_location(p1, file$5, 18, 12, 519);
    			add_location(div0, file$5, 16, 8, 453);
    			add_location(div1, file$5, 21, 8, 573);
    			attr_dev(div2, "id", "name");
    			attr_dev(div2, "class", "svelte-1qplval");
    			add_location(div2, file$5, 15, 4, 429);
    			attr_dev(p2, "id", "price");
    			attr_dev(p2, "class", "svelte-1qplval");
    			add_location(p2, file$5, 40, 8, 1043);
    			attr_dev(div3, "id", "values");
    			attr_dev(div3, "class", "svelte-1qplval");
    			add_location(div3, file$5, 39, 4, 1017);
    			attr_dev(div4, "id", "container");
    			attr_dev(div4, "class", "svelte-1qplval");
    			add_location(div4, file$5, 14, 0, 404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			mount_component(button0, div1, null);
    			append_dev(div1, t4);
    			mount_component(button1, div1, null);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, p2);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			append_dev(div3, t8);
    			if_blocks[current_block_type_index].m(div3, null);
    			append_dev(div3, t9);
    			if_block1.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*tickerSymbol*/ 2) set_data_dev(t0, /*tickerSymbol*/ ctx[1]);
    			if (!current || dirty & /*stockName*/ 1) set_data_dev(t2, /*stockName*/ ctx[0]);
    			if (!current || dirty & /*price*/ 4) set_data_dev(t7, /*price*/ ctx[2]);
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
    				if_block0.m(div3, t9);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(button0);
    			destroy_component(button1);
    			if_blocks[current_block_type_index].d();
    			if_block1.d();
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
    	validate_slots('StockItem', slots, []);
    	const dispatch = createEventDispatcher();
    	let { stockName } = $$props;
    	let { tickerSymbol } = $$props;
    	let { price } = $$props;
    	let { dp } = $$props;
    	let { change } = $$props;
    	const writable_props = ['stockName', 'tickerSymbol', 'price', 'dp', 'change'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StockItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch("update", tickerSymbol);
    	};

    	const click_handler_1 = () => {
    		dispatch("delete", stockName);
    	};

    	$$self.$$set = $$props => {
    		if ('stockName' in $$props) $$invalidate(0, stockName = $$props.stockName);
    		if ('tickerSymbol' in $$props) $$invalidate(1, tickerSymbol = $$props.tickerSymbol);
    		if ('price' in $$props) $$invalidate(2, price = $$props.price);
    		if ('dp' in $$props) $$invalidate(3, dp = $$props.dp);
    		if ('change' in $$props) $$invalidate(4, change = $$props.change);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Button,
    		Fa,
    		faArrowUp,
    		faArrowDown,
    		dispatch,
    		stockName,
    		tickerSymbol,
    		price,
    		dp,
    		change
    	});

    	$$self.$inject_state = $$props => {
    		if ('stockName' in $$props) $$invalidate(0, stockName = $$props.stockName);
    		if ('tickerSymbol' in $$props) $$invalidate(1, tickerSymbol = $$props.tickerSymbol);
    		if ('price' in $$props) $$invalidate(2, price = $$props.price);
    		if ('dp' in $$props) $$invalidate(3, dp = $$props.dp);
    		if ('change' in $$props) $$invalidate(4, change = $$props.change);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		stockName,
    		tickerSymbol,
    		price,
    		dp,
    		change,
    		dispatch,
    		click_handler,
    		click_handler_1
    	];
    }

    class StockItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			stockName: 0,
    			tickerSymbol: 1,
    			price: 2,
    			dp: 3,
    			change: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StockItem",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stockName*/ ctx[0] === undefined && !('stockName' in props)) {
    			console.warn("<StockItem> was created without expected prop 'stockName'");
    		}

    		if (/*tickerSymbol*/ ctx[1] === undefined && !('tickerSymbol' in props)) {
    			console.warn("<StockItem> was created without expected prop 'tickerSymbol'");
    		}

    		if (/*price*/ ctx[2] === undefined && !('price' in props)) {
    			console.warn("<StockItem> was created without expected prop 'price'");
    		}

    		if (/*dp*/ ctx[3] === undefined && !('dp' in props)) {
    			console.warn("<StockItem> was created without expected prop 'dp'");
    		}

    		if (/*change*/ ctx[4] === undefined && !('change' in props)) {
    			console.warn("<StockItem> was created without expected prop 'change'");
    		}
    	}

    	get stockName() {
    		throw new Error("<StockItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stockName(value) {
    		throw new Error("<StockItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tickerSymbol() {
    		throw new Error("<StockItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickerSymbol(value) {
    		throw new Error("<StockItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<StockItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<StockItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dp() {
    		throw new Error("<StockItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dp(value) {
    		throw new Error("<StockItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get change() {
    		throw new Error("<StockItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set change(value) {
    		throw new Error("<StockItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Stocks/StockList.svelte generated by Svelte v3.42.6 */
    const file$4 = "src/Stocks/StockList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (7:4) {#each stocks as stock}
    function create_each_block(ctx) {
    	let stockitem;
    	let current;

    	stockitem = new StockItem({
    			props: {
    				stockName: /*stock*/ ctx[3].stockName,
    				tickerSymbol: /*stock*/ ctx[3].tickerSymbol,
    				price: /*stock*/ ctx[3].price,
    				dp: /*stock*/ ctx[3].dp,
    				change: /*stock*/ ctx[3].change
    			},
    			$$inline: true
    		});

    	stockitem.$on("delete", /*delete_handler*/ ctx[1]);
    	stockitem.$on("update", /*update_handler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(stockitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stockitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const stockitem_changes = {};
    			if (dirty & /*stocks*/ 1) stockitem_changes.stockName = /*stock*/ ctx[3].stockName;
    			if (dirty & /*stocks*/ 1) stockitem_changes.tickerSymbol = /*stock*/ ctx[3].tickerSymbol;
    			if (dirty & /*stocks*/ 1) stockitem_changes.price = /*stock*/ ctx[3].price;
    			if (dirty & /*stocks*/ 1) stockitem_changes.dp = /*stock*/ ctx[3].dp;
    			if (dirty & /*stocks*/ 1) stockitem_changes.change = /*stock*/ ctx[3].change;
    			stockitem.$set(stockitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stockitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stockitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stockitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:4) {#each stocks as stock}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let section;
    	let current;
    	let each_value = /*stocks*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(section, "class", "svelte-1trnyba");
    			add_location(section, file$4, 5, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*stocks*/ 1) {
    				each_value = /*stocks*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
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
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('StockList', slots, []);
    	let { stocks } = $$props;
    	const writable_props = ['stocks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StockList> was created with unknown prop '${key}'`);
    	});

    	function delete_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function update_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('stocks' in $$props) $$invalidate(0, stocks = $$props.stocks);
    	};

    	$$self.$capture_state = () => ({ StockItem, stocks });

    	$$self.$inject_state = $$props => {
    		if ('stocks' in $$props) $$invalidate(0, stocks = $$props.stocks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stocks, delete_handler, update_handler];
    }

    class StockList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { stocks: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StockList",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stocks*/ ctx[0] === undefined && !('stocks' in props)) {
    			console.warn("<StockList> was created without expected prop 'stocks'");
    		}
    	}

    	get stocks() {
    		throw new Error("<StockList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stocks(value) {
    		throw new Error("<StockList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let stocks = writable([]);

    const customStockStore = {
        subscribe: stocks.subscribe,
        addStock: (stock) => {
            const newStock = {
                ...stock,
                id: Math.random().toString()
            };
            stocks.update(items => {
                return [...items, newStock]
            });

        },
        deleteStock: (stockName) => {
            stocks.update(items => {
                return items.filter(stock => stock.stockName !== stockName);
            });
        },
        updateStock: (stockData, tickerSymbol) => {
            stocks.update(items => {
                const stockIndex = items.findIndex(i => i.tickerSymbol === tickerSymbol);
                const updatedStock = { ...items[stockIndex], ...stockData };
                const updatedStockArr = [...items];
                updatedStockArr[stockIndex] = updatedStock;
                return updatedStockArr;
            });
        }
    };

    /* src/Components/Header.svelte generated by Svelte v3.42.6 */

    const file$3 = "src/Components/Header.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t = text(/*caption*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-a3j6tw");
    			add_location(h1, file$3, 5, 4, 57);
    			add_location(header, file$3, 4, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*caption*/ 1) set_data_dev(t, /*caption*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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
    	validate_slots('Header', slots, []);
    	let { caption } = $$props;
    	const writable_props = ['caption'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('caption' in $$props) $$invalidate(0, caption = $$props.caption);
    	};

    	$$self.$capture_state = () => ({ caption });

    	$$self.$inject_state = $$props => {
    		if ('caption' in $$props) $$invalidate(0, caption = $$props.caption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [caption];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { caption: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*caption*/ ctx[0] === undefined && !('caption' in props)) {
    			console.warn("<Header> was created without expected prop 'caption'");
    		}
    	}

    	get caption() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var defaultBindingOptions = {
        allowDownsampling: true,
    };
    function bindToDevicePixelRatio(canvas, options) {
        if (options === void 0) { options = defaultBindingOptions; }
        return new DevicePixelRatioBinding(canvas, options);
    }
    var DevicePixelRatioBinding = /** @class */ (function () {
        function DevicePixelRatioBinding(canvas, options) {
            var _this = this;
            this._resolutionMediaQueryList = null;
            this._resolutionListener = function (ev) { return _this._onResolutionChanged(); };
            this._canvasConfiguredListeners = [];
            this.canvas = canvas;
            this._canvasSize = {
                width: this.canvas.clientWidth,
                height: this.canvas.clientHeight,
            };
            this._options = options;
            this._configureCanvas();
            this._installResolutionListener();
        }
        DevicePixelRatioBinding.prototype.destroy = function () {
            this._canvasConfiguredListeners.length = 0;
            this._uninstallResolutionListener();
            this.canvas = null;
        };
        Object.defineProperty(DevicePixelRatioBinding.prototype, "canvasSize", {
            get: function () {
                return {
                    width: this._canvasSize.width,
                    height: this._canvasSize.height,
                };
            },
            enumerable: true,
            configurable: true
        });
        DevicePixelRatioBinding.prototype.resizeCanvas = function (size) {
            this._canvasSize = {
                width: size.width,
                height: size.height,
            };
            this._configureCanvas();
        };
        Object.defineProperty(DevicePixelRatioBinding.prototype, "pixelRatio", {
            get: function () {
                // According to DOM Level 2 Core specification, ownerDocument should never be null for HTMLCanvasElement
                // see https://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#node-ownerDoc
                var win = this.canvas.ownerDocument.defaultView;
                if (win == null) {
                    throw new Error('No window is associated with the canvas');
                }
                return win.devicePixelRatio > 1 || this._options.allowDownsampling ? win.devicePixelRatio : 1;
            },
            enumerable: true,
            configurable: true
        });
        DevicePixelRatioBinding.prototype.subscribeCanvasConfigured = function (listener) {
            this._canvasConfiguredListeners.push(listener);
        };
        DevicePixelRatioBinding.prototype.unsubscribeCanvasConfigured = function (listener) {
            this._canvasConfiguredListeners = this._canvasConfiguredListeners.filter(function (l) { return l != listener; });
        };
        DevicePixelRatioBinding.prototype._configureCanvas = function () {
            var ratio = this.pixelRatio;
            this.canvas.style.width = this._canvasSize.width + "px";
            this.canvas.style.height = this._canvasSize.height + "px";
            this.canvas.width = this._canvasSize.width * ratio;
            this.canvas.height = this._canvasSize.height * ratio;
            this._emitCanvasConfigured();
        };
        DevicePixelRatioBinding.prototype._emitCanvasConfigured = function () {
            var _this = this;
            this._canvasConfiguredListeners.forEach(function (listener) { return listener.call(_this); });
        };
        DevicePixelRatioBinding.prototype._installResolutionListener = function () {
            if (this._resolutionMediaQueryList !== null) {
                throw new Error('Resolution listener is already installed');
            }
            // According to DOM Level 2 Core specification, ownerDocument should never be null for HTMLCanvasElement
            // see https://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#node-ownerDoc
            var win = this.canvas.ownerDocument.defaultView;
            if (win == null) {
                throw new Error('No window is associated with the canvas');
            }
            var dppx = win.devicePixelRatio;
            this._resolutionMediaQueryList = win.matchMedia("all and (resolution: " + dppx + "dppx)");
            // IE and some versions of Edge do not support addEventListener/removeEventListener, and we are going to use the deprecated addListener/removeListener
            this._resolutionMediaQueryList.addListener(this._resolutionListener);
        };
        DevicePixelRatioBinding.prototype._uninstallResolutionListener = function () {
            if (this._resolutionMediaQueryList !== null) {
                // IE and some versions of Edge do not support addEventListener/removeEventListener, and we are going to use the deprecated addListener/removeListener
                this._resolutionMediaQueryList.removeListener(this._resolutionListener);
                this._resolutionMediaQueryList = null;
            }
        };
        DevicePixelRatioBinding.prototype._reinstallResolutionListener = function () {
            this._uninstallResolutionListener();
            this._installResolutionListener();
        };
        DevicePixelRatioBinding.prototype._onResolutionChanged = function () {
            this._configureCanvas();
            this._reinstallResolutionListener();
        };
        return DevicePixelRatioBinding;
    }());

    /*!
     * @license
     * TradingView Lightweight Charts v3.6.1
     * Copyright (c) 2020 TradingView, Inc.
     * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
     */
    var i,n;function h(t,i){var n,h=((n={})[0]=[],n[1]=[t.lineWidth,t.lineWidth],n[2]=[2*t.lineWidth,2*t.lineWidth],n[3]=[6*t.lineWidth,6*t.lineWidth],n[4]=[t.lineWidth,4*t.lineWidth],n)[i];t.setLineDash(h);}function s(t,i,n,h){t.beginPath();var s=t.lineWidth%2?.5:0;t.moveTo(n,i+s),t.lineTo(h,i+s),t.stroke();}!function(t){t[t.Simple=0]="Simple",t[t.WithSteps=1]="WithSteps";}(i||(i={})),function(t){t[t.Solid=0]="Solid",t[t.Dotted=1]="Dotted",t[t.Dashed=2]="Dashed",t[t.LargeDashed=3]="LargeDashed",t[t.SparseDotted=4]="SparseDotted";}(n||(n={}));var r=function(t,i){return (r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,i){t.__proto__=i;}||function(t,i){for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(t[n]=i[n]);})(t,i)};function e(t,i){if("function"!=typeof i&&null!==i)throw new TypeError("Class extends value "+String(i)+" is not a constructor or null");function n(){this.constructor=t;}r(t,i),t.prototype=null===i?Object.create(i):(n.prototype=i.prototype,new n);}var u=function(){return (u=Object.assign||function(t){for(var i,n=1,h=arguments.length;n<h;n++)for(var s in i=arguments[n])Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s]);return t}).apply(this,arguments)};function a(t,i,n){if(n||2===arguments.length)for(var h,s=0,r=i.length;s<r;s++)!h&&s in i||(h||(h=Array.prototype.slice.call(i,0,s)),h[s]=i[s]);return t.concat(h||Array.prototype.slice.call(i))}function o(t,i){if(!t)throw new Error("Assertion failed"+(i?": "+i:""))}function l(t){if(void 0===t)throw new Error("Value is undefined");return t}function f(t){if(null===t)throw new Error("Value is null");return t}function c(t){return f(l(t))}function v(t){for(var i=[],n=1;n<arguments.length;n++)i[n-1]=arguments[n];for(var h=0,s=i;h<s.length;h++){var r=s[h];for(var e in r)void 0!==r[e]&&("object"!=typeof r[e]||void 0===t[e]?t[e]=r[e]:v(t[e],r[e]));}return t}function _(t){return "number"==typeof t&&isFinite(t)}function d(t){return "number"==typeof t&&t%1==0}function w(t){return "string"==typeof t}function M(t){return "boolean"==typeof t}function b(t){var i,n,h,s=t;if(!s||"object"!=typeof s)return s;for(n in i=Array.isArray(s)?[]:{},s)s.hasOwnProperty(n)&&(h=s[n],i[n]=h&&"object"==typeof h?b(h):h);return i}function m(t){return null!==t}function p(t){return null===t?void 0:t}var g=function(){function t(){this.t=[];}return t.prototype.i=function(t){this.t=t;},t.prototype.h=function(t,i,n,h){this.t.forEach((function(s){t.save(),s.h(t,i,n,h),t.restore();}));},t}(),y=function(){function t(){}return t.prototype.h=function(t,i,n,h){t.save(),t.scale(i,i),this.u(t,n,h),t.restore();},t.prototype.o=function(t,i,n,h){t.save(),t.scale(i,i),this.l(t,n,h),t.restore();},t.prototype.l=function(t,i,n){},t}(),k=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.v=null,i}return e(i,t),i.prototype._=function(t){this.v=t;},i.prototype.u=function(t){if(null!==this.v&&null!==this.v.M){var i=this.v.M,n=this.v,h=function(h){t.beginPath();for(var s=i.to-1;s>=i.from;--s){var r=n.m[s];t.moveTo(r.p,r.g),t.arc(r.p,r.g,h,0,2*Math.PI);}t.fill();};t.fillStyle=n.k,h(n.N+2),t.fillStyle=n.S,h(n.N);}},i}(y);function x(){return {m:[{p:0,g:0,C:0,A:0}],S:"",k:"",N:0,M:null}}var N={from:0,to:1},S=function(){function t(t,i){this.D=new g,this.T=[],this.L=[],this.B=!0,this.F=t,this.V=i,this.D.i(this.T);}return t.prototype.O=function(t){var i=this.F.P();i.length!==this.T.length&&(this.L=i.map(x),this.T=this.L.map((function(t){var i=new k;return i._(t),i})),this.D.i(this.T)),this.B=!0;},t.prototype.R=function(t,i,n){return this.B&&(this.I(t),this.B=!1),this.D},t.prototype.I=function(t){var i=this,n=this.F.P(),h=this.V.W(),s=this.F.U();n.forEach((function(n,r){var e,u=i.L[r],a=n.j(h);if(null!==a&&n.q()){var o=f(n.H());u.S=a.Y,u.N=a.N,u.m[0].A=a.A,u.m[0].g=n.$().K(a.A,o.X),u.k=null!==(e=a.Z)&&void 0!==e?e:i.F.J(u.m[0].g/t),u.m[0].C=h,u.m[0].p=s.G(h),u.M=N;}else u.M=null;}));},t}(),C=function(){function t(t){this.tt=t;}return t.prototype.h=function(t,i,n,r){if(null!==this.tt){var e=this.tt.it.q,u=this.tt.nt.q;if(e||u){t.save();var a=Math.round(this.tt.p*i),o=Math.round(this.tt.g*i),l=Math.ceil(this.tt.ht*i),f=Math.ceil(this.tt.st*i);t.lineCap="butt",e&&a>=0&&(t.lineWidth=Math.floor(this.tt.it.rt*i),t.strokeStyle=this.tt.it.et,t.fillStyle=this.tt.it.et,h(t,this.tt.it.ut),function(t,i,n,h){t.beginPath();var s=t.lineWidth%2?.5:0;t.moveTo(i+s,n),t.lineTo(i+s,h),t.stroke();}(t,a,0,f)),u&&o>=0&&(t.lineWidth=Math.floor(this.tt.nt.rt*i),t.strokeStyle=this.tt.nt.et,t.fillStyle=this.tt.nt.et,h(t,this.tt.nt.ut),s(t,o,0,l)),t.restore();}}},t}(),A=function(){function t(t){this.B=!0,this.at={it:{rt:1,ut:0,et:"",q:!1},nt:{rt:1,ut:0,et:"",q:!1},ht:0,st:0,p:0,g:0},this.ot=new C(this.at),this.lt=t;}return t.prototype.O=function(){this.B=!0;},t.prototype.R=function(t,i){return this.B&&(this.I(),this.B=!1),this.ot},t.prototype.I=function(){var t=this.lt.q(),i=f(this.lt.ft()),n=i.vt().ct().crosshair,h=this.at;h.nt.q=t&&this.lt._t(i),h.it.q=t&&this.lt.dt(),h.nt.rt=n.horzLine.width,h.nt.ut=n.horzLine.style,h.nt.et=n.horzLine.color,h.it.rt=n.vertLine.width,h.it.ut=n.vertLine.style,h.it.et=n.vertLine.color,h.ht=i.wt(),h.st=i.Mt(),h.p=this.lt.bt(),h.g=this.lt.gt();},t}(),D={khaki:"#f0e68c",azure:"#f0ffff",aliceblue:"#f0f8ff",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gainsboro:"#dcdcdc",gray:"#808080",green:"#008000",honeydew:"#f0fff0",floralwhite:"#fffaf0",lightblue:"#add8e6",lightcoral:"#f08080",lemonchiffon:"#fffacd",hotpink:"#ff69b4",lightyellow:"#ffffe0",greenyellow:"#adff2f",lightgoldenrodyellow:"#fafad2",limegreen:"#32cd32",linen:"#faf0e6",lightcyan:"#e0ffff",magenta:"#f0f",maroon:"#800000",olive:"#808000",orange:"#ffa500",oldlace:"#fdf5e6",mediumblue:"#0000cd",transparent:"#0000",lime:"#0f0",lightpink:"#ffb6c1",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",midnightblue:"#191970",orchid:"#da70d6",mediumorchid:"#ba55d3",mediumturquoise:"#48d1cc",orangered:"#ff4500",royalblue:"#4169e1",powderblue:"#b0e0e6",red:"#f00",coral:"#ff7f50",turquoise:"#40e0d0",white:"#fff",whitesmoke:"#f5f5f5",wheat:"#f5deb3",teal:"#008080",steelblue:"#4682b4",bisque:"#ffe4c4",aquamarine:"#7fffd4",aqua:"#0ff",sienna:"#a0522d",silver:"#c0c0c0",springgreen:"#00ff7f",antiquewhite:"#faebd7",burlywood:"#deb887",brown:"#a52a2a",beige:"#f5f5dc",chocolate:"#d2691e",chartreuse:"#7fff00",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cadetblue:"#5f9ea0",tomato:"#ff6347",fuchsia:"#f0f",blue:"#00f",salmon:"#fa8072",blanchedalmond:"#ffebcd",slateblue:"#6a5acd",slategray:"#708090",thistle:"#d8bfd8",tan:"#d2b48c",cyan:"#0ff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",blueviolet:"#8a2be2",black:"#000",darkmagenta:"#8b008b",darkslateblue:"#483d8b",darkkhaki:"#bdb76b",darkorchid:"#9932cc",darkorange:"#ff8c00",darkgreen:"#006400",darkred:"#8b0000",dodgerblue:"#1e90ff",darkslategray:"#2f4f4f",dimgray:"#696969",deepskyblue:"#00bfff",firebrick:"#b22222",forestgreen:"#228b22",indigo:"#4b0082",ivory:"#fffff0",lavenderblush:"#fff0f5",feldspar:"#d19275",indianred:"#cd5c5c",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightskyblue:"#87cefa",lightslategray:"#789",lightslateblue:"#8470ff",snow:"#fffafa",lightseagreen:"#20b2aa",lightsalmon:"#ffa07a",darksalmon:"#e9967a",darkviolet:"#9400d3",mediumpurple:"#9370d8",mediumaquamarine:"#66cdaa",skyblue:"#87ceeb",lavender:"#e6e6fa",lightsteelblue:"#b0c4de",mediumvioletred:"#c71585",mintcream:"#f5fffa",navajowhite:"#ffdead",navy:"#000080",olivedrab:"#6b8e23",palevioletred:"#d87093",violetred:"#d02090",yellow:"#ff0",yellowgreen:"#9acd32",lawngreen:"#7cfc00",pink:"#ffc0cb",paleturquoise:"#afeeee",palegoldenrod:"#eee8aa",darkolivegreen:"#556b2f",darkseagreen:"#8fbc8f",darkturquoise:"#00ced1",peachpuff:"#ffdab9",deeppink:"#ff1493",violet:"#ee82ee",palegreen:"#98fb98",mediumseagreen:"#3cb371",peru:"#cd853f",saddlebrown:"#8b4513",sandybrown:"#f4a460",rosybrown:"#bc8f8f",purple:"#800080",seagreen:"#2e8b57",seashell:"#fff5ee",papayawhip:"#ffefd5",mediumslateblue:"#7b68ee",plum:"#dda0dd",mediumspringgreen:"#00fa9a"};function T(t){return t<0?0:t>255?255:Math.round(t)||0}function L(t){return t<=0||t>0?t<0?0:t>1?1:Math.round(1e4*t)/1e4:0}var B=/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i,E=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i,F=/^rgb\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*\)$/,V=/^rgba\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?[\d]{0,10}(?:\.\d+)?)\s*\)$/;function O(t){var i;if((t=t.toLowerCase())in D&&(t=D[t]),i=V.exec(t)||F.exec(t))return [T(parseInt(i[1],10)),T(parseInt(i[2],10)),T(parseInt(i[3],10)),L(i.length<5?1:parseFloat(i[4]))];if(i=E.exec(t))return [T(parseInt(i[1],16)),T(parseInt(i[2],16)),T(parseInt(i[3],16)),1];if(i=B.exec(t))return [T(17*parseInt(i[1],16)),T(17*parseInt(i[2],16)),T(17*parseInt(i[3],16)),1];throw new Error("Cannot parse color: "+t)}function z(t){var i,n=O(t);return {yt:"rgb("+n[0]+", "+n[1]+", "+n[2]+")",kt:(i=n,.199*i[0]+.687*i[1]+.114*i[2]>160?"black":"white")}}function P(t,i,n,h,s,r){t.fillRect(i+r,n,h-2*r,r),t.fillRect(i+r,n+s-r,h-2*r,r),t.fillRect(i,n,r,s),t.fillRect(i+h-r,n,r,s);}function R(t,i,n){t.save(),t.scale(i,i),n(),t.restore();}function I(t,i,n,h,s,r){t.save(),t.globalCompositeOperation="copy",t.fillStyle=r,t.fillRect(i,n,h,s),t.restore();}function W(t,i,n,h,s,r,e){t.save(),t.globalCompositeOperation="copy";var u=t.createLinearGradient(0,0,0,s);u.addColorStop(0,r),u.addColorStop(1,e),t.fillStyle=u,t.fillRect(i,n,h,s),t.restore();}var U,j=function(){function t(t,i){this._(t,i);}return t.prototype._=function(t,i){this.tt=t,this.xt=i;},t.prototype.h=function(t,i,n,h,s,r){if(this.tt.q){t.font=i.Nt;var e=this.tt.St||!this.tt.Ct?i.At:0,u=i.Dt,a=i.Tt,o=i.Lt,l=i.Bt,f=i.Et,c=this.tt.Ft,v=Math.ceil(n.Vt(t,c)),_=i.Ot,d=i.zt+a+o,w=Math.ceil(.5*d),M=u+v+l+f+e,b=this.xt.Pt;this.xt.Rt&&(b=this.xt.Rt);var m,p,g=(b=Math.round(b))-w,y=g+d,k="right"===s,x=k?h:0,N=Math.ceil(h*r),S=x;if(t.fillStyle=this.xt.yt,t.lineWidth=1,t.lineCap="butt",c){k?(m=x-e,p=(S=x-M)+f):(S=x+M,m=x+e,p=x+u+e+l);var C=Math.max(1,Math.floor(r)),A=Math.max(1,Math.floor(u*r)),D=k?N:0,T=Math.round(g*r),L=Math.round(S*r),B=Math.round(b*r)-Math.floor(.5*r),E=B+C+(B-T),F=Math.round(m*r);t.save(),t.beginPath(),t.moveTo(D,T),t.lineTo(L,T),t.lineTo(L,E),t.lineTo(D,E),t.fill(),t.fillStyle=this.tt.Z,t.fillRect(k?N-A:0,T,A,E-T),this.tt.St&&(t.fillStyle=this.xt.et,t.fillRect(D,B,F-D,C)),t.textAlign="left",t.fillStyle=this.xt.et,R(t,r,(function(){t.fillText(c,p,y-o-_);})),t.restore();}}},t.prototype.Mt=function(t,i){return this.tt.q?t.zt+t.Tt+t.Lt:0},t}(),q=function(){function t(t){this.It={Pt:0,et:"#FFF",yt:"#000"},this.Wt={Ft:"",q:!1,St:!0,Ct:!1,Z:""},this.Ut={Ft:"",q:!1,St:!1,Ct:!0,Z:""},this.B=!0,this.jt=new(t||j)(this.Wt,this.It),this.qt=new(t||j)(this.Ut,this.It);}return t.prototype.Ft=function(){return this.Wt.Ft},t.prototype.Pt=function(){return this.Ht(),this.It.Pt},t.prototype.O=function(){this.B=!0;},t.prototype.Mt=function(t,i){return void 0===i&&(i=!1),Math.max(this.jt.Mt(t,i),this.qt.Mt(t,i))},t.prototype.Yt=function(){return this.It.Rt||0},t.prototype.Kt=function(t){this.It.Rt=t;},t.prototype.$t=function(){return this.Ht(),this.Wt.q||this.Ut.q},t.prototype.Xt=function(){return this.Ht(),this.Wt.q},t.prototype.R=function(t){return this.Ht(),this.Wt.St=this.Wt.St&&t.ct().drawTicks,this.Ut.St=this.Ut.St&&t.ct().drawTicks,this.jt._(this.Wt,this.It),this.qt._(this.Ut,this.It),this.jt},t.prototype.Zt=function(){return this.Ht(),this.jt._(this.Wt,this.It),this.qt._(this.Ut,this.It),this.qt},t.prototype.Ht=function(){this.B&&(this.Wt.St=!0,this.Ut.St=!1,this.Jt(this.Wt,this.Ut,this.It));},t}(),H=function(t){function i(i,n,h){var s=t.call(this)||this;return s.lt=i,s.Gt=n,s.Qt=h,s}return e(i,t),i.prototype.Jt=function(t,i,n){t.q=!1;var h=this.lt.ct().horzLine;if(h.labelVisible){var s=this.Gt.H();if(this.lt.q()&&!this.Gt.ti()&&null!==s){var r=z(h.labelBackgroundColor);n.yt=r.yt,n.et=r.kt;var e=this.Qt(this.Gt);n.Pt=e.Pt,t.Ft=this.Gt.ii(e.A,s),t.q=!0;}}},i}(q),Y=/[1-9]/g,K=function(){function t(){this.tt=null;}return t.prototype._=function(t){this.tt=t;},t.prototype.h=function(t,i,n){var h=this;if(null!==this.tt&&!1!==this.tt.q&&0!==this.tt.Ft.length){t.font=i.Nt;var s=Math.round(i.ni.Vt(t,this.tt.Ft,Y));if(!(s<=0)){t.save();var r=i.hi,e=s+2*r,u=e/2,a=this.tt.wt,o=this.tt.Pt,l=Math.floor(o-u)+.5;l<0?(o+=Math.abs(0-l),l=Math.floor(o-u)+.5):l+e>a&&(o-=Math.abs(a-(l+e)),l=Math.floor(o-u)+.5);var c=l+e,v=0+i.Dt+i.Tt+i.zt+i.Lt;t.fillStyle=this.tt.yt;var _=Math.round(l*n),d=Math.round(0*n),w=Math.round(c*n),M=Math.round(v*n);t.fillRect(_,d,w-_,M-d);var b=Math.round(this.tt.Pt*n),m=d,p=Math.round((m+i.Dt+i.At)*n);t.fillStyle=this.tt.et;var g=Math.max(1,Math.floor(n)),y=Math.floor(.5*n);t.fillRect(b-y,m,g,p-m);var k=v-i.Ot-i.Lt;t.textAlign="left",t.fillStyle=this.tt.et,R(t,n,(function(){t.fillText(f(h.tt).Ft,l+r,k);})),t.restore();}}},t}(),$=function(){function t(t,i,n){this.B=!0,this.ot=new K,this.at={q:!1,yt:"#4c525e",et:"white",Ft:"",wt:0,Pt:NaN},this.V=t,this.si=i,this.Qt=n;}return t.prototype.O=function(){this.B=!0;},t.prototype.R=function(){return this.B&&(this.I(),this.B=!1),this.ot._(this.at),this.ot},t.prototype.I=function(){var t=this.at;t.q=!1;var i=this.V.ct().vertLine;if(i.labelVisible){var n=this.si.U();if(!n.ti()){var h=n.ri(this.V.W());t.wt=n.wt();var s=this.Qt();if(s.C){t.Pt=s.Pt,t.Ft=n.ei(f(h)),t.q=!0;var r=z(i.labelBackgroundColor);t.yt=r.yt,t.et=r.kt;}}}},t}(),X=function(){function t(){this.ui=null,this.ai=0;}return t.prototype.oi=function(){return this.ai},t.prototype.li=function(t){this.ai=t;},t.prototype.$=function(){return this.ui},t.prototype.fi=function(t){this.ui=t;},t.prototype.ci=function(t,i){return []},t.prototype.vi=function(t){return []},t.prototype._i=function(){return []},t.prototype.q=function(){return !0},t}();!function(t){t[t.Normal=0]="Normal",t[t.Magnet=1]="Magnet";}(U||(U={}));var Z=function(t){function i(i,n){var h=t.call(this)||this;h.di=null,h.wi=NaN,h.Mi=0,h.bi=!0,h.mi=new Map,h.pi=!1,h.gi=NaN,h.yi=NaN,h.ki=NaN,h.xi=NaN,h.si=i,h.Ni=n,h.Si=new S(i,h);var s,r;h.Ci=(s=function(){return h.wi},r=function(){return h.yi},function(t){var i=r(),n=s();if(t===f(h.di).Ai())return {A:n,Pt:i};var e=f(t.H());return {A:t.Di(i,e),Pt:i}});var e=function(t,i){return function(){return {C:h.si.U().ri(t()),Pt:i()}}}((function(){return h.Mi}),(function(){return h.bt()}));return h.Ti=new $(h,i,e),h.Li=new A(h),h}return e(i,t),i.prototype.ct=function(){return this.Ni},i.prototype.Bi=function(t,i){this.ki=t,this.xi=i;},i.prototype.Ei=function(){this.ki=NaN,this.xi=NaN;},i.prototype.Fi=function(){return this.ki},i.prototype.Vi=function(){return this.xi},i.prototype.Oi=function(t,i,n){this.pi||(this.pi=!0),this.bi=!0,this.zi(t,i,n);},i.prototype.W=function(){return this.Mi},i.prototype.bt=function(){return this.gi},i.prototype.gt=function(){return this.yi},i.prototype.q=function(){return this.bi},i.prototype.Pi=function(){this.bi=!1,this.Ri(),this.wi=NaN,this.gi=NaN,this.yi=NaN,this.di=null,this.Ei();},i.prototype.vi=function(t){return null!==this.di?[this.Li,this.Si]:[]},i.prototype._t=function(t){return t===this.di&&this.Ni.horzLine.visible},i.prototype.dt=function(){return this.Ni.vertLine.visible},i.prototype.ci=function(t,i){this.bi&&this.di===t||this.mi.clear();var n=[];return this.di===t&&n.push(this.Ii(this.mi,i,this.Ci)),n},i.prototype._i=function(){return this.bi?[this.Ti]:[]},i.prototype.ft=function(){return this.di},i.prototype.Wi=function(){this.Li.O(),this.mi.forEach((function(t){return t.O()})),this.Ti.O(),this.Si.O();},i.prototype.Ui=function(t){return t&&!t.Ai().ti()?t.Ai():null},i.prototype.zi=function(t,i,n){this.ji(t,i,n)&&this.Wi();},i.prototype.ji=function(t,i,n){var h=this.gi,s=this.yi,r=this.wi,e=this.Mi,u=this.di,a=this.Ui(n);this.Mi=t,this.gi=isNaN(t)?NaN:this.si.U().G(t),this.di=n;var o=null!==a?a.H():null;return null!==a&&null!==o?(this.wi=i,this.yi=a.K(i,o)):(this.wi=NaN,this.yi=NaN),h!==this.gi||s!==this.yi||e!==this.Mi||r!==this.wi||u!==this.di},i.prototype.Ri=function(){var t=this.si.P().map((function(t){return t.Hi().qi()})).filter(m),i=0===t.length?null:Math.max.apply(Math,t);this.Mi=null!==i?i:NaN;},i.prototype.Ii=function(t,i,n){var h=t.get(i);return void 0===h&&(h=new H(this,i,n),t.set(i,h)),h},i}(X),J=".";function G(t,i){if(!_(t))return "n/a";if(!d(i))throw new TypeError("invalid length");if(i<0||i>16)throw new TypeError("invalid length");if(0===i)return t.toString();return ("0000000000000000"+t.toString()).slice(-i)}var Q=function(){function t(t,i){if(i||(i=1),_(t)&&d(t)||(t=100),t<0)throw new TypeError("invalid base");this.Gt=t,this.Yi=i,this.Ki();}return t.prototype.format=function(t){var i=t<0?"−":"";return t=Math.abs(t),i+this.$i(t)},t.prototype.Ki=function(){if(this.Xi=0,this.Gt>0&&this.Yi>0)for(var t=this.Gt;t>1;)t/=10,this.Xi++;},t.prototype.$i=function(t){var i=this.Gt/this.Yi,n=Math.floor(t),h="",s=void 0!==this.Xi?this.Xi:NaN;if(i>1){var r=+(Math.round(t*i)-n*i).toFixed(this.Xi);r>=i&&(r-=i,n+=1),h=J+G(+r.toFixed(this.Xi)*this.Yi,s);}else n=Math.round(n*i)/i,s>0&&(h=J+G(0,s));return n.toFixed(0)+h},t}(),tt=function(t){function i(i){return void 0===i&&(i=100),t.call(this,i)||this}return e(i,t),i.prototype.format=function(i){return t.prototype.format.call(this,i)+"%"},i}(Q),it=function(){function t(){this.Zi=[];}return t.prototype.Ji=function(t,i,n){var h={Gi:t,Qi:i,tn:!0===n};this.Zi.push(h);},t.prototype.nn=function(t){var i=this.Zi.findIndex((function(i){return t===i.Gi}));i>-1&&this.Zi.splice(i,1);},t.prototype.hn=function(t){this.Zi=this.Zi.filter((function(i){return i.Qi===t}));},t.prototype.sn=function(t,i){var n=a([],this.Zi,!0);this.Zi=this.Zi.filter((function(t){return !t.tn})),n.forEach((function(n){return n.Gi(t,i)}));},t.prototype.rn=function(){return this.Zi.length>0},t.prototype.en=function(){this.Zi=[];},t}(),nt=function(){function t(t,i){this.un=t,this.an=i;}return t.prototype.on=function(t){return null!==t&&(this.un===t.un&&this.an===t.an)},t.prototype.ln=function(){return new t(this.un,this.an)},t.prototype.fn=function(){return this.un},t.prototype.cn=function(){return this.an},t.prototype.vn=function(){return this.an-this.un},t.prototype.ti=function(){return this.an===this.un||Number.isNaN(this.an)||Number.isNaN(this.un)},t.prototype._n=function(i){return null===i?this:new t(Math.min(this.fn(),i.fn()),Math.max(this.cn(),i.cn()))},t.prototype.dn=function(t){if(_(t)&&0!==this.an-this.un){var i=.5*(this.an+this.un),n=this.an-i,h=this.un-i;n*=t,h*=t,this.an=i+n,this.un=i+h;}},t.prototype.wn=function(t){_(t)&&(this.an+=t,this.un+=t);},t.prototype.Mn=function(){return {minValue:this.un,maxValue:this.an}},t.bn=function(i){return null===i?null:new t(i.minValue,i.maxValue)},t}();function ht(t,i,n){return Math.min(Math.max(t,i),n)}function st(t,i,n){return i-t<=n}function rt(t){return t<=0?NaN:Math.log(t)/Math.log(10)}function et(t){var i=Math.ceil(t);return i%2!=0?i-1:i}function ut(t){var i=Math.ceil(t);return i%2==0?i-1:i}function at(t,i){var n=100*(t-i)/i;return i<0?-n:n}function ot(t,i){var n=at(t.fn(),i),h=at(t.cn(),i);return new nt(n,h)}function lt(t,i){var n=100*(t-i)/i+100;return i<0?-n:n}function ft(t,i){var n=lt(t.fn(),i),h=lt(t.cn(),i);return new nt(n,h)}function ct(t){var i=Math.abs(t);if(i<1e-8)return 0;var n=rt(i+1e-4)+4;return t<0?-n:n}function vt(t){var i=Math.abs(t);if(i<1e-8)return 0;var n=Math.pow(10,i-4)-1e-4;return t<0?-n:n}function _t(t){if(null===t)return null;var i=ct(t.fn()),n=ct(t.cn());return new nt(i,n)}var dt,wt=function(){function t(t,i){if(this.mn=t,this.pn=i,function(t){if(t<0)return !1;for(var i=t;i>1;i/=10)if(i%10!=0)return !1;return !0}(this.mn))this.gn=[2,2.5,2];else {this.gn=[];for(var n=this.mn;1!==n;){if(n%2==0)this.gn.push(2),n/=2;else {if(n%5!=0)throw new Error("unexpected base");this.gn.push(2,2.5),n/=5;}if(this.gn.length>100)throw new Error("something wrong with base")}}}return t.prototype.yn=function(t,i,n){for(var h,s,r,e=0===this.mn?0:1/this.mn,u=1e-9,a=Math.pow(10,Math.max(0,Math.ceil(rt(t-i)))),o=0,l=this.pn[0];;){var f=st(a,e,u)&&a>e+u,c=st(a,n*l,u),v=st(a,1,u);if(!(f&&c&&v))break;a/=l,l=this.pn[++o%this.pn.length];}if(a<=e+u&&(a=e),a=Math.max(1,a),this.gn.length>0&&(h=a,s=1,r=u,Math.abs(h-s)<r))for(o=0,l=this.gn[0];st(a,n*l,u)&&a>e+u;)a/=l,l=this.gn[++o%this.gn.length];return a},t}(),Mt=function(){function t(t,i,n,h){this.kn=[],this.Gt=t,this.mn=i,this.xn=n,this.Nn=h;}return t.prototype.yn=function(t,i){if(t<i)throw new Error("high < low");var n=this.Gt.Mt(),h=(t-i)*this.Sn()/n,s=new wt(this.mn,[2,2.5,2]),r=new wt(this.mn,[2,2,2.5]),e=new wt(this.mn,[2.5,2,2]),u=[];return u.push(s.yn(t,i,h),r.yn(t,i,h),e.yn(t,i,h)),function(t){if(t.length<1)throw Error("array is empty");for(var i=t[0],n=1;n<t.length;++n)t[n]<i&&(i=t[n]);return i}(u)},t.prototype.Cn=function(){var t=this.Gt,i=t.H();if(null!==i){var n=t.Mt(),h=this.xn(n-1,i),s=this.xn(0,i),r=this.Gt.ct().entireTextOnly?this.An()/2:0,e=r,u=n-1-r,a=Math.max(h,s),o=Math.min(h,s);if(a!==o){for(var l=this.yn(a,o),f=a%l,c=a>=o?1:-1,v=null,_=0,d=a-(f+=f<0?l:0);d>o;d-=l){var w=this.Nn(d,i,!0);null!==v&&Math.abs(w-v)<this.Sn()||(w<e||w>u||(_<this.kn.length?(this.kn[_].Dn=w,this.kn[_].Tn=t.Ln(d)):this.kn.push({Dn:w,Tn:t.Ln(d)}),_++,v=w,t.Bn()&&(l=this.yn(d*c,o))));}this.kn.length=_;}else this.kn=[];}else this.kn=[];},t.prototype.En=function(){return this.kn},t.prototype.An=function(){return this.Gt.zt()},t.prototype.Sn=function(){return Math.ceil(2.5*this.An())},t}();function bt(t){return t.slice().sort((function(t,i){return f(t.oi())-f(i.oi())}))}!function(t){t[t.Normal=0]="Normal",t[t.Logarithmic=1]="Logarithmic",t[t.Percentage=2]="Percentage",t[t.IndexedTo100=3]="IndexedTo100";}(dt||(dt={}));var mt,pt,gt=new tt,yt=new Q(100,1),kt=function(){function t(t,i,n,h){this.Fn=0,this.Vn=null,this.On=null,this.zn=null,this.Pn={Rn:!1,In:null},this.Wn=0,this.Un=0,this.jn=new it,this.qn=new it,this.Hn=[],this.Yn=null,this.Kn=null,this.$n=null,this.Xn=null,this.Zn=yt,this.Jn=t,this.Ni=i,this.Gn=n,this.Qn=h,this.th=new Mt(this,100,this.ih.bind(this),this.nh.bind(this));}return t.prototype.hh=function(){return this.Jn},t.prototype.ct=function(){return this.Ni},t.prototype.sh=function(t){if(v(this.Ni,t),this.rh(),void 0!==t.mode&&this.eh({uh:t.mode}),void 0!==t.scaleMargins){var i=l(t.scaleMargins.top),n=l(t.scaleMargins.bottom);if(i<0||i>1)throw new Error("Invalid top margin - expect value between 0 and 1, given="+i);if(n<0||n>1||i+n>1)throw new Error("Invalid bottom margin - expect value between 0 and 1, given="+n);if(i+n>1)throw new Error("Invalid margins - sum of margins must be less than 1, given="+(i+n));this.ah(),this.Kn=null;}},t.prototype.oh=function(){return this.Ni.autoScale},t.prototype.Bn=function(){return 1===this.Ni.mode},t.prototype.lh=function(){return 2===this.Ni.mode},t.prototype.fh=function(){return 3===this.Ni.mode},t.prototype.uh=function(){return {_h:this.Ni.autoScale,dh:this.Ni.invertScale,uh:this.Ni.mode}},t.prototype.eh=function(t){var i=this.uh(),n=null;void 0!==t._h&&(this.Ni.autoScale=t._h),void 0!==t.uh&&(this.Ni.mode=t.uh,2!==t.uh&&3!==t.uh||(this.Ni.autoScale=!0),this.Pn.Rn=!1),1===i.uh&&t.uh!==i.uh&&(!function(t){if(null===t)return !1;var i=vt(t.fn()),n=vt(t.cn());return isFinite(i)&&isFinite(n)}(this.On)?this.Ni.autoScale=!0:null!==(n=function(t){if(null===t)return null;var i=vt(t.fn()),n=vt(t.cn());return new nt(i,n)}(this.On))&&this.wh(n)),1===t.uh&&t.uh!==i.uh&&null!==(n=_t(this.On))&&this.wh(n);var h=i.uh!==this.Ni.mode;h&&(2===i.uh||this.lh())&&this.rh(),h&&(3===i.uh||this.fh())&&this.rh(),void 0!==t.dh&&i.dh!==t.dh&&(this.Ni.invertScale=t.dh,this.Mh()),this.qn.sn(i,this.uh());},t.prototype.bh=function(){return this.qn},t.prototype.zt=function(){return this.Gn.fontSize},t.prototype.Mt=function(){return this.Fn},t.prototype.mh=function(t){this.Fn!==t&&(this.Fn=t,this.ah(),this.Kn=null);},t.prototype.ph=function(){if(this.Vn)return this.Vn;var t=this.Mt()-this.gh()-this.yh();return this.Vn=t,t},t.prototype.kh=function(){return this.xh(),this.On},t.prototype.wh=function(t,i){var n=this.On;(i||null===n&&null!==t||null!==n&&!n.on(t))&&(this.Kn=null,this.On=t);},t.prototype.ti=function(){return this.xh(),0===this.Fn||!this.On||this.On.ti()},t.prototype.Nh=function(t){return this.dh()?t:this.Mt()-1-t},t.prototype.K=function(t,i){return this.lh()?t=at(t,i):this.fh()&&(t=lt(t,i)),this.nh(t,i)},t.prototype.Sh=function(t,i,n){this.xh();for(var h=this.yh(),s=f(this.kh()),r=s.fn(),e=s.cn(),u=this.ph()-1,a=this.dh(),o=u/(e-r),l=void 0===n?0:n.from,c=void 0===n?t.length:n.to,v=this.Ch(),_=l;_<c;_++){var d=t[_],w=d.A;if(!isNaN(w)){var M=w;null!==v&&(M=v(d.A,i));var b=h+o*(M-r),m=a?b:this.Fn-1-b;d.g=m;}}},t.prototype.Ah=function(t,i,n){this.xh();for(var h=this.yh(),s=f(this.kh()),r=s.fn(),e=s.cn(),u=this.ph()-1,a=this.dh(),o=u/(e-r),l=void 0===n?0:n.from,c=void 0===n?t.length:n.to,v=this.Ch(),_=l;_<c;_++){var d=t[_],w=d.open,M=d.high,b=d.low,m=d.close;null!==v&&(w=v(d.open,i),M=v(d.high,i),b=v(d.low,i),m=v(d.close,i));var p=h+o*(w-r),g=a?p:this.Fn-1-p;d.Dh=g,p=h+o*(M-r),g=a?p:this.Fn-1-p,d.Th=g,p=h+o*(b-r),g=a?p:this.Fn-1-p,d.Lh=g,p=h+o*(m-r),g=a?p:this.Fn-1-p,d.Bh=g;}},t.prototype.Di=function(t,i){var n=this.ih(t,i);return this.Eh(n,i)},t.prototype.Eh=function(t,i){var n=t;return this.lh()?n=function(t,i){return i<0&&(t=-t),t/100*i+i}(n,i):this.fh()&&(n=function(t,i){return t-=100,i<0&&(t=-t),t/100*i+i}(n,i)),n},t.prototype.Fh=function(){return this.Hn},t.prototype.Vh=function(){if(this.Yn)return this.Yn;for(var t=[],i=0;i<this.Hn.length;i++){var n=this.Hn[i];null===n.oi()&&n.li(i+1),t.push(n);}return t=bt(t),this.Yn=t,this.Yn},t.prototype.Oh=function(t){-1===this.Hn.indexOf(t)&&(this.Hn.push(t),this.rh(),this.zh());},t.prototype.Ph=function(t){var i=this.Hn.indexOf(t);if(-1===i)throw new Error("source is not attached to scale");this.Hn.splice(i,1),0===this.Hn.length&&(this.eh({_h:!0}),this.wh(null)),this.rh(),this.zh();},t.prototype.H=function(){for(var t=null,i=0,n=this.Hn;i<n.length;i++){var h=n[i].H();null!==h&&((null===t||h.Rh<t.Rh)&&(t=h));}return null===t?null:t.X},t.prototype.dh=function(){return this.Ni.invertScale},t.prototype.En=function(){return this.Kn||(this.th.Cn(),this.Kn=this.th.En(),this.jn.sn()),this.Kn},t.prototype.Ih=function(){return this.jn},t.prototype.Wh=function(t){this.lh()||this.fh()||null===this.$n&&null===this.zn&&(this.ti()||(this.$n=this.Fn-t,this.zn=f(this.kh()).ln()));},t.prototype.Uh=function(t){if(!this.lh()&&!this.fh()&&null!==this.$n){this.eh({_h:!1}),(t=this.Fn-t)<0&&(t=0);var i=(this.$n+.2*(this.Fn-1))/(t+.2*(this.Fn-1)),n=f(this.zn).ln();i=Math.max(i,.1),n.dn(i),this.wh(n);}},t.prototype.jh=function(){this.lh()||this.fh()||(this.$n=null,this.zn=null);},t.prototype.qh=function(t){this.oh()||null===this.Xn&&null===this.zn&&(this.ti()||(this.Xn=t,this.zn=f(this.kh()).ln()));},t.prototype.Hh=function(t){if(!this.oh()&&null!==this.Xn){var i=f(this.kh()).vn()/(this.ph()-1),n=t-this.Xn;this.dh()&&(n*=-1);var h=n*i,s=f(this.zn).ln();s.wn(h),this.wh(s,!0),this.Kn=null;}},t.prototype.Yh=function(){this.oh()||null!==this.Xn&&(this.Xn=null,this.zn=null);},t.prototype.Kh=function(){return this.Zn||this.rh(),this.Zn},t.prototype.ii=function(t,i){switch(this.Ni.mode){case 2:return this.Kh().format(at(t,i));case 3:return this.Kh().format(lt(t,i));default:return this.$h(t)}},t.prototype.Ln=function(t){switch(this.Ni.mode){case 2:case 3:return this.Kh().format(t);default:return this.$h(t)}},t.prototype.Xh=function(t){return this.$h(t,f(this.Zh()).Kh())},t.prototype.Jh=function(t,i){return t=at(t,i),gt.format(t)},t.prototype.Gh=function(){return this.Hn},t.prototype.Qh=function(t){this.Pn={In:t,Rn:!1};},t.prototype.Wi=function(){this.Hn.forEach((function(t){return t.Wi()}));},t.prototype.rh=function(){this.Kn=null;var t=this.Zh(),i=100;null!==t&&(i=Math.round(1/t.ts())),this.Zn=yt,this.lh()?(this.Zn=gt,i=100):this.fh()?(this.Zn=new Q(100,1),i=100):null!==t&&(this.Zn=t.Kh()),this.th=new Mt(this,i,this.ih.bind(this),this.nh.bind(this)),this.th.Cn();},t.prototype.zh=function(){this.Yn=null;},t.prototype.Zh=function(){return this.Hn[0]||null},t.prototype.gh=function(){return this.dh()?this.Ni.scaleMargins.bottom*this.Mt()+this.Un:this.Ni.scaleMargins.top*this.Mt()+this.Wn},t.prototype.yh=function(){return this.dh()?this.Ni.scaleMargins.top*this.Mt()+this.Wn:this.Ni.scaleMargins.bottom*this.Mt()+this.Un},t.prototype.xh=function(){this.Pn.Rn||(this.Pn.Rn=!0,this.ns());},t.prototype.ah=function(){this.Vn=null;},t.prototype.nh=function(t,i){if(this.xh(),this.ti())return 0;t=this.Bn()&&t?ct(t):t;var n=f(this.kh()),h=this.yh()+(this.ph()-1)*(t-n.fn())/n.vn();return this.Nh(h)},t.prototype.ih=function(t,i){if(this.xh(),this.ti())return 0;var n=this.Nh(t),h=f(this.kh()),s=h.fn()+h.vn()*((n-this.yh())/(this.ph()-1));return this.Bn()?vt(s):s},t.prototype.Mh=function(){this.Kn=null,this.th.Cn();},t.prototype.ns=function(){var t=this.Pn.In;if(null!==t){for(var i=null,n=0,h=0,s=0,r=this.Gh();s<r.length;s++){var e=r[s];if(e.q()){var u=e.H();if(null!==u){var a=e.hs(t.ss(),t.rs()),o=a&&a.kh();if(null!==o){switch(this.Ni.mode){case 1:o=_t(o);break;case 2:o=ot(o,u.X);break;case 3:o=ft(o,u.X);}if(i=null===i?o:i._n(f(o)),null!==a){var l=a.es();null!==l&&(n=Math.max(n,l.above),h=Math.max(n,l.below));}}}}}if(n===this.Wn&&h===this.Un||(this.Wn=n,this.Un=h,this.Kn=null,this.ah()),null!==i){if(i.fn()===i.cn()){var c=this.Zh(),v=5*(null===c||this.lh()||this.fh()?1:c.ts());i=new nt(i.fn()-v,i.cn()+v);}this.wh(i);}else null===this.On&&this.wh(new nt(-.5,.5));this.Pn.Rn=!0;}},t.prototype.Ch=function(){return this.lh()?at:this.fh()?lt:this.Bn()?ct:null},t.prototype.$h=function(t,i){return void 0===this.Qn.priceFormatter?(void 0===i&&(i=this.Kh()),i.format(t)):this.Qn.priceFormatter(t)},t}();function xt(t){void 0!==t.borderColor&&(t.borderUpColor=t.borderColor,t.borderDownColor=t.borderColor),void 0!==t.wickColor&&(t.wickUpColor=t.wickColor,t.wickDownColor=t.wickColor);}!function(t){t[t.Disabled=0]="Disabled",t[t.Continuous=1]="Continuous",t[t.OnDataUpdate=2]="OnDataUpdate";}(mt||(mt={})),function(t){t[t.LastBar=0]="LastBar",t[t.LastVisible=1]="LastVisible";}(pt||(pt={}));var Nt=function(t){return t.getUTCFullYear()};function St(t,i,n){return i.replace(/yyyy/g,function(t){return G(Nt(t),4)}(t)).replace(/yy/g,function(t){return G(Nt(t)%100,2)}(t)).replace(/MMMM/g,function(t,i){return new Date(t.getUTCFullYear(),t.getUTCMonth(),1).toLocaleString(i,{month:"long"})}(t,n)).replace(/MMM/g,function(t,i){return new Date(t.getUTCFullYear(),t.getUTCMonth(),1).toLocaleString(i,{month:"short"})}(t,n)).replace(/MM/g,function(t){return G(function(t){return t.getUTCMonth()+1}(t),2)}(t)).replace(/dd/g,function(t){return G(function(t){return t.getUTCDate()}(t),2)}(t))}var Ct=function(){function t(t,i){void 0===t&&(t="yyyy-MM-dd"),void 0===i&&(i="default"),this.us=t,this.os=i;}return t.prototype.ls=function(t){return St(t,this.us,this.os)},t}(),At=function(){function t(t){this.fs=t||"%h:%m:%s";}return t.prototype.ls=function(t){return this.fs.replace("%h",G(t.getUTCHours(),2)).replace("%m",G(t.getUTCMinutes(),2)).replace("%s",G(t.getUTCSeconds(),2))},t}(),Dt={cs:"yyyy-MM-dd",vs:"%h:%m:%s",_s:" ",ds:"default"},Tt=function(){function t(t){void 0===t&&(t={});var i=u(u({},Dt),t);this.ws=new Ct(i.cs,i.ds),this.Ms=new At(i.vs),this.bs=i._s;}return t.prototype.ls=function(t){return ""+this.ws.ls(t)+this.bs+this.Ms.ls(t)},t}();var Lt=function(){function t(t,i){void 0===i&&(i=50),this.ps=0,this.gs=1,this.ys=1,this.ks=new Map,this.xs=new Map,this.Ns=t,this.Ss=i;}return t.prototype.ls=function(t){var i=void 0===t.Cs?new Date(1e3*t.As).getTime():new Date(Date.UTC(t.Cs.year,t.Cs.month-1,t.Cs.day)).getTime(),n=this.ks.get(i);if(void 0!==n)return n.Ds;if(this.ps===this.Ss){var h=this.xs.get(this.ys);this.xs.delete(this.ys),this.ks.delete(l(h)),this.ys++,this.ps--;}var s=this.Ns(t);return this.ks.set(i,{Ds:s,Ts:this.gs}),this.xs.set(this.gs,i),this.ps++,this.gs++,s},t}(),Bt=function(){function t(t,i){o(t<=i,"right should be >= left"),this.Ls=t,this.Bs=i;}return t.prototype.ss=function(){return this.Ls},t.prototype.rs=function(){return this.Bs},t.prototype.Es=function(){return this.Bs-this.Ls+1},t.prototype.Fs=function(t){return this.Ls<=t&&t<=this.Bs},t.prototype.on=function(t){return this.Ls===t.ss()&&this.Bs===t.rs()},t}();function Et(t,i){return null===t||null===i?t===i:t.on(i)}var Ft,Vt=function(){function t(){this.Vs=new Map,this.ks=null;}return t.prototype.Os=function(t){var i=this;this.ks=null,this.Vs.clear(),t.forEach((function(t,n){var h=i.Vs.get(t.zs);void 0===h&&(h=[],i.Vs.set(t.zs,h)),h.push({Ps:n,C:t.C,Rs:t.zs});}));},t.prototype.Is=function(t,i){var n=Math.ceil(i/t);return null!==this.ks&&this.ks.Ws===n||(this.ks={En:this.Us(n),Ws:n}),this.ks.En},t.prototype.Us=function(t){for(var i=[],n=0,h=Array.from(this.Vs.keys()).sort((function(t,i){return i-t}));n<h.length;n++){var s=h[n];if(this.Vs.get(s)){var r=i;i=[];for(var e=r.length,u=0,a=l(this.Vs.get(s)),o=a.length,f=1/0,c=-1/0,v=0;v<o;v++){for(var _=a[v],d=_.Ps;u<e;){var w=r[u],M=w.Ps;if(!(M<d)){f=M;break}u++,i.push(w),c=M,f=1/0;}f-d>=t&&d-c>=t&&(i.push(_),c=d);}for(;u<e;u++)i.push(r[u]);}}return i},t}(),Ot=function(){function t(t){this.js=t;}return t.prototype.qs=function(){return null===this.js?null:new Bt(Math.floor(this.js.ss()),Math.ceil(this.js.rs()))},t.prototype.Hs=function(){return this.js},t.Ys=function(){return new t(null)},t}();!function(t){t[t.Year=0]="Year",t[t.Month=1]="Month",t[t.DayOfMonth=2]="DayOfMonth",t[t.Time=3]="Time",t[t.TimeWithSeconds=4]="TimeWithSeconds";}(Ft||(Ft={}));var zt,Pt=function(){function t(t,i,n){this.Ks=0,this.$s=null,this.Xs=[],this.Xn=null,this.$n=null,this.Zs=new Vt,this.Js=new Map,this.Gs=Ot.Ys(),this.Qs=!0,this.tr=new it,this.ir=new it,this.nr=new it,this.hr=null,this.sr=null,this.rr=[],this.Ni=i,this.Qn=n,this.er=i.rightOffset,this.ur=i.barSpacing,this.si=t,this.ar();}return t.prototype.ct=function(){return this.Ni},t.prototype.lr=function(t){v(this.Qn,t),this.cr(),this.ar();},t.prototype.sh=function(t,i){var n;v(this.Ni,t),this.Ni.fixLeftEdge&&this.vr(),this.Ni.fixRightEdge&&this._r(),void 0!==t.barSpacing&&this.si.dr(t.barSpacing),void 0!==t.rightOffset&&this.si.wr(t.rightOffset),void 0!==t.minBarSpacing&&this.si.dr(null!==(n=t.barSpacing)&&void 0!==n?n:this.ur),this.cr(),this.ar(),this.nr.sn();},t.prototype.ri=function(t){var i;return (null===(i=this.Xs[t])||void 0===i?void 0:i.C)||null},t.prototype.Mr=function(t,i){if(this.Xs.length<1)return null;if(t.As>this.Xs[this.Xs.length-1].C.As)return i?this.Xs.length-1:null;for(var n=0;n<this.Xs.length;++n){if(t.As===this.Xs[n].C.As)return n;if(t.As<this.Xs[n].C.As)return i?n:null}return null},t.prototype.ti=function(){return 0===this.Ks||0===this.Xs.length},t.prototype.br=function(){return this.mr(),this.Gs.qs()},t.prototype.pr=function(){return this.mr(),this.Gs.Hs()},t.prototype.gr=function(){var t=this.br();if(null===t)return null;var i={from:t.ss(),to:t.rs()};return this.yr(i)},t.prototype.yr=function(t){var i=Math.round(t.from),n=Math.round(t.to),h=f(this.kr()),s=f(this.Nr());return {from:f(this.ri(Math.max(h,i))),to:f(this.ri(Math.min(s,n)))}},t.prototype.Sr=function(t){return {from:f(this.Mr(t.from,!0)),to:f(this.Mr(t.to,!0))}},t.prototype.Cr=function(){return this.Zs},t.prototype.wt=function(){return this.Ks},t.prototype.Ar=function(t){if(isFinite(t)&&!(t<=0)&&this.Ks!==t){if(this.Ni.lockVisibleTimeRangeOnResize&&this.Ks){var i=this.ur*t/this.Ks;this.ur=i;}if(this.Ni.fixLeftEdge){var n=this.br();if(null!==n)if(n.ss()<=0){var h=this.Ks-t;this.er-=Math.round(h/this.ur)+1;}}this.Ks=t,this.Qs=!0,this.Dr(),this.Tr();}},t.prototype.G=function(t){if(this.ti()||!d(t))return 0;var i=this.Lr()+this.er-t;return this.Ks-(i+.5)*this.ur-1},t.prototype.Br=function(t,i){for(var n=this.Lr(),h=void 0===i?0:i.from,s=void 0===i?t.length:i.to,r=h;r<s;r++){var e=t[r].C,u=n+this.er-e,a=this.Ks-(u+.5)*this.ur-1;t[r].p=a;}},t.prototype.Er=function(t){return Math.ceil(this.Fr(t))},t.prototype.wr=function(t){this.Qs=!0,this.er=t,this.Tr(),this.si.Vr(),this.si.Or();},t.prototype.zr=function(){return this.ur},t.prototype.dr=function(t){this.Pr(t),this.Tr(),this.si.Vr(),this.si.Or();},t.prototype.Rr=function(){return this.er},t.prototype.En=function(){if(this.ti())return null;if(null!==this.sr)return this.sr;for(var t=this.ur,i=5*(this.si.ct().layout.fontSize+4),n=Math.round(i/t),h=f(this.br()),s=Math.max(h.ss(),h.ss()-n),r=Math.max(h.rs(),h.rs()-n),e=this.Zs.Is(t,i),u=this.kr()+n,a=this.Nr()-n,o=0,l=0,c=e;l<c.length;l++){var v=c[l];if(s<=v.Ps&&v.Ps<=r){var _=this.ri(v.Ps);if(null!==_){var d=void 0;o<this.rr.length?((d=this.rr[o]).Dn=this.G(v.Ps),d.Tn=this.Ir(_,v.Rs),d.Rs=v.Rs):(d={Wr:!1,Dn:this.G(v.Ps),Tn:this.Ir(_,v.Rs),Rs:v.Rs},this.rr.push(d)),this.ur>i/2?d.Wr=!1:d.Wr=this.Ni.fixLeftEdge&&v.Ps<=u||this.Ni.fixRightEdge&&v.Ps>=a,o++;}}}return this.rr.length=o,this.sr=this.rr,this.rr},t.prototype.Ur=function(){this.Qs=!0,this.dr(this.Ni.barSpacing),this.wr(this.Ni.rightOffset);},t.prototype.jr=function(t){this.Qs=!0,this.$s=t,this.Tr(),this.vr();},t.prototype.qr=function(t,i){var n=this.Fr(t),h=this.zr(),s=h+i*(h/10);this.dr(s),this.Ni.rightBarStaysOnScroll||this.wr(this.Rr()+(n-this.Fr(t)));},t.prototype.Wh=function(t){this.Xn&&this.Yh(),null===this.$n&&null===this.hr&&(this.ti()||(this.$n=t,this.Hr()));},t.prototype.Uh=function(t){if(null!==this.hr){var i=ht(this.Ks-t,0,this.Ks),n=ht(this.Ks-f(this.$n),0,this.Ks);0!==i&&0!==n&&this.dr(this.hr.zr*i/n);}},t.prototype.jh=function(){null!==this.$n&&(this.$n=null,this.Yr());},t.prototype.qh=function(t){null===this.Xn&&null===this.hr&&(this.ti()||(this.Xn=t,this.Hr()));},t.prototype.Hh=function(t){if(null!==this.Xn){var i=(this.Xn-t)/this.zr();this.er=f(this.hr).Rr+i,this.Qs=!0,this.Tr();}},t.prototype.Yh=function(){null!==this.Xn&&(this.Xn=null,this.Yr());},t.prototype.Kr=function(){this.$r(this.Ni.rightOffset);},t.prototype.$r=function(t,i){var n=this;if(void 0===i&&(i=400),!isFinite(t))throw new RangeError("offset is required and must be finite number");if(!isFinite(i)||i<=0)throw new RangeError("animationDuration (optional) must be finite positive number");var h=this.er,s=performance.now(),r=function(){var e=(performance.now()-s)/i,u=e>=1,a=u?t:h+(t-h)*e;n.wr(a),u||setTimeout(r,20);};r();},t.prototype.O=function(t){this.Qs=!0,this.Xs=t,this.Zs.Os(t),this.Tr();},t.prototype.Xr=function(){return this.tr},t.prototype.Zr=function(){return this.ir},t.prototype.Jr=function(){return this.nr},t.prototype.Lr=function(){return this.$s||0},t.prototype.Gr=function(t){var i=t.Es();this.Pr(this.Ks/i),this.er=t.rs()-this.Lr(),this.Tr(),this.Qs=!0,this.si.Vr(),this.si.Or();},t.prototype.Qr=function(){var t=this.kr(),i=this.Nr();null!==t&&null!==i&&this.Gr(new Bt(t,i+this.Ni.rightOffset));},t.prototype.te=function(t){var i=new Bt(t.from,t.to);this.Gr(i);},t.prototype.ei=function(t){return void 0!==this.Qn.timeFormatter?this.Qn.timeFormatter(t.Cs||t.As):this.ie.ls(new Date(1e3*t.As))},t.prototype.kr=function(){return 0===this.Xs.length?null:0},t.prototype.Nr=function(){return 0===this.Xs.length?null:this.Xs.length-1},t.prototype.ne=function(t){return (this.Ks-1-t)/this.ur},t.prototype.Fr=function(t){var i=this.ne(t),n=this.Lr()+this.er-i;return Math.round(1e6*n)/1e6},t.prototype.Pr=function(t){var i=this.ur;this.ur=t,this.Dr(),i!==this.ur&&(this.Qs=!0,this.he());},t.prototype.mr=function(){if(this.Qs)if(this.Qs=!1,this.ti())this.se(Ot.Ys());else {var t=this.Lr(),i=this.Ks/this.ur,n=this.er+t,h=new Bt(n-i+1,n);this.se(new Ot(h));}},t.prototype.Dr=function(){var t=this.re();if(this.ur<t&&(this.ur=t,this.Qs=!0),0!==this.Ks){var i=.5*this.Ks;this.ur>i&&(this.ur=i,this.Qs=!0);}},t.prototype.re=function(){return this.Ni.fixLeftEdge&&this.Ni.fixRightEdge&&0!==this.Xs.length?this.Ks/this.Xs.length:this.Ni.minBarSpacing},t.prototype.Tr=function(){var t=this.ee();this.er>t&&(this.er=t,this.Qs=!0);var i=this.ue();null!==i&&this.er<i&&(this.er=i,this.Qs=!0);},t.prototype.ue=function(){var t=this.kr(),i=this.$s;return null===t||null===i?null:t-i-1+(this.Ni.fixLeftEdge?this.Ks/this.ur:Math.min(2,this.Xs.length))},t.prototype.ee=function(){return this.Ni.fixRightEdge?0:this.Ks/this.ur-Math.min(2,this.Xs.length)},t.prototype.Hr=function(){this.hr={zr:this.zr(),Rr:this.Rr()};},t.prototype.Yr=function(){this.hr=null;},t.prototype.Ir=function(t,i){var n=this,h=this.Js.get(i);return void 0===h&&(h=new Lt((function(t){return n.ae(t,i)})),this.Js.set(i,h)),h.ls(t)},t.prototype.ae=function(t,i){var n,h,s=this.Ni.timeVisible;return h=i<20&&s?this.Ni.secondsVisible?4:3:i<40&&s?3:i<50||i<60?2:i<70?1:0,void 0!==this.Ni.tickMarkFormatter?this.Ni.tickMarkFormatter(null!==(n=t.Cs)&&void 0!==n?n:t.As,h,this.Qn.locale):function(t,i,n){var h={};switch(i){case 0:h.year="numeric";break;case 1:h.month="short";break;case 2:h.day="numeric";break;case 3:h.hour12=!1,h.hour="2-digit",h.minute="2-digit";break;case 4:h.hour12=!1,h.hour="2-digit",h.minute="2-digit",h.second="2-digit";}var s=void 0===t.Cs?new Date(1e3*t.As):new Date(Date.UTC(t.Cs.year,t.Cs.month-1,t.Cs.day));return new Date(s.getUTCFullYear(),s.getUTCMonth(),s.getUTCDate(),s.getUTCHours(),s.getUTCMinutes(),s.getUTCSeconds(),s.getUTCMilliseconds()).toLocaleString(n,h)}(t,h,this.Qn.locale)},t.prototype.se=function(t){var i=this.Gs;this.Gs=t,Et(i.qs(),this.Gs.qs())||this.tr.sn(),Et(i.Hs(),this.Gs.Hs())||this.ir.sn(),this.he();},t.prototype.he=function(){this.sr=null;},t.prototype.cr=function(){this.he(),this.Js.clear();},t.prototype.ar=function(){var t=this.Qn.dateFormat;this.Ni.timeVisible?this.ie=new Tt({cs:t,vs:this.Ni.secondsVisible?"%h:%m:%s":"%h:%m",_s:"   ",ds:this.Qn.locale}):this.ie=new Ct(t,this.Qn.locale);},t.prototype.vr=function(){if(this.Ni.fixLeftEdge){var t=this.kr();if(null!==t){var i=this.br();if(null!==i){var n=i.ss()-t;if(n<0){var h=this.er-n-1;this.wr(h);}this.Dr();}}}},t.prototype._r=function(){this.Tr(),this.Dr();},t}();function Rt(t){return !_(t)&&!w(t)}function It(t){return _(t)}!function(t){t.Solid="solid",t.VerticalGradient="gradient";}(zt||(zt={}));var Wt="'Trebuchet MS', Roboto, Ubuntu, sans-serif";function Ut(t,i,n){return void 0!==n?n+=" ":n="",void 0===i&&(i=Wt),""+n+t+"px "+i}var jt=function(){function t(t){this.oe={Dt:1,At:4,zt:NaN,Nt:"",le:"",et:"",Lt:0,Bt:0,Et:0,Tt:0,Ot:0},this.F=t;}return t.prototype.ct=function(){var t=this.oe,i=this.fe(),n=this.ce();return t.zt===i&&t.le===n||(t.zt=i,t.le=n,t.Nt=Ut(i,n),t.Tt=Math.floor(i/3.5),t.Lt=t.Tt,t.Bt=Math.max(Math.ceil(i/2-t.At/2),0),t.Et=Math.ceil(i/2+t.At/2),t.Ot=Math.round(i/10)),t.et=this.ve(),this.oe},t.prototype.ve=function(){return this.F.ct().layout.textColor},t.prototype.fe=function(){return this.F.ct().layout.fontSize},t.prototype.ce=function(){return this.F.ct().layout.fontFamily},t}();function qt(t){return "left"===t||"right"===t}var Ht=function(){function t(t){this._e=new Map,this.de=!1,this.we=[],this.Me=t;}return t.prototype.be=function(t,i){var n=function(t,i){return void 0===t?i:{me:Math.max(t.me,i.me),_h:t._h||i._h}}(this._e.get(t),i);this._e.set(t,n);},t.prototype.pe=function(){return this.Me},t.prototype.ge=function(t){var i=this._e.get(t);return void 0===i?{me:this.Me}:{me:Math.max(this.Me,i.me),_h:i._h}},t.prototype.ye=function(){this.we=[{ke:0}];},t.prototype.xe=function(t){this.we=[{ke:1,X:t}];},t.prototype.Ne=function(){this.we=[{ke:4}];},t.prototype.dr=function(t){this.we.push({ke:2,X:t});},t.prototype.wr=function(t){this.we.push({ke:3,X:t});},t.prototype.Se=function(){return this.we},t.prototype._n=function(t){var i=this;this.de=this.de||t.de,this.we=this.we.concat(t.we);for(var n=0,h=t.we;n<h.length;n++){var s=h[n];this.Ce(s);}this.Me=Math.max(this.Me,t.Me),t._e.forEach((function(t,n){i.be(n,t);}));},t.prototype.Ce=function(t){switch(t.ke){case 0:this.ye();break;case 1:this.xe(t.X);break;case 2:this.dr(t.X);break;case 3:this.wr(t.X);break;case 4:this.Ne();}},t}(),Yt=function(){function t(t){this.Ae=t;}return t.prototype.format=function(t){var i="";return t<0&&(i="-",t=-t),t<995?i+this.De(t):t<999995?i+this.De(t/1e3)+"K":t<999999995?(t=1e3*Math.round(t/1e3),i+this.De(t/1e6)+"M"):(t=1e6*Math.round(t/1e6),i+this.De(t/1e9)+"B")},t.prototype.De=function(t){var i=Math.pow(10,this.Ae);return ((t=Math.round(t*i)/i)>=1e-15&&t<1?t.toFixed(this.Ae).replace(/\.?0+$/,""):String(t)).replace(/(\.[1-9]*)0+$/,(function(t,i){return i}))},t}();function Kt(t,i,n,h){if(0!==i.length){var s=i[h.from].p,r=i[h.from].g;t.moveTo(s,r);for(var e=h.from+1;e<h.to;++e){var u=i[e];if(1===n){var a=i[e-1].g,o=u.p;t.lineTo(o,a);}t.lineTo(u.p,u.g);}}}var $t=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.v=null,i}return e(i,t),i.prototype._=function(t){this.v=t;},i.prototype.u=function(t){if(null!==this.v&&0!==this.v.m.length&&null!==this.v.M){if(t.lineCap="butt",t.lineJoin="round",t.strokeStyle=this.v.S,t.lineWidth=this.v.rt,h(t,this.v.ut),t.lineWidth=1,t.beginPath(),1===this.v.m.length){var i=this.v.m[0],n=this.v.Te/2;t.moveTo(i.p-n,this.v.Le),t.lineTo(i.p-n,i.g),t.lineTo(i.p+n,i.g),t.lineTo(i.p+n,this.v.Le);}else t.moveTo(this.v.m[this.v.M.from].p,this.v.Le),t.lineTo(this.v.m[this.v.M.from].p,this.v.m[this.v.M.from].g),Kt(t,this.v.m,this.v.Be,this.v.M),this.v.M.to>this.v.M.from&&(t.lineTo(this.v.m[this.v.M.to-1].p,this.v.Le),t.lineTo(this.v.m[this.v.M.from].p,this.v.Le));t.closePath();var s=t.createLinearGradient(0,0,0,this.v.Le);s.addColorStop(0,this.v.Ee),s.addColorStop(1,this.v.Fe),t.fillStyle=s,t.fill();}},i}(y),Xt=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.v=null,i}return e(i,t),i.prototype._=function(t){this.v=t;},i.prototype.u=function(t){if(null!==this.v&&0!==this.v.m.length&&null!==this.v.M){if(t.lineCap="butt",t.lineWidth=this.v.rt,h(t,this.v.ut),t.strokeStyle=this.v.S,t.lineJoin="round",t.beginPath(),1===this.v.m.length){var i=this.v.m[0];t.moveTo(i.p-this.v.Te/2,i.g),t.lineTo(i.p+this.v.Te/2,i.g);}else Kt(t,this.v.m,this.v.Be,this.v.M);t.stroke();}},i}(y);function Zt(t,i,n,h,s){void 0===h&&(h=0),void 0===s&&(s=t.length);for(var r=s-h;0<r;){var e=r>>1,u=h+e;n(t[u],i)?(h=u+1,r-=e+1):r=e;}return h}function Jt(t,i,n,h,s){void 0===h&&(h=0),void 0===s&&(s=t.length);for(var r=s-h;0<r;){var e=r>>1,u=h+e;n(i,t[u])?r=e:(h=u+1,r-=e+1);}return h}function Gt(t,i){return t.C<i}function Qt(t,i){return t<i.C}function ti(t,i,n){var h=i.ss(),s=i.rs(),r=Zt(t,h,Gt),e=Jt(t,s,Qt);if(!n)return {from:r,to:e};var u=r,a=e;return r>0&&r<t.length&&t[r].C>=h&&(u=r-1),e>0&&e<t.length&&t[e-1].C<=s&&(a=e+1),{from:u,to:a}}var ii=function(){function t(t,i,n){this.Ve=!0,this.Oe=!0,this.ze=!0,this.Pe=[],this.Re=null,this.Ie=t,this.We=i,this.Ue=n;}return t.prototype.O=function(t){this.Ve=!0,"data"===t&&(this.Oe=!0),"options"===t&&(this.ze=!0);},t.prototype.je=function(){this.Oe&&(this.qe(),this.Oe=!1),this.Ve&&(this.He(),this.Ve=!1),this.ze&&(this.Ye(),this.ze=!1);},t.prototype.Ke=function(){this.Re=null;},t.prototype.He=function(){var t=this.Ie.$(),i=this.We.U();if(this.Ke(),!i.ti()&&!t.ti()){var n=i.br();if(null!==n&&0!==this.Ie.Hi().$e()){var h=this.Ie.H();null!==h&&(this.Re=ti(this.Pe,n,this.Ue),this.Xe(t,i,h.X));}}},t}(),ni=function(t){function i(i,n){return t.call(this,i,n,!0)||this}return e(i,t),i.prototype.Xe=function(t,i,n){i.Br(this.Pe,p(this.Re)),t.Sh(this.Pe,n,p(this.Re));},i.prototype.Ze=function(t,i){return {C:t,A:i,p:NaN,g:NaN}},i.prototype.Ye=function(){},i.prototype.qe=function(){var t=this,i=this.Ie.Je();this.Pe=this.Ie.Hi().Ge().map((function(n){var h=n.X[3];return t.Qe(n.Ps,h,i)}));},i}(ii),hi=function(t){function i(i,n){var h=t.call(this,i,n)||this;return h.ot=new g,h.tu=new $t,h.iu=new Xt,h.ot.i([h.tu,h.iu]),h}return e(i,t),i.prototype.R=function(t,i){if(!this.Ie.q())return null;var n=this.Ie.ct();this.je();var h={Be:n.lineType,m:this.Pe,S:n.lineColor,ut:n.lineStyle,rt:n.lineWidth,Ee:n.topColor,Fe:n.bottomColor,Le:t,M:this.Re,Te:this.We.U().zr()};return this.tu._(h),this.iu._(h),this.ot},i.prototype.Qe=function(t,i){return this.Ze(t,i)},i}(ni);var si=function(){function t(){this.tt=null,this.nu=0,this.hu=0;}return t.prototype._=function(t){this.tt=t;},t.prototype.h=function(t,i,n,h){if(null!==this.tt&&0!==this.tt.Hi.length&&null!==this.tt.M){if(this.nu=this.su(i),this.nu>=2)Math.max(1,Math.floor(i))%2!=this.nu%2&&this.nu--;this.hu=this.tt.ru?Math.min(this.nu,Math.floor(i)):this.nu;for(var s=null,r=this.hu<=this.nu&&this.tt.zr>=Math.floor(1.5*i),e=this.tt.M.from;e<this.tt.M.to;++e){var u=this.tt.Hi[e];s!==u.et&&(t.fillStyle=u.et,s=u.et);var a=Math.floor(.5*this.hu),o=Math.round(u.p*i),l=o-a,f=this.hu,c=l+f-1,v=Math.min(u.Th,u.Lh),_=Math.max(u.Th,u.Lh),d=Math.round(v*i)-a,w=Math.round(_*i)+a,M=Math.max(w-d,this.hu);t.fillRect(l,d,f,M);var b=Math.ceil(1.5*this.nu);if(r){if(this.tt.eu){var m=o-b,p=Math.max(d,Math.round(u.Dh*i)-a),g=p+f-1;g>d+M-1&&(p=(g=d+M-1)-f+1),t.fillRect(m,p,l-m,g-p+1);}var y=o+b,k=Math.max(d,Math.round(u.Bh*i)-a),x=k+f-1;x>d+M-1&&(k=(x=d+M-1)-f+1),t.fillRect(c+1,k,y-c,x-k+1);}}}},t.prototype.su=function(t){var i=Math.floor(t);return Math.max(i,Math.floor(function(t,i){return Math.floor(.3*t*i)}(f(this.tt).zr,t)))},t}(),ri=function(t){function i(i,n){return t.call(this,i,n,!1)||this}return e(i,t),i.prototype.Xe=function(t,i,n){i.Br(this.Pe,p(this.Re)),t.Ah(this.Pe,n,p(this.Re));},i.prototype.uu=function(t,i,n){return {C:t,open:i.X[0],high:i.X[1],low:i.X[2],close:i.X[3],p:NaN,Dh:NaN,Th:NaN,Lh:NaN,Bh:NaN}},i.prototype.qe=function(){var t=this,i=this.Ie.Je();this.Pe=this.Ie.Hi().Ge().map((function(n){return t.Qe(n.Ps,n,i)}));},i}(ii),ei=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.ot=new si,i}return e(i,t),i.prototype.R=function(t,i){if(!this.Ie.q())return null;var n=this.Ie.ct();this.je();var h={Hi:this.Pe,zr:this.We.U().zr(),eu:n.openVisible,ru:n.thinBars,M:this.Re};return this.ot._(h),this.ot},i.prototype.Ye=function(){var t=this;this.Pe.forEach((function(i){i.et=t.Ie.Je().ou(i.C).au;}));},i.prototype.Qe=function(t,i,n){return u(u({},this.uu(t,i,n)),{et:n.ou(t).au})},i}(ri),ui=function(){function t(){this.tt=null,this.nu=0;}return t.prototype._=function(t){this.tt=t;},t.prototype.h=function(t,i,n,h){if(null!==this.tt&&0!==this.tt.Hi.length&&null!==this.tt.M){if(this.nu=function(t,i){if(t>=2.5&&t<=4)return Math.floor(3*i);var n=1-.2*Math.atan(Math.max(4,t)-4)/(.5*Math.PI),h=Math.floor(t*n*i),s=Math.floor(t*i),r=Math.min(h,s);return Math.max(Math.floor(i),r)}(this.tt.zr,i),this.nu>=2)Math.floor(i)%2!=this.nu%2&&this.nu--;var s=this.tt.Hi;this.tt.lu&&this.fu(t,s,this.tt.M,i),this.tt.cu&&this.vu(t,s,this.tt.M,this.tt.zr,i);var r=this._u(i);(!this.tt.cu||this.nu>2*r)&&this.du(t,s,this.tt.M,i);}},t.prototype.fu=function(t,i,n,h){if(null!==this.tt){var s="",r=Math.min(Math.floor(h),Math.floor(this.tt.zr*h));r=Math.max(Math.floor(h),Math.min(r,this.nu));for(var e=Math.floor(.5*r),u=null,a=n.from;a<n.to;a++){var o=i[a];o.wu!==s&&(t.fillStyle=o.wu,s=o.wu);var l=Math.round(Math.min(o.Dh,o.Bh)*h),f=Math.round(Math.max(o.Dh,o.Bh)*h),c=Math.round(o.Th*h),v=Math.round(o.Lh*h),_=Math.round(h*o.p)-e,d=_+r-1;null!==u&&(_=Math.max(u+1,_),_=Math.min(_,d));var w=d-_+1;t.fillRect(_,c,w,l-c),t.fillRect(_,f+1,w,v-f),u=d;}}},t.prototype._u=function(t){var i=Math.floor(1*t);this.nu<=2*i&&(i=Math.floor(.5*(this.nu-1)));var n=Math.max(Math.floor(t),i);return this.nu<=2*n?Math.max(Math.floor(t),Math.floor(1*t)):n},t.prototype.vu=function(t,i,n,h,s){if(null!==this.tt)for(var r="",e=this._u(s),u=null,a=n.from;a<n.to;a++){var o=i[a];o.Z!==r&&(t.fillStyle=o.Z,r=o.Z);var l=Math.round(o.p*s)-Math.floor(.5*this.nu),f=l+this.nu-1,c=Math.round(Math.min(o.Dh,o.Bh)*s),v=Math.round(Math.max(o.Dh,o.Bh)*s);if(null!==u&&(l=Math.max(u+1,l),l=Math.min(l,f)),this.tt.zr*s>2*e)P(t,l,c,f-l+1,v-c+1,e);else {var _=f-l+1;t.fillRect(l,c,_,v-c+1);}u=f;}},t.prototype.du=function(t,i,n,h){if(null!==this.tt)for(var s="",r=this._u(h),e=n.from;e<n.to;e++){var u=i[e],a=Math.round(Math.min(u.Dh,u.Bh)*h),o=Math.round(Math.max(u.Dh,u.Bh)*h),l=Math.round(u.p*h)-Math.floor(.5*this.nu),f=l+this.nu-1;if(u.et!==s){var c=u.et;t.fillStyle=c,s=c;}this.tt.cu&&(l+=r,a+=r,f-=r,o-=r),a>o||t.fillRect(l,a,f-l+1,o-a+1);}},t}(),ai=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.ot=new ui,i}return e(i,t),i.prototype.R=function(t,i){if(!this.Ie.q())return null;var n=this.Ie.ct();this.je();var h={Hi:this.Pe,zr:this.We.U().zr(),lu:n.wickVisible,cu:n.borderVisible,M:this.Re};return this.ot._(h),this.ot},i.prototype.Ye=function(){var t=this;this.Pe.forEach((function(i){var n=t.Ie.Je().ou(i.C);i.et=n.au,i.wu=n.Mu,i.Z=n.bu;}));},i.prototype.Qe=function(t,i,n){var h=n.ou(t);return u(u({},this.uu(t,i,n)),{et:h.au,wu:h.Mu,Z:h.bu})},i}(ri),oi=function(){function t(){this.tt=null,this.mu=[];}return t.prototype._=function(t){this.tt=t,this.mu=[];},t.prototype.h=function(t,i,n,h){if(null!==this.tt&&0!==this.tt.m.length&&null!==this.tt.M){this.mu.length||this.pu(i);for(var s=Math.max(1,Math.floor(i)),r=Math.round(this.tt.gu*i)-Math.floor(s/2),e=r+s,u=this.tt.M.from;u<this.tt.M.to;u++){var a=this.tt.m[u],o=this.mu[u-this.tt.M.from],l=Math.round(a.g*i);t.fillStyle=a.et;var f=void 0,c=void 0;l<=r?(f=l,c=e):(f=r,c=l-Math.floor(s/2)+s),t.fillRect(o.ss,f,o.rs-o.ss+1,c-f);}}},t.prototype.pu=function(t){if(null!==this.tt&&0!==this.tt.m.length&&null!==this.tt.M){var i=Math.ceil(this.tt.zr*t)<=1?0:Math.max(1,Math.floor(t)),n=Math.round(this.tt.zr*t)-i;this.mu=new Array(this.tt.M.to-this.tt.M.from);for(var h=this.tt.M.from;h<this.tt.M.to;h++){var s,r=this.tt.m[h],e=Math.round(r.p*t),u=void 0,a=void 0;if(n%2)u=e-(s=(n-1)/2),a=e+s;else u=e-(s=n/2),a=e+s-1;this.mu[h-this.tt.M.from]={ss:u,rs:a,yu:e,ku:r.p*t,C:r.C};}for(h=this.tt.M.from+1;h<this.tt.M.to;h++){var o=this.mu[h-this.tt.M.from],l=this.mu[h-this.tt.M.from-1];o.C===l.C+1&&(o.ss-l.rs!==i+1&&(l.yu>l.ku?l.rs=o.ss-i-1:o.ss=l.rs+i+1));}var f=Math.ceil(this.tt.zr*t);for(h=this.tt.M.from;h<this.tt.M.to;h++){(o=this.mu[h-this.tt.M.from]).rs<o.ss&&(o.rs=o.ss);var c=o.rs-o.ss+1;f=Math.min(c,f);}if(i>0&&f<4)for(h=this.tt.M.from;h<this.tt.M.to;h++){(c=(o=this.mu[h-this.tt.M.from]).rs-o.ss+1)>f&&(o.yu>o.ku?o.rs-=1:o.ss+=1);}}else this.mu=[];},t}();function li(t){return {m:[],zr:t,gu:NaN,M:null}}function fi(t,i,n){return {C:t,A:i,p:NaN,g:NaN,et:n}}var ci=function(t){function i(i,n){var h=t.call(this,i,n,!1)||this;return h.D=new g,h.xu=li(0),h.ot=new oi,h}return e(i,t),i.prototype.R=function(t,i){return this.Ie.q()?(this.je(),this.D):null},i.prototype.qe=function(){var t=this.We.U().zr();this.xu=li(t);for(var i=0,n=0,h=this.Ie.ct().color,s=0,r=this.Ie.Hi().Ge();s<r.length;s++){var e=r[s],u=e.X[3],a=void 0!==e.et?e.et:h,o=fi(e.Ps,u,a);++i<this.xu.m.length?this.xu.m[i]=o:this.xu.m.push(o),this.Pe[n++]={C:e.Ps,p:0};}this.ot._(this.xu),this.D.i([this.ot]);},i.prototype.Ye=function(){},i.prototype.Ke=function(){t.prototype.Ke.call(this),this.xu.M=null;},i.prototype.Xe=function(t,i,n){if(null!==this.Re){var h=i.zr(),s=f(i.br()),r=t.K(this.Ie.ct().base,n);i.Br(this.xu.m),t.Sh(this.xu.m,n),this.xu.gu=r,this.xu.M=ti(this.xu.m,s,!1),this.xu.zr=h,this.ot._(this.xu);}},i}(ii),vi=function(t){function i(i,n){var h=t.call(this,i,n)||this;return h.iu=new Xt,h}return e(i,t),i.prototype.R=function(t,i){if(!this.Ie.q())return null;var n=this.Ie.ct();this.je();var h={m:this.Pe,S:n.color,ut:n.lineStyle,Be:n.lineType,rt:n.lineWidth,M:this.Re,Te:this.We.U().zr()};return this.iu._(h),this.iu},i.prototype.Qe=function(t,i){return this.Ze(t,i)},i}(ni),_i=/[2-9]/g,di=function(){function t(t){void 0===t&&(t=50),this.ks=new Map,this.Nu=0,this.Su=Array.from(new Array(t));}return t.prototype.Cu=function(){this.ks.clear(),this.Su.fill(void 0);},t.prototype.Vt=function(t,i,n){var h=n||_i,s=String(i).replace(h,"0"),r=this.ks.get(s);if(void 0===r){if(0===(r=t.measureText(s).width)&&0!==i.length)return 0;var e=this.Su[this.Nu];void 0!==e&&this.ks.delete(e),this.Su[this.Nu]=s,this.Nu=(this.Nu+1)%this.Su.length,this.ks.set(s,r);}return r},t}(),wi=function(){function t(t){this.Au=null,this.oe=null,this.Du="right",this.Ks=0,this.Tu=t;}return t.prototype.Lu=function(t,i,n,h){this.Au=t,this.oe=i,this.Ks=n,this.Du=h;},t.prototype.h=function(t,i){null!==this.oe&&null!==this.Au&&this.Au.h(t,this.oe,this.Tu,this.Ks,this.Du,i);},t}(),Mi=function(){function t(t,i,n){this.Bu=t,this.Tu=new di(50),this.Eu=i,this.F=n,this.fe=-1,this.ot=new wi(this.Tu);}return t.prototype.R=function(t,i){var n=this.F.Fu(this.Eu);if(null===n)return null;var h=n.Vu(this.Eu)?n.Ai():this.Eu.$();if(null===h)return null;var s=n.Ou(h);if("overlay"===s)return null;var r=this.F.zu();return r.zt!==this.fe&&(this.fe=r.zt,this.Tu.Cu()),this.ot.Lu(this.Bu.Zt(),r,i,s),this.ot},t}(),bi=function(){function t(){this.tt=null;}return t.prototype._=function(t){this.tt=t;},t.prototype.h=function(t,i,n,r){if(null!==this.tt&&!1!==this.tt.q){var e=Math.round(this.tt.g*i);if(!(e<0||e>Math.ceil(this.tt.Mt*i))){var u=Math.ceil(this.tt.wt*i);t.lineCap="butt",t.strokeStyle=this.tt.et,t.lineWidth=Math.floor(this.tt.rt*i),h(t,this.tt.ut),s(t,e,0,u);}}},t}(),mi=function(){function t(t){this.Pu={wt:0,Mt:0,g:0,et:"rgba(0, 0, 0, 0)",rt:1,ut:0,q:!1},this.Ru=new bi,this.B=!0,this.Ie=t,this.We=t.vt(),this.Ru._(this.Pu);}return t.prototype.O=function(){this.B=!0;},t.prototype.R=function(t,i){return this.Ie.q()?(this.B&&(this.Iu(t,i),this.B=!1),this.Ru):null},t}(),pi=function(t){function i(i){return t.call(this,i)||this}return e(i,t),i.prototype.Iu=function(t,i){this.Pu.q=!1;var n=this.Ie.$(),h=n.uh().uh;if(2===h||3===h){var s=this.Ie.ct();if(s.baseLineVisible&&this.Ie.q()){var r=this.Ie.H();null!==r&&(this.Pu.q=!0,this.Pu.g=n.K(r.X,r.X),this.Pu.wt=i,this.Pu.Mt=t,this.Pu.et=s.baseLineColor,this.Pu.rt=s.baseLineWidth,this.Pu.ut=s.baseLineStyle);}}},i}(mi),gi=function(){function t(){this.tt=null;}return t.prototype._=function(t){this.tt=t;},t.prototype.Wu=function(){return this.tt},t.prototype.h=function(t,i,n,h){var s=this.tt;if(null!==s){t.save();var r=Math.max(1,Math.floor(i)),e=r%2/2,u=Math.round(s.ku.x*i)+e,a=s.ku.y*i;t.fillStyle=s.Uu,t.beginPath();var o=Math.max(2,1.5*s.ju)*i;t.arc(u,a,o,0,2*Math.PI,!1),t.fill(),t.fillStyle=s.qu,t.beginPath(),t.arc(u,a,s.N*i,0,2*Math.PI,!1),t.fill(),t.lineWidth=r,t.strokeStyle=s.Hu,t.beginPath(),t.arc(u,a,s.N*i+r/2,0,2*Math.PI,!1),t.stroke(),t.restore();}},t}(),yi=[{Yu:0,Ku:.25,$u:4,Xu:10,Zu:.25,Ju:0,Gu:.4,Qu:.8},{Yu:.25,Ku:.525,$u:10,Xu:14,Zu:0,Ju:0,Gu:.8,Qu:0},{Yu:.525,Ku:1,$u:14,Xu:14,Zu:0,Ju:0,Gu:0,Qu:0}];function ki(t,i,n,h){return function(t,i){if("transparent"===t)return t;var n=O(t),h=n[3];return "rgba("+n[0]+", "+n[1]+", "+n[2]+", "+i*h+")"}(t,n+(h-n)*i)}function xi(t,i){for(var n,h=t%2600/2600,s=0,r=yi;s<r.length;s++){var e=r[s];if(h>=e.Yu&&h<=e.Ku){n=e;break}}o(void 0!==n,"Last price animation internal logic error");var u,a,l,f=(h-n.Yu)/(n.Ku-n.Yu);return {qu:ki(i,f,n.Zu,n.Ju),Hu:ki(i,f,n.Gu,n.Qu),N:(u=f,a=n.$u,l=n.Xu,a+(l-a)*u)}}var Ni=function(){function t(t){this.ot=new gi,this.B=!0,this.ta=!0,this.ia=performance.now(),this.na=this.ia-1,this.ha=t;}return t.prototype.O=function(t){if(this.B=!0,"data"===t&&2===this.ha.ct().lastPriceAnimation){var i=performance.now(),n=this.na-i;if(n>0)return void(n<650&&(this.na+=2600));this.ia=i,this.na=i+2600;}},t.prototype.sa=function(){this.ta=!0;},t.prototype.q=function(){return 0!==this.ha.ct().lastPriceAnimation},t.prototype.ra=function(){switch(this.ha.ct().lastPriceAnimation){case 0:return !1;case 1:return !0;case 2:return performance.now()<=this.na}},t.prototype.R=function(t,i){return this.B?(this.I(t,i),this.B=!1,this.ta=!1):this.ta&&(this.ea(),this.ta=!1),this.ot},t.prototype.I=function(t,i){this.ot._(null);var n=this.ha.vt().U(),h=n.br(),s=this.ha.H();if(null!==h&&null!==s){var r=this.ha.ua(!0,!0);if(h.Fs(r.Ps)){var e={x:n.G(r.Ps),y:this.ha.$().K(r.A,s.X)},u=r.et,a=this.ha.ct().lineWidth,o=xi(this.aa(),u);this.ot._({Uu:u,ju:a,qu:o.qu,Hu:o.Hu,N:o.N,ku:e});}}},t.prototype.ea=function(){var t=this.ot.Wu();if(null!==t){var i=xi(this.aa(),t.Uu);t.qu=i.qu,t.Hu=i.Hu,t.N=i.N;}},t.prototype.aa=function(){return this.ra()?performance.now()-this.ia:2599},t}();function Si(t,i){return ut(Math.min(Math.max(t,12),30)*i)}function Ci(t,i){switch(t){case"arrowDown":case"arrowUp":return Si(i,1);case"circle":return Si(i,.8);case"square":return Si(i,.7)}}function Ai(t){return et(Si(t,1))}function Di(t){return Math.max(Si(t,.1),3)}function Ti(t,i,n,h,s){var r=Ci("square",n),e=(r-1)/2,u=t-e,a=i-e;return h>=u&&h<=u+r&&s>=a&&s<=a+r}function Li(t,i,n,h,s){var r=(Ci("arrowUp",s)-1)/2,e=(ut(s/2)-1)/2;i.beginPath(),t?(i.moveTo(n-r,h),i.lineTo(n,h-r),i.lineTo(n+r,h),i.lineTo(n+e,h),i.lineTo(n+e,h+r),i.lineTo(n-e,h+r),i.lineTo(n-e,h)):(i.moveTo(n-r,h),i.lineTo(n,h+r),i.lineTo(n+r,h),i.lineTo(n+e,h),i.lineTo(n+e,h-r),i.lineTo(n-e,h-r),i.lineTo(n-e,h)),i.fill();}function Bi(t,i,n,h,s,r){return Ti(i,n,h,s,r)}var Ei=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.tt=null,i.Tu=new di,i.fe=-1,i.ce="",i.oa="",i}return e(i,t),i.prototype._=function(t){this.tt=t;},i.prototype.Lu=function(t,i){this.fe===t&&this.ce===i||(this.fe=t,this.ce=i,this.oa=Ut(t,i),this.Tu.Cu());},i.prototype.la=function(t,i){if(null===this.tt||null===this.tt.M)return null;for(var n=this.tt.M.from;n<this.tt.M.to;n++){var h=this.tt.m[n];if(Vi(h,t,i))return {fa:h.ca,va:h.va}}return null},i.prototype.u=function(t,i,n){if(null!==this.tt&&null!==this.tt.M){t.textBaseline="middle",t.font=this.oa;for(var h=this.tt.M.from;h<this.tt.M.to;h++){var s=this.tt.m[h];void 0!==s.Ft&&(s.Ft.wt=this.Tu.Vt(t,s.Ft._a),s.Ft.Mt=this.fe),Fi(s,t);}}},i}(y);function Fi(t,i){i.fillStyle=t.et,void 0!==t.Ft&&function(t,i,n,h){t.fillText(i,n,h);}(i,t.Ft._a,t.p-t.Ft.wt/2,t.Ft.g),function(t,i){if(0===t.$e)return;switch(t.da){case"arrowDown":return void Li(!1,i,t.p,t.g,t.$e);case"arrowUp":return void Li(!0,i,t.p,t.g,t.$e);case"circle":return void function(t,i,n,h){var s=(Ci("circle",h)-1)/2;t.beginPath(),t.arc(i,n,s,0,2*Math.PI,!1),t.fill();}(i,t.p,t.g,t.$e);case"square":return void function(t,i,n,h){var s=Ci("square",h),r=(s-1)/2,e=i-r,u=n-r;t.fillRect(e,u,s,s);}(i,t.p,t.g,t.$e)}t.da;}(t,i);}function Vi(t,i,n){return !(void 0===t.Ft||!function(t,i,n,h,s,r){var e=h/2;return s>=t&&s<=t+n&&r>=i-e&&r<=i+e}(t.p,t.Ft.g,t.Ft.wt,t.Ft.Mt,i,n))||function(t,i,n){if(0===t.$e)return !1;switch(t.da){case"arrowDown":case"arrowUp":return Bi(0,t.p,t.g,t.$e,i,n);case"circle":return function(t,i,n,h,s){var r=2+Ci("circle",n)/2,e=t-h,u=i-s;return Math.sqrt(e*e+u*u)<=r}(t.p,t.g,t.$e,i,n);case"square":return Ti(t.p,t.g,t.$e,i,n)}t.da;}(t,i,n)}function Oi(t,i,n,h,s,r,e,u,a){var o=_(n)?n:n.close,l=_(n)?n:n.high,f=_(n)?n:n.low,c=_(i.size)?Math.max(i.size,0):1,v=Ai(u.zr())*c,d=v/2;switch(t.$e=v,i.position){case"inBar":return t.g=e.K(o,a),void(void 0!==t.Ft&&(t.Ft.g=t.g+d+r+.6*s));case"aboveBar":return t.g=e.K(l,a)-d-h.wa,void 0!==t.Ft&&(t.Ft.g=t.g-d-.6*s,h.wa+=1.2*s),void(h.wa+=v+r);case"belowBar":return t.g=e.K(f,a)+d+h.Ma,void 0!==t.Ft&&(t.Ft.g=t.g+d+r+.6*s,h.Ma+=1.2*s),void(h.Ma+=v+r)}i.position;}var zi=function(){function t(t,i){this.B=!0,this.ba=!0,this.ma=!0,this.pa=null,this.ot=new Ei,this.ha=t,this.si=i,this.tt={m:[],M:null};}return t.prototype.O=function(t){this.B=!0,this.ma=!0,"data"===t&&(this.ba=!0);},t.prototype.R=function(t,i,n){if(!this.ha.q())return null;this.B&&this.je();var h=this.si.ct().layout;return this.ot.Lu(h.fontSize,h.fontFamily),this.ot._(this.tt),this.ot},t.prototype.ga=function(){if(this.ma){if(this.ha.ya().length>0){var t=this.si.U().zr(),i=Di(t),n=1.5*Ai(t)+2*i;this.pa={above:n,below:n};}else this.pa=null;this.ma=!1;}return this.pa},t.prototype.je=function(){var t=this.ha.$(),i=this.si.U(),n=this.ha.ya();this.ba&&(this.tt.m=n.map((function(t){return {C:t.time,p:0,g:0,$e:0,da:t.shape,et:t.color,ca:t.ca,va:t.id,Ft:void 0}})),this.ba=!1);var h=this.si.ct().layout;this.tt.M=null;var s=i.br();if(null!==s){var r=this.ha.H();if(null!==r&&0!==this.tt.m.length){var e=NaN,u=Di(i.zr()),a={wa:u,Ma:u};this.tt.M=ti(this.tt.m,s,!0);for(var o=this.tt.M.from;o<this.tt.M.to;o++){var l=n[o];l.time!==e&&(a.wa=u,a.Ma=u,e=l.time);var f=this.tt.m[o];f.p=i.G(l.time),void 0!==l.text&&l.text.length>0&&(f.Ft={_a:l.text,g:0,wt:0,Mt:0});var c=this.ha.ka(l.time);null!==c&&Oi(f,l,c,a,h.fontSize,u,t,i,r.X);}this.B=!1;}}},t}(),Pi=function(t){function i(i){return t.call(this,i)||this}return e(i,t),i.prototype.Iu=function(t,i){var n=this.Pu;n.q=!1;var h=this.Ie.ct();if(h.priceLineVisible&&this.Ie.q()){var s=this.Ie.ua(0===h.priceLineSource);s.xa||(n.q=!0,n.g=s.Pt,n.et=this.Ie.Na(s.et),n.wt=i,n.Mt=t,n.rt=h.priceLineWidth,n.ut=h.priceLineStyle);}},i}(mi),Ri=function(t){function i(i){var n=t.call(this)||this;return n.lt=i,n}return e(i,t),i.prototype.Jt=function(t,i,n){t.q=!1,i.q=!1;var h=this.lt;if(h.q()){var s=h.ct(),r=s.lastValueVisible,e=""!==h.Sa(),u=0===s.seriesLastValueMode,a=h.ua(!1);if(!a.xa){r&&(t.Ft=this.Ca(a,r,u),t.q=0!==t.Ft.length),(e||u)&&(i.Ft=this.Aa(a,r,e,u),i.q=i.Ft.length>0);var o=h.Na(a.et),l=z(o);n.yt=l.yt,n.et=l.kt,n.Pt=a.Pt,i.Z=h.vt().J(a.Pt/h.$().Mt()),t.Z=o;}}},i.prototype.Aa=function(t,i,n,h){var s="",r=this.lt.Sa();return n&&0!==r.length&&(s+=r+" "),i&&h&&(s+=this.lt.$().lh()?t.Da:t.Ta),s.trim()},i.prototype.Ca=function(t,i,n){return i?n?this.lt.$().lh()?t.Ta:t.Da:t.Ft:""},i}(q),Ii=function(){function t(t,i){this.On=t,this.La=i||null;}return t.prototype.kh=function(){return this.On},t.prototype.es=function(){return this.La},t.prototype.Mn=function(){return null===this.On?null:{priceRange:this.On.Mn(),margins:this.La||void 0}},t.bn=function(i){return null===i?null:new t(nt.bn(i.priceRange),i.margins)},t}(),Wi=function(t){function i(i,n){var h=t.call(this,i)||this;return h.Ba=n,h}return e(i,t),i.prototype.Iu=function(t,i){var n=this.Pu;if(n.q=!1,this.Ie.q()){var h=this.Ba.Ea();if(null!==h){var s=this.Ba.ct();n.q=!0,n.g=h,n.et=s.color,n.wt=i,n.Mt=t,n.rt=s.lineWidth,n.ut=s.lineStyle;}}},i}(mi),Ui=function(t){function i(i,n){var h=t.call(this)||this;return h.ha=i,h.Ba=n,h}return e(i,t),i.prototype.Jt=function(t,i,n){t.q=!1,i.q=!1;var h=this.Ba.ct(),s=h.axisLabelVisible,r=""!==h.title,e=this.ha;if(s&&e.q()){var u=this.Ba.Ea();if(null!==u){r&&(i.Ft=h.title,i.q=!0),i.Z=e.vt().J(u/e.$().Mt()),t.Ft=e.$().Xh(h.price),t.q=!0;var a=z(h.color);n.yt=a.yt,n.et=a.kt,n.Pt=u;}}},i}(q),ji=function(){function t(t,i){this.ha=t,this.Ni=i,this.Fa=new Wi(t,this),this.Bu=new Ui(t,this),this.Va=new Mi(this.Bu,t,t.vt());}return t.prototype.sh=function(t){v(this.Ni,t),this.O(),this.ha.vt().Or();},t.prototype.ct=function(){return this.Ni},t.prototype.vi=function(){return [this.Fa,this.Va]},t.prototype.Oa=function(){return this.Bu},t.prototype.O=function(){this.Fa.O(),this.Bu.O();},t.prototype.Ea=function(){var t=this.ha,i=t.$();if(t.vt().U().ti()||i.ti())return null;var n=t.H();return null===n?null:i.K(this.Ni.price,n.X)},t}(),qi=function(t){function i(i){var n=t.call(this)||this;return n.si=i,n}return e(i,t),i.prototype.vt=function(){return this.si},i}(X),Hi={au:"",bu:"",Mu:""},Yi=function(){function t(t){this.ha=t;}return t.prototype.ou=function(t,i){var n=this.ha.za(),h=this.ha.ct();switch(n){case"Line":return this.Pa(h);case"Area":return this.Ra(h);case"Bar":return this.Ia(h,t,i);case"Candlestick":return this.Wa(h,t,i);case"Histogram":return this.Ua(h,t,i)}throw new Error("Unknown chart style")},t.prototype.Ia=function(t,i,n){var h=u({},Hi),s=t.upColor,r=t.downColor,e=s,a=r,o=f(this.ja(i,n)),l=c(o.X[0])<=c(o.X[3]);return h.au=l?s:r,h.bu=l?e:a,h},t.prototype.Wa=function(t,i,n){var h=u({},Hi),s=t.upColor,r=t.downColor,e=t.borderUpColor,a=t.borderDownColor,o=t.wickUpColor,l=t.wickDownColor,v=f(this.ja(i,n)),_=c(v.X[0])<=c(v.X[3]);return h.au=_?s:r,h.bu=_?e:a,h.Mu=_?o:l,h},t.prototype.Ra=function(t){return u(u({},Hi),{au:t.lineColor})},t.prototype.Pa=function(t){return u(u({},Hi),{au:t.color})},t.prototype.Ua=function(t,i,n){var h=u({},Hi),s=f(this.ja(i,n));return h.au=void 0!==s.et?s.et:t.color,h},t.prototype.ja=function(t,i){return void 0!==i?i.X:this.ha.Hi().qa(t)},t}(),Ki=function(){function t(){this.Ha=[],this.Ya=new Map,this.Ka=new Map;}return t.prototype.$a=function(){this.Ha=[],this.Ya.clear(),this.Ka.clear();},t.prototype.Xa=function(){return this.$e()>0?this.Ha[this.Ha.length-1]:null},t.prototype.Za=function(){return this.$e()>0?this.Ja(0):null},t.prototype.qi=function(){return this.$e()>0?this.Ja(this.Ha.length-1):null},t.prototype.$e=function(){return this.Ha.length},t.prototype.ti=function(){return 0===this.$e()},t.prototype.Fs=function(t){return null!==this.Ga(t,0)},t.prototype.qa=function(t){return this.Qa(t)},t.prototype.Qa=function(t,i){void 0===i&&(i=0);var n=this.Ga(t,i);return null===n?null:u(u({},this.io(n)),{Ps:this.Ja(n)})},t.prototype.Ge=function(){return this.Ha},t.prototype.no=function(t,i,n){if(this.ti())return null;for(var h=null,s=0,r=n;s<r.length;s++){var e=r[s];h=$i(h,this.ho(t,i,e));}return h},t.prototype._n=function(t){0!==t.length&&(this.ti()||t[t.length-1].Ps<this.Ha[0].Ps?this.so(t):t[0].Ps>this.Ha[this.Ha.length-1].Ps?this.ro(t):1!==t.length||t[0].Ps!==this.Ha[this.Ha.length-1].Ps?this.eo(t):this.uo(t[0]));},t.prototype.Ja=function(t){return this.Ha[t].Ps},t.prototype.io=function(t){return this.Ha[t]},t.prototype.Ga=function(t,i){var n=this.ao(t);if(null===n&&0!==i)switch(i){case-1:return this.oo(t);case 1:return this.lo(t);default:throw new TypeError("Unknown search mode")}return n},t.prototype.oo=function(t){var i=this.fo(t);return i>0&&(i-=1),i!==this.Ha.length&&this.Ja(i)<t?i:null},t.prototype.lo=function(t){var i=this.co(t);return i!==this.Ha.length&&t<this.Ja(i)?i:null},t.prototype.ao=function(t){var i=this.fo(t);return i===this.Ha.length||t<this.Ha[i].Ps?null:i},t.prototype.fo=function(t){return Zt(this.Ha,t,(function(t,i){return t.Ps<i}))},t.prototype.co=function(t){return Jt(this.Ha,t,(function(t,i){return i.Ps>t}))},t.prototype.vo=function(t,i,n){for(var h=null,s=t;s<i;s++){var r=this.Ha[s].X[n];Number.isNaN(r)||(null===h?h={_o:r,do:r}:(r<h._o&&(h._o=r),r>h.do&&(h.do=r)));}return h},t.prototype.wo=function(t){var i=Math.floor(t.Ps/30);this.Ya.forEach((function(t){return t.delete(i)}));},t.prototype.so=function(t){o(0!==t.length,"plotRows should not be empty"),this.Ka.clear(),this.Ya.clear(),this.Ha=t.concat(this.Ha);},t.prototype.ro=function(t){o(0!==t.length,"plotRows should not be empty"),this.Ka.clear(),this.Ya.clear(),this.Ha=this.Ha.concat(t);},t.prototype.uo=function(t){o(!this.ti(),"plot list should not be empty"),o(this.Ha[this.Ha.length-1].Ps===t.Ps,"last row index should match new row index"),this.wo(t),this.Ka.delete(t.Ps),this.Ha[this.Ha.length-1]=t;},t.prototype.eo=function(t){o(0!==t.length,"plot rows should not be empty"),this.Ka.clear(),this.Ya.clear(),this.Ha=function(t,i){var n=function(t,i){var n=t.length,h=i.length,s=n+h,r=0,e=0;for(;r<n&&e<h;)t[r].Ps<i[e].Ps?r++:t[r].Ps>i[e].Ps?e++:(r++,e++,s--);return s}(t,i),h=new Array(n),s=0,r=0,e=t.length,u=i.length,a=0;for(;s<e&&r<u;)t[s].Ps<i[r].Ps?(h[a]=t[s],s++):t[s].Ps>i[r].Ps?(h[a]=i[r],r++):(h[a]=i[r],s++,r++),a++;for(;s<e;)h[a]=t[s],s++,a++;for(;r<u;)h[a]=i[r],r++,a++;return h}(this.Ha,t);},t.prototype.ho=function(t,i,n){if(this.ti())return null;var h=null,s=f(this.Za()),r=f(this.qi()),e=Math.max(t,s),u=Math.min(i,r),a=30*Math.ceil(e/30),o=Math.max(a,30*Math.floor(u/30)),l=this.fo(e),c=this.co(Math.min(u,a,i));h=$i(h,this.vo(l,c,n));var v=this.Ya.get(n);void 0===v&&(v=new Map,this.Ya.set(n,v));for(var _=Math.max(a+1,e);_<o;_+=30){var d=Math.floor(_/30),w=v.get(d);if(void 0===w){var M=this.fo(30*d),b=this.co(30*(d+1)-1);w=this.vo(M,b,n),v.set(d,w);}h=$i(h,w);}l=this.fo(o),c=this.co(u);return h=$i(h,this.vo(l,c,n))},t}();function $i(t,i){return null===t?i:null===i?t:{_o:Math.min(t._o,i._o),do:Math.max(t.do,i.do)}}var Xi=function(t){function i(i,n,h){var s=t.call(this,i)||this;s.tt=new Ki,s.Fa=new Pi(s),s.Mo=[],s.bo=new pi(s),s.mo=null,s.po=null,s.yo=[],s.ko=[],s.xo=null,s.Ni=n,s.No=h;var r=new Ri(s);return s.mi=[r],s.Va=new Mi(r,s,i),"Area"!==h&&"Line"!==h||(s.mo=new Ni(s)),s.So(),s.Co(),s}return e(i,t),i.prototype.en=function(){null!==this.xo&&clearTimeout(this.xo);},i.prototype.Na=function(t){return this.Ni.priceLineColor||t},i.prototype.ua=function(t,i){var n={xa:!0},h=this.$();if(this.vt().U().ti()||h.ti()||this.tt.ti())return n;var s,r,e=this.vt().U().br(),u=this.H();if(null===e||null===u)return n;if(t){var a=this.tt.Xa();if(null===a)return n;s=a,r=a.Ps;}else {var o=this.tt.Qa(e.rs(),-1);if(null===o)return n;if(null===(s=this.tt.qa(o.Ps)))return n;r=o.Ps;}var l=s.X[3],f=this.Je().ou(r,{X:s}),c=h.K(l,u.X);return {xa:!1,A:i?l:void 0,Ft:h.ii(l,u.X),Da:h.Xh(l),Ta:h.Jh(l,u.X),et:f.au,Pt:c,Ps:r}},i.prototype.Je=function(){return null!==this.po||(this.po=new Yi(this)),this.po},i.prototype.ct=function(){return this.Ni},i.prototype.sh=function(t){var i=t.priceScaleId;void 0!==i&&i!==this.Ni.priceScaleId&&this.vt().Ao(this,i),v(this.Ni,t),null!==this.ui&&void 0!==t.scaleMargins&&this.ui.sh({scaleMargins:t.scaleMargins}),void 0!==t.priceFormat&&this.So(),this.vt().Do(this),this.vt().To(),this.Li.O("options");},i.prototype.Lo=function(){this.tt.$a(),this.Co();},i.prototype.Bo=function(t,i){var n;i&&this.tt.$a(),this.tt._n(t),this.Eo(),this.Li.O("data"),this.Si.O("data"),null===(n=this.mo)||void 0===n||n.O("data");var h=this.vt().Fu(this);this.vt().Fo(h),this.vt().Do(this),this.vt().To(),this.vt().Or();},i.prototype.Vo=function(t){this.yo=t.map((function(t){return u({},t)})),this.Eo();var i=this.vt().Fu(this);this.Si.O("data"),this.vt().Fo(i),this.vt().Do(this),this.vt().To(),this.vt().Or();},i.prototype.ya=function(){return this.ko},i.prototype.Oo=function(t){var i=new ji(this,t);return this.Mo.push(i),this.vt().Do(this),i},i.prototype.zo=function(t){var i=this.Mo.indexOf(t);-1!==i&&this.Mo.splice(i,1),this.vt().Do(this);},i.prototype.za=function(){return this.No},i.prototype.H=function(){var t=this.Po();return null===t?null:{X:t.X[3],Rh:t.C}},i.prototype.Po=function(){var t=this.vt().U().br();if(null===t)return null;var i=t.ss();return this.tt.Qa(i,1)},i.prototype.Hi=function(){return this.tt},i.prototype.ka=function(t){var i=this.tt.qa(t);return null===i?null:"Bar"===this.No||"Candlestick"===this.No?{open:i.X[0],high:i.X[1],low:i.X[2],close:i.X[3]}:i.X[3]},i.prototype.Ro=function(t){var i=this,n=this.mo;return null!==n&&n.q()?(null===this.xo&&n.ra()&&(this.xo=setTimeout((function(){i.xo=null,i.vt().Io();}),0)),n.sa(),[n]):[]},i.prototype.vi=function(){var t=[];this.Wo()||t.push(this.bo);for(var i=0,n=this.Mo;i<n.length;i++){var h=n[i];t.push.apply(t,h.vi());}return t.push(this.Li,this.Fa,this.Va,this.Si),t},i.prototype.ci=function(t,i){if(i!==this.ui&&!this.Wo())return [];for(var n=a([],this.mi,!0),h=0,s=this.Mo;h<s.length;h++){var r=s[h];n.push(r.Oa());}return n},i.prototype.hs=function(t,i){var n=this;if(void 0!==this.Ni.autoscaleInfoProvider){var h=this.Ni.autoscaleInfoProvider((function(){var h=n.Uo(t,i);return null===h?null:h.Mn()}));return Ii.bn(h)}return this.Uo(t,i)},i.prototype.ts=function(){return this.Ni.priceFormat.minMove},i.prototype.Kh=function(){return this.Zn},i.prototype.Wi=function(){var t;this.Li.O(),this.Si.O();for(var i=0,n=this.mi;i<n.length;i++){n[i].O();}for(var h=0,s=this.Mo;h<s.length;h++){s[h].O();}this.Fa.O(),this.bo.O(),null===(t=this.mo)||void 0===t||t.O();},i.prototype.$=function(){return f(this.ui)},i.prototype.j=function(t){if(!(("Line"===this.No||"Area"===this.No)&&this.Ni.crosshairMarkerVisible))return null;var i=this.tt.qa(t);return null===i?null:{A:i.X[3],N:this.jo(),Z:this.qo(),Y:this.Ho(t)}},i.prototype.Sa=function(){return this.Ni.title},i.prototype.q=function(){return this.Ni.visible},i.prototype.Wo=function(){return !qt(this.$().hh())},i.prototype.Uo=function(t,i){if(!d(t)||!d(i)||this.tt.ti())return null;var n="Line"===this.No||"Area"===this.No||"Histogram"===this.No?[3]:[2,1],h=this.tt.no(t,i,n),s=null!==h?new nt(h._o,h.do):null;if("Histogram"===this.za()){var r=this.Ni.base,e=new nt(r,r);s=null!==s?s._n(e):e;}return new Ii(s,this.Si.ga())},i.prototype.jo=function(){switch(this.No){case"Line":case"Area":return this.Ni.crosshairMarkerRadius}return 0},i.prototype.qo=function(){switch(this.No){case"Line":case"Area":var t=this.Ni.crosshairMarkerBorderColor;if(0!==t.length)return t}return null},i.prototype.Ho=function(t){switch(this.No){case"Line":case"Area":var i=this.Ni.crosshairMarkerBackgroundColor;if(0!==i.length)return i}return this.Je().ou(t).au},i.prototype.So=function(){switch(this.Ni.priceFormat.type){case"custom":this.Zn={format:this.Ni.priceFormat.formatter};break;case"volume":this.Zn=new Yt(this.Ni.priceFormat.precision);break;case"percent":this.Zn=new tt(this.Ni.priceFormat.precision);break;default:var t=Math.pow(10,this.Ni.priceFormat.precision);this.Zn=new Q(t,this.Ni.priceFormat.minMove*t);}null!==this.ui&&this.ui.rh();},i.prototype.Eo=function(){var t=this,i=this.vt().U();if(i.ti()||0===this.tt.$e())this.ko=[];else {var n=f(this.tt.Za());this.ko=this.yo.map((function(h,s){var r=f(i.Mr(h.time,!0)),e=r<n?1:-1;return {time:f(t.tt.Qa(r,e)).Ps,position:h.position,shape:h.shape,color:h.color,id:h.id,ca:s,text:h.text,size:h.size}}));}},i.prototype.Co=function(){switch(this.Si=new zi(this,this.vt()),this.No){case"Bar":this.Li=new ei(this,this.vt());break;case"Candlestick":this.Li=new ai(this,this.vt());break;case"Line":this.Li=new vi(this,this.vt());break;case"Area":this.Li=new hi(this,this.vt());break;case"Histogram":this.Li=new ci(this,this.vt());break;default:throw Error("Unknown chart style assigned: "+this.No)}},i}(qi),Zi=function(){function t(t){this.Ni=t;}return t.prototype.Yo=function(t,i,n){var h=t;if(0===this.Ni.mode)return h;var s=n.Ai(),r=s.H();if(null===r)return h;var e=s.K(t,r),u=n.Fh().filter((function(t){return t instanceof Xi})).reduce((function(t,h){if(n.Vu(h)||!h.q())return t;var s=h.$(),r=h.Hi();if(s.ti()||!r.Fs(i))return t;var e=r.qa(i);if(null===e)return t;var u=c(h.H());return t.concat([s.K(e.X[3],u.X)])}),[]);if(0===u.length)return h;u.sort((function(t,i){return Math.abs(t-e)-Math.abs(i-e)}));var a=u[0];return h=s.Di(a,r)},t}(),Ji=function(){function t(){this.tt=null;}return t.prototype._=function(t){this.tt=t;},t.prototype.h=function(t,i,n,s){var r=this;if(null!==this.tt){var e=Math.max(1,Math.floor(i));t.lineWidth=e;var u=Math.ceil(this.tt.st*i),a=Math.ceil(this.tt.ht*i);!function(t,i){t.save(),t.lineWidth%2&&t.translate(.5,.5),i(),t.restore();}(t,(function(){var n=f(r.tt);if(n.Ko){t.strokeStyle=n.$o,h(t,n.Xo),t.beginPath();for(var s=0,o=n.Zo;s<o.length;s++){var l=o[s],c=Math.round(l.Dn*i);t.moveTo(c,-e),t.lineTo(c,u+e);}t.stroke();}if(n.Jo){t.strokeStyle=n.Go,h(t,n.Qo),t.beginPath();for(var v=0,_=n.tl;v<_.length;v++){var d=_[v],w=Math.round(d.Dn*i);t.moveTo(-e,w),t.lineTo(a+e,w);}t.stroke();}}));}},t}(),Gi=function(){function t(t){this.ot=new Ji,this.B=!0,this.di=t;}return t.prototype.O=function(){this.B=!0;},t.prototype.R=function(t,i){if(this.B){var n=this.di.vt().ct().grid,h={st:t,ht:i,Jo:n.horzLines.visible,Ko:n.vertLines.visible,Go:n.horzLines.color,$o:n.vertLines.color,Qo:n.horzLines.style,Xo:n.vertLines.style,tl:this.di.Ai().En(),Zo:this.di.vt().U().En()||[]};this.ot._(h),this.B=!1;}return this.ot},t}(),Qi=function(){function t(t){this.Li=new Gi(t);}return t.prototype.il=function(){return this.Li},t}(),tn=function(){function t(t,i){this.Hn=[],this.nl=new Map,this.Fn=0,this.Ks=0,this.hl=1e3,this.Yn=null,this.sl=new it,this.rl=t,this.si=i,this.el=new Qi(this);var n=i.ct();this.ul=this.al("left",n.leftPriceScale),this.ol=this.al("right",n.rightPriceScale),this.ul.bh().Ji(this.ll.bind(this,this.ul),this),this.ol.bh().Ji(this.ll.bind(this,this.ul),this),this.fl(n);}return t.prototype.fl=function(t){if(t.leftPriceScale&&this.ul.sh(t.leftPriceScale),t.rightPriceScale&&this.ol.sh(t.rightPriceScale),t.localization&&(this.ul.rh(),this.ol.rh()),t.overlayPriceScales)for(var i=0,n=Array.from(this.nl.values());i<n.length;i++){var h=f(n[i][0].$());h.sh(t.overlayPriceScales),t.localization&&h.rh();}},t.prototype.cl=function(t){switch(t){case"left":return this.ul;case"right":return this.ol}return this.nl.has(t)?l(this.nl.get(t))[0].$():null},t.prototype.en=function(){this.vt().vl().hn(this),this.ul.bh().hn(this),this.ol.bh().hn(this),this.Hn.forEach((function(t){t.en&&t.en();})),this.sl.sn();},t.prototype._l=function(){return this.hl},t.prototype.dl=function(t){this.hl=t;},t.prototype.vt=function(){return this.si},t.prototype.wt=function(){return this.Ks},t.prototype.Mt=function(){return this.Fn},t.prototype.Ar=function(t){this.Ks=t,this.wl();},t.prototype.mh=function(t){var i=this;this.Fn=t,this.ul.mh(t),this.ol.mh(t),this.Hn.forEach((function(n){if(i.Vu(n)){var h=n.$();null!==h&&h.mh(t);}})),this.wl();},t.prototype.Fh=function(){return this.Hn},t.prototype.Vu=function(t){var i=t.$();return null===i||this.ul!==i&&this.ol!==i},t.prototype.Oh=function(t,i,n){var h=void 0!==n?n:this.bl().Ml+1;this.ml(t,i,h);},t.prototype.Ph=function(t){var i=this.Hn.indexOf(t);o(-1!==i,"removeDataSource: invalid data source"),this.Hn.splice(i,1);var n=f(t.$()).hh();if(this.nl.has(n)){var h=l(this.nl.get(n)),s=h.indexOf(t);-1!==s&&(h.splice(s,1),0===h.length&&this.nl.delete(n));}var r=t.$();r&&r.Fh().indexOf(t)>=0&&r.Ph(t),null!==r&&(r.zh(),this.pl(r)),this.Yn=null;},t.prototype.Ou=function(t){return t===this.ul?"left":t===this.ol?"right":"overlay"},t.prototype.gl=function(){return this.ul},t.prototype.yl=function(){return this.ol},t.prototype.kl=function(t,i){t.Wh(i);},t.prototype.xl=function(t,i){t.Uh(i),this.wl();},t.prototype.Nl=function(t){t.jh();},t.prototype.Sl=function(t,i){t.qh(i);},t.prototype.Cl=function(t,i){t.Hh(i),this.wl();},t.prototype.Al=function(t){t.Yh();},t.prototype.wl=function(){this.Hn.forEach((function(t){t.Wi();}));},t.prototype.Ai=function(){var t=null;return this.si.ct().rightPriceScale.visible&&0!==this.ol.Fh().length?t=this.ol:this.si.ct().leftPriceScale.visible&&0!==this.ul.Fh().length?t=this.ul:0!==this.Hn.length&&(t=this.Hn[0].$()),null===t&&(t=this.ol),t},t.prototype.pl=function(t){null!==t&&t.oh()&&this.Dl(t);},t.prototype.Tl=function(t){var i=this.rl.br();t.eh({_h:!0}),null!==i&&t.Qh(i),this.wl();},t.prototype.Ll=function(){this.Dl(this.ul),this.Dl(this.ol);},t.prototype.Bl=function(){var t=this;this.pl(this.ul),this.pl(this.ol),this.Hn.forEach((function(i){t.Vu(i)&&t.pl(i.$());})),this.wl(),this.si.Or();},t.prototype.Vh=function(){return null===this.Yn&&(this.Yn=bt(this.Hn)),this.Yn},t.prototype.El=function(){return this.sl},t.prototype.Fl=function(){return this.el},t.prototype.Dl=function(t){var i=t.Gh();if(i&&i.length>0&&!this.rl.ti()){var n=this.rl.br();null!==n&&t.Qh(n);}t.Wi();},t.prototype.bl=function(){var t=this.Vh();if(0===t.length)return {Vl:0,Ml:0};for(var i=0,n=0,h=0;h<t.length;h++){var s=t[h].oi();null!==s&&(s<i&&(i=s),s>n&&(n=s));}return {Vl:i,Ml:n}},t.prototype.ml=function(t,i,n){var h=this.cl(i);if(null===h&&(h=this.al(i,this.si.ct().overlayPriceScales)),this.Hn.push(t),!qt(i)){var s=this.nl.get(i)||[];s.push(t),this.nl.set(i,s);}h.Oh(t),t.fi(h),t.li(n),this.pl(h),this.Yn=null;},t.prototype.ll=function(t,i,n){i.uh!==n.uh&&this.Dl(t);},t.prototype.al=function(t,i){var n=u({visible:!0,autoScale:!0},b(i)),h=new kt(t,n,this.si.ct().layout,this.si.ct().localization);return h.mh(this.Mt()),h},t}(),nn=function(t){function i(i){var n=t.call(this)||this;return n.Ol=new Map,n.tt=i,n}return e(i,t),i.prototype.u=function(t){},i.prototype.l=function(t){if(this.tt.q){t.save();for(var i=0,n=0,h=this.tt.zl;n<h.length;n++){if(0!==(a=h[n]).Ft.length){t.font=a.Nt;var s=this.Pl(t,a.Ft);s>this.tt.wt?a.qr=this.tt.wt/s:a.qr=1,i+=a.Rl*a.qr;}}var r=0;switch(this.tt.Il){case"top":r=0;break;case"center":r=Math.max((this.tt.Mt-i)/2,0);break;case"bottom":r=Math.max(this.tt.Mt-i,0);}t.fillStyle=this.tt.et;for(var e=0,u=this.tt.zl;e<u.length;e++){var a=u[e];t.save();var o=0;switch(this.tt.Wl){case"left":t.textAlign="left",o=a.Rl/2;break;case"center":t.textAlign="center",o=this.tt.wt/2;break;case"right":t.textAlign="right",o=this.tt.wt-1-a.Rl/2;}t.translate(o,r),t.textBaseline="top",t.font=a.Nt,t.scale(a.qr,a.qr),t.fillText(a.Ft,0,a.Ul),t.restore(),r+=a.Rl*a.qr;}t.restore();}},i.prototype.Pl=function(t,i){var n=this.jl(t.font),h=n.get(i);return void 0===h&&(h=t.measureText(i).width,n.set(i,h)),h},i.prototype.jl=function(t){var i=this.Ol.get(t);return void 0===i&&(i=new Map,this.Ol.set(t,i)),i},i}(y),hn=function(){function t(t){this.B=!0,this.at={q:!1,et:"",Mt:0,wt:0,zl:[],Il:"center",Wl:"center"},this.ot=new nn(this.at),this.lt=t;}return t.prototype.O=function(){this.B=!0;},t.prototype.R=function(t,i){return this.B&&(this.I(t,i),this.B=!1),this.ot},t.prototype.I=function(t,i){var n=this.lt.ct(),h=this.at;h.q=n.visible,h.q&&(h.et=n.color,h.wt=i,h.Mt=t,h.Wl=n.horzAlign,h.Il=n.vertAlign,h.zl=[{Ft:n.text,Nt:Ut(n.fontSize,n.fontFamily,n.fontStyle),Rl:1.2*n.fontSize,Ul:0,qr:0}]);},t}(),sn=function(t){function i(i,n){var h=t.call(this)||this;return h.Ni=n,h.Li=new hn(h),h}return e(i,t),i.prototype.vi=function(){return [this.Li]},i.prototype.ct=function(){return this.Ni},i.prototype.Wi=function(){this.Li.O();},i}(X),rn=function(){function t(t,i){this.ql=[],this.Hl=[],this.Ks=0,this.Yl=null,this.Kl=null,this.$l=new it,this.Xl=new it,this.Zl=null,this.Jl=t,this.Ni=i,this.Gl=new jt(this),this.rl=new Pt(this,i.timeScale,this.Ni.localization),this.V=new Z(this,i.crosshair),this.Ql=new Zi(i.crosshair),this.tf=new sn(this,i.watermark),this.if(),this.ql[0].dl(2e3),this.nf=this.hf(0),this.sf=this.hf(1);}return t.prototype.rf=function(){this.ef(new Ht(3));},t.prototype.Or=function(){this.ef(new Ht(2));},t.prototype.Io=function(){this.ef(new Ht(1));},t.prototype.Do=function(t){var i=this.uf(t);this.ef(i);},t.prototype.af=function(){return this.Kl},t.prototype.lf=function(t){var i=this.Kl;this.Kl=t,null!==i&&this.Do(i.ff),null!==t&&this.Do(t.ff);},t.prototype.ct=function(){return this.Ni},t.prototype.sh=function(t){v(this.Ni,t),this.ql.forEach((function(i){return i.fl(t)})),void 0!==t.timeScale&&this.rl.sh(t.timeScale),void 0!==t.localization&&this.rl.lr(t.localization),(t.leftPriceScale||t.rightPriceScale)&&this.$l.sn(),this.nf=this.hf(0),this.sf=this.hf(1),this.rf();},t.prototype.cf=function(t,i){var n=this.vf(t);null!==n&&(n.$.sh(i),this.$l.sn());},t.prototype.vf=function(t){for(var i=0,n=this.ql;i<n.length;i++){var h=n[i],s=h.cl(t);if(null!==s)return {ft:h,$:s}}return null},t.prototype.U=function(){return this.rl},t.prototype._f=function(){return this.ql},t.prototype.df=function(){return this.tf},t.prototype.wf=function(){return this.V},t.prototype.Mf=function(){return this.Xl},t.prototype.bf=function(t,i){t.mh(i),this.Vr();},t.prototype.Ar=function(t){this.Ks=t,this.rl.Ar(this.Ks),this.ql.forEach((function(i){return i.Ar(t)})),this.Vr();},t.prototype.if=function(t){var i=new tn(this.rl,this);void 0!==t?this.ql.splice(t,0,i):this.ql.push(i);var n=void 0===t?this.ql.length-1:t,h=new Ht(3);return h.be(n,{me:0,_h:!0}),this.ef(h),i},t.prototype.kl=function(t,i,n){t.kl(i,n);},t.prototype.xl=function(t,i,n){t.xl(i,n),this.To(),this.ef(this.mf(t,2));},t.prototype.Nl=function(t,i){t.Nl(i),this.ef(this.mf(t,2));},t.prototype.Sl=function(t,i,n){i.oh()||t.Sl(i,n);},t.prototype.Cl=function(t,i,n){i.oh()||(t.Cl(i,n),this.To(),this.ef(this.mf(t,2)));},t.prototype.Al=function(t,i){i.oh()||(t.Al(i),this.ef(this.mf(t,2)));},t.prototype.Tl=function(t,i){t.Tl(i),this.ef(this.mf(t,2));},t.prototype.pf=function(t){this.rl.Wh(t);},t.prototype.gf=function(t,i){var n=this.U();if(!n.ti()&&0!==i){var h=n.wt();t=Math.max(1,Math.min(t,h)),n.qr(t,i),this.Vr();}},t.prototype.yf=function(t){this.kf(0),this.xf(t),this.Nf();},t.prototype.Sf=function(t){this.rl.Uh(t),this.Vr();},t.prototype.Cf=function(){this.rl.jh(),this.Or();},t.prototype.kf=function(t){this.Yl=t,this.rl.qh(t);},t.prototype.xf=function(t){var i=!1;return null!==this.Yl&&Math.abs(t-this.Yl)>20&&(this.Yl=null,i=!0),this.rl.Hh(t),this.Vr(),i},t.prototype.Nf=function(){this.rl.Yh(),this.Or(),this.Yl=null;},t.prototype.P=function(){return this.Hl},t.prototype.Af=function(t,i,n){this.V.Bi(t,i);var h=NaN,s=this.rl.Er(t),r=this.rl.br();null!==r&&(s=Math.min(Math.max(r.ss(),s),r.rs()));var e=n.Ai(),u=e.H();null!==u&&(h=e.Di(i,u)),h=this.Ql.Yo(h,s,n),this.V.Oi(s,h,n),this.Io(),this.Xl.sn(this.V.W(),{x:t,y:i});},t.prototype.Df=function(){this.wf().Pi(),this.Io(),this.Xl.sn(null,null);},t.prototype.To=function(){var t=this.V.ft();if(null!==t){var i=this.V.Fi(),n=this.V.Vi();this.Af(i,n,t);}this.V.Wi();},t.prototype.Tf=function(t,i){var n=this.rl.ri(0);void 0!==i&&this.rl.O(i);var h=this.rl.ri(0),s=this.rl.Lr(),r=this.rl.br();if(null!==r&&null!==n&&null!==h){var e=r.Fs(s),u=n.As>h.As,a=null!==t&&t>s&&!u,o=e&&this.rl.ct().shiftVisibleRangeOnNewBar;if(a&&!o){var l=t-s;this.rl.wr(this.rl.Rr()-l);}}this.rl.jr(t);},t.prototype.Fo=function(t){null!==t&&t.Bl();},t.prototype.Fu=function(t){var i=this.ql.find((function(i){return i.Vh().includes(t)}));return void 0===i?null:i},t.prototype.Vr=function(){this.tf.Wi(),this.ql.forEach((function(t){return t.Bl()})),this.To();},t.prototype.en=function(){this.ql.forEach((function(t){return t.en()})),this.ql.length=0,this.Ni.localization.priceFormatter=void 0,this.Ni.localization.timeFormatter=void 0;},t.prototype.Lf=function(){return this.Gl},t.prototype.zu=function(){return this.Gl.ct()},t.prototype.vl=function(){return this.$l},t.prototype.Bf=function(t,i){var n=this.ql[0],h=this.Ef(i,t,n);return this.Hl.push(h),1===this.Hl.length?this.rf():this.Or(),h},t.prototype.Ff=function(t){var i=this.Fu(t),n=this.Hl.indexOf(t);o(-1!==n,"Series not found"),this.Hl.splice(n,1),f(i).Ph(t),t.en&&t.en();},t.prototype.Ao=function(t,i){var n=f(this.Fu(t));n.Ph(t);var h=this.vf(i);if(null===h){var s=t.oi();n.Oh(t,i,s);}else {s=h.ft===n?t.oi():void 0;h.ft.Oh(t,i,s);}},t.prototype.Qr=function(){var t=new Ht(2);t.ye(),this.ef(t);},t.prototype.Vf=function(t){var i=new Ht(2);i.xe(t),this.ef(i);},t.prototype.Ne=function(){var t=new Ht(2);t.Ne(),this.ef(t);},t.prototype.dr=function(t){var i=new Ht(2);i.dr(t),this.ef(i);},t.prototype.wr=function(t){var i=new Ht(2);i.wr(t),this.ef(i);},t.prototype.Of=function(){return this.Ni.rightPriceScale.visible?"right":"left"},t.prototype.zf=function(){return this.sf},t.prototype.Pf=function(){return this.nf},t.prototype.J=function(t){var i=this.sf,n=this.nf;if(i===n)return i;if(t=Math.max(0,Math.min(100,Math.round(100*t))),null===this.Zl||this.Zl.Ee!==n||this.Zl.Fe!==i)this.Zl={Ee:n,Fe:i,Rf:new Map};else {var h=this.Zl.Rf.get(t);if(void 0!==h)return h}var s=function(t,i,n){var h=O(t),s=h[0],r=h[1],e=h[2],u=h[3],a=O(i),o=a[0],l=a[1],f=a[2],c=a[3],v=[T(s+n*(o-s)),T(r+n*(l-r)),T(e+n*(f-e)),L(u+n*(c-u))];return "rgba("+v[0]+", "+v[1]+", "+v[2]+", "+v[3]+")"}(n,i,t/100);return this.Zl.Rf.set(t,s),s},t.prototype.mf=function(t,i){var n=new Ht(i);if(null!==t){var h=this.ql.indexOf(t);n.be(h,{me:i});}return n},t.prototype.uf=function(t,i){return void 0===i&&(i=2),this.mf(this.Fu(t),i)},t.prototype.ef=function(t){this.Jl&&this.Jl(t),this.ql.forEach((function(t){return t.Fl().il().O()}));},t.prototype.Ef=function(t,i,n){var h=new Xi(this,t,i),s=void 0!==t.priceScaleId?t.priceScaleId:this.Of();return n.Oh(h,s),qt(s)||h.sh(t),h},t.prototype.hf=function(t){var i=this.Ni.layout;return "gradient"===i.background.type?0===t?i.background.topColor:i.background.bottomColor:i.background.color},t}(),en=function(){function t(t,i){this.ht=t,this.st=i;}return t.prototype.on=function(t){return this.ht===t.ht&&this.st===t.st},t}();function un(t){return t.ownerDocument&&t.ownerDocument.defaultView&&t.ownerDocument.defaultView.devicePixelRatio||1}function an(t){var i=f(t.getContext("2d"));return i.setTransform(1,0,0,1,0,0),i}function on(t,i){var n=t.createElement("canvas"),h=un(n);return n.style.width=i.ht+"px",n.style.height=i.st+"px",n.width=i.ht*h,n.height=i.st*h,n}function ln(i,n){var h=f(i.ownerDocument).createElement("canvas");i.appendChild(h);var s=bindToDevicePixelRatio(h);return s.resizeCanvas({width:n.ht,height:n.st}),s}function fn(t,i){return t.If-i.If}function cn(t,i,n){var h=(t.If-i.If)/(t.C-i.C);return Math.sign(h)*Math.min(Math.abs(h),n)}var vn=function(){function t(t,i,n,h){this.Wf=null,this.Uf=null,this.jf=null,this.qf=null,this.Hf=null,this.Yf=0,this.Kf=0,this.$f=!1,this.Xf=t,this.Zf=i,this.Jf=n,this.Yi=h;}return t.prototype.Gf=function(t,i){if(null!==this.Wf){if(this.Wf.C===i)return void(this.Wf.If=t);if(Math.abs(this.Wf.If-t)<this.Yi)return}this.qf=this.jf,this.jf=this.Uf,this.Uf=this.Wf,this.Wf={C:i,If:t};},t.prototype.Yu=function(t,i){if(null!==this.Wf&&null!==this.Uf&&!(i-this.Wf.C>50)){var n=0,h=cn(this.Wf,this.Uf,this.Zf),s=fn(this.Wf,this.Uf),r=[h],e=[s];if(n+=s,null!==this.jf){var u=cn(this.Uf,this.jf,this.Zf);if(Math.sign(u)===Math.sign(h)){var a=fn(this.Uf,this.jf);if(r.push(u),e.push(a),n+=a,null!==this.qf){var o=cn(this.jf,this.qf,this.Zf);if(Math.sign(o)===Math.sign(h)){var l=fn(this.jf,this.qf);r.push(o),e.push(l),n+=l;}}}}for(var f,c,v,_=0,d=0;d<r.length;++d)_+=e[d]/n*r[d];if(!(Math.abs(_)<this.Xf))this.Hf={If:t,C:i},this.Kf=_,this.Yf=(f=Math.abs(_),c=this.Jf,v=Math.log(c),Math.log(1*v/-f)/v);}},t.prototype.Qf=function(t){var i=f(this.Hf),n=t-i.C;return i.If+this.Kf*(Math.pow(this.Jf,n)-1)/Math.log(this.Jf)},t.prototype.tc=function(t){return null===this.Hf||this.ic(t)===this.Yf},t.prototype.nc=function(){return this.$f},t.prototype.hc=function(){this.$f=!0;},t.prototype.ic=function(t){var i=t-f(this.Hf).C;return Math.min(i,this.Yf)},t}(),_n="undefined"!=typeof window;var dn=function(){if(!_n)return !1;var t=!!navigator.maxTouchPoints||!!navigator.msMaxTouchPoints||!!_n&&("ontouchstart"in window||Boolean(window.DocumentTouch&&document instanceof window.DocumentTouch));return "onorientationchange"in window&&t}();var wn=function(){if(!_n)return !1;var t=/Android/i.test(navigator.userAgent),i=/iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);return t||i}(),Mn=function(){function t(t,i,n){this.sc=0,this.rc=null,this.ec=null,this.uc=!1,this.ac=null,this.oc=!1,this.lc=!1,this.fc=null,this.cc=null,this.vc=null,this._c=null,this.dc=0,this.wc=!1,this.Mc=!1,this.bc=!1,this.mc=t,this.gc=i,this.Ni=n,this.yc();}return t.prototype.en=function(){null!==this.fc&&(this.fc(),this.fc=null),null!==this.cc&&(this.cc(),this.cc=null),null!==this.vc&&(this.vc(),this.vc=null),this.kc(),this.xc();},t.prototype.Nc=function(t){var i=this;this.cc&&this.cc();var n=this.Sc.bind(this);this.cc=function(){i.mc.removeEventListener("mousemove",n);},this.mc.addEventListener("mousemove",n),pn(t)&&this.Sc(t);var h=this.Cc(t);this.Ac(h,this.gc.Dc);},t.prototype.xc=function(){null!==this.rc&&clearTimeout(this.rc),this.sc=0,this.rc=null;},t.prototype.Sc=function(t){if(!this.bc||pn(t)){var i=this.Cc(t);this.Ac(i,this.gc.Tc);}},t.prototype.Lc=function(t){if((!("button"in t)||0===t.button)&&null===this._c){var i=pn(t);if(!this.Mc||!i){this.wc=!0;var n=this.Cc(t),h=c(this.ac),s=Math.abs(h.p-n.Bc),r=Math.abs(h.g-n.Ec),e=s+r>5;if(e||!i){if(e&&!this.oc&&i){var u=.5*s,a=r>=u&&!this.Ni.Fc,o=u>r&&!this.Ni.Vc;a||o||(this.Mc=!0);}e&&(this.oc=!0,this.lc=!0,i&&this.kc()),this.Mc||(this.Ac(n,this.gc.Oc),i&&gn(t));}}}},t.prototype.zc=function(t){if(!("button"in t)||0===t.button){var i=this.Cc(t);this.kc(),this.ac=null,this.bc=!1,this.vc&&(this.vc(),this.vc=null),pn(t)&&this.Pc(t),this.Ac(i,this.gc.Rc),++this.sc,this.rc&&this.sc>1?(this.Ac(i,this.gc.Ic),this.xc()):this.lc||this.Ac(i,this.gc.Wc),pn(t)&&(gn(t),this.Pc(t),0===t.touches.length&&(this.uc=!1));}},t.prototype.kc=function(){null!==this.ec&&(clearTimeout(this.ec),this.ec=null);},t.prototype.Uc=function(t){if(!("button"in t)||0===t.button){var i=this.Cc(t);this.lc=!1,this.oc=!1,this.Mc=!1,pn(t)&&this.Nc(t),this.ac={p:i.Bc,g:i.Ec},this.vc&&(this.vc(),this.vc=null);var n=this.Lc.bind(this),h=this.zc.bind(this),s=this.mc.ownerDocument.documentElement;this.vc=function(){s.removeEventListener("touchmove",n),s.removeEventListener("touchend",h),s.removeEventListener("mousemove",n),s.removeEventListener("mouseup",h);},s.addEventListener("touchmove",n,{passive:!1}),s.addEventListener("touchend",h,{passive:!1}),this.kc(),pn(t)&&1===t.touches.length?this.ec=setTimeout(this.jc.bind(this,t),240):(s.addEventListener("mousemove",n),s.addEventListener("mouseup",h)),this.bc=!0,this.Ac(i,this.gc.qc),this.rc||(this.sc=0,this.rc=setTimeout(this.xc.bind(this),500));}},t.prototype.yc=function(){var t=this;this.mc.addEventListener("mouseenter",this.Nc.bind(this)),this.mc.addEventListener("touchcancel",this.kc.bind(this));var i=this.mc.ownerDocument,n=function(i){t.gc.Hc&&(i.composed&&t.mc.contains(i.composedPath()[0])||i.target&&t.mc.contains(i.target)||t.gc.Hc());};this.fc=function(){i.removeEventListener("mousedown",n),i.removeEventListener("touchstart",n);},i.addEventListener("mousedown",n),i.addEventListener("touchstart",n,{passive:!0}),this.mc.addEventListener("mouseleave",this.Pc.bind(this)),this.mc.addEventListener("touchstart",this.Uc.bind(this),{passive:!0}),dn||this.mc.addEventListener("mousedown",this.Uc.bind(this)),this.Yc(),this.mc.addEventListener("touchmove",(function(){}),{passive:!1});},t.prototype.Yc=function(){var t=this;void 0===this.gc.Kc&&void 0===this.gc.$c&&void 0===this.gc.Xc||(this.mc.addEventListener("touchstart",(function(i){return t.Zc(i.touches)}),{passive:!0}),this.mc.addEventListener("touchmove",(function(i){if(2===i.touches.length&&null!==t._c&&void 0!==t.gc.$c){var n=mn(i.touches[0],i.touches[1])/t.dc;t.gc.$c(t._c,n),gn(i);}}),{passive:!1}),this.mc.addEventListener("touchend",(function(i){t.Zc(i.touches);})));},t.prototype.Zc=function(t){1===t.length&&(this.wc=!1),2!==t.length||this.wc||this.uc?this.Jc():this.Gc(t);},t.prototype.Gc=function(t){var i=bn(this.mc);this._c={p:(t[0].clientX-i.left+(t[1].clientX-i.left))/2,g:(t[0].clientY-i.top+(t[1].clientY-i.top))/2},this.dc=mn(t[0],t[1]),void 0!==this.gc.Kc&&this.gc.Kc(),this.kc();},t.prototype.Jc=function(){null!==this._c&&(this._c=null,void 0!==this.gc.Xc&&this.gc.Xc());},t.prototype.Pc=function(t){this.cc&&this.cc();var i=this.Cc(t);this.Ac(i,this.gc.Qc);},t.prototype.jc=function(t){var i=this.Cc(t);this.Ac(i,this.gc.tv),this.lc=!0,this.uc=!0;},t.prototype.Ac=function(t,i){i&&i.call(this.gc,t);},t.prototype.Cc=function(t){var i;i="touches"in t&&t.touches.length?t.touches[0]:"changedTouches"in t&&t.changedTouches.length?t.changedTouches[0]:t;var n=bn(this.mc);return {iv:i.clientX,nv:i.clientY,Bc:i.pageX,Ec:i.pageY,hv:i.screenX,sv:i.screenY,rv:i.clientX-n.left,ev:i.clientY-n.top,uv:t.ctrlKey,av:t.altKey,ov:t.shiftKey,lv:t.metaKey,ke:t.type.startsWith("mouse")?"mouse":"touch",fv:t.view}},t}();function bn(t){return t.getBoundingClientRect()||{left:0,top:0}}function mn(t,i){var n=t.clientX-i.clientX,h=t.clientY-i.clientY;return Math.sqrt(n*n+h*h)}function pn(t){return Boolean(t.touches)}function gn(t){t.cancelable&&t.preventDefault();}var yn=function(){function t(t,i,n,h){this.Tu=new di(200),this.fe=0,this.cv="",this.oa="",this.Su=[],this.vv=new Map,this.fe=t,this.cv=i,this.oa=Ut(t,n,h);}return t.prototype.en=function(){this.Tu.Cu(),this.Su=[],this.vv.clear();},t.prototype._v=function(t,i,n,h,s){var r=this.dv(t,i);if("left"!==s){var e=un(t.canvas);n-=Math.floor(r.wv*e);}h-=Math.floor(r.Mt/2),t.drawImage(r.Mv,n,h,r.wt,r.Mt);},t.prototype.dv=function(t,i){var n,h=this;if(this.vv.has(i))n=l(this.vv.get(i));else {if(this.Su.length>=200){var s=l(this.Su.shift());this.vv.delete(s);}var r=un(t.canvas),e=Math.ceil(this.fe/4.5),u=Math.round(this.fe/10),a=Math.ceil(this.Tu.Vt(t,i)),o=et(Math.round(a+2*e)),f=et(this.fe+2*e),c=on(document,new en(o,f));n={Ft:i,wv:Math.round(Math.max(1,a)),wt:Math.ceil(o*r),Mt:Math.ceil(f*r),Mv:c},0!==a&&(this.Su.push(n.Ft),this.vv.set(n.Ft,n)),R(t=an(n.Mv),r,(function(){t.font=h.oa,t.fillStyle=h.cv,t.fillText(i,0,f-e-u);}));}return n},t}(),kn=function(){function t(t,i,n,h){var s=this;this.Gt=null,this.bv=null,this.mv=null,this.pv=!1,this.gv=new di(50),this.yv=new yn(11,"#000"),this.cv=null,this.oa=null,this.kv=0,this.xv=function(){s.Nv(s.Gl.ct()),s.di.Sv().vt().Or();},this.Cv=function(){s.di.Sv().vt().Or();},this.di=t,this.Ni=i,this.Gl=n,this.Av="left"===h,this.Dv=document.createElement("div"),this.Dv.style.height="100%",this.Dv.style.overflow="hidden",this.Dv.style.width="25px",this.Dv.style.left="0",this.Dv.style.position="relative",this.Tv=ln(this.Dv,new en(16,16)),this.Tv.subscribeCanvasConfigured(this.xv);var r=this.Tv.canvas;r.style.position="absolute",r.style.zIndex="1",r.style.left="0",r.style.top="0",this.Lv=ln(this.Dv,new en(16,16)),this.Lv.subscribeCanvasConfigured(this.Cv);var e=this.Lv.canvas;e.style.position="absolute",e.style.zIndex="2",e.style.left="0",e.style.top="0";var u={qc:this.Bv.bind(this),Oc:this.Ev.bind(this),Hc:this.Fv.bind(this),Rc:this.Vv.bind(this),Ic:this.Ov.bind(this),Dc:this.zv.bind(this),Qc:this.Pv.bind(this)};this.Rv=new Mn(this.Lv.canvas,u,{Fc:!1,Vc:!0});}return t.prototype.en=function(){this.Rv.en(),this.Lv.unsubscribeCanvasConfigured(this.Cv),this.Lv.destroy(),this.Tv.unsubscribeCanvasConfigured(this.xv),this.Tv.destroy(),null!==this.Gt&&this.Gt.Ih().hn(this),this.Gt=null,null!==this.mv&&(clearTimeout(this.mv),this.mv=null),this.yv.en();},t.prototype.Iv=function(){return this.Dv},t.prototype.S=function(){return f(this.Gt).ct().borderColor},t.prototype.Wv=function(){return this.Ni.textColor},t.prototype.zt=function(){return this.Ni.fontSize},t.prototype.Uv=function(){return Ut(this.zt(),this.Ni.fontFamily)},t.prototype.jv=function(){var t=this.Gl.ct(),i=this.cv!==t.et,n=this.oa!==t.Nt;return (i||n)&&(this.Nv(t),this.cv=t.et),n&&(this.gv.Cu(),this.oa=t.Nt),t},t.prototype.qv=function(){if(null===this.Gt)return 0;var t=34,i=this.jv(),n=an(this.Tv.canvas),h=this.Gt.En();n.font=this.Uv(),h.length>0&&(t=Math.max(this.gv.Vt(n,h[0].Tn),this.gv.Vt(n,h[h.length-1].Tn)));for(var s=this.Hv(),r=s.length;r--;){var e=this.gv.Vt(n,s[r].Ft());e>t&&(t=e);}var u=this.Gt.H();if(null!==u&&null!==this.bv){var a=this.Gt.Di(1,u),o=this.Gt.Di(this.bv.st-2,u);t=Math.max(t,this.gv.Vt(n,this.Gt.ii(Math.floor(Math.min(a,o))+.11111111111111,u)),this.gv.Vt(n,this.Gt.ii(Math.ceil(Math.max(a,o))-.11111111111111,u)));}var l=Math.ceil(i.Dt+i.At+i.Bt+i.Et+t);return l+=l%2},t.prototype.Yv=function(t){if(t.ht<0||t.st<0)throw new Error("Try to set invalid size to PriceAxisWidget "+JSON.stringify(t));null!==this.bv&&this.bv.on(t)||(this.bv=t,this.Tv.resizeCanvas({width:t.ht,height:t.st}),this.Lv.resizeCanvas({width:t.ht,height:t.st}),this.Dv.style.width=t.ht+"px",this.Dv.style.height=t.st+"px",this.Dv.style.minWidth=t.ht+"px");},t.prototype.Kv=function(){return f(this.bv).ht},t.prototype.fi=function(t){this.Gt!==t&&(null!==this.Gt&&this.Gt.Ih().hn(this),this.Gt=t,t.Ih().Ji(this.jn.bind(this),this));},t.prototype.$=function(){return this.Gt},t.prototype.Cu=function(){var t=this.di.$v();this.di.Sv().vt().Tl(t,f(this.$()));},t.prototype.Xv=function(t){if(null!==this.bv){if(1!==t){var i=an(this.Tv.canvas);this.Zv(),this.Jv(i,this.Tv.pixelRatio),this.vu(i,this.Tv.pixelRatio),this.Gv(i,this.Tv.pixelRatio),this.Qv(i,this.Tv.pixelRatio);}var n=an(this.Lv.canvas),h=this.bv.ht,s=this.bv.st;R(n,this.Lv.pixelRatio,(function(){n.clearRect(0,0,h,s);})),this.t_(n,this.Lv.pixelRatio);}},t.prototype.i_=function(){return this.Tv.canvas},t.prototype.Bv=function(t){if(null!==this.Gt&&!this.Gt.ti()&&this.di.Sv().ct().handleScale.axisPressedMouseMove.price){var i=this.di.Sv().vt(),n=this.di.$v();this.pv=!0,i.kl(n,this.Gt,t.ev);}},t.prototype.Ev=function(t){if(null!==this.Gt&&this.di.Sv().ct().handleScale.axisPressedMouseMove.price){var i=this.di.Sv().vt(),n=this.di.$v(),h=this.Gt;i.xl(n,h,t.ev);}},t.prototype.Fv=function(){if(null!==this.Gt&&this.di.Sv().ct().handleScale.axisPressedMouseMove.price){var t=this.di.Sv().vt(),i=this.di.$v(),n=this.Gt;this.pv&&(this.pv=!1,t.Nl(i,n));}},t.prototype.Vv=function(t){if(null!==this.Gt&&this.di.Sv().ct().handleScale.axisPressedMouseMove.price){var i=this.di.Sv().vt(),n=this.di.$v();this.pv=!1,i.Nl(n,this.Gt);}},t.prototype.Ov=function(t){this.di.Sv().ct().handleScale.axisDoubleClickReset&&this.Cu();},t.prototype.zv=function(t){null!==this.Gt&&(!this.di.Sv().vt().ct().handleScale.axisPressedMouseMove.price||this.Gt.lh()||this.Gt.fh()||this.n_(1));},t.prototype.Pv=function(t){this.n_(0);},t.prototype.Hv=function(){var t=this,i=[],n=null===this.Gt?void 0:this.Gt;return function(h){for(var s=0;s<h.length;++s)for(var r=h[s].ci(t.di.$v(),n),e=0;e<r.length;e++)i.push(r[e]);}(this.di.$v().Vh()),i},t.prototype.Jv=function(t,i){var n=this;if(null!==this.bv){var h=this.bv.ht,s=this.bv.st;R(t,i,(function(){var i=n.di.$v().vt(),r=i.Pf(),e=i.zf();r===e?I(t,0,0,h,s,r):W(t,0,0,h,s,r,e);}));}},t.prototype.vu=function(t,i){if(null!==this.bv&&null!==this.Gt&&this.Gt.ct().borderVisible){t.save(),t.fillStyle=this.S();var n,h=Math.max(1,Math.floor(this.jv().Dt*i));n=this.Av?Math.floor(this.bv.ht*i)-h:0,t.fillRect(n,0,h,Math.ceil(this.bv.st*i)),t.restore();}},t.prototype.Gv=function(t,i){if(null!==this.bv&&null!==this.Gt){var n=this.Gt.En();t.save(),t.strokeStyle=this.S(),t.font=this.Uv(),t.fillStyle=this.S();var h=this.jv(),s=this.Gt.ct().borderVisible&&this.Gt.ct().drawTicks,r=this.Av?Math.floor((this.bv.ht-h.At)*i-h.Dt*i):Math.floor(h.Dt*i),e=this.Av?Math.round(r-h.Bt*i):Math.round(r+h.At*i+h.Bt*i),u=this.Av?"right":"left",a=Math.max(1,Math.floor(i)),o=Math.floor(.5*i);if(s){var l=Math.round(h.At*i);t.beginPath();for(var f=0,c=n;f<c.length;f++){var v=c[f];t.rect(r,Math.round(v.Dn*i)-o,l,a);}t.fill();}t.fillStyle=this.Wv();for(var _=0,d=n;_<d.length;_++){v=d[_];this.yv._v(t,v.Tn,e,Math.round(v.Dn*i),u);}t.restore();}},t.prototype.Zv=function(){if(null!==this.bv&&null!==this.Gt){var t=this.bv.st/2,i=[],n=this.Gt.Vh().slice(),h=this.di.$v(),s=this.jv();this.Gt===h.Ai()&&this.di.$v().Vh().forEach((function(t){h.Vu(t)&&n.push(t);}));var r=this.Gt.Fh()[0],e=this.Gt;n.forEach((function(n){var s=n.ci(h,e);s.forEach((function(t){t.Kt(null),t.$t()&&i.push(t);})),r===n&&s.length>0&&(t=s[0].Pt());}));var u=i.filter((function(i){return i.Pt()<=t})),a=i.filter((function(i){return i.Pt()>t}));if(u.sort((function(t,i){return i.Pt()-t.Pt()})),u.length&&a.length&&a.push(u[0]),a.sort((function(t,i){return t.Pt()-i.Pt()})),i.forEach((function(t){return t.Kt(t.Pt())})),this.Gt.ct().alignLabels){for(var o=1;o<u.length;o++){var l=u[o],f=(v=u[o-1]).Mt(s,!1);l.Pt()>(_=v.Yt())-f&&l.Kt(_-f);}for(var c=1;c<a.length;c++){var v,_;l=a[c],f=(v=a[c-1]).Mt(s,!0);l.Pt()<(_=v.Yt())+f&&l.Kt(_+f);}}}},t.prototype.Qv=function(t,i){var n=this;if(null!==this.bv){t.save();var h=this.bv,s=this.Hv(),r=this.jv(),e=this.Av?"right":"left";s.forEach((function(s){if(s.Xt()){var u=s.R(f(n.Gt));t.save(),u.h(t,r,n.gv,h.ht,e,i),t.restore();}})),t.restore();}},t.prototype.t_=function(t,i){var n=this;if(null!==this.bv&&null!==this.Gt){t.save();var h=this.bv,s=this.di.Sv().vt(),r=[],e=this.di.$v(),u=s.wf().ci(e,this.Gt);u.length&&r.push(u);var a=this.jv(),o=this.Av?"right":"left";r.forEach((function(s){s.forEach((function(s){t.save(),s.R(f(n.Gt)).h(t,a,n.gv,h.ht,o,i),t.restore();}));})),t.restore();}},t.prototype.n_=function(t){this.Dv.style.cursor=1===t?"ns-resize":"default";},t.prototype.jn=function(){var t=this,i=this.qv();if(this.kv<i){var n=this.di.Sv();null===this.mv&&(this.mv=setTimeout((function(){n&&n.vt().rf(),t.mv=null;}),100));}this.kv=i;},t.prototype.Nv=function(t){this.yv.en(),this.yv=new yn(t.zt,t.et,t.le);},t}(),xn=wn;function Nn(t,i,n,h,s){t.o&&t.o(i,n,h,s);}function Sn(t,i,n,h,s){t.h(i,n,h,s);}function Cn(t,i){return t.vi(i)}function An(t,i){return void 0!==t.Ro?t.Ro(i):[]}var Dn=function(){function t(t,i){var n=this;this.bv=new en(0,0),this.h_=null,this.s_=null,this.r_=null,this.e_=!1,this.u_=new it,this.a_=0,this.o_=!1,this.l_=null,this.f_=!1,this.c_=null,this.v_=null,this.xv=function(){return n.__&&n.si().Or()},this.Cv=function(){return n.__&&n.si().Or()},this.d_=t,this.__=i,this.__.El().Ji(this.w_.bind(this),this,!0),this.M_=document.createElement("td"),this.M_.style.padding="0",this.M_.style.position="relative";var h=document.createElement("div");h.style.width="100%",h.style.height="100%",h.style.position="relative",h.style.overflow="hidden",this.b_=document.createElement("td"),this.b_.style.padding="0",this.m_=document.createElement("td"),this.m_.style.padding="0",this.M_.appendChild(h),this.Tv=ln(h,new en(16,16)),this.Tv.subscribeCanvasConfigured(this.xv);var s=this.Tv.canvas;s.style.position="absolute",s.style.zIndex="1",s.style.left="0",s.style.top="0",this.Lv=ln(h,new en(16,16)),this.Lv.subscribeCanvasConfigured(this.Cv);var r=this.Lv.canvas;r.style.position="absolute",r.style.zIndex="2",r.style.left="0",r.style.top="0",this.p_=document.createElement("tr"),this.p_.appendChild(this.b_),this.p_.appendChild(this.M_),this.p_.appendChild(this.m_),this.g_();var e=this.Sv().ct().handleScroll;this.Rv=new Mn(this.Lv.canvas,this,{Fc:!e.vertTouchDrag,Vc:!e.horzTouchDrag});}return t.prototype.en=function(){null!==this.h_&&this.h_.en(),null!==this.s_&&this.s_.en(),this.Lv.unsubscribeCanvasConfigured(this.Cv),this.Lv.destroy(),this.Tv.unsubscribeCanvasConfigured(this.xv),this.Tv.destroy(),null!==this.__&&this.__.El().hn(this),this.Rv.en();},t.prototype.$v=function(){return f(this.__)},t.prototype.y_=function(i){null!==this.__&&this.__.El().hn(this),this.__=i,null!==this.__&&this.__.El().Ji(t.prototype.w_.bind(this),this,!0),this.g_();},t.prototype.Sv=function(){return this.d_},t.prototype.Iv=function(){return this.p_},t.prototype.g_=function(){if(null!==this.__&&(this.k_(),0!==this.si().P().length)){if(null!==this.h_){var t=this.__.gl();this.h_.fi(f(t));}if(null!==this.s_){var i=this.__.yl();this.s_.fi(f(i));}}},t.prototype._l=function(){return null!==this.__?this.__._l():0},t.prototype.dl=function(t){this.__&&this.__.dl(t);},t.prototype.Dc=function(t){if(this.__){var i=t.rv,n=t.ev;dn||this.x_(i,n);}},t.prototype.qc=function(t){if(this.o_=!1,this.f_=null!==this.l_,this.__){if(this.N_(),document.activeElement!==document.body&&document.activeElement!==document.documentElement)f(document.activeElement).blur();else {var i=document.getSelection();null!==i&&i.removeAllRanges();}var n=this.si();if(!this.__.Ai().ti()&&!n.U().ti()){if(null!==this.l_){var h=n.wf();this.c_={x:h.bt(),y:h.gt()},this.l_={x:t.rv,y:t.ev};}dn||this.x_(t.rv,t.ev);}}},t.prototype.Tc=function(t){if(this.__){var i=t.rv,n=t.ev;if(this.S_()&&this.C_(),!dn){this.x_(i,n);var h=this.la(i,n);this.si().lf(h&&{ff:h.ff,A_:h.A_}),null!==h&&void 0!==h.fv.D_&&h.fv.D_(i,n);}}},t.prototype.Wc=function(t){if(null!==this.__){var i=t.rv,n=t.ev,h=this.la(i,n);if(null!==h&&void 0!==h.fv.T_&&h.fv.T_(i,n),this.u_.rn()){var s=this.si().wf().W();this.u_.sn(s,{x:i,y:n});}this.L_();}},t.prototype.Oc=function(t){if(null!==this.__){var i=this.si(),n=t.rv,h=t.ev;if(null!==this.l_){this.f_=!1;var s=f(this.c_),r=s.x+(n-this.l_.x),e=s.y+(h-this.l_.y);this.x_(r,e);}else this.S_()||this.x_(n,h);if(!i.U().ti()){var u=this.d_.ct(),a=u.handleScroll,o=u.kineticScroll;if(a.pressedMouseMove&&"touch"!==t.ke||(a.horzTouchDrag||a.vertTouchDrag)&&"mouse"!==t.ke){var l=this.__.Ai(),c=performance.now();null!==this.r_||this.B_()||(this.r_={x:t.iv,y:t.nv,As:c,rv:t.rv,ev:t.ev}),null!==this.v_&&this.v_.Gf(t.rv,c),null===this.r_||this.e_||this.r_.x===t.iv&&this.r_.y===t.nv||(null===this.v_&&("touch"===t.ke&&o.touch||"mouse"===t.ke&&o.mouse)&&(this.v_=new vn(.2,7,.997,15),this.v_.Gf(this.r_.rv,this.r_.As),this.v_.Gf(t.rv,c)),l.ti()||i.Sl(this.__,l,t.ev),i.kf(t.rv),this.e_=!0),this.e_&&(l.ti()||i.Cl(this.__,l,t.ev),i.xf(t.rv));}}}},t.prototype.Rc=function(t){null!==this.__&&(this.o_=!1,this.E_(t));},t.prototype.tv=function(t){if(this.o_=!0,null===this.l_&&xn){var i={x:t.rv,y:t.ev};this.F_(i,i);}},t.prototype.Qc=function(t){null!==this.__&&(this.__.vt().lf(null),wn||this.C_());},t.prototype.V_=function(){return this.u_},t.prototype.Kc=function(){this.a_=1,this.N_();},t.prototype.$c=function(t,i){if(this.d_.ct().handleScale.pinch){var n=5*(i-this.a_);this.a_=i,this.si().gf(t.p,n);}},t.prototype.la=function(t,i){var n=this.__;if(null===n)return null;for(var h=0,s=n.Vh();h<s.length;h++){var r=s[h],e=this.O_(r.vi(n),t,i);if(null!==e)return {ff:r,fv:e.fv,A_:e.A_}}return null},t.prototype.z_=function(t,i){f("left"===i?this.h_:this.s_).Yv(new en(t,this.bv.st));},t.prototype.P_=function(){return this.bv},t.prototype.Yv=function(t){if(t.ht<0||t.st<0)throw new Error("Try to set invalid size to PaneWidget "+JSON.stringify(t));this.bv.on(t)||(this.bv=t,this.Tv.resizeCanvas({width:t.ht,height:t.st}),this.Lv.resizeCanvas({width:t.ht,height:t.st}),this.M_.style.width=t.ht+"px",this.M_.style.height=t.st+"px");},t.prototype.R_=function(){var t=f(this.__);t.pl(t.gl()),t.pl(t.yl());for(var i=0,n=t.Fh();i<n.length;i++){var h=n[i];if(t.Vu(h)){var s=h.$();null!==s&&t.pl(s),h.Wi();}}},t.prototype.i_=function(){return this.Tv.canvas},t.prototype.Xv=function(t){if(0!==t&&null!==this.__){if(t>1&&this.R_(),null!==this.h_&&this.h_.Xv(t),null!==this.s_&&this.s_.Xv(t),1!==t){var i=an(this.Tv.canvas);i.save(),this.Jv(i,this.Tv.pixelRatio),this.__&&(this.I_(i,this.Tv.pixelRatio),this.W_(i,this.Tv.pixelRatio),this.U_(i,this.Tv.pixelRatio,Cn)),i.restore();}var n=an(this.Lv.canvas);n.clearRect(0,0,Math.ceil(this.bv.ht*this.Lv.pixelRatio),Math.ceil(this.bv.st*this.Lv.pixelRatio)),this.U_(n,this.Tv.pixelRatio,An),this.j_(n,this.Lv.pixelRatio);}},t.prototype.q_=function(){return this.h_},t.prototype.H_=function(){return this.s_},t.prototype.w_=function(){null!==this.__&&this.__.El().hn(this),this.__=null;},t.prototype.Jv=function(t,i){var n=this;R(t,i,(function(){var i=n.si(),h=i.Pf(),s=i.zf();h===s?I(t,0,0,n.bv.ht,n.bv.st,s):W(t,0,0,n.bv.ht,n.bv.st,h,s);}));},t.prototype.I_=function(t,i){var n=f(this.__),h=n.Fl().il().R(n.Mt(),n.wt());null!==h&&(t.save(),h.h(t,i,!1),t.restore());},t.prototype.W_=function(t,i){var n=this.si().df();this.Y_(t,i,Cn,Nn,n),this.Y_(t,i,Cn,Sn,n);},t.prototype.j_=function(t,i){this.Y_(t,i,Cn,Sn,this.si().wf());},t.prototype.U_=function(t,i,n){for(var h=f(this.__).Vh(),s=0,r=h;s<r.length;s++){var e=r[s];this.Y_(t,i,n,Nn,e);}for(var u=0,a=h;u<a.length;u++){e=a[u];this.Y_(t,i,n,Sn,e);}},t.prototype.Y_=function(t,i,n,h,s){for(var r=f(this.__),e=n(s,r),u=r.Mt(),a=r.wt(),o=r.vt().af(),l=null!==o&&o.ff===s,c=null!==o&&l&&void 0!==o.A_?o.A_.fa:void 0,v=0,_=e;v<_.length;v++){var d=_[v].R(u,a);null!==d&&(t.save(),h(d,t,i,l,c),t.restore());}},t.prototype.O_=function(t,i,n){for(var h=0,s=t;h<s.length;h++){var r=s[h],e=r.R(this.bv.st,this.bv.ht);if(null!==e&&e.la){var u=e.la(i,n);if(null!==u)return {fv:r,A_:u}}}return null},t.prototype.k_=function(){if(null!==this.__){var t=this.d_;t.ct().leftPriceScale.visible||null===this.h_||(this.b_.removeChild(this.h_.Iv()),this.h_.en(),this.h_=null),t.ct().rightPriceScale.visible||null===this.s_||(this.m_.removeChild(this.s_.Iv()),this.s_.en(),this.s_=null);var i=t.vt().Lf();t.ct().leftPriceScale.visible&&null===this.h_&&(this.h_=new kn(this,t.ct().layout,i,"left"),this.b_.appendChild(this.h_.Iv())),t.ct().rightPriceScale.visible&&null===this.s_&&(this.s_=new kn(this,t.ct().layout,i,"right"),this.m_.appendChild(this.s_.Iv()));}},t.prototype.S_=function(){return xn&&null===this.l_},t.prototype.B_=function(){return xn&&this.o_||null!==this.l_},t.prototype.K_=function(t){return Math.max(0,Math.min(t,this.bv.ht-1))},t.prototype.X_=function(t){return Math.max(0,Math.min(t,this.bv.st-1))},t.prototype.x_=function(t,i){this.si().Af(this.K_(t),this.X_(i),f(this.__));},t.prototype.C_=function(){this.si().Df();},t.prototype.L_=function(){this.f_&&(this.l_=null,this.C_());},t.prototype.F_=function(t,i){this.l_=t,this.f_=!1,this.x_(i.x,i.y);var n=this.si().wf();this.c_={x:n.bt(),y:n.gt()};},t.prototype.si=function(){return this.d_.vt()},t.prototype.Z_=function(){var t=this.si(),i=this.$v(),n=i.Ai();t.Al(i,n),t.Nf(),this.r_=null,this.e_=!1;},t.prototype.E_=function(t){var i=this;if(this.e_){var n=performance.now();if(null!==this.v_&&this.v_.Yu(t.rv,n),null===this.v_||this.v_.tc(n))this.Z_();else {var h=this.si(),s=h.U(),r=this.v_,e=function(){if(!r.nc()){var t=performance.now(),n=r.tc(t);if(!r.nc()){var u=s.Rr();h.xf(r.Qf(t)),u===s.Rr()&&(n=!0,i.v_=null);}n?i.Z_():requestAnimationFrame(e);}};requestAnimationFrame(e);}}},t.prototype.N_=function(){var t=performance.now(),i=null===this.v_||this.v_.tc(t);null!==this.v_&&(i||this.Z_()),null!==this.v_&&(this.v_.hc(),this.v_=null);},t}(),Tn=function(){function t(t,i,n,h,s){var r=this;this.B=!0,this.bv=new en(0,0),this.xv=function(){return r.Xv(3)},this.Av="left"===t,this.Gl=n.Lf,this.Ni=i,this.J_=h,this.G_=s,this.Dv=document.createElement("div"),this.Dv.style.width="25px",this.Dv.style.height="100%",this.Dv.style.overflow="hidden",this.Tv=ln(this.Dv,new en(16,16)),this.Tv.subscribeCanvasConfigured(this.xv);}return t.prototype.en=function(){this.Tv.unsubscribeCanvasConfigured(this.xv),this.Tv.destroy();},t.prototype.Iv=function(){return this.Dv},t.prototype.P_=function(){return this.bv},t.prototype.Yv=function(t){if(t.ht<0||t.st<0)throw new Error("Try to set invalid size to PriceAxisStub "+JSON.stringify(t));this.bv.on(t)||(this.bv=t,this.Tv.resizeCanvas({width:t.ht,height:t.st}),this.Dv.style.width=t.ht+"px",this.Dv.style.minWidth=t.ht+"px",this.Dv.style.height=t.st+"px",this.B=!0);},t.prototype.Xv=function(t){if((!(t<3)||this.B)&&0!==this.bv.ht&&0!==this.bv.st){this.B=!1;var i=an(this.Tv.canvas);this.Jv(i,this.Tv.pixelRatio),this.vu(i,this.Tv.pixelRatio);}},t.prototype.i_=function(){return this.Tv.canvas},t.prototype.vu=function(t,i){if(this.J_()){var n=this.bv.ht;t.save(),t.fillStyle=this.Ni.timeScale.borderColor;var h=Math.floor(this.Gl.ct().Dt*i),s=this.Av?Math.round(n*i)-h:0;t.fillRect(s,0,h,h),t.restore();}},t.prototype.Jv=function(t,i){var n=this;R(t,i,(function(){I(t,0,0,n.bv.ht,n.bv.st,n.G_());}));},t}();function Ln(t,i){return t.Rs>i.Rs?t:i}var Bn=function(){function t(t){var i=this;this.Q_=null,this.td=null,this.oe=null,this.nd=!1,this.bv=new en(0,0),this.gv=new di(5),this.xv=function(){return i.d_.vt().Or()},this.Cv=function(){return i.d_.vt().Or()},this.d_=t,this.Ni=t.ct().layout,this.hd=document.createElement("tr"),this.sd=document.createElement("td"),this.sd.style.padding="0",this.rd=document.createElement("td"),this.rd.style.padding="0",this.Dv=document.createElement("td"),this.Dv.style.height="25px",this.Dv.style.padding="0",this.ed=document.createElement("div"),this.ed.style.width="100%",this.ed.style.height="100%",this.ed.style.position="relative",this.ed.style.overflow="hidden",this.Dv.appendChild(this.ed),this.Tv=ln(this.ed,new en(16,16)),this.Tv.subscribeCanvasConfigured(this.xv);var n=this.Tv.canvas;n.style.position="absolute",n.style.zIndex="1",n.style.left="0",n.style.top="0",this.Lv=ln(this.ed,new en(16,16)),this.Lv.subscribeCanvasConfigured(this.Cv);var h=this.Lv.canvas;h.style.position="absolute",h.style.zIndex="2",h.style.left="0",h.style.top="0",this.hd.appendChild(this.sd),this.hd.appendChild(this.Dv),this.hd.appendChild(this.rd),this.ud(),this.d_.vt().vl().Ji(this.ud.bind(this),this),this.Rv=new Mn(this.Lv.canvas,this,{Fc:!0,Vc:!1});}return t.prototype.en=function(){this.Rv.en(),null!==this.Q_&&this.Q_.en(),null!==this.td&&this.td.en(),this.Lv.unsubscribeCanvasConfigured(this.Cv),this.Lv.destroy(),this.Tv.unsubscribeCanvasConfigured(this.xv),this.Tv.destroy();},t.prototype.Iv=function(){return this.hd},t.prototype.ad=function(){return this.Q_},t.prototype.od=function(){return this.td},t.prototype.qc=function(t){if(!this.nd){this.nd=!0;var i=this.d_.vt();!i.U().ti()&&this.d_.ct().handleScale.axisPressedMouseMove.time&&i.pf(t.rv);}},t.prototype.Hc=function(){var t=this.d_.vt();!t.U().ti()&&this.nd&&(this.nd=!1,this.d_.ct().handleScale.axisPressedMouseMove.time&&t.Cf());},t.prototype.Oc=function(t){var i=this.d_.vt();!i.U().ti()&&this.d_.ct().handleScale.axisPressedMouseMove.time&&i.Sf(t.rv);},t.prototype.Rc=function(t){this.nd=!1;var i=this.d_.vt();i.U().ti()&&!this.d_.ct().handleScale.axisPressedMouseMove.time||i.Cf();},t.prototype.Ic=function(){this.d_.ct().handleScale.axisDoubleClickReset&&this.d_.vt().Ne();},t.prototype.Dc=function(t){this.d_.vt().ct().handleScale.axisPressedMouseMove.time&&this.n_(1);},t.prototype.Qc=function(t){this.n_(0);},t.prototype.P_=function(){return this.bv},t.prototype.ld=function(t,i,n){this.bv&&this.bv.on(t)||(this.bv=t,this.Tv.resizeCanvas({width:t.ht,height:t.st}),this.Lv.resizeCanvas({width:t.ht,height:t.st}),this.Dv.style.width=t.ht+"px",this.Dv.style.height=t.st+"px"),null!==this.Q_&&this.Q_.Yv(new en(i,t.st)),null!==this.td&&this.td.Yv(new en(n,t.st));},t.prototype.fd=function(){var t=this.vd();return Math.ceil(t.Dt+t.At+t.zt+t.Tt+t.Lt)},t.prototype.O=function(){this.d_.vt().U().En();},t.prototype.i_=function(){return this.Tv.canvas},t.prototype.Xv=function(t){if(0!==t){if(1!==t){var i=an(this.Tv.canvas);this.Jv(i,this.Tv.pixelRatio),this.vu(i,this.Tv.pixelRatio),this.Gv(i,this.Tv.pixelRatio),null!==this.Q_&&this.Q_.Xv(t),null!==this.td&&this.td.Xv(t);}var n=an(this.Lv.canvas),h=this.Lv.pixelRatio;n.clearRect(0,0,Math.ceil(this.bv.ht*h),Math.ceil(this.bv.st*h)),this._d([this.d_.vt().wf()],n,h);}},t.prototype.Jv=function(t,i){var n=this;R(t,i,(function(){I(t,0,0,n.bv.ht,n.bv.st,n.d_.vt().zf());}));},t.prototype.vu=function(t,i){if(this.d_.ct().timeScale.borderVisible){t.save(),t.fillStyle=this.dd();var n=Math.max(1,Math.floor(this.vd().Dt*i));t.fillRect(0,0,Math.ceil(this.bv.ht*i),n),t.restore();}},t.prototype.Gv=function(t,i){var n=this,h=this.d_.vt().U().En();if(h&&0!==h.length){var s=h.reduce(Ln,h[0]).Rs;s>30&&s<40&&(s=30),t.save(),t.strokeStyle=this.dd();var r=this.vd(),e=r.Dt+r.At+r.Tt+r.zt-r.Ot;t.textAlign="center",t.fillStyle=this.dd();var u=Math.floor(this.vd().Dt*i),a=Math.max(1,Math.floor(i)),o=Math.floor(.5*i);if(this.d_.vt().U().ct().borderVisible){t.beginPath();for(var l=Math.round(r.At*i),f=h.length;f--;){var c=Math.round(h[f].Dn*i);t.rect(c-o,u,a,l);}t.fill();}t.fillStyle=this.ve(),R(t,i,(function(){t.font=n.wd();for(var i=0,r=h;i<r.length;i++){if((l=r[i]).Rs<s){var u=l.Wr?n.Md(t,l.Dn,l.Tn):l.Dn;t.fillText(l.Tn,u,e);}}t.font=n.bd();for(var a=0,o=h;a<o.length;a++){var l;if((l=o[a]).Rs>=s){u=l.Wr?n.Md(t,l.Dn,l.Tn):l.Dn;t.fillText(l.Tn,u,e);}}}));}},t.prototype.Md=function(t,i,n){var h=this.gv.Vt(t,n),s=h/2,r=Math.floor(i-s)+.5;return r<0?i+=Math.abs(0-r):r+h>this.bv.ht&&(i-=Math.abs(this.bv.ht-(r+h))),i},t.prototype._d=function(t,i,n){for(var h=this.vd(),s=0,r=t;s<r.length;s++)for(var e=0,u=r[s]._i();e<u.length;e++){var a=u[e];i.save(),a.R().h(i,h,n),i.restore();}},t.prototype.dd=function(){return this.d_.ct().timeScale.borderColor},t.prototype.ve=function(){return this.Ni.textColor},t.prototype.fe=function(){return this.Ni.fontSize},t.prototype.wd=function(){return Ut(this.fe(),this.Ni.fontFamily)},t.prototype.bd=function(){return Ut(this.fe(),this.Ni.fontFamily,"bold")},t.prototype.vd=function(){null===this.oe&&(this.oe={Dt:1,Ot:NaN,Tt:NaN,Lt:NaN,hi:NaN,At:3,zt:NaN,Nt:"",ni:new di});var t=this.oe,i=this.wd();if(t.Nt!==i){var n=this.fe();t.zt=n,t.Nt=i,t.Tt=Math.ceil(n/2.5),t.Lt=t.Tt,t.hi=Math.ceil(n/2),t.Ot=Math.round(this.fe()/5),t.ni.Cu();}return this.oe},t.prototype.n_=function(t){this.Dv.style.cursor=1===t?"ew-resize":"default";},t.prototype.ud=function(){var t=this.d_.vt(),i=t.ct();i.leftPriceScale.visible||null===this.Q_||(this.sd.removeChild(this.Q_.Iv()),this.Q_.en(),this.Q_=null),i.rightPriceScale.visible||null===this.td||(this.rd.removeChild(this.td.Iv()),this.td.en(),this.td=null);var n={Lf:this.d_.vt().Lf()},h=function(){return i.leftPriceScale.borderVisible&&t.U().ct().borderVisible},s=function(){return t.zf()};i.leftPriceScale.visible&&null===this.Q_&&(this.Q_=new Tn("left",i,n,h,s),this.sd.appendChild(this.Q_.Iv())),i.rightPriceScale.visible&&null===this.td&&(this.td=new Tn("right",i,n,h,s),this.rd.appendChild(this.td.Iv()));},t}(),En=function(){function t(t,i){var n;this.md=[],this.pd=0,this.Fn=0,this.Ks=0,this.gd=0,this.yd=0,this.kd=null,this.xd=!1,this.u_=new it,this.Xl=new it,this.Ni=i,this.hd=document.createElement("div"),this.hd.classList.add("tv-lightweight-charts"),this.hd.style.overflow="hidden",this.hd.style.width="100%",this.hd.style.height="100%",(n=this.hd).style.userSelect="none",n.style.webkitUserSelect="none",n.style.msUserSelect="none",n.style.MozUserSelect="none",n.style.webkitTapHighlightColor="transparent",this.Nd=document.createElement("table"),this.Nd.setAttribute("cellspacing","0"),this.hd.appendChild(this.Nd),this.Sd=this.Cd.bind(this),this.hd.addEventListener("wheel",this.Sd,{passive:!1}),this.si=new rn(this.Jl.bind(this),this.Ni),this.vt().Mf().Ji(this.Ad.bind(this),this),this.Dd=new Bn(this),this.Nd.appendChild(this.Dd.Iv());var h=this.Ni.width,s=this.Ni.height;if(0===h||0===s){var r=t.getBoundingClientRect();0===h&&(h=Math.floor(r.width),h-=h%2),0===s&&(s=Math.floor(r.height),s-=s%2);}this.Td(h,s),this.Ld(),t.appendChild(this.hd),this.Bd(),this.si.U().Jr().Ji(this.si.rf.bind(this.si),this),this.si.vl().Ji(this.si.rf.bind(this.si),this);}return t.prototype.vt=function(){return this.si},t.prototype.ct=function(){return this.Ni},t.prototype.Ed=function(){return this.md},t.prototype.en=function(){this.hd.removeEventListener("wheel",this.Sd),0!==this.pd&&window.cancelAnimationFrame(this.pd),this.si.Mf().hn(this),this.si.U().Jr().hn(this),this.si.vl().hn(this),this.si.en();for(var t=0,i=this.md;t<i.length;t++){var n=i[t];this.Nd.removeChild(n.Iv()),n.V_().hn(this),n.en();}this.md=[],f(this.Dd).en(),null!==this.hd.parentElement&&this.hd.parentElement.removeChild(this.hd),this.Xl.en(),this.u_.en();},t.prototype.Td=function(t,i,n){if(void 0===n&&(n=!1),this.Fn!==i||this.Ks!==t){this.Fn=i,this.Ks=t;var h=i+"px",s=t+"px";f(this.hd).style.height=h,f(this.hd).style.width=s,this.Nd.style.height=h,this.Nd.style.width=s,n?this.Fd(new Ht(3)):this.si.rf();}},t.prototype.Xv=function(t){void 0===t&&(t=new Ht(3));for(var i=0;i<this.md.length;i++)this.md[i].Xv(t.ge(i).me);this.Dd.Xv(t.pe());},t.prototype.sh=function(t){this.si.sh(t),this.Bd();var i=t.width||this.Ks,n=t.height||this.Fn;this.Td(i,n);},t.prototype.V_=function(){return this.u_},t.prototype.Mf=function(){return this.Xl},t.prototype.Vd=function(){var t=this;null!==this.kd&&(this.Fd(this.kd),this.kd=null);var i=this.md[0],n=on(document,new en(this.Ks,this.Fn)),h=an(n),s=un(n);return R(h,s,(function(){var n=0,s=0,r=function(i){for(var r=0;r<t.md.length;r++){var e=t.md[r],u=e.P_().st,a=f("left"===i?e.q_():e.H_()),o=a.i_();h.drawImage(o,n,s,a.Kv(),u),s+=u;}};t.Od()&&(r("left"),n=f(i.q_()).Kv()),s=0;for(var e=0;e<t.md.length;e++){var u=t.md[e],a=u.P_(),o=u.i_();h.drawImage(o,n,s,a.ht,a.st),s+=a.st;}n+=i.P_().ht,t.zd()&&(s=0,r("right"));var l=function(i){var r=f("left"===i?t.Dd.ad():t.Dd.od()),e=r.P_(),u=r.i_();h.drawImage(u,n,s,e.ht,e.st);};if(t.Ni.timeScale.visible){n=0,t.Od()&&(l("left"),n=f(i.q_()).Kv());var c=t.Dd.P_();o=t.Dd.i_();h.drawImage(o,n,s,c.ht,c.st),t.zd()&&(n+=i.P_().ht,l("right"),h.restore());}})),n},t.prototype.Pd=function(t){return "none"===t?0:("left"!==t||this.Od())&&("right"!==t||this.zd())?0===this.md.length?0:f("left"===t?this.md[0].q_():this.md[0].H_()).Kv():0},t.prototype.Rd=function(){for(var t=0,i=0,n=0,h=0,s=this.md;h<s.length;h++){var r=s[h];this.Od()&&(i=Math.max(i,f(r.q_()).qv())),this.zd()&&(n=Math.max(n,f(r.H_()).qv())),t+=r._l();}var e=this.Ks,u=this.Fn,a=Math.max(e-i-n,0),o=this.Ni.timeScale.visible?this.Dd.fd():0;o%2&&(o+=1);for(var l=0+o,c=u<l?0:u-l,v=c/t,_=0,d=0;d<this.md.length;++d){(r=this.md[d]).y_(this.si._f()[d]);var w,M=0;M=d===this.md.length-1?c-_:Math.round(r._l()*v),_+=w=Math.max(M,2),r.Yv(new en(a,w)),this.Od()&&r.z_(i,"left"),this.zd()&&r.z_(n,"right"),r.$v()&&this.si.bf(r.$v(),w);}this.Dd.ld(new en(a,o),i,n),this.si.Ar(a),this.gd!==i&&(this.gd=i),this.yd!==n&&(this.yd=n);},t.prototype.Cd=function(t){var i=t.deltaX/100,n=-t.deltaY/100;if(0!==i&&this.Ni.handleScroll.mouseWheel||0!==n&&this.Ni.handleScale.mouseWheel){switch(t.cancelable&&t.preventDefault(),t.deltaMode){case t.DOM_DELTA_PAGE:i*=120,n*=120;break;case t.DOM_DELTA_LINE:i*=32,n*=32;}if(0!==n&&this.Ni.handleScale.mouseWheel){var h=Math.sign(n)*Math.min(1,Math.abs(n)),s=t.clientX-this.hd.getBoundingClientRect().left;this.vt().gf(s,h);}0!==i&&this.Ni.handleScroll.mouseWheel&&this.vt().yf(-80*i);}},t.prototype.Fd=function(t){var i=t.pe();if(3===i&&this.Id(),3===i||2===i){for(var n=this.si._f(),h=0;h<n.length;h++)t.ge(h)._h&&n[h].Ll();for(var s=t.Se(),r=0,e=s;r<e.length;r++){var u=e[r];this.Ce(u);}s.length>0&&(this.si.Vr(),this.si.To(),this.si.Or()),this.Dd.O();}this.Xv(t);},t.prototype.Ce=function(t){var i=this.si.U();switch(t.ke){case 0:i.Qr();break;case 1:i.te(t.X);break;case 2:i.dr(t.X);break;case 3:i.wr(t.X);break;case 4:i.Ur();}},t.prototype.Jl=function(t){var i=this;null!==this.kd?this.kd._n(t):this.kd=t,this.xd||(this.xd=!0,this.pd=window.requestAnimationFrame((function(){i.xd=!1,i.pd=0,null!==i.kd&&(i.Fd(i.kd),i.kd=null);})));},t.prototype.Id=function(){this.Ld();},t.prototype.Ld=function(){for(var t=this.si._f(),i=t.length,n=this.md.length,h=i;h<n;h++){var s=l(this.md.pop());this.Nd.removeChild(s.Iv()),s.V_().hn(this),s.en();}for(h=n;h<i;h++){(s=new Dn(this,t[h])).V_().Ji(this.Wd.bind(this),this),this.md.push(s),this.Nd.insertBefore(s.Iv(),this.Dd.Iv());}for(h=0;h<i;h++){var r=t[h];(s=this.md[h]).$v()!==r?s.y_(r):s.g_();}this.Bd(),this.Rd();},t.prototype.Ud=function(t,i){var n,h=new Map;null!==t&&this.si.P().forEach((function(i){var n=i.ka(t);null!==n&&h.set(i,n);}));if(null!==t){var s=this.si.U().ri(t);null!==s&&(n=s);}var r=this.vt().af(),e=null!==r&&r.ff instanceof Xi?r.ff:void 0,u=null!==r&&void 0!==r.A_?r.A_.va:void 0;return {C:n,jd:i||void 0,qd:e,Hd:h,Yd:u}},t.prototype.Wd=function(t,i){var n=this;this.u_.sn((function(){return n.Ud(t,i)}));},t.prototype.Ad=function(t,i){var n=this;this.Xl.sn((function(){return n.Ud(t,i)}));},t.prototype.Bd=function(){var t=this.Ni.timeScale.visible?"":"none";this.Dd.Iv().style.display=t;},t.prototype.Od=function(){return this.Ni.leftPriceScale.visible},t.prototype.zd=function(){return this.Ni.rightPriceScale.visible},t}();function Fn(t,i,n){var h=n.value,s={Ps:i,C:t,X:[h,h,h,h]};return "color"in n&&void 0!==n.color&&(s.et=n.color),s}function Vn(t,i,n){return {Ps:i,C:t,X:[n.open,n.high,n.low,n.close]}}function On(t){return void 0!==t.X}function zn(t){return function(i,n,h){return void 0===(s=h).open&&void 0===s.value?{C:i,Ps:n}:t(i,n,h);var s;}}var Pn={Candlestick:zn(Vn),Bar:zn(Vn),Area:zn(Fn),Histogram:zn(Fn),Line:zn(Fn)};function Rn(t){return Pn[t]}function In(t){return 60*t*60*1e3}function Wn(t){return 60*t*1e3}var Un,jn=[{Kd:1,Rs:20},{Kd:(Un=1,1e3*Un),Rs:19},{Kd:Wn(1),Rs:20},{Kd:Wn(5),Rs:21},{Kd:Wn(30),Rs:22},{Kd:In(1),Rs:30},{Kd:In(3),Rs:31},{Kd:In(6),Rs:32},{Kd:In(12),Rs:33}];function qn(t,i){if(null!==i){var n=new Date(1e3*i),h=new Date(1e3*t);if(h.getUTCFullYear()!==n.getUTCFullYear())return 70;if(h.getUTCMonth()!==n.getUTCMonth())return 60;if(h.getUTCDate()!==n.getUTCDate())return 50;for(var s=jn.length-1;s>=0;--s)if(Math.floor(n.getTime()/jn[s].Kd)!==Math.floor(h.getTime()/jn[s].Kd))return jn[s].Rs}return 20}function Hn(t){if(!Rt(t))throw new Error("time must be of type BusinessDay");var i=new Date(Date.UTC(t.year,t.month-1,t.day,0,0,0,0));return {As:Math.round(i.getTime()/1e3),Cs:t}}function Yn(t){if(!It(t))throw new Error("time must be of type isUTCTimestamp");return {As:t}}function Kn(t){return 0===t.length?null:Rt(t[0].time)?Hn:Yn}function $n(t){return It(t)?Yn(t):Rt(t)?Hn(t):Hn(Xn(t))}function Xn(t){var i=new Date(t);if(isNaN(i.getTime()))throw new Error("Invalid date string="+t+", expected format=yyyy-mm-dd");return {day:i.getUTCDate(),month:i.getUTCMonth()+1,year:i.getUTCFullYear()}}function Zn(t){w(t.time)&&(t.time=Xn(t.time));}function Jn(t){return {Ps:0,$d:new Map,Rh:t}}var Gn=function(){function t(){this.Xd=new Map,this.Zd=new Map,this.Jd=new Map,this.Gd=[];}return t.prototype.en=function(){this.Xd.clear(),this.Zd.clear(),this.Jd.clear(),this.Gd=[];},t.prototype.Qd=function(t,i){var n=this;this.Jd.has(t)&&this.Xd.forEach((function(i){return i.$d.delete(t)}));var h=[];if(0!==i.length){!function(t){t.forEach(Zn);}(i);var s=f(Kn(i)),r=Rn(t.za());h=i.map((function(i){var h=s(i.time),e=n.Xd.get(h.As);void 0===e&&(e=Jn(h),n.Xd.set(h.As,e));var u=r(h,e.Ps,i);return e.$d.set(t,u),u}));}return this.tw(),this.iw(t,h),this.nw(t)},t.prototype.Ff=function(t){return this.Qd(t,[])},t.prototype.hw=function(t,i){Zn(i);var n=f(Kn([i]))(i.time),h=this.Jd.get(t);if(void 0!==h&&n.As<h.As)throw new Error("Cannot update oldest data, last time="+h.As+", new time="+n.As);var s=this.Xd.get(n.As),r=void 0===s;void 0===s&&(s=Jn(n),this.Xd.set(n.As,s));var e=Rn(t.za())(n,s.Ps,i);s.$d.set(t,e);var u=this.sw(t,e);if(!r){var a=new Map;return null!==u&&a.set(t,u),{rw:a,U:{Lr:this.ew()}}}return this.nw(t)},t.prototype.sw=function(t,i){var n=this.Zd.get(t);void 0===n&&(n=[],this.Zd.set(t,n));var h=0!==n.length?n[n.length-1]:null,s=null;return null===h||i.C.As>h.C.As?On(i)&&(n.push(i),s={rf:!1,Wu:[i]}):On(i)?(n[n.length-1]=i,s={rf:!1,Wu:[i]}):(n.splice(-1,1),s={rf:!0,Wu:n}),this.Jd.set(t,i.C),s},t.prototype.iw=function(t,i){0!==i.length?(this.Zd.set(t,i.filter(On)),this.Jd.set(t,i[i.length-1].C)):(this.Zd.delete(t),this.Jd.delete(t));},t.prototype.tw=function(){var t=new Map;this.Xd.forEach((function(i,n){i.$d.size>0&&t.set(n,i);})),this.Xd=t;},t.prototype.uw=function(t){for(var i=-1,n=0;n<this.Gd.length&&n<t.length;++n){var h=this.Gd[n],s=t[n];if(h.C.As!==s.C.As){i=n;break}s.zs=h.zs;}if(-1===i&&this.Gd.length!==t.length&&(i=Math.min(this.Gd.length,t.length)),-1===i)return -1;var r=function(i){var n=l(e.Xd.get(t[i].C.As));n.Ps=i,n.$d.forEach((function(t){t.Ps=i;}));},e=this;for(n=i;n<t.length;++n)r(n);return function(t,i){void 0===i&&(i=0);for(var n=0===i||0===t.length?null:t[i-1].C.As,h=0,s=i;s<t.length;++s){var r=t[s];r.zs=qn(r.C.As,n),h+=r.C.As-(n||r.C.As),n=r.C.As;}if(0===i&&t.length>1){var e=Math.ceil(h/(t.length-1)),u=t[0].C.As-e;t[0].zs=qn(t[0].C.As,u);}}(t,i),this.Gd=t,i},t.prototype.ew=function(){if(0===this.Zd.size)return null;var t=0;return this.Zd.forEach((function(i){0!==i.length&&(t=Math.max(t,i[i.length-1].Ps));})),t},t.prototype.nw=function(t){var i=Array.from(this.Xd.values()).map((function(t){return {zs:0,C:t.Rh}}));i.sort((function(t,i){return t.C.As-i.C.As}));var n=this.uw(i),h={rw:new Map,U:{Lr:this.ew()}};if(-1!==n)this.Zd.forEach((function(t,i){h.rw.set(i,{Wu:t,rf:!0});})),this.Zd.has(t)||h.rw.set(t,{Wu:[],rf:!0}),h.U.aw=this.Gd;else {var s=this.Zd.get(t);h.rw.set(t,{Wu:s||[],rf:!0});}return h},t}();var Qn={color:"#FF0000",price:0,lineStyle:2,lineWidth:1,axisLabelVisible:!0,title:""},th=function(){function t(t){this.Ba=t;}return t.prototype.applyOptions=function(t){this.Ba.sh(t);},t.prototype.options=function(){return this.Ba.ct()},t.prototype.ow=function(){return this.Ba},t}();function ih(t){var i=t.overlay,n=function(t,i){var n={};for(var h in t)Object.prototype.hasOwnProperty.call(t,h)&&i.indexOf(h)<0&&(n[h]=t[h]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var s=0;for(h=Object.getOwnPropertySymbols(t);s<h.length;s++)i.indexOf(h[s])<0&&Object.prototype.propertyIsEnumerable.call(t,h[s])&&(n[h[s]]=t[h[s]]);}return n}(t,["overlay"]);return i&&(n.priceScaleId=""),n}var nh=function(){function t(t,i,n){this.Ie=t,this.lw=i,this.fw=n;}return t.prototype.priceFormatter=function(){return this.Ie.Kh()},t.prototype.priceToCoordinate=function(t){var i=this.Ie.H();return null===i?null:this.Ie.$().K(t,i.X)},t.prototype.coordinateToPrice=function(t){var i=this.Ie.H();return null===i?null:this.Ie.$().Di(t,i.X)},t.prototype.barsInLogicalRange=function(t){if(null===t)return null;var i=new Ot(new Bt(t.from,t.to)).qs(),n=this.Ie.Hi();if(n.ti())return null;var h=n.Qa(i.ss(),1),s=n.Qa(i.rs(),-1),r=f(n.Za()),e=f(n.qi());if(null!==h&&null!==s&&h.Ps>s.Ps)return {barsBefore:t.from-r,barsAfter:e-t.to};var u={barsBefore:null===h||h.Ps===r?t.from-r:h.Ps-r,barsAfter:null===s||s.Ps===e?e-t.to:e-s.Ps};return null!==h&&null!==s&&(u.from=h.C.Cs||h.C.As,u.to=s.C.Cs||s.C.As),u},t.prototype.setData=function(t){this.Ie.za(),this.lw.cw(this.Ie,t);},t.prototype.update=function(t){this.Ie.za(),this.lw.Bo(this.Ie,t);},t.prototype.setMarkers=function(t){var i=t.map((function(t){return u(u({},t),{time:$n(t.time)})}));this.Ie.Vo(i);},t.prototype.applyOptions=function(t){var i=ih(t);this.Ie.sh(i);},t.prototype.options=function(){return b(this.Ie.ct())},t.prototype.priceScale=function(){return this.fw.priceScale(this.Ie.$().hh())},t.prototype.createPriceLine=function(t){var i=v(b(Qn),t),n=this.Ie.Oo(i);return new th(n)},t.prototype.removePriceLine=function(t){this.Ie.zo(t.ow());},t.prototype.seriesType=function(){return this.Ie.za()},t}(),hh=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return e(i,t),i.prototype.applyOptions=function(i){xt(i),t.prototype.applyOptions.call(this,i);},i}(nh),sh={autoScale:!0,mode:0,invertScale:!1,alignLabels:!0,borderVisible:!0,borderColor:"#2B2B43",entireTextOnly:!1,visible:!1,drawTicks:!0,scaleMargins:{bottom:.1,top:.2}},rh={color:"rgba(0, 0, 0, 0)",visible:!1,fontSize:48,fontFamily:Wt,fontStyle:"",text:"",horzAlign:"center",vertAlign:"center"},eh={width:0,height:0,layout:{background:{type:"solid",color:"#FFFFFF"},textColor:"#191919",fontSize:11,fontFamily:Wt},crosshair:{vertLine:{color:"#758696",width:1,style:3,visible:!0,labelVisible:!0,labelBackgroundColor:"#4c525e"},horzLine:{color:"#758696",width:1,style:3,visible:!0,labelVisible:!0,labelBackgroundColor:"#4c525e"},mode:1},grid:{vertLines:{color:"#D6DCDE",style:0,visible:!0},horzLines:{color:"#D6DCDE",style:0,visible:!0}},overlayPriceScales:u({},sh),leftPriceScale:u(u({},sh),{visible:!1}),rightPriceScale:u(u({},sh),{visible:!0}),timeScale:{rightOffset:0,barSpacing:6,minBarSpacing:.5,fixLeftEdge:!1,fixRightEdge:!1,lockVisibleTimeRangeOnResize:!1,rightBarStaysOnScroll:!1,borderVisible:!0,borderColor:"#2B2B43",visible:!0,timeVisible:!1,secondsVisible:!0,shiftVisibleRangeOnNewBar:!0},watermark:rh,localization:{locale:_n?navigator.language:"",dateFormat:"dd MMM 'yy"},handleScroll:{mouseWheel:!0,pressedMouseMove:!0,horzTouchDrag:!0,vertTouchDrag:!0},handleScale:{axisPressedMouseMove:{time:!0,price:!0},axisDoubleClickReset:!0,mouseWheel:!0,pinch:!0},kineticScroll:{mouse:!1,touch:!0}},uh={upColor:"#26a69a",downColor:"#ef5350",wickVisible:!0,borderVisible:!0,borderColor:"#378658",borderUpColor:"#26a69a",borderDownColor:"#ef5350",wickColor:"#737375",wickUpColor:"#26a69a",wickDownColor:"#ef5350"},ah={upColor:"#26a69a",downColor:"#ef5350",openVisible:!0,thinBars:!0},oh={color:"#2196f3",lineStyle:0,lineWidth:3,lineType:0,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,crosshairMarkerBorderColor:"",crosshairMarkerBackgroundColor:"",lastPriceAnimation:0},lh={topColor:"rgba( 46, 220, 135, 0.4)",bottomColor:"rgba( 40, 221, 100, 0)",lineColor:"#33D778",lineStyle:0,lineWidth:3,lineType:0,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,crosshairMarkerBorderColor:"",crosshairMarkerBackgroundColor:"",lastPriceAnimation:0},fh={color:"#26a69a",base:0},ch={title:"",visible:!0,lastValueVisible:!0,priceLineVisible:!0,priceLineSource:0,priceLineWidth:1,priceLineColor:"",priceLineStyle:2,baseLineVisible:!0,baseLineWidth:1,baseLineColor:"#B2B5BE",baseLineStyle:0,priceFormat:{type:"price",precision:2,minMove:.01}},vh=function(){function t(t,i){this._w=t,this.dw=i;}return t.prototype.applyOptions=function(t){this._w.vt().cf(this.dw,t);},t.prototype.options=function(){return this.Gt().ct()},t.prototype.width=function(){return qt(this.dw)?this._w.Pd("left"===this.dw?"left":"right"):0},t.prototype.Gt=function(){return f(this._w.vt().vf(this.dw)).$},t}(),_h=function(){function t(t){this.ww=new it,this.ir=new it,this.si=t,this.rl().Xr().Ji(this.Mw.bind(this)),this.rl().Zr().Ji(this.bw.bind(this));}return t.prototype.en=function(){this.rl().Xr().hn(this),this.rl().Zr().hn(this),this.ww.en();},t.prototype.scrollPosition=function(){return this.rl().Rr()},t.prototype.scrollToPosition=function(t,i){i?this.rl().$r(t,1e3):this.si.wr(t);},t.prototype.scrollToRealTime=function(){this.rl().Kr();},t.prototype.getVisibleRange=function(){var t,i,n=this.rl().gr();return null===n?null:{from:null!==(t=n.from.Cs)&&void 0!==t?t:n.from.As,to:null!==(i=n.to.Cs)&&void 0!==i?i:n.to.As}},t.prototype.setVisibleRange=function(t){var i={from:$n(t.from),to:$n(t.to)},n=this.rl().Sr(i);this.si.Vf(n);},t.prototype.getVisibleLogicalRange=function(){var t=this.rl().pr();return null===t?null:{from:t.ss(),to:t.rs()}},t.prototype.setVisibleLogicalRange=function(t){o(t.from<=t.to,"The from index cannot be after the to index."),this.si.Vf(t);},t.prototype.resetTimeScale=function(){this.si.Ne();},t.prototype.fitContent=function(){this.si.Qr();},t.prototype.logicalToCoordinate=function(t){var i=this.si.U();return i.ti()?null:i.G(t)},t.prototype.coordinateToLogical=function(t){var i=this.si.U();return i.ti()?null:i.Er(t)},t.prototype.timeToCoordinate=function(t){var i=$n(t),n=this.si.U(),h=n.Mr(i,!1);return null===h?null:n.G(h)},t.prototype.coordinateToTime=function(t){var i,n=this.si.U(),h=n.Er(t),s=n.ri(h);return null===s?null:null!==(i=s.Cs)&&void 0!==i?i:s.As},t.prototype.subscribeVisibleTimeRangeChange=function(t){this.ww.Ji(t);},t.prototype.unsubscribeVisibleTimeRangeChange=function(t){this.ww.nn(t);},t.prototype.subscribeVisibleLogicalRangeChange=function(t){this.ir.Ji(t);},t.prototype.unsubscribeVisibleLogicalRangeChange=function(t){this.ir.nn(t);},t.prototype.applyOptions=function(t){this.rl().sh(t);},t.prototype.options=function(){return b(this.rl().ct())},t.prototype.rl=function(){return this.si.U()},t.prototype.Mw=function(){this.ww.rn()&&this.ww.sn(this.getVisibleRange());},t.prototype.bw=function(){this.ir.rn()&&this.ir.sn(this.getVisibleLogicalRange());},t}();function dh(t){if(void 0!==t&&"custom"!==t.type){var i=t;void 0!==i.minMove&&void 0===i.precision&&(i.precision=function(t){if(t>=1)return 0;for(var i=0;i<8;i++){var n=Math.round(t);if(Math.abs(n-t)<1e-8)return i;t*=10;}return i}(i.minMove));}}function wh(t){return function(t){if(M(t.handleScale)){var i=t.handleScale;t.handleScale={axisDoubleClickReset:i,axisPressedMouseMove:{time:i,price:i},mouseWheel:i,pinch:i};}else if(void 0!==t.handleScale&&M(t.handleScale.axisPressedMouseMove)){var n=t.handleScale.axisPressedMouseMove;t.handleScale.axisPressedMouseMove={time:n,price:n};}var h=t.handleScroll;M(h)&&(t.handleScroll={horzTouchDrag:h,vertTouchDrag:h,mouseWheel:h,pressedMouseMove:h});}(t),function(t){if(t.priceScale){t.leftPriceScale=t.leftPriceScale||{},t.rightPriceScale=t.rightPriceScale||{};var i=t.priceScale.position;delete t.priceScale.position,t.leftPriceScale=v(t.leftPriceScale,t.priceScale),t.rightPriceScale=v(t.rightPriceScale,t.priceScale),"left"===i&&(t.leftPriceScale.visible=!0,t.rightPriceScale.visible=!1),"right"===i&&(t.leftPriceScale.visible=!1,t.rightPriceScale.visible=!0),"none"===i&&(t.leftPriceScale.visible=!1,t.rightPriceScale.visible=!1),t.overlayPriceScales=t.overlayPriceScales||{},void 0!==t.priceScale.invertScale&&(t.overlayPriceScales.invertScale=t.priceScale.invertScale),void 0!==t.priceScale.scaleMargins&&(t.overlayPriceScales.scaleMargins=t.priceScale.scaleMargins);}}(t),function(t){t.layout&&t.layout.backgroundColor&&!t.layout.background&&(t.layout.background={type:"solid",color:t.layout.backgroundColor});}(t),t}var Mh=function(){function t(t,i){var n=this;this.mw=new Gn,this.pw=new Map,this.gw=new Map,this.yw=new it,this.kw=new it;var h=void 0===i?b(eh):v(b(eh),wh(i));this._w=new En(t,h),this._w.V_().Ji((function(t){n.yw.rn()&&n.yw.sn(n.xw(t()));}),this),this._w.Mf().Ji((function(t){n.kw.rn()&&n.kw.sn(n.xw(t()));}),this);var s=this._w.vt();this.Nw=new _h(s);}return t.prototype.remove=function(){this._w.V_().hn(this),this._w.Mf().hn(this),this.Nw.en(),this._w.en(),this.pw.clear(),this.gw.clear(),this.yw.en(),this.kw.en(),this.mw.en();},t.prototype.resize=function(t,i,n){this._w.Td(t,i,n);},t.prototype.addAreaSeries=function(t){void 0===t&&(t={}),dh((t=ih(t)).priceFormat);var i=v(b(ch),lh,t),n=this._w.vt().Bf("Area",i),h=new nh(n,this,this);return this.pw.set(h,n),this.gw.set(n,h),h},t.prototype.addBarSeries=function(t){void 0===t&&(t={}),dh((t=ih(t)).priceFormat);var i=v(b(ch),ah,t),n=this._w.vt().Bf("Bar",i),h=new nh(n,this,this);return this.pw.set(h,n),this.gw.set(n,h),h},t.prototype.addCandlestickSeries=function(t){void 0===t&&(t={}),xt(t=ih(t)),dh(t.priceFormat);var i=v(b(ch),uh,t),n=this._w.vt().Bf("Candlestick",i),h=new hh(n,this,this);return this.pw.set(h,n),this.gw.set(n,h),h},t.prototype.addHistogramSeries=function(t){void 0===t&&(t={}),dh((t=ih(t)).priceFormat);var i=v(b(ch),fh,t),n=this._w.vt().Bf("Histogram",i),h=new nh(n,this,this);return this.pw.set(h,n),this.gw.set(n,h),h},t.prototype.addLineSeries=function(t){void 0===t&&(t={}),dh((t=ih(t)).priceFormat);var i=v(b(ch),oh,t),n=this._w.vt().Bf("Line",i),h=new nh(n,this,this);return this.pw.set(h,n),this.gw.set(n,h),h},t.prototype.removeSeries=function(t){var i=l(this.pw.get(t)),n=this.mw.Ff(i);this._w.vt().Ff(i),this.Sw(n),this.pw.delete(t),this.gw.delete(i);},t.prototype.cw=function(t,i){this.Sw(this.mw.Qd(t,i));},t.prototype.Bo=function(t,i){this.Sw(this.mw.hw(t,i));},t.prototype.subscribeClick=function(t){this.yw.Ji(t);},t.prototype.unsubscribeClick=function(t){this.yw.nn(t);},t.prototype.subscribeCrosshairMove=function(t){this.kw.Ji(t);},t.prototype.unsubscribeCrosshairMove=function(t){this.kw.nn(t);},t.prototype.priceScale=function(t){return void 0===t&&(t=this._w.vt().Of()),new vh(this._w,t)},t.prototype.timeScale=function(){return this.Nw},t.prototype.applyOptions=function(t){this._w.sh(wh(t));},t.prototype.options=function(){return this._w.ct()},t.prototype.takeScreenshot=function(){return this._w.Vd()},t.prototype.Sw=function(t){var i=this._w.vt();i.Tf(t.U.Lr,t.U.aw),t.rw.forEach((function(t,i){return i.Bo(t.Wu,t.rf)})),i.Vr();},t.prototype.Cw=function(t){return l(this.gw.get(t))},t.prototype.xw=function(t){var i=this,n=new Map;t.Hd.forEach((function(t,h){n.set(i.Cw(h),t);}));var h=void 0===t.qd?void 0:this.Cw(t.qd);return {time:t.C&&(t.C.Cs||t.C.As),point:t.jd,hoveredSeries:h,hoveredMarkerId:t.Yd,seriesPrices:n}},t}();function bh(t,i){var n;if(w(t)){var h=document.getElementById(t);o(null!==h,"Cannot find element in DOM with id="+t),n=h;}else n=t;return new Mh(n,i)}

    function ensure(value) {
        if (value === null || value === undefined) {
            throw new Error('no value');
        }
        return value;
    }

    function collection(target, params = [], factory, reference) {
        const collection = new Map();
        for (const current of params) {
            const result = factory(target, current);
            result.updateReference(reference(current));
            collection.set(current.id, result);
        }
        return {
            update(nextParams = []) {
                const existing = new Set(collection.keys());
                const next = new Map(nextParams.map((item) => [item.id, item]));
                for (const id of existing) {
                    if (!next.has(id)) {
                        const entry = ensure(collection.get(id));
                        entry.destroy();
                        collection.delete(id);
                    }
                }
                for (const [id, options] of next.entries()) {
                    const entry = collection.get(id);
                    if (entry === undefined) {
                        const created = factory(target, options);
                        created.updateReference(reference(options));
                        collection.set(id, created);
                    }
                    else {
                        entry.update(options);
                        entry.updateReference(reference(options));
                    }
                }
            },
            destroy() {
                for (const current of collection.values()) {
                    current.destroy();
                }
            }
        };
    }

    function linesCollection(target, params = []) {
        return collection(target, params, line, (p) => p.reference);
    }
    function line(target, params) {
        const subject = target.createPriceLine(params.options);
        let reference;
        return {
            update(nextParams) {
                if (nextParams.options) {
                    subject.applyOptions(nextParams.options);
                }
            },
            updateReference(nextReference) {
                if (nextReference !== reference) {
                    reference === null || reference === void 0 ? void 0 : reference(null);
                    reference = nextReference;
                    reference === null || reference === void 0 ? void 0 : reference(subject);
                }
            },
            destroy() {
                reference === null || reference === void 0 ? void 0 : reference(null);
                target.removePriceLine(subject);
            }
        };
    }

    function seriesCollection(target, params = []) {
        return collection(target, params, series, (p) => p.reference);
    }
    function series(target, params) {
        let subject = createSeries(target, params);
        let reference;
        let lines = linesCollection(subject, params.priceLines);
        return {
            update(nextParams) {
                if (nextParams.type !== subject.seriesType()) {
                    lines.destroy();
                    target.removeSeries(subject);
                    // TODO: where is reference update?
                    subject = createSeries(target, nextParams);
                    lines = linesCollection(subject, params.priceLines);
                    return;
                }
                if (nextParams.options) {
                    subject.applyOptions(nextParams.options);
                }
                lines.update(nextParams.priceLines);
            },
            updateReference(nextReference) {
                if (nextReference !== reference) {
                    reference === null || reference === void 0 ? void 0 : reference(null);
                    reference = nextReference;
                    reference === null || reference === void 0 ? void 0 : reference(subject);
                }
            },
            destroy() {
                reference === null || reference === void 0 ? void 0 : reference(null);
                target.removeSeries(subject);
            }
        };
    }
    function createSeries(chart, params) {
        switch (params.type) {
            case 'Area': {
                const series = chart.addAreaSeries(params.options);
                series.setData(params.data);
                return series;
            }
            case 'Bar': {
                const series = chart.addBarSeries(params.options);
                series.setData(params.data);
                return series;
            }
            case 'Candlestick': {
                const series = chart.addCandlestickSeries(params.options);
                series.setData(params.data);
                return series;
            }
            case 'Histogram': {
                const series = chart.addHistogramSeries(params.options);
                series.setData(params.data);
                return series;
            }
            case 'Line': {
                const series = chart.addLineSeries(params.options);
                series.setData(params.data);
                return series;
            }
        }
    }

    function context(value) {
        if (typeof value !== 'undefined') {
            setContext('lightweight-chart-context', value);
        }
        else {
            return getContext('lightweight-chart-context');
        }
    }
    function useSeriesEffect(callback) {
        let subject = null;
        const api = context();
        onMount(() => {
            const [params] = callback();
            subject = series(api, params);
            return () => {
                subject === null || subject === void 0 ? void 0 : subject.destroy();
                subject = null;
            };
        });
        afterUpdate(() => {
            const [params, ref] = callback();
            subject === null || subject === void 0 ? void 0 : subject.update(params);
            subject === null || subject === void 0 ? void 0 : subject.updateReference(ref);
        });
    }

    /* node_modules/svelte-lightweight-charts/components/internal/context-provider.svelte generated by Svelte v3.42.6 */

    function create_fragment$4(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Context_provider', slots, ['default']);
    	
    	let { value } = $$props;
    	const writable_props = ['value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Context_provider> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ context, value });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			context(value);
    		}
    	};

    	return [value, $$scope, slots];
    }

    class Context_provider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Context_provider",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Context_provider> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<Context_provider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Context_provider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function chart(node, params) {
        var _a, _b;
        let { options, reference, onClick, onCrosshairMove, } = params;
        let width = (_a = options === null || options === void 0 ? void 0 : options.width) !== null && _a !== void 0 ? _a : 0;
        let height = (_b = options === null || options === void 0 ? void 0 : options.height) !== null && _b !== void 0 ? _b : 0;
        const chart = bh(node, options);
        reference === null || reference === void 0 ? void 0 : reference(chart);
        const series = seriesCollection(chart, params.series);
        if (onClick) {
            chart.subscribeClick(onClick);
        }
        if (onCrosshairMove) {
            chart.subscribeCrosshairMove(onCrosshairMove);
        }
        return {
            update(nextParams) {
                var _a, _b;
                const { options: nextOptions, reference: nextReference, onClick: nextOnClick, onCrosshairMove: nextOnCrosshairMove, } = nextParams;
                if (nextReference !== reference) {
                    reference === null || reference === void 0 ? void 0 : reference(null);
                    reference = nextReference;
                    reference === null || reference === void 0 ? void 0 : reference(chart);
                }
                if (nextOptions) {
                    chart.applyOptions(nextOptions);
                    if (nextOptions.width !== undefined && nextOptions.width !== width
                        || nextOptions.height !== undefined && nextOptions.height !== height) {
                        width = (_a = nextOptions.width) !== null && _a !== void 0 ? _a : width;
                        height = (_b = nextOptions.height) !== null && _b !== void 0 ? _b : height;
                        chart.resize(width, height, true);
                    }
                    options = nextOptions;
                }
                series.update(nextParams.series);
                if (nextOnClick !== onClick) {
                    if (onClick) {
                        chart.unsubscribeCrosshairMove(onClick);
                    }
                    onClick = nextOnClick;
                    if (onClick) {
                        chart.subscribeCrosshairMove(onClick);
                    }
                }
                if (nextOnCrosshairMove !== onCrosshairMove) {
                    if (onCrosshairMove) {
                        chart.unsubscribeCrosshairMove(onCrosshairMove);
                    }
                    onCrosshairMove = nextOnCrosshairMove;
                    if (onCrosshairMove) {
                        chart.subscribeCrosshairMove(onCrosshairMove);
                    }
                }
            },
            destroy() {
                series.destroy();
                if (onClick) {
                    chart.unsubscribeCrosshairMove(onClick);
                }
                if (onCrosshairMove) {
                    chart.unsubscribeCrosshairMove(onCrosshairMove);
                }
                chart.remove();
                reference === null || reference === void 0 ? void 0 : reference(null);
            }
        };
    }

    /* node_modules/svelte-lightweight-charts/components/chart.svelte generated by Svelte v3.42.6 */
    const file$2 = "node_modules/svelte-lightweight-charts/components/chart.svelte";

    // (75:4) {#if reference !== null}
    function create_if_block$1(ctx) {
    	let contextprovider;
    	let current;

    	contextprovider = new Context_provider({
    			props: {
    				value: /*reference*/ ctx[1],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contextprovider.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contextprovider, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const contextprovider_changes = {};
    			if (dirty & /*reference*/ 2) contextprovider_changes.value = /*reference*/ ctx[1];

    			if (dirty & /*$$scope*/ 1048576) {
    				contextprovider_changes.$$scope = { dirty, ctx };
    			}

    			contextprovider.$set(contextprovider_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contextprovider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contextprovider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contextprovider, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(75:4) {#if reference !== null}",
    		ctx
    	});

    	return block;
    }

    // (76:8) <ContextProvider value={reference}>
    function create_default_slot$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[20],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[20])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[20], dirty, null),
    						null
    					);
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(76:8) <ContextProvider value={reference}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let chart_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*reference*/ ctx[1] !== null && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(div, file$2, 68, 0, 1984);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(chart_action = chart.call(null, div, {
    					options: /*options*/ ctx[0],
    					onCrosshairMove: /*handleCrosshairMove*/ ctx[3],
    					onClick: /*handleClick*/ ctx[4],
    					reference: /*handleReference*/ ctx[2]
    				}));

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*reference*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*reference*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
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

    			if (chart_action && is_function(chart_action.update) && dirty & /*options, handleReference*/ 5) chart_action.update.call(null, {
    				options: /*options*/ ctx[0],
    				onCrosshairMove: /*handleCrosshairMove*/ ctx[3],
    				onClick: /*handleClick*/ ctx[4],
    				reference: /*handleReference*/ ctx[2]
    			});
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chart', slots, ['default']);
    	
    	
    	
    	const dispatch = createEventDispatcher();
    	let { width = 0 } = $$props;
    	let { height = 0 } = $$props;
    	let { watermark = undefined } = $$props;
    	let { layout = undefined } = $$props;
    	let { leftPriceScale = undefined } = $$props;
    	let { rightPriceScale = undefined } = $$props;
    	let { overlayPriceScales = undefined } = $$props;
    	let { timeScale = undefined } = $$props;
    	let { crosshair = undefined } = $$props;
    	let { grid = undefined } = $$props;
    	let { localization = undefined } = $$props;
    	let { handleScroll = undefined } = $$props;
    	let { handleScale = undefined } = $$props;
    	let { ref = undefined } = $$props;
    	let options = undefined;
    	let reference = null;
    	let handleReference = undefined;

    	function handleCrosshairMove(params) {
    		dispatch('crosshairMove', params);
    	}

    	function handleClick(params) {
    		dispatch('click', params);
    	}

    	const writable_props = [
    		'width',
    		'height',
    		'watermark',
    		'layout',
    		'leftPriceScale',
    		'rightPriceScale',
    		'overlayPriceScales',
    		'timeScale',
    		'crosshair',
    		'grid',
    		'localization',
    		'handleScroll',
    		'handleScale',
    		'ref'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('width' in $$props) $$invalidate(5, width = $$props.width);
    		if ('height' in $$props) $$invalidate(6, height = $$props.height);
    		if ('watermark' in $$props) $$invalidate(7, watermark = $$props.watermark);
    		if ('layout' in $$props) $$invalidate(8, layout = $$props.layout);
    		if ('leftPriceScale' in $$props) $$invalidate(9, leftPriceScale = $$props.leftPriceScale);
    		if ('rightPriceScale' in $$props) $$invalidate(10, rightPriceScale = $$props.rightPriceScale);
    		if ('overlayPriceScales' in $$props) $$invalidate(11, overlayPriceScales = $$props.overlayPriceScales);
    		if ('timeScale' in $$props) $$invalidate(12, timeScale = $$props.timeScale);
    		if ('crosshair' in $$props) $$invalidate(13, crosshair = $$props.crosshair);
    		if ('grid' in $$props) $$invalidate(14, grid = $$props.grid);
    		if ('localization' in $$props) $$invalidate(15, localization = $$props.localization);
    		if ('handleScroll' in $$props) $$invalidate(16, handleScroll = $$props.handleScroll);
    		if ('handleScale' in $$props) $$invalidate(17, handleScale = $$props.handleScale);
    		if ('ref' in $$props) $$invalidate(18, ref = $$props.ref);
    		if ('$$scope' in $$props) $$invalidate(20, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ContextProvider: Context_provider,
    		chart,
    		dispatch,
    		width,
    		height,
    		watermark,
    		layout,
    		leftPriceScale,
    		rightPriceScale,
    		overlayPriceScales,
    		timeScale,
    		crosshair,
    		grid,
    		localization,
    		handleScroll,
    		handleScale,
    		ref,
    		options,
    		reference,
    		handleReference,
    		handleCrosshairMove,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(5, width = $$props.width);
    		if ('height' in $$props) $$invalidate(6, height = $$props.height);
    		if ('watermark' in $$props) $$invalidate(7, watermark = $$props.watermark);
    		if ('layout' in $$props) $$invalidate(8, layout = $$props.layout);
    		if ('leftPriceScale' in $$props) $$invalidate(9, leftPriceScale = $$props.leftPriceScale);
    		if ('rightPriceScale' in $$props) $$invalidate(10, rightPriceScale = $$props.rightPriceScale);
    		if ('overlayPriceScales' in $$props) $$invalidate(11, overlayPriceScales = $$props.overlayPriceScales);
    		if ('timeScale' in $$props) $$invalidate(12, timeScale = $$props.timeScale);
    		if ('crosshair' in $$props) $$invalidate(13, crosshair = $$props.crosshair);
    		if ('grid' in $$props) $$invalidate(14, grid = $$props.grid);
    		if ('localization' in $$props) $$invalidate(15, localization = $$props.localization);
    		if ('handleScroll' in $$props) $$invalidate(16, handleScroll = $$props.handleScroll);
    		if ('handleScale' in $$props) $$invalidate(17, handleScale = $$props.handleScale);
    		if ('ref' in $$props) $$invalidate(18, ref = $$props.ref);
    		if ('options' in $$props) $$invalidate(0, options = $$props.options);
    		if ('reference' in $$props) $$invalidate(1, reference = $$props.reference);
    		if ('handleReference' in $$props) $$invalidate(2, handleReference = $$props.handleReference);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, height, watermark, layout, leftPriceScale, rightPriceScale, overlayPriceScales, timeScale, crosshair, grid, localization, handleScroll, handleScale*/ 262112) {
    			$$invalidate(0, options = {
    				width,
    				height,
    				watermark,
    				layout,
    				leftPriceScale,
    				rightPriceScale,
    				overlayPriceScales,
    				timeScale,
    				crosshair,
    				grid,
    				localization,
    				handleScroll,
    				handleScale
    			});
    		}

    		if ($$self.$$.dirty & /*ref*/ 262144) {
    			$$invalidate(2, handleReference = chart => {
    				$$invalidate(1, reference = chart);

    				if (ref !== undefined) {
    					ref(chart);
    				}
    			});
    		}
    	};

    	return [
    		options,
    		reference,
    		handleReference,
    		handleCrosshairMove,
    		handleClick,
    		width,
    		height,
    		watermark,
    		layout,
    		leftPriceScale,
    		rightPriceScale,
    		overlayPriceScales,
    		timeScale,
    		crosshair,
    		grid,
    		localization,
    		handleScroll,
    		handleScale,
    		ref,
    		slots,
    		$$scope
    	];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, not_equal, {
    			width: 5,
    			height: 6,
    			watermark: 7,
    			layout: 8,
    			leftPriceScale: 9,
    			rightPriceScale: 10,
    			overlayPriceScales: 11,
    			timeScale: 12,
    			crosshair: 13,
    			grid: 14,
    			localization: 15,
    			handleScroll: 16,
    			handleScale: 17,
    			ref: 18
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get width() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get watermark() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set watermark(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leftPriceScale() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leftPriceScale(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rightPriceScale() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rightPriceScale(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get overlayPriceScales() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set overlayPriceScales(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeScale() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeScale(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get crosshair() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set crosshair(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grid() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grid(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get localization() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set localization(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleScroll() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleScroll(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleScale() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleScale(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightweight-charts/components/candlestick-series.svelte generated by Svelte v3.42.6 */

    // (115:0) {#if reference !== null}
    function create_if_block(ctx) {
    	let contextprovider;
    	let current;

    	contextprovider = new Context_provider({
    			props: {
    				value: /*reference*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contextprovider.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contextprovider, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const contextprovider_changes = {};
    			if (dirty[0] & /*reference*/ 1) contextprovider_changes.value = /*reference*/ ctx[0];

    			if (dirty[0] & /*$$scope*/ 1073741824) {
    				contextprovider_changes.$$scope = { dirty, ctx };
    			}

    			contextprovider.$set(contextprovider_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contextprovider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contextprovider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contextprovider, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(115:0) {#if reference !== null}",
    		ctx
    	});

    	return block;
    }

    // (116:4) <ContextProvider value={reference}>
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[30], null);

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
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 1073741824)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[30],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[30])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[30], dirty, null),
    						null
    					);
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(116:4) <ContextProvider value={reference}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*reference*/ ctx[0] !== null && create_if_block(ctx);

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
    		p: function update(ctx, dirty) {
    			if (/*reference*/ ctx[0] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*reference*/ 1) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Candlestick_series', slots, ['default']);
    	
    	
    	
    	let { lastValueVisible = undefined } = $$props;
    	let { title = undefined } = $$props;
    	let { priceScaleId = undefined } = $$props;
    	let { visible = undefined } = $$props;
    	let { priceLineVisible = undefined } = $$props;
    	let { priceLineSource = undefined } = $$props;
    	let { priceLineWidth = undefined } = $$props;
    	let { priceLineColor = undefined } = $$props;
    	let { priceLineStyle = undefined } = $$props;
    	let { priceFormat = undefined } = $$props;
    	let { baseLineVisible = undefined } = $$props;
    	let { baseLineColor = undefined } = $$props;
    	let { baseLineWidth = undefined } = $$props;
    	let { baseLineStyle = undefined } = $$props;
    	let { autoscaleInfoProvider = undefined } = $$props;
    	let { scaleMargins = undefined } = $$props;
    	let { upColor = undefined } = $$props;
    	let { downColor = undefined } = $$props;
    	let { wickVisible = undefined } = $$props;
    	let { borderVisible = undefined } = $$props;
    	let { borderColor = undefined } = $$props;
    	let { borderUpColor = undefined } = $$props;
    	let { borderDownColor = undefined } = $$props;
    	let { wickColor = undefined } = $$props;
    	let { wickUpColor = undefined } = $$props;
    	let { wickDownColor = undefined } = $$props;
    	let { ref = undefined } = $$props;
    	let { data = [] } = $$props;
    	let options;
    	let reference = null;
    	let handleReference = undefined;
    	const id = performance.now().toString();
    	useSeriesEffect(() => [{ id, type: 'Candlestick', options, data }, handleReference]);

    	const writable_props = [
    		'lastValueVisible',
    		'title',
    		'priceScaleId',
    		'visible',
    		'priceLineVisible',
    		'priceLineSource',
    		'priceLineWidth',
    		'priceLineColor',
    		'priceLineStyle',
    		'priceFormat',
    		'baseLineVisible',
    		'baseLineColor',
    		'baseLineWidth',
    		'baseLineStyle',
    		'autoscaleInfoProvider',
    		'scaleMargins',
    		'upColor',
    		'downColor',
    		'wickVisible',
    		'borderVisible',
    		'borderColor',
    		'borderUpColor',
    		'borderDownColor',
    		'wickColor',
    		'wickUpColor',
    		'wickDownColor',
    		'ref',
    		'data'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Candlestick_series> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('lastValueVisible' in $$props) $$invalidate(1, lastValueVisible = $$props.lastValueVisible);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('priceScaleId' in $$props) $$invalidate(3, priceScaleId = $$props.priceScaleId);
    		if ('visible' in $$props) $$invalidate(4, visible = $$props.visible);
    		if ('priceLineVisible' in $$props) $$invalidate(5, priceLineVisible = $$props.priceLineVisible);
    		if ('priceLineSource' in $$props) $$invalidate(6, priceLineSource = $$props.priceLineSource);
    		if ('priceLineWidth' in $$props) $$invalidate(7, priceLineWidth = $$props.priceLineWidth);
    		if ('priceLineColor' in $$props) $$invalidate(8, priceLineColor = $$props.priceLineColor);
    		if ('priceLineStyle' in $$props) $$invalidate(9, priceLineStyle = $$props.priceLineStyle);
    		if ('priceFormat' in $$props) $$invalidate(10, priceFormat = $$props.priceFormat);
    		if ('baseLineVisible' in $$props) $$invalidate(11, baseLineVisible = $$props.baseLineVisible);
    		if ('baseLineColor' in $$props) $$invalidate(12, baseLineColor = $$props.baseLineColor);
    		if ('baseLineWidth' in $$props) $$invalidate(13, baseLineWidth = $$props.baseLineWidth);
    		if ('baseLineStyle' in $$props) $$invalidate(14, baseLineStyle = $$props.baseLineStyle);
    		if ('autoscaleInfoProvider' in $$props) $$invalidate(15, autoscaleInfoProvider = $$props.autoscaleInfoProvider);
    		if ('scaleMargins' in $$props) $$invalidate(16, scaleMargins = $$props.scaleMargins);
    		if ('upColor' in $$props) $$invalidate(17, upColor = $$props.upColor);
    		if ('downColor' in $$props) $$invalidate(18, downColor = $$props.downColor);
    		if ('wickVisible' in $$props) $$invalidate(19, wickVisible = $$props.wickVisible);
    		if ('borderVisible' in $$props) $$invalidate(20, borderVisible = $$props.borderVisible);
    		if ('borderColor' in $$props) $$invalidate(21, borderColor = $$props.borderColor);
    		if ('borderUpColor' in $$props) $$invalidate(22, borderUpColor = $$props.borderUpColor);
    		if ('borderDownColor' in $$props) $$invalidate(23, borderDownColor = $$props.borderDownColor);
    		if ('wickColor' in $$props) $$invalidate(24, wickColor = $$props.wickColor);
    		if ('wickUpColor' in $$props) $$invalidate(25, wickUpColor = $$props.wickUpColor);
    		if ('wickDownColor' in $$props) $$invalidate(26, wickDownColor = $$props.wickDownColor);
    		if ('ref' in $$props) $$invalidate(27, ref = $$props.ref);
    		if ('data' in $$props) $$invalidate(28, data = $$props.data);
    		if ('$$scope' in $$props) $$invalidate(30, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ContextProvider: Context_provider,
    		useSeriesEffect,
    		lastValueVisible,
    		title,
    		priceScaleId,
    		visible,
    		priceLineVisible,
    		priceLineSource,
    		priceLineWidth,
    		priceLineColor,
    		priceLineStyle,
    		priceFormat,
    		baseLineVisible,
    		baseLineColor,
    		baseLineWidth,
    		baseLineStyle,
    		autoscaleInfoProvider,
    		scaleMargins,
    		upColor,
    		downColor,
    		wickVisible,
    		borderVisible,
    		borderColor,
    		borderUpColor,
    		borderDownColor,
    		wickColor,
    		wickUpColor,
    		wickDownColor,
    		ref,
    		data,
    		options,
    		reference,
    		handleReference,
    		id
    	});

    	$$self.$inject_state = $$props => {
    		if ('lastValueVisible' in $$props) $$invalidate(1, lastValueVisible = $$props.lastValueVisible);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('priceScaleId' in $$props) $$invalidate(3, priceScaleId = $$props.priceScaleId);
    		if ('visible' in $$props) $$invalidate(4, visible = $$props.visible);
    		if ('priceLineVisible' in $$props) $$invalidate(5, priceLineVisible = $$props.priceLineVisible);
    		if ('priceLineSource' in $$props) $$invalidate(6, priceLineSource = $$props.priceLineSource);
    		if ('priceLineWidth' in $$props) $$invalidate(7, priceLineWidth = $$props.priceLineWidth);
    		if ('priceLineColor' in $$props) $$invalidate(8, priceLineColor = $$props.priceLineColor);
    		if ('priceLineStyle' in $$props) $$invalidate(9, priceLineStyle = $$props.priceLineStyle);
    		if ('priceFormat' in $$props) $$invalidate(10, priceFormat = $$props.priceFormat);
    		if ('baseLineVisible' in $$props) $$invalidate(11, baseLineVisible = $$props.baseLineVisible);
    		if ('baseLineColor' in $$props) $$invalidate(12, baseLineColor = $$props.baseLineColor);
    		if ('baseLineWidth' in $$props) $$invalidate(13, baseLineWidth = $$props.baseLineWidth);
    		if ('baseLineStyle' in $$props) $$invalidate(14, baseLineStyle = $$props.baseLineStyle);
    		if ('autoscaleInfoProvider' in $$props) $$invalidate(15, autoscaleInfoProvider = $$props.autoscaleInfoProvider);
    		if ('scaleMargins' in $$props) $$invalidate(16, scaleMargins = $$props.scaleMargins);
    		if ('upColor' in $$props) $$invalidate(17, upColor = $$props.upColor);
    		if ('downColor' in $$props) $$invalidate(18, downColor = $$props.downColor);
    		if ('wickVisible' in $$props) $$invalidate(19, wickVisible = $$props.wickVisible);
    		if ('borderVisible' in $$props) $$invalidate(20, borderVisible = $$props.borderVisible);
    		if ('borderColor' in $$props) $$invalidate(21, borderColor = $$props.borderColor);
    		if ('borderUpColor' in $$props) $$invalidate(22, borderUpColor = $$props.borderUpColor);
    		if ('borderDownColor' in $$props) $$invalidate(23, borderDownColor = $$props.borderDownColor);
    		if ('wickColor' in $$props) $$invalidate(24, wickColor = $$props.wickColor);
    		if ('wickUpColor' in $$props) $$invalidate(25, wickUpColor = $$props.wickUpColor);
    		if ('wickDownColor' in $$props) $$invalidate(26, wickDownColor = $$props.wickDownColor);
    		if ('ref' in $$props) $$invalidate(27, ref = $$props.ref);
    		if ('data' in $$props) $$invalidate(28, data = $$props.data);
    		if ('options' in $$props) options = $$props.options;
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    		if ('handleReference' in $$props) handleReference = $$props.handleReference;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*lastValueVisible, title, priceScaleId, visible, priceLineVisible, priceLineSource, priceLineWidth, priceLineColor, priceLineStyle, priceFormat, baseLineVisible, baseLineColor, baseLineWidth, baseLineStyle, autoscaleInfoProvider, scaleMargins, upColor, downColor, wickColor, borderColor, borderUpColor, borderDownColor, wickVisible, borderVisible, wickUpColor, wickDownColor*/ 134217726) {
    			options = {
    				lastValueVisible,
    				title,
    				priceScaleId,
    				visible,
    				priceLineVisible,
    				priceLineSource,
    				priceLineWidth,
    				priceLineColor,
    				priceLineStyle,
    				priceFormat,
    				baseLineVisible,
    				baseLineColor,
    				baseLineWidth,
    				baseLineStyle,
    				autoscaleInfoProvider,
    				scaleMargins,
    				upColor,
    				downColor,
    				wickColor,
    				borderColor,
    				borderUpColor,
    				borderDownColor,
    				wickVisible,
    				borderVisible,
    				wickUpColor,
    				wickDownColor
    			};
    		}

    		if ($$self.$$.dirty[0] & /*ref*/ 134217728) {
    			handleReference = series => {
    				$$invalidate(0, reference = series);

    				if (ref !== undefined) {
    					ref(series);
    				}
    			};
    		}
    	};

    	return [
    		reference,
    		lastValueVisible,
    		title,
    		priceScaleId,
    		visible,
    		priceLineVisible,
    		priceLineSource,
    		priceLineWidth,
    		priceLineColor,
    		priceLineStyle,
    		priceFormat,
    		baseLineVisible,
    		baseLineColor,
    		baseLineWidth,
    		baseLineStyle,
    		autoscaleInfoProvider,
    		scaleMargins,
    		upColor,
    		downColor,
    		wickVisible,
    		borderVisible,
    		borderColor,
    		borderUpColor,
    		borderDownColor,
    		wickColor,
    		wickUpColor,
    		wickDownColor,
    		ref,
    		data,
    		slots,
    		$$scope
    	];
    }

    class Candlestick_series extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			not_equal,
    			{
    				lastValueVisible: 1,
    				title: 2,
    				priceScaleId: 3,
    				visible: 4,
    				priceLineVisible: 5,
    				priceLineSource: 6,
    				priceLineWidth: 7,
    				priceLineColor: 8,
    				priceLineStyle: 9,
    				priceFormat: 10,
    				baseLineVisible: 11,
    				baseLineColor: 12,
    				baseLineWidth: 13,
    				baseLineStyle: 14,
    				autoscaleInfoProvider: 15,
    				scaleMargins: 16,
    				upColor: 17,
    				downColor: 18,
    				wickVisible: 19,
    				borderVisible: 20,
    				borderColor: 21,
    				borderUpColor: 22,
    				borderDownColor: 23,
    				wickColor: 24,
    				wickUpColor: 25,
    				wickDownColor: 26,
    				ref: 27,
    				data: 28
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Candlestick_series",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get lastValueVisible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lastValueVisible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceScaleId() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceScaleId(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLineVisible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLineVisible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLineSource() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLineSource(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLineWidth() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLineWidth(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLineColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLineColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLineStyle() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLineStyle(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceFormat() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceFormat(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseLineVisible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseLineVisible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseLineColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseLineColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseLineWidth() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseLineWidth(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseLineStyle() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseLineStyle(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoscaleInfoProvider() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoscaleInfoProvider(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scaleMargins() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scaleMargins(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get upColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set upColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get downColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set downColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wickVisible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wickVisible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderVisible() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderVisible(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderUpColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderUpColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderDownColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderDownColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wickColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wickColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wickUpColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wickUpColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wickDownColor() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wickDownColor(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Candlestick_series>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Candlestick_series>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Stocks/StockDetails.svelte generated by Svelte v3.42.6 */
    const file$1 = "src/Stocks/StockDetails.svelte";

    // (78:0) <Chart {...options}>
    function create_default_slot(ctx) {
    	let candlestickseries;
    	let current;

    	candlestickseries = new Candlestick_series({
    			props: {
    				data: /*data*/ ctx[1],
    				upColor: "rgba(255, 144, 0, 1)",
    				downColor: "#000",
    				borderDownColor: "rgba(255, 144, 0, 1)",
    				borderUpColor: "rgba(255, 144, 0, 1)",
    				wickDownColor: "rgba(255, 144, 0, 1)",
    				wickUpColor: "rgba(255, 144, 0, 1)"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(candlestickseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(candlestickseries, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(candlestickseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(candlestickseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(candlestickseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(78:0) <Chart {...options}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let chart;
    	let current;
    	const chart_spread_levels = [/*options*/ ctx[0]];

    	let chart_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < chart_spread_levels.length; i += 1) {
    		chart_props = assign(chart_props, chart_spread_levels[i]);
    	}

    	chart = new Chart({ props: chart_props, $$inline: true });

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Candlestick Chart";
    			t1 = space();
    			create_component(chart.$$.fragment);
    			add_location(h1, file$1, 76, 0, 2040);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(chart, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const chart_changes = (dirty & /*options*/ 1)
    			? get_spread_update(chart_spread_levels, [get_spread_object(/*options*/ ctx[0])])
    			: {};

    			if (dirty & /*$$scope*/ 8) {
    				chart_changes.$$scope = { dirty, ctx };
    			}

    			chart.$set(chart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_component(chart, detaching);
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

    function timeConverter(UNIX_timestamp) {
    	var a = new Date(UNIX_timestamp * 1000);
    	var year = a.getFullYear();
    	var month = a.getMonth() + "";

    	if (month.length < 2) {
    		month = "0" + month;
    	}

    	var date = a.getDate() + "";

    	if (date.length < 2) {
    		date = "0" + date;
    	}

    	var time = year + "-" + month + "-" + date;
    	return time;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StockDetails', slots, []);
    	let { stockData } = $$props;

    	const options = {
    		width: 500,
    		height: 300,
    		layout: {
    			backgroundColor: "#000000",
    			textColor: "rgba(255, 255, 255, 0.9)"
    		},
    		grid: {
    			vertLines: { color: "rgba(197, 203, 206, 0.5)" },
    			horzLines: { color: "rgba(197, 203, 206, 0.5)" }
    		},
    		crosshair: { mode: U.Normal },
    		rightPriceScale: { borderColor: "rgba(197, 203, 206, 0.8)" },
    		timeScale: { borderColor: "rgba(197, 203, 206, 0.8)" }
    	};

    	let data = [];

    	for (let i = 0; i < 50; i++) {
    		data.push({
    			time: timeConverter(stockData.t[i]),
    			open: stockData.o[i],
    			high: stockData.h[i],
    			low: stockData.l[i],
    			close: stockData.c[i]
    		});
    	}

    	const writable_props = ['stockData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StockDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('stockData' in $$props) $$invalidate(2, stockData = $$props.stockData);
    	};

    	$$self.$capture_state = () => ({
    		CrosshairMode: U,
    		Chart,
    		CandlestickSeries: Candlestick_series,
    		stockData,
    		options,
    		data,
    		timeConverter
    	});

    	$$self.$inject_state = $$props => {
    		if ('stockData' in $$props) $$invalidate(2, stockData = $$props.stockData);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [options, data, stockData];
    }

    class StockDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { stockData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StockDetails",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stockData*/ ctx[2] === undefined && !('stockData' in props)) {
    			console.warn("<StockDetails> was created without expected prop 'stockData'");
    		}
    	}

    	get stockData() {
    		throw new Error("<StockDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stockData(value) {
    		throw new Error("<StockDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.6 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t0;
    	let h2;
    	let t2;
    	let p;
    	let t4;
    	let input;
    	let t5;
    	let button;
    	let t7;
    	let section;
    	let stocklist;
    	let current;
    	let mounted;
    	let dispose;

    	header = new Header({
    			props: { caption: "Stock Tracker" },
    			$$inline: true
    		});

    	stocklist = new StockList({
    			props: { stocks: /*$stocks*/ ctx[1] },
    			$$inline: true
    		});

    	stocklist.$on("delete", /*delStock*/ ctx[4]);
    	stocklist.$on("update", /*updateStock*/ ctx[3]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Instructions:";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Search for a stock by using the searchbar below, and hit submit to get\n\t\tan up to date quote on it.";
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t7 = space();
    			section = element("section");
    			create_component(stocklist.$$.fragment);
    			add_location(h2, file, 96, 1, 2145);
    			add_location(p, file, 97, 1, 2169);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search");
    			add_location(input, file, 102, 1, 2283);
    			attr_dev(button, "class", "svelte-1dws1o3");
    			add_location(button, file, 103, 1, 2352);
    			attr_dev(section, "class", "svelte-1dws1o3");
    			add_location(section, file, 105, 1, 2398);
    			attr_dev(main, "class", "svelte-1dws1o3");
    			add_location(main, file, 94, 0, 2101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			append_dev(main, p);
    			append_dev(main, t4);
    			append_dev(main, input);
    			set_input_value(input, /*searchInput*/ ctx[0]);
    			append_dev(main, t5);
    			append_dev(main, button);
    			append_dev(main, t7);
    			append_dev(main, section);
    			mount_component(stocklist, section, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(button, "click", /*getStock*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchInput*/ 1 && input.value !== /*searchInput*/ ctx[0]) {
    				set_input_value(input, /*searchInput*/ ctx[0]);
    			}

    			const stocklist_changes = {};
    			if (dirty & /*$stocks*/ 2) stocklist_changes.stocks = /*$stocks*/ ctx[1];
    			stocklist.$set(stocklist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(stocklist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(stocklist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(stocklist);
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

    function instance($$self, $$props, $$invalidate) {
    	let $stocks;
    	validate_store(customStockStore, 'stocks');
    	component_subscribe($$self, customStockStore, $$value => $$invalidate(1, $stocks = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let apiKey = "c556jkqad3iak9epgvr0";
    	let apiToken = `&token=${apiKey}`;
    	let finnHubURL = "https://finnhub.io/api/v1/";
    	let searchInput = "";

    	async function getStock() {
    		try {
    			const tickerSearchResponse = await fetch(`${finnHubURL}search?q=${searchInput}${apiToken}`);
    			const firstResultJson = await tickerSearchResponse.json();
    			const { description, symbol } = firstResultJson.result[0];
    			const stockQuoteResponse = await fetch(`${finnHubURL}/quote?symbol=${symbol}${apiToken}`);
    			const stockQuoteJson = await stockQuoteResponse.json();

    			const stockToAdd = {
    				stockName: description,
    				tickerSymbol: symbol,
    				price: stockQuoteJson.c,
    				dp: stockQuoteJson.dp,
    				change: stockQuoteJson.d
    			};

    			customStockStore.addStock(stockToAdd);
    		} catch(err) {
    			console.log(`App::getStock error: ${err}`);
    		}
    	}

    	async function updateStock(event) {
    		let tickerSymbol = event.detail;

    		try {
    			const stockQuoteResponse = await fetch(`${finnHubURL}/quote?symbol=${tickerSymbol}${apiToken}`);
    			const stockQuoteJson = await stockQuoteResponse.json();

    			const stockData = {
    				price: stockQuoteJson.c,
    				dp: stockQuoteJson.dp,
    				change: stockQuoteJson.d
    			};

    			console.log(stockData);
    			customStockStore.updateStock(stockData, tickerSymbol);
    		} catch(err) {
    			console.log(`App::updateStock error: ${err}`);
    		}
    	}

    	function delStock(event) {
    		customStockStore.deleteStock(event.detail);
    	}

    	let candleData = "empty";

    	function getDetails() {
    		let symbol = "AAPL";

    		fetch(finnHubURL + "/stock/candle?symbol=" + symbol + "&resolution=30&from=1631781202&to=1632299602" + apiToken).then(res => {
    			return res.json();
    		}).then(data => {
    			candleData = data;
    			console.log(candleData);
    		}).catch(err => {
    			console.log(err);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchInput = this.value;
    		$$invalidate(0, searchInput);
    	}

    	$$self.$capture_state = () => ({
    		StockList,
    		stocks: customStockStore,
    		Header,
    		StockDetails,
    		apiKey,
    		apiToken,
    		finnHubURL,
    		searchInput,
    		getStock,
    		updateStock,
    		delStock,
    		candleData,
    		getDetails,
    		$stocks
    	});

    	$$self.$inject_state = $$props => {
    		if ('apiKey' in $$props) apiKey = $$props.apiKey;
    		if ('apiToken' in $$props) apiToken = $$props.apiToken;
    		if ('finnHubURL' in $$props) finnHubURL = $$props.finnHubURL;
    		if ('searchInput' in $$props) $$invalidate(0, searchInput = $$props.searchInput);
    		if ('candleData' in $$props) candleData = $$props.candleData;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchInput, $stocks, getStock, updateStock, delStock, input_input_handler];
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
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
