import { jest } from '@jest/globals';
import * as action from '../action.js';

test('action#filterIssueIds empty', () => {
  const result = action.filterIssueIds('"PAC-1001", "PAC-00", "PAC-000000000", "PAC-000", "PAC-0000", ""RE-123","",,"LOL-333", NO-1234, COD-98765');
  const anotherResult = action.filterIssueIds('LOL-000');

  expect(result).toEqual(['COD-98765', 'LOL-333', 'NO-1234', 'PAC-1001', 'RE-123']);
  expect(anotherResult).toEqual([])
});

describe('action#exec', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.restoreAllMocks();
  });

  test.each([true, false])('passes notifyUsers=%s to the Jira update', async (notifyUsers) => {
    const updateUrls = [];

    globalThis.fetch = async (url, { method }) => {
      if (method === 'PUT') {
        updateUrls.push(url);
      }

      return {
        ok: true,
        json: async () => ({ key: 'A-1', fields: { issuetype: { subtask: false } } }),
      };
    };

    await action.exec({
      issueIds: ['A-1'],
      componentName: 'svc',
      tagName: '1.0.0',
      releaseDate: new Date('2026-01-01T00:00:00.000Z'),
      notifyUsers,
    });

    expect(updateUrls).toHaveLength(1);
    expect(updateUrls[0]).toContain(`notifyUsers=${notifyUsers}`);
  });
});
