export {
  countPostsByService,
  estimateReadingTime,
  formatPostDate,
  otherPosts,
  postsForService,
  type BlogPost,
  type BlogSection,
} from "./types";
export { blogRepository, type BlogRepository } from "./repository";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { blogRepository } from "./repository";
import { translatePost, translatePosts } from "./translate";
import { postsForService, type BlogPost } from "./types";

// Только для серверных компонентов: модуль тянет за собой тексты всех статей
// и их переводы. Клиентским компонентам нужное лежит в ./types.

/** Все статьи на нужном языке — для /blog и для страниц услуг. */
export async function getAllPosts(locale: Locale = DEFAULT_LOCALE): Promise<BlogPost[]> {
  return translatePosts(await blogRepository.list(), locale);
}

/** На вход — русский слуг: он идентификатор статьи в данных. */
export async function getPostBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<BlogPost | undefined> {
  const post = await blogRepository.bySlug(slug);
  return post && translatePost(post, locale);
}

/** Статьи, которые показываются на странице услуги. */
export async function getPostsForService(
  serviceKey: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<BlogPost[]> {
  return postsForService(await getAllPosts(locale), serviceKey);
}
