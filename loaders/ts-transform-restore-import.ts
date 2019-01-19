import * as ts from 'typescript'

function transformerRestoreImport(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visit: ts.Visitor = (node: ts.Node) => {
        // normal require's will be emitted as 'var x = require("x")', but require's resulting
        // from import calls will be wrapped in a promise: '....then(function(x) { return require("x"); })'
        // so we will look for return statements directly returning the result of 'require'
        // and replace 'require' with 'import'. The promise unwrapping of .then will handle
        // the fact that require would return the module directly and import will return a promise.
        if (ts.isReturnStatement(node)
            && ts.isCallExpression(node.expression)
            && ts.isIdentifier(node.expression.expression) && node.expression.expression.text == 'require'
            && node.expression.arguments.length == 1 && ts.isStringLiteral(node.expression.arguments[0])
        ) {
            //console.log('restored import: ' + node.expression.arguments[0].getText());

            return ts.createReturn(
                ts.createCall(
                    ts.createIdentifier('import'),
                    undefined,
                    node.expression.arguments,
                )
            );
        }

        return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit);
 };

export = () => ({ after: [ transformerRestoreImport ]});
