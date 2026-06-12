import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY;
const eventName = process.env.GITHUB_EVENT_NAME;
const eventPath = process.env.GITHUB_EVENT_PATH;
const githubToken = process.env.GH_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;
const openaiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

if (!repo || !eventName || !eventPath) {
  fail('Missing GitHub Actions event environment.');
}

if (!githubToken) {
  fail('Missing github-token input.');
}

if (!openaiKey) {
  fail('LUWIAI_OPENAI_API_KEY is required.');
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const context = resolveEventContext(eventName, event);

if (!context) {
  console.log('No relevant event detected. Skipping.');
  process.exit(0);
}

console.log(`Event type: ${context.eventType}`);

const output = await generateAgentOutput(context);
await publishOutput(context, output);

function resolveEventContext(name, payload) {
  if (name === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    return {
      eventType: 'pr_opened',
      prNumber: payload.pull_request.number,
      title: payload.pull_request.title || '',
      body: payload.pull_request.body || '',
    };
  }

  if (name !== 'issue_comment') {
    return null;
  }

  const commentBody = payload.comment?.body || '';
  if (!commentBody.toLowerCase().includes('luwiai-swe-agent')) {
    return null;
  }

  if (payload.issue?.pull_request) {
    return {
      eventType: 'pr_mention',
      prNumber: payload.issue.number,
      commentBody,
      title: payload.issue.title || '',
      body: payload.issue.body || '',
    };
  }

  return {
    eventType: 'issue_mention',
    issueNumber: payload.issue.number,
    commentBody,
    title: payload.issue.title || '',
    body: payload.issue.body || '',
  };
}

async function generateAgentOutput(context) {
  if (context.eventType === 'issue_mention') {
    return callModel({
      system: `You are LuwiAI, an expert software engineering AI agent.
Generate a practical implementation plan and code guidance for a GitHub issue.
Be specific, concise, and include file-level suggestions when possible.`,
      user: `Repository: ${repo}
Issue #${context.issueNumber}: ${context.title}

Issue body:
${context.body || '(empty)'}

User comment:
${context.commentBody}`,
    });
  }

  const diff = getPullRequestDiff(context.prNumber);
  const instruction =
    context.eventType === 'pr_mention'
      ? `The user mentioned @luwiai-swe-agent on this PR. Provide targeted improvement suggestions based on the comment and diff.`
      : `Review this pull request for bugs, security issues, performance concerns, and maintainability risks.`;

  return callModel({
    system: `You are LuwiAI, an expert software engineering AI agent.
You review pull requests with precise, actionable feedback.
Prioritize concrete bugs and risks. Include file paths when the diff makes them clear.`,
    user: `Repository: ${repo}
Pull request #${context.prNumber}: ${context.title}

PR body:
${context.body || '(empty)'}

${context.commentBody ? `User comment:\n${context.commentBody}\n\n` : ''}${instruction}

Diff:
${diff}`,
  });
}

function getPullRequestDiff(prNumber) {
  return execFileSync(
    'gh',
    ['api', `repos/${repo}/pulls/${prNumber}`, '--header', 'Accept: application/vnd.github.v3.diff'],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
}

async function callModel({ system, user }) {
  const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openaiModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    fail(`Model request failed with HTTP ${response.status}: ${text}`);
  }

  const data = JSON.parse(text);
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    fail('Model returned an empty response.');
  }

  return content;
}

async function publishOutput(context, output) {
  if (context.eventType === 'issue_mention') {
    execFileSync('gh', [
      'issue',
      'comment',
      String(context.issueNumber),
      '--repo',
      repo,
      '--body',
      `**LuwiAI SWE Agent**\n\n${output}`,
    ]);
    return;
  }

  if (context.eventType === 'pr_mention') {
    execFileSync('gh', [
      'pr',
      'comment',
      String(context.prNumber),
      '--repo',
      repo,
      '--body',
      `**LuwiAI SWE Agent**\n\n${output}`,
    ]);
    return;
  }

  try {
    execFileSync('gh', [
      'pr',
      'review',
      String(context.prNumber),
      '--repo',
      repo,
      '--comment',
      '--body',
      `**LuwiAI Code Review**\n\n${output}`,
    ]);
  } catch {
    execFileSync('gh', [
      'pr',
      'comment',
      String(context.prNumber),
      '--repo',
      repo,
      '--body',
      `**LuwiAI Code Review**\n\n${output}`,
    ]);
  }
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}
