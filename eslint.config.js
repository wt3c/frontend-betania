import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
export default ts.config(
  {ignores: ['dist/**', 'node_modules/**', '*.html', 'script.js', 'setup_postgres_ha.sh']},
  js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/recommended'],
  {files: ['**/*.vue'], languageOptions: {parserOptions: {parser: ts.parser}}, rules: {'vue/multi-word-component-names': 'off'}},
  prettier,
)
