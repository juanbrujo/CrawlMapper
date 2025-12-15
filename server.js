import express from 'express';
import cors from 'cors';
import { crawlSitemapAndSearch, normalizeSitemapUrl } from './index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.post('/api/search', async (req, res) => {
  try {
    const { url, query } = req.body;

    if (!url || !query) {
      return res.status(400).json({
        error: 'Both url and query parameters are required',
      });
    }

    const sitemapUrl = normalizeSitemapUrl(url);

    const results = await crawlSitemapAndSearch(sitemapUrl, query);
    const matchingUrls = results
      .filter((result) => result.found)
      .map((result) => result.url);

    res.json({
      success: true,
      data: {
        sitemapUrl,
        query,
        totalPages: results.length,
        foundPages: matchingUrls.length,
        matchingUrls,
        allResults: results,
      },
    });
  } catch (error) {
    console.error('[API] Error:', error.message);
    res.status(500).json({
      error: error.message,
      success: false,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrawlMapper API is running' });
});

app.listen(PORT, () => {});
