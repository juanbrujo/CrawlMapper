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
- **Smart URL Handling**: Accepts various domain formats and auto-appends /sitemap.xml
- **Progress Tracking**: Shows real-time progress during crawling
- **Error Handling**: Gracefully handles network errors and timeouts
- **Rate Limiting**: Includes delays between requests to be respectful to servers

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Quick Start

```bash
# Use default settings (searches for "fillout" in surirefugios.com)
node index.js

# Search for any term in any website using simple domain format
node index.js --url "example.com" --query "your-search-term"

# Search using full URL format
node index.js --url "https://www.example.com" --query "contact"
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
# Search for "fillout" in a specific sitemap (simple domain format)
node index.js --url "example.com"

# Search for "fillout" with full URL
node index.js --url "https://www.example.com"

# Search for a different term in the default URL
node index.js --query "search-term"

# Custom URL and search term
node index.js --url "example.com" --query "custom-term"
```

**URL Handling:**
The `--url` parameter accepts various formats and automatically normalizes them:
- `example.com` → `https://www.example.com/sitemap.xml`
- `https://www.example.com` → `https://www.example.com/sitemap.xml`
- `https://www.example.com/` → `https://www.example.com/sitemap.xml`
- `www.example.com` → `https://www.example.com/sitemap.xml`

The tool automatically appends `/sitemap.xml` to complete the sitemap URL and handles cases where the sitemap is not found.

**Parameters:**
- `--url`: The domain or full URL to crawl (default: https://www.surirefugios.com/)
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

# Search for "contact" using simple domain format
node index.js --url "example.com" --query "contact"

# Search for "pricing" using full URL format
node index.js --url "https://www.example.com" --query "pricing"

# Search for "login" using domain with www
node index.js --url "www.example.com" --query "login"

# Search for "contact" in the default URL
node index.js --query "contact"
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

### Successful Crawl
```
=== CrawlMapper ===
Target: https://www.google.com/sitemap.xml
Search term: "privacy"
===================

Fetching sitemap from: https://www.google.com/sitemap.xml
Found 42 URLs in sitemap

Searching for "privacy" in 42 pages...
Progress: 10/42

✓ Found "privacy" in: https://www.google.com/policies
✓ Found "privacy" in: https://www.google.com/privacy
20/42

=== RESULTS ===
Total pages processed: 42
Pages containing "privacy": 2
Pages without "privacy": 40

=== URLs containing the search term ===
1. https://www.google.com/policies
2. https://www.google.com/privacy
```

### Sitemap Not Found
```
=== CrawlMapper ===
Target: https://www.example.com/sitemap.xml
Search term: "fillout"
===================

Fetching sitemap from: https://www.example.com/sitemap.xml
Error: Sitemap not found: Server returned 404 status code
Failed to crawl sitemap: Sitemap not found: Server returned 404 status code

The sitemap.xml file could not be found at the provided URL.
Please check that the website exists and has a sitemap.xml file.
```

## Error Handling

The tool handles various error scenarios:

- **Sitemap not found**: When the sitemap.xml file doesn't exist (404, 403, 406 errors)
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

## Troubleshooting

### Common Issues

**Sitemap not found (404/403/406 errors):**
- Verify the website exists and is accessible
- Some websites don't have sitemap.xml files
- Try different common sitemap locations like `/sitemap_index.xml`

**Network timeouts:**
- Some websites may be slow to respond
- The default timeout is 10 seconds
- Check your internet connection

**No results found:**
- Try different search terms
- Verify the sitemap contains URLs
- Check that the website's content matches your search term

### Tips
- Use simple domain names (e.g., `example.com`) for easiest usage
- The tool automatically handles `www` and HTTPS protocols
- Search is case-insensitive
- Progress is shown every 10 pages processed

## Notes

- The tool includes a 500ms delay between requests to be respectful to servers
- Case-insensitive search is performed on page content
- Only successful HTTP responses are processed
- Progress is logged every 10 pages processed
- URLs containing the search term are highlighted in real-time
- Simple domain formats are automatically converted to proper sitemap URLs
