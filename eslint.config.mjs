// ESLint 9 flat config. Replaces the old .eslintrc.json — ESLint 9 no longer
// reads eslintrc by default, and Next 16 removed `next lint`, so linting now
// runs through the `eslint` binary directly (see the "lint" npm script).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // Copy in this codebase is full of apostrophes and quotes in ordinary
      // prose; escaping them all hurts readability more than it helps.
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]

export default config
