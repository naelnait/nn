import { useState, type FormEvent } from "react";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { useClub, useSendContact } from "../hooks/useApi";

export default function Contact() {
  const { data: club } = useClub();
  const sendContact = useSendContact();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendContact.mutate(form, {
      onSuccess: () => setForm({ name: "", email: "", subject: "", message: "" }),
    });
  }

  return (
    <>
      <Seo title="Contact" description="Contactez le CCMB Chartres pour toute question sur le club, la billetterie ou les partenariats." />
      <Section eyebrow="Une question ?" title="Contactez-nous">
        <div className="grid gap-10 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy-700">Nom</label>
              <input
                id="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange("name")}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange("email")}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-navy-700">Sujet</label>
              <input
                id="subject"
                required
                minLength={2}
                value={form.subject}
                onChange={handleChange("subject")}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-navy-700">Message</label>
              <textarea
                id="message"
                required
                minLength={10}
                rows={5}
                value={form.message}
                onChange={handleChange("message")}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendContact.isPending}
              className="rounded-md bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {sendContact.isPending ? "Envoi..." : "Envoyer le message"}
            </button>

            {sendContact.isSuccess && (
              <p className="text-sm font-medium text-green-700">Merci, votre message a bien été envoyé.</p>
            )}
            {sendContact.isError && (
              <p className="text-sm font-medium text-red-700">{sendContact.error.message}</p>
            )}
          </form>

          <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-6">
            <h3 className="font-display text-xl font-semibold text-navy-900">Coordonnées</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-navy-400">Adresse</dt>
                <dd className="text-navy-800">{club?.address}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-400">Email</dt>
                <dd className="text-navy-800">{club?.contactEmail}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-400">Téléphone</dt>
                <dd className="text-navy-800">{club?.contactPhone}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}
