'use client'

import { useAuthStore } from '@/stores/auth-store'
import { canViewAllJourneys, canCreateUsers } from '@/lib/rbac'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Route,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
} from 'lucide-react'

type ViewType = 'dashboard' | 'journey' | 'tasks' | 'users'

interface AppSidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор',
  HR: 'HR-менеджер',
  MANAGER: 'Руководитель',
  MENTOR: 'Наставник',
  METHODOLOGIST: 'Методолог',
  EMPLOYEE: 'Сотрудник',
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const { user, logout } = useAuthStore()

  const role = user?.role || 'EMPLOYEE'

  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Дашборд', icon: LayoutDashboard },
    { id: 'journey' as ViewType, label: 'Мой путь', icon: Route },
    { id: 'tasks' as ViewType, label: 'Задачи', icon: CheckSquare },
    ...(canViewAllJourneys(role) ? [{ id: 'users' as ViewType, label: 'Пользователи', icon: Users }] : []),
  ]

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '?'

  return (
    <Sidebar className="border-r border-emerald-200/50 dark:border-emerald-800/50">
      <SidebarHeader className="border-b border-emerald-200/50 dark:border-emerald-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-700 dark:text-emerald-400">Journey OS</h2>
            <p className="text-xs text-muted-foreground">Employee Journey Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    className="data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 dark:data-[active=true]:bg-emerald-900 dark:data-[active=true]:text-emerald-300"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canViewAllJourneys(role) && (
          <SidebarGroup>
            <SidebarGroupLabel>Аналитика</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={false}
                    className="text-muted-foreground"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Скоро</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-emerald-200/50 dark:border-emerald-800/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 bg-emerald-100 dark:bg-emerald-900">
            <AvatarFallback className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
