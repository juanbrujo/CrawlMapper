const axios = require('axios');
const xml2js = require('xml2js');

// Timeout configurations
const SITEMAP_TIMEOUT = 15000; // 15 seconds for sitemap fetch
const URL_TIMEOUT = 8000; // 8 seconds for individual URL scraping
const MAX_URLS_TO_PROCESS = 30; // Reduced to prevent timeouts
const BATCH_DELAY = 200; // Reduced delay between batches
const FUNCTION_TIMEOUT = 25000; // 25 seconds (5 second buffer before 30s limit)
const MIN_BATCHES = 3; // Process at least 3 batches before early termination
const MAX_BATCHES = 6; // Maximum batches to process

async function fetchSitemap(sitemapUrl) {
  try {
    const response = await axios.get(sitemapUrl, {
      timeout: SITEMAP_TIMEOUT,
      headers: {
        'User-Agent': 'CrawlMapper/2.3.0 (Sitemap Analyzer)',
        Accept: 'application/xml, text/xml, */*',
      },
    });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const urls = [];
    if (result.urlset && result.urlset.url) {
      for (const url of result.urlset.url) {
        if (url.loc && url.loc[0]) {
          urls.push(url.loc[0]);
        }
      }
    }

    return urls;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error(
          'Sitemap not found: The sitemap.xml file does not exist at the provided URL'
        );
      } else if (status === 406 || status === 403 || status >= 400) {
        throw new Error(
          `Sitemap not found: Server returned ${status} status code`
        );
      }
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error(
        'Sitemap request timeout: The sitemap is taking too long to load'
      );
    }
    throw new Error(`Error fetching sitemap: ${error.message}`);
  }
}

async function scrapeUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: URL_TIMEOUT,
      headers: {
        'User-Agent': 'CrawlMapper/2.3.0 (Content Search Tool)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxContentLength: 5 * 1024 * 1024, // 5MB max content size
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

// Timeout wrapper to prevent function timeout
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

    const urls = await fetchSitemap(sitemapUrl);

    // Limit URLs to process to prevent timeouts
    const urlsToProcess = urls.slice(0, MAX_URLS_TO_PROCESS);

    if (urls.length > MAX_URLS_TO_PROCESS) {
      console.log(
        `Limiting search to ${MAX_URLS_TO_PROCESS} URLs out of ${urls.length} total`
      );
    }

    const results = [];
    let processed = 0;
    let found = 0;
    let batchesProcessed = 0;

    const batchSize = 5;
    for (let i = 0; i < urlsToProcess.length; i += batchSize) {
      // Check remaining time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = FUNCTION_TIMEOUT - elapsedTime;

      if (remainingTime <= 5000) {
        // 5 second buffer
        console.log(
          `Timeout approaching (${remainingTime}ms remaining), stopping early`
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

      // Early termination conditions
      const hasFoundResults = found > 0;
      const reachedMinBatches = batchesProcessed >= MIN_BATCHES;
      const reachedMaxBatches = batchesProcessed >= MAX_BATCHES;

      if (hasFoundResults && reachedMinBatches) {
        console.log(
          `Found ${found} results after ${batchesProcessed} batches, stopping early`
        );
        break;
      }

      if (reachedMaxBatches) {
        console.log(`Reached maximum batches (${MAX_BATCHES}), stopping`);
        break;
      }

      // Reduced delay between batches
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

    // Check if it's a timeout error
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
