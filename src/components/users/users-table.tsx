'use client'

import { useAuthStore } from '@/stores/auth-store'
import { canCreateUsers } from '@/lib/rbac'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Users, Plus, Search } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор',
  HR: 'HR-менеджер',
  MANAGER: 'Руководитель',
  MENTOR: 'Наставник',
  METHODOLOGIST: 'Методолог',
  EMPLOYEE: 'Сотрудник',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  HR: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  MANAGER: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  MENTOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  METHODOLOGIST: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  EMPLOYEE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

interface UserRow {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  departmentId?: string | null
  isActive: boolean
  department?: { id: string; name: string } | null
}

export function UsersTable() {
  const { token, user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', password: '' })
  const [creating, setCreating] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const result = await apiClient('GET', '/api/users', undefined, token)
      const data = result.data as { users: UserRow[] }
      setUsers(data.users || [])
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const handleCreateUser = async () => {
    if (!token) return
    setCreating(true)
    try {
      await apiClient('POST', '/api/users', newUser, token)
      setDialogOpen(false)
      setNewUser({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', password: '' })
      await fetchUsers()
    } catch (err) {
      console.error('Failed to create user:', err)
    } finally {
      setCreating(false)
    }
  }

  if (!currentUser || !canCreateUsers(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        У вас нет доступа к этому разделу
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Пользователи</h1>
          <p className="text-muted-foreground mt-1">Управление сотрудниками</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый сотрудник</DialogTitle>
              <DialogDescription>Создайте аккаунт для нового сотрудника</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя</label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фамилия</label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Иванов"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="ivan@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Пароль</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Роль</label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Сотрудник</SelectItem>
                    <SelectItem value="MENTOR">Наставник</SelectItem>
                    <SelectItem value="MANAGER">Руководитель</SelectItem>
                    <SelectItem value="HR">HR-менеджер</SelectItem>
                    <SelectItem value="METHODOLOGIST">Методолог</SelectItem>
                    <SelectItem value="ADMIN">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleCreateUser} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
                {creating ? 'Создание...' : 'Создать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск сотрудников..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[u.role] || ''}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.department?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}>
                        {u.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
