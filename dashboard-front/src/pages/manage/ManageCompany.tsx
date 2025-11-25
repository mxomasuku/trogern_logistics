import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader"
import { Card } from "@/components/ui/card"



const ManageCompany = () => {
  const navigate = useNavigate()

  useEffect(() => {
    console.log("Manage company reached")
  }, [])

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
</div>
      {/* END HIGHLIGHT */}
   </Card>
    </div>
 
  )
}

export default ManageCompany