module.exports = function (grunt) {
    'use strict';

    require('time-grunt')(grunt);
    require('load-grunt-config')(grunt, {
        init: true,
        data: {
            pkg: grunt.file.readJSON('package.json'),
            src: 'src',
            dist: 'dist',
            temp: '.temp'
        }
    });
};