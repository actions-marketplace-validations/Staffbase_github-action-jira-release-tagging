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

describe('Jira#updateIssues', () => {
  const realFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = realFetch
  })

  test('each issue gets its own release date', async () => {
    const future = '2030-01-01T00:00:00.000Z'
    const releaseDate = new Date('2026-01-01T00:00:00.000Z')
    const updated = {}

    globalThis.fetch = async (url, { method, body }) => {
      const issueId = url.match(/issue\/([^?]+)/)[1]

      if (method === 'PUT') {
        updated[issueId] = JSON.parse(body).fields.customfield_11108

        return { ok: true }
      }

      // B-2 resolves after A-1, so A-1's later date is seen first
      if (issueId === 'B-2') {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      return {
        ok: true,
        json: async () => ({
          key: issueId,
          fields: { issuetype: { subtask: false }, customfield_11108: issueId === 'A-1' ? future : null },
        }),
      }
    }

    const jira = new Jira({ baseUrl: 'https://jira.test', email: 'a@b.c', token: 'token' })
    const errors = await jira.updateIssues({ issueIds: ['A-1', 'B-2'], releaseDate, tagName: '1.0.0', componentName: 'svc' })

    expect(errors).toEqual([])
    expect(updated['A-1']).toBe(future)
    expect(updated['B-2']).toBe(releaseDate.toISOString())
  })
})
