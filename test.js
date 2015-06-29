var assert = require('assert');
var app = require('./example');
var req = require('supertest');
var streamlineGlobal = require('streamline/lib/globals');

exports['express-streamline'] = {

    'should properly mount subapps': function () {
        var express = require('./');
        var app = express();
        var subapp = express();
        app.use('/subapp', subapp);
        assert.equal(subapp.parent, app);
    },

    'should properly handle async routes and middleware': function (next) {
        req(app)
            .get('/')
            .expect(200)
            .expect('x-request-id', /[a-z0-9]+/)
            .end(next)
    },

    'should properly handle async params': function (next) {
        var ms = 200;
        req(app)
            .get('/delay/' + ms)
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);

                var respTime = parseInt(res.header['x-response-time']);
                assert(respTime > ms);      // at least this much time...
                assert(respTime < 2 * ms);  // ...but not *too* much more.

                next();
            })
    },

    'should properly handle route errors': function (next) {
        req(app)
            .get('/error')
            .expect(500)
            .expect(/route error/i)
            .end(next)
    },

    'should properly handle middleware errors': function (next) {
        req(app)
            .get('/foo/bar/baz?middleware=error')
            .expect(500)
            .expect(/middleware error/i)
            .end(next)
    },

    'should support stopping early from middleware': function (next) {
        req(app)
            .get('/foo/bar/baz?middleware=stop')
            .expect(200)
            .expect(/middleware stopped/i)
            .end(next)
    },

    'should support falling through routes': function (next) {
        req(app)
            .get('/next')
            .expect(200)
            .expect(/fell through/i)
            .end(next)
    },

    'should support errors from app.param': function (next) {
        req(app)
            .get('/error/param')
            .expect(500)
            .expect(/param error/i)
            .end(next)
    },

    'should support full set of HTTP methods': function (next) {
        req(app)
            .patch('/resource')
            .expect(200)
            .expect(/resource patched/i)
            .end(next)
    },

    'should support middleware setting streamline global': function (next) {
        req(app)
            .get('/global?global=foo')
            .expect(200)
            .expect({value:'foo'})
            .end(next)
    },

    'should support resetting global streamline context': function (next) {
        req(app)
            .get('/global')
            .expect(200)
            .expect({})
            .end(next)
    },

    'should clear global streamline context when request completes': function (next) {
        req(app)
            .get('/global?global=foo')
            .expect(200)
            .expect({value:'foo'})
            .end(next)

        assert.deepEqual(streamlineGlobal.context, {})
    }

};
