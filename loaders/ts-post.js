module.exports = function(source, sourceMap) {
    if (source.match(/\/\*IMPORT\*\//)) {
        //console.warn('post')
        //console.warn(source)
        //source = source.replace(/\bmyimport\W*\((['"])/g, "import($1");
        source = source.replace(/\/\*IMPORT\*\/(\W*)(['"][^'"]+['"])/g, "import  $1($2)");

        // /*IMPORT*/\W*(['"][^'"]+['"])
        sourceMap.sourcesContent[0] = sourceMap.sourcesContent[0].replace(/\/\*IMPORT\*\/\((['"][^'"]+['"]) as any as typeof import\(['"][^'"]+['"]\)\)/g, "import($1)");
        //console.log(sourceMap);    
        //console.warn('->')
        //console.warn(source)
    }
    source = source.replace(/"use strict"/g, '"non-strict"');
    
    //return source;
    this.callback(null, source, sourceMap);
}