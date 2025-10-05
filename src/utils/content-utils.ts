import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		if (!import.meta.env.PROD) {
			// 开发环境下显示所有文章（包括草稿和未到发布时间的文章）
			return true;
		}
		
		// 生产环境下：
		// 1. 不是草稿
		// 2. 如果设置了publishAt，需要当前时间已经到达或超过publishAt时间
		const isNotDraft = data.draft !== true;
		const isPublished = !data.publishAt || new Date(data.publishAt) <= new Date();
		
		return isNotDraft && isPublished;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		// 使用publishAt作为排序依据（如果存在），否则使用published
		const dateA = new Date(a.data.publishAt || a.data.published);
		const dateB = new Date(b.data.publishAt || b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		if (!import.meta.env.PROD) {
			return true;
		}
		const isNotDraft = data.draft !== true;
		const isPublished = !data.publishAt || new Date(data.publishAt) <= new Date();
		return isNotDraft && isPublished;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		if (!import.meta.env.PROD) {
			return true;
		}
		const isNotDraft = data.draft !== true;
		const isPublished = !data.publishAt || new Date(data.publishAt) <= new Date();
		return isNotDraft && isPublished;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	// Sort categories
	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}

	return ret;
}

/**
 * Get featured posts
 * @param limit Maximum number of posts to return
 * @param featuredTag Optional tag to identify featured posts
 * @returns Array of featured posts
 */
export async function getFeaturedPosts(
	limit = 3,
	featuredTag = "Featured",
): Promise<CollectionEntry<"posts">[]> {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		// Include posts that are not drafts, published (if publishAt is set), and either:
		// 1. Have a 'featured' field set to true, or
		// 2. Have the featuredTag in their tags array
		const isNotDraft = import.meta.env.PROD ? data.draft !== true : true;
		const isPublished = !import.meta.env.PROD || !data.publishAt || new Date(data.publishAt) <= new Date();
		const isFeatured = (data as any).featured === true || data.tags?.includes(featuredTag);
		return isNotDraft && isPublished && isFeatured;
	});

	// Sort by publication date (newest first), using publishAt if available
	return allBlogPosts
		.sort((a, b) => {
			const dateA = new Date(a.data.publishAt || a.data.published);
			const dateB = new Date(b.data.publishAt || b.data.published);
			return dateA > dateB ? -1 : 1;
		})
		.slice(0, limit);
}

/**
 * Get related posts based on tags
 * @param currentPost The current post
 * @param limit Maximum number of posts to return
 * @returns Array of related posts
 */
export async function getRelatedPosts(
	currentPost: CollectionEntry<"posts">,
	limit = 3,
): Promise<CollectionEntry<"posts">[]> {
	const allBlogPosts = await getCollection("posts", ({ data, slug }) => {
		// Exclude drafts, unpublished (if publishAt is set), and the current post
		const isNotDraft = import.meta.env.PROD ? data.draft !== true : true;
		const isPublished = !import.meta.env.PROD || !data.publishAt || new Date(data.publishAt) <= new Date();
		const isNotCurrentPost = slug !== currentPost.slug;
		return isNotDraft && isPublished && isNotCurrentPost;
	});

	// Calculate similarity score based on common tags
	const postsWithScore = allBlogPosts.map((post) => {
		const commonTags = currentPost.data.tags.filter((tag) =>
			post.data.tags?.includes(tag),
		);
		return {
			post,
			score: commonTags.length,
		};
	});

	// Sort by similarity score (highest first) and then by publication date
	return postsWithScore
		.filter((item) => item.score > 0) // Only include posts with at least one common tag
		.sort((a, b) => {
			if (a.score !== b.score) {
				return b.score - a.score;
			}
				// If scores are equal, sort by publication date (newest first), using publishAt if available
			const dateA = new Date(a.post.data.publishAt || a.post.data.published);
			const dateB = new Date(b.post.data.publishAt || b.post.data.published);
			return dateA > dateB ? -1 : 1;
		})
		.slice(0, limit)
		.map((item) => item.post);
}
