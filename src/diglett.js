/**
 *
 * diglett.js v0.0.7
 *
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

        var filters = options.filter,
            filter;
        if (filters) {
            for (filter in filters) {
                if (filters.hasOwnProperty(filter)) {
                    Template.registerFilter(filter, filters[filter], true);
                }
            }
        }

        var openTag = this.options.openTag;
        var closeTag = this.options.closeTag;
        //
        this.rEachStart = new RegExp(openTag + '\\s*[#@]each\\s+(.*)' + closeTag, 'igm');
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

        Template.registerMethod('include', function (tpl, data) {
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
        }, true);
    }

    // cache the compiled template
    Template.cache = {};

    Template.prototype = {
        constructor: Template,

        method: {
            each: function (data, callback) {
                var i,
                    l,
                    counter = 0,
                    even = false,
                    odd = false,
                    first = false,
                    last = false,
                    isArray = Array.isArray || function (obj) {
                        return '[object Array]' === Object.prototype.toString.call(obj);
                    },
                    setFlag = function (index, len) {
                        if ((index + 1) % 2 === 0) {
                            even = true;
                            odd = false;
                        } else {
                            even = false;
                            odd = true;
                        }
                        index === 0 && (first = true);
                        index === (len - 1) && (last = true);
                    };
                if (isArray(data)) {
                    for (i = 0, l = data.length; i < l; i++) {
                        setFlag(i, l);
                        callback.call(data, data[i], i, even, odd, first, last);
                    }
                } else {
                    for (i in data) {
                        setFlag(counter, counter);
                        if (data.hasOwnProperty(i)) {
                            callback.call(data, data[i], i, even, odd, first, last);
                        }
                        counter++;
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

            'lowercase': function (value) {
                return ('' + value).toLowerCase();
            },

            'uppercase': function (value) {
                return ('' + value).toUpperCase();
            }
        },

        _unshell: function (source) {
            var that = this,
                variables = [],
                declare,
                trim = function (str) {
                    str = str.replace(/^\s+/g, '');
                    for (var i = str.length - 1; i >= 0; i--) {
                        if (/\S/.test(str.charAt(i))) {
                            str = str.substring(0, i + 1);
                            break;
                        }
                    }
                    return str;
                },
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
                variableAnalyze = function (input, exp) {
                    var match = exp.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm),
                        variable;
                    if (match) {
                        while (variable = match.shift()) {
                            addVarible(variable);
                        }
                    }
                    // contains operator
                    if (/[\+\-\*\/%!\?\^&~<>=,\(\)\[\]]/.test(exp)) {
                        exp = '(' + exp + ')';
                    }
                    return exp;
                },
                handleFilter = function (value, filterStr) {
                    if (filterStr) {
                        filterStr = trim(filterStr);
                    }
                    if (filterStr) {
                        var filterGroups = filterStr.split(/\s*\|\s*/g),
                            filterGroup,
                            filter,
                            buffer,
                            args,
                            arg;
                        while (filterGroup = filterGroups.shift()) {
                            filterGroup = filterGroup.replace(/(['"]{1}?)([\s\S]*?)\1/g, function (input, quote, param) {
                                return param.replace(/:/g, 'X_#_#_X');
                            });
                            args = filterGroup.split(/\s*:\s*/g);
                            filter = args.shift();

                            buffer = value;
                            while (arg = args.shift()) {
                                buffer += ',"' + arg.replace(/X_#_#_X/g, ':').replace(/'/g, "\'").replace(/\"/g, '"') + '"';
                            }
                            value = '__filter["' + filter + '"].call(this,' + buffer + ')';
                        }
                    }
                    return value;
                };

            source = source
                // each expression
                .replace(this.rEachStart, function (input, expression) {
                    var index = expression.indexOf(' '),
                        key = '$index',
                        value = '$value',
                        data,
                        options;
                    if (index > 0) {
                        data = expression.substr(0, index);
                        options = expression.substr(index + 1);

                        // add variables
                        variableAnalyze(input, data);

                        // analyze options
                        options = trim(options);
                        if (options) {
                            options = options.replace(/as\s+([A-Za-z_$][A-Za-z0-9_$]+)(\s+[A-Za-z_$][A-Za-z0-9_$]+)?/ig,
                                function (input, v, k) {
                                    v && (v = trim(v));
                                    v && (value = v);
                                    k && (k = trim(k));
                                    k && (key = k);
                                    return '';
                                });
                        }
                        if (options) {
                            options = trim(options);
                        }
                        // analyze filters
                        if (options) {
                            if (options[0] === '|') {
                                options = options.substr(1);
                            }
                            data = handleFilter(data, options);
                        }
                    } else {
                        data = variableAnalyze(input, expression);
                    }
                    return '<% __method["each"](' + data + ', function(' + value + ', ' + key + ',$even,$odd,$first,$last){ %>';
                })
                .replace(this.rEachEnd, '<% }); %>')

                // if expression
                .replace(this.rIfStart, function (input, condition) {
                    variableAnalyze(input, condition);
                    return '<% if(' + condition + ') { %>';
                })

                .replace(this.rIfEnd, '<% } %>')

                // else expression
                .replace(this.rElse, function () {
                    return '<% } else { %>';
                })

                // else if expression
                .replace(this.rElseIf, function (input, condition) {
                    variableAnalyze(input, condition);
                    return '<% } else if(' + condition + ') { %>';
                })

                // interpolate
                .replace(this.rInterpolate, function (input, interpolate) {
                    interpolate = trim(interpolate);
                    var index = interpolate.indexOf('|'),
                        filterStr,
                        content;

                    if (index > 0) {
                        content = interpolate.substr(0, index);
                        filterStr = interpolate.substr(index + 1);
                        content = variableAnalyze(input, content);
                        content = handleFilter(content, filterStr);
                    } else {
                        content = variableAnalyze(input, interpolate);
                    }
                    return '<%=' + content + '%>';
                })

                .replace(this.rInclude, function (input, tpl, data) {
                    // get variable
                    if (tpl.match(/^(['"])#[\w:\-\.]+\1$/igm)) {
                        tpl = tpl.replace(/['"]/g, '');
                    } else {
                        addVarible(tpl);
                    }
                    addVarible(data);

                    // remove custom grammar
                    return '<%= __method["include"](' + tpl + ', ' + data + '); %>';
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    return that.options.openTag + text + that.options.closeTag;
                });

            // pre-declare variables
            var i,
                len = variables.length;
            if (len > 0) {
                declare = 'var ';
                for (i = 0; i < len; i++) {
                    declare += variables[i] + '=__.' + variables[i] + ',';
                }
            }
            if (declare) {
                source = '<%' + declare.substr(0, declare.length - 1) + '; %>' + source;
            }

            // if debug, then wrapped with try-catch
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

    Template.registerFilter = function (filterName, fn, overwrite) {
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

    Template.removeFilter = function (filterName) {
        var filters = Template.prototype.filter;
        if (filters.hasOwnProperty(filterName)) {
            return delete filters[filterName];
        }
    };

    Template.registerMethod = function (methodName, fn, overwrite) {
        var methods = Template.prototype.method;
        if (methods.hasOwnProperty(methodName)) {
            if (overwrite === true) {
                return methods[methodName] = fn;
            } else {
                return false;
            }
        }
        return methods[methodName] = fn;
    };

    Template.removeMethod = function (methodName) {
        var methods = Template.prototype.method;
        if (methods.hasOwnProperty(methodName)) {
            return delete methods[methodName];
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

    diglett.registerFilter = Template.registerFilter;

    diglett.removeFilter = Template.removeFilter;

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