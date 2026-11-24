import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import scality from '@scality/eslint-config-scality';
import { jest, mocha } from '@scality/eslint-config-scality/testing';
import tseslint from 'typescript-eslint';

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
        files: ['tests/functional/ctst/features/resource-policies/regen.js'],
        languageOptions: {
            sourceType: 'module',
        },
    },
    {
        files: [tseslint.globs.ts],
        extends: [tseslint.configs.recommended],
    },
    {
        files: ['tests/functional/ctst/**/*.ts'],
        rules: {
            // CucumberJS steps start with an uppercase
            'new-cap': 'off',
        },
    },
    {
        files: ['tests/functional/clients/**/*.ts', 'tests/functional/testResourcesSetup/**/*.ts'],
        rules: {
            // CLI setup scripts report progress to the console
            'no-console': 'off',
        },
    },
    {
        files: ['tests/functional/mocha/**/*.js'],
        rules: {
            'no-param-reassign': 'off',
            'camelcase': ['error', { properties: 'never' }],
        },
    },
    mocha(['tests/functional/mocha/**/*.js']),
    {
        files: ['tests/workflows/**', '.github/**'],
        rules: {
            // The GitHub REST API names its fields in snake case
            camelcase: ['error', { properties: 'never' }],
        },
    },
    {
        files: ['tests/workflows/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    jest(['tests/workflows/**/*.spec.ts', 'tests/workflows/**/*.spec.js']),
);
