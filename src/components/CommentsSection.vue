<style scoped>
.comments-section {
  margin-top: 24px;
  width: 100%;
}

.comments-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.comment-count {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.sort-buttons {
  display: flex;
  gap: 8px;
}

.sort-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 18px;
  transition: background-color 0.2s;
}

.sort-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sort-btn.active {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.comments-list {
  border-top: 1px solid #3f3f3f;
}

.loading,
.error {
  text-align: center;
  padding: 24px;
  color: #aaa;
  font-size: 14px;
}

.error {
  color: #f44;
}

.load-more {
  display: block;
  width: 100%;
  background: none;
  border: 1px solid #3f3f3f;
  color: #3ea6ff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 12px;
  border-radius: 18px;
  margin-top: 16px;
  transition: background-color 0.2s;
}

.load-more:hover:not(:disabled) {
  background-color: rgba(62, 166, 255, 0.1);
}

.load-more:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>

<template>
  <div class="comments-section">
    <div class="comments-header">
      <span class="comment-count" v-if="commentCount !== undefined">
        {{ formatCommentCount(commentCount) }} Comments
      </span>
      <div class="sort-buttons">
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'top' }"
          @click="setSortBy('top')"
        >
          Top
        </button>
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'new' }"
          @click="setSortBy('new')"
        >
          Newest
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Loading comments...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="comments.length > 0" class="comments-list">
      <CommentItem 
        v-for="comment in comments" 
        :key="comment.commentId"
        :comment="comment"
        :video-id="videoId"
        :fetch-replies-fn="fetchReplies"
      />
      <button 
        v-if="continuation" 
        class="load-more"
        @click="loadMore"
        :disabled="isLoadingMore"
      >
        {{ isLoadingMore ? 'Loading...' : 'Load more comments' }}
      </button>
    </div>
    <div v-else class="loading">No comments yet</div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from "vue";
import CommentItem from "@/components/CommentItem.vue";
import { useComments } from "@/composables/useComments";

const props = defineProps<{
	videoId: string;
}>();

const {
	comments,
	isLoading,
	isLoadingMore,
	commentCount,
	continuation,
	error,
	sortBy,
	fetchComments,
	loadMore,
	fetchReplies,
	setSortBy,
} = useComments(props.videoId);

function formatCommentCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
	}
	if (count >= 1000) {
		return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
	}
	return count.toLocaleString();
}

watch(
	() => props.videoId,
	() => {
		fetchComments(true);
	},
);

onMounted(() => {
	fetchComments();
});
</script>
