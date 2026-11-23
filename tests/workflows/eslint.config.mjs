import { defineConfig, globalIgnores } from 'eslint/config';
import scality from '@scality/eslint-config-scality';
import { jest } from '@scality/eslint-config-scality/testing';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores(['repo/']),
    ...scality,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
        },
    },
    {
        files: [tseslint.globs.ts],
        extends: [tseslint.configs.recommended],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        rules: {
            // The GitHub REST API names its fields in snake case
            camelcase: ['error', { properties: 'never' }],
        },
    },
    jest(['**/*.spec.ts', '**/*.spec.js']),
);
