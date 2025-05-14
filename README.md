# SABR Player

I have packaged this into a single docker image.

`podman run --rm -p 5173:5173 ghcr.io/acheong08/invidious-sabr-player:latest`

This serves the player on `/watch/<videoId>`

When necessary, you can use Caddy or any other reverse proxy to redirect to your secondary endpoint.

```
handle /watch {
    redir /watch https://iv2.duti.dev/watch/{query.v}
}
```

For a real deployment, you can reference my Kubernetes config for invidious:
<https://github.com/acheong08/kube/tree/master/invidious>

<details>

<summary>
Original README:
</summary>

# UMP-SABR Shaka Demo

This is a web app demonstrating a SABR/UMP player implementation using Shaka Player. It supports all streaming formats YouTube currently uses.
![Screenshot 2025-03-20 140139](https://github.com/user-attachments/assets/a415b993-aeef-4dea-83ae-1ee2fb7efdb2)

## Prerequisites

- Node.js
- Deno (for proxy server)

## Setup

1. Start the proxy server (required to avoid CORS issues):

```bash
deno run --allow-net --allow-read --allow-write ./proxy/deno.ts
```

2. Install and run the application:

```bash
npm install
npm run dev
```

## Technical Stuff

About a year or two ago, YouTube started experimenting with SABR (Server ABR) streaming. It allows the server to dynamically adjust the stream based on the user's network conditions and device capabilities. While this is all pretty good for YouTube, it's quite difficult to implement properly in third-party apps (think FreeTube, NewPipe, GrayJay, etc.)

For one, the SABR stream is not a standard DASH/HLS stream. It uses a custom streaming protocol (UMP) that is not compatible with any players available these days. And on top of that, it delivers both audio and video segments in one request, which is another incompatibility with DASH and HLS. It also does not use byte ranges, but rather a time value in milliseconds.

Trying to get around those issues, I ended up creating a custom Http plugin for Shaka Player. This plugin is responsible for parsing the response into something that Shaka Player can understand:

- [sabrUmpParser](./src/utils/sabrUmpParser.ts)
- [shakaHttpPlugin](./src/utils/shakaHttpPlugin.ts)
- [VideoPlayer](./src/components/VideoPlayer.vue)

### How it works

The UMP response is streamed and parsed on the fly using a `ReadableStream`. The parser processes different parts of the response as they arrive. A few examples of such parts are:

1. **FORMAT_INITIALIZATION_METADATA**: Contains codec information, total number of segments, etc
2. **MEDIA_HEADER**: Contains segment timing and format details
3. **MEDIA**: The actual audio/video data chunks
4. **NEXT_REQUEST_POLICY**: Contains playback cookies for subsequent requests

This approach is very efficient because:

- It processes data in chunks instead of parsing the entire thing at once (which is what I was doing before :p)
- Extra segments, if any, are ignored
- Requests are aborted once target segment is found

For SABR specifically, it also does the following:

- Caches init segments to reduce switching delay between qualities
- Handles stream protection status and error responses
- Maintains playback cookies for session continuity

## Acknowledgments

Special thanks to [@absidue](https://github.com/absidue) for helping debug Shaka Player issues and investigating different implementation approaches.

## License

Distributed under the [MIT](./LICENSE) License.

<p align="right">
(<a href="#top">back to top</a>)
</p>
</details>
