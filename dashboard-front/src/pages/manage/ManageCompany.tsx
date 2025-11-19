import { useEffect } from "react"
import InviteEmployeesPanel from "./InviteEmployeePanel"

const ManageCompany = () => {

    useEffect(() => {
        console.log("Manage comany reached")
    })

  return (
   <div>
    <InviteEmployeesPanel/>
   </div>
  )
}

export default ManageCompany