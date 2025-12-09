import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/index";
import { Button, Badge } from "@/components/ui/index";
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
import { formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Building2, Plus, Filter, MoreVertical, Users, Truck } from "lucide-react";
import { Dropdown } from "@/components/ui/modal";

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
            {result.data.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <Link
                    href={`/founder/companies/${company.id}`}
                    className="flex items-center gap-3 hover:text-electric-500 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-navy-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{company.name}</p>
                      <p className="text-xs text-neutral-500">{company.id}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-neutral-900">{company.ownerUserId}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      company.status === "active"
                        ? "success"
                        : company.status === "suspended"
                        ? "error"
                        : "neutral"
                    }
                  >
                    {company.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm">{company.fleetSize || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
                    {company.createdAt ? formatDate(company.createdAt.toDate()) : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Dropdown
                    trigger={
                      <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-neutral-500" />
                      </button>
                    }
                    items={[
                      {
                        label: "View Details",
                        onClick: () => {},
                        icon: <Building2 className="w-4 h-4" />,
                      },
                      {
                        label: "View Users",
                        onClick: () => {},
                        icon: <Users className="w-4 h-4" />,
                      },
                      {
                        label: company.status === "active" ? "Suspend" : "Reinstate",
                        onClick: () => {},
                        variant: company.status === "active" ? "danger" : "default",
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={() => {}}
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    // Mock data for development
    const mockCompanies = [
      {
        id: "comp-1",
        name: "Sunrise Transport Co.",
        ownerUserId: "user-1",
        status: "active",
        fleetSize: 25,
        createdAt: new Date(),
      },
      {
        id: "comp-2",
        name: "Metro Fleet Services",
        ownerUserId: "user-2",
        status: "active",
        fleetSize: 42,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: "comp-3",
        name: "Highway Logistics Ltd",
        ownerUserId: "user-3",
        status: "suspended",
        fleetSize: 15,
        createdAt: new Date(Date.now() - 172800000),
      },
    ];

    return (
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
          {mockCompanies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                <Link
                  href={`/founder/companies/${company.id}`}
                  className="flex items-center gap-3 hover:text-electric-500 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{company.name}</p>
                    <p className="text-xs text-neutral-500">{company.id}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <p className="text-sm text-neutral-900">{company.ownerUserId}</p>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    company.status === "active"
                      ? "success"
                      : company.status === "suspended"
                      ? "error"
                      : "neutral"
                  }
                >
                  {company.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm">{company.fleetSize || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600">
                  {formatDate(company.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                <Dropdown
                  trigger={
                    <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-neutral-500" />
                    </button>
                  }
                  items={[
                    {
                      label: "View Details",
                      onClick: () => {},
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      label: "View Users",
                      onClick: () => {},
                      icon: <Users className="w-4 h-4" />,
                    },
                    {
                      label: company.status === "active" ? "Suspend" : "Reinstate",
                      onClick: () => {},
                      variant: company.status === "active" ? "danger" : "default",
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
