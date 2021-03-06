'use strict';

const {join, resolve} = require('path');

const stylelintVSCode = require('..');
const test = require('tape');

// https://github.com/Microsoft/vscode-languageserver-node/blob/release/4.0.0/types/src/main.ts#L157-L164
const ERROR = 1;
const WARNING = 2;

const fixtureDir = join(__dirname, 'fixtures');

test('stylelintVSCode()', t => {
	t.plan(21);

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: '  a[id="id"]{}',
				config: {
					rules: {
						'string-quotes': ['single', {severity: 'warning'}],
						indentation: ['tab']
					}
				}
			}),
			[
				{
					range: {
						start: {
							line: 0,
							character: 7
						},
						end: {
							line: 0,
							character: 7
						}
					},
					message: 'Expected single quotes (string-quotes)',
					severity: WARNING,
					code: 'string-quotes',
					source: 'stylelint'
				},
				{
					range: {
						start: {
							line: 0,
							character: 2
						},
						end: {
							line: 0,
							character: 2
						}
					},
					message: 'Expected indentation of 0 tabs (indentation)',
					severity: ERROR,
					code: 'indentation',
					source: 'stylelint'
				}
			],
			'should be resolved with diagnostics when it lints CSS successfully.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: '',
				config: {rules: {indentation: [2]}}
			}),
			[],
			'should be resolved with an empty array when no errors and warnings are reported.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: '# Title\n\n# Code block\n\n```css\n          a{\n```\n',
				codeFilename: resolve('markdown.md'),
				config: {
					rules: {
						indentation: ['tab']
					}
				}
			}),
			[
				{
					range: {
						start: {
							line: 5,
							character: 10
						},
						end: {
							line: 5,
							character: 10
						}
					},
					message: 'Unclosed block (CssSyntaxError)',
					severity: ERROR,
					code: 'CssSyntaxError',
					source: 'stylelint'
				}
			], 'should be resolved with one diagnostic when the CSS is broken.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({code: 'a{}'}),
			[],
			'should not be rejected even if no configs are defined.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: '//Hi',
				syntax: 'scss',
				config: {
					rules: {}
				}
			}),
			[],
			'should support non-standard CSS syntax with `syntax` option.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: `import glamorous from 'glamorous';
const styled = require("styled-components");
const A = glamorous.a({font: 'bold'});
const B = styled.b\`
font: normal
\`;`,
				codeFilename: 'css-in-js.js',
				config: {rules: {'font-weight-notation': ['numeric']}}}),
			[
				{
					range: {
						start: {
							line: 2,
							character: 28
						},
						end: {
							line: 2,
							character: 28
						}
					},
					message: 'Expected numeric font-weight notation (font-weight-notation)',
					severity: 1,
					code: 'font-weight-notation',
					source: 'stylelint'
				},
				{
					range: {
						start: {
							line: 4,
							character: 6
						},
						end: {
							line: 4,
							character: 6
						}
					},
					message: 'Expected numeric font-weight notation (font-weight-notation)',
					severity: 1,
					code: 'font-weight-notation',
					source: 'stylelint'
				}
			],
			'should support CSS-in-JS.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: 'a { color: #000 }',
				codeFilename: resolve('should-be-ignored.css'),
				config: {
					processors: [],
					rules: {
						'color-hex-length': 'long'
					},
					ignoreFiles: '**/*-ignored.css'
				}
			}),
			[],
			'should support `codeFilename` option.'
		);
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({
				code: 'styled.p`"`',
				codeFilename: 'f.i.x.t.u.r.e.tsx',
				config: {
					processors: [
						join(fixtureDir, 'stylelint-processor-styled-components', 'dummy-noop-processor.js'),
						'stylelint-processor-styled-components'
					],
					rules: {}
				}
			}),
			[
				{
					range: {
						start: {
							line: 0,
							character: 12
						},
						end: {
							line: 0,
							character: 12
						}
					},
					message: 'Unclosed string (CssSyntaxError)',
					severity: ERROR,
					code: 'CssSyntaxError',
					source: 'stylelint'
				}
			],
			'should support `processors` option.'
		);
	})();

	(async () => {
		t.deepEqual(await stylelintVSCode({code: 'a{color:rgba(}'}), [
			{
				range: {
					start: {
						line: 0,
						character: 12
					},
					end: {
						line: 0,
						character: 12
					}
				},
				message: 'Unclosed bracket (CssSyntaxError)',
				severity: ERROR,
				code: 'CssSyntaxError',
				source: 'stylelint'
			}
		], 'should check CSS syntax even if no configration is provided.');
	})();

	(async () => {
		t.deepEqual(await stylelintVSCode({code: '@', config: {}}), [
			{
				range: {
					start: {
						line: 0,
						character: 0
					},
					end: {
						line: 0,
						character: 0
					}
				},
				message: 'At-rule without name (CssSyntaxError)',
				severity: ERROR,
				code: 'CssSyntaxError',
				source: 'stylelint'
			}
		], 'should check CSS syntax even if no rule is provided.');
	})();

	(async () => {
		t.deepEqual(
			await stylelintVSCode({code: 'a{}', config: {}}),
			[],
			'should not be rejected even if no rules are defined.'
		);
	})();

	const fail = t.fail.bind(t, 'Unexpectedly succeeded.');

	(async () => {
		try {
			await stylelintVSCode({
				code: '  a[id="id"]{}',
				config: {
					rules: {
						'string-quotes': 'single',
						'color-hex-case': 'foo',
						'at-rule-empty-line-before': ['always', {bar: true}]
					}
				}
			});
			fail();
		} catch ({message, reasons}) {
			const expected = [
				'Invalid option value "foo" for rule "color-hex-case"',
				'Invalid option name "bar" for rule "at-rule-empty-line-before"'
			];

			t.equal(
				message,
				expected.join('\n'),
				'should be rejected when it takes incorrect options.'
			);

			t.deepEqual(
				reasons,
				expected,
				'should add `reason` property to the error when it takes incorrect options.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({
				code: 'b{}',
				config: {
					rules: {
						'this-rule-does-not-exist': 1,
						'this-rule-also-does-not-exist': 1
					}
				}
			});
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'Undefined rule this-rule-does-not-exist',
				'should be rejected when the rules include unknown one.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode(Buffer.from('1'));
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'Expected an object containing stylelint API options, but got <Buffer 31>.',
				'should be rejected when the first argument is not a plain object.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({files: ['src/*.css']});
			fail();
		} catch ({message}) {
			t.ok(
				message.startsWith('[ \'src/*.css\' ] was passed to `file` option'),
				'should be rejected when `files` option is provided.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({});
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'`code` option is required but not provided.',
				'should be rejected when `code` option is not provided.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({code: null});
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'`code` option must be a string, but received a non-string value null.',
				'should be rejected when a non-string value is passed to `code` option.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({
				code: '',
				config: {
					processors: join(fixtureDir, 'stylelint-processor-broken'),
					rules: {
						'selector-type-case': 'lower'
					}
				}
			});
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'Error for stylelint-vscode test',
				'should be rejected when it loads a broken processor.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode();
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'Expected 1 argument (<Object>), but got no arguments.',
				'should be rejected when it takes no argument.'
			);
		}
	})();

	(async () => {
		try {
			await stylelintVSCode({}, {});
			fail();
		} catch ({message}) {
			t.equal(
				message,
				'Expected 1 argument (<Object>), but got 2 arguments.',
				'should be rejected when it takes too many argument.'
			);
		}
	})();
});

test('stylelintVSCode() with a configration file', async t => {
	process.chdir(fixtureDir);

	t.deepEqual(
		await stylelintVSCode({
			code: 'const what: string = "is this";\n<a css={{\n  width: "0px",\n  what\n}} />;\n',
			codeFilename: 'index.tsx',
			configOverrides: {
				rules: {
					'property-no-unknown': [
						true, {
							ignoreProperties: 'what'
						}
					]
				}
			}
		}),
		[
			{
				range: {
					start: {
						line: 2,
						character: 10
					},
					end: {
						line: 2,
						character: 10
					}
				},
				message: 'Unexpected unit (length-zero-no-unit)',
				severity: ERROR,
				code: 'length-zero-no-unit',
				source: 'stylelint'
			}
		],
		'should adhere configuration file settings.'
	);

	t.end();
});
