class CrawlMapperApp {
  constructor() {
    this.form = document.getElementById('searchForm');
    this.urlInput = document.getElementById('urlInput');
    this.queryInput = document.getElementById('queryInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.loader = document.getElementById('loader');
    this.results = document.getElementById('results');
    this.error = document.getElementById('error');
    this.searchTerm = document.getElementById('searchTerm');
    this.progressText = document.getElementById('progressText');
    this.resultsList = document.getElementById('resultsList');
    this.summaryText = document.getElementById('summaryText');
    this.errorMessage = document.getElementById('errorMessage');
    this.newSearchBtn = document.getElementById('newSearchBtn');
    this.exportBtn = document.getElementById('exportBtn');

    this.currentSearchData = null;

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSearch(e));
    this.newSearchBtn.addEventListener('click', () => this.resetForm());
    this.exportBtn.addEventListener('click', () => this.exportResults());

    this.urlInput.addEventListener('input', () => this.validateForm());
    this.queryInput.addEventListener('input', () => this.validateForm());

    this.validateForm();
  }

  validateForm() {
    const url = this.urlInput.value.trim();
    const query = this.queryInput.value.trim();

    const isValid = url.length > 0 && query.length > 0;
    this.searchBtn.disabled = !isValid;

    return isValid;
  }

  async handleSearch(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const url = this.urlInput.value.trim();
    const query = this.queryInput.value.trim();

    this.showLoader(query);
    this.hideError();
    this.hideResults();

    try {
      const isGitHubPages =
        window.location.hostname.includes('github.io') ||
        window.location.hostname.includes('githubusercontent.com') ||
        window.location.protocol === 'file:';

      if (isGitHubPages) {
        this.showGitHubPagesMessage();
        return;
      }

      const apiEndpoint =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:'
          ? '/api/search'
          : '/.netlify/functions/search';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, query }),
      });

      const data = await response.json();

      if (data.success) {
        this.showResults(data.data);
      } else {
        this.showError(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.showGitHubPagesMessage();
      } else {
        this.showError('Network error: Unable to connect to the server');
      }
    } finally {
      this.hideLoader();
    }
  }

  showGitHubPagesMessage() {
    this.hideLoader();

    const message = `
            <div class="github-pages-message">
                <div class="message-icon">🚀</div>
                <div class="message-title">Frontend Demo Mode</div>
                <div class="message-content">
                    <p>This is the frontend-only version deployed on GitHub Pages.</p>
                    <p>For full functionality including sitemap crawling and content search, you need to deploy the backend server.</p>
                    <div class="deployment-info">
                        <h4>Deployment Options:</h4>
                        <ul>
                            <li><strong>Local:</strong> Run the Node.js server locally</li>
                            <li><strong>Heroku/Railway:</strong> Deploy the backend to a cloud platform</li>
                            <li><strong>Vercel/Netlify:</strong> Deploy both frontend and backend</li>
                        </ul>
                    </div>
                    <p class="github-link">
                        <a href="https:
                            View source code and deployment instructions
                        </a>
                    </p>
                </div>
            </div>
        `;

    this.resultsList.innerHTML = message;
    this.summaryText.textContent = 'GitHub Pages Deployment';
    this.results.classList.remove('hidden');
  }

  showLoader(query) {
    this.searchTerm.textContent = query;
    this.progressText.textContent = 'Initializing search...';
    this.loader.classList.remove('hidden');
    this.searchBtn.disabled = true;

    this.animateLoaderText();
  }

  hideLoader() {
    this.loader.classList.add('hidden');
    this.searchBtn.disabled = false;
  }

  animateLoaderText() {
    const messages = [
      'Fetching sitemap...',
      'Parsing URLs...',
      'Searching pages...',
      'Analyzing content...',
      'Almost done...',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (this.loader.classList.contains('hidden')) {
        clearInterval(interval);
        return;
      }

      this.progressText.textContent = messages[index % messages.length];
      index++;
    }, 2000);
  }

  showResults(data) {
    this.currentSearchData = data;

    const summary = `Found ${data.foundPages} pages containing "${data.query}" out of ${data.totalPages} total pages`;
    this.summaryText.textContent = summary;

    this.resultsList.innerHTML = '';

    if (data.matchingUrls.length === 0) {
      this.resultsList.innerHTML = `
                <div class="result-item">
                    <div class="result-status">No matches found</div>
                    <div style="color: var(--text-muted); margin-top: 0.5rem;">
                        No pages containing "${data.query}" were found in the sitemap.
                    </div>
                </div>
            `;
    } else {
      data.matchingUrls.forEach((url, index) => {
        const resultItem = this.createResultItem(url, index + 1);
        this.resultsList.appendChild(resultItem);
      });
    }

    this.results.classList.remove('hidden');

    this.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  createResultItem(url, index) {
    const item = document.createElement('div');
    item.className = 'result-item';

    item.innerHTML = `
            <a href="${url}" target="_blank" class="result-url">
                ${index}. ${url}
            </a>
            <div class="result-status">✓ MATCH FOUND</div>
        `;

    return item;
  }

  hideResults() {
    this.results.classList.add('hidden');
    this.currentSearchData = null;
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.error.classList.remove('hidden');

    this.error.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  hideError() {
    this.error.classList.add('hidden');
  }

  resetForm() {
    this.urlInput.value = '';
    this.queryInput.value = '';
    this.hideLoader();
    this.hideResults();
    this.hideError();
    this.validateForm();
    this.urlInput.focus();
  }

  exportResults() {
    if (!this.currentSearchData) {
      return;
    }

    const {
      sitemapUrl,
      query,
      matchingUrls,
      totalPages,
      foundPages,
      allResults,
    } = this.currentSearchData;

    const headers = ['Index', 'URL', 'Status', 'Contains Query'];

    const rows = allResults.map((result, index) => [
      index + 1,
      result.url,
      result.found ? 'MATCH_FOUND' : 'NO_MATCH',
      result.found ? 'YES' : 'NO',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const metadata = [
      '# CrawlMapper Export',
      '# Tool: CrawlMapper v2.2.0',
      `# Generated: ${new Date().toISOString()}`,
      `# Sitemap: ${sitemapUrl}`,
      `# Query: "${query}"`,
      `# Total Pages: ${totalPages}`,
      `# Found Pages: ${foundPages}`,
      '',
    ].join('\n');

    const fullCsvContent = metadata + csvContent;

    const dataBlob = new Blob([fullCsvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `crawlmapper-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new CrawlMapperApp();

  createMatrixEffect();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!app.searchBtn.disabled) {
        app.form.dispatchEvent(new Event('submit'));
      }
    }

    if (e.key === 'Escape') {
      app.resetForm();
    }
  });

  const urlInput = document.getElementById('urlInput');
  const queryInput = document.getElementById('queryInput');

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      queryInput.focus();
    }
  });
});

function createMatrixEffect() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.opacity = '0.1';
  canvas.style.pointerEvents = 'none';

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars =
    '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const charArray = chars.split('');

  const fontSize = 14;
  const columns = canvas.width / fontSize;

  const drops = [];
  for (let x = 0; x < columns; x++) {
    drops[x] = 1;
  }

  function draw() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = charArray[Math.floor(Math.random() * charArray.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 50);

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
