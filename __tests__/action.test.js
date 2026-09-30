import * as action from '../action.js';

test('action#filterIssueIds empty', () => {
  const result = action.filterIssueIds('"PAC-1001", "PAC-00", "PAC-000000000", "PAC-000", "PAC-0000", ""RE-123","",,"LOL-333", NO-1234, COD-98765');
  const anotherResult = action.filterIssueIds('LOL-000');

  expect(result).toEqual(['COD-98765', 'LOL-333', 'NO-1234', 'PAC-1001', 'RE-123']);
  expect(anotherResult).toEqual([])
});
