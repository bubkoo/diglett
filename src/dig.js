(function (global) {
    'use strict';

    function Template(options) {

    }

    var proto = Template.prototype;

    // create a local object, to be exported or
    // attached to the global object later
    function diglett(source, data) {

    }

    diglett.compile = function (source) {
        try {
            var cache = Template.cache;
            if (!cache) {
                cache = Template.cache = {};
            }

            var engine = cache[source];
            if (!engine) {
                engine = new Template().parse(source);
            }
            return engine;
        } catch (error) {
            global.console &&
            console.log &&
            console.log('[compile error] ' + error);
        }
    };

    diglett.render = function () {};

    // current version
    diglett.version = '0.0.1';


    // Exports
    // -------
    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define(function () {
            return diglett;
        });
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            // NodeJS
            module.exports = diglett;
        }
    } else {
        diglett.noConflict = (function (old) {
            return function () {
                // reset the value of the root's `currency` object
                global.diglett = old;
                // reset the noConflict method with a noop function
                diglett.noConflict = function () { };
                // return reference to the library to re-assign it
                return diglett;
            };
        })(global.diglett);

        // attach datetime to global
        global.diglett = diglett;
    }


    // Helpers
    // -------


})(this);