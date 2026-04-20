#!/usr/bin/env node

/**
 * DevUtility: Generate Node History
 * 
 * Fetches all SchemaInformation snapshots from SQL Server,
 * walks each node version, deduplicates by state JSON comparison,
 * and outputs organized history files: output/nodeHistories/{userSchemaId}/nodeId.json
 * 
 * Usage:
 *   node generateNodeHistory.js "<connection-string>"
 *   node generateNodeHistory.js  # reads from process.env.GRAPHKNOWLEDGE_DB
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_BASE = path.join(__dirname, 'output', 'nodeHistories');
const CACHE_BASE = path.join(__dirname, 'output', 'rawCache');
const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'GraphKnowledge',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
    },
  },
  options: {
    trustServerCertificate: true,
    encrypt: true,
    connectTimeout: 15000,
  },
};

// Parse connection string if provided as argument
if (process.argv[2]) {
  const connStr = process.argv[2];
  parseConnectionString(connStr);
}

function parseConnectionString(connStr) {
  // Minimal parser for "Server=...;Database=...;User Id=...;Password=..."
  const parts = connStr.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  config.server = parts['Server'] || parts['server'] || config.server;
  config.database = parts['Database'] || parts['database'] || config.database;
  if (parts['User Id'] || parts['user id']) {
    config.authentication.options.userName = parts['User Id'] || parts['user id'];
  }
  if (parts['Password'] || parts['password']) {
    config.authentication.options.password = parts['Password'] || parts['password'];
  }
}

/**
 * Ensure output directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get or create history file for a node
 */
function getNodeHistoryFile(userSchemaId, nodeId) {
  const schemaDir = path.join(OUTPUT_BASE, String(userSchemaId));
  ensureDir(schemaDir);
  return path.join(schemaDir, `${nodeId}.json`);
}

/**
 * Write history to file
 */
function writeNodeHistory(filePath, history) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf8');
}

/**
 * Check if two states are identical
 */
function statesAreEqual(state1, state2) {
  return JSON.stringify(state1) === JSON.stringify(state2);
}

/**
 * Checkpoint helpers — a .done file marks a schema as fully processed
 */
function isDone(userSchemaId) {
  const marker = path.join(OUTPUT_BASE, String(userSchemaId), '.done');
  return fs.existsSync(marker);
}

function markDone(userSchemaId) {
  const schemaDir = path.join(OUTPUT_BASE, String(userSchemaId));
  ensureDir(schemaDir);
  fs.writeFileSync(path.join(schemaDir, '.done'), new Date().toISOString(), 'utf8');
}

/**
 * Raw cache helpers — saves fetched DB rows to disk before processing
 */
function getCacheFile(userSchemaId) {
  ensureDir(CACHE_BASE);
  return path.join(CACHE_BASE, `${userSchemaId}.json`);
}

function isCached(userSchemaId) {
  return fs.existsSync(getCacheFile(userSchemaId));
}

function readCache(userSchemaId) {
  const content = fs.readFileSync(getCacheFile(userSchemaId), 'utf8');
  return JSON.parse(content);
}

function writeCache(userSchemaId, rows) {
  fs.writeFileSync(getCacheFile(userSchemaId), JSON.stringify(rows), 'utf8');
}

/**
 * Main processing loop
 */
async function processSchemaVersions() {
  let connection;

  try {
    // Connect to database
    console.log(`[INFO] Connecting to ${config.server}/${config.database}...`);
    connection = new sql.ConnectionPool(config);
    await connection.connect();
    console.log('[OK] Database connected.');

    // Step 1: Fetch only the distinct UserSchemaIds — lightweight query
    console.log('[INFO] Fetching distinct UserSchemaIds...');
    const schemaIdResult = await connection
      .request()
      .query(`SELECT DISTINCT UserSchemaId FROM SchemaInformation ORDER BY UserSchemaId`);

    const allSchemaIds = schemaIdResult.recordset.map((r) => r.UserSchemaId);
    console.log(`[OK] Found ${allSchemaIds.length} unique schemas.`);

    if (allSchemaIds.length === 0) {
      console.log('[INFO] No data to process. Exiting.');
      return;
    }

    // Identify already-completed schemas
    const toProcess = allSchemaIds.filter((id) => !isDone(id));
    const skipped = allSchemaIds.length - toProcess.length;
    if (skipped > 0) {
      console.log(`[RESUME] Skipping ${skipped} already-completed schema(s). Processing ${toProcess.length} remaining.`);
    }

    if (toProcess.length === 0) {
      console.log('[DONE] All schemas already processed. Delete .done files to re-run.');
      return;
    }

    let totalVersionsScanned = 0;
    let totalNodesProcessed = 0;
    let totalEntriesAdded = 0;
    let totalDuplicatesSkipped = 0;

    // Step 2: Process each schema independently
    for (let sIdx = 0; sIdx < toProcess.length; sIdx++) {
      const userSchemaId = toProcess[sIdx];
      console.log(`\n[SCHEMA ${userSchemaId}] (${sIdx + 1}/${toProcess.length})`);

      let versions;

      // --- PHASE 1: Fetch from DB (or resume from local cache) ---
      if (isCached(userSchemaId)) {
        console.log(`  [CACHE] Loading from local cache (skipping DB fetch)...`);
        versions = readCache(userSchemaId);
        console.log(`  [CACHE] Loaded ${versions.length} versions from cache.`);
      } else {
        console.log(`  [DB] Fetching from database...`);
        const versionResult = await connection
          .request()
          .input('schemaId', sql.Int, userSchemaId)
          .query(`
            SELECT 
              Id,
              UserSchemaId,
              SchemaInfo,
              CreationDate,
              ModifiedBy,
              Status
            FROM SchemaInformation
            WHERE UserSchemaId = @schemaId
            ORDER BY CreationDate ASC
          `);

        versions = versionResult.recordset;
        console.log(`  [DB] Fetched ${versions.length} versions. Saving to local cache...`);

        // Save raw rows to disk immediately — before any processing
        writeCache(userSchemaId, versions);
        console.log(`  [CACHE] Saved to ${getCacheFile(userSchemaId)}`);
      }

      totalVersionsScanned += versions.length;

      // --- PHASE 2: Process from (now-local) cache ---
      console.log(`  [PROCESS] Building node histories...`);

      // Track node histories in memory for this schema
      const nodeHistories = {}; // { nodeId: [...entries] }

      // Walk versions chronologically
      for (let vIdx = 0; vIdx < versions.length; vIdx++) {
        const version = versions[vIdx];
        let schemaObj;

        try {
          schemaObj = JSON.parse(version.SchemaInfo);
        } catch (err) {
          console.error(
            `  [ERROR] Version ID ${version.Id} has invalid JSON: ${err.message}`
          );
          continue;
        }

        const nodes = schemaObj.nodes || [];

        // Process each node in this version
        for (const node of nodes) {
          const nodeId = node.id;
          if (!nodeId) continue;

          if (!nodeHistories[nodeId]) {
            nodeHistories[nodeId] = [];
          }

          const currentHistory = nodeHistories[nodeId];
          const lastEntry = currentHistory[currentHistory.length - 1];

          // Deduplicate: compare current node state with last entry's state
          const isDuplicate = lastEntry && statesAreEqual(node, lastEntry.state);

          if (!isDuplicate) {
            currentHistory.push({
              schemaInformationId: version.Id,
              state: node,
              modifiedBy: version.ModifiedBy,
              creationDate: version.CreationDate,
            });
            totalEntriesAdded++;
          } else {
            totalDuplicatesSkipped++;
          }

          totalNodesProcessed++;
        }
      }

      // Write all node history files for this schema
      for (const [nodeId, history] of Object.entries(nodeHistories)) {
        const filePath = getNodeHistoryFile(userSchemaId, nodeId);
        writeNodeHistory(filePath, history);
      }

      // Mark schema as fully done — safe to skip on next run
      markDone(userSchemaId);

      console.log(
        `  [OK] Schema ${userSchemaId}: wrote ${Object.keys(nodeHistories).length} node files, marked done.`
      );
    }

    console.log(`\n[SUMMARY]`);
    console.log(`  Total schemas processed: ${toProcess.length} (${skipped} skipped/resumed)`);
    console.log(`  Total versions scanned: ${totalVersionsScanned}`);
    console.log(`  Total node-version pairs processed: ${totalNodesProcessed}`);
    console.log(`  Total history entries added: ${totalEntriesAdded}`);
    console.log(`  Total duplicates skipped: ${totalDuplicatesSkipped}`);
    console.log(`  Output directory: ${OUTPUT_BASE}`);
    console.log(`[DONE] Node history generation complete.`);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Run
processSchemaVersions().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
