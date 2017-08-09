export function isArray(array) {
    if (!array) return false;

    return array.constructor === Array;
};

export function format(str, obj) {
    var result = str;
    var args = Array.prototype.slice.call(arguments, 1);
    var reg;
    if (arguments.length > 1) {
        if (arguments.length == 2 && typeof obj == "object") {
            for (var key in obj) {
                if (obj[key] !== undefined) {
                    reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, obj[key]);
                }
            }
        }
        else {
            for (var i = 0; i < args.length; i++) {
                if (args[i] !== undefined) {
                    reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, args[i]);
                }
            }
        }
    }
    return result;
};

export function array_uniqueitem(arr) {
    var res = [];
    var json = {};
    for (var i = 0; i < arr.length; i++) {
        if (!json[arr[i]]) {
            res.push(arr[i]);
            json[arr[i]] = 1;
        }
    }
    return res;
};

export function each(arr, callback) {
    if (!arr) return;
    if (typeof arr.length === 'number') {
        [].every.call(arr, function (item, idx) {
            return callback.call(item, idx, item) !== false;
        });
    } else {
        for (var key in arr) {
            if (arr.hasOwnProperty(key)) {
                if (callback.call(arr[key], key, arr[key]) === false) return;
            }
        }
    }
};

export function array_add(arr, val) {
    if (isArray(val)) {
        Array.prototype.push.apply(arr, val);
    } else {
        arr.push(val);
    }
};

export function isNull(o) {
    return o === null || o === undefined;
};

export function trim(str) {
    if (isNull(str)) return '';

    return str.replace(/^\s*|\s*$/g, '');
};