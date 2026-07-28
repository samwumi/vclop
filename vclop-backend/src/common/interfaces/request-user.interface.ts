export interface RequestUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  branchId: string | null;
  departmentId: string | null;
  /** All branch IDs this user is assigned to oversee (multi-location staff) */
  managedBranchIds: string[];
  /** Resolved set of permission codes — source of truth for all access checks */
  permissions: Set<string>;
}
