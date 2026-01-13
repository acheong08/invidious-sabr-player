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

function onLinkClick(event: MouseEvent, endpoint?: YTNodes.NavigationEndpoint) {
	event.stopPropagation();
	event.preventDefault();

	if (!endpoint) return;

	if (endpoint.name === "urlEndpoint") {
		window.open(endpoint.toURL(), "_blank");
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