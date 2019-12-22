module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      jsx:  true
    },
  },
  plugins: [
    '@typescript-eslint',
    'simple-import-sort',
    'import',
    'jest',
    'react'
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended'
  ],
  rules: { 
    "react/prop-types": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-use-before-define": "off",
    // disable indentation due to a bug related to decorators & template literals
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "simple-import-sort/sort": "error",
    "sort-imports": "off",
    "import/order": "off",
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error"
  },
  settings: {
    react: {
      "version": "detect"
    }
  }
}
