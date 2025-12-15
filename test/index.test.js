import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import xml2js from 'xml2js';

// Import the functions to test
import { 
  fetchSitemap, 
  scrapeUrl, 
  searchInContent, 
  crawlSitemapAndSearch,
  getMatchingUrls
} from '../index.js';

// Import test utilities
import { 
  mockSitemapXml, 
  mockHtmlWithTerm, 
  mockHtmlWithoutTerm,
  mockSitemapResponse,
  mockPageWithTermResponse,
  mockPageWithoutTermResponse,
  mockError,
  expectedParsedUrls,
  searchTerm,
  testUrls
} from './utils.js';

// Mock axios
vi.mock('axios');

// Mock xml2js
vi.mock('xml2js', () => ({
  default: {
    Parser: vi.fn().mockImplementation(() => ({
      parseStringPromise: vi.fn()
    }))
  }
}));

describe('CrawlMapper', () => {
  
  describe('fetchSitemap', () => {
    test('should fetch and parse sitemap successfully', async () => {
      const mockParser = {
        parseStringPromise: vi.fn().mockResolvedValue({
          urlset: {
            url: [
              { loc: ['https://www.example.com/page1'] },
              { loc: ['https://www.example.com/page2'] },
              { loc: ['https://www.example.com/page3'] }
            ]
          }
        })
      };
      
      xml2js.Parser.mockImplementation(() => mockParser);
      axios.get.mockResolvedValue(mockSitemapResponse);
      
      const result = await fetchSitemap('https://www.example.com/sitemap.xml');
      
      expect(axios.get).toHaveBeenCalledWith('https://www.example.com/sitemap.xml');
      expect(mockParser.parseStringPromise).toHaveBeenCalledWith(mockSitemapXml);
      expect(result).toEqual(expectedParsedUrls);
    });
    
    test('should handle errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      
      await expect(fetchSitemap('https://www.example.com/sitemap.xml'))
        .rejects.toThrow('Error fetching sitemap: Network error');
    });
    
    test('should handle empty sitemap', async () => {
      const mockParser = {
        parseStringPromise: vi.fn().mockResolvedValue({})
      };
      
      xml2js.Parser.mockImplementation(() => mockParser);
      axios.get.mockResolvedValue(mockSitemapResponse);
      
      const result = await fetchSitemap('https://www.example.com/sitemap.xml');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('scrapeUrl', () => {
    test('should scrape URL successfully', async () => {
      axios.get.mockResolvedValue(mockPageWithTermResponse);
      
      const result = await scrapeUrl('https://www.example.com/page1');
      
      expect(axios.get).toHaveBeenCalledWith('https://www.example.com/page1', {
        timeout: 10000,
        headers: {
          'User-Agent': expect.stringContaining('Mozilla')
        }
      });
      expect(result).toBe(mockHtmlWithTerm);
    });
    
    test('should handle timeout errors', async () => {
      axios.get.mockRejectedValue(mockError);
      
      const result = await scrapeUrl('https://www.example.com/page1');
      
      expect(result).toBeNull();
    });
  });
  
  describe('searchInContent', () => {
    test('should find search term in content', () => {
      const result = searchInContent(mockHtmlWithTerm, searchTerm);
      
      expect(result).toBe(true);
    });
    
    test('should not find search term in content', () => {
      const result = searchInContent(mockHtmlWithoutTerm, searchTerm);
      
      expect(result).toBe(false);
    });
    
    test('should handle null content', () => {
      const result = searchInContent(null, searchTerm);
      
      expect(result).toBe(false);
    });
    
    test('should be case insensitive', () => {
      const uppercaseContent = mockHtmlWithTerm.toUpperCase();
      const result = searchInContent(uppercaseContent, searchTerm);
      
      expect(result).toBe(true);
    });
  });
  
  describe('crawlSitemapAndSearch', () => {
    test('should crawl sitemap and search for term', async () => {
      // Mock the dependencies
      axios.get
        .mockResolvedValueOnce(mockSitemapResponse) // sitemap request
        .mockResolvedValue(mockPageWithTermResponse); // page requests
      
      const mockParser = {
        parseStringPromise: vi.fn().mockResolvedValue({
          urlset: {
            url: testUrls.map(url => ({ loc: [url] }))
          }
        })
      };
      
      xml2js.Parser.mockImplementation(() => mockParser);
      
      const result = await crawlSitemapAndSearch(
        'https://www.example.com/sitemap.xml',
        searchTerm
      );
      
      expect(result).toHaveLength(testUrls.length);
      result.forEach(item => {
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('found');
        expect(item.found).toBe(true); // All mock pages contain the term
      });
    });
    
    test('should handle mixed results (some pages with term, some without)', async () => {
      // Mock sitemap
      axios.get.mockResolvedValueOnce(mockSitemapResponse);
      
      // Mock pages - alternate between with and without term
      axios.get
        .mockResolvedValueOnce(mockPageWithTermResponse)
        .mockResolvedValueOnce(mockPageWithoutTermResponse)
        .mockResolvedValueOnce(mockPageWithTermResponse);
      
      const mockParser = {
        parseStringPromise: vi.fn().mockResolvedValue({
          urlset: {
            url: testUrls.map(url => ({ loc: [url] }))
          }
        })
      };
      
      xml2js.Parser.mockImplementation(() => mockParser);
      
      const result = await crawlSitemapAndSearch(
        'https://www.example.com/sitemap.xml',
        searchTerm
      );
      
      expect(result).toHaveLength(testUrls.length);
      expect(result[0].found).toBe(true);
      expect(result[1].found).toBe(false);
      expect(result[2].found).toBe(true);
    });
  });
  
  describe('getMatchingUrls', () => {
    test('should filter URLs that contain the search term', () => {
      const mockResults = [
        { url: 'https://www.example.com/page1', found: true },
        { url: 'https://www.example.com/page2', found: false },
        { url: 'https://www.example.com/page3', found: true },
        { url: 'https://www.example.com/page4', found: false }
      ];
      
      const result = getMatchingUrls(mockResults);
      
      expect(result).toEqual([
        'https://www.example.com/page1',
        'https://www.example.com/page3'
      ]);
    });
    
    test('should handle empty results', () => {
      const mockResults = [];
      
      const result = getMatchingUrls(mockResults);
      
      expect(result).toEqual([]);
    });
    
    test('should handle all false results', () => {
      const mockResults = [
        { url: 'https://www.example.com/page1', found: false },
        { url: 'https://www.example.com/page2', found: false }
      ];
      
      const result = getMatchingUrls(mockResults);
      
      expect(result).toEqual([]);
    });
  });

  describe('parseArguments', () => {
    test('should parse default arguments when none provided', () => {
      // Save original process.argv
      const originalArgv = process.argv;
      
      try {
        // Mock process.argv with no arguments
        process.argv = ['node', 'index.js'];
        
        // Import and test parseArguments
        const { parseArguments } = require('../index.js');
        const result = parseArguments();
        
        expect(result).toEqual({
          sitemapUrl: 'https://www.surirefugios.com/',
          query: 'fillout'
        });
      } finally {
        // Restore original process.argv
        process.argv = originalArgv;
      }
    });
    
    test('should parse custom URL argument', () => {
      const originalArgv = process.argv;
      
      try {
        process.argv = ['node', 'index.js', '--url', 'https://custom.com/sitemap.xml'];
        
        const { parseArguments } = require('../index.js');
        const result = parseArguments();
        
        expect(result).toEqual({
          sitemapUrl: 'https://custom.com/sitemap.xml',
          query: 'fillout'
        });
      } finally {
        process.argv = originalArgv;
      }
    });
    
    test('should parse custom query argument', () => {
      const originalArgv = process.argv;
      
      try {
        process.argv = ['node', 'index.js', '--query', 'contact'];
        
        const { parseArguments } = require('../index.js');
        const result = parseArguments();
        
        expect(result).toEqual({
          sitemapUrl: 'https://www.surirefugios.com/',
          query: 'contact'
        });
      } finally {
        process.argv = originalArgv;
      }
    });
    
    test('should parse both URL and query arguments', () => {
      const originalArgv = process.argv;
      
      try {
        process.argv = ['node', 'index.js', '--url', 'https://example.com/sitemap.xml', '--query', 'pricing'];
        
        const { parseArguments } = require('../index.js');
        const result = parseArguments();
        
        expect(result).toEqual({
          sitemapUrl: 'https://example.com/sitemap.xml',
          query: 'pricing'
        });
      } finally {
        process.argv = originalArgv;
      }
    });
    
    test('should handle arguments in different order', () => {
      const originalArgv = process.argv;
      
      try {
        process.argv = ['node', 'index.js', '--query', 'login', '--url', 'https://test.com/sitemap.xml'];
        
        const { parseArguments } = require('../index.js');
        const result = parseArguments();
        
        expect(result).toEqual({
          sitemapUrl: 'https://test.com/sitemap.xml',
          query: 'login'
        });
      } finally {
        process.argv = originalArgv;
      }
    });
  });
  
  describe('Integration Tests', () => {
    test('should work end-to-end with mock data', async () => {
      // This test simulates a complete workflow
      const sitemapUrl = 'https://www.example.com/sitemap.xml';
      
      // Mock all HTTP requests
      axios.get
        .mockResolvedValueOnce(mockSitemapResponse) // sitemap
        .mockResolvedValue(mockPageWithTermResponse); // all pages
      
      const mockParser = {
        parseStringPromise: vi.fn().mockResolvedValue({
          urlset: {
            url: testUrls.map(url => ({ loc: [url] }))
          }
        })
      };
      
      xml2js.Parser.mockImplementation(() => mockParser);
      
      // Run the main function logic
      const results = await crawlSitemapAndSearch(sitemapUrl, searchTerm);
      const matchingUrls = getMatchingUrls(results);
      
      // Assertions
      expect(results).toHaveLength(testUrls.length);
      expect(matchingUrls).toEqual(testUrls); // All pages should contain the term
    });
  });
});