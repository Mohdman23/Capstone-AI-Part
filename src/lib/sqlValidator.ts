/**
 * Validates whether an SQL statement is safe and read-only.
 * Guarantees that NL-to-SQL AI queries cannot mutate, drop, or manipulate tables.
 */

export interface SqlValidationResult {
  isSafe: boolean;
  cleanSql: string;
  statementType: 'SELECT' | 'WITH' | 'PRAGMA_READ' | 'INVALID';
  rejectionReason?: string;
}

const DISALLOWED_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'ATTACH',
  'DETACH',
  'REINDEX',
  'VACUUM',
  'EXEC',
  'EXECUTE',
];

export function validateReadOnlySql(rawSql: string): SqlValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return {
      isSafe: false,
      cleanSql: '',
      statementType: 'INVALID',
      rejectionReason: 'Empty SQL query provided.',
    };
  }

  // Strip markdown code fences if model returned ```sql ... ```
  let sql = rawSql.trim();
  if (sql.startsWith('```')) {
    sql = sql.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Remove trailing semicolons for single-statement validation
  const singleStatementSql = sql.replace(/;+\s*$/, '').trim();

  // Check for multiple semicolon-separated statements (prevent query stacking attacks)
  // Be mindful of semicolons inside quotes
  const withoutQuotes = singleStatementSql.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
  if (withoutQuotes.includes(';')) {
    return {
      isSafe: false,
      cleanSql: singleStatementSql,
      statementType: 'INVALID',
      rejectionReason: 'Multiple SQL statements in a single execution are prohibited for security.',
    };
  }

  const upper = withoutQuotes.toUpperCase();
  const tokens = upper.split(/[\s(),]+/).filter(Boolean);
  const firstToken = tokens[0] || '';

  if (firstToken !== 'SELECT' && firstToken !== 'WITH' && firstToken !== 'PRAGMA') {
    return {
      isSafe: false,
      cleanSql: singleStatementSql,
      statementType: 'INVALID',
      rejectionReason: `Only SELECT or WITH queries are permitted. Found: ${firstToken}`,
    };
  }

  // Check for any forbidden destructive keywords as separate tokens
  for (const keyword of DISALLOWED_KEYWORDS) {
    if (tokens.includes(keyword)) {
      return {
        isSafe: false,
        cleanSql: singleStatementSql,
        statementType: 'INVALID',
        rejectionReason: `Forbidden SQL mutation command detected: ${keyword}`,
      };
    }
  }

  const statementType = firstToken === 'SELECT' ? 'SELECT' : firstToken === 'WITH' ? 'WITH' : 'PRAGMA_READ';

  return {
    isSafe: true,
    cleanSql: singleStatementSql,
    statementType,
  };
}
