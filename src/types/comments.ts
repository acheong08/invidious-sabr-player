export interface AuthorThumbnail {
	url: string;
	width: number;
	height: number;
}

export interface CreatorHeart {
	creatorThumbnail: string;
	creatorName: string;
}

export interface CommentReplies {
	replyCount: number;
	continuation: string;
}

export interface Comment {
	author: string;
	authorThumbnails: AuthorThumbnail[];
	authorId: string;
	authorUrl: string;
	isEdited: boolean;
	isPinned: boolean;
	isSponsor?: boolean;
	sponsorIconUrl?: string;
	content: string;
	contentHtml: string;
	published: number;
	publishedText: string;
	likeCount: number;
	commentId: string;
	authorIsChannelOwner: boolean;
	creatorHeart?: CreatorHeart;
	replies?: CommentReplies;
}

export interface CommentsResponse {
	commentCount?: number;
	videoId: string;
	comments: Comment[];
	continuation?: string;
}

export type CommentSortBy = 'top' | 'new';
export type CommentSource = 'youtube' | 'reddit';
