import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/index";
import { Button } from "@/components/ui/index";
import { SearchInput } from "@/components/ui/form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  TableSkeleton,
  EmptyState,
} from "@/components/ui/table";
import { getCompaniesPage } from "@trogern/domain";
import { Building2, Plus, Filter, AlertTriangle } from "lucide-react";
import { CompanyTableRow } from "./company-table-row";
import { Company } from "@/types/types";

interface CompaniesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

async function CompaniesTable({ searchParams }: { searchParams: Awaited<CompaniesPageProps["searchParams"]> }) {
  const { search, status, page = "1" } = searchParams;
  const currentPage = parseInt(page, 10);
  const limit = 20;

  try {
    const result = await getCompaniesPage({
      search,
      status: status as any,
      limit,
      orderBy: "createdAt",
      orderDirection: "desc",
    });

    if (result.data.length === 0) {
      return (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No companies found"
          description={search ? "Try adjusting your search criteria" : "Companies will appear here once they sign up"}
        />
      );
    }

    const totalPages = Math.ceil(result.total / limit);

    // Convert Firestore Timestamps to plain objects for serialization
    const serializedCompanies = result.data.map((company: any) => ({
      ...company,
      createdAt: company.createdAt?.toDate?.() ? company.createdAt.toDate().toISOString() : company.createdAt,
      updatedAt: company.updatedAt?.toDate?.() ? company.updatedAt.toDate().toISOString() : company.updatedAt,
      subscriptionCurrentPeriodEnd: company.subscriptionCurrentPeriodEnd?.toDate?.()
        ? company.subscriptionCurrentPeriodEnd.toDate().toISOString()
        : company.subscriptionCurrentPeriodEnd,
      subscriptionCurrentPeriodStart: company.subscriptionCurrentPeriodStart?.toDate?.()
        ? company.subscriptionCurrentPeriodStart.toDate().toISOString()
        : company.subscriptionCurrentPeriodStart,
      trialEnd: company.trialEnd?.toDate?.() ? company.trialEnd.toDate().toISOString() : company.trialEnd,
    }));

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Company</TableCell>
              <TableCell header>Owner</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Fleet Size</TableCell>
              <TableCell header>Created</TableCell>
              <TableCell header className="w-12"></TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serializedCompanies.map((company) => (
              <CompanyTableRow key={company.id} company={company as unknown as Company} />
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={() => { }}
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return (
      <EmptyState
        icon={<AlertTriangle className="w-12 h-12 text-error-500" />}
        title="Failed to load companies"
        description="There was an error loading the companies. Please try again later."
      />
    );
  }
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage all companies on the platform"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Companies" },
        ]}
        actions={
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Add Company
          </Button>
        }
      />

      <Card padding="md">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Search companies..." />
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
          <div className="text-sm text-neutral-500">
            Showing results
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TableSkeleton rows={10} cols={6} />}>
          <CompaniesTable searchParams={params} />
        </Suspense>
      </Card>
    </div>
  );
}