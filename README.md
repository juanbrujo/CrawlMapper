# CrawlMapper

```
   _____                    _ __  __                             
  / ____|                  | |  \/  |                            
 | |     _ __ __ ___      _| | \  / | __ _ _ __  _ __   ___ _ __ 
 | |    | '__/ _` \ \ /\ / / | |\/| |/ _` | '_ \| '_ \ / _ \ '__|
 | |____| | | (_| |\ V  V /| | |  | | (_| | |_) | |_) |  __/ |   
  \_____|_|  \__,_| \_/\_/ |_|_|  |_|\__,_| .__/| .__/ \___|_|   
                                          | |   | |              
                                          |_|   |_|              

```

A Node.js application that crawls sitemaps and searches for specific terms in webpage content.

## Features

- **Sitemap Parsing**: Fetches and parses XML sitemaps to extract URLs
- **Web Scraping**: Downloads HTML content from each URL in the sitemap
- **Content Search**: Searches for specific terms in the actual page content
- **Progress Tracking**: Shows real-time progress during crawling
- **Error Handling**: Gracefully handles network errors and timeouts
- **Rate Limiting**: Includes delays between requests to be respectful to servers

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage

Run the main script with default parameters (URL: https://www.surirefugios.com/, Query: "fillout"):

```bash
node index.js
```

### Command Line Options

You can customize the URL and search query using command line arguments:

```bash
# Search for "fillout" in a specific sitemap
node index.js --url "https://example.com/sitemap.xml"

# Search for a different term in the default URL
node index.js --query "search-term"

# Custom URL and search term
node index.js --url "https://example.com/sitemap.xml" --query "custom-term"
```

**Parameters:**
- `--url`: The sitemap URL to crawl (default: https://www.surirefugios.com/)
- `--query`: The search term to look for in page content (default: fillout)

### Programmatic Usage

```javascript
import { crawlSitemapAndSearch } from './index.js';

// Search for a term in a sitemap
const results = await crawlSitemapAndSearch(
  'https://www.surirefugios.com/sitemap.xml',
  'fillout'
);

// Get only the URLs that contain the search term
const matchingUrls = results.filter(result => result.found)
                          .map(result => result.url);

console.log('Found URLs:', matchingUrls);
```

### Examples

Here are some common usage examples:

```bash
# Use defaults (URL: https://www.surirefugios.com/, Query: fillout)
node index.js

# Search for "contact" in a different sitemap
node index.js --url "https://example.com/sitemap.xml" --query "contact"

# Search for "pricing" in the default URL
node index.js --query "pricing"

# Search for "login" in a custom sitemap
node index.js --url "https://mysite.com/sitemap.xml" --query "login"
```

## Configuration

### Request Timeout
Default timeout is 10 seconds. Modify in `scrapeUrl()` function:

```javascript
const response = await axios.get(url, {
  timeout: 10000, // 10 second timeout
  // ... other options
});
```

### Rate Limiting
Default delay between requests is 500ms. Modify in `crawlSitemapAndSearch()`:

```javascript
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
```

### User Agent
The scraper uses a realistic User-Agent header to avoid being blocked:

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
```

## Output Format

The tool provides detailed progress information and final results:

```
=== CrawlMapper ===
Target: https://www.surirefugios.com/
Search term: "fillout"
===================

Fetching sitemap from: https://www.surirefugios.com/
Found 42 URLs in sitemap

Searching for "fillout" in 42 pages...
Progress: 10/42

✓ Found "fillout" in: https://www.example.com/page1
✓ Found "fillout" in: https://www.example.com/page2
20/42

=== RESULTS ===
Total pages processed: 42
Pages containing "fillout": 2
Pages without "fillout": 40

=== URLs containing the search term ===
1. https://www.example.com/page1
2. https://www.example.com/page2
```

## Error Handling

The tool handles various error scenarios:

- **Network timeouts**: Pages that don't respond within 10 seconds are skipped
- **Invalid URLs**: Malformed URLs are caught and reported
- **XML parsing errors**: Invalid sitemap XML is handled gracefully
- **Rate limiting**: Built-in delays prevent overwhelming servers

## Dependencies

- `axios`: HTTP client for making requests
- `xml2js`: XML parser for sitemap processing

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Notes

- The tool includes a 500ms delay between requests to be respectful to servers
- Case-insensitive search is performed on page content
- Only successful HTTP responses are processed
- Progress is logged every 10 pages processed
- URLs containing the search term are highlighted in real-time
