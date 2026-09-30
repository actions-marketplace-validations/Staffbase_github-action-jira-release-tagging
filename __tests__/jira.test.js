import Jira from '../jira.js'

// if you want to run the test locally, add an existing JIRA token and email to the new JIRA call
xtest('foo', async () => {
  const jira = new Jira({ token: '***' })

  const result = await jira.updateIssues({
    issueIds: ['RE-1486', 'RE-1489'],
    componentName: 'foo-service',
    tagName: '2020.8.4',
    releaseDate: new Date(),
  })

  expect(result).toEqual([])
}, 20000)
