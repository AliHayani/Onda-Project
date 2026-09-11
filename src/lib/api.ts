import { getStoredAuth } from '../features/auth/useAuth';

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
};

const isFormDataBody = (body: BodyInit | null | undefined): body is FormData => {
  return typeof FormData !== 'undefined' && body instanceof FormData;
};

export const apiFetch = (input: RequestInfo | URL, options: ApiFetchOptions = {}) => {
  const { skipAuth = false, headers, body, ...init } = options;
  const auth = getStoredAuth();
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && body && !isFormDataBody(body as BodyInit)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth && auth?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${auth.accessToken}`);
  }

  return fetch(input, {
    ...init,
    body,
    headers: requestHeaders,
  });
};

export const readJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message: string;

    if (contentType.includes('application/json')) {
      const errorBody = await response.json();
      message = typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody);
    } else {
      message = await response.text();
    }

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};
