import { cookies } from "next/headers";
import { resolveLocale, LOCALE_COOKIE_NAME } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

import { Footer } from "../components/Footer";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(locale);
  const t = dict.auth;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 animate-fade-in">
        <h1 className="mb-8 text-3xl font-bold text-white md:text-4xl text-center">
          {t.privacyTitle || "Política de Privacidade"}
        </h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-slate-100">1. Coleta de Informações</h2>
            <p>
              No Gasty Games, para oferecer uma experiência personalizada, coletamos informações básicas como e-mail (caso você crie uma conta) e dados de progresso nos jogos. Também utilizamos cookies para entender como você usa o portal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">2. Google AdSense</h2>
            <p>
              O Google, como fornecedor de terceiros, utiliza cookies para exibir anúncios no seu site. Com o cookie DART, o Google pode exibir anúncios com base nas visitas feitas aos seus e a outros sites na Internet. Os usuários podem desativar o cookie DART visitando a Política de Privacidade da rede de conteúdo e anúncios do Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">3. Uso de Dados</h2>
            <p>
              Seus dados são usados exclusivamente para:
            </p>
            <ul className="list-disc pl-5">
              <li>Identificar sua conta e salvar seu progresso.</li>
              <li>Melhorar a performance do portal.</li>
              <li>Configurar anúncios relevantes via AdSense.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100">4. Segurança</h2>
            <p>
              Implementamos medidas de segurança modernas como hashing de senhas (bcrypt) e criptografia de sessões para garantir que seus dados permaneçam privados.
            </p>
          </section>

          <div className="rounded-xl bg-slate-900/50 p-6 border border-slate-800">
            <p className="text-sm">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
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
