import { useEffect, useState } from 'react'
import { Button, Input, Card, Modal, Table, Space, Select, Form, message, Popconfirm } from 'antd'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
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
  const { users, loading, fetchUsers, updateUserRole, updateUser, deleteUser, createUser } = useUserStore()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUpdateUser = async (values: Partial<User>) => {
    if (!selectedUser) return
    try {
      await updateUser(selectedUser.id, values)
      message.success('User updated successfully!')
      setIsEditModalOpen(false)
      setSelectedUser(null)
      form.resetFields()
    } catch (error: any) {
      message.error(error.message || 'Failed to update user')
    }
  }

  const handleUpdateRole = async (userId: string, role: User['role']) => {
    try {
      await updateUserRole(userId, role)
      message.success('User role updated successfully!')
    } catch (error: any) {
      message.error(error.message || 'Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      message.success('User deleted successfully!')
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user')
    }
  }

  const handleCreateUser = async (values: any) => {
    try {
      await createUser(values.member_id, values.password, {
        full_name: values.full_name,
        role: values.role,
        member_id: values.member_id,
        phone: values.phone,
        address: values.address,
      })
      message.success('User created successfully!')
      setIsCreateModalOpen(false)
      createForm.resetFields()
    } catch (error: any) {
      message.error(error.message || 'Failed to create user')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserOutlined />
            Manage Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage library users with Member ID
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          size="large"
        >
          Create New User
        </Button>
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
                      title="Edit user"
                    />
                    {user.id !== profile.id && (
                      <Popconfirm
                        title="Delete User"
                        description="Are you sure you want to delete this user? This action cannot be undone."
                        onConfirm={() => handleDeleteUser(user.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okType="danger"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          title="Delete user"
                        />
                      </Popconfirm>
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
        title={
          <div className="flex items-center gap-2">
            <EditOutlined />
            Edit User
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
          autoComplete="off"
        >
          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[
              { required: true, message: 'Please enter full name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must be less than 100 characters' }
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            label="Member ID"
            name="member_id"
            rules={[
              { required: true, message: 'Please enter member ID' },
              { pattern: /^[A-Z0-9]+$/, message: 'Member ID must contain only uppercase letters and numbers' },
              { min: 3, message: 'Member ID must be at least 3 characters' },
              { max: 20, message: 'Member ID must be less than 20 characters' }
            ]}
            extra="This is the login ID for the user"
          >
            <Input 
              placeholder="e.g., MEM001, STU123" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                e.target.value = value
                form.setFieldValue('member_id', value)
              }}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              }}
            />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input placeholder="e.g., +1234567890 or 123-456-7890" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { max: 200, message: 'Address must be less than 200 characters' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter user's address (optional)"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button 
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedUser(null)
                  form.resetFields()
                }}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<EditOutlined />}
              >
                Update User
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            Create New User
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Users will login using their Member ID (e.g., MEM001) instead of email.
          </p>
        </div>
        
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
          autoComplete="off"
        >
          <Form.Item
            label="Member ID"
            name="member_id"
            rules={[
              { required: true, message: 'Please enter member ID' },
              { pattern: /^[A-Z0-9]+$/, message: 'Member ID must contain only uppercase letters and numbers' },
              { min: 3, message: 'Member ID must be at least 3 characters' },
              { max: 20, message: 'Member ID must be less than 20 characters' }
            ]}
            extra="This will be used as the login ID for the user"
          >
            <Input 
              placeholder="e.g., MEM001, STU123, TCH456" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                e.target.value = value
                createForm.setFieldValue('member_id', value)
              }}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              }}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
              { max: 50, message: 'Password must be less than 50 characters' }
            ]}
            extra="Minimum 6 characters"
          >
            <Input.Password placeholder="Enter password for the user" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[
              { required: true, message: 'Please enter full name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must be less than 100 characters' }
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="member"
            extra="Members can borrow books, Librarians can manage books"
          >
            <Select>
              <Option value="librarian">Librarian</Option>
              <Option value="member">Member</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input placeholder="e.g., +1234567890 or 123-456-7890" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { max: 200, message: 'Address must be less than 200 characters' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter user's address (optional)"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button 
                onClick={() => {
                  setIsCreateModalOpen(false)
                  createForm.resetFields()
                }}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<PlusOutlined />}
              >
                Create User
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}