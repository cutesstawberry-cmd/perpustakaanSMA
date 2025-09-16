import React, { useState } from 'react'
import { Button, Input, Form, Card, Col, Row } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import { Library, BookOpen, Users, Shield, GraduationCap, Book, Award } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface LoginFormData {
  emailOrMemberId: string
  password: string
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [form] = Form.useForm()
  const { signIn } = useAuthStore()

  const onSubmit = async (values: LoginFormData) => {
    try {
      setIsLoading(true)
      console.log('Form submitted with values:', values)
      
      // Validate data before sending
      if (!values.emailOrMemberId || !values.password) {
        throw new Error('Email/Member ID and password are required')
      }
      
      console.log('Attempting login with:', values.emailOrMemberId)
      await signIn(values.emailOrMemberId, values.password)
      console.log('Login successful')
    } catch (error) {
      console.error('Login error:', error)
      // Error handling is done in the store
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Manajemen Buku',
      description: 'Tambah, edit, cari, dan kelola koleksi buku perpustakaan sekolah dengan mudah.'
    },
    {
      icon: Users,
      title: 'Pelacakan Peminjaman',
      description: 'Monitor peminjaman siswa dan staf, tanggal jatuh tempo, serta pengembalian secara real-time.'
    },
    {
      icon: Shield,
      title: 'Manajemen Pengguna',
      description: 'Kelola akun dengan peran admin, pustakawan, dan anggota untuk akses yang aman.'
    }
  ]

  const stats = [
    { number: '1,000+', label: 'Buku Tersedia' },
    { number: '500+', label: 'Peminjaman Aktif' },
    { number: '100%', label: 'Pengguna Terdaftar' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Hero Section with Login */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-15 blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <Row gutter={[48, 48]} align="middle">
            {/* Left Side - Hero Content */}
            <Col xs={24} lg={12}>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                      <Library className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Perpustakaan Digital
                  </span>
                  <br />
                  <span className="text-gray-800 dark:text-white">
                    SMA MUSLIMIN
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Kelola perpustakaan sekolah dengan efisien: tambah buku, lacak peminjaman siswa, dan atur akses pengguna.
                  Pastikan operasional perpustakaan berjalan lancar! 📚🔐
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        {stat.number}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features preview */}
                <div className="hidden lg:block">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Fitur Utama:
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      📚 Manajemen Buku
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                      🔍 Lacak Peminjaman
                    </span>
                    <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm font-medium">
                      👥 Kelola Pengguna
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Side - Login Form */}
            <Col xs={24} lg={12}>
              <div className="flex justify-center lg:justify-end">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      Masuk ke Akun
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Masuk untuk mengelola perpustakaan
                    </p>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onSubmit}
                    autoComplete="off"
                    className="space-y-1"
                  >
                    <Form.Item
                      label={
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          Email atau ID Anggota
                        </span>
                      }
                      name="emailOrMemberId"
                      rules={[
                        { required: true, message: 'Mohon masukkan email atau ID anggota Anda' }
                      ]}
                    >
                      <Input
                        placeholder="Contoh: admin@sma.com atau SMA001"
                        disabled={isLoading}
                        size="large"
                        prefix={<UserOutlined className="text-gray-400" />}
                        className="rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 hover:border-blue-400 transition-colors"
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          Kata Sandi
                        </span>
                      }
                      name="password"
                      rules={[
                        { required: true, message: 'Mohon masukkan kata sandi Anda' },
                        { min: 6, message: 'Kata sandi minimal 6 karakter' }
                      ]}
                    >
                      <Input.Password
                        placeholder="Masukkan kata sandi"
                        disabled={isLoading}
                        size="large"
                        prefix={<LockOutlined className="text-gray-400" />}
                        className="rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 hover:border-blue-400 transition-colors"
                        iconRender={visible => (visible ? <EyeInvisibleOutlined /> : <EyeOutlined />)}
                      />
                    </Form.Item>

                    <div className="pt-4">
                      <Form.Item className="mb-0">
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          size="large"
                          block
                          loading={isLoading}
                          disabled={isLoading}
                          className="h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Memproses...
                            </span>
                          ) : (
                            'Masuk ke Sistem'
                          )}
                        </Button>
                      </Form.Item>
                    </div>
                  </Form>

                  <div className="mt-8 text-center space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Belum punya akun? Hubungi administrator perpustakaan
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>👨‍🏫 Guru</span>
                      <span>📚 Pustakawan</span>
                      <span>🎓 Siswa</span>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6">
              <Book className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fitur Sistem Perpustakaan SMA
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Sistem manajemen perpustakaan sekolah yang lengkap untuk staf dan siswa
            </p>
          </div>
          
          <Row gutter={[32, 32]} justify="center">
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Siap Mengelola Perpustakaan? 🔐
              </h3>
              <p className="text-lg opacity-90 mb-6">
                Akses lengkap untuk mengelola buku, peminjaman, dan pengguna perpustakaan
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  size="large"
                  className="bg-white text-blue-600 hover:bg-gray-100 border-0 font-semibold px-8 h-12 rounded-xl"
                >
                  Mulai Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Library className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold">Sistem Perpustakaan SMA</span>
              </div>
              <p className="text-gray-300">
                Mengelola perpustakaan sekolah dengan aman dan efisien untuk semua pengguna.
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="text-gray-300 space-y-2">
                <p>📧 admin@perpustakaan.sma</p>
                <p>📞 (021) 1234-5678</p>
                <p>📍 Jl. Pendidikan No. 123</p>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-4">Jam Operasional</h4>
              <div className="text-gray-300 space-y-2">
                <p>Senin - Jumat: 07:00 - 16:00</p>
                <p>Sabtu: 08:00 - 12:00</p>
                <p>Online: 24/7</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-sm text-gray-300">
              &copy; 2025 Sistem Perpustakaan SMA. Hak cipta dilindungi undang-undang.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Dibuat dengan ❤️ untuk pengelolaan perpustakaan sekolah yang lebih baik 🇮🇩
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}