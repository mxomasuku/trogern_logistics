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
          titleMain="Income"
          titleAccent="Management"
          enableSearch={false}
   

        />

   <div className="flex items-center gap-3 px-4 pb-4">

  <button
    onClick={() => navigate("/app/company/invite")}
    className="w-48 px-4 py-2 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800"
  >
    Invite Team Member
  </button>

  <button
    onClick={() => navigate("/app/onboarding/create-targets")}
    className="w-48 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
  >
    Set Company Targets
  </button>
  
    <button
    onClick={() => navigate("/app/period-stats")}
    className="w-48 px-4 py-2 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800"
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