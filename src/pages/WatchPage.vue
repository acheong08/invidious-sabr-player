<style scoped>
.watch-page {
  width: 100%;
  margin: 0 auto;
  max-width: 90%;
}

@media (max-width: 768px) {
  .watch-page {
    max-width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .watch-page {
    max-width: 85%;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .watch-page {
    max-width: 950px;
  }
}

@media (min-width: 1600px) {
  .watch-page {
    max-width: 1200px;
  }
}

.video-info {
  margin-top: 20px;
}

.video-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #fff;
  text-align: left;
}

.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
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
</style>

<template>
  <div class="watch-page">
    <VideoPlayer :videoId="videoId" />
    <div class="video-info" v-if="videoDetails">
      <h1 class="video-title">{{ videoDetails.title }}</h1>
      <div class="metadata-row">
        <div class="channel-info">
          <img :src="videoDetails.channelAvatar" class="channel-avatar" alt="Channel avatar">
          <div class="channel-details">
            <h3 class="channel-name">{{ videoDetails.channelName }}</h3>
            <span class="subscriber-count">{{ videoDetails.subscribers }}</span>
          </div>
        </div>
        <div class="video-stats">
          <span class="views" v-if="videoDetails.views">{{ videoDetails.views }}</span>
          <span class="date" v-if="videoDetails.publishDate">{{ videoDetails.publishDate }}</span>
        </div>
      </div>
      <div class="description">
        <div v-html="videoDetails.description"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { YTNodes } from 'youtubei.js';

import VideoPlayer from '../components/VideoPlayer.vue';
import { useInnertube } from '../composables/useInnertube';

const route = useRoute();
const videoId = route.params.id as string;
const getInnertube = useInnertube();

interface VideoDetails {
  title: string;
  channelName: string;
  channelAvatar: string;
  subscribers: string;
  views?: string;
  publishDate?: string;
  description: string;
}

const videoDetails = ref<VideoDetails | undefined>();

onMounted(async () => {
  const innertube = await getInnertube();

  const nextResponse = await innertube.actions.execute('/next', {
    videoId: videoId,
    parse: true
  });

  const videoPrimaryInfo = nextResponse.contents_memo?.getType(YTNodes.VideoPrimaryInfo).first();
  const videoSecondaryInfo = nextResponse.contents_memo?.getType(YTNodes.VideoSecondaryInfo).first();

  videoDetails.value = {
    title: videoPrimaryInfo?.title.toString() || '',
    channelName: videoSecondaryInfo?.owner?.author.name || '',
    channelAvatar: videoSecondaryInfo?.owner?.author.best_thumbnail?.url || '',
    subscribers: videoSecondaryInfo?.owner?.subscriber_count.toString() || '0 subscribers',
    views: videoPrimaryInfo?.view_count?.short_view_count.isEmpty() ? undefined : videoPrimaryInfo?.view_count?.short_view_count.toString(),
    publishDate: videoPrimaryInfo?.relative_date.isEmpty() ? undefined : videoPrimaryInfo?.relative_date.toString(),
    description: videoSecondaryInfo?.description.toHTML() || 'No description available'
  };
});
</script>