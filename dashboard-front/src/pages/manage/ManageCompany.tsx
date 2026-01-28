import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/state/AuthContext"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

const ManageCompany = () => {
  const navigate = useNavigate()
  const { isOwner } = useAuth()
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    console.log("Manage company reached")
  }, [])

  const handleDownloadIncomeStatement = async () => {
    if (downloading) return

    setDownloading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL as string
      const response = await fetch(`${baseUrl}/reports/income/statement`, {
        method: "GET",
        credentials: "include", // Include session cookie
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || "Failed to download income statement")
      }

      // Get the blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `income-statement-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Income statement downloaded successfully")
    } catch (error: any) {
      console.error("Download error:", error)
      toast.error(error?.message || "Failed to download income statement")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mx-auto space-y-4">
      {/* Main Income Card */}
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">

        <PageHeader
          titleMain="Company"
          titleAccent="Management"
          enableSearch={false}


        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 pb-4">
          {/* HIGHLIGHT: button 1 */}
          <button
            onClick={() => navigate("/app/company/invite")}
            className="
      w-full sm:w-48 
      shrink-0 
      rounded-md 
      px-4 py-2 
      text-sm font-medium 
      bg-slate-700 
      text-white 
      hover:bg-slate-800
      hover:ring-1 hover:ring-slate-300
      transition
    "
          >
            Invite Team Member
          </button>

          {/* HIGHLIGHT: button 2 */}
          <button
            onClick={() => navigate("/app/onboarding/create-targets")}
            className="
      w-full sm:w-48 
      shrink-0 
      rounded-md 
      px-4 py-2 
      text-sm font-medium 
      bg-blue-700 
      text-white 
      hover:bg-blue-50
      hover:text-blue-700
      hover:ring-1 hover:ring-blue-200
      transition
    "
          >
            Set Company Targets
          </button>

          {/* HIGHLIGHT: button 3 */}
          <button
            onClick={() => navigate("/app/period-stats")}
            className="
      w-full sm:w-48 
      shrink-0 
      rounded-md 
      px-4 py-2 
      text-sm font-medium 
      bg-slate-700 
      text-white 
      hover:bg-slate-800
      hover:ring-1 hover:ring-slate-300
      transition
    "
          >
            View Analytics
          </button>

          {/* HIGHLIGHT: Download Income Statement - Owner only */}
          {isOwner && (
            <button
              onClick={handleDownloadIncomeStatement}
              disabled={downloading}
              className="
        w-full sm:w-48 
        shrink-0 
        rounded-md 
        px-4 py-2 
        text-sm font-medium 
        bg-emerald-700 
        text-white 
        hover:bg-emerald-800
        hover:ring-1 hover:ring-emerald-300
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      "
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Income
                </>
              )}
            </button>
          )}
        </div>
        {/* END HIGHLIGHT */}
      </Card>
    </div>

  )
}

export default ManageCompany