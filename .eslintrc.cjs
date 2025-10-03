module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: '@/lib/supabase/client', message: 'Use server getDB() or API routes; no client Supabase in pages/components.' },
      ],
      patterns: ['**/lib/supabase/client*'],
    }],
  },
};

