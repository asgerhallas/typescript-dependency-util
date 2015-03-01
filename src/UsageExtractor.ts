import ts = require("typescript");

var tsAlias = <any>ts;

function kindToString(kind: number): string {
    return tsAlias.SyntaxKind[kind];
}

type UsageReport = {
    [fileName: string]: string[];
}

class UsageExtractor {

    private options: ts.CompilerOptions = {
		noLib: true
	};
	private host = ts.createCompilerHost(this.options);
	private program: ts.Program = null;
    private currentFile: ts.SourceFile;
    private report: UsageReport = {};

    findUsages (sourceFiles: string[]): UsageReport {
        this.host = ts.createCompilerHost(this.options)
        this.program = ts.createProgram(sourceFiles, this.options, this.host)
        this.program.getSourceFiles().forEach(file => this.processFile(file));
        return this.report;
    }

    private processFile(file: ts.SourceFile) {
        this.currentFile = file;
        this.processNode(file);
    }

    private visitChildren = true;

    private processNode(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            var identifier = <ts.Identifier>node;
            //console.log(`Identifier: ${identifier.text} <= ${kindToString(identifier.parent.kind)}`);
            this.processIdentifier(identifier);
        } else if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
            this.processPropertyAccessExpression(<ts.PropertyAccessExpression>node);
            this.visitChildren = false;
        }

        if (this.visitChildren) {
            ts.forEachChild(node, node => this.processNode(node));
        }
        this.visitChildren = true;
    }

    private processIdentifier(id: ts.Identifier) {
        this.addUsageToCurrentFile(id.text);
    }

    private addUsageToCurrentFile(usage: string) {
        if (!this.report.hasOwnProperty(this.currentFile.filename)) {
            this.report[this.currentFile.filename] = [];
        }
        if (this.report[this.currentFile.filename].indexOf(usage) === -1) {
            this.report[this.currentFile.filename].push(usage);
        }
    }

    private processPropertyAccessExpression(expr: ts.PropertyAccessExpression) {
        var fullName = this.getFullNameFromPropertyAccessExpression(expr);
        if (fullName != null) {
            this.addUsageToCurrentFile(fullName);
        }
    }

    private getFullNameFromPropertyAccessExpression(expr: ts.PropertyAccessExpression): string {
        if (expr.expression.kind === ts.SyntaxKind.Identifier) {
            return (<ts.Identifier>expr.expression).text + '.' + expr.name.text;
        } else if (expr.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            var prop = <ts.PropertyAccessExpression>expr.expression;
            return this.getFullNameFromPropertyAccessExpression(prop) + '.' + expr.name.text;
        } else {
            return null;
        }
    }
}

export = UsageExtractor;
