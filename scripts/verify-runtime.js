#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function check(label, condition, detail = '') {
  const ok = Boolean(condition);
  const prefix = ok ? 'PASS' : 'FAIL';
  console.log(`${prefix} ${label}${detail ? ' - ' + detail : ''}`);
  return ok;
}

const root = '/home/jimwong/projects/toolBoxClient';
const assets = path.join(root, 'assets');
const linuxNode = path.join(assets, 'node_for_linux', 'node-v20.18.1-linux-x64', 'bin', 'node');
const fpChromium = path.join(assets, 'fingerprint-chromium', 'ungoogled-chromium-144.0.7559.132-1-x86_64_linux', 'chrome');
const sqliteNode = path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const toolPptrCore = path.join(root, 'toolService', 'node_modules', 'puppeteer-core');
const toolPptrExtra = path.join(root, 'toolService', 'node_modules', 'puppeteer-extra');
const toolStealth = path.join(root, 'toolService', 'node_modules', 'puppeteer-extra-plugin-stealth');

let failed = 0;
if (!check('Bundled Linux Node exists', fs.existsSync(linuxNode), linuxNode)) failed++;
if (!check('Fingerprint Chromium exists', fs.existsSync(fpChromium), fpChromium)) failed++;
if (!check('better-sqlite3 native module exists', fs.existsSync(sqliteNode), sqliteNode)) failed++;
if (!check('toolService puppeteer-core installed', fs.existsSync(toolPptrCore), toolPptrCore)) failed++;
if (!check('toolService puppeteer-extra installed', fs.existsSync(toolPptrExtra), toolPptrExtra)) failed++;
if (!check('toolService stealth plugin installed', fs.existsSync(toolStealth), toolStealth)) failed++;

try {
  const config = require(path.join(root, 'config.js')).getInstance();
  const execPath = config.getDefaultExecPath();
  const fpPath = config.getFingerprintChromiumPath();
  if (!check('config.getDefaultExecPath resolves', !!execPath, String(execPath))) failed++;
  if (!check('config.getDefaultExecPath uses bundled Node on Linux', execPath === linuxNode, String(execPath))) failed++;
  if (!check('config.getFingerprintChromiumPath resolves', !!fpPath && fpPath.success && !!fpPath.path, JSON.stringify(fpPath))) failed++;
} catch (err) {
  failed++;
  console.log(`FAIL config runtime checks - ${err.message}`);
}

process.exitCode = failed ? 1 : 0;
