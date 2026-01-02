// components/AdminRoute.tsx
import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth" // 경로가 ../hooks/.. 로 변경됨

interface Props {
  children: ReactNode
}

const AdminRoute = ({ children }: Props) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>로그인 정보를 확인하는 중...</div>
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute