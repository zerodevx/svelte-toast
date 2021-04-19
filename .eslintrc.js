module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  env: {
    es6: true,
    browser: true,
    node: true
  },
  extends: [
    'standard'
  ],
  plugins: [
    'svelte3',
    'html'
  ],
  globals: {
    dataLayer: true,
    gtag: true
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        'import/first': 0,
        'import/no-duplicates': 0,
        'import/no-mutable-exports': 0,
        'no-multiple-empty-lines': 0
      }
    }
  ]
}
