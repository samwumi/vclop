export interface RequestUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  branchId: string | null;
  departmentId: string | null;
  /** Resolved set of permission codes — source of truth for all access checks */
  permissions: Set<string>;
}
