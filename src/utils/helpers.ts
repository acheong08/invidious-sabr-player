export async function fetchFunction(input: string | Request | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string'
    ? new URL(input)
    : input instanceof URL
      ? input
      : new URL(input.url);

  // Transform the url for use with our proxy.
  url.searchParams.set('__host', url.host);
  url.host = window.location.host;
  url.protocol = window.location.protocol;

  if (url.pathname.includes('v1/player')) {
    url.searchParams.set('$fields', 'playerConfig,captions,playabilityStatus,streamingData,responseContext.mainAppWebResponseContext.datasyncId,videoDetails.isLive,videoDetails.isLiveContent,videoDetails.title,videoDetails.author,playbackTracking');
  }

  const headers = init?.headers
    ? new Headers(init.headers)
    : input instanceof Request
      ? input.headers
      : new Headers();

  // Now serialize the headers.
  url.searchParams.set('__headers', JSON.stringify([...headers]));

  // Copy over the request.
  const request = new Request(
    url,
    input instanceof Request ? input : undefined
  );

  headers.delete('user-agent');

  return fetch(request, init ? {
    ...init,
    headers
  } : {
    headers
  });
}