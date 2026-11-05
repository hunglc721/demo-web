#!/usr/bin/env node
/**
 * E2E Test Runner Engine
 * Opaque-box test discovery, execution harness, and reporter.
 * Invocation: node tests/e2e/runner.mjs [--tier=<1|2|3|4|all>] [--filter=<query>] [--bail] [--verbose] [--json]
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Auto-bootstrap Node with --experimental-strip-types to natively import TS files
if (!process.execArgv.includes('--experimental-strip-types') && !process.env.RUNNER_BOOTSTRAPPED) {
  const child = spawnSync(process.execPath, ['--experimental-strip-types', ...process.execArgv, ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNER_BOOTSTRAPPED: '1' }
  });
  process.exit(child.status ?? 0);
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m'
};

// Test Registry
class TestSuiteRegistry {
  constructor() {
    this.currentSuite = null;
    this.suites = [];
  }

  describe(name, fn) {
    const parentSuite = this.currentSuite;
    const suite = {
      name: parentSuite ? `${parentSuite.name} > ${name}` : name,
      tests: [],
      beforeAllHooks: [],
      afterAllHooks: [],
      beforeEachHooks: parentSuite ? [...parentSuite.beforeEachHooks] : [],
      afterEachHooks: parentSuite ? [...parentSuite.afterEachHooks] : []
    };

    this.suites.push(suite);
    this.currentSuite = suite;

    try {
      fn();
    } finally {
      this.currentSuite = parentSuite;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.currentSuite.tests.push({ name, fn });
      });
    } else {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllHooks.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllHooks.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachHooks.push(fn);
  }

  clear() {
    this.currentSuite = null;
    this.suites = [];
  }
}

export const registry = new TestSuiteRegistry();
export const describe = registry.describe.bind(registry);
export const test = registry.test.bind(registry);
export const it = test;
export const beforeAll = registry.beforeAll.bind(registry);
export const afterAll = registry.afterAll.bind(registry);
export const beforeEach = registry.beforeEach.bind(registry);
export const afterEach = registry.afterEach.bind(registry);

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tier: 'all',
    filter: '',
    bail: false,
    verbose: false,
    json: false
  };

  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--bail') {
      options.bail = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--json') {
      options.json = true;
    }
  }
  return options;
}

// Discover test files
function discoverTestFiles(tierFilter) {
  const tierDirs = {
    '1': ['tier1_features'],
    '2': ['tier2_boundaries'],
    '3': ['tier3_combinations'],
    '4': ['tier4_realworld'],
    'all': ['tier1_features', 'tier2_boundaries', 'tier3_combinations', 'tier4_realworld']
  };

  const targetDirs = tierDirs[tierFilter] || tierDirs['all'];
  const testFiles = [];

  for (const dirName of targetDirs) {
    const fullDirPath = path.join(__dirname, dirName);
    if (!fs.existsSync(fullDirPath)) continue;

    const entries = fs.readdirSync(fullDirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.test.mjs') || entry.name.endsWith('.test.js'))) {
        testFiles.push({
          tier: dirName,
          filename: entry.name,
          fullPath: path.join(fullDirPath, entry.name)
        });
      }
    }
  }

  return testFiles;
}

// Execute tests
async function run() {
  const options = parseArgs();
  const startTime = Date.now();

  if (!options.json) {
    console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  E2E TEST RUNNER - D2C E-COMMERCE STARTER BASE       ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}`);
    console.log(`${colors.gray}Active Tier: ${colors.bold}${options.tier}${colors.reset} | ${colors.gray}Filter: "${options.filter || '*'}" | Bail: ${options.bail}`);
    console.log('');
  }

  const allDiscovered = discoverTestFiles(options.tier);
  const matchedFiles = allDiscovered.filter(f => {
    if (!options.filter) return true;
    return f.filename.toLowerCase().includes(options.filter.toLowerCase()) ||
           f.tier.toLowerCase().includes(options.filter.toLowerCase());
  });

  if (matchedFiles.length === 0) {
    if (!options.json) {
      console.log(`${colors.yellow}No test files found matching criteria.${colors.reset}`);
    }
    process.exit(0);
  }

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];
  const testResults = [];

  for (const fileInfo of matchedFiles) {
    registry.clear();

    const fileStartTime = Date.now();
    let loadError = null;

    try {
      const fileUrl = pathToFileURL(fileInfo.fullPath).href;
      await import(`${fileUrl}?t=${Date.now()}`);
    } catch (err) {
      loadError = err;
    }

    if (loadError) {
      failedTests++;
      totalTests++;
      const failEntry = {
        suite: fileInfo.filename,
        test: '[Module Load / Syntax Error]',
        error: loadError.stack || loadError.message,
        duration: Date.now() - fileStartTime
      };
      failureDetails.push(failEntry);
      testResults.push({ ...failEntry, passed: false });

      if (!options.json) {
        console.log(`${colors.red}✖ FAIL (LOAD): ${fileInfo.filename}${colors.reset}`);
        console.log(`  ${colors.red}${loadError.message}${colors.reset}`);
      }

      if (options.bail) break;
      continue;
    }

    const suites = [...registry.suites];
    if (suites.length === 0) continue;

    if (!options.json) {
      console.log(`${colors.bold}• Suite: ${path.join(fileInfo.tier, fileInfo.filename)}${colors.reset}`);
    }

    for (const suite of suites) {
      // Execute beforeAll hooks
      for (const hook of suite.beforeAllHooks) {
        try {
          await hook();
        } catch (err) {
          console.error(`Error in beforeAll hook: ${err.message}`);
        }
      }

      for (const t of suite.tests) {
        totalTests++;
        const testStartTime = Date.now();
        let testError = null;

        // Execute beforeEach hooks
        for (const hook of suite.beforeEachHooks) {
          try {
            await hook();
          } catch (err) {
            testError = err;
            break;
          }
        }

        if (!testError) {
          try {
            await t.fn();
          } catch (err) {
            testError = err;
          }
        }

        // Execute afterEach hooks
        for (const hook of suite.afterEachHooks) {
          try {
            await hook();
          } catch (err) {
            if (!testError) testError = err;
          }
        }

        const duration = Date.now() - testStartTime;

        if (testError) {
          failedTests++;
          const failEntry = {
            suite: suite.name,
            test: t.name,
            error: testError.stack || testError.message,
            duration
          };
          failureDetails.push(failEntry);
          testResults.push({ ...failEntry, passed: false });

          if (!options.json) {
            console.log(`  ${colors.red}✖ ${t.name}${colors.gray} (${duration}ms)${colors.reset}`);
            console.log(`    ${colors.red}${testError.message}${colors.reset}`);
          }

          if (options.bail) break;
        } else {
          passedTests++;
          testResults.push({
            suite: suite.name,
            test: t.name,
            passed: true,
            duration
          });

          if (!options.json) {
            if (options.verbose) {
              console.log(`  ${colors.green}✔ ${t.name}${colors.gray} (${duration}ms)${colors.reset}`);
            } else {
              console.log(`  ${colors.green}✔ ${t.name}${colors.reset}`);
            }
          }
        }
      }

      // Execute afterAll hooks
      for (const hook of suite.afterAllHooks) {
        try {
          await hook();
        } catch (err) {
          console.error(`Error in afterAll hook: ${err.message}`);
        }
      }

      if (options.bail && failedTests > 0) break;
    }

    if (options.bail && failedTests > 0) break;
    if (!options.json) console.log('');
  }

  const totalDuration = Date.now() - startTime;

  if (options.json) {
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        durationMs: totalDuration,
        exitCode: failedTests === 0 ? 0 : 1
      },
      results: testResults,
      failures: failureDetails
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.exitCode);
  }

  console.log(`${colors.bold}${colors.cyan}------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}TEST EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}------------------------------------------------------${colors.reset}`);
  console.log(`Total Suites:     ${matchedFiles.length}`);
  console.log(`Total Tests:      ${totalTests}`);
  console.log(`Passed:           ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Failed:           ${failedTests > 0 ? colors.red : colors.gray}${failedTests}${colors.reset}`);
  console.log(`Duration:         ${(totalDuration / 1000).toFixed(2)}s`);

  if (failedTests > 0) {
    console.log('');
    console.log(`${colors.bgRed}${colors.bold} FAILED TESTS (${failedTests}) ${colors.reset}`);
    for (const f of failureDetails) {
      console.log(`\n${colors.red}• [${f.suite}] ${f.test}${colors.reset}`);
      console.log(`${colors.gray}${f.error}${colors.reset}`);
    }
    console.log(`\n${colors.bold}${colors.red}Test Run FAILED.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.bgGreen}${colors.bold} ALL TESTS PASSED (100% OK) ${colors.reset}\n`);
    process.exit(0);
  }
}

// Automatically invoke runner when run directly via CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  run().catch(err => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
  });
}
