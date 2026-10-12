// Run focused regressions without the unrelated, missing jest-dom setup dependency.
const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
process.env.NODE_ENV = 'test';
process.env.BABEL_ENV = 'test';
const createConfig = require('react-scripts/scripts/utils/createJestConfig');
const config = createConfig(relative => path.resolve(root, 'node_modules/react-scripts', relative), root, false);
config.setupFilesAfterEnv = [];
config.moduleNameMapper['^lucide-react$'] = require.resolve('lucide-react');
config.testMatch = [process.argv[2] || '**/submissionFlow.test.js'];
require('jest').runCLI({ config: JSON.stringify(config), runInBand: true, watch: false }, [root])
  .then(({ results }) => { process.exitCode = results.success ? 0 : 1; });
