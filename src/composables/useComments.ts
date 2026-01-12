import { ref } from 'vue';
import type {
  Comment,
  CommentSortBy,
  CommentsResponse
} from '@/types/comments';

export function useComments(videoId: string) {
  const comments = ref<Comment[]>([]);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const commentCount = ref<number | undefined>();
  const continuation = ref<string | undefined>();
  const error = ref<string | undefined>();
  const sortBy = ref<CommentSortBy>('top');

  async function fetchComments(reset = false) {
    if (reset) {
      comments.value = [];
      continuation.value = undefined;
      error.value = undefined;
    }

    isLoading.value = true;

    try {
      const params = new URLSearchParams({
        sort_by: sortBy.value
      });

      const response = await fetch(
        `/api/v1/comments/${videoId}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: CommentsResponse = await response.json();
      comments.value = data.comments;
      commentCount.value = data.commentCount;
      continuation.value = data.continuation;
    } catch (err) {
      console.error('Error fetching comments:', err);
      error.value = 'Failed to load comments';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMore() {
    if (!continuation.value || isLoadingMore.value) return;

    isLoadingMore.value = true;

    try {
      const params = new URLSearchParams({
        sort_by: sortBy.value,
        continuation: continuation.value
      });

      const response = await fetch(
        `/api/v1/comments/${videoId}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch more comments');
      }

      const data: CommentsResponse = await response.json();
      comments.value.push(...data.comments);
      continuation.value = data.continuation;
    } catch (err) {
      console.error('Error loading more comments:', err);
    } finally {
      isLoadingMore.value = false;
    }
  }

  async function fetchReplies(_commentId: string, replyContinuation: string) {
    try {
      const params = new URLSearchParams({
        continuation: replyContinuation
      });

      const response = await fetch(
        `/api/v1/comments/${videoId}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }

      const data: CommentsResponse = await response.json();
      return {
        replies: data.comments,
        continuation: data.continuation
      };
    } catch (err) {
      console.error('Error fetching replies:', err);
      return { replies: [], continuation: undefined };
    }
  }

  function setSortBy(sort: CommentSortBy) {
    if (sort !== sortBy.value) {
      sortBy.value = sort;
      fetchComments(true);
    }
  }

  return {
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
    setSortBy
  };
}
