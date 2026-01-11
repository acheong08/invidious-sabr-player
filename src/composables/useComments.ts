import { ref } from 'vue';

export function useComments() {
  const commentsHtml = ref<string>('');
  const isLoading = ref(false);
  const commentCount = ref<number>(0);
  const currentVideoId = ref<string>('');

  async function fetchComments(videoId: string) {
    isLoading.value = true;
    currentVideoId.value = videoId;
    
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

  async function getYoutubeReplies(target: HTMLElement, loadMore: boolean, loadReplies: boolean) {
    const continuation = target.getAttribute('data-continuation');
    if (!continuation) return;

    const body = target.parentElement?.parentElement as HTMLElement;
    if (!body) return;

    const fallback = body.innerHTML;
    body.innerHTML = '<p style="text-align:center;color:#aaa;">Loading...</p>';

    try {
      let url = `/api/v1/comments/${currentVideoId.value}?format=html&hl=en-US&thin_mode=false&continuation=${continuation}`;
      if (loadReplies) {
        url += '&action=action_get_comment_replies';
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        body.innerHTML = fallback;
        return;
      }

      const data = await response.json();

      if (loadMore) {
        // For "Load more" - go up to parent container and append
        const parentContainer = body.parentElement?.parentElement as HTMLElement;
        if (parentContainer) {
          body.parentElement?.removeChild(body);
          parentContainer.insertAdjacentHTML('beforeend', data.contentHtml);
          setupEventListeners(parentContainer);
        }
      } else {
        // For "View replies" - replace content and add hide button
        body.innerHTML = '';
        
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.textContent = 'Hide replies';
        a.setAttribute('data-sub-text', 'Hide replies');
        a.setAttribute('data-inner-text', target.textContent || 'Show replies');
        a.onclick = (e) => hideYoutubeReplies(e);
        p.appendChild(a);
        
        const div = document.createElement('div');
        div.innerHTML = data.contentHtml;
        
        body.appendChild(p);
        body.appendChild(div);
        setupEventListeners(body);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
      body.innerHTML = fallback;
    }
  }

  function hideYoutubeReplies(event: Event) {
    const target = event.target as HTMLElement;
    const subText = target.getAttribute('data-inner-text');
    const innerText = target.getAttribute('data-sub-text');

    const body = target.parentElement?.parentElement?.children[1] as HTMLElement;
    if (body) {
      body.style.display = 'none';
    }

    target.textContent = subText;
    target.onclick = (e) => showYoutubeReplies(e);
    target.setAttribute('data-inner-text', innerText || '');
    target.setAttribute('data-sub-text', subText || '');
  }

  function showYoutubeReplies(event: Event) {
    const target = event.target as HTMLElement;
    const subText = target.getAttribute('data-inner-text');
    const innerText = target.getAttribute('data-sub-text');

    const body = target.parentElement?.parentElement?.children[1] as HTMLElement;
    if (body) {
      body.style.display = '';
    }

    target.textContent = subText;
    target.onclick = (e) => hideYoutubeReplies(e);
    target.setAttribute('data-inner-text', innerText || '');
    target.setAttribute('data-sub-text', subText || '');
  }

  function setupEventListeners(container: HTMLElement) {
    // Handle elements with data-onclick="get_youtube_replies"
    const replyButtons = container.querySelectorAll('[data-onclick="get_youtube_replies"]');
    replyButtons.forEach((button) => {
      const link = button as HTMLAnchorElement;
      // Remove existing listeners by cloning
      const newLink = link.cloneNode(true) as HTMLAnchorElement;
      link.parentNode?.replaceChild(newLink, link);
      
      newLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const loadMore = newLink.hasAttribute('data-load-more');
        const loadReplies = newLink.hasAttribute('data-load-replies');
        await getYoutubeReplies(newLink, loadMore, loadReplies);
      });
    });

    // Handle timestamp links with data-onclick="jump_to_time"
    const timeLinks = container.querySelectorAll('[data-onclick="jump_to_time"]');
    timeLinks.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      const newAnchor = anchor.cloneNode(true) as HTMLAnchorElement;
      anchor.parentNode?.replaceChild(newAnchor, anchor);
      
      newAnchor.addEventListener('click', (e) => {
        e.preventDefault();
        const jumpTime = newAnchor.getAttribute('data-jump-time');
        if (jumpTime) {
          // Dispatch a custom event that the video player can listen to
          window.dispatchEvent(new CustomEvent('seekTo', { detail: parseInt(jumpTime) }));
        }
      });
    });
  }

  return {
    commentsHtml,
    isLoading,
    commentCount,
    fetchComments,
    setupEventListeners
  };
}
