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

A sitemap content search tool that crawls sitemaps and searches for specific terms in webpage content.

## Features

- **Web Interface**: Modern hacker-style frontend with dark theme and green terminal aesthetics
- **Sitemap Parsing**: Fetches and parses XML sitemaps to extract URLs
- **Web Scraping**: Downloads HTML content from each URL in the sitemap
- **Content Search**: Searches for specific terms in the actual page content
- **Smart URL Handling**: Accepts various domain formats and auto-appends /sitemap.xml
- **Progress Tracking**: Shows real-time progress during crawling
- **Error Handling**: Gracefully handles network errors and timeouts
- **Rate Limiting**: Includes delays between requests to be respectful to servers
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Results**: Results appear instantly after processing
- **Export Functionality**: Download search results as JSON files

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Quick Start

### Web Interface (Recommended)

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Enter a domain name and search term in the web interface

### Command Line Interface

```bash
# Search for any term in any website using simple domain format
node index.js --url "example.com" --query "contact"

# Search using full URL format
node index.js --url "https://www.google.com" --query "privacy"

# Search with different domain formats
node index.js --url "stackoverflow.com" --query "javascript"
```

## Web Interface Usage

The web interface provides an intuitive, modern experience with:

- **ASCII Art Title**: Professional hacker-style branding
- **Dark Theme**: Black background with bright green terminal text
- **Monospace Typography**: Authentic terminal font (JetBrains Mono)
- **Real-time Validation**: Input fields validate as you type
- **Animated Loader**: Progress indicator with rotating spinner
- **Instant Results**: Results appear on the same page
- **Error Handling**: Clear error messages with visual indicators
- **Export Feature**: Download results as JSON files

### Interface Elements

1. **Domain Input**: Enter website domain (e.g., "example.com")
2. **Search Query**: Enter the term to search for in page content
3. **Search Button**: Start the crawling process
4. **Progress Loader**: Shows crawling progress with animated text
5. **Results Display**: Shows matching URLs in real-time
6. **Export Button**: Download results as JSON file
7. **New Search**: Reset form for another search

### Keyboard Shortcuts

- **Ctrl+Enter** (Cmd+Enter on Mac): Start search
- **Escape**: Reset form and clear results

## Command Line Usage

### Basic Usage

CrawlMapper requires both URL and query parameters to be specified:

```bash
node index.js --url "example.com" --query "search-term"
```

### Command Line Options

You must provide both URL and search query parameters:

```bash
# Search for "contact" using simple domain format
node index.js --url "example.com" --query "contact"

# Search using full URL format
node index.js --url "https://www.example.com" --query "privacy"

# Search for "javascript" related content
node index.js --url "stackoverflow.com" --query "javascript"
```

**URL Handling:**
The `--url` parameter accepts various formats and automatically normalizes them:
- `example.com` → `https://www.example.com/sitemap.xml`
- `https://www.example.com` → `https://www.example.com/sitemap.xml`
- `https://www.example.com/` → `https://www.example.com/sitemap.xml`
- `www.example.com` → `https://www.example.com/sitemap.xml`

The tool automatically appends `/sitemap.xml` to complete the sitemap URL and handles cases where the sitemap is not found.

**Parameters:**
- `--url`: The domain or full URL to crawl (required)
- `--query`: The search term to look for in page content (required)

### Programmatic Usage

```javascript
import { crawlSitemapAndSearch } from './index.js';

// Search for a term in a sitemap
const results = await crawlSitemapAndSearch(
  'https://www.example.com/sitemap.xml',
  'contact'
);

// Get only the URLs that contain the search term
const matchingUrls = results.filter(result => result.found)
                          .map(result => result.url);

console.log('Found URLs:', matchingUrls);
```

### Examples

Here are some common usage examples:

```bash
# Search for "contact" information
node index.js --url "example.com" --query "contact"

# Search for "privacy" policy
node index.js --url "https://www.google.com" --query "privacy"

# Search for "javascript" related content
node index.js --url "stackoverflow.com" --query "javascript"

# Search for "pricing" information
node index.js --url "www.example.com" --query "pricing"

# Search for "about" page
node index.js --url "github.com" --query "about"
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

### Web Interface Results
The web interface shows:
- **Summary**: Total pages processed and matches found
- **Matching URLs**: Clickable links to pages containing the search term
- **Export Option**: Download results as structured JSON
- **Visual Status**: Color-coded indicators for success/error states

### Command Line Output
The tool provides detailed progress information and final results:

#### Successful Crawl
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

#### Missing Parameters Error
```
Error: Both --url and --query parameters are required.

Usage:
  node index.js --url <domain> --query <search-term>

Examples:
  node index.js --url "example.com" --query "contact"
  node index.js --url "google.com" --query "privacy"
  node index.js --url "stackoverflow.com" --query "javascript"
```

#### Sitemap Not Found
```
=== CrawlMapper ===
Target: https://www.example.com/sitemap.xml
Search term: "contact"
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
- **API errors**: Web interface provides user-friendly error messages

## API Endpoints

### Web Interface
- `GET /` - Main web interface
- `POST /api/search` - Search endpoint
- `GET /api/health` - Health check

### Search Request
```javascript
POST /api/search
Content-Type: application/json

{
  "url": "example.com",
  "query": "contact"
}
```

### Search Response
```javascript
{
  "success": true,
  "data": {
    "sitemapUrl": "https://www.example.com/sitemap.xml",
    "query": "contact",
    "totalPages": 42,
    "foundPages": 3,
    "matchingUrls": [
      "https://www.example.com/contact",
      "https://www.example.com/about/contact"
    ],
    "allResults": [...]
  }
}
```

## Dependencies

### Production
- `axios`: HTTP client for making requests
- `xml2js`: XML parser for sitemap processing
- `express`: Web server framework
- `cors`: CORS middleware

### Development
- `vitest`: Testing framework

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

**Web interface not loading:**
- Ensure the server is running (`npm start`)
- Check that port 3000 is available
- Verify browser console for JavaScript errors

### Tips
- Use simple domain names (e.g., `example.com`) for easiest usage
- The tool automatically handles `www` and HTTPS protocols
- Search is case-insensitive
- Progress is shown every 10 pages processed
- Web interface provides better user experience with visual feedback
- Export results for further analysis or reporting

## Notes

- The tool includes a 500ms delay between requests to be respectful to servers
- Case-insensitive search is performed on page content
- Only successful HTTP responses are processed
- Progress is logged every 10 pages processed
- URLs containing the search term are highlighted in real-time
- Simple domain formats are automatically converted to proper sitemap URLs
- Web interface features responsive design for mobile compatibility
- ASCII art title provides authentic terminal/hacker aesthetic
