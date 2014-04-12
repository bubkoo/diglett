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

        //
        this.rEachStart = new RegExp(this.options.openTag + '\\s*[#@]each\\s+(\\S+)(?:\\s+as\\s+)?(\\S*)?\\s*(\\S*)?\\s*' + this.options.closeTag, 'igm');
        this.rEachEnd = new RegExp(this.options.openTag + '\\s*\\/each\\s*' + this.options.closeTag, 'igm');
        this.rIfStart = new RegExp(this.options.openTag + '\\s*[#@]if\\s+(.*?)\\s*' + this.options.closeTag, 'igm');
        this.rIfEnd = new RegExp(this.options.openTag + '\\s*\\/if\\s*' + this.options.closeTag, 'igm');
        this.rElse = new RegExp(this.options.openTag + '\\s*[#@]else\\s*' + this.options.closeTag, 'igm');
        this.rElseIf = new RegExp(this.options.openTag + '\\s*[#@]else\\s*if\\s+(.*?)\\s*' + this.options.closeTag, 'igm');
        this.rInterpolate = new RegExp(this.options.openTag + '\\s*((?!\\/|#|@|\\/\\/|!--)[\\s\\S]+?)\\s*' + this.options.closeTag, 'igm');
        this.rComment = new RegExp(this.options.openTag + '!--[\\s\\S]*--' + this.options.closeTag, 'igm');
        this.rInline = new RegExp(this.options.openTag + '\\s*\\/\\/(.*)\\s*' + this.options.closeTag, 'igm');
    }

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

            'currency': function (content, currencySymbol) {
                currencySymbol = currencySymbol || '$';

            },

            'date': function (date, format) {

                var int = function (str) {
                        return parseInt(str, 10);
                    },

                    jsonString2Date = function (str) {
                        // http://en.wikipedia.org/wiki/ISO_8601
                        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/,
                            match;
                        if (match = str.match(R_ISO8601_STR)) {
                            var date = new Date(0),
                                tzHour = 0,
                                tzMin = 0,
                                dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                                timeSetter = match[8] ? date.setUTCHours : date.setHours;

                            if (match[9]) {
                                tzHour = int(match[9] + match[10]);
                                tzMin = int(match[9] + match[11]);
                            }
                            dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
                            var h = int(match[4] || 0) - tzHour;
                            var m = int(match[5] || 0) - tzMin;
                            var s = int(match[6] || 0);
                            var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
                            timeSetter.call(date, h, m, s, ms);
                            return date;
                        }
                        return str;
                    },

                    zeroize = function (value, length) {

                        length || (length = 2);
                        value = '' + value; // toString

                        var i,
                            len = value.length,
                            zeros = '';
                        for (i = 0; i < (length - len); i++) {
                            zeros += '0';
                        }
                        return zeros + value;
                    };

                if (typeof date === 'string') {
                    if (/^\-?\d+$/.test(date)) {
                        date = int(date, 10);
                    } else {
                        date = jsonString2Date(date);
                    }
                }

                if (typeof date === 'number') {
                    date = new Date(date);
                }


                if (Object.prototype.toString.call(date) !== '[object Date]') {
                    return date;
                }

                format || (format = 'yyyy-MM-dd mm:hh:ss');

                return format.replace(/"[^"]*"|'[^']*'|\b(?:d{1,4}|m{1,4}|yy(?:yy)?|([hHMstT])\1?|[lLZ])\b/g, function ($0) {
                    switch ($0) {
                        case 'd':
                            return date.getDate();
                        case 'dd':
                            return zeroize(date.getDate());
                        case 'ddd': // day of week, short name
                            return ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'][date.getDay()];
                        case 'dddd': // day of week, full name
                            return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
                        case 'M':
                            return date.getMonth() + 1;
                        case 'MM':
                            return zeroize(date.getMonth() + 1);
                        case 'MMM':
                            return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                        case 'MMMM':
                            return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];
                        case 'yy':
                            return String(date.getFullYear()).substr(2);
                        case 'yyyy':
                            return date.getFullYear();
                        case 'h':
                            return date.getHours() % 12 || 12;
                        case 'hh':
                            return zeroize(date.getHours() % 12 || 12);
                        case 'H':
                            return date.getHours();
                        case 'HH':
                            return zeroize(date.getHours());
                        case 'm':
                            return date.getMinutes();
                        case 'mm':
                            return zeroize(date.getMinutes());
                        case 's':
                            return date.getSeconds();
                        case 'ss':
                            return zeroize(date.getSeconds());
                        case 'l':
                            return zeroize(date.getMilliseconds(), 3);
                        case 'L':
                            var m = date.getMilliseconds();
                            if (m > 99) m = Math.round(m / 10);
                            return zeroize(m);
                        case 'tt':
                            return date.getHours() < 12 ? 'am' : 'pm';
                        case 'TT':
                            return date.getHours() < 12 ? 'AM' : 'PM';
                        case 'Z':
                            return date.toUTCString().match(/[A-Z]+$/);
                        // Return quoted strings with the surrounding quotes removed
                        default:
                            return $0.substr(1, $0.length - 2);
                    }
                });
            },

            'lowercase': function (content) {
                return ('' + content).toLowerCase();
            },

            'uppercase': function (content) {
                return ('' + content).toUpperCase();
            },

            'number': function (number, fractionSize) {

            },

            'filter': function (content) {

            },

            'formatNumber': function (number, precision, thousand, decimal) {

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
            var buffer = "'use strict';"; // use strict mode
            buffer += "__ = __ || {};";
            buffer += "__filter = __filter || {};";
            buffer += "__method = __method || {};";
            buffer += "var __out='';__out+='";
            buffer += source
                .replace(/\\/g, '\\\\')
                .replace(/[\r\t\n]/g, ' ')
                .replace(/'(?=[^%]*%>)/g, '\t')
                .split("'").join("\\'")
                .split("\t").join("'")
                .replace(/<%=(.+?)%>/g, "';__out+=$1; __out+='")
                .split('<%').join("';")
                .split('%>').join("__out+='") +
                "';return __out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";
            return buffer;
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

                variableAnalyze = function (input, variable) {
                    // variable name should start with A-Z, a-z, _ or $
                    variable = variable.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm)[0];
                    if (variable && indexOf(variables, variable) === -1) {
                        variables.push(variable);
                    }
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
                        variable = match[i];
                        if (variable && indexOf(variables, variable) === -1) {
                            variables.push(variable);
                        }
                    }
                    // contains operator
                    if (/[\+\-\*\/%!\?\|\^&~<>=,\(\)\[\]]/.test(input)) {
                        return '(' + input + ')';
                    }
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
            source = this._getVariable(source) + source;
            source = this._unshell(source);
            source = this._toNative(source);

            this._render = new Function('__, __method, __filter', source);
            var that = this;
            this.render = function (data, options) {
                options = options || {};
                var filter = merge(options.filter, that.filter),
                    method = merge(options.method, that.method);
                return that._render.call(this, data, method, filter);
            };

            return this;
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

    // cache the compiled template
    diglett.cache = {};

    diglett.options = {
        'openTag': '{{',
        'closeTag': '}}',
        'cache': true, // cache the compiled template
        'debug': true
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

        try {

            var engine = options.cache !== false && this.cache[source]
                ? this.cache[source]
                : new Template(options).parse(source);

            // set cache
            if (options.cache !== false) {
                this.cache[source] = engine;
            }

            return engine;

        }
        catch (e) {
            _throw('diglett compile exception: ' + e.message);

            return {
                // noop
                render: function () {
                }
            }
        }
    };

    diglett.render = function (source, data, options) {
        return this.compile(source, options).render(data, options);
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