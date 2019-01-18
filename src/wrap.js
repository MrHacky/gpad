module.exports = function(s) {
    if (s == "./test")
        return import("./test");
    else
        return null;
}