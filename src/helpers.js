var helpers = {
    each: function (data, callback) {
        var i, key, length;
        var even, odd, first, last;

        function flag(index, length) {
            if ((index + 1) % 2 === 0) {
                even = true;
                odd = false;
            } else {
                even = false;
                odd = true;
            }
            first = index === 0;
            last = index === (length - 1);
        }

        if (isArray(data)) {
            for (i = 0, length = data.length; i < length; i++) {
                flag(i, length);
                callback.call(data, data[i], i, even, odd, first, last);
            }
        } else {
            length = objectLength(data);
            i = 0;
            for (key in data) {
                if (hasOwn.call(data, key)) {
                    flag(i, length);
                    callback.call(data, data[key], key, even, odd, first, last);
                    i += 1;
                }
            }
        }
    }
};

