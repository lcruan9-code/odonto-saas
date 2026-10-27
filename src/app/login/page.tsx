"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockIcon } from "@/components/dental-icons";
import { ProductBrand } from "@/components/product-brand";
import { whiteLabel } from "@/config/white-label";

const demo = whiteLabel.demo;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("E-mail ou senha inválidos");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/demo/atendimento.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-primary/40" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="font-display text-3xl font-bold leading-tight">
            Agenda, pacientes e site da clínica em um só lugar.
          </p>
          <p className="mt-3 max-w-md text-white/80">
            Acompanhe as consultas do dia, receba agendamentos online e gerencie sua equipe.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex">
            <ProductBrand />
          </Link>

          <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <LockIcon className="h-4 w-4" /> Área da clínica
          </p>
          <h1 className="text-2xl font-bold">Entrar no painel</h1>
          <p className="mb-6 text-sm text-slate-500">Acesso exclusivo para a equipe da clínica.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-300 p-3 font-normal"
                autoComplete="email"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-slate-300 p-3 font-normal"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-navy py-3.5 font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {demo.clinicSlug && demo.showCredentialsOnLogin && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
              <p className="mb-1 font-semibold text-slate-800">Acesso de demonstração</p>
              <p>Administração: admin@sorrisopleno.com.br / admin123</p>
              <p>Recepção: recepcao@sorrisopleno.com.br / recepcao123</p>
              <p>Dentista: ana.souza@sorrisopleno.com.br / dentista123</p>
            </div>
          )}

          {demo.clinicSlug && (
            <p className="mt-6 text-center text-sm text-slate-500">
              É paciente?{" "}
              <Link href={`/clinica/${demo.clinicSlug}`} className="font-medium text-primary underline">
                Agende pelo site da clínica
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
