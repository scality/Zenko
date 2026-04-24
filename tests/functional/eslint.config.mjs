import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gitignorePath = path.resolve(__dirname, '.gitignore');
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default tseslint.config(
    includeIgnoreFile(gitignorePath),
    {
        ignores: [
            'configuration_setup/**',
            'ctst/sorbetctl',
            'ctst/zenko-drctl',
            'ctst/reports/**',
            'ctst/build/**',
        ],
    },

    // TypeScript files (ctst)
    {
        files: ['ctst/**/*.ts'],
        extends: [
            ...compat.extends('scality'),
            ...tseslint.configs.recommended,
        ],
        rules: {
            // CucumberJS steps start with an uppercase
            'new-cap': 'off',
        },
    },

    // JavaScript files (mocha)
    {
        files: ['mocha/**/*.js'],
        extends: [
            ...compat.extends('scality'),
        ],
        rules: {
            'prefer-spread': 'off',
            'no-bitwise': 'off',
            'class-methods-use-this': 'off',
            'global-require': 'off',
            'no-param-reassign': 'off',
            'no-loop-func': 'off',
            'padded-blocks': 'off',
            'no-plusplus': 'off',
            'no-underscore-dangle': 'off',
            'func-names': 'off',
            'camelcase': ['error', { 'properties': 'never' }],
        },
    },
);
