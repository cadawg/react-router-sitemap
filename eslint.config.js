const js = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');

const testGlobals = {
	describe: 'readonly',
	it: 'readonly',
	expect: 'readonly',
	beforeEach: 'readonly',
	afterEach: 'readonly',
};

module.exports = [
	js.configs.recommended,
	// CJS files (config scripts)
	{
		files: ['eslint.config.js', 'config/**/*.js', 'example/sitemap-builder.js'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'commonjs',
			globals: {
				require: 'readonly',
				module: 'writable',
				exports: 'writable',
				__dirname: 'readonly',
				__filename: 'readonly',
				process: 'readonly',
			},
		},
		rules: {
			'no-var': 'error',
		},
	},
	// ESM source and test files
	{
		files: ['lib/**/*.js', 'lib/**/*.jsx', 'test/**/*.js', 'example/**/*.js', 'example/**/*.jsx'],
		plugins: {
			react: reactPlugin,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...testGlobals,
				process: 'readonly',
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'no-var': 'error',
			'prefer-const': 'warn',
			'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],
			'eqeqeq': 'error',
			'no-console': 'off',
		},
	},
];