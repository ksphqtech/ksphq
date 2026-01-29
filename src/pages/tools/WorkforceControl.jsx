import { Routes, Route, Navigate } from 'react-router-dom'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { useToolNavigation } from '@/hooks/useNavigation'
import {
  ClockIn,
  MyStats,
  Profile,
  Dashboard,
  Clients,
  Activities,
  Projects,
  Shifts,
  Groups,
  Teams,
  Settings
} from './workforce'

export function WorkforceControl() {
  const toolConfig = useToolNavigation('workforce')

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Workforce Control"
    >
      <Routes>
        <Route index element={<Navigate to="clock-in" replace />} />
        <Route path="clock-in" element={<ClockIn />} />
        <Route path="my-stats" element={<MyStats />} />
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="activities" element={<Activities />} />
        <Route path="projects" element={<Projects />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="groups" element={<Groups />} />
        <Route path="teams" element={<Teams />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </ToolLayout>
  )
}
