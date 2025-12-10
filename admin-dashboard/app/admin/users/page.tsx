import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/index";
import { TableSkeleton } from "@/components/ui/table";
import { getUsersPage } from "@trogern/domain";
import { UsersTable, UserWithCompany } from "./users-table";
import { UserFilters } from "./user-filters";
import { CursorPagination } from "./cursor-pagination";
import type { AppUserRole, UserStatus } from "@trogern/domain";

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    role?: string;
    companyId?: string;
    limit?: string;
    cursor?: string;
    prevCursors?: string;
  }>;
}

// Helper to convert domain timestamps to client format
function toClientTimestamp(ts: any): { _seconds: number; _nanoseconds: number } {
  if (!ts) return { _seconds: Date.now() / 1000, _nanoseconds: 0 };
  return {
    _seconds: ts.seconds || ts._seconds || 0,
    _nanoseconds: ts.nanoseconds || ts._nanoseconds || 0,
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  // Parse pagination params
  const limit = parseInt(params.limit || "20");
  const cursor = params.cursor || undefined;
  const previousCursors: string[] = params.prevCursors
    ? JSON.parse(params.prevCursors)
    : [];

  // Build filter params for the domain function
  const filterParams = {
    search: params.search || undefined,
    status: (params.status as UserStatus) || undefined,
    role: (params.role as AppUserRole) || undefined,
    companyId: params.companyId || undefined,
    limit,
    startAfter: cursor,
  };

  // Fetch users from domain
  let result;
  try {
    result = await getUsersPage(filterParams);
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty result on error
    result = {
      data: [],
      total: 0,
      hasMore: false,
      nextCursor: undefined,
    };
  }

  // Convert domain users to client format
  const clientUsers: UserWithCompany[] = result.data.map((user: any) => ({
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    companyId: user.companyId,
    createdAt: toClientTimestamp(user.createdAt),
    lastActiveAt: user.lastActiveAt ? toClientTimestamp(user.lastActiveAt) : undefined,
    lastLoginAt: user.lastLoginAt ? toClientTimestamp(user.lastLoginAt) : undefined,
    picture: user.picture,
    company: user.company ? {
      id: user.company.id,
      name: user.company.name,
    } : undefined,
  }));

  // Determine if filters are active
  const hasFilters = !!(params.search || params.status || params.role || params.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage all users across all companies"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users" },
        ]}
      />

      <Card padding="md">
        {/* Filters - Client Component */}
        <Suspense fallback={<div className="h-14 animate-pulse bg-neutral-100 rounded-lg" />}>
          <UserFilters
            totalCount={result.total}
            filteredCount={clientUsers.length}
          />
        </Suspense>

        {/* Table */}
        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <UsersTable users={clientUsers} />
        </Suspense>

        {/* Pagination - Client Component */}
        {(result.hasMore || previousCursors.length > 0 || cursor) && (
          <CursorPagination
            hasMore={result.hasMore}
            nextCursor={result.nextCursor}
            currentCursor={cursor}
            previousCursors={previousCursors}
            showingCount={clientUsers.length}
            totalCount={result.total}
          />
        )}
      </Card>
    </div>
  );
}