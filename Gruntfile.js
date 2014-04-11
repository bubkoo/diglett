'use strict';

module.exports = function (grunt) {

    // 加载所有以 `grunt-*` 开始的插件
    require('load-grunt-tasks')(grunt);

    // 显示任务运行时间，可以帮我我们优化构建过程
    require('time-grunt')(grunt);

    grunt.initConfig({

        config: {
            // 配置一些路径
            src: 'src',
            dist: 'dist',
            test: 'test',
            tmp: ".tmp"
        },
        // 监听指定文件，然后自动运行指定的任务。
        watch: {
            js: {
                files: ['<%= config.src %>/js/{,*/}*.js'],
                tasks: [],
                options: {
                    livereload: true //表示任务运行结束后，自动在浏览器中重载（reload）
                }
            },
            css: {
                files: ['<%= config.src %>/css/{,*/}*.css'],
                tasks: [],
                options: {
                    livereload: true
                }
            },
            html: {
                files: ['<%= config.src %>/*.html'],
                tasks: [],
                options: {
                    livereload: true
                }
            }
        },
        connect: {
            options: {
                // 指定 web 服务器端口，使用 0 或者 ？代表使用系统自动分配的端口
                port: 9080,
                hostname: 'localhost',
                livereload: 95273
            },
            livereload: {
                options: {
                    open: true,
                    base: ['']
                }
            }
        },
        jshint: {
            options: {
                // 配置项参考：http://zhang.zipeng.info/vimwiki/Entries/Reference/Tools/jshint.html
                // 或者用户目录的 .jshintrc 文件
                // 行尾分号检查，如果是真，JSHint 会无视没有加分号的行尾
                asi: false,

                // 如果为真，JSHint 会禁用位运算符
                bitwise: true,

                // 如果为真，那么 JSHint 会允许在 if，for，while 里面编写赋值语句
                boss: false,

                // 如果为真，JSHint 会要求你在使用 if 和 while 等结构语句时加上 {} 来明确代码块
                curly: true,

                // 如果为真，JSHint 会允许代码中出现 debugger 的语句
                debug: false,

                // 如果为真，要求对简单类型使用 === 和 !==，而不是 == 和 !=
                eqeqeq: true,

                // 如果为真，JSHint 会允许使用 "== null" 作比较
                eqnull: false,

                // 如果为真，JSHint 会允许使用 eval
                evil: false,

                // 如果为真，那么，JSHint 允许在 for in 循环里面不出现 hasOwnProperty
                forin: false,

                // 如果为真，JSHint要求匿名函数的调用如下：
                // (function(){ // }());
                // 而不是
                // (function(){ //bla bla })();
                immed: false,

                // 如果为真，JSHint 则不会检查换行
                laxbreak: false,

                // 设定错误的阈值，超过这个阈值 jshint 不再向下检查，提示错误太多
                maxerr: 20,

                // 如果为真，对于首字母大写的函数（声明的类），强制使用new
                newcap: true,

                // 如果为真，禁用 arguments.caller 和 arguments.callee
                noarg: true,

                // 如果为真，JSHint 会禁止出现空的代码块
                noempty: true,

                // 如果为真，JSHint 会禁用下划线的变量名
                nomen: false,

                // 如果为真，JSHint 期望函数只被var的形式声明一遍
                onevar: true,

                // 如果为真，JSHint 会在发现首个错误后停止检查
                passfail: false,

                // 如果为真，JSHint 会禁用自增运算和自减运算
                plusplus: false,

                // 如果为真，JSHint 会不允许使用.和 [^...] 的正则，
                // 因为这样的正则往往会匹配到你不期望的内容，并可能会应用造成一些危害
                regexp: true,

                // 如果为真，JSHint 会要求所有的非全局变量，在使用前都被声明
                undef: true,

                // 如果为真，JSHint 会允许各种形式的下标来访问对象，
                // 通常，JSHint 希望你只是用点运算符来读取对象的属性（除非这个属性名是一个保留字），如果你不希望这样可以关闭这个选项。
                sub: true,

                // 如果为真，JSHint会要求你使用 use strict 语法
                strict: true,

                // 如果为true，JSHint会依据严格的空白规范检查你的代码
                white: true,

                // nodejs 环境
                node: true
            },
            // 使用默认选项的文件，运行命令：grunt jshint:defaults
            defaults: {
                src: []
            },
            class: { // 对 Class 目录单独配置，运行命令：grunt jshint:class
                options: { // 这里的配置会覆盖全局配置
                    quotmark: 'single' // 我有强迫症，强制使用单引号
                },
                files: {
                    src: ['src/ui/class/src/*.js']
                }
            }
        },
        mocha: {

        }
    });

    grunt.registerTask('server', ['connect:livereload', 'watch']);

    grunt.registerTask('default', ['server']);
};