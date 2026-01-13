<style scoped>
.watch-page {
  width: 100%;
  margin: 0 auto;
  max-width: 98%;
  display: flex;
  gap: 24px;
}

.primary {
  flex: 1;
  min-width: 0;
  margin-top: 15px;
}

.secondary {
  width: 402px;
  margin-top: 20px; /* Looks a bit weird at 15px for some reason, so we'll use 20px instead... */
}

@media (max-width: 1024px) {
  .watch-page {
    flex-direction: column;
    max-width: 100%;
  }

  .secondary {
    width: 100%;
    margin-top: 0;
  }
}

@media (min-width: 1600px) {
  .watch-page {
    max-width: calc(1200px + 402px + 24px);
  }
}

.video-info {
  margin-top: 10px;
}

.video-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #fff;
  text-align: left;
  overflow-wrap: break-word;
}

.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0 16px;
  border-bottom: 1px solid #5e5e5e7c;
}

.channel-details {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.channel-name {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #fff;
}

.subscriber-count {
  color: #aaa;
  font-size: 13px;
}

.video-stats {
  color: #aaa;
  font-size: 14px;
  justify-content: center;
  align-items: center;
  display: flex;
  gap: 12px;
}

.description {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  position: relative;
  color: #fff;
  text-align: left;
}

@keyframes fade {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

:deep(a) {
  color: rgb(62, 166, 255);
  text-decoration: none;
}

:deep(a.yt-ch-link) {
  color: rgb(255, 255, 255);
  background-color: rgba(255, 255, 255, 0.102);
  border-radius: 10px;
  padding-bottom: 2px;
  padding-left: 5px;
  justify-content: center;
}

:deep(.shaka-overflow-menu),
:deep(.shaka-settings-menu) {
  border-radius: 10px;
  -webkit-transition: opacity .3s cubic-bezier(0, 0, .2, 1);
  transition: opacity .3s cubic-bezier(0, 0, .2, 1);
  animation: fade 0.2s;
  scrollbar-width: none
}

.separator {
  width: 1px;
  height: 24px;
  background-color: #5e5e5e7c;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

</style>

<template>
  <div class="watch-page">
    <div class="primary">
      <VideoPlayer class="ytplayer" :videoId/>
      <div class="video-info" v-if="videoDetails">
        <h1 class="video-title" :title="videoDetails.title">{{ videoDetails.title }}</h1>
        <div class="metadata-row">
          <a :href="`/channel/${ videoDetails.channelId }`">
            <div class="channel-info">
              <img :src="videoDetails.channelAvatar" class="channel-avatar" alt="Channel avatar">
              <div class="channel-details">
                <h3 class="channel-name">{{ videoDetails.channelName }}</h3>
                <span class="subscriber-count">{{ videoDetails.subscribers }}</span>
              </div>
            </div>
          </a>
          <div class="video-stats">
            <span class="views" v-if="videoDetails.views">{{ videoDetails.views }}</span>
            <span class="date" v-if="videoDetails.publishDate">{{ videoDetails.publishDate }}</span>
          </div>
        </div>
        <div class="description" v-if="videoDetails.description">
          <TextRenderer :contents="videoDetails.description"/>
        </div>
        <CommentsSection :video-id="videoId" />
      </div>
    </div>
    <div class="secondary">
      <RelatedVideoItem v-for="item in relatedVideos" :key="item.videoId" :data="item"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { YTNodes } from "youtubei.js/web";
import CommentsSection from "@/components/CommentsSection.vue";
import RelatedVideoItem from "@/components/RelatedVideoItem.vue";
import TextRenderer from "@/components/TextRenderer.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import { useInnertube } from "@/composables/useInnertube";
import { useYoutubePlayer } from "@/composables/useYoutubePlayer";
import { useToastStore } from "@/stores/toastStore";
import type { VideoDetails, VideoItemData } from "@/utils/helpers";

const route = useRoute();
const { addToast } = useToastStore();
const getInnertube = useInnertube();
const { togglePlayPause, seek, seekToPercent, toggleMute } = useYoutubePlayer();

// Support both /watch/:id and /watch?v=:id
const getVideoId = () => {
	if (route.params.id) return route.params.id.toString();
	if (route.query.v) return route.query.v.toString();
	return "";
};
const videoId = ref(getVideoId());
const relatedVideos = ref<VideoItemData[]>([]);
const videoDetails = ref<VideoDetails | undefined>();

async function fetchVideoInfo() {
	const innertube = await getInnertube();
	if (!innertube) return;

	try {
		const nextResponse = await innertube.actions.execute("/next", {
			videoId: videoId.value,
			parse: true,
		});

		const videoPrimaryInfo = nextResponse.contents_memo
			?.getType(YTNodes.VideoPrimaryInfo)
			.first();
		const videoSecondaryInfo = nextResponse.contents_memo
			?.getType(YTNodes.VideoSecondaryInfo)
			.first();
		const secondaryResults = nextResponse.contents
			?.item()
			.as(YTNodes.TwoColumnWatchNextResults).secondary_results;

		if (videoPrimaryInfo?.title)
			document.title = videoPrimaryInfo.title.toString();

		videoDetails.value = {
			title: videoPrimaryInfo?.title.toString() || "",
			channelName: videoSecondaryInfo?.owner?.author.name || "",
			channelAvatar:
				videoSecondaryInfo?.owner?.author.best_thumbnail?.url || "",
			channelId: videoSecondaryInfo?.owner?.author.id || "",
			subscribers:
				videoSecondaryInfo?.owner?.subscriber_count.toString() ||
				"0 subscribers",
			views: videoPrimaryInfo?.view_count?.short_view_count.isEmpty()
				? videoPrimaryInfo.view_count.view_count.toString()
				: videoPrimaryInfo?.view_count?.short_view_count.toString(),
			publishDate: videoPrimaryInfo?.relative_date.isEmpty()
				? undefined
				: videoPrimaryInfo?.relative_date.toString(),
			description: videoSecondaryInfo?.description,
		};

		if (secondaryResults) {
			for (const item of secondaryResults) {
				if (item.is(YTNodes.LockupView)) {
					if (item.content_type !== "VIDEO") continue;

					const metadata = item.metadata;
					const contentImage = item.content_image;

					if (!metadata || !contentImage?.is(YTNodes.ThumbnailView)) continue;

					const durationOverlay = contentImage.overlays
						?.find(
							(overlay) =>
								overlay.is(YTNodes.ThumbnailOverlayBadgeView) &&
								overlay.position ===
									"THUMBNAIL_OVERLAY_BADGE_POSITION_BOTTOM_END",
						)
						?.as(YTNodes.ThumbnailOverlayBadgeView);

					relatedVideos.value.push({
						videoId: item.content_id,
						title: metadata.title.toHTML() ?? "",
						titleText: metadata.title.toString(),
						thumbnail: contentImage.image[0].url,
						authorAvatar: metadata.image?.as(YTNodes.DecoratedAvatarView)
							?.avatar?.image[0].url,
						metadata:
							metadata.metadata?.metadata_rows.map((row) => {
								return (
									row.metadata_parts
										?.map((item) => item.text?.toString())
										.join(metadata.metadata?.delimiter) || ""
								);
							}) || [],
						duration: durationOverlay?.badges[0]?.text,
					});
				}
			}
		}
	} catch (error) {
		console.error("Error fetching video details:", error);
		addToast("Failed to load video details.", "error");
	}
}

watch(
	() => [route.params.id, route.query.v],
	([newParamId, newQueryV]) => {
		const newId = newParamId?.toString() || newQueryV?.toString();
		if (!newId || newId === videoId.value) return;
		videoId.value = newId;
		relatedVideos.value = [];
		videoDetails.value = undefined;
		document.title = "Loading... - Kira";
		fetchVideoInfo();
	},
);

/**
 * Handles keyboard events for video playback controls.
 * - Space: Toggle play/pause
 * - ArrowLeft: Seek backward 5 seconds
 * - ArrowRight: Seek forward 5 seconds
 * - f: Toggle fullscreen
 * - m: Toggle mute
 * - 0-9: Jump to percentage of video (0=0%, 9=90%)
 */
function handleKeydown(event: KeyboardEvent): void {
	// Don't interfere with typing in input fields
	const activeElement = document.activeElement;
	if (
		activeElement &&
		(activeElement.tagName === "INPUT" ||
			activeElement.tagName === "TEXTAREA" ||
			(activeElement as HTMLElement).isContentEditable)
	) {
		return;
	}

	// Don't interfere with keyboard shortcuts using modifier keys
	if (event.ctrlKey || event.metaKey || event.altKey) {
		return;
	}

	switch (event.code) {
		case "Space":
			event.preventDefault(); // Prevent page scroll
			togglePlayPause();
			break;
		case "ArrowLeft":
			event.preventDefault();
			seek(-5);
			break;
		case "ArrowRight":
			event.preventDefault();
			seek(5);
			break;
		case "KeyF":
			event.preventDefault();
			toggleFullscreen();
			break;
		case "KeyM":
			event.preventDefault();
			toggleMute();
			break;
		case "Digit0":
		case "Digit1":
		case "Digit2":
		case "Digit3":
		case "Digit4":
		case "Digit5":
		case "Digit6":
		case "Digit7":
		case "Digit8":
		case "Digit9": {
			event.preventDefault();
			const digit = parseInt(event.code.replace("Digit", ""), 10);
			seekToPercent(digit * 10);
			break;
		}
	}
}

/**
 * Toggles fullscreen mode for the video player container.
 */
function toggleFullscreen(): void {
	const videoElement = document.querySelector("video");
	if (!videoElement) return;

	const container = videoElement.closest(
		".shaka-video-container",
	) as HTMLElement;
	if (!container) return;

	if (!document.fullscreenElement) {
		container.requestFullscreen().catch((err) => {
			console.error("Error attempting to enable fullscreen:", err);
		});
	} else {
		document.exitFullscreen();
	}
}

onMounted(() => {
	fetchVideoInfo();
	document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
	document.title = "Kira";
	document.removeEventListener("keydown", handleKeydown);
});
</script>