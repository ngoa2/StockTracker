
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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

    /* src/Stocks/StockItem.svelte generated by Svelte v3.42.6 */

    const file$2 = "src/Stocks/StockItem.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let div1;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let p4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(/*tickerSymbol*/ ctx[1]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*stockName*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = "$145";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = ".022%";
    			t7 = space();
    			p4 = element("p");
    			p4.textContent = "+32.49 Today";
    			attr_dev(p0, "id", "subtitle");
    			attr_dev(p0, "class", "svelte-1e3626s");
    			add_location(p0, file$2, 7, 8, 124);
    			attr_dev(p1, "id", "title");
    			attr_dev(p1, "class", "svelte-1e3626s");
    			add_location(p1, file$2, 8, 8, 168);
    			attr_dev(div0, "id", "name");
    			attr_dev(div0, "class", "svelte-1e3626s");
    			add_location(div0, file$2, 6, 4, 100);
    			attr_dev(p2, "id", "price");
    			attr_dev(p2, "class", "svelte-1e3626s");
    			add_location(p2, file$2, 12, 8, 240);
    			attr_dev(p3, "id", "percent-change");
    			attr_dev(p3, "class", "svelte-1e3626s");
    			add_location(p3, file$2, 13, 8, 271);
    			attr_dev(p4, "id", "change");
    			attr_dev(p4, "class", "svelte-1e3626s");
    			add_location(p4, file$2, 14, 8, 312);
    			attr_dev(div1, "id", "values");
    			attr_dev(div1, "class", "svelte-1e3626s");
    			add_location(div1, file$2, 11, 4, 214);
    			attr_dev(div2, "id", "container");
    			attr_dev(div2, "class", "svelte-1e3626s");
    			add_location(div2, file$2, 5, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t5);
    			append_dev(div1, p3);
    			append_dev(div1, t7);
    			append_dev(div1, p4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tickerSymbol*/ 2) set_data_dev(t0, /*tickerSymbol*/ ctx[1]);
    			if (dirty & /*stockName*/ 1) set_data_dev(t2, /*stockName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots('StockItem', slots, []);
    	let { stockName } = $$props;
    	let { tickerSymbol } = $$props;
    	const writable_props = ['stockName', 'tickerSymbol'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StockItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('stockName' in $$props) $$invalidate(0, stockName = $$props.stockName);
    		if ('tickerSymbol' in $$props) $$invalidate(1, tickerSymbol = $$props.tickerSymbol);
    	};

    	$$self.$capture_state = () => ({ stockName, tickerSymbol });

    	$$self.$inject_state = $$props => {
    		if ('stockName' in $$props) $$invalidate(0, stockName = $$props.stockName);
    		if ('tickerSymbol' in $$props) $$invalidate(1, tickerSymbol = $$props.tickerSymbol);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stockName, tickerSymbol];
    }

    class StockItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { stockName: 0, tickerSymbol: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StockItem",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stockName*/ ctx[0] === undefined && !('stockName' in props)) {
    			console.warn("<StockItem> was created without expected prop 'stockName'");
    		}

    		if (/*tickerSymbol*/ ctx[1] === undefined && !('tickerSymbol' in props)) {
    			console.warn("<StockItem> was created without expected prop 'tickerSymbol'");
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
    }

    /* src/Stocks/StockList.svelte generated by Svelte v3.42.6 */
    const file$1 = "src/Stocks/StockList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (7:4) {#each stocks as stock}
    function create_each_block(ctx) {
    	let stockitem;
    	let current;

    	stockitem = new StockItem({
    			props: {
    				stockName: /*stock*/ ctx[1].stockName,
    				tickerSymbol: /*stock*/ ctx[1].tickerSymbol
    			},
    			$$inline: true
    		});

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
    			if (dirty & /*stocks*/ 1) stockitem_changes.stockName = /*stock*/ ctx[1].stockName;
    			if (dirty & /*stocks*/ 1) stockitem_changes.tickerSymbol = /*stock*/ ctx[1].tickerSymbol;
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

    function create_fragment$1(ctx) {
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

    			attr_dev(section, "class", "svelte-1rcz6lm");
    			add_location(section, file$1, 5, 0, 91);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StockList', slots, []);
    	let { stocks } = $$props;
    	const writable_props = ['stocks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StockList> was created with unknown prop '${key}'`);
    	});

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

    	return [stocks];
    }

    class StockList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { stocks: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StockList",
    			options,
    			id: create_fragment$1.name
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

    /* src/App.svelte generated by Svelte v3.42.6 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let input;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let p;
    	let t7;
    	let t8;
    	let t9;
    	let stocklist;
    	let current;
    	let mounted;
    	let dispose;

    	stocklist = new StockList({
    			props: { stocks: /*stocks*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Stock Tracker";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Submit";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Get Apple";
    			t6 = space();
    			p = element("p");
    			t7 = text("Search Input: ");
    			t8 = text(/*searchInput*/ ctx[0]);
    			t9 = space();
    			create_component(stocklist.$$.fragment);
    			add_location(h1, file, 36, 1, 800);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 37, 1, 824);
    			add_location(button0, file, 38, 1, 872);
    			add_location(button1, file, 39, 1, 917);
    			add_location(p, file, 40, 1, 965);
    			add_location(main, file, 35, 0, 792);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, input);
    			set_input_value(input, /*searchInput*/ ctx[0]);
    			append_dev(main, t2);
    			append_dev(main, button0);
    			append_dev(main, t4);
    			append_dev(main, button1);
    			append_dev(main, t6);
    			append_dev(main, p);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(main, t9);
    			mount_component(stocklist, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button0, "click", /*addStock*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*getStock*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchInput*/ 1 && input.value !== /*searchInput*/ ctx[0]) {
    				set_input_value(input, /*searchInput*/ ctx[0]);
    			}

    			if (!current || dirty & /*searchInput*/ 1) set_data_dev(t8, /*searchInput*/ ctx[0]);
    			const stocklist_changes = {};
    			if (dirty & /*stocks*/ 2) stocklist_changes.stocks = /*stocks*/ ctx[1];
    			stocklist.$set(stocklist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stocklist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stocklist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let apiKey = "c556jkqad3iak9epgvr0";
    	let apiToken = "&token=" + apiKey;
    	let finnHubURL = "https://finnhub.io/api/v1/";
    	let searchInput = "";

    	let stocks = [
    		{ stockName: "Apple", tickerSymbol: "APPL" },
    		{ stockName: "Apple", tickerSymbol: "APPL" }
    	];

    	function addStock() {
    		$$invalidate(1, stocks = [...stocks, searchInput]);
    	}

    	function getStock() {
    		fetch(finnHubURL + "search?q=apple" + apiToken).then(res => {
    			return res.json();
    		}).then(data => {
    			console.log(data);
    			let firstResult = data.result[0];
    			console.log(firstResult.description);
    			console.log(firstResult.symbol);
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
    		apiKey,
    		apiToken,
    		finnHubURL,
    		searchInput,
    		stocks,
    		addStock,
    		getStock
    	});

    	$$self.$inject_state = $$props => {
    		if ('apiKey' in $$props) apiKey = $$props.apiKey;
    		if ('apiToken' in $$props) apiToken = $$props.apiToken;
    		if ('finnHubURL' in $$props) finnHubURL = $$props.finnHubURL;
    		if ('searchInput' in $$props) $$invalidate(0, searchInput = $$props.searchInput);
    		if ('stocks' in $$props) $$invalidate(1, stocks = $$props.stocks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchInput, stocks, addStock, getStock, input_input_handler];
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
