// Commit messages: "<type>: <subject>", e.g. "product: Wesualizer 추가". The types are listed in the README;
// same rules as the blog, with the studio's own types.
export default {
  rules: {
    'type-enum': [2, 'always', ['product', 'site']],
    'type-empty': [2, 'never'],
    'type-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },
}
