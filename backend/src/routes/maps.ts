import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import Database from 'better-sqlite3';

const router = express.Router();

const mapsDir = path.join(process.cwd(), 'maps');
if (!fs.existsSync(mapsDir)) {
  fs.mkdirSync(mapsDir, { recursive: true });
}

const dbPath = path.join(mapsDir, 'tiles.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS tiles (
    z INTEGER,
    x INTEGER,
    y INTEGER,
    data BLOB,
    created_at INTEGER,
    PRIMARY KEY (z, x, y)
  )
`);

const getTileStmt = db.prepare('SELECT data FROM tiles WHERE z = ? AND x = ? AND y = ?');
const insertTileStmt = db.prepare('INSERT OR REPLACE INTO tiles (z, x, y, data, created_at) VALUES (?, ?, ?, ?, ?)');
const deleteTileStmt = db.prepare('DELETE FROM tiles WHERE z = ? AND x = ? AND y = ?');

router.get('/tiles/:z/:x/:y.png', async (req, res) => {
  const z = parseInt(req.params.z);
  const x = parseInt(req.params.x);
  const y = parseInt(req.params.y);

  try {
    const row = getTileStmt.get(z, x, y) as { data: Buffer } | undefined;
    if (row?.data && row.data.length > 0) {
      if (row.data.length > 100) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(row.data);
      }
      deleteTileStmt.run(z, x, y);
    }

    const osmUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

    const response = await axios.get(osmUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'ET3AM-App/1.0 (contact@et3am.com)'
      },
      timeout: 10000
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Empty response from OSM');
    }

    const tileData = Buffer.from(response.data);

    if (tileData.length < 100) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(tileData);
    }

    try {
      insertTileStmt.run(z, x, y, tileData, Date.now());
    } catch (saveError) {
      console.warn(`Failed to cache tile ${z}/${x}/${y}:`, saveError);
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(tileData);

  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).send('Tile not found');
    }
    console.error(`Tile fetch error [${z}/${x}/${y}]:`, error);
    res.status(500).send('Error fetching tile');
  }
});

export default router;