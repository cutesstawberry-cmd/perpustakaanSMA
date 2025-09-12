import { useEffect, useState } from 'react'
import { Button, Input, Card, Modal, Table, Space, Select, Form } from 'antd'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { format } from 'date-fns'

const { Option } = Select

interface User {
  id: string
  full_name: string | null
  member_id: string | null
  role: 'admin' | 'librarian' | 'member'
  phone: string | null
  created_at: string
  address: string | null
}

export function AdminUsersPage() {
  const { profile } = useAuthStore()
  const { users, loading, fetchUsers, updateUserRole, updateUser, deleteUser } = useUserStore()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUpdateUser = async (values: Partial<User>) => {
    if (!selectedUser) return
    try {
      await updateUser(selectedUser.id, values)
      setIsEditModalOpen(false)
      setSelectedUser(null)
      form.resetFields()
    } catch {
      // Error handled in store
    }
  }

  const handleUpdateRole = async (userId: string, role: User['role']) => {
    try {
      await updateUserRole(userId, role)
    } catch {
      // Error handled in store
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId)
      } catch {
        // Error handled in store
      }
    }
  }


  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesSearch = !searchFilter ||
      user.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      user.member_id?.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Admin panel for user management
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by name or member ID..."
          prefix={<SearchOutlined />}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={setRoleFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="admin">Admin</Option>
          <Option value="librarian">Librarian</Option>
          <Option value="member">Member</Option>
        </Select>
      </div>

      <Card title={`Users (${filteredUsers.length})`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table
            dataSource={filteredUsers}
            rowKey="id"
            columns={[
              {
                title: 'Name',
                dataIndex: 'full_name',
                key: 'full_name',
                render: (name) => name || 'N/A',
                sorter: true,
              },
              {
                title: 'Member ID',
                dataIndex: 'member_id',
                key: 'member_id',
                render: (id) => id || 'N/A',
              },
              {
                title: 'Role',
                dataIndex: 'role',
                key: 'role',
                render: (role, user) => (
                  <Select
                    value={role}
                    onChange={(newRole) => handleUpdateRole(user.id, newRole)}
                    style={{ width: 120 }}
                    disabled={user.id === profile.id} // Can't change own role
                  >
                    <Option value="admin">Admin</Option>
                    <Option value="librarian">Librarian</Option>
                    <Option value="member">Member</Option>
                  </Select>
                ),
              },
              {
                title: 'Phone',
                dataIndex: 'phone',
                key: 'phone',
                render: (phone) => phone || 'N/A',
              },
              {
                title: 'Joined',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date) => date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A',
                sorter: true,
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, user) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditModalOpen(true)
                        form.setFieldsValue(user)
                      }}
                    />
                    {user.id !== profile.id && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteUser(user.id)}
                      />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            label="Full Name"
            name="full_name"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Member ID"
            name="member_id"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update User
              </Button>
              <Button onClick={() => {
                setIsEditModalOpen(false)
                setSelectedUser(null)
                form.resetFields()
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}