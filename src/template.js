;
(function (global) {
    'use strict';


    function Template(options) {
        this.options = options;

        var openTag = this.options.openTag,
            closeTag = this.options.closeTag;

        this.rEachStart = new RegExp(openTag + '\s*[#@]each\s+([\w\.]*?)\s+(.*?)\s*' + closeTag, 'igm');
        this.rEachEnd = new RegExp(openTag + '\s*\/each\s*' + closeTag, 'igm');
        this.rIfStart = new RegExp(openTag + '\s*[#@]if\s+(.*?)\s*' + closeTag, 'igm');
        this.rIfEnd = new RegExp(openTag + '\s*\/if\s*' + closeTag, 'igm');
        this.rElse = new RegExp(openTag + '\s*[#@]else\s*' + closeTag, 'igm');
        this.rElseIf = new RegExp(openTag + '\s*[#@]else\s*if\s+(.*?)\s*' + closeTag, 'igm');
        this.rInterpolate = new RegExp(openTag + '\s*([\s\S]+?)\s*' + closeTag, 'igm');
        this.rComment = new RegExp(openTag + '\s*!.*\s*' + closeTag, 'igm');
        this.rInline = new RegExp(openTag + '\s*\/\/(.*)\s*' + closeTag, 'igm');
    }

    Template.prototype = {
        constructor: Template,
        _lexer: function (source) {
            var openTag = this.options.openTag,
                closeTag = this.options.closeTag;

            var indexOf = function (array, item) {
                if (Array.prototype.indexOf) {
                    return Array.prototype.indexOf.call(array, item);
                }

                var i,
                    len;

                for (i = 0, len = array.length; i < len; i++) {
                    if (array[i] === item) {
                        return i;
                    }
                }

                return -1;
            };


        },
        parse: function (source) {
            if (this.options.loose) {

            }
            return this;
        }
    };

    var diglett = function (source, data) {
        // call `compile` or `render` with default options
        if (data) {
            return diglett.render.call(diglett, source, data, diglett.options);
        } else {
            return diglett.compile.call(diglett, source, diglett.options);
        }
    };

    diglett.version = '0.0.6';

    var cache = diglett.cache = {};
    var filters = diglett.filter = {};

    diglett.options = {
        'openTag': '{{',
        'closeTag': '}}',
        'loose': true,  // if false then use native JavaScript syntax.
        'cache': true,  // cache the compiled template
        'debug': true,
        'uglify': true  // compress HTML output, remove line break and additional blank space.
    };

    diglett.compile = function (source, options) {
        options = fixOptions(options);

        // source is element's ID, like this #nodeId
        var regId = /^\s*#([\w:\-\.]+)\s*$/igm;
        if (source.match(regId)) {
            source.replace(regId, function ($, $id) {
                var doc = document,
                    ele = doc && doc.getElementById($id);
                source = ele ? (ele.value || ele.innerHTML) : $;
            });
        }

        var engine = options.cache !== false && this.cache[source]
            ? this.cache[source]
            : new Template(options).parse(source);

        // set cache
        if (options.cache !== false) {
            this.cache[source] = engine;
        }

        return engine;

    };

    diglett.render = function (source, data, options) {
        this.compile(source, options);
    };

    function merge(target, source) {
        var key;
        target || (target = {});
        if (source) {
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    function fixOptions(options) {
        var ret = {};
        merge(ret, diglett.options);
        merge(ret, options);
        return ret;
    }

    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define(function () {
            return diglett;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // NodeJS
        module.exports = diglett;
    } else {
        global.diglett = diglett;
    }

})(this);