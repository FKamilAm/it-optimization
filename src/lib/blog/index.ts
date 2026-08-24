export {
  countPostsByService,
  estimateReadingTime,
  formatPostDate,
  formatReadingTime,
  otherPosts,
  postsForService,
  type BlogPost,
  type BlogSection,
} from "./types";
export { blogRepository, type BlogRepository } from "./repository";

import { blogRepository } from "./repository";
import { postsForService, type BlogPost } from "./types";

/** Все статьи — для /blog и для страниц услуг. */
export function getAllPosts(): Promise<BlogPost[]> {
  return blogRepository.list();
}

export function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return blogRepository.bySlug(slug);
}

/** Статьи, которые показываются на странице услуги. */
export async function getPostsForService(serviceKey: string): Promise<BlogPost[]> {
  return postsForService(await blogRepository.list(), serviceKey);
}
