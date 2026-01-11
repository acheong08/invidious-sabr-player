import { ref } from 'vue';

export function useComments() {
  const commentsHtml = ref<string>('');
  const isLoading = ref(false);
  const commentCount = ref<number>(0);

  async function fetchComments(videoId: string) {
    isLoading.value = true;
    
    try {
      const url = `/api/v1/comments/${videoId}?format=html&hl=en-US&thin_mode=false`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      commentsHtml.value = data.contentHtml || '';
      commentCount.value = data.commentCount || 0;
    } catch (error) {
      console.error('Error fetching comments:', error);
      commentsHtml.value = '';
      commentCount.value = 0;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    commentsHtml,
    isLoading,
    commentCount,
    fetchComments
  };
}
