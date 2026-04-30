import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Accesso Piattaforma</h1>
          <p className="mt-2 text-sm text-zinc-400">Inserisci le tue credenziali per continuare</p>
        </div>
        
        <form className="space-y-6">
          {searchParams.error && (
            <div className="rounded-md bg-red-500/10 p-3 text-center text-sm text-red-500 border border-red-500/20">
              Errore: Codici non validi o errore di sistema.
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Codice 1
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="text"
                required
                className="block w-full rounded-md border-0 bg-zinc-950 py-2 text-white shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              Codice 2
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-md border-0 bg-zinc-950 py-2 text-white shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3 transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              formAction={login}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              Accedi
            </button>
            <button
              formAction={signup}
              className="flex w-full justify-center rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              Registrati (Solo Admin)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
