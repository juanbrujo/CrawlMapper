import axios from 'axios';
import xml2js from 'xml2js';

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

async function crawlSitemapAndSearch(sitemapUrl, query) {
  try {
    const urls = await fetchSitemap(sitemapUrl);
    const results = [];
    let processed = 0;
    let found = 0;

    process.stdout.write('Progress: ');

    for (const url of urls) {
      try {
        const htmlContent = await scrapeUrl(url);

        const containsQuery = searchInContent(htmlContent, query);

        results.push({
          url: url,
          found: containsQuery,
        });

        if (containsQuery) {
          found++;
        }

        processed++;

        if (processed % 10 === 0) {
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Error processing ${url}: ${error.message}`);
        results.push({
          url: url,
          found: false,
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

function getMatchingUrls(results) {
  return results.filter((result) => result.found).map((result) => result.url);
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

function parseArguments() {
  const args = process.argv.slice(2);
  let sitemapUrl = null;
  let query = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
      sitemapUrl = normalizeSitemapUrl(args[i + 1]);
      i++;
    } else if (args[i] === '--query' && i + 1 < args.length) {
      query = args[i + 1];
      i++;
    }
  }

  if (!sitemapUrl || !query) {
    console.error('Error: Both --url and --query parameters are required.\n');
    process.exit(1);
  }

  return { sitemapUrl, query };
}

async function main() {
  const { sitemapUrl, query } = parseArguments();

  try {
    const results = await crawlSitemapAndSearch(sitemapUrl, query);
    const matchingUrls = getMatchingUrls(results);

    if (matchingUrls.length > 0) {
      matchingUrls.forEach((url, index) => {});
    } else {
    }
  } catch (error) {
    console.error('Failed to crawl sitemap:', error.message);
    if (error.message.includes('not found')) {
    }
  }
}

export {
  crawlSitemapAndSearch,
  fetchSitemap,
  scrapeUrl,
  searchInContent,
  getMatchingUrls,
  normalizeSitemapUrl,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
