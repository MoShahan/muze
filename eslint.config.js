const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  ...expoConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': ['error', { count: 1 }],
      'no-restricted-syntax': [
        'error',
        {
          // Use \\u2014 so this file does not contain a literal em dash
          selector: 'Literal[value=/\\u2014/u]',
          message: 'Avoid em dashes in code; use ASCII punctuation instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\u2014/u]',
          message: 'Avoid em dashes in code; use ASCII punctuation instead.',
        },
      ],
    },
  },
  // Keep last so Prettier wins over any conflicting ESLint style rules.
  eslintConfigPrettier,
]);
