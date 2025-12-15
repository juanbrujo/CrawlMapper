const axios = require('axios');
const xml2js = require('xml2js');

const SITEMAP_TIMEOUT = 15000;
const URL_TIMEOUT = 8000;
const MAX_URLS_TO_PROCESS = 1000;
const BATCH_DELAY = 100;
const FUNCTION_TIMEOUT = 25000;
const MIN_BATCHES = 0;
const MAX_BATCHES = 1000;

async function fetchSitemap(sitemapUrl) {
  try {
    const response = await axios.get(sitemapUrl, {
      timeout: SITEMAP_TIMEOUT,
      headers: {
        'User-Agent': 'CrawlMapper/2.3.1 (Sitemap Analyzer)',
        Accept: 'application/xml, text/xml, */*;q=0.8',
      },
      maxContentLength: 5 * 1024 * 1024,
      maxBodyLength: 5 * 1024 * 1024,
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn(`Timeout: Could not scrape ${url} within ${URL_TIMEOUT}ms`);
    } else if (error.response?.status === 404) {
      console.warn(`Not found: ${url} returned 404`);
    } else {
      console.warn(`Error: Could not scrape ${url}: ${error.message}`);
    }
    return null;
  }
}

async function scrapeUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: URL_TIMEOUT,
      headers: {
        'User-Agent': 'CrawlMapper/2.3.1 (Content Analyzer)',
      },
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024,
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn(`Timeout: Could not scrape ${url} within ${URL_TIMEOUT}ms`);
    } else if (error.response?.status === 404) {
      console.warn(`Not found: ${url} returned 404`);
    } else {
      console.warn(`Error: Could not scrape ${url}: ${error.message}`);
    }
    return null;
  }
}

function searchInContent(htmlContent, query) {
  if (!htmlContent) return false;

  const content = htmlContent.toLowerCase();
  const searchTerm = query.toLowerCase();

  return content.includes(searchTerm);
}

function normalizeSitemapUrl(inputUrl) {
  let cleanUrl = inputUrl.trim();

  cleanUrl = cleanUrl.replace(/\/+$/, '');

  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');

  cleanUrl = cleanUrl.replace(/^www\./, '');

  if (!cleanUrl.startsWith('www.')) {
    cleanUrl = 'www.' + cleanUrl;
  }

  cleanUrl = 'https://' + cleanUrl;

  cleanUrl += '/sitemap.xml';

  return cleanUrl;
}

function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Method not allowed',
        success: false,
      }),
    };
  }

  try {
    const startTime = Date.now();
    const requestBody = JSON.parse(event.body || '{}');
    const { url, query } = requestBody;

    if (!url || !query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Both url and query parameters are required',
          success: false,
        }),
      };
    }

    const sitemapUrl = normalizeSitemapUrl(url);

    const xmlData = await fetchSitemap(sitemapUrl);
    if (!xmlData) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Sitemap not found or could not be parsed',
          success: false,
        }),
      };
    }

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const urls = [];
    if (result.urlset && result.urlset.url) {
      for (const url of result.urlset.url) {
        if (url.loc && url.loc[0]) {
          urls.push(url.loc[0]);
        }
      }
    }

    const urlsToProcess = urls.slice(0, MAX_URLS_TO_PROCESS);

    if (urls.length > MAX_URLS_TO_PROCESS) {
      console.log(
        `Processing ${urlsToProcess.length} of ${urls.length} total URLs (limit: ${MAX_URLS_TO_PROCESS})`
      );
    } else {
      console.log(`Processing all ${urls.length} URLs from sitemap`);
    }

    const results = [];
    let processed = 0;
    let found = 0;
    let batchesProcessed = 0;

    const batchSize = 10;
    for (let i = 0; i < urlsToProcess.length; i += batchSize) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = FUNCTION_TIMEOUT - elapsedTime;

      if (remainingTime <= 3000) {
        console.log(
          `Time limit approaching (${remainingTime}ms remaining), stopping early`
        );
        break;
      }

      const batch = urlsToProcess.slice(i, i + batchSize);

      const batchPromises = batch.map(async (url) => {
        try {
          const htmlContent = await scrapeUrl(url);

          const containsQuery = searchInContent(htmlContent, query);

          return {
            url: url,
            found: containsQuery,
          };
        } catch (error) {
          console.warn(`Error processing ${url}: ${error.message}`);
          return {
            url: url,
            found: false,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      processed += batch.length;
      found += batchResults.filter((r) => r.found).length;
      batchesProcessed++;

      const reachedMaxBatches = batchesProcessed >= MAX_BATCHES;

      if (reachedMaxBatches) {
        console.log(`Reached maximum batches (${MAX_BATCHES}), stopping`);
        break;
      }

      if (i + batchSize < urlsToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    const matchingUrls = results
      .filter((result) => result.found)
      .map((result) => result.url);

    const totalElapsedTime = Date.now() - startTime;
    const timedOut = totalElapsedTime >= FUNCTION_TIMEOUT;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: {
          sitemapUrl,
          query,
          totalPages: results.length,
          foundPages: matchingUrls.length,
          matchingUrls,
          allResults: results,
          processingInfo: {
            totalUrlsFound: urls.length,
            urlsProcessed: processed,
            batchesProcessed: batchesProcessed,
            elapsedTimeMs: totalElapsedTime,
            timedOut: timedOut,
            timeoutLimit: FUNCTION_TIMEOUT,
          },
        },
      }),
    };
  } catch (error) {
    console.error('[Netlify Function] Error:', error.message);

    const isTimeout =
      error.message.includes('timeout') ||
      error.message.includes('Function timeout');
    const statusCode = isTimeout ? 504 : 500;

    return {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: isTimeout
          ? 'Request timed out: The search took too long to complete'
          : error.message,
        success: false,
        timeout: isTimeout,
      }),
    };
  }
};
