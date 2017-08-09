"use strict";
exports.__esModule = true;
var Validator = (function () {
    function Validator() {
    }
    Validator.register = function (name, registerFunc, errorMsg, async) {
        var item = {
            async: !!async,
            registerFunc: registerFunc,
            errorMsg: errorMsg
        };
        Validator.store[name] = item;
    };
    Validator.get = function (name, args) {
        var registerFunc = Validator.store[name] && this.store[name].registerFunc;
        return registerFunc && registerFunc.apply(this, args);
    };
    Validator.isAsync = function (name) {
        return Validator.store[name] && Validator.store[name].async;
    };
    Validator.getErrorMsg = function (name) {
        return Validator.store[name] && Validator.store[name].errorMsg;
    };
    Validator.store = {};
    return Validator;
}());
exports["default"] = Validator;
