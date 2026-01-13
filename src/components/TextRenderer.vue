<style scoped>
.text {
  flex-direction: row;
  overflow-wrap: break-word;
}

.text.collapsed {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text a {
  color: rgb(62, 166, 255);
  text-decoration: none;
}
</style>

<template>
  <div :class="{ collapsed }" :style="collapsedStyle" class="text">
    <template v-for="run in contents.runs" :key="keyGen.generate(run)">
      <template v-if="run instanceof Misc.EmojiRun">
        <img
          :alt="escape(run.text)"
          :src="run.emoji.image[0].url"
          :style="{
              verticalAlign: 'middle',
              width: `${run.emoji.image[0].width}px`,
              height: `${run.emoji.image[0].height}px`
            }"
          :title="escape(run.text)"
          loading="lazy"
        />
      </template>
      <template v-else>
        <template v-if="run.attachment && run.endpoint">
          <a :href="run.endpoint.toURL()" class="yt-ch-link" rel="noopener noreferrer"
             target="_blank" @click="(event) => onLinkClick(event, run.endpoint)">
            <img
              v-if="attachmentData.get(keyGen.generate(run)).imageURL"
              :src="attachmentData.get(keyGen.generate(run)).imageURL"
              :style="{
                  verticalAlign: 'middle',
                  width: `${attachmentData.get(keyGen.generate(run)).width}px`,
                  height: `${attachmentData.get(keyGen.generate(run)).height}px`
                }"
              alt=""
            />
            <span v-html="renderText(run)"/>
          </a>
        </template>
        <template v-else-if="run.endpoint">
          <a :href="run.endpoint.toURL()" rel="noopener noreferrer" target="_blank"
             @click="(event) => onLinkClick(event, run.endpoint)"
             v-html="renderText(run)"/>
        </template>
        <template v-else>
          <template v-inline-html v-html="renderText(run)"/>
        </template>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Misc, YTNodes } from "youtubei.js/web";
import { useYoutubePlayer } from "@/composables/useYoutubePlayer";
import { router } from "@/router";
import { escape } from "@/utils/helpers";
import UniqueKeyGenerator from "@/utils/keyGen";

const props = defineProps<{
	contents: Misc.Text;
	collapsed?: boolean;
	collapsedLines?: number;
}>();

const route = useRoute();
const { seekToTime } = useYoutubePlayer();
const keyGen = new UniqueKeyGenerator();

const collapsedStyle = computed(() => {
	if (props.collapsed && props.collapsedLines) {
		return {
			"-webkit-line-clamp": props.collapsedLines,
		};
	}
	return {};
});

// Get current video ID from route
function getCurrentVideoId(): string {
	if (route.params.id) return route.params.id.toString();
	if (route.query.v) return route.query.v.toString();
	return "";
}

// YouTube hostnames that should be rewritten to the current host
const YOUTUBE_HOSTS = [
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"youtu.be",
];

/**
 * Checks if a URL is a YouTube URL and returns the rewritten path if applicable.
 * Returns null if the URL is not a YouTube URL or cannot be handled internally.
 */
function rewriteYouTubeUrl(urlString: string): string | null {
	try {
		const url = new URL(urlString);
		const host = url.hostname.toLowerCase();

		if (!YOUTUBE_HOSTS.includes(host)) {
			return null;
		}

		// Handle youtu.be short URLs (e.g., youtu.be/VIDEO_ID)
		if (host === "youtu.be") {
			const videoId = url.pathname.slice(1); // Remove leading /
			if (videoId) {
				const t = url.searchParams.get("t");
				let path = `/watch?v=${videoId}`;
				if (t) path += `&t=${t}`;
				return path;
			}
			return null;
		}

		// Handle youtube.com watch URLs
		if (url.pathname === "/watch") {
			const videoId = url.searchParams.get("v");
			if (videoId) {
				const t = url.searchParams.get("t");
				let path = `/watch?v=${videoId}`;
				if (t) path += `&t=${t}`;
				return path;
			}
		}

		// Handle youtube.com/channel/ URLs
		if (url.pathname.startsWith("/channel/")) {
			return url.pathname;
		}

		// Handle youtube.com/@username URLs
		if (url.pathname.startsWith("/@")) {
			return url.pathname;
		}

		return null;
	} catch {
		return null;
	}
}

function onLinkClick(event: MouseEvent, endpoint?: YTNodes.NavigationEndpoint) {
	event.stopPropagation();
	event.preventDefault();

	if (!endpoint) return;

	if (endpoint.name === "urlEndpoint") {
		const url = endpoint.toURL();
		if (!url) return;

		const rewrittenPath = rewriteYouTubeUrl(url);

		if (rewrittenPath) {
			// Check if it's a watch URL for the current video with a timestamp
			if (rewrittenPath.startsWith("/watch?v=")) {
				const params = new URLSearchParams(rewrittenPath.split("?")[1]);
				const targetVideoId = params.get("v");
				const t = params.get("t");
				const currentVideoId = getCurrentVideoId();

				if (targetVideoId === currentVideoId && t) {
					seekToTime(parseInt(t, 10));
					return;
				}
			}
			router.push(rewrittenPath);
		} else {
			window.open(url, "_blank");
		}
		return;
	}

	if (!endpoint.command) return;

	if (endpoint.command.is(YTNodes.WatchEndpoint)) {
		const startTimeSeconds = endpoint.payload.startTimeSeconds;
		const targetVideoId = endpoint.payload.videoId;
		const currentVideoId = getCurrentVideoId();

		// If clicking a timestamp for the same video, seek directly without navigation
		if (targetVideoId === currentVideoId && startTimeSeconds !== undefined) {
			seekToTime(startTimeSeconds);
			return;
		}

		let path = `/watch?v=${targetVideoId}`;
		if (startTimeSeconds) {
			path += `&t=${startTimeSeconds}`;
		}

		router.push(path);
	}
}

function renderText(run: Misc.TextRun) {
	const tags: string[] = [];

	if (run.bold) tags.push("b");
	if (run.italics) tags.push("i");
	if (run.strikethrough) tags.push("s");
	if (run.deemphasize) tags.push("small");

	const escaped_text = escape(run.text);

	if (!escaped_text) return "";

	const styled_text =
		tags.map((tag) => `<${tag}>`).join("") +
		escaped_text +
		tags.map((tag) => `</${tag}>`).join("");
	return `<span style="white-space: pre-wrap;">${styled_text}</span>`;
}

const attachmentData = computed(() => {
	const result = new Map();
	if (props.contents.runs) {
		for (const run of props.contents.runs) {
			if (run instanceof Misc.TextRun && run.attachment && run.endpoint) {
				const key = keyGen.generate(run);
				result.set(key, {
					imageURL: run.attachment.element.type.imageType.image.sources[0].url,
					width: run.attachment.element.properties.layoutProperties.width.value,
					height:
						run.attachment.element.properties.layoutProperties.height.value,
				});
			}
		}
	}
	return result;
});
</script>