import { defineConfig } from 'eslint/config';
import scality from 'eslint-config-scality';
import { jest } from 'eslint-config-scality/testing';
import tseslint from 'typescript-eslint';

export default defineConfig(
    ...scality,
    {
        files: ['**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            // @kie/mock-github types the parameters of its GitHub API mocks as undefined
            '@typescript-eslint/no-explicit-any': 'off',
            // The scripts under .github that the tests load are untyped CommonJS modules
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
        },
    },
    {
        rules: {
            // The GitHub API objects and the workflow inputs are in snake_case
            camelcase: ['error', { properties: 'never' }],
        },
    },
    jest(['**/*.spec.ts', '**/*.spec.js']),
);
