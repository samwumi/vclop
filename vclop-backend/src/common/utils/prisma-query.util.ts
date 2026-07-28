import { Prisma } from '@prisma/client';

/**
 * Build a Prisma `orderBy` clause from a sort field string.
 * Supports dot-notation for nested sorts: "department.name"
 */
export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedFields: string[],
  defaultField = 'createdAt',
): Prisma.SortOrder | Record<string, unknown> {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;

  if (field.includes('.')) {
    const [relation, relField] = field.split('.');
    return { [relation as string]: { [relField as string]: sortOrder } } as Record<string, unknown>;
  }

  return { [field]: sortOrder } as unknown as Prisma.SortOrder;
}

/**
 * Build a search filter for multiple string fields using Prisma `contains`.
 */
export function buildSearchFilter(
  search: string | undefined,
  fields: string[],
): Prisma.StringFilter | undefined {
  if (!search || search.trim() === '') return undefined;

  return {
    contains: search.trim(),
  } as Prisma.StringFilter;
}

export function buildMultiFieldSearch(
  search: string | undefined,
  fields: string[],
): Array<Record<string, unknown>> | undefined {
  if (!search || search.trim() === '') return undefined;

  return fields.map((field) => ({
    [field]: { contains: search.trim(), mode: 'insensitive' },
  } as Record<string, unknown>));
}
