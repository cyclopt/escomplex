const _merge = require("lodash.merge");
const _isString = require("lodash.isstring");
const safeName = require("../safeName");
const safeArray = require("../safeArray");

const DEFAULTS = {
	assignableName: undefined,
	children: safeArray(undefined),
	cyclomatic: 0,
	lloc: 0,
	newScope: undefined,
	dependencies: undefined,
};

const operators = (properties) => properties.map((property) => {
	if (property && typeof property.identifier !== "undefined") {
		return property;
	}
	return {
		identifier: property,
	};
});

const operands = (identifiers) => identifiers.map((identifier) => ({ identifier }));

function defineSyntax(spec) {
	const computedSpec = {
		children: safeArray(spec.children),
		operands: operands(safeArray(spec.operands)),
		operators: operators(safeArray(spec.operators)),
	};
	return _merge({}, DEFAULTS, spec, computedSpec);
}

const ArrayExpression = () => defineSyntax({
	operators: "[]",
	operands: safeName,
	children: "elements",
});

const AssignmentExpression = () => defineSyntax({
	operators: (node) => node.operator,
	children: ["left", "right"],
	assignableName: (node) => {
		if (node.left.type === "MemberExpression") {
			return `${safeName(node.left.object)
			}.${
				node.left.property.name}`;
		}
		return safeName(node.left.id);
	},
});

const BinaryExpression = () => defineSyntax({
	operators: (node) => node.operator,
	children: ["left", "right"],
});

const BlockStatement = () => defineSyntax({
	children: "body",
});

const BreakStatement = () => defineSyntax({
	lloc: 1,
	operators: "break",
	children: ["label"],
});

let amdPathAliases = {};

function dependencyPath(item, fallback) {
	if (item.type === "Literal") {
		return amdPathAliases[item.value] || item.value;
	}
	return fallback;
}

function processRequire(node) {
	const line = node.loc.start.line;
	const path = "* dynamic dependency *";
	const args = node.arguments;

	if (args.length === 1) {
		return {
			line,
			type: "CommonJS",
			path: dependencyPath(args[0], path),
		};
	}

	if (args.length === 2) {
		const type = "AMD";

		if (args[0].type === "ArrayExpression") {
			return args[0].elements.map(
				(item) => ({
					type,
					line,
					path: dependencyPath(item, path),
				}),
			);
		}

		return {
			type,
			line,
			path: dependencyPath(args[0], "* dynamic dependencies *"),
		};
	}
	return null;
}

const CallExpression = () => defineSyntax({
	lloc: (node) => (node.callee.type === "FunctionExpression" ? 1 : 0),
	operators: "()",
	children: ["arguments", "callee"],
	dependencies: (node, clearAliases) => {
		if (clearAliases) {
			// TODO: This prohibits async running. Refine by passing in module id as key for amdPathAliases.
			amdPathAliases = {};
		}

		if (node.callee.type === "Identifier" && node.callee.name === "require") {
			return processRequire(node);
		}

		if (
			node.callee.type === "MemberExpression"
			&& node.callee.object.type === "Identifier"
			&& node.callee.object.name === "require"
			&& node.callee.property.type === "Identifier"
			&& node.callee.property.name === "config"
		) {
			const args = node.arguments;
			if (args.length === 1 && args[0].type === "ObjectExpression") {
				args[0].properties.forEach((property) => {
					if (
						property.key.type === "Identifier"
						&& property.key.name === "paths"
						&& property.value.type === "ObjectExpression"
					) {
						property.value.properties.forEach((alias) => {
							if (
								alias.key.type === "Identifier"
								&& alias.value.type === "Literal"
							) {
								amdPathAliases[alias.key.name] = alias.value.value;
							}
						});
					}
				});
			}
		}
		return null;
	},
});

const CatchClause = (settings) => defineSyntax({
	lloc: 1,
	cyclomatic: settings.trycatch ? 1 : 0,
	operators: "catch",
	children: ["param", "body"],
});

const ConditionalExpression = () => defineSyntax({
	cyclomatic: 1,
	operators: ":?",
	children: [
		"test",
		"consequent",
		"alternate",
	],
});

const ContinueStatement = () => defineSyntax({
	lloc: 1,
	operators: "continue",
	children: ["label"],
});

const DebuggerStatement = () => defineSyntax({});

const DoWhileStatement = () => defineSyntax({
	lloc: 2,
	cyclomatic: (node) => (node.test ? 1 : 0),
	operators: "dowhile",
	children: [
		"test",
		"body",
	],
});

const EmptyStatement = () => defineSyntax({});

const ExpressionStatement = () => defineSyntax({
	lloc: 1,
	children: ["expression"],
});

const ForInStatement = (settings) => defineSyntax({
	lloc: 1,
	cyclomatic: settings.forin ? 1 : 0,
	operators: "forin",
	children: [
		"left",
		"right",
		"body",
	],
});

const ForStatement = () => defineSyntax({
	lloc: 1,
	cyclomatic: (node) => (node.test ? 1 : 0),
	operators: "for",
	children: [
		"init",
		"test",
		"update",
		"body",
	],
});

const FunctionDeclaration = () => defineSyntax({
	lloc: 1,
	operators: "function",
	operands: (node) => safeName(node.id),
	children: ["params", "body"],
	newScope: true,
});

const FunctionExpression = () => defineSyntax({
	operators: "function",
	operands: (node) => safeName(node.id),
	children: ["params", "body"],
	newScope: true,
});

const Identifier = () => defineSyntax({
	operands: (node) => node.name,
});

const IfStatement = () => defineSyntax({
	lloc: (node) => (node.alternate ? 2 : 1),
	cyclomatic: 1,
	operators: [
		"if",
		{
			filter: (node) => !!node.alternate,
			identifier: "else",
		},
	],
	children: [
		"test",
		"consequent",
		"alternate",
	],
});

const LabeledStatement = () => defineSyntax({});

const Literal = () => defineSyntax({
	operands: (node) => {
		if (_isString(node.value)) {
			return `"${node.value}"`;
		}
		return node.value;
	},
});

const LogicalExpression = (settings) => defineSyntax({
	cyclomatic: (node) => {
		const isAnd = node.operator === "&&";
		const isOr = node.operator === "||";
		return (isAnd || (settings.logicalor && isOr)) ? 1 : 0;
	},
	operators: (node) => node.operator,
	children: ["left", "right"],
});

const MemberExpression = () => defineSyntax({
	lloc: (node) => {
		const type = node.object.type;
		if (
			type === "ObjectExpression"
			|| type === "ArrayExpression"
			|| type === "FunctionExpression"
		) {
			return 1;
		}
		return 0;
	},
	operators: ".",
	children: ["object", "property"],
});

const NewExpression = () => defineSyntax({
	lloc: (node) => (node.callee.type === "FunctionExpression" ? 1 : 0),
	operators: "new",
	children: ["arguments", "callee"],
});

const ObjectExpression = () => defineSyntax({
	operators: "{}",
	operands: safeName,
	children: "properties",
});

const Property = () => defineSyntax({
	lloc: 1,
	operators: ":",
	children: ["key", "value"],
	assignableName: (node) => safeName(node.key),
});

const ReturnStatement = () => defineSyntax({
	lloc: 1,
	operators: "return",
	children: "argument",
});

const SequenceExpression = () => defineSyntax({ children: "expressions" });

const SwitchCase = (settings) => defineSyntax({
	lloc: 1,
	cyclomatic: (node) => (settings.switchcase && node.test ? 1 : 0),
	operators: (node) => (node.test ? "case" : "default"),
	children: [
		"test",
		"consequent",
	],
});

const SwitchStatement = () => defineSyntax({
	lloc: 1,
	operators: "switch",
	children: [
		"discriminant",
		"cases",
	],
});

const ThisExpression = () => defineSyntax({ operands: "this" });
const ThrowStatement = () => defineSyntax({
	lloc: 1,
	operators: "throw",
	children: "argument",
});

const TryStatement = () => defineSyntax({
	lloc: 1,
	children: [
		"block",
		"handler",
	],
});

const UnaryExpression = () => defineSyntax({
	operators: (node) => `${node.operator} (${node.prefix ? "pre" : "post"}fix)`,
	children: "argument",
});

const UpdateExpression = () => defineSyntax({
	operators: (node) => `${node.operator} (${node.prefix ? "pre" : "post"}fix)`,
	children: "argument",
});

const VariableDeclaration = () => defineSyntax({
	operators: (node) => node.kind,
	children: "declarations",
});

const VariableDeclarator = () => defineSyntax({
	lloc: 1,
	operators: {
		filter: (node) => !!node.init,
		identifier: "=",
	},
	children: ["id", "init"],
	assignableName: (node) => safeName(node.id),
});

const WhileStatement = () => defineSyntax({
	lloc: 1,
	cyclomatic: (node) => (node.test ? 1 : 0),
	operators: "while",
	children: [
		"test",
		"body",
	],
});

const WithStatement = () => defineSyntax({
	lloc: 1,
	operators: "with",
	children: [
		"object",
		"body",
	],
});

module.exports = {
	ArrayExpression,
	AssignmentExpression,
	BinaryExpression,
	BlockStatement,
	BreakStatement,
	CallExpression,
	CatchClause,
	ConditionalExpression,
	ContinueStatement,
	DebuggerStatement,
	DoWhileStatement,
	EmptyStatement,
	ExpressionStatement,
	ForInStatement,
	ForStatement,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	IfStatement,
	LabeledStatement,
	Literal,
	LogicalExpression,
	MemberExpression,
	NewExpression,
	ObjectExpression,
	Property,
	ReturnStatement,
	SequenceExpression,
	SwitchCase,
	SwitchStatement,
	ThisExpression,
	ThrowStatement,
	TryStatement,
	UnaryExpression,
	UpdateExpression,
	VariableDeclaration,
	VariableDeclarator,
	WhileStatement,
	WithStatement,
};
