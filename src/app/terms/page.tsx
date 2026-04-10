import { cookies } from "next/headers";
import { resolveLocale, LOCALE_COOKIE_NAME } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

import { Footer } from "../components/Footer";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(locale);
  const t = dict.auth;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 animate-fade-in">
        <h1 className="mb-8 text-3xl font-bold text-white md:text-4xl text-center">
          {t.termsTitle || "Termos e Condições"}
        </h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-slate-100">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar o Gasty Games, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar este site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">2. Licença de Uso</h2>
            <p>
              É concedida permissão para acessar temporariamente os jogos e conteúdos do portal Gasty Games apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">3. Isenção de Responsabilidade</h2>
            <p>
              Os materiais no portal Gasty Games são fornecidos "como estão". Não oferecemos garantias, expressas ou implícitas, e por este meio, isentamos e negamos todas as outras garantias, incluindo, sem limitação, garantias implícitas de comercialização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">4. Modificações</h2>
            <p>
              O Gasty Games pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
            </p>
          </section>

          <div className="rounded-xl bg-slate-900/50 p-6 border border-slate-800 text-center">
            <p className="text-sm font-medium text-slate-400">
              Dúvidas? Entre em contato conosco através da nossa página de suporte.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800/40">
          <Footer />
        </div>
      </div>
    </div>
  );
}
