module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier'],
  overrides: [
    { files: ['*.svelte'], plugins: ['svelte3'], processor: 'svelte3/svelte3' },
    { files: ['*.html'], plugins: ['html'] },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' }
    }
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2019
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  }
}
