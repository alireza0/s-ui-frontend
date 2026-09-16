import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.{ts,mts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      // Vuetify data-table slots use dotted names (item.name, header.foo)
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      // Legacy patterns: protocol/tls components mutate prop objects directly,
      // and most of the codebase is untyped. Downgraded until refactored.
      'vue/no-mutating-props': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
