(function (global) {
    'use strict';

    function Template(options) {

    }

    var proto = Template.prototype;

    // create a local object, to be exported or
    // attached to the global object later
    function diglett(source, data) {
        try {
            var engine = Template.cache[source];
            return engine || new Template(options).parse(source);
        } catch (error) {

        }
    }

    // current version
    diglett.version = '0.0.7';

    diglett.compile = function () {};

    diglett.render = function () {};

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