#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const res = spawnSync('rg', ['-nF', ".in('id',", 'src/lib/data/public'], {
  stdio: 'inherit',
});

if (res.status === 0) {
  console.error('❌ Batched id selects found in public helpers');
  process.exit(1);
}

console.log('✅ no public batched id selects');
