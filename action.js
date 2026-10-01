import * as core from '@actions/core';
import Arn from './arn.js';
import Jira from './jira.js';

const jira = new Jira({
  baseUrl: process.env.JIRA_BASEURL,
  email: process.env.JIRA_EMAIL,
  token: process.env.JIRA_TOKEN,
});

//Anne's ARN webhook url
const webhookUrl = 'https://arn.upraise.io/arn/executewebhook/44998/fd803c08-6778-43bb-a5fc-66a3768447ac';
const arn = new Arn({webhookUrl});

// 1. update JIRA issues
// 2. send a webhook to the ARN (Automated release notes) - JIRA app -
//    with the componentName-tagName label
async function exec ({ issueIds, componentName, tagName, releaseDate, notifyUsers }) {
  try {
    console.log({ issueIds, componentName, tagName, releaseDate });

    if (issueIds.length === 0) {
      console.log('No Jira issues given, do nothing');

      return
    }

    const errors = await jira.updateIssues({
      issueIds,
      componentName,
      tagName,
      releaseDate,
      notifyUsers,
    });

    if (errors.length === 0) {
      console.log(`Updated successfully update following Jira issues: ${issueIds}`);
    } else {
      console.log(`Failed to update some Jira tickets: ${errors}`);
    }

    await arn.callWebhook( `${componentName}-${tagName}` );

  } catch (error) {
    console.error(error);
    process.exit(1)
  }
}

function parseArgs() {
  return {
    issueIds: filterIssueIds(core.getInput('issueIds')),
    componentName: core.getInput('componentName'),
    tagName: core.getInput('tagName') || process.env.TAGNAME,
    releaseDate: core.getInput('releaseDate') ? new Date(core.getInput('releaseDate')) : new Date(),
    notifyUsers: core.getInput('notifyUsers') === 'true',
  }
}

function filterIssueIds(issueIdsStr) {
  const filtered = issueIdsStr
    .split(',')
    .map((issueId) => issueId.trim())
    .map((issueId) => issueId.replace(/"/g, ''))
    .filter((issueId) => issueId !== '' &&
      !issueId.includes('-00'));

  filtered.sort();

  return filtered
}

export { exec, parseArgs, filterIssueIds };
