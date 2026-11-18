import { fileURLToPath } from 'node:url';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import scality from 'eslint-config-scality';
import { mocha } from 'eslint-config-scality/testing';
import tseslint from 'typescript-eslint';

export default defineConfig(
    includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
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

    // TypeScript files (shared clients and test resources setup)
    {
        files: ['clients/**/*.ts', 'testResourcesSetup/**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            // CLI setup scripts report progress to the console
            'no-console': 'off',
        },
    },

    // JavaScript files (mocha)
    {
        files: ['mocha/**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
        },
        rules: {
            'no-param-reassign': 'off',
            'camelcase': ['error', { 'properties': 'never' }],
        },
    },
    mocha(['mocha/**/*.js']),
);
