import { cookies } from "next/headers";
import { resolveLocale, LOCALE_COOKIE_NAME } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/config";

export default async function ContactPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(locale);
  const t = dict.auth;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          {t.contactTitle || "Fale Conosco"}
        </h1>
        <p className="text-slate-400">
          Tem alguma dúvida, sugestão ou encontrou um erro? Adoraríamos ouvir você.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Info Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-lg font-semibold text-white mb-4">Informações de Contato</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xl">
                ✉️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</p>
                <p className="text-slate-200">alexmeira@protonmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xl">
                👥
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Redes Sociais</p>
                <a href={SITE_CONFIG.facebookPage} target="_blank" className="text-cyan-400 hover:underline">
                  Siga-nos no Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Business Day Info */}
        <div className="flex flex-col justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-2xl">
            ⚡
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Resposta Rápida</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Nossa equipe costuma responder a todas as mensagens em até **24 horas úteis**. Se você é um desenvolvedor querendo submeter um jogo, use o assunto "Submissão de Jogo" no seu e-mail.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-slate-700/60 p-8 text-center bg-slate-950/40">
        <p className="text-[13px] text-slate-500 italic">
          Gasty Games - Democratizando o acesso a jogos premium em qualquer dispositivo.
        </p>
      </div>
    </div>
  );
}
