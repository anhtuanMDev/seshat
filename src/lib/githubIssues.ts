export interface SeshatIssue {
  number: number;
  title: string;
  body: string;
  author: string;
  type: "bug" | "recommendation" | "discussion";
  state: "open" | "closed";
  createdAt: string;
  githubUrl: string;
  commentsCount: number;
}

export interface SeshatComment {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

export function parseMetaBody(rawBody: string | null): { author: string; cleanBody: string } {
  if (!rawBody) return { author: "Anonymous", cleanBody: "" };
  const match = rawBody.match(/<!-- seshat-metadata ({.*?}) -->/);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const cleanBody = rawBody.replace(match[0], "").trim();
      return { author: meta.author || "Anonymous", cleanBody };
    } catch {
      // ignore
    }
  }
  return { author: "Anonymous", cleanBody: rawBody.trim() };
}

interface GithubLabel {
  name: string;
}

interface GithubIssuePayload {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  created_at: string;
  html_url: string;
  comments: number;
  labels: GithubLabel[];
}

interface GithubCommentPayload {
  id: number;
  body: string | null;
  created_at: string;
}

export const fetchIssues = async (token: string): Promise<SeshatIssue[]> => {
  const response = await fetch(`/api/github/issues?token=${encodeURIComponent(token)}&t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const rawIssues = (await response.json()) as GithubIssuePayload[];
  return rawIssues.map((issue) => {
    const { author, cleanBody } = parseMetaBody(issue.body);
    const typeLabel = issue.labels.find((l) => l.name !== "seshat")?.name;
    const type = (typeLabel === "bug" || typeLabel === "recommendation" || typeLabel === "discussion") 
      ? typeLabel 
      : "discussion";

    return {
      number: issue.number,
      title: issue.title,
      body: cleanBody,
      author,
      type,
      state: issue.state,
      createdAt: issue.created_at,
      githubUrl: issue.html_url,
      commentsCount: issue.comments,
    };
  });
};

export const fetchIssueDetail = async (
  token: string,
  issueNumber: number,
): Promise<{ issue: SeshatIssue; comments: SeshatComment[] }> => {
  const response = await fetch(`/api/github/issues?token=${encodeURIComponent(token)}&number=${issueNumber}&t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as { issue: GithubIssuePayload; comments: GithubCommentPayload[] };
  const { author: issueAuthor, cleanBody: issueCleanBody } = parseMetaBody(data.issue.body);
  const typeLabel = data.issue.labels.find((l) => l.name !== "seshat")?.name;
  const type = (typeLabel === "bug" || typeLabel === "recommendation" || typeLabel === "discussion") 
    ? typeLabel 
    : "discussion";

  const issue: SeshatIssue = {
    number: data.issue.number,
    title: data.issue.title,
    body: issueCleanBody,
    author: issueAuthor,
    type,
    state: data.issue.state,
    createdAt: data.issue.created_at,
    githubUrl: data.issue.html_url,
    commentsCount: data.issue.comments,
  };

  const comments: SeshatComment[] = data.comments.map((c) => {
    const { author, cleanBody } = parseMetaBody(c.body);
    return {
      id: c.id,
      body: cleanBody,
      author,
      createdAt: c.created_at,
    };
  });

  return { issue, comments };
};

export const createIssue = async (
  token: string,
  title: string,
  body: string,
  type: "bug" | "recommendation" | "discussion",
): Promise<SeshatIssue> => {
  const response = await fetch("/api/github/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, title, body, type }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const issue = (await response.json()) as GithubIssuePayload;
  const { author, cleanBody } = parseMetaBody(issue.body);

  return {
    number: issue.number,
    title: issue.title,
    body: cleanBody,
    author,
    type,
    state: issue.state,
    createdAt: issue.created_at,
    githubUrl: issue.html_url,
    commentsCount: issue.comments,
  };
};

export const createComment = async (
  token: string,
  issueNumber: number,
  body: string,
): Promise<SeshatComment> => {
  const response = await fetch("/api/github/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, issueNumber, body }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const comment = (await response.json()) as GithubCommentPayload;
  const { author, cleanBody } = parseMetaBody(comment.body);

  return {
    id: comment.id,
    body: cleanBody,
    author,
    createdAt: comment.created_at,
  };
};
