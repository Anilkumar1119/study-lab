const wikiProvider = (name, host, type) => ({
  name, type,
  query(term) {
    const url = new URL('https://' + host + '/w/api.php');
    url.search = new URLSearchParams({ action: 'query', list: 'search', srsearch: term, srlimit: '4', srnamespace: '0', srprop: '', format: 'json' });
    return url;
  },
  parse(data, type) {
    if (!Array.isArray(data.query?.search)) throw Error('Invalid wiki response');
    return data.query.search.filter(item => Number.isSafeInteger(item.pageid) && item.pageid > 0).map(item => ({
      title: item.title, description: '', url: 'https://' + host + '/?curid=' + item.pageid, type
    }));
  }
});

const discoveryProviders = [
  wikiProvider('Wikibooks', 'en.wikibooks.org', 'books'),
  wikiProvider('Wikiversity', 'en.wikiversity.org', 'courses'),
  wikiProvider('Wikiversity', 'en.wikiversity.org', 'notes'),
  wikiProvider('Wikipedia', 'en.wikipedia.org', 'reference'),
  {
    name: 'Open Library', type: 'books',
    query(term) {
      const url = new URL('https://openlibrary.org/search.json');
      url.search = new URLSearchParams({ q: term, fields: 'key,title,author_name,first_publish_year', limit: '5' });
      return url;
    },
    parse(data, type) {
      if (!Array.isArray(data.docs)) throw Error('Invalid Open Library response');
      return data.docs.filter(item => /^\/works\/OL\d+W$/.test(item.key)).map(item => ({
        title: item.title,
        description: [Array.isArray(item.author_name) ? item.author_name.slice(0, 2).join(', ') : '', item.first_publish_year].filter(Boolean).join(' · '),
        url: 'https://openlibrary.org' + item.key, type
      }));
    }
  },
  {
    name: 'OpenAlex', type: 'research',
    query(term) {
      const url = new URL('https://api.openalex.org/works');
      url.search = new URLSearchParams({ search: term, filter: 'is_oa:true', 'per-page': '5',
        select: 'id,display_name,publication_year,open_access,primary_location' });
      return url;
    },
    parse(data, type) {
      if (!Array.isArray(data.results)) throw Error('Invalid OpenAlex response');
      return data.results.map(item => ({
        title: item.display_name,
        description: [item.primary_location?.source?.display_name, item.publication_year].filter(Boolean).join(' · '),
        url: secureUrl(item.open_access?.oa_url) || secureUrl(item.id), type
      }));
    }
  }
];

function secureUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

const supportedDiscoveryTypes = new Set(['all','books','courses','notes','reference','research','videos','practice','simulations','teaching']);

export async function discover(url, env) {
  const term = (url.searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
  const type = url.searchParams.get('type') || 'all';
  if (term.length < 2 || term.length > 120 || !supportedDiscoveryTypes.has(type)) {
    return Response.json({ error: 'Enter a topic between 2 and 120 characters and choose a resource type.' }, { status: 400 });
  }
  const providers = discoveryProviders.filter(provider => type === 'all' || provider.type === type);
  const pending = new Map();
  const grouped = await Promise.allSettled(providers.map(async provider => {
    const target = provider.query(term);
    if (!pending.has(target.href)) {
      const headers = { accept: 'application/json', 'Api-User-Agent': 'Study Lab educational resource discovery/1.0' };
      if (provider.name === 'OpenAlex' && env.OPENALEX_API_KEY) headers.authorization = 'Bearer ' + env.OPENALEX_API_KEY;
      pending.set(target.href, fetch(target.href, { headers, signal: AbortSignal.timeout(4200) }).then(response => {
        if (!response.ok) throw Error('Source unavailable');
        return response.json();
      }));
    }
    return provider.parse(await pending.get(target.href), provider.type)
      .filter(item => typeof item.title === 'string' && item.title.trim() && item.url)
      .slice(0, 5).map(item => ({ ...item, title: item.title.slice(0, 260), description: item.description.slice(0, 320), source: provider.name }));
  }));
  // Wikiversity mixes learning materials with course pages. Show each URL once in the combined view.
  const results = [];
  const seen = new Set();
  for (const entry of grouped) {
    if (entry.status !== 'fulfilled') continue;
    for (const result of entry.value) {
      if (seen.has(result.url)) continue;
      seen.add(result.url);
      results.push(result);
    }
  }
  return Response.json({ results, unavailable: [...new Set(providers.filter((_, i) => grouped[i].status === 'rejected').map(provider => provider.name))] });
}
