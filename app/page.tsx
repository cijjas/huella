import { AuthProvider } from "@/components/auth"
import { MainApp } from "@/components/app"

export default function Page() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
