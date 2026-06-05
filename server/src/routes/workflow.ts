import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function yamlTemplate(strings: TemplateStringsArray, ...values: string[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

const GITHUB_EXPR = (expr: string) => `\${{ ${expr} }}`;
const ACTION_SCRIPT_URL = new URL(
  '../../../.github/actions/luwiai-swe-agent/run-agent.mjs',
  import.meta.url
);

const WORKFLOW_YAML = yamlTemplate`
name: LuwiAI SWE Agent Automation

on:
  issue_comment:
    types: [created, edited]
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  luwiai-agent:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, 'luwiai-swe-agent')) ||
      (github.event_name == 'pull_request' && (github.event.action == 'opened' || github.event.action == 'synchronize'))
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run LuwiAI SWE Agent
        uses: ./.github/actions/luwiai-swe-agent
        with:
          github-token: ${GITHUB_EXPR('secrets.GITHUB_TOKEN')}
          openai-api-key: ${GITHUB_EXPR('secrets.LUWIAI_OPENAI_API_KEY')}
          openai-base-url: ${GITHUB_EXPR(`secrets.LUWIAI_OPENAI_BASE_URL || ''`)}
          openai-model: ${GITHUB_EXPR(`secrets.LUWIAI_OPENAI_MODEL || 'gpt-4o'`)}
`;

const ACTION_YML = yamlTemplate`
name: "LuwiAI SWE Agent"
description: "Automate code reviews, generate issue suggestions, and provide PR feedback directly in GitHub Actions."
author: "luwiai-swe-agent"

inputs:
  github-token:
    description: "GitHub token with repo and issues permissions"
    required: true
  openai-api-key:
    description: "OpenAI or OpenAI-compatible API key for the agent"
    required: true
  openai-base-url:
    description: "OpenAI-compatible API base URL"
    required: false
    default: "https://api.openai.com/v1"
  openai-model:
    description: "OpenAI-compatible model to use"
    required: false
    default: "gpt-4o"

runs:
  using: "composite"
  steps:
    - name: "Setup Node.js"
      uses: actions/setup-node@v4
      with:
        node-version: "22"

    - name: "Run LuwiAI SWE Agent"
      shell: bash
      env:
        GH_TOKEN: ${GITHUB_EXPR('inputs.github-token')}
        OPENAI_API_KEY: ${GITHUB_EXPR('inputs.openai-api-key')}
        OPENAI_BASE_URL: ${GITHUB_EXPR('inputs.openai-base-url')}
        OPENAI_MODEL: ${GITHUB_EXPR('inputs.openai-model')}
      run: node "$GITHUB_ACTION_PATH/run-agent.mjs"
`;

router.get('/install', authenticateToken, async (_req, res) => {
  try {
    res.json({
      files: [
        {
          path: '.github/workflows/luwiai-automation.yml',
          content: WORKFLOW_YAML.trimStart(),
        },
        {
          path: '.github/actions/luwiai-swe-agent/action.yml',
          content: ACTION_YML.trimStart(),
        },
        {
          path: '.github/actions/luwiai-swe-agent/run-agent.mjs',
          content: readFileSync(ACTION_SCRIPT_URL, 'utf8'),
        },
      ],
      secrets: [
        {
          name: 'LUWIAI_OPENAI_API_KEY',
          description: 'OpenAI or OpenAI-compatible API key for the agent',
          required: true,
        },
        {
          name: 'LUWIAI_OPENAI_BASE_URL',
          description: 'OpenAI-compatible API base URL (optional, for example OpenRouter)',
          required: false,
        },
        {
          name: 'LUWIAI_OPENAI_MODEL',
          description: 'OpenAI model (default: gpt-4o)',
          required: false,
        },
      ],
    });
  } catch (error) {
    console.error('Error generating workflow:', error);
    res.status(500).json({ error: 'Failed to generate workflow' });
  }
});

export default router;
