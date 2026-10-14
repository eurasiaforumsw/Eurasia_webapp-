import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

type SqlFragment = { text: string; values: any[] };
type DbError = { message: string; code?: string };
export type DbResult<T = any> = { data: T; error: DbError | null; count?: number | null };
type SelectOptions = { count?: 'exact'; head?: boolean };
type UpsertOptions = { onConflict?: string; ignoreDuplicates?: boolean };

export function sql(strings: TemplateStringsArray, ...values: any[]): SqlFragment {
  return {
    text: strings.reduce((text, part, i) => text + part + (i < values.length ? `$${i + 1}` : ''), ''),
    values,
  };
}

function normalizeDates(value: any): any {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeDates(item)]));
  }
  return value;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows.map(normalizeDates), rowCount: result.rowCount || 0 };
  } finally {
    client.release();
  }
}

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return value;
}

function projection(value: string): string {
  return value.split(',').map((part) => {
    const item = part.trim();
    if (item === '*') return item;
    if (/^count\(\*\)(\s+as\s+[a-z_][a-z0-9_]*)?$/i.test(item)) return item;
    return identifier(item);
  }).join(', ');
}

function shift(text: string, offset: number): string {
  return text.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + offset}`);
}

function nonnegative(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Pagination must use nonnegative integers');
  return value;
}

class FilteredBuilder {
  protected conditions: string[] = [];
  protected params: any[] = [];
  protected orders: string[] = [];
  protected rowLimit?: number;
  protected rowOffset?: number;

  private compare(column: string, operator: string, value: any) {
    this.params.push(value);
    this.conditions.push(`${identifier(column)} ${operator} $${this.params.length}`);
    return this;
  }
  eq(column: string, value: any) { return this.compare(column, '=', value); }
  neq(column: string, value: any) { return this.compare(column, '!=', value); }
  gt(column: string, value: any) { return this.compare(column, '>', value); }
  gte(column: string, value: any) { return this.compare(column, '>=', value); }
  lt(column: string, value: any) { return this.compare(column, '<', value); }
  lte(column: string, value: any) { return this.compare(column, '<=', value); }
  like(column: string, value: any) { return this.compare(column, 'LIKE', value); }
  ilike(column: string, value: any) { return this.compare(column, 'ILIKE', value); }
  contains(column: string, values: any[]) { return this.compare(column, '@>', values); }
  overlaps(column: string, values: any[]) { return this.compare(column, '&&', values); }
  match(values: Record<string, any>) {
    Object.entries(values).forEach(([key, value]) => value === null ? this.is(key, null) : this.eq(key, value));
    return this;
  }
  in(column: string, values: any[]) {
    identifier(column);
    if (!values.length) this.conditions.push('FALSE');
    else {
      const bindings = values.map((value) => { this.params.push(value); return `$${this.params.length}`; });
      this.conditions.push(`${column} IN (${bindings.join(',')})`);
    }
    return this;
  }
  is(column: string, value: null | boolean) {
    if (value !== null && typeof value !== 'boolean') throw new Error('IS requires null or boolean');
    this.conditions.push(`${identifier(column)} IS ${value === null ? 'NULL' : value ? 'TRUE' : 'FALSE'}`);
    return this;
  }
  where(fragment: SqlFragment | string, ...values: any[]) {
    const clause = typeof fragment === 'string' ? { text: fragment, values } : fragment;
    this.conditions.push(`(${shift(clause.text, this.params.length)})`);
    this.params.push(...clause.values);
    return this;
  }
  or(expression: string) {
    const conditions = expression.split(',').map((part) => {
      const match = part.match(/^([a-z_][a-z0-9_]*)\.(eq|neq|ilike|like)\.(.*)$/i);
      if (!match) throw new Error('Unsupported OR filter');
      this.params.push(match[3]);
      const operator = { eq: '=', neq: '!=', ilike: 'ILIKE', like: 'LIKE' }[match[2].toLowerCase()];
      return `${identifier(match[1])} ${operator} $${this.params.length}`;
    });
    this.conditions.push(`(${conditions.join(' OR ')})`);
    return this;
  }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const nulls = options?.nullsFirst === undefined ? '' : options.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST';
    this.orders.push(`${identifier(column)} ${options?.ascending === false ? 'DESC' : 'ASC'}${nulls}`);
    return this;
  }
  limit(count: number) { this.rowLimit = nonnegative(count); return this; }
  offset(count: number) { this.rowOffset = nonnegative(count); return this; }
  range(from: number, to: number) {
    this.rowOffset = nonnegative(from);
    this.rowLimit = nonnegative(to - from + 1);
    return this;
  }
  protected whereClause(offset = 0) { return this.conditions.length ? ` WHERE ${shift(this.conditions.join(' AND '), offset)}` : ''; }
  protected suffix() {
    return (this.orders.length ? ` ORDER BY ${this.orders.join(', ')}` : '')
      + (this.rowLimit === undefined ? '' : ` LIMIT ${this.rowLimit}`)
      + (this.rowOffset === undefined ? '' : ` OFFSET ${this.rowOffset}`);
  }
}

class SelectQueryBuilder extends FilteredBuilder implements PromiseLike<DbResult<any[]>> {
  constructor(private table: string, private columns: string, private options: SelectOptions = {}) { super(); }
  async execute(): Promise<DbResult<any[]>> {
    let count: number | undefined;
    if (this.options.count || this.options.head) {
      const result = await query(`SELECT COUNT(*) AS count FROM ${this.table}${this.whereClause()}`, this.params);
      count = Number(result.rows[0]?.count || 0);
      if (this.options.head) return { data: null as any, error: null, count };
    }
    const { rows } = await query(`SELECT ${this.columns} FROM ${this.table}${this.whereClause()}${this.suffix()}`, this.params);
    return { data: rows, error: null, ...(count === undefined ? {} : { count }) };
  }
  async single(): Promise<DbResult<any>> {
    this.limit(1);
    const result = await this.execute();
    return { ...result, data: result.data?.[0] ?? null };
  }
  maybeSingle() { return this.single(); }
  then<TResult1 = DbResult<any[]>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<any[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }
}

// node-postgres encodes JS arrays as PostgreSQL arrays; JSONB array columns need JSON text.
const jsonColumns: Record<string, string[]> = {
  admin_categories: ['categories'], layout_config: ['config'], site_settings: ['config'],
  content: ['cover_image_crop'], event_registration_fields: ['options', 'validation_rules'],
  member_activity: ['metadata'],
};
function databaseValue(table: string, key: string, value: any) {
  return value != null && jsonColumns[table.split('.').pop()!]?.includes(key) ? JSON.stringify(value) : value;
}

class MutationQueryBuilder extends FilteredBuilder implements PromiseLike<DbResult<any>> {
  private columns = '*';
  constructor(private table: string, private operation: 'insert' | 'update' | 'delete', private values?: any,
    private upsert?: UpsertOptions) { super(); }
  select(columns = '*') { this.columns = projection(columns); return this; }
  async execute(): Promise<DbResult<any>> {
    let statement: string;
    let bindings: any[];
    if (this.operation === 'delete' || this.operation === 'update') {
      if (!this.conditions.length) throw new Error(`${this.operation.toUpperCase()} requires at least one condition`);
      const entries = Object.entries(this.values || {}).filter(([, value]) => value !== undefined);
      if (this.operation === 'update' && !entries.length) throw new Error('UPDATE requires at least one value');
      bindings = entries.map(([key, value]) => databaseValue(this.table, key, value));
      statement = this.operation === 'delete' ? `DELETE FROM ${this.table}`
        : `UPDATE ${this.table} SET ${entries.map(([key], i) => `${identifier(key)} = $${i + 1}`).join(', ')}`;
      statement += this.whereClause(bindings.length) + ` RETURNING ${this.columns}`;
      bindings.push(...this.params);
    } else {
      const records = Array.isArray(this.values) ? this.values : [this.values];
      if (!records.length) return { data: [], error: null };
      const keys = [...new Set<string>(records.flatMap((record) => Object.keys(record).filter((key) => record[key] !== undefined)))];
      keys.forEach(identifier);
      bindings = [];
      const groups = records.map((record) => `(${keys.map((key) => {
        if (record[key] === undefined) return 'DEFAULT';
        bindings.push(databaseValue(this.table, key, record[key]));
        return `$${bindings.length}`;
      }).join(',')})`);
      statement = keys.length ? `INSERT INTO ${this.table} (${keys.join(',')}) VALUES ${groups.join(',')}`
        : `INSERT INTO ${this.table} DEFAULT VALUES`;
      if (this.upsert) {
        const targets = (this.upsert.onConflict || keys[0]).split(',').map((key) => identifier(key.trim()));
        const updates = keys.filter((key) => !targets.includes(key));
        statement += ` ON CONFLICT (${targets.join(',')}) ` + (this.upsert.ignoreDuplicates || !updates.length ? 'DO NOTHING'
          : `DO UPDATE SET ${updates.map((key) => `${key} = EXCLUDED.${key}`).join(', ')}`);
      }
      statement += ` RETURNING ${this.columns}`;
    }
    const { rows } = await query(statement, bindings);
    return { data: this.operation === 'insert' && !Array.isArray(this.values) ? rows[0] ?? null : rows, error: null };
  }
  async single(): Promise<DbResult<any>> {
    const result = await this.execute();
    return { ...result, data: Array.isArray(result.data) ? result.data[0] ?? null : result.data };
  }
  maybeSingle() { return this.single(); }
  then<TResult1 = DbResult<any>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }
}

export const db = {
  from(table: string) {
    identifier(table);
    return {
      select: (columns = '*', options?: SelectOptions) => new SelectQueryBuilder(table, projection(columns), options),
      insert: (values: any) => new MutationQueryBuilder(table, 'insert', values),
      update: (values: any) => new MutationQueryBuilder(table, 'update', values),
      delete: () => new MutationQueryBuilder(table, 'delete'),
      upsert: (values: any, options: UpsertOptions = {}) => new MutationQueryBuilder(table, 'insert', values, options),
    };
  },
  async rpc(fnName: string, params?: Record<string, any>): Promise<DbResult<any>> {
    identifier(fnName);
    const keys = Object.keys(params || {});
    const { rows } = await query(`SELECT * FROM ${fnName}(${keys.map((key, i) => `${identifier(key)} => $${i + 1}`).join(', ')})`, keys.map((key) => params![key]));
    const scalarKey = fnName.split('.').pop()!;
    // PostgreSQL names a scalar function's result column after the function,
    // while RETURNS TABLE functions expose their declared columns. Preserve
    // every row for the latter (engagement stats, suspension details, and
    // analytics), and unwrap only the former.
    const isScalarResult = rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], scalarKey);
    return { data: isScalarResult ? rows[0][scalarKey] : rows, error: null };
  },
};

export default pool;
