const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Fetches and parses a sitemap.xml from a given URL
 * @param {string} sitemapUrl - The URL of the sitemap.xml
 * @returns {Promise<string[]>} - Array of URLs found in the sitemap
 */
async function fetchSitemap(sitemapUrl) {
  try {
    console.log(`Fetching sitemap from: ${sitemapUrl}`);
    const response = await axios.get(sitemapUrl);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    // Extract URLs from sitemap
    const urls = [];
    if (result.urlset && result.urlset.url) {
      for (const url of result.urlset.url) {
        if (url.loc && url.loc[0]) {
          urls.push(url.loc[0]);
        }
      }
    }
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error('Sitemap not found: The sitemap.xml file does not exist at the provided URL');
      } else if (status === 406 || status === 403 || status >= 400) {
        throw new Error(`Sitemap not found: Server returned ${status} status code`);
      }
    }
    throw new Error(`Error fetching sitemap: ${error.message}`);
  }
}

/**
 * Scrapes HTML content from a given URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - The HTML content of the page
 */
async function scrapeUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.warn(`Warning: Could not scrape ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Searches for a query term in HTML content
 * @param {string} htmlContent - The HTML content to search
 * @param {string} query - The search term to look for
 * @returns {boolean} - True if the query term is found, false otherwise
 */
function searchInContent(htmlContent, query) {
  if (!htmlContent) return false;
  
  // Convert to lowercase for case-insensitive search
  const content = htmlContent.toLowerCase();
  const searchTerm = query.toLowerCase();
  
  return content.includes(searchTerm);
}

/**
 * Normalizes a URL to a proper sitemap URL format
 * @param {string} inputUrl - The input URL in various formats
 * @returns {string} - The complete sitemap URL
 */
function normalizeSitemapUrl(inputUrl) {
  // Remove protocol and www if present
  let cleanUrl = inputUrl.trim();
  
  // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  
  // Remove protocol if present
  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
  
  // Remove www if present
  cleanUrl = cleanUrl.replace(/^www\./, '');
  
  // Add https protocol and www if not present
  if (!cleanUrl.startsWith('www.')) {
    cleanUrl = 'www.' + cleanUrl;
  }
  
  // Add https protocol
  cleanUrl = 'https://' + cleanUrl;
  
  // Append /sitemap.xml
  cleanUrl += '/sitemap.xml';
  
  return cleanUrl;
}

/**
 * Netlify Function handler for sitemap search
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Method not allowed',
        success: false
      })
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { url, query } = requestBody;

    if (!url || !query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Both url and query parameters are required',
          success: false
        })
      };
    }

    // Normalize the sitemap URL
    const sitemapUrl = normalizeSitemapUrl(url);
    
    console.log(`[Netlify Function] Searching for "${query}" in ${sitemapUrl}`);
    
    // Fetch sitemap URLs
    const urls = await fetchSitemap(sitemapUrl);
    const results = [];
    let processed = 0;
    let found = 0;
    
    console.log(`[Netlify Function] Processing ${urls.length} URLs...`);
    
    // Process URLs in batches to avoid timeout
    const batchSize = 5; // Process 5 URLs at a time
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          // Scrape the HTML content
          const htmlContent = await scrapeUrl(url);
          
          // Search for the query term in the content
          const containsQuery = searchInContent(htmlContent, query);
          
          return {
            url: url,
            found: containsQuery
          };
        } catch (error) {
          console.warn(`Error processing ${url}: ${error.message}`);
          return {
            url: url,
            found: false
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      processed += batch.length;
      found += batchResults.filter(r => r.found).length;
      
      console.log(`[Netlify Function] Processed ${processed}/${urls.length} URLs, found ${found} matches`);
      
      // Add delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const matchingUrls = results.filter(result => result.found).map(result => result.url);
    
    console.log(`[Netlify Function] Search completed: ${found} matches found`);
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          sitemapUrl,
          query,
          totalPages: results.length,
          foundPages: matchingUrls.length,
          matchingUrls,
          allResults: results
        }
      })
    };

  } catch (error) {
    console.error('[Netlify Function] Error:', error.message);
    
    // Return error response
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        success: false
      })
    };
  }
};