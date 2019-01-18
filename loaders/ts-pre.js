module.exports = function(source) {
    if (source.match(/\bimport\W*\(/)) {
        //console.warn('pre');
        //console.warn(source)
        //source = source.replace(/\bimport\W*\(\W*(['"][^'"]+['"])\W*\)/g, "myimport<typeof import($1)>($1)");
        source = source.replace(/\bimport\W*\(\W*(['"][^'"]+['"])\W*\)/g, "/*IMPORT*/($1 as any as typeof import($1))");
        //console.warn('->');
        //console.warn(source)
    }
    return source;
}