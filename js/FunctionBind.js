if (!Function.prototype.bind) {
    Function.prototype.bind = function (context) {
        // method is attached to the prototype, so just refer to it as this.
        var func = this;
        var previousArgs = [].slice.call(arguments, 1);

        return function () {
            var currentArgs = [].slice.call(arguments);
            var combinedArgs = [].concat(previousArgs, currentArgs);
            return func.apply(context, combinedArgs);
        };
    };
}