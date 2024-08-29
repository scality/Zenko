import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [{
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
}, ...compat.extends(
    'plugin:@typescript-eslint/eslint-recommended',
), {
    languageOptions: {
        parser: tsParser,
    },

    files: [
        '**/*.ts',
        '**/*.tsx',
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
        'new-cap': 'off',
        'no-await-in-loop': 'off',
        'no-var': 'off',
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
        'operator-linebreak': 'off',
        'implicit-arrow-linebreak': 'off',
        'object-curly-newline': 'off',
        'function-paren-newline': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'import/no-extraneous-dependencies': 'off',

        'max-len': ['error', {
            code: 120,
            tabWidth: 4,
            ignoreUrls: true,
        }],
    },
}];
