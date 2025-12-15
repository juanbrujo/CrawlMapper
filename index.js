import axios from 'axios';
import xml2js from 'xml2js';

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
 * Scrapes all URLs from sitemap and searches for query term in page content
 * @param {string} sitemapUrl - The URL of the sitemap.xml
 * @param {string} query - The search term to look for in page content
 * @returns {Promise<Array<{url: string, found: boolean}>>} - Array of results with URL and found status
 */
async function crawlSitemapAndSearch(sitemapUrl, query) {
  try {
    const urls = await fetchSitemap(sitemapUrl);
    const results = [];
    let processed = 0;
    let found = 0;
    
    console.log(`\nSearching for "${query}" in ${urls.length} pages...`);
    process.stdout.write('Progress: ');
    
    for (const url of urls) {
      try {
        // Scrape the HTML content
        const htmlContent = await scrapeUrl(url);
        
        // Search for the query term in the content
        const containsQuery = searchInContent(htmlContent, query);
        
        results.push({
          url: url,
          found: containsQuery
        });
        
        if (containsQuery) {
          found++;
          console.log(`\n✓ Found "${query}" in: ${url}`);
        }
        
        processed++;
        
        // Progress indicator
        if (processed % 10 === 0) {
          console.log(`${processed}/${urls.length}`);
        }
        
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.warn(`Error processing ${url}: ${error.message}`);
        results.push({
          url: url,
          found: false
        });
      }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Total pages processed: ${processed}`);
    console.log(`Pages containing "${query}": ${found}`);
    console.log(`Pages without "${query}": ${processed - found}`);
    
    return results;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Gets only the URLs that contain the search term
 * @param {Array<{url: string, found: boolean}>} results - The search results
 * @returns {string[]} - Array of URLs that contain the search term
 */
function getMatchingUrls(results) {
  return results.filter(result => result.found).map(result => result.url);
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

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  let sitemapUrl = 'https://www.surirefugios.com/'; // Default URL
  let query = 'fillout'; // Default query
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
      sitemapUrl = normalizeSitemapUrl(args[i + 1]);
      i++; // Skip next argument as it's the URL value
    } else if (args[i] === '--query' && i + 1 < args.length) {
      query = args[i + 1];
      i++; // Skip next argument as it's the query value
    }
  }
  
  return { sitemapUrl, query };
}

// Example usage
async function main() {
  const { sitemapUrl, query } = parseArguments();
  
  try {
    console.log('=== CrawlMapper ===');
    console.log(`Target: ${sitemapUrl}`);
    console.log(`Search term: "${query}"`);
    console.log('===================\n');
    
    const results = await crawlSitemapAndSearch(sitemapUrl, query);
    const matchingUrls = getMatchingUrls(results);
    
    console.log('\n=== URLs containing the search term ===');
    if (matchingUrls.length > 0) {
      matchingUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    } else {
      console.log('No URLs found containing the search term.');
    }
    
  } catch (error) {
    console.error('Failed to crawl sitemap:', error.message);
    if (error.message.includes('not found')) {
      console.log('\nThe sitemap.xml file could not be found at the provided URL.');
      console.log('Please check that the website exists and has a sitemap.xml file.');
    }
  }
}

// Run main function
main();

// Export functions for use as a module
export {
  crawlSitemapAndSearch,
  fetchSitemap,
  scrapeUrl,
  searchInContent,
  getMatchingUrls,
  normalizeSitemapUrl
};
