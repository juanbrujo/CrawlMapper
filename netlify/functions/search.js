const axios = require('axios');
const xml2js = require('xml2js');

async function fetchSitemap(sitemapUrl) {
  try {
    const response = await axios.get(sitemapUrl);
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
    throw new Error(`Error fetching sitemap: ${error.message}`);
  }
}

async function scrapeUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    return response.data;
  } catch (error) {
    console.warn(`Warning: Could not scrape ${url}: ${error.message}`);
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
    const results = [];
    let processed = 0;
    let found = 0;

    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

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

      if (i + batchSize < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const matchingUrls = results
      .filter((result) => result.found)
      .map((result) => result.url);

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
        },
      }),
    };
  } catch (error) {
    console.error('[Netlify Function] Error:', error.message);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        success: false,
      }),
    };
  }
};
