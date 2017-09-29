/*
 * class FormControl{
 *      getValue()
 *      check()
 * }
 *
 * FormControlParam {
 *      required,
 *      rules,
 *      messages,
 *
 * }
 *
 * FormArrayParam {
 *
 * }
 * 
 *  CheckResultDetail {
 *      input:object;
 *      invalid:boolean;
 *      errorMsgs:array;
 *      validateResult:{[validatorName:string]:boolean|object};
 *  }
 *
 * CheckResult {
 *      invalid:boolean;
 *      details:array<CheckResultDetail>
 * }
 */
(function (global, factory) {
    if (typeof module !== 'undefined' && typeof exports === 'object') {
        var $ = require('jquery');
        module.exports = factory($);
    }
    else {
        global.uxForm = factory(global.$);
    }
})(this, function ($) {
    var uxUtils = {
        format: function (str, obj) {
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
        },
        array_uniqueitem: function (arr) {
            var res = [];
            var json = {};
            for (var i = 0; i < arr.length; i++) {
                if (!json[arr[i]]) {
                    res.push(arr[i]);
                    json[arr[i]] = 1;
                }
            }
            return res;
        },
        each: function (arr, callback) {
            if (!arr)
                return;
            if (typeof arr.length === 'number') {
                [].every.call(arr, function (item, idx) {
                    return callback.call(item, idx, item) !== false;
                });
            }
            else {
                for (var key in arr) {
                    if (arr.hasOwnProperty(key)) {
                        if (callback.call(arr[key], key, arr[key]) === false)
                            return;
                    }
                }
            }
        },
        array_add: function (arr, val) {
            if ($.isArray(val)) {
                Array.prototype.push.apply(arr, val);
            }
            else {
                arr.push(val);
            }
        },
        isNull: function (o) {
            return o === null || o === undefined;
        },
        trim: function (str) {
            if (uxUtils.isNull(str))
                return '';
            return str.replace(/^\s*|\s*$/g, '');
        },

        uuid: (function () {
            var id = 0;
            return function () {
                return id++;
            }
        })(),

    };
    var core = {
        extend: function (_class, _superclass) {
            var sclass = function () { };
            sclass.prototype = _superclass.prototype;
            _class.prototype = new sclass();
            //构造函数指向
            _class.prototype.constructor = _class;
        }
    };
    var regExps = {
        phone: /^1[34578]\d{9}$/
    };


    var Validator = (function () {
        function Validator() {
        }
        Validator.store = {};
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
        (function init() {
            //必填
            Validator.register('notNull', function (trim) {
                return function (val) {
                    if (trim)
                        val = $.trim(val);
                    if (val === '' || val === null || val === undefined) {
                        return true;
                    }
                    else {
                        return false;
                    }
                };
            }, '{label}不能为空');
            //小于
            Validator.register('min', function (min) {
                return function (val) {
                    val = parseFloat(val);
                    if (val >= min) {
                        return false;
                    }
                    else {
                        return {
                            min: min,
                            value: val
                        };
                    }
                };
            }, '{label}不能小于{min}');
            //大于
            Validator.register('max', function (max) {
                return function (val) {
                    val = parseFloat(val);
                    if (val <= max) {
                        return false;
                    }
                    else {
                        return {
                            max: max,
                            value: val
                        };
                    }
                };
            }, '{label}不能大于{max}');
            //范围
            Validator.register('range', function (min, max) {
                return function (val) {
                    val = parseFloat(val);
                    if (val >= min && val <= max) {
                        return false;
                    }
                    else {
                        return {
                            min: min,
                            max: max,
                            value: val
                        };
                    }
                };
            }, '{label}不能小于{min}，大于{max}');
            //长度小于
            Validator.register('minLength', function (minLength) {
                return function (val) {
                    var len = val.length;
                    if (len >= minLength) {
                        return false;
                    }
                    else {
                        return {
                            minLength: minLength,
                            value: val
                        };
                    }
                };
            }, '{label}不能小于{minLength}个字符');
            //长度大于
            Validator.register('maxLength', function (maxLength) {
                return function (val) {
                    var len = val.length;
                    if (len <= maxLength) {
                        return false;
                    }
                    else {
                        return {
                            maxLength: maxLength,
                            value: val
                        };
                    }
                };
            }, '{label}不能大于{maxLength}个字符');
            //长度范围
            Validator.register('rangeLength', function (minLength, maxLength) {
                return function (val) {
                    var len = val.length;
                    if (len >= minLength && len <= maxLength) {
                        return false;
                    }
                    else {
                        return {
                            minLength: minLength,
                            maxLength: maxLength,
                            value: val
                        };
                    }
                };
            }, '{label}不能小于{minLength}，大于{maxLength}个字符');
            //长度范围
            Validator.register('pattern', function (regexp) {
                return function (val) {
                    if (regexp.test(val)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                };
            }, '{label}格式不正确');
            //输入值相同
            Validator.register('equalTo', function (selector, control) {
                var equalElem = $(selector);

                return function (val) {
                    var equalValue = equalElem.val();
                    if (val == equalValue) {
                        return false;
                    }
                    else {
                        return {
                            selector: selector
                        };
                    }
                };
            }, '输入值必须和{selector}相同');
            //手机号码
            Validator.register('phone', function () {
                return function (val) {
                    if (regExps.phone.test(val)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                };
            }, '{label}必须为合法的手机号码格式');
        })();
        return Validator;
    })();
    var Pattern = (function () {
        // raw valid invalid pending
        function Pattern() {
        }
        Pattern.store = {};
        Pattern.register = function (name, registerFunc) {
            Pattern.store[name] = registerFunc;
        };
        Pattern.get = function (name, args) {
            var registerFunc = Pattern.store[name];
            return registerFunc && registerFunc.apply(this, args);
        };
        ;
        (function init() {
            Pattern.register('number', function () {
                return function (input) {
                    input.on('input', function () {
                        this.value = this.value.replace(/[^\d]/g, '');
                    });
                };
            });
            Pattern.register('maxLength', function (length) {
                return function (input) {
                    input.attr('maxlength', length);
                };
            });
            Pattern.register('phone', function (length) {
                return function (input) {
                    input.on('input', function () {
                        this.value = this.value.replace(/[^\d]/g, '');
                    });
                    input.attr('maxlength', 11);
                };
            });
            Pattern.register('decimal', function (decimals, maxLength, min, max) {
                return function (input) {
                    maxLength = (maxLength === null || maxLength === undefined) ? 10 : maxLength;
                    input.css("ime-mode", "disabled");
                    input.on('input', function (e) {
                        var value = this.value;
                        //先把非数字的都替换掉，除了数字和.     
                        value = value.replace(/[^\d\.]/g, '');
                        //必须保证第一个为数字而不是.       
                        value = value.replace(/^\./g, '');
                        //保证只有出现一个.而没有多个.       
                        value = value.replace(/\.{2,}/g, '.');
                        //保证.只出现一次，而不能出现两次以上       
                        value = value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
                        //只能输入两位小数  
                        value = value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
                        var dotIndex = value.indexOf('.');
                        if (dotIndex !== -1) {
                            var decimalString = value.substring(dotIndex);
                            var maxL = Math.min(dotIndex, maxLength);
                            value = value.substring(0, maxL) + decimalString;
                        }
                        else {
                            value = value.substring(0, maxLength);
                        }
                        this.value = value;
                    });
                    input.on("blur", function () {
                        var value = this.value;
                        if (value.lastIndexOf(".") == (this.value.length - 1)) {
                            value = value.substr(0, this.value.length - 1);
                        }
                        else if (isNaN(value)) {
                            value = "";
                        }
                        if (value !== '') {
                            if (!(min === undefined || min === null)) {
                                value = Math.max(min, value);
                            }
                            if (!(max === undefined || max === null)) {
                                value = Math.min(max, value);
                            }
                            value = parseFloat(value).toFixed(2);
                            this.value = value;
                        }
                        $(this).trigger("input");
                    });
                };
            });
            Pattern.register('money', function (maxLength, min, max) {
                return function (input) {
                    var pattern = Pattern.get('decimal', [2, maxLength, min, max]);
                    pattern(input);
                };
            });
        })();
        return Pattern;
    })();
    var ErrorMsg = (function () {
        function ErrorMsg() {
        }
        ErrorMsg.store = {};
        ErrorMsg.register = function (name, func) {
            ErrorMsg.store[name] = func;
        };
        ErrorMsg.get = function (name) {
            return ErrorMsg.store[name] || ErrorMsg.store._default;
        };
        ErrorMsg.present = function (formCheckResult, name) {
            var func = ErrorMsg.get(name);
            func(formCheckResult);
        };
        (function init() {
            ErrorMsg.register('_default', function (checkResult) {
                var details = checkResult.details;

                uxUtils.each(details, function (i, detail) {
                    var container = detail.input.parent();
                    var html = '';

                    uxUtils.each(detail.errorMsgs, function (i, errorMsg) {
                        html += '<p class="errorMsg js-errorMsg-' + detail.input.attr('name') + '">' + errorMsg + '</p>';
                    });
                    container.children('.js-errorMsg-' + detail.input.attr('name')).remove();
                    container.append(html);
                });
            });
            ErrorMsg.register('_default2', function (checkResult) {
                var details = checkResult.details;
                var showed = false;

                uxUtils.each(details, function (i, detail) {
                    uxUtils.each(detail.errorMsgs, function (i, errorMsg) {
                        if (errorMsg) {
                            alert(errorMsg);
                            showed = true;
                        }
                        if (showed)
                            return false;
                    });
                    if (showed)
                        return false;
                });
            });
        })();
        return ErrorMsg;
    })();

    var instances = {};

    var FormControl = (function () {
        var validClass = 'form-valid';
        var invalidClass = 'form-invalid';

        var classNames = {
            raw: 'form-raw',
            pending: 'form-pending',
            valid: 'form-valid',
            invalid: 'form-invalid'
        };

        var defaults = {
            showErrorMsg: true,
            showErrorMsgMode: '_default',
        };

        // raw valid invalid pending
        function FormControl(elem, params, options) {
            var that = this;
            this._status = '';
            this.obs = $({});
            this.params = params = params || {};
            this.controlName = elem.attr('name') || '__formControlName__' + uxUtils.uuid();
            this.elem = elem;
            this.label = params.label;
            this.errorMsgs = params.errorMsgs || {};
            this.rules = params.rules || {};
            this.options = $.extend({}, defaults, options);
            this.validators = null;

            this._initValidators();
            this._initDepend();
            this._changeStatus('raw');
            this.setInitValue(params.initValue);
            

            instances[this.controlName] = this;
        }

        FormControl.prototype._initValidators = function () {
            var that = this;
            that.validators = {};

            //遍历每个验证器
            uxUtils.each(this.rules, function (validatorName, args) {
                //如果参数不是数组
                if (!$.isArray(args)) {
                    args = [args];
                }
                args.push(that);
                var validator = Validator.get(validatorName, args);

                //如果不是异步,包装成回调形式
                if (!Validator.isAsync(validatorName)) {
                    var oldValidator = validator;
                    validator = function (val, cb) {
                        var result = oldValidator(val);
                        cb(result);
                    };
                }

                if (validator) {
                    that.validators[validatorName] = validator;
                }

            });

        };
        FormControl.prototype.check = function (callback, silent) {
            var that = this;
            var value = this.getValue();
            var validators = this.validators;
            var count = Object.keys(validators).length;
            var validateResult = {};
            var errorMsgs = [];
            var invalid = false;
            var needToCheck = this.isNeedToCheck();
            
            that._changeStatus('pending');

            if (count === 0 || !needToCheck) {
                checkDone();
                return;
            }

            //遍历每个验证器
            this.forEachValidator(function (validator, validatorName) {
                //验证
                validator(value, function (result) {
                    //验证器返回值为true或 对象时，则判断为验证失败
                    if (result) {
                        invalid = true;

                        //错误信息
                        var errorMsg = that.errorMsgs[validatorName] || Validator.getErrorMsg(validatorName); //错误信息
                        var args = result === true ? {} : Object.create(result);
                        args.label = that.label || that.controlName;
                        errorMsg = uxUtils.format(errorMsg, args);

                        //验证信息
                        validateResult[validatorName] = result;
                        errorMsgs.push(errorMsg);
                    }

                    count--;

                    //验证完
                    if (count === 0) {
                        checkDone();
                    }

                });
            });

            function checkDone() {
                
                that._changeStatus(invalid ? 'invalid' : 'valid');

                var checkResultDetail = {
                    validateResult: validateResult,
                    invalid: invalid,
                    input: that.elem,
                    errorMsgs: errorMsgs
                };
                var checkResult = {
                    details: [checkResultDetail],
                    invalid: invalid
                };

                if (callback) {
                    callback(checkResult);
                }
                if (!silent) {
                    that.obs.trigger('onCheck', checkResult);
                }
            }

        };

        FormControl.prototype.isNeedToCheck = function () {
            var required = this.params.required;
            if (typeof required === 'function') {
                required = required();
            }
            return required === true || ( required === false && this.getValue() !== '');
        };

        FormControl.prototype._initDepend = function () {
            var that = this;
            var depends = this.params.depends || [];

            uxUtils.each(depends, function (i, name) {
                that.depend(name);
            });
        };


        FormControl.prototype.depend = function (name) {
            var that = this;
            var control = instances[name];

            if (!control) return;

            control.obs.on('onCheck', function () {
                //未验证过，则不会做验证
                if (that.getStatus() === 'raw') return;
                that.check();
            });
        };

        FormControl.prototype.forEachValidator = function (callback) {
            var that = this;
            uxUtils.each(that.validators, function (validatorName, validator) {
                callback.call(that, validator, validatorName);
            });
        };
        FormControl.prototype.setInitValue = function (initValue, silent) {
        };
        FormControl.prototype._changeStatus = function (status, silent) {
            this._status = status;
            this._updateClassName(status);

            if (!silent) {
                this.obs.trigger('onStatusChange');
            }
        };
        FormControl.prototype.getStatus = function () {
            return this._status;
        };
        FormControl.prototype._updateClassName = function (status) {
            var that = this;

            //先清除之前状态的className
            uxUtils.each(classNames, function (key, className) {
                that.elem.removeClass(className);
            });

            //再加上当前状态的className
            that.elem.addClass(classNames[status]);

        };
        FormControl.prototype.getValue = function () {
        };
        //静态方法
        FormControl.create = function (elem, params, options) {
            var tagName = elem[0].tagName.toLowerCase();
            var type = elem.attr('type');
            if (tagName === 'input') {
                if (type === 'checkbox') {
                    return new CheckboxFormControl(elem, params, options);
                } else if (type === 'radio') {
                    return new RadioFormControl(elem, params, options);
                } else {
                    return new TextFormControl(elem, params, options);
                }
            }
            if (tagName === 'textarea') {
                return new TextFormControl(elem, params, options);
            }
            if (tagName === 'select') {
                return new SelectFormControl(elem, params, options);
            }
        };
        return FormControl;
    })();
    //文本框(input textarea)
    var TextFormControl = (function (FormControl) {
        function TextFormControl(elem, params, options) {
            FormControl.call(this, elem, params, options);
            var that = this;
            this.restrictInput();
            this.elem.on('blur', function () {
                that.check();
            });
        }
        core.extend(TextFormControl, FormControl);
        TextFormControl.prototype.setInitValue = function (initValue) {
            if (initValue !== null && initValue !== undefined)
                this.elem.val(initValue);
            this.initValue = this.elem.val();
        };
        TextFormControl.prototype.getValue = function () {
            return this.elem.val();
        };
        TextFormControl.prototype.restrictInput = function () {
            var patterns = this.params.patterns;
            var elem = this.elem;
            uxUtils.each(patterns, function (patternName, patternArgs) {
                if (!$.isArray(patternArgs)) {
                    patternArgs = [patternArgs];
                }
                var pattern = Pattern.get(patternName, patternArgs);
                if (!pattern)
                    return console.error('not find pattern:' + patternName);
                pattern(elem);
            });
        };
        return TextFormControl;
    })(FormControl);

    var CheckableFormControl = (function (FormControl) {
        function CheckableFormControl(elem, params, options) {
            FormControl.call(this, elem, params, options);
            var that = this;
            this.elem.on('click', function () {
                that.check();
            });
        }
        core.extend(CheckableFormControl, FormControl);
        CheckableFormControl.prototype.getValue = function () {
            var ret = [];
            this.elem.each(function () {
                if ($(this).is(':checked')) {
                    ret.push(this.value);
                }
            });
            return ret;
        };
        return CheckableFormControl;
    })(FormControl);

    //checkbox
    var CheckboxFormControl = (function (CheckableFormControl) {
        function CheckboxFormControl(elem, params, options) {
            CheckableFormControl.call(this, elem, params, options);
        }
        core.extend(CheckboxFormControl, CheckableFormControl);
        return CheckboxFormControl;
    })(CheckableFormControl);

    //radio
    var RadioFormControl = (function (CheckableFormControl) {
        function RadioFormControl(elem, params, options) {
            CheckableFormControl.call(this, elem, params, options);
        }
        core.extend(RadioFormControl, CheckableFormControl);

        RadioFormControl.prototype.getValue = function () {
            var val = CheckableFormControl.prototype.getValue.call(this);

            return val[0] || '';
        };
        return RadioFormControl;
    })(CheckableFormControl);

    //select
    var SelectFormControl = (function (FormControl) {
        function SelectFormControl(elem, params, options) {
            FormControl.call(this, elem, params, options);
            var that = this;
            this.elem.on('change', function () {
                that.check();
            });
        }
        core.extend(SelectFormControl, FormControl);
        SelectFormControl.prototype.getValue = function () {
            var ret;
            ret = this.elem.children('option:checked').val();
            return ret;
        };
        return SelectFormControl;
    })(FormControl);


    var FormGroup = (function () {
        var defaults = {
            showErrorMsg: true,
            showErrorMsgMode: '_default',
        };

        function FormGroup(elem, params, options) {
            var that = this;
            this.params = params || {};
            this.options = $.extend({}, defaults, options);
            this.obs = $({});
            this.elem = elem;
            this.childrens = {};
            this._init();
        }
        FormGroup.prototype._init = function () {
            this._initChildren();
        };

        FormGroup.prototype.addChildren = function (name, elem) {
        };

        FormGroup.prototype._initChildren = function () {
            var that = this;

            function find(elem) {
                var childs = elem.children();
                childs.each(function () {
                    var children = $(this);
                    var name;
                    var child;

                    if (children.is('[formGroupName]')) {
                        name = children.attr('formGroupName');
                        child = that.params[name] instanceof FormGroup ? that.params[name] : new FormGroup(children, that.params[name], that.options);
                    }
                    else if (children.is('[formArrayName]')) {
                        name = children.attr('formArrayName');
                        child = that.params[name] instanceof FormArray ? that.params[name] : new FormArray(children, that.params[name], that.options);
                    }
                    else if (children.is('[name]')) {
                        name = children.attr('name');
                        child = that.params[name] instanceof FormControl ? that.params[name] : FormControl.create(children, that.params[name], {});
                    }

                    if (child) {
                        that.childrens[name] = child;
                        child.obs.on('onCheck', function (e, checkResult) {

                            that.displayErrorMsg(checkResult);
                            that.obs.trigger('onItemCheck', checkResult);
                        });
                    } else {
                        find(children);
                    }
                });
            }
            find(this.elem);
        };

        FormGroup.prototype.check = function (callback, silent) {
            var that = this;
            var count = this.getChildrenCount();

            var details = [];
            var invalid = false;

            function checkDone() {
                var checkResult = {
                    details: details,
                    invalid: invalid
                };

                if (callback) {
                    callback(checkResult);
                }

                that.displayErrorMsg(checkResult);

                if (!silent) {
                    that.obs.trigger('onCheck', checkResult);
                }
            }

            if (count === 0) {
                checkDone();
                return;
            }

            this.forEach(function (name, children) {
                //验证
                children.check(function (data) {

                    details = details.concat(data.details);
                    invalid = invalid || data.invalid;

                    count--;

                    if (count === 0) {
                        checkDone();
                    }


                }, true);
            });
        };

        FormGroup.prototype.forEach = function (callback) {
            var that = this;
            uxUtils.each(this.childrens, function (name, children) {
                callback.call(that, name, children);
            });
        };

        FormGroup.prototype.getChildrenCount = function () {
            return Object.keys(this.childrens).length;
        };

        FormGroup.prototype.getValue = function () {
            var result = {};
            this.forEach(function (name, children) {
                result[name] = children.getValue();
            });
            return result;
        };
        FormGroup.prototype.displayErrorMsg = function (formCheckResult) {
            if (this.options.showErrorMsg === false)
                return;
            var errorMsgMode = this.options.errorMsgMode || '_default';
            ErrorMsg.present(formCheckResult, errorMsgMode);
        };
        FormGroup.options = {
            errorMsgMode: '_default'
        };
        FormGroup.config = function (options) {
        };
        return FormGroup;
    })();

    var FormArray = (function () {
        var defaults = {
            showErrorMsg: true,
            showErrorMsgMode: '_default',
        };

        function FormArray(elem, params, options) {
            var that = this;
            this.params = params || {};
            this.options = $.extend({}, defaults, options);
            this.obs = $({});
            this.elem = elem;
            this.childrens = [];
            this._init();
        }
        FormArray.prototype._init = function () {
            var childrens = this._initChildren();
        };

        FormArray.prototype.addChildren = function (name, elem) {
        };

        FormArray.prototype._initChildren = function () {
            var that = this;

            function find(elem) {
                var childs = elem.children();
                childs.each(function () {
                    var children = $(this);
                    var name;
                    var child;

                    if (children.is('[formGroupName]')) {
                        name = children.attr('formGroupName');
                        child = new FormGroup(children, that.params, that.options);
                    }
                    else if (children.is('[formArrayName]')) {
                        name = children.attr('formArrayName');
                        child = new FormArray(children, that.params, that.options);
                    }
                    else if (children.is('[name]')) {
                        name = children.attr('name');
                        child = FormControl.create(children, that.params, {});
                    }

                    if (child) {
                        that.childrens.push(child);
                        child.obs.on('onCheck', function (e, checkResult) {

                            that.displayErrorMsg(checkResult);
                            that.obs.trigger('onItemCheck', checkResult);
                        });
                    } else {
                        find(children);
                    }
                });
            }
            find(this.elem);
        };

        FormArray.prototype.check = function (callback, silent) {
            var that = this;
            var count = this.getChildrenCount();

            var details = [];
            var invalid = false;

            function checkDone() {
                var checkResult = {
                    details: details,
                    invalid: invalid
                };

                if (callback) {
                    callback(checkResult);
                }

                that.displayErrorMsg(checkResult);

                if (!silent) {
                    that.obs.trigger('onCheck', checkResult);
                }
            }

            if (count === 0) {
                checkDone();
                return;
            }

            this.forEach(function (i, children) {
                //验证
                children.check(function (data) {

                    details = details.concat(data.details);
                    invalid = invalid || data.invalid;

                    count--;

                    if (count === 0) {
                        checkDone();
                    }


                }, true);
            });
        };

        FormArray.prototype.forEach = function (callback) {
            var that = this;

            uxUtils.each(this.childrens, function (i, children) {
                callback.call(that, i, children);
            });
        };
        FormArray.prototype.getChildrenCount = function () {
            return this.childrens.length;
        };

        FormArray.prototype.getValue = function () {
            var result = [];
            this.forEach(function (i, children) {
                result.push(children.getValue());
            });
            return result;
        };

        FormArray.prototype.displayErrorMsg = function (formCheckResult) {
            if (this.options.showErrorMsg === false)
                return;
            var errorMsgMode = this.options.errorMsgMode || '_default';
            ErrorMsg.present(formCheckResult, errorMsgMode);
        };
        FormArray.options = {
            errorMsgMode: '_default'
        };
        FormArray.config = function (options) {
        };
        return FormArray;
    })();

    var FormComponent = (function (FormGroup) {
        function FormComponent(formElem, params, options) {
            var that = this;
            FormGroup.call(that, formElem, params, options);
            this.formElem = formElem;
            this.formElem.on('submit', function (e) {
                e.preventDefault();
                var value = that.getValue();
                that.check(function (checkResult) {
                    that.obs.trigger('onSubmit', {
                        value: value,
                        originEvent: e,
                        checkResult: checkResult,
                    });
                });
            });
        }
        core.extend(FormComponent, FormGroup);
        return FormComponent;
    })(FormGroup);
    return {
        FormComponent: FormComponent,
        FormGroup: FormGroup,
        FormControl: FormControl,
        Validator: Validator,
        Pattern: Pattern
    };
});