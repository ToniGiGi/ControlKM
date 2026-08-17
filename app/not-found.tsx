import Link from 'next/link'

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
      <p className="mb-4 text-muted-foreground">La página que buscas no existe o ha sido movida.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
