"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff } from "lucide-react"
import CryptoJS from "crypto-js"

interface PasswordLandingProps {
  onPasswordCorrect: () => void
}


const CORRECT_PASSWORD_HASH = "5620ee0df3b6331673192f6a01c4da03761061910c658bbda69ce083d8ae8617"

export function PasswordLanding({ onPasswordCorrect }: PasswordLandingProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const hashPassword = (inputPassword: string): string => {
    // Create a hash using SHA-256 with a salt
    const salt = "huella_salt_2024"
    return CryptoJS.SHA256(inputPassword + salt).toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    const hashedInput = hashPassword(password)
    
    if (hashedInput === CORRECT_PASSWORD_HASH) {
      // Store authentication in sessionStorage
      sessionStorage.setItem("huella_authenticated", "true")
      onPasswordCorrect()
    } else {
      setError("Contraseña incorrecta. Intenta nuevamente.")
      setPassword("")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-stone-800/50 backdrop-blur-sm border-stone-700 shadow-2xl p-8">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-stone-300" />
            </div>
            <CardTitle className="text-2xl font-bold text-stone-100">
              Acceso Restringido
            </CardTitle>
            <p className="text-stone-400 text-sm">
              Ingresa la contraseña para acceder a laF aplicación
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-200">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="bg-stone-700/50 border-stone-600 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-stone-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-stone-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-stone-600 hover:bg-stone-500 text-stone-100 font-medium"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  "Acceder"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-stone-500 text-xs">
            La Vía Muerta - Huella Histórica
          </p>
        </div>
      </div>
    </div>
  )
}
