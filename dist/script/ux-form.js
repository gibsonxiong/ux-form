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
        }
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
                equalElem.on('blur', function () {
                    if (control.status == 'raw')
                        return;
                    control.validate();
                });
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
            ErrorMsg.register('_default', function (formCheckResult) {
                var result = formCheckResult.result;
                result.forEach(function (item) {
                    var container = item.input.parent();
                    var html = '';
                    item.errorMsgs.forEach(function (errorMsg) {
                        html += '<p class="errorMsg">' + errorMsg + '</p>';
                    });
                    container.children('.errorMsg').remove();
                    container.append(html);
                });
            });
            ErrorMsg.register('_default2', function (formCheckResult) {
                var result = formCheckResult.result;
                var showed = false;
                uxUtils.each(result, function (i, item) {
                    uxUtils.each(item.errorMsgs, function (i, errorMsg) {
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



    var FormControl = (function () {
        var validClass = 'form-valid';
        var invalidClass = 'form-invalid';
        // raw valid invalid pending
        function FormControl(controlName, inputElem, params) {
            var that = this;
            this.status = 'raw';
            this.obs = $({});
            this.params = params;
            this.controlName = controlName;
            this.inputElem = inputElem;
            this.label = params.label;
            this.errorMsgs = params.errorMsgs || {};
            this.rules = params.rules || {};
            this.validators = {};
            this.setInitValue(params.initValue);
            this._init();
        }

        FormControl.prototype._init = function () {
            var that = this;
            //遍历每个验证器
            uxUtils.each(this.rules, function (validatorName, args) {
                //如果参数不是数组
                if (!$.isArray(args)) {
                    args = [args];
                }
                args.push(that);
                var validator = Validator.get(validatorName, args);
                if(validator){
                    that.validators[validatorName] = validator;
                }
            });
        };
        FormControl.prototype.check = function (callback, silent) {

            var that = this;
            var value = this.getValue();
            var validators = this.validators;
            var checkObj = {};
            var errorMsgs = [];
            var invalid = false;
            var count = Object.keys(validators).length;
            
            function checkDone() {
                if (Object.keys(checkObj).length !== 0)
                    invalid = true;
                that._updateClassName(invalid);
                var eventData = {
                    checkObj: checkObj,
                    invalid: invalid,
                    input: that.inputElem,
                    errorMsgs: errorMsgs
                };
                if (callback) {
                    callback(eventData);
                }
                if (!silent) {
                    that.obs.trigger('onCheck', eventData);
                }
            }

            that.changeStatus('pending');

            var required = this.params.required;
            if(typeof required === 'function'){
                required = required();
            }

            if (count === 0 || !required) {
                checkDone();
                return;
            }
            //遍历每个验证器
            this.forEachValidator(function (validator, validatorName) {
                //如果不是异步,包装成回调形式
                if (!Validator.isAsync(validatorName)) {
                    var oldValidator = validator;
                    validator = function (val, cb) {
                        var res = oldValidator(val);
                        cb(res);
                    };
                }
                validator(value, function (res) {
                    //验证器返回值为true或 对象时，则判断为验证失败
                    if (res) {
                        //错误信息
                        var errorMsg = that.errorMsgs[validatorName] || Validator.getErrorMsg(validatorName); //错误信息
                        var args = res === true ? {} : Object.create(res);
                        args.label = that.label || that.controlName;
                        errorMsg = uxUtils.format(errorMsg, args);
                        //验证信息
                        checkObj[validatorName] = res;
                        errorMsgs.push(errorMsg);
                    }
                    count--;
                    if (count > 0)
                        return;
                    //验证完
                    checkDone();
                });
            });

            
        };
        FormControl.prototype._updateClassName = function (invalid) {
            if (invalid) {
                this.changeStatus('invalid');
                this.inputElem.addClass(invalidClass).removeClass(validClass);
            }
            else {
                this.changeStatus('valid');
                this.inputElem.addClass(validClass).removeClass(invalidClass);
            }
        };
        FormControl.prototype.forEachValidator = function (callback) {
            var that = this;
            uxUtils.each(that.validators, function (validatorName, validator) {
                callback.call(that, validator, validatorName);
            });
        };
        FormControl.prototype.setInitValue = function (initValue) {
        };
        FormControl.prototype.changeStatus = function (status) {
            this.status = status;
        };
        FormControl.prototype.getValue = function () {
        };
        //静态方法
        FormControl.create = function (controlName, container, params) {
            var inputElem = container.find('[name="' + controlName + '"]');
            var tagName = inputElem[0].tagName.toLowerCase();
            var type = inputElem.attr('type');
            if (tagName === 'input') {
                if (type === 'checkbox' || type === 'radio') {
                    return new CheckableFormControl(controlName, inputElem, params);
                }
                else {
                    return new TextFormControl(controlName, inputElem, params);
                }
            }
            if (tagName === 'textarea') {
                return new TextFormControl(controlName, inputElem, params);
            }
            if (tagName === 'select') {
                return new SelectFormControl(controlName, inputElem, params);
            }
        };
        return FormControl;
    })();
    //文本框(input textarea)
    var TextFormControl = (function (FormControl) {
        function TextFormControl(controlName, inputElem, params) {
            FormControl.call(this, controlName, inputElem, params);
            var that = this;
            this.restrictInput();
            this.inputElem.on('blur', function () {
                that.check();
            });
        }
        core.extend(TextFormControl, FormControl);
        TextFormControl.prototype.setInitValue = function (initValue) {
            if (initValue !== null && initValue !== undefined)
                this.inputElem.val(initValue);
            this.initValue = this.inputElem.val();
        };
        TextFormControl.prototype.getValue = function () {
            return this.inputElem.val();
        };
        TextFormControl.prototype.restrictInput = function () {
            var patterns = this.params.patterns;
            var inputElem = this.inputElem;
            uxUtils.each(patterns, function (patternName, patternArgs) {
                if (!$.isArray(patternArgs)) {
                    patternArgs = [patternArgs];
                }
                var pattern = Pattern.get(patternName, patternArgs);
                if (!pattern)
                    return console.error('not find pattern:' + patternName);
                pattern(inputElem);
            });
        };
        return TextFormControl;
    })(FormControl);
    //选择框(checkbox, radio)
    var CheckableFormControl = (function (FormControl) {
        function CheckableFormControl(controlName, inputElem, params) {
            FormControl.call(this, controlName, inputElem, params);
            var that = this;
            this.inputElem.on('click', function () {
                that.check();
            });
        }
        core.extend(CheckableFormControl, FormControl);
        CheckableFormControl.prototype.getValue = function () {
            var ret = [];
            this.inputElem.each(function () {
                if ($(this).is(':checked')) {
                    ret.push(this.value);
                }
            });
            return ret;
        };
        return CheckableFormControl;
    })(FormControl);
    //select
    var SelectFormControl = (function (FormControl) {
        function SelectFormControl(controlName, inputElem, params) {
            FormControl.call(this, controlName, inputElem, params);
            var that = this;
            this.inputElem.on('change', function () {
                that.check();
            });
        }
        core.extend(SelectFormControl, FormControl);
        SelectFormControl.prototype.getValue = function () {
            var ret;
            ret = this.inputElem.children('option:checked').val();
            return ret;
        };
        return SelectFormControl;
    })(FormControl);
    var FormGroup = (function () {
        function FormGroup(container, groupParams, options) {
            var that = this;
            this.groupParams = groupParams || {};
            this.options = options || {};
            this.obs = $({});
            this.container = container;
            this.childrens = {};
            this._init();
        }
        FormGroup.prototype._init = function () {
            var that = this;
            var controlNames = this.container.find('[name]')
                .filter(function () {
                return !!uxUtils.trim(this.name);
            }).map(function () {
                return this.name;
            });
            controlNames = uxUtils.array_uniqueitem(controlNames);
            uxUtils.each(controlNames, function (i, controlName) {
                var controlParams = that.groupParams[controlName] || {};
                //生成control实例
                that.childrens[controlName] = FormControl.create(controlName, that.container, controlParams);
                that.childrens[controlName].obs.on('onCheck', function (e, data) {
                    var checkResult = {};
                    checkResult.errorMsgs = [];
                    checkResult.result = [];
                    checkResult.invalid = data.invalid;
                    checkResult.result.push({
                        name: controlName,
                        input: data.input,
                        result: data.result,
                        errorMsgs: data.errorMsgs
                    });
                    //formGroup errorMsg列表
                    uxUtils.array_add(checkResult.errorMsgs, data.errorMsgs);
                    that.displayErrorMsg(checkResult);
                    that.obs.trigger('onCheck', checkResult);
                });
            });
            var that = this;
            var childrens = this._findChildren();
            childrens.forEach(function (children) {
                that.childrens[children.name];
            });
        };
        FormGroup.prototype._findChildren = function () {
            var childrens = [];
            function find(elem) {
                var childrens = elem.children();
                childrens.each(function () {
                    var children = $(this);
                    var type;
                    if (children.is('[formGroup]')) {
                        type = 'group';
                    }
                    else if (children.is('[formArray]')) {
                        type = 'array';
                    }
                    else if (children.is('[name]')) {
                        type = 'control';
                    }
                    if (type) {
                        childrens.push({
                            type: type,
                            elem: children
                        });
                    }
                    else {
                        find(children);
                    }
                });
            }
            find(this.container);
            return childrens;
        };
        FormGroup.prototype.check = function (callback, silent) {
            var that = this;
            var count = Object.keys(this.childrens).length;
            var checkResult = {};
            checkResult.errorMsgs = [];
            checkResult.result = [];
            checkResult.invalid = false;
            this.forEach(function (name, children) {
                //验证
                children.check(function (data) {
                    checkResult.result.push({
                        name: name,
                        input: data.input,
                        result: data.result,
                        errorMsgs: data.errorMsgs
                    });
                    //formGroup errorMsg列表
                    uxUtils.array_add(checkResult.errorMsgs, data.errorMsgs);
                    checkResult.invalid = checkResult.invalid || data.invalid;
                    count--;
                    if (count > 0)
                        return;
                    if (callback) {
                        callback(checkResult);
                    }
                    that.displayErrorMsg(checkResult);
                    if (!silent) {
                        that.obs.trigger('onCheck', checkResult);
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
        FormGroup.prototype.getValue = function () {
            var result = {};
            this.forEach(function (name, children) {
                ret[name] = children.getValue();
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
    var FormComponent = (function (FormGroup) {
        function FormComponent(formElem, groupParams, options) {
            var that = this;
            FormGroup.call(that, formElem, groupParams, options);
            this.formElem = formElem;
            this.formElem.on('submit', function (e) {
                e.preventDefault();
                var value = that.getValue();
                that.check(function (eventData) {
                    that.obs.trigger('onSubmit', {
                        value: value,
                        result: eventData.result,
                        originEvent: e
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
//# sourceMappingURL=ux-form.js.map