import { env } from "../env.js";

/**
 * Публикация: снапшот контента уезжает в репозиторий одним коммитом через Git
 * Data API (blobs → tree → commit → ref), после чего GitHub Actions пересобирает
 * статику и заливает её на хостинг. Один коммит — значит, сборка никогда не
 * увидит cases.json без картинок, на которые он ссылается.
 *
 * Токен живёт только здесь, на сервере, и в браузер не попадает.
 */
const API = "https://api.github.com";

export interface CommitFile {
  path: string;
  text?: string;
  binary?: Buffer;
}

async function gh<T>(suffix: string, init?: RequestInit): Promise<T> {
  const response = await fetch(
    `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${suffix}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

export interface CommitResult {
  sha: string;
  commitUrl: string;
  buildUrl: string;
}

export async function commitSnapshot(
  message: string,
  files: CommitFile[],
): Promise<CommitResult> {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${env.GITHUB_BRANCH}`);
  const headSha = ref.object.sha;
  const head = await gh<{ tree: { sha: string } }>(`/git/commits/${headSha}`);

  const tree: Array<Record<string, unknown>> = [];
  for (const file of files) {
    if (file.binary) {
      const blob = await gh<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: JSON.stringify({
          content: file.binary.toString("base64"),
          encoding: "base64",
        }),
      });
      tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    } else {
      tree.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.text ?? "",
      });
    }
  }

  const newTree = await gh<{ sha: string }>("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: head.tree.sha, tree }),
  });

  const commit = await gh<{ sha: string }>("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  });

  await gh(`/git/refs/heads/${env.GITHUB_BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  const repo = `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  return {
    sha: commit.sha,
    commitUrl: `https://github.com/${repo}/commit/${commit.sha}`,
    buildUrl: `https://github.com/${repo}/actions`,
  };
}
