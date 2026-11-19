import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import scality from '@scality/eslint-config-scality';
import { mocha } from '@scality/eslint-config-scality/testing';
import tseslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    ...scality,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
        },
    },
    {
        // Generates the resource policies features, run as an ES module
        files: ['ctst/features/resource-policies/regen.js'],
        languageOptions: {
            sourceType: 'module',
        },
    },
    {
        files: [tseslint.globs.ts],
        extends: [tseslint.configs.recommended],
    },

    // TypeScript files (ctst)
    {
        files: ['ctst/**/*.ts'],
        rules: {
            // CucumberJS steps start with an uppercase
            'new-cap': 'off',
        },
    },

    // TypeScript files (shared clients and test resources setup)
    {
        files: ['clients/**/*.ts', 'testResourcesSetup/**/*.ts'],
        rules: {
            // CLI setup scripts report progress to the console
            'no-console': 'off',
        },
    },

    // JavaScript files (mocha)
    {
        files: ['mocha/**/*.js'],
        rules: {
            'no-param-reassign': 'off',
            'camelcase': ['error', { properties: 'never' }],
        },
    },
    mocha(['mocha/**/*.js']),
);
