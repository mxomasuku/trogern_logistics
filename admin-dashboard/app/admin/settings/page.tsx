import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Button } from "@/components/ui/index";
import { Input, Label, FormGroup } from "@/components/ui/form";
import { SimpleTabs } from "@/components/ui/tabs";
import { User, Shield, Bell, Key } from "lucide-react";

function ProfileTab() {
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-6">Profile Information</CardTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <Label>Full Name</Label>
            <Input defaultValue="Admin User" />
          </FormGroup>

          <FormGroup>
            <Label>Email Address</Label>
            <Input type="email" defaultValue="admin@trogern.com" disabled />
          </FormGroup>

          <FormGroup>
            <Label>Role</Label>
            <Input defaultValue="Founder" disabled />
          </FormGroup>

          <FormGroup>
            <Label>Phone Number</Label>
            <Input type="tel" placeholder="+263 77 123 4567" />
          </FormGroup>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <Button variant="primary">Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-6">Change Password</CardTitle>
        
        <div className="max-w-md space-y-4">
          <FormGroup>
            <Label>Current Password</Label>
            <Input type="password" placeholder="Enter current password" />
          </FormGroup>

          <FormGroup>
            <Label>New Password</Label>
            <Input type="password" placeholder="Enter new password" />
          </FormGroup>

          <FormGroup>
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="Confirm new password" />
          </FormGroup>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <Button variant="primary">Update Password</Button>
        </div>
      </Card>

      <Card padding="md">
        <CardTitle className="mb-4">Two-Factor Authentication</CardTitle>
        <p className="text-sm text-neutral-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <Button variant="outline">
          <Key className="w-4 h-4" />
          Enable 2FA
        </Button>
      </Card>

      <Card padding="md">
        <CardTitle className="mb-4">Active Sessions</CardTitle>
        <p className="text-sm text-neutral-600 mb-4">
          These are the devices that are currently logged into your account.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Chrome on macOS</p>
              <p className="text-xs text-neutral-500">Harare, Zimbabwe • Current session</p>
            </div>
            <span className="text-xs text-success-600 font-medium">Active now</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Safari on iPhone</p>
              <p className="text-xs text-neutral-500">Harare, Zimbabwe • Last active 2h ago</p>
            </div>
            <Button variant="ghost" size="sm" className="text-error-600">Revoke</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-6">Email Notifications</CardTitle>
        
        <div className="space-y-4">
          {[
            { id: "new_signup", label: "New user signups", description: "Get notified when a new user signs up" },
            { id: "new_subscription", label: "New subscriptions", description: "Get notified when a company subscribes" },
            { id: "payment_failed", label: "Payment failures", description: "Get notified when a payment fails" },
            { id: "new_ticket", label: "Support tickets", description: "Get notified when a new ticket is opened" },
            { id: "weekly_digest", label: "Weekly digest", description: "Receive a weekly summary of platform activity" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <div>
                <p className="font-medium text-sm text-neutral-900">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-500"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <Button variant="primary">Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
}

function AdminUsersTab() {
  const admins = [
    { id: "admin-1", name: "Admin User", email: "admin@trogern.com", role: "founder", status: "active" },
    { id: "admin-2", name: "Support Agent", email: "support@trogern.com", role: "support", status: "active" },
    { id: "admin-3", name: "Analyst", email: "analyst@trogern.com", role: "analyst", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <CardTitle>Admin Users</CardTitle>
          <Button variant="primary" size="sm">Add Admin</Button>
        </div>
        
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-neutral-900">{admin.name}</p>
                  <p className="text-xs text-neutral-500">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-neutral-600 capitalize px-2 py-1 bg-white rounded">
                  {admin.role}
                </span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const tabs = [
    { 
      id: "profile", 
      label: (
        <span className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </span>
      ), 
      content: <ProfileTab /> 
    },
    { 
      id: "security", 
      label: (
        <span className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security
        </span>
      ), 
      content: <SecurityTab /> 
    },
    { 
      id: "notifications", 
      label: (
        <span className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </span>
      ), 
      content: <NotificationsTab /> 
    },
    { 
      id: "admins", 
      label: (
        <span className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Admin Users
        </span>
      ), 
      content: <AdminUsersTab /> 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Settings" },
        ]}
      />

      <SimpleTabs tabs={tabs} defaultTab="profile" />
    </div>
  );
}
