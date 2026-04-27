type RuntimeWindow = {
  __RUNTIME_CONFIG__?: {
    API_BASE: string;
    IMGBED_BASE?: string;
    IMGBED_UPLOAD_TOKEN?: string;
    IMGBED_UPLOAD_FIELD?: string;
    IMGBED_UPLOAD_CHANNEL?: string;
    IMGBED_UPLOAD_CHANNEL_NAME?: string;
    IMGBED_UPLOAD_FOLDER?: string;
    IMGBED_CHUNK_THRESHOLD_MB?: string;
    IMGBED_CHUNK_SIZE_MB?: string;
  };
  fetch: typeof fetch;
  dispatchEvent: (event: Event) => boolean;
  location: {
    origin: string;
    href: string;
    pathname: string;
  };
};

function fail(message: string): never {
  throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    fail(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, label: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    fail(`${label}: expected ${expectedJson}, got ${actualJson}`);
  }
}

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

async function run(): Promise<void> {
  const fetchCalls: string[] = [];
  const fetchMock: typeof fetch = async (input, init): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    fetchCalls.push(url);

    if (url === 'https://imgbed.example/upload') {
      throw new TypeError('Failed to fetch');
    }

    if (url === '/api/v1/uploads/images') {
      return new Response(
        JSON.stringify({
          success: true,
          data: { url: 'https://backend.example/uploads/fallback.png' },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    fail(`unexpected fetch: ${url} (${init?.method ?? 'GET'})`);
  };

  const windowMock: RuntimeWindow = {
    __RUNTIME_CONFIG__: {
      API_BASE: '/api/v1',
      IMGBED_BASE: 'https://imgbed.example',
      IMGBED_UPLOAD_TOKEN: 'token',
      IMGBED_UPLOAD_FIELD: 'file',
      IMGBED_UPLOAD_CHANNEL: 'cfr2',
      IMGBED_UPLOAD_CHANNEL_NAME: '',
      IMGBED_UPLOAD_FOLDER: 'Blog/test',
      IMGBED_CHUNK_THRESHOLD_MB: '20',
      IMGBED_CHUNK_SIZE_MB: '8',
    },
    fetch: fetchMock,
    dispatchEvent: () => true,
    location: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000/admin/articles/new',
      pathname: '/admin/articles/new',
    },
  };

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: createStorageMock(),
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: windowMock,
  });

  const { uploadImage } = await import('./index.ts');
  const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });

  const uploadedUrl = await uploadImage(file);

  assertEqual(uploadedUrl, 'https://backend.example/uploads/fallback.png', 'uploadedUrl');
  assertDeepEqual(fetchCalls, ['https://imgbed.example/upload', '/api/v1/uploads/images'], 'fetchCalls');
}

await run();
