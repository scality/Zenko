import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default tseslint.config(
    ...compat.extends('scality'),
    ...tseslint.configs.recommended,
    {
        ignores: [
            '**/.vscode',
            '**/vendor/*.js',
            '**/build',
            '**/coverage',
            '**/dist',
            '**/node_modules',
            '**/package',
            '**/reports',
            '**/eslint.config.mjs',
        ],
        rules: {
            // CucumberJS steps start with an uppercase
            'new-cap': 'off',
        },
    },
);
