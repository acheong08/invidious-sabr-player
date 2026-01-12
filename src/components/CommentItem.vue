<style scoped>
.comment {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.comment.reply {
  padding-left: 48px;
}

.avatar {
  flex-shrink: 0;
}

.avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #333;
}

.comment.reply .avatar img {
  width: 24px;
  height: 24px;
}

.content {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.author {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-decoration: none;
}

.author:hover {
  text-decoration: underline;
}

.author.owner {
  background-color: #3ea6ff;
  color: #0f0f0f;
  padding: 1px 6px;
  border-radius: 12px;
}

.pinned-badge,
.edited-badge {
  font-size: 11px;
  color: #aaa;
}

.pinned-badge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.published {
  font-size: 12px;
  color: #aaa;
}

.text {
  font-size: 14px;
  line-height: 1.4;
  color: #fff;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.text :deep(a) {
  color: #3ea6ff;
  text-decoration: none;
}

.text :deep(a:hover) {
  text-decoration: underline;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.like-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #aaa;
}

.like-icon {
  width: 16px;
  height: 16px;
}

.heart {
  display: flex;
  align-items: center;
  gap: 4px;
}

.heart-icon {
  width: 16px;
  height: 16px;
  color: #f00;
}

.heart-creator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.replies-toggle {
  background: none;
  border: none;
  color: #3ea6ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.replies-toggle:hover {
  text-decoration: underline;
}

.replies-container {
  margin-top: 8px;
}

.loading-replies {
  font-size: 13px;
  color: #aaa;
  padding: 8px 0;
}

.load-more-replies {
  background: none;
  border: none;
  color: #3ea6ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  margin-left: 48px;
}

.load-more-replies:hover {
  text-decoration: underline;
}
</style>

<template>
  <div class="comment" :class="{ reply: isReply }">
    <a class="avatar" :href="comment.authorUrl">
      <img 
        :src="getAuthorThumbnail()" 
        :alt="comment.author"
        loading="lazy"
        @error="handleImageError($event.target as HTMLImageElement)"
      />
    </a>
    <div class="content">
      <div class="header">
        <span v-if="comment.isPinned" class="pinned-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
          Pinned
        </span>
        <a 
          class="author" 
          :class="{ owner: comment.authorIsChannelOwner }"
          :href="comment.authorUrl"
        >
          {{ comment.author }}
        </a>
        <span class="published">{{ comment.publishedText }}</span>
        <span v-if="comment.isEdited" class="edited-badge">(edited)</span>
      </div>
      <div class="text" v-html="comment.contentHtml" />
      <div class="actions">
        <span class="like-count">
          <svg class="like-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"/>
          </svg>
          {{ formatLikeCount(comment.likeCount) }}
        </span>
        <span v-if="comment.creatorHeart" class="heart" title="Creator liked this comment">
          <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <img 
            class="heart-creator" 
            :src="comment.creatorHeart.creatorThumbnail" 
            :alt="comment.creatorHeart.creatorName"
          />
        </span>
      </div>
      <div v-if="comment.replies && !isReply">
        <button 
          class="replies-toggle" 
          @click="toggleReplies"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" :style="{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0)' }">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          {{ showReplies ? 'Hide' : comment.replies.replyCount }} {{ comment.replies.replyCount === 1 ? 'reply' : 'replies' }}
        </button>
        <div v-if="showReplies" class="replies-container">
          <div v-if="isLoadingReplies" class="loading-replies">Loading replies...</div>
          <template v-else>
            <CommentItem 
              v-for="reply in replies" 
              :key="reply.commentId"
              :comment="reply"
              :video-id="videoId"
              :fetch-replies-fn="fetchRepliesFn"
              :is-reply="true"
            />
            <button 
              v-if="repliesContinuation" 
              class="load-more-replies"
              @click="loadMoreReplies"
              :disabled="isLoadingMoreReplies"
            >
              {{ isLoadingMoreReplies ? 'Loading...' : 'Show more replies' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { Comment } from "@/types/comments";
import { handleImageError } from "@/utils/helpers";

const props = defineProps<{
	comment: Comment;
	videoId: string;
	fetchRepliesFn: (
		commentId: string,
		continuation: string,
	) => Promise<{
		replies: Comment[];
		continuation?: string;
	}>;
	isReply?: boolean;
}>();

const showReplies = ref(false);
const replies = ref<Comment[]>([]);
const repliesContinuation = ref<string | undefined>();
const isLoadingReplies = ref(false);
const isLoadingMoreReplies = ref(false);

function getAuthorThumbnail() {
	const thumbnails = props.comment.authorThumbnails;
	if (!thumbnails.length) return "";
	// Get thumbnail closest to 48px
	const target = props.isReply ? 24 : 48;
	return thumbnails.reduce((prev, curr) =>
		Math.abs(curr.width - target) < Math.abs(prev.width - target) ? curr : prev,
	).url;
}

function formatLikeCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
	}
	if (count >= 1000) {
		return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
	}
	return count.toString();
}

async function toggleReplies() {
	if (showReplies.value) {
		showReplies.value = false;
		return;
	}

	showReplies.value = true;

	if (replies.value.length === 0 && props.comment.replies) {
		isLoadingReplies.value = true;
		try {
			const result = await props.fetchRepliesFn(
				props.comment.commentId,
				props.comment.replies.continuation,
			);
			replies.value = result.replies;
			repliesContinuation.value = result.continuation;
		} finally {
			isLoadingReplies.value = false;
		}
	}
}

async function loadMoreReplies() {
	if (!repliesContinuation.value || isLoadingMoreReplies.value) return;

	isLoadingMoreReplies.value = true;
	try {
		const result = await props.fetchRepliesFn(
			props.comment.commentId,
			repliesContinuation.value,
		);
		replies.value.push(...result.replies);
		repliesContinuation.value = result.continuation;
	} finally {
		isLoadingMoreReplies.value = false;
	}
}
</script>
