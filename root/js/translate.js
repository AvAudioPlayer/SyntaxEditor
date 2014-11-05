;(function(self) {

	self.execRuleTable = execRuleTable

	function execRuleTable(ast) {

		var astStack = [ast]

		var vastStack = [Vast.div('vast')]

		var ruleTable = {
			'Program': [recursive('body')],

			'EmptyStatement': undefined,

			'BlockStatement': [recursive('body')],

			'ExpressionStatement': [recursive('expression'), semicolon, br],

			'IfStatement': function(ast) {
				if (!ast.alternate) {
					return [
						keyword('if'), sp_opt, left_bracket, recursive('test'), right_bracket, sp_opt, left_brace, br, 
						indent(recursive('consequent')), right_brace, br
					]
				}
				else {
					return [
						keyword('if'), sp_opt, left_bracket, recursive('test'), right_bracket, sp_opt, left_brace, br, 
						indent(recursive('consequent')), right_brace, br,
						function() {
							if (ast.alternate.type !== 'IfStatement') {
								return [keyword('else'), sp_opt, left_brace, br, indent(recursive('alternate')), right_brace, br]
							}
							else {
								return [keyword('else'), sp, recursive('alternate')]
							}
						}
					]
				}
			},

			'LabeledStatement': [recursive('label'), colon, sp_opt, recursive('body')],

			'ContinueStatement': [keyword('continue'), semicolon, br],

			'WithStatement': [keyword('with'), sp_opt, left_bracket, recursive('object'), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br],

			'SwitchStatement': [keyword('switch'), sp_opt, left_bracket, recursive('discriminant'), right_bracket, sp_opt, left_brace, br, indent(recursive('cases')), right_brace, br],

			'ReturnStatement': function (ast) {
				if (ast.argument)
					return [keyword('return'), sp, recursive('argument'), semicolon, br]
				else
					return [keyword('return'), semicolon, br]
			},

			'ThrowStatement': [keyword('throw'), sp, recursive('argument'), semicolon, br],

			'TryStatement': function(ast) {
				return [
					keyword('try'), sp_opt, left_brace, br, 
					indent(recursive('block')), right_brace, br,
					recursive('handlers'), 
					function() {
						if (ast.finalizer) {
							return [keyword('finally'), sp_opt, left_brace, br, indent(recursive('finalizer')), right_brace, br]
						}
					}
				]
			},

			'WhileStatement': [keyword('while'), sp_opt, left_bracket, recursive('test'), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br],

			'DoWhileStatement': [keyword('do'), sp_opt, left_brace, br, indent(recursive('body')), right_brace, sp_opt, keyword('while'), sp_opt, left_bracket, recursive('test'), right_bracket, br],

			'ForStatement': function(ast) {
				if (ast.init.type === 'VariableDeclaration') {
					ast.init.parentIsForInStatement = true
				}
				return [keyword('for'), sp_opt, left_bracket, recursive('init'), semicolon, dynamic_sp_opt, recursive('test'), semicolon, sp_opt, recursive('update'), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br]

				function dynamic_sp_opt() {
					if (ast.test) {
						return sp_opt
					}
				}
			},

			'ForInStatement': function (ast) {
				if (ast.left.type === 'VariableDeclaration') {
					ast.left.parentIsForInStatement = true
				}
				return [keyword('for'), sp_opt, left_bracket, recursive('left'), sp, keyword('in'), sp, recursive('right'), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br]
			},

			'ForOfStatement': undefined,

			'LetStatement': undefined,

			'DebuggerStatement': [keyword('debugger'), semicolon, br],

			// done
			'FunctionDeclaration': [keyword('function'), sp, recursive('id'), sp_opt, left_bracket, recursive('params', combine(comma, sp_opt)), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br],

			'VariableDeclaration': function(ast) {
				if (ast.parentIsForInStatement) {
					return [keyword('var'), sp, recursive('declarations', combine(comma, sp_opt))]
				}
				else {
					return [keyword('var'), sp, recursive('declarations', combine(comma, sp_opt)), semicolon, br]
				}
			},

			'VariableDeclarator': function (ast) {
				return ast.init ? [recursive('id'), sp_opt, operator('='), sp_opt, recursive('init')] : [recursive('id')]
			},

			'ThisExpression': keyword('this'),

			'ArrayExpression': [left_square_bracket, recursive('elements', combine(comma, sp_opt)), right_square_bracket],

			'ObjectExpression': function(ast) {
				if (ast.properties && ast.properties.length > 0)
					return [left_brace, br, indent(recursive('properties', combine(comma, br))), br, right_brace]
				else
					return [left_brace, right_brace]
			},

			'Property': [recursive('key'), colon, sp_opt, recursive('value')],

			// done
			'FunctionExpression': function (ast) {
				if (ast.id) {
					return [keyword('function'), sp, recursive('id'), sp_opt, left_bracket, recursive('params', combine(comma, sp_opt)), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace]
				}
				else {
					return [keyword('function'), sp, left_bracket, recursive('params', combine(comma, sp_opt)), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace]
				}
			},

			'ArrowExpression': undefined,

			'SequenceExpression': function () {
				// TODO Priority Problem
				return [left_bracket, recursive('expressions', combine(comma, sp_opt)), right_bracket]
			},

			'UnaryExpression': function(node) {
				if (node.prefix) {
					return [operator_prop, sp, recursive('argument')]
				}
				else {
					return [recursive('argument'), sp, operator_prop]
				}
			},

			'BinaryExpression': [recursive('left'), sp_opt, operator_prop, sp_opt, recursive('right')],

			'AssignmentExpression': [recursive('left'), sp_opt, operator_prop, sp_opt, recursive('right')],

			'UpdateExpression': function(node) {
				if (node.prefix) {
					return [operator_prop, sp_opt, recursive('argument')]
				}
				else {
					return [recursive('argument'), sp_opt, operator_prop]
				}
			},

			'LogicalExpression': [recursive('left'), sp_opt, operator_prop, sp_opt, recursive('right')],

			// done
			'ConditionalExpression': [left_bracket, recursive('test'), sp_opt, operator('?'), sp_opt, recursive('consequent'), sp_opt, operator(':'), sp_opt, recursive('alternate'), right_bracket],

			// done
			'NewExpression': [keyword('new'), sp, recursive('callee'), sp_opt, left_bracket, recursive('arguments', combine(comma, sp_opt)), right_bracket],

			// done
			'CallExpression': [recursive('callee'), sp_opt, left_bracket, recursive('arguments', combine(comma, sp_opt)), right_bracket],

			'MemberExpression': function (ast) {
				if (ast.computed)
					return [recursive('object'), left_square_bracket, recursive('property'), right_square_bracket]
				else
					return [recursive('object'), operator('.'), recursive('property')]
			},

			'YieldExpression': undefined,

			'ComprehensionExpression': undefined,

			'GeneratorExpression': undefined,

			'GraphExpression': undefined,

			'GraphIndexExpression': undefined,

			'LetExpression': undefined,

			'ObjectPattern': undefined, // check Mozilla Doc before implement this

			'ArrayPattern': undefined,

			'SwitchCase': function(ast) {
				if (ast.test) {
					return [keyword('case'), sp, recursive('test'), colon, br, indent(recursive('consequent'))]
				}
				else {
					return [keyword('default'), colon, br, indent(recursive('consequent'))]
				}
			},

			'BreakStatement': [keyword('break'), semicolon, br],

			'CatchClause': [keyword('catch'), sp_opt, left_bracket, recursive('param'), right_bracket, sp_opt, left_brace, br, indent(recursive('body')), right_brace, br],

			'ComprehensionBlock': undefined,

			'Identifier': function(astNode, parentVast) {
				// esprima says undefined is an identifier not a literal. see issue #1
				var vast = Vast.span('identifier', astNode.name)
				parentVast.children.push(vast)
			},

			'Literal': function(astNode, parentVast) {
				var raw = astNode.raw
				var value = astNode.value

				switch (typeof value) {
					case 'string':
						var vast = Vast.span('literal string', raw)
						break
					case 'boolean':
						var vast = Vast.span('literal boolean', raw)
						break
					case 'number':
						var vast = Vast.span('literal number', raw)
						break
					case 'undefined':
						// here won't be reached cause issue #1
						var vast = Vast.span('literal undefined', 'undefined')
						break
					case 'object':
						if (value === null) {
							var vast = Vast.span('literal null', 'null')
						}
						else if (value.constructor === RegExp) {
							var vast = Vast.span('literal regexp', value.toString())
						}
						else {
							console.log(value)
							throw new Error('unsupported type of literal: ' + typeof value)
						}
						break
					default:
						throw new Error('unsupported type of literal: ' + typeof value)
				}

				parentVast.children.push(vast)
			}
		}


		var rule = ruleTable[ast.type]

		execRule(rule)

		return currentVast() // must be vastStack[0] the root

		function execRule(rule) {

			switch (typeof rule) {
				case 'undefined':
					// ignore
					break
				case 'string':
					execStringRule(rule)
					break
				case 'object':
					if (rule === null) {
						// ignore
					}
					else if (Array.isArray(rule)) {
						execArrayRule(rule)
					}
					else {
						throw new Error('object is not a rule.')
					}
					break
				case 'function':
					execFunctionRule(rule)
					break
				default:
					throw new Error('unsupported type of rule: ' + typeof rule)
			}

			function execStringRule(strRule) {
				currentVast().children.push(Vast.span(undefined, strRule))
			}

			function execArrayRule(arrayRule) {
				arrayRule.forEach(execRule)
			}

			function execFunctionRule(funcRule) {
				return execRule(funcRule(currentAst(), currentVast()))
			}
		}

		function recursive(prop, between) {
			return function() {
				var subAst = currentAst()[prop]

				switch (typeof subAst) {
					case 'undefined':
						// ignore
						break
					case 'object':
						if (subAst === null) {
							// ignore
							return
						}
						else if (Array.isArray(subAst)) {
							if (typeof between === 'function') {
								var subAstList = subAst
								subAstList.forEach(function(subAstItem, i) {
									into(subAstItem)
									if (i < subAst.length - 1) {
										between()
									}
								})				
							}
							else {
								subAst.forEach(into)
							}
						}
						else {
							into(subAst)
						}
						break
					default:
						throw new Error('u can not recursive on type: ' + typeof subAst)
				}
			}

			function into(ast) {
				var rule = ruleTable[ast.type]
				if (!rule) {
					console.log('rule not found: ' + ast.type)
					return
				}
				pushAst(ast)
				execRule(rule)
				popAst()
			}

			function join(arr, sep) {
				if (sep === undefined || sep === null) {
					return arr
				}

				var result = []
				arr.forEach(function(arrItem) {
					result.push(arrItem)
					result.push(sep)
				})
				result.pop() // remove last sep
				return result
			}
		}

		function combine() {
			var a = arguments
			return function() {
				for (var i = 0, len = a.length; i < len; ++i) {
					a[i]()
				}
			}
		}

		function operator_prop(ast, parentVast) {
			var vast = Vast.span('operator', ast.operator)
			parentVast.children.push(vast)
		}

		function pushVast(target) {
			return vastStack.push(target)
		}

		function popVast() {
			return vastStack.pop()
		}

		function currentVast() {
			return vastStack[vastStack.length - 1]
		}

		function pushAst(target) {
			return astStack.push(target)
		}

		function popAst() {
			return astStack.pop()
		}

		function currentAst() {
			return astStack[astStack.length - 1]
		}

		function keyword(text) {
			return function () {
				currentVast().children.push(Vast.span('keyword ' + text, text))
			}
		}

		function br() {
			currentVast().children.push({
				name: 'br'
			})
		}

		function sp() {
			currentVast().children.push(Vast.span('space', ' '))
		}

		function sp_opt() {
			currentVast().children.push(Vast.span('space optional', ' '))
		}

		function operator(text) {
			return function () {
				currentVast().children.push(Vast.span('operator', text))
			}
		}

		function semicolon() {
			currentVast().children.push(Vast.span('semicolon', ';'))
		}

		function left_brace() {
			currentVast().children.push(Vast.span('brace left', '{'))
		}

		function right_brace() {
			currentVast().children.push(Vast.span('brace right', '}'))
		}

		function left_bracket() {
			currentVast().children.push(Vast.span('bracket left', '('))
		}

		function right_bracket() {
			currentVast().children.push(Vast.span('bracket right', ')'))
		}

		function left_square_bracket() {
			currentVast().children.push(Vast.span('square_bracket left', '['))
		}

		function right_square_bracket() {
			currentVast().children.push(Vast.span('square_bracket right', ']'))
		}

		function comma() {
			currentVast().children.push(Vast.span('comma', ','))				
		}

		function colon() {
			currentVast().children.push(Vast.span('colon', ':'))				
		}

		function indent() {
			var funcs = arguments
			return function () {
				
				var indentSection = Vast.sectionMark('indent')
				currentVast().children.push(indentSection.enter)

				for (var i = 0, len = funcs.length; i < len; ++i) {
					funcs[i].apply(undefined, arguments)
				}

				currentVast().children.push(indentSection.leave)
			}
		}
	}
}) (window);