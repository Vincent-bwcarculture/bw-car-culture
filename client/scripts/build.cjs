// Forces CI=false and disables ESLint plugin before react-scripts starts,
// so CSS/lint warnings never abort the production build on Vercel.
process.env.CI = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';

const { spawnSync } = require('child_process');
const reactScripts = require.resolve('react-scripts/bin/react-scripts.js');
const result = spawnSync(process.execPath, [reactScripts, 'build'], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
