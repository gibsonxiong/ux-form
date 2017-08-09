export default class Validator {
    static store = {};

    static register(name, registerFunc, errorMsg, async) {
        var item = {
            async: !!async,
            registerFunc: registerFunc,
            errorMsg: errorMsg
        };

        Validator.store[name] = item;
    }

    static get(name, args) {
        var registerFunc = Validator.store[name] && this.store[name].registerFunc;
        return registerFunc && registerFunc.apply(this, args);
    }

    static isAsync(name) {
        return Validator.store[name] && Validator.store[name].async;
    }

    static getErrorMsg(name) {
        return Validator.store[name] && Validator.store[name].errorMsg;
    }
}
