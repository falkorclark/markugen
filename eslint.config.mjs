// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-control-regex': 'off',
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@stylistic/brace-style': ['error', 'allman', { allowSingleLine: true }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/template-curly-spacing': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/no-tabs': ['error'],
      '@stylistic/max-len': ['error', { 
        code: 80, 
        ignoreUrls: true, 
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],
    },
  },
);