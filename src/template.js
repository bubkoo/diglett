;
(function (global) {
    'use strict';


    function Template(options) {
        this.options = options;

        this.rEachStart = /{{\s*[#@]each\s+(.*?)\s*as?\s*(.*?)\s*(.*?)\s*}}/igm;
        this.rEachEnd = /{{\s*\/each\s*}}/igm;
        this.rIfStart = /{{\s*[#@]if\s+(.*?)\s*}}/igm;
        this.rIfEnd = /{{\s*\/if\s*}}/igm;
        this.rElse = /{{\s*[#@]else\s*}}/igm;
        this.rElseIf = /{{\s*[#@]else\s*if\s+(.*?)\s*}}/igm;
        this.rInterpolate = /{{\s*((?!\/|#|@|\/\/|!--)[\s\S]+?)\s*}}/igm;
        this.rComment = /{{!--[\s\S]*--}}\s*/igm;
        this.rInline = /{{\s*\/\/(.*)\s*}}/igm;
    }

    Template.prototype = {
        constructor: Template,
        _lexer: function (source) {
            var variables = [],
                declare;

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

            var variableAnalyze = function (input, statement) {
                statement = statement.match(/\w+/igm)[0];

                if (indexOf(variables, statement) === -1) {
                    variables.push(statement);
                }
            }

            source.replace(this.rEachStart, variableAnalyze).
                replace(this.rIfStart, variableAnalyze).
                replace(this.rElseIf, variableAnalyze).
                replace(this.rInterpolate, variableAnalyze);

            var i,
                len = variables.length;
            if (len > 0) {
                declare = 'var ';
                for (i = 0; i < len; i++) {
                    declare += variables[i] + '=__.' + variables[i] + ',';
                }
            }
            if (declare) {
                return '<%' + declare.substr(0, declare.length - 1) + '; %>';
            } else {
                return '';
            }
        },
        _unshell: function (source) {
            var counter = 0;
            source = source
                // each expression
                // {{#each items}} // default key is $index, default value
                // {{#each items as key,}}
                .replace(this.rEachStart, function (input, _name, alias, key) {
                    var alias = alias || 'value', key = key && key.substr(1);
                    var _iterate = 'i' + _counter++;
                    return '<% for(var ' + _iterate + '=0, l' + _iterate + '=' + _name + '.length;' + _iterate + '<l' + _iterate + ';' + _iterate + '++) {' +
                        'var ' + alias + '=' + _name + '[' + _iterate + '];' +
                        (key ? ('var ' + key + '=' + _iterate + ';') : '') +
                        ' %>';
                })
                .replace(this.rEachEnd, '<% } %>')

                // if expression
                .replace(this.rIfStart, function (input, condition) {
                    return '<% if(' + condition + ') { %>';
                })
                .replace(this.rIfEnd, '<% } %>')

                // else expression
                .replace(this.rElse, function (input) {
                    return '<% } else { %>';
                })

                // else if expression
                .replace(this.rElseIf, function (input, condition) {
                    return '<% } else if(' + condition + ') { %>';
                })

                // interpolate
                .replace(this.rInterpolate, function (input, variable) {
                    return variable;
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    // %7B - {
                    // %7D - }
                    return '%7B%7B' + text + '%7D%7D';
                })
            ;
            return source;
        },
        parse: function (source) {
            if (this.options.loose) {
                source = this._lexer(source) + source;
            }
            source = this._unshell(source);
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
            source.replace(regId, function (input, id) {
                var doc = document,
                    ele = doc && doc.getElementById(id);
                source = ele ? (ele.value || ele.innerHTML) : input;
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