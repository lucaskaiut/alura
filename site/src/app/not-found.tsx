import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold text-text-muted">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-text">Página não encontrada</h2>
      <p className="mt-2 text-text-muted">
        A página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700"
      >
        Voltar para home
      </Link>
    </div>
  );
}
