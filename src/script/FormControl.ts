import Validator from './Validator';
import { format, each, isArray } from './utils';
import $ from 'jquery';

export default class FormContrl {

    status: string;

    obs;

    params;

    controlName;

    inputElem;

    label;

    errorMsgs;

    rules;

    validators;

    options;
    
    constructor(params, controlName, inputElem, options) {
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
            this.inputElem.addClass(this.options.invalidClass).removeClass(this.options.validClass);
        } else {
            this.changeStatus('valid');
            this.inputElem.addClass(this.options.validClass).removeClass(this.options.invalidClass);
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
    static create (controlName, container, params) {
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


