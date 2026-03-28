const feeds = {
  cnn: {
    label: 'CNN',
    url: 'https://rss.cnn.com/rss/cnn_topstories.rss',
    summaryElementId: 'cnnSummary'
  },
  brew: {
    label: 'Morning Brew',
    url: 'https://www.morningbrew.com/daily/rss.xml',
    summaryElementId: 'brewSummary'
  }
};

const statusText = document.getElementById('status');
const headlineRows = document.getElementById('headlineRows');

function normalizeDate(input) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isToday(date) {
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

async function fetchFeed(url) {
  const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxiedUrl);

  if (!response.ok) {
    throw new Error(`Feed request failed with status ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');

  return Array.from(xml.querySelectorAll('item')).map((item) => ({
    title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled',
    link: item.querySelector('link')?.textContent?.trim() ?? '#',
    pubDate: normalizeDate(item.querySelector('pubDate')?.textContent)
  }));
}

function pickDailyItems(items, maxItems = 8) {
  const todaysItems = items.filter((item) => item.pubDate && isToday(item.pubDate));
  if (todaysItems.length > 0) {
    return todaysItems.slice(0, maxItems);
  }

  return items.slice(0, maxItems);
}

function summarizeHeadlines(items) {
  if (items.length === 0) {
    return ['No headlines were available for this source.'];
  }

  const cleaned = items.map((item) => item.title.replace(/\s+/g, ' ').trim());

  const keywordMap = new Map();
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'to', 'in', 'of', 'for', 'on', 'with', 'at', 'is', 'are',
    'from', 'as', 'by', 'after', 'new', 'how', 'why', 'what', 'you', 'about', 'this', 'that'
  ]);

  for (const title of cleaned) {
    for (const token of title.toLowerCase().split(/[^a-z0-9]+/)) {
      if (!token || stopWords.has(token) || token.length < 3) continue;
      keywordMap.set(token, (keywordMap.get(token) ?? 0) + 1);
    }
  }

  const trending = [...keywordMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);

  const first = cleaned[0];
  const second = cleaned[1];

  const bullets = [
    `Top story: ${first}.`,
    second ? `Also developing: ${second}.` : 'Only one major headline was available.',
    trending.length
      ? `Recurring themes today: ${trending.join(', ')}.`
      : 'No clear recurring themes were detected.'
  ];

  if (cleaned.length > 2) {
    bullets.push(`Coverage is broad with ${cleaned.length} notable headlines in this digest.`);
  }

  return bullets;
}

function renderSummary(listId, bullets) {
  const target = document.getElementById(listId);
  target.innerHTML = '';

  for (const bullet of bullets) {
    const li = document.createElement('li');
    li.textContent = bullet;
    target.appendChild(li);
  }
}

function renderHeadlines(source, items) {
  for (const item of items) {
    const row = document.createElement('tr');

    const sourceCell = document.createElement('td');
    sourceCell.textContent = source;

    const headlineCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title;
    headlineCell.appendChild(link);

    const dateCell = document.createElement('td');
    dateCell.textContent = item.pubDate
      ? item.pubDate.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
      : 'Unknown';

    row.appendChild(sourceCell);
    row.appendChild(headlineCell);
    row.appendChild(dateCell);
    headlineRows.appendChild(row);
  }
}

async function refreshDigest() {
  statusText.textContent = 'Loading feeds...';
  headlineRows.innerHTML = '';

  try {
    for (const config of Object.values(feeds)) {
      const items = await fetchFeed(config.url);
      const dailyItems = pickDailyItems(items);
      const bullets = summarizeHeadlines(dailyItems);
      renderSummary(config.summaryElementId, bullets);
      renderHeadlines(config.label, dailyItems);
    }

    const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    statusText.textContent = `Digest generated at ${generatedAt} UTC.`;
  } catch (error) {
    statusText.textContent = `Could not build digest: ${error.message}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click', refreshDigest);
refreshDigest();
