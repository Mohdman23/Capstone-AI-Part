import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReadOnlySql } from './sqlValidator';

test('validateReadOnlySql permits standard SELECT queries', () => {
  const result = validateReadOnlySql('SELECT department, SUM(amount) FROM transactions GROUP BY department');
  assert.equal(result.isSafe, true);
  assert.equal(result.statementType, 'SELECT');
});

test('validateReadOnlySql permits CTE WITH queries', () => {
  const query = `
    WITH dept_spend AS (
      SELECT department, SUM(amount) as total
      FROM transactions
      GROUP BY department
    )
    SELECT * FROM dept_spend WHERE total > 1000 ORDER BY total DESC;
  `;
  const result = validateReadOnlySql(query);
  assert.equal(result.isSafe, true);
  assert.equal(result.statementType, 'WITH');
});

test('validateReadOnlySql strips markdown markdown fences', () => {
  const result = validateReadOnlySql('```sql\nSELECT * FROM employees LIMIT 10;\n```');
  assert.equal(result.isSafe, true);
  assert.equal(result.cleanSql, 'SELECT * FROM employees LIMIT 10');
});

test('validateReadOnlySql blocks DROP, DELETE, and UPDATE statements', () => {
  const dropResult = validateReadOnlySql('DROP TABLE transactions');
  assert.equal(dropResult.isSafe, false);

  const deleteResult = validateReadOnlySql('DELETE FROM corporate_cards WHERE id = 1');
  assert.equal(deleteResult.isSafe, false);

  const updateResult = validateReadOnlySql('UPDATE accounts SET balance = 999999');
  assert.equal(updateResult.isSafe, false);
});

test('validateReadOnlySql blocks query stacking with semicolons', () => {
  const stackedResult = validateReadOnlySql('SELECT * FROM employees; DROP TABLE employees');
  assert.equal(stackedResult.isSafe, false);
  assert.ok(stackedResult.rejectionReason?.includes('Multiple SQL statements'));
});
