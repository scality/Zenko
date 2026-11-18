import { fileURLToPath } from 'node:url';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import scality from 'eslint-config-scality';
import { mocha } from 'eslint-config-scality/testing';
import tseslint from 'typescript-eslint';

export default defineConfig(
    includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
    {
        ignores: [
            'configuration_setup/**',
            'ctst/sorbetctl',
            'ctst/zenko-drctl',
            'ctst/reports/**',
            'ctst/build/**',
        ],
    },
    ...scality,

    // TypeScript files (ctst)
    {
        files: ['ctst/**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            // CucumberJS steps start with an uppercase
            'new-cap': 'off',
        },
    },

    // TypeScript files (shared clients)
    {
        files: ['clients/**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            // CLI setup scripts report progress to the console
            'no-console': 'off',
        },
    },

    // JavaScript files (mocha)
    {
        files: ['mocha/**/*.js'],
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
    mocha(['mocha/**/*.js']),
);
