// Test utilities and mock data

// Mock sitemap XML
export const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/page1</loc>
    <lastmod>2023-01-01</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/page2</loc>
    <lastmod>2023-01-02</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/page3</loc>
    <lastmod>2023-01-03</lastmod>
  </url>
</urlset>`;

// Mock HTML content containing search term
export const mockHtmlWithTerm = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Welcome to our site</h1>
    <p>This page contains the fillout form for registration.</p>
    <div class="content">
        <p>Please fillout the form below to continue.</p>
    </div>
</body>
</html>
`;

// Mock HTML content without search term
export const mockHtmlWithoutTerm = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page 2</title>
</head>
<body>
    <h1>Welcome to our site</h1>
    <p>This page does not contain the search term.</p>
    <div class="content">
        <p>Just regular content here.</p>
    </div>
</body>
</html>
`;

// Mock axios responses
export const mockSitemapResponse = {
  data: mockSitemapXml
};

export const mockPageWithTermResponse = {
  data: mockHtmlWithTerm
};

export const mockPageWithoutTermResponse = {
  data: mockHtmlWithoutTerm
};

// Mock error responses
export const mockError = {
  code: 'ECONNABORTED',
  message: 'timeout of 10000ms exceeded'
};

// Test URL lists
export const testUrls = [
  'https://www.example.com/page1',
  'https://www.example.com/page2',
  'https://www.example.com/page3'
];

// Expected results
export const expectedParsedUrls = [
  'https://www.example.com/page1',
  'https://www.example.com/page2',
  'https://www.example.com/page3'
];

export const searchTerm = 'fillout';