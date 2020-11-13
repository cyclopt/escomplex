const safeName = require("../safeName");

const defineSyntax = require("./define-syntax");

const ForOfStatement = (settings) => defineSyntax({
	lloc: 1,
	cyclomatic: settings.forof ? 1 : 0,
	operators: "forof",
	children: ["left", "right", "body"],
});

const ClassBody = () => defineSyntax({
	children: ["body"],
});

const ClassDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "class",
	operands: (node) => node.id.name,
	children: ["superClass", "body"],
});

const ImportDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "import",
	children: ["specifiers", "source"],
	dependencies: (node) => ({
		line: node.loc.start.line,
		type: "Module",
		path: node.source.value,
	}),
});

const ExportAllDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "export",
	children: ["source"],
});

const ExportDefaultDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "export",
	children: ["declaration"],
});

const ExportNamedDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "export",
	children: ["declaration", "specifiers", "source"],
});

const MethodDefinition = () => defineSyntax({
	operators: (node) => (node.static ? "static" : undefined),
	children: ["value"],
	methodName: (node) => node.key,
});

// Arrows with a block statement body are treated as new scope
const ArrowFunctionExpression = () => defineSyntax({
	operators: "=>",
	children: ["params", "body"],
	newScope: (node) => !node.expression,
});

const YieldExpression = () => defineSyntax({
	operators: "yield",
	children: ["argument"],
});

const RestElement = () => defineSyntax({
	operators: "rest",
	children: ["argument"],
});

const SpreadElement = () => defineSyntax({
	operators: "spread",
	children: ["argument"],
});

// Default Parameters
const AssignmentPattern = () => defineSyntax({
	operators: "=",
	children: ["left", "right"],
	assignableName: (node) => safeName(node.left.id),
});

// Destructuring
const ArrayPattern = () => defineSyntax({
	operators: "[]",
	children: "elements",
});

const ObjectPattern = () => defineSyntax({
	operators: "{}",
	children: "properties",
});

const TemplateLiteral = () => defineSyntax({
	operators: "``",
	children: "expressions",
});

const TaggedTemplateExpression = () => defineSyntax({
	operators: "tag",
	children: "quasi",
});

// Property redefined here so that
// if it is shorthand it does not increment the operators,
// nor does it add a logical loc
const Property = () => defineSyntax({
	lloc: (node) => (node.shorthand ? 0 : 1),
	operators: (node) => (node.shorthand ? undefined : ":"),
	// Note that when shorthand is true, key and value will be
	// the same, so total operands will be 1 higher than it ideally should be
	// No easy fix.
	children: ["key", "value"],
	assignableName: (node) => safeName(node.key),
});

module.exports = {
	ClassBody,
	ClassDeclaration,
	ExportAllDeclaration,
	ExportDefaultDeclaration,
	ExportNamedDeclaration,
	ForOfStatement,
	ImportDeclaration,
	MethodDefinition,
	ArrowFunctionExpression,
	YieldExpression,
	RestElement,
	SpreadElement,
	AssignmentPattern,
	ArrayPattern,
	ObjectPattern,
	TemplateLiteral,
	TaggedTemplateExpression,
	Property,
};
