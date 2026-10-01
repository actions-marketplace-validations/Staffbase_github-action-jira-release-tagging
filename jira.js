class Jira {
  constructor ({ baseUrl, token, email }) {
    this.baseUrl = baseUrl || 'https://mitarbeiterapp.atlassian.net';
    this.email = email || '';
    this.token = token
  }

  async getIssue (issueId) {
    //console.log('getIssue ' + issueId + ' with baseURL  ' + this.baseUrl);
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.email}:${this.token}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await response.text();

      throw new Error(errorMsg)
    }

    return response.json()
  }

  async getIssueOrSubtaskParentIssue (issueId) {
    let issue = await this.getIssue(issueId);

    if (issue.fields.issuetype.subtask) {
      const parentIssueId = issue.fields.parent.key;
      console.log("Update parent story: " + parentIssueId + " instead sub-task: " +issueId);
      issue = await this.getIssue(parentIssueId);
    }

    return issue;
  }

  async updateIssues ({ issueIds, releaseDate, tagName, componentName, notifyUsers = false }) {
    const calls = issueIds.map(async (issueId) => {
      try {
        const issue = await this.getIssueOrSubtaskParentIssue(issueId);

        let issueReleaseDate = releaseDate;

        if (issue.fields.customfield_11108) {
          const oldReleaseDate = new Date(issue.fields.customfield_11108);

          if (oldReleaseDate > issueReleaseDate) {
            issueReleaseDate = oldReleaseDate
          }
        }

        await this.updateIssue({ issue, releaseDate: issueReleaseDate, tagName, componentName, notifyUsers });

        return null
      } catch (ex) {
        return `Unable to update ${issueId}: ${ex.message}`
      }
    });

    const results = await Promise.all(calls);

    return results.filter((item) => !!item)
  }

  // PUT /rest/api/3/issue/{issueIdOrKey}
  // see: https://developer.atlassian.com/cloud/jira/platform/rest/v3/?utm_source=%2Fcloud%2Fjira%2Fplatform%2Frest%2F&utm_medium=302#api-rest-api-3-issue-issueIdOrKey-put
  async updateIssue ({ issue, releaseDate, tagName, componentName, notifyUsers }) {
    const issueId = issue.key;
    //console.log('Updating ' + issueId);
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueId}?notifyUsers=${notifyUsers}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.email}:${this.token}`).toString('base64')}`,
      },
      body: JSON.stringify({
        update: {
          labels: [
            {
              add: componentName,
            },
            {
              add: `${componentName}-${tagName}`,
            },
          ],
        },
        fields: {
          customfield_11108: releaseDate.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();

      throw new Error(errorMsg)
    }

    console.log('Updated ' + issueId);
  }
}

export default Jira;
