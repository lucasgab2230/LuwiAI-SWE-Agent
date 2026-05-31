import OpenAI from 'openai';
import config from '../config/index.js';
import type { AgentJob, AgentJobType } from '../types/index.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

interface AgentPrompt {
  systemPrompt: string;
  userPrompt: string;
}

function buildPrompt(type: string, input: Record<string, unknown>): AgentPrompt {
  const baseSystemPrompt = `You are LuwiAI, an expert software engineering AI agent. 
You help developers write, review, refactor, and understand code.
You are precise, thorough, and follow best practices.
Always provide complete, working code solutions.`;

  switch (type) {
    case 'code_review': {
      const { diff, language } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You are reviewing a pull request. Analyze the code changes for:
1. Bugs and potential issues
2. Security vulnerabilities
3. Performance concerns
4. Code style and best practices
5. Suggestions for improvement

Provide a structured review with:
- Summary of changes
- Specific issues found (with file paths and line numbers)
- Suggestions for improvement
- Overall assessment`,
        userPrompt: `Please review the following ${language || 'code'} diff:\n\n${diff}`,
      };
    }

    case 'code_generation': {
      const { description, language, existingCode } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You generate high-quality production-ready code.
Follow the existing code style and patterns.
Include proper error handling and edge cases.`,
        userPrompt: `Generate ${language || 'code'} for the following requirement:\n\n${description}\n\n${existingCode ? `Existing code context:\n${existingCode}` : ''}`,
      };
    }

    case 'bug_fix': {
      const { code, errorLog, language } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You are debugging code. Analyze the error and fix the issue.
Explain what caused the bug and how your fix resolves it.`,
        userPrompt: `Fix the bug in this ${language || 'code'}:\n\nCode:\n${code}\n\nError:\n${errorLog}`,
      };
    }

    case 'refactor': {
      const { code, instructions, language } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You refactor code to improve quality while preserving behavior.
Focus on: readability, performance, maintainability, and best practices.`,
        userPrompt: `Refactor this ${language || 'code'}:\n\n${code}\n\nInstructions: ${instructions || 'Improve code quality and structure'}`,
      };
    }

    case 'explain_code': {
      const { code, language } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You explain code clearly and comprehensively.
Break down complex logic, explain patterns used, and highlight key aspects.`,
        userPrompt: `Explain this ${language || 'code'}:\n\n${code}`,
      };
    }

    case 'pr_summary': {
      const { diff, title, description } = input;
      return {
        systemPrompt: `${baseSystemPrompt}
You summarize pull requests concisely.
Extract: purpose, key changes, impact, and potential risks.`,
        userPrompt: `Summarize this PR:\nTitle: ${title}\nDescription: ${description}\n\nDiff:\n${diff}`,
      };
    }

    default:
      return {
        systemPrompt: baseSystemPrompt,
        userPrompt: `Handle the following request:\n${JSON.stringify(input, null, 2)}`,
      };
  }
}

export async function processAgentJob(job: AgentJob): Promise<string> {
  const { systemPrompt, userPrompt } = buildPrompt(job.type, job.input);

  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 8192,
  });

  const result = response.choices[0]?.message?.content;

  if (!result) {
    throw new Error('AI agent returned empty response');
  }

  return result;
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: 'system',
        content: 'You generate concise, conventional commit messages based on code diffs. Return only the commit message.',
      },
      {
        role: 'user',
        content: `Generate a commit message for this diff:\n${diff}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() || 'Update code';
}

export async function suggestCodeFix(
  code: string,
  lintErrors: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: 'system',
        content: 'You fix code issues based on linting/compilation errors. Return only the fixed code, no explanations.',
      },
      {
        role: 'user',
        content: `Fix these issues in the code:\n\nCode:\n${code}\n\nErrors:\n${lintErrors}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content?.trim() || code;
}

export async function analyzeRepository(
  files: Array<{ path: string; content: string }>
): Promise<string> {
  const repoContext = files
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You analyze code repositories and provide insights about architecture, patterns, and potential improvements.',
      },
      {
        role: 'user',
        content: `Analyze this repository:\n\n${repoContext}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content?.trim() || 'Analysis complete';
}