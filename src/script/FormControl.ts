import Validator from './Validator';
import { format, each, isArray, trim, array_uniqueitem, array_add } from './utils';
import $ from 'jquery';

interface IFormContrl {
    elem: any;

    getValue(): any;

    check(callback, silent): any;
}

export class FormContrl implements IFormContrl {

    status: string;

    obs;

    params;

    controlName;

    elem;

    label;

    errorMsgs;

    rules;

    validators;

    options;

    constructor(params, controlName, elem, options) {
        var that = this;
        this.status = 'raw';
        this.obs = $({});
        this.params = params;
        this.controlName = controlName;
        this.elem = elem;
        this.label = params.label;
        this.errorMsgs = params.errorMsgs || {};
        this.rules = params.rules || {};
        this.validators = {};
        this.options = options;
        this.setInitValue(params.initValue);

        this._init();
    }

    _init() {
        var that = this;

        //遍历每个验证器
        each(this.rules, function (validatorName, args) {

            //如果参数不是数组
            if (!isArray(args)) {
                args = [args];
            }
            args.push(that);
            var validator = Validator.get(validatorName, args);
            that.validators[validatorName] = validator;

        });

    }

    check(callback, silent) {
        var that = this;
        var value = this.getValue();
        var validators = this.validators;
        var checkObj = {};
        var errorMsgs = [];
        var invalid = false;
        var count = Object.keys(validators).length;

        function checkDone() {
            if (Object.keys(checkObj).length !== 0) invalid = true;

            that._updateClassName(invalid);

            var eventData = {
                checkObj: checkObj,
                invalid: invalid,
                input: that.elem,
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

        if (count === 0) {
            checkDone();
            return;
        }

        //遍历每个验证器
        this.forEachValidator(function (validator, validatorName) {

            //如果不是异步
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
                    var errorMsg = that.errorMsgs[validatorName] || Validator.getErrorMsg(validatorName);	//错误信息
                    var args = res === true ? {} : Object.create(res);
                    args.label = that.label || that.controlName;
                    errorMsg = format(errorMsg, args);

                    //验证信息
                    checkObj[validatorName] = res;
                    errorMsgs.push(errorMsg);
                }

                count--;
                if (count > 0) return;
                //验证完

                checkDone();
            });


        });
    }


    _updateClassName(invalid) {
        if (invalid) {
            this.changeStatus('invalid');
            this.elem.addClass(this.options.invalidClass).removeClass(this.options.validClass);
        } else {
            this.changeStatus('valid');
            this.elem.addClass(this.options.validClass).removeClass(this.options.invalidClass);
        }
    }

    forEachValidator(callback) {
        var that = this;

        each(that.validators, function (validatorName, validator) {
            callback.call(that, validator, validatorName);
        });
    }

    setInitValue(initValue) {
    }


    changeStatus(status) {
        this.status = status;
    }

    getValue() {
    }

    //静态方法
    static create(controlName, container, params) {
        // var inputElem = container.find('[name="' + controlName + '"]');
        // var tagName = inputElem[0].tagName.toLowerCase();
        // var type = inputElem.attr('type');


        // if (tagName === 'input') {
        //     if (type === 'checkbox' || type === 'radio') {
        //         return new CheckableFormControl(controlName, inputElem, params);
        //     } else {
        //         return new TextFormControl(controlName, inputElem, params);
        //     }
        // }

        // if (tagName === 'textarea') {
        //     return new TextFormControl(controlName, inputElem, params);
        // }

        // if (tagName === 'select') {
        //     return new SelectFormControl(controlName, inputElem, params);
        // }
    }
}

export class FormArray {
    constructor() {

    }


}

export class FormGroup implements IFormContrl {

    static options = {
        errorMsgMode: '_default'
    }

    static config(options) {

    }

    groupParams;

    options;

    obs;

    elem;

    childrens;



    constructor(elem, groupParams, options) {
        var that = this;
        this.groupParams = groupParams || {};
        this.options = options || {};
        this.obs = $({});
        this.elem = elem;
        this.childrens = {};
        this._init();
    }

    _init() {
        var that = this;
        var controlNames = this.elem.find('[name]')
            .filter(function () {
                return !!trim(this.name);
            }).map(function () {
                return this.name;
            });

        controlNames = array_uniqueitem(controlNames);

        each(controlNames, function (i, controlName) {
            var controlParams = that.groupParams[controlName] || {};

            //生成control实例
            that.childrens[controlName] = FormControl.create(controlName, that.elem, controlParams);
            that.childrens[controlName].obs.on('onCheck', function (e, data) {

                var checkResult:any = {};
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
                array_add(checkResult.errorMsgs, data.errorMsgs);

                that.displayErrorMsg(checkResult);
                that.obs.trigger('onCheck', checkResult);
            });
        });

        var that = this;
        var childrens = this._findChildren();

        childrens.forEach(function (children) {
            that.childrens[children.name]
        });
    }

    _findChildren() {
        var childrens = [];

        function find(elem) {
            var childrens = elem.children();

            childrens.each(function () {
                var children = $(this);
                var type;

                if (children.is('[formGroup]')) {
                    type = 'group';
                } else if (children.is('[formArray]')) {
                    type = 'array';
                } else if (children.is('[name]')) {
                    type = 'control';
                }

                if (type) {
                    childrens.push({
                        type: type,
                        elem: children
                    });
                } else {
                    find(children);
                }
            });
        }

        find(this.elem);

        return childrens;
    }

    check(callback, silent) {
        var that = this;
        var count = Object.keys(this.childrens).length;
        var checkResult:any = {};
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
                array_add(checkResult.errorMsgs, data.errorMsgs);
                checkResult.invalid = checkResult.invalid || data.invalid;

                count--;
                if (count > 0) return;
                if (callback) {
                    callback(checkResult);
                }

                that.displayErrorMsg(checkResult);
                if (!silent) {
                    that.obs.trigger('onCheck', checkResult);
                }

            }, true);

        });
    }

    forEach(callback) {
        var that = this;

        each(this.childrens, function (name, children) {
            callback.call(that, name, children);
        });
    }

    getValue() {
        var result = {};

        this.forEach(function (name, children) {
            result[name] = children.getValue();
        });

        return result;
    }

    displayErrorMsg(formCheckResult) {
        if (this.options.showErrorMsg === false) return;
        var errorMsgMode = this.options.errorMsgMode || '_default';

        // ErrorMsg.present(formCheckResult, errorMsgMode);
    }

}



