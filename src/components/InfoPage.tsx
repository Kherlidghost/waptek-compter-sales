import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

type InfoPageSection = {
  title: string;
  body: string;
};

export function InfoPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: InfoPageSection[] }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase text-emerald-700">{eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">{intro}</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
