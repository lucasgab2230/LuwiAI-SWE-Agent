import { Router } from 'express';
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

const WORKFLOW_YAML = yamlTemplate`
name: LuwiAI SWE Agent Automation

on:
  issue_comment:
    types: [created, edited]
  pull_request:
    types: [opened, synchronize]
  issues:
    types: [opened]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  luwiai-agent:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, 'luwiai-swe-agent')) ||
      (github.event_name == 'pull_request' && github.event.action == 'opened') ||
      (github.event_name == 'issues' && github.event.action == 'opened')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run LuwiAI SWE Agent
        uses: ./.github/actions/luwiai-swe-agent
        with:
          github-token: ${GITHUB_EXPR('secrets.GITHUB_TOKEN')}
          agent-api-url: ${GITHUB_EXPR('secrets.LUWIAI_API_URL')}
          openai-api-key: ${GITHUB_EXPR('secrets.LUWIAI_OPENAI_API_KEY')}
          openai-base-url: ${GITHUB_EXPR(`secrets.LUWIAI_OPENAI_BASE_URL || ''`)}
          openai-model: ${GITHUB_EXPR(`secrets.LUWIAI_OPENAI_MODEL || 'gpt-4o'`)}
`;

const ACTION_YML = yamlTemplate`
name: "LuwiAI SWE Agent"
description: "Automate code reviews, generate code from issues, and provide PR suggestions."
author: "luwiai-swe-agent"

inputs:
  github-token:
    description: "GitHub token with repo and issues permissions"
    required: true
  agent-api-url:
    description: "LuwiAI agent API base URL"
    required: true
  openai-api-key:
    description: "OpenAI API key for the agent"
    required: true
  openai-base-url:
    description: "OpenAI API base URL (compatible endpoint)"
    required: false
    default: ""
  openai-model:
    description: "OpenAI model to use"
    required: false
    default: "gpt-4o"

runs:
  using: "composite"
  steps:
    - name: "Checkout repository"
      uses: actions/checkout@v4

    - name: "Setup Node.js"
      uses: actions/setup-node@v4
      with:
        node-version: "22"

    - name: "Authenticate with LuwiAI agent"
      id: auth
      shell: bash
      env:
        GITHUB_TOKEN: ${GITHUB_EXPR('inputs.github-token')}
        AGENT_API_URL: ${GITHUB_EXPR('inputs.agent-api-url')}
      run: |
        RESPONSE=$(curl -s -X POST "$AGENT_API_URL/auth/github" \\
          -H "Content-Type: application/json" \\
          -d '{"code": "'"$GITHUB_TOKEN"'"}')
        echo "token=$(echo $RESPONSE | jq -r '.token')" >> $GITHUB_OUTPUT

    - name: "Run agent action"
      shell: bash
      env:
        AGENT_API_URL: ${GITHUB_EXPR('inputs.agent-api-url')}
        AGENT_TOKEN: ${GITHUB_EXPR('steps.auth.outputs.token')}
        OPENAI_API_KEY: ${GITHUB_EXPR('inputs.openai-api-key')}
        OPENAI_BASE_URL: ${GITHUB_EXPR('inputs.openai-base-url')}
        OPENAI_MODEL: ${GITHUB_EXPR('inputs.openai-model')}
      run: |
        EVENT_TYPE=""
        if [ "${GITHUB_EXPR('github.event_name')}" = "issue_comment" ]; then
          echo "${GITHUB_EXPR('github.event.comment.body')}" | grep -qi "luwiai-swe-agent" && EVENT_TYPE="mention"
        elif [ "${GITHUB_EXPR('github.event_name')}" = "pull_request" ] && [ "${GITHUB_EXPR('github.event.action')}" = "opened" ]; then
          EVENT_TYPE="pr_opened"
        fi
        echo "Event: $EVENT_TYPE"
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
      ],
      secrets: [
        {
          name: 'LUWIAI_API_URL',
          description: 'LuwiAI agent API base URL',
          required: true,
        },
        {
          name: 'LUWIAI_OPENAI_API_KEY',
          description: 'OpenAI API key for the agent',
          required: true,
        },
        {
          name: 'LUWIAI_OPENAI_BASE_URL',
          description: 'OpenAI API base URL (optional)',
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