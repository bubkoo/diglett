/**
 *
 * diglett.js v0.0.7
 * by bubkoo@163.com
 *
 * MIT license
 *
 */
;
(function (global) {

    'use strict';

    function Template(options) {
        this.options = options;
        this.filters = options.filters || {};

        var openTag = this.options.openTag;
        var closeTag = this.options.closeTag;
        //
        this.rEachStart = new RegExp(openTag + '\\s*[#@]each\\s+(\\S+)(?:\\s+as\\s+)?(\\S*)?\\s*(\\S*)?\\s*' + closeTag, 'igm');
        this.rEachEnd = new RegExp(openTag + '\\s*\\/each\\s*' + closeTag, 'igm');
        this.rIfStart = new RegExp(openTag + '\\s*[#@]if\\s+(.*?)\\s*' + closeTag, 'igm');
        this.rIfEnd = new RegExp(openTag + '\\s*\\/if\\s*' + closeTag, 'igm');
        this.rElse = new RegExp(openTag + '\\s*[#@]else\\s*' + closeTag, 'igm');
        this.rElseIf = new RegExp(openTag + '\\s*[#@]else\\s*if\\s+(.*?)\\s*' + closeTag, 'igm');
        this.rInterpolate = new RegExp(openTag + '\\s*((?!\\/|#|@|\\/\\/|!--)[\\s\\S]+?)\\s*' + closeTag, 'igm');
        this.rComment = new RegExp(openTag + '!--[\\s\\S]*--' + closeTag, 'igm');
        this.rInline = new RegExp(openTag + '\\s*\\/\\/(.*)\\s*' + closeTag, 'igm');
        this.rInclude = new RegExp(openTag + '\\s*[#@]include\\s*(\\S*)\\s*(\\S*)\\s*' + closeTag, 'igm');

        var that = this;

        this.method['include'] = function (tpl, data) {
            var useCache = that.options.cache,
                cached;
            if (useCache) {
                if (cached = Template.cache[tpl]) {
                    return cached.render(data);
                }
            }
            cached = that.parse(tpl);
            if (useCache) {
                Template.cache[tpl] = cached;
            }
            return cached.render(data);
        };
    }

    // cache the compiled template
    Template.cache = {};

    Template.prototype = {
        constructor: Template,

        method: {
            each: function (data, callback) {
                var i,
                    l,
                    isArray = Array.isArray || function (obj) {
                        return '[object Array]' === Object.prototype.toString.call(obj);
                    };
                if (isArray(data)) {
                    for (i = 0, l = data.length; i < l; i++) {
                        callback.call(data, data[i], i);
                    }
                } else {
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
                            callback.call(data, data[i], i);
                        }
                    }
                }
            },
            throw: _throw
        },

        filter: {
            // escape html
            'html': function (content) {
                var escapeMap = {
                    '<': '&#60;',
                    '>': '&#62;',
                    '"': '&#34;',
                    '\'': '&#39;',
                    '&': '&#38;'
                };
                return ('' + content).replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                    s = escapeMap[s];
                    return s || '&#38;';
                });
            },

            'lowercase': function (content) {
                return ('' + content).toLowerCase();
            },

            'uppercase': function (content) {
                return ('' + content).toUpperCase();
            },

            'filter': function (content) {

            }
        },

        _unshell: function (source) {
            var that = this;
            source = source
                // each expression
                // {{#each items}} // default key is $index, default $value
                // {{#each items as $value}}
                // {{#each items as $value $index}}
                .replace(this.rEachStart, function (input, data, value, key) {
                    value = value || '$value';
                    key = key || '$index';
                    return '<% __method["each"](' + data + ', function(' + value + ', ' + key + '){ %>';
                })
                .replace(this.rEachEnd, '<% }); %>')

                // if expression
                .replace(this.rIfStart, function (input, condition) {
                    return '<% if(' + condition + ') { %>';
                })
                .replace(this.rIfEnd, '<% } %>')

                // else expression
                .replace(this.rElse, function () {
                    return '<% } else { %>';
                })

                // else if expression
                .replace(this.rElseIf, function (input, condition) {
                    return '<% } else if(' + condition + ') { %>';
                })

                // interpolate
                .replace(this.rInterpolate, function (input, variable) {
                    var filters = variable.split(/\s*\|\s*/g),
                        content = filters.shift(),
                        buffer,
                        filter,
                        filterStr,
                        args,
                        arg;
                    while (filterStr = filters.shift()) {
                        filterStr = filterStr.replace(/(['"]{1}?)([\s\S]*?)\1/g, function (input, quote, param) {
                            return param.replace(/:/g, 'X_#_#_X');
                        });
                        args = filterStr.split(/\s*:\s*/g);
                        filter = args.shift();
                        buffer = content;
                        while (arg = args.shift()) {
                            buffer += ',"' + arg.replace(/X_#_#_X/g, ':').replace(/'/g, "\'").replace(/\"/g, '"') + '"';
                        }
                        content = '__filter["' + filter + '"].call(this,' + buffer + ')';
                    }
                    return '<%=' + content + '%>';
                })

                .replace(this.rInclude, function (input, tpl, data) {
                    return '<%= __method["include"](' + tpl + ', ' + data + '); %>';
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    return that.options.openTag + text + that.options.closeTag;
                });

            if (this.options.debug !== true) {
                source = '<% try { %>'
                    + source
                    + '<% } catch(e) { __method.throw("diglett render exception: " + e.message); } %>';
            }

            return source;
        },

        _toNative: function (source) {
            var uglify = this.options.uglify,
                buffer = "'use strict';"; // use strict mode

            buffer += "__ = __ || {};";
            buffer += "__filter = __filter || {};";
            buffer += "__method = __method || {};";
            buffer += "var __out='';__out+='";

//            buffer += source
//                .replace(/\\/g, '\\\\')
//                .replace(/[\r\t\n]+/g, '')
//                //.replace(/'(?=[^%]*%>)/g, '\t')
//                //.split("'").join("\\'")
//                //.split("\t").join("'")
//                .replace(/<%=(.+?)%>/g, "';__out+=$1; __out+='")
//                .split('<%').join("';")
//                .split('%>').join("__out+='") +
//                "';return __out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";

            buffer += source
                .replace(/\\/g, '\\\\')
                .replace(/<%=(.+?)%>/g, "';__out+=$1;__out+='")
                .split('<%').join("';")
                .split('%>').join("__out+='");
            if (uglify === true) {
                buffer = buffer
                    .replace(/[\r\t\n]+/g, '')
                    .replace(/__out\+='\s*';/g, '')
                    .replace(/>\s+</g, '><')
                    .replace(/(__out\+=')\s+</g, '$1<')
                    .replace(/>\s+'/g, '>\'')
                    .replace(/>\s+\b/g, '> ')
                    .replace(/\b\s+</g, ' <');
            } else {
                buffer = buffer
                    .replace(/[\r\n]+/g, ' ')
                    .replace(/__out\+='';/g, '')
            }

            return buffer += "';return __out;";
        },

        _getVariable: function (source) {
            var variables = [],
                declare,
                indexOf = function (array, item) {
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
                },

                addVarible = function (variable) {
                    if (variable && indexOf(variables, variable) === -1) {
                        variables.push(variable);
                    }
                },

                variableAnalyze = function (input, variable) {
                    // variable name should start with A-Z, a-z, _ or $
                    variable = variable.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm)[0];
                    addVarible(variable);
                };

            source.replace(this.rEachStart, variableAnalyze).
                replace(this.rIfStart, variableAnalyze).
                replace(this.rElseIf, variableAnalyze).
                replace(this.rInterpolate, function (input, statement) {
                    // filter
                    statement = statement.split('|')[0];
                    // match variables
                    var match = statement.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm),
                        variable,
                        i,
                        len = match.length;
                    for (i = 0; i < len; i++) {
                        addVarible(match[i]);
                        variable = match[i];
                    }
                    // contains operator
                    if (/[\+\-\*\/%!\?\|\^&~<>=,\(\)\[\]]/.test(input)) {
                        return '(' + input + ')';
                    }
                }).
                replace(this.rInclude, function (input, tpl, data) {
                    if (tpl && tpl.match(/^(['"])#[\w:\-\.]+\1$/igm)) {
                        return input.replace('/[\'\"]/g', '');
                    } else {
                        addVarible(tpl);
                    }
                    addVarible(data);
                });

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

        parse: function (source) {

            var that = this,
                useCache = that.options.cache,
                cached;
            if (useCache) {
                if (cached = Template.cache[source]) {
                    return cached;
                }
            }

            // source is element's ID, like this #nodeId
            var regId = /^\s*#([\w:\-\.]+)\s*$/igm;
            if (source.match(regId)) {
                source.replace(regId, function (input, id) {
                    var doc = document,
                        ele = doc && doc.getElementById(id);
                    source = ele ? (ele.value || ele.innerHTML) : input;
                });
            }

            // firstly, remove the html comment
            if (that.options.uglify === true) {
                source = source.replace(/<!--.*?-->/g, '');
            }

            source = that._getVariable(source) + source;
            source = that._unshell(source);
            source = that._toNative(source);

            that._render = new Function('__, __method, __filter', source);
            that.render = function (data, options) {
                options = options || {};
                var filter = merge(options.filter, that.filter),
                    method = merge(options.method, that.method);
                return that._render.call(this, data, method, filter);
            };

            if (useCache) {
                Template.cache[source] = that;
            }

            return that;
        }
    };

    // create a local object, to be exported or attached to the global object later
    var diglett = function (source, data) {
        // call `compile` or `render` with default options
        if (data) {
            return diglett.render.call(diglett, source, data, diglett.options);
        } else {
            return diglett.compile.call(diglett, source, diglett.options);
        }
    };

    // current version
    diglett.version = '0.0.7';

    diglett.options = {
        'openTag': '{{',
        'closeTag': '}}',
        'cache': true, // cache the compiled template
        'debug': true,
        'uglify': true // compress result
    };

    diglett.compile = function (source, options) {
        options = fixOptions(options);

        var doParse = function () {
            var engine,
                cached;
            if (options.cache !== false) {
                if (cached = Template.cache[source]) {
                    engine = cached;
                }
            }
            engine = engine || new Template(options).parse(source);

            return engine;
        };

        if (options.debug) {
            return doParse();
        } else {
            try {
                return doParse();
            }
            catch (e) {
                _throw('diglett compile exception: ' + e.message);

                return {
                    // noop
                    render: function () {
                    }
                }
            }
        }
    };

    diglett.render = function (source, data, options) {
        return this.compile(source, options).render(data, options);
    };

    diglett.addFilter = function (filterName, fn, overwrite) {
        var filters = Template.prototype.filter;
        if (filters.hasOwnProperty(filterName)) {
            if (overwrite === true) {
                return filters[filterName] = fn;
            } else {
                return false;
            }
        }
        return filters[filterName] = fn;
    };

    diglett.removeFilter = function (filterName) {
        var filters = Template.prototype.filter;
        if (filters.hasOwnProperty(filterName)) {
            return delete filters[filterName];
        }
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

    function _throw(error) {
        if (global.console) {
            if (console.warn) {
                console.warn(error);
            }
            else if (console.log) {
                console.log(error);
            }
        }
        throw (error);
    }

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
        global.diglett = diglett;
    }


})(this);