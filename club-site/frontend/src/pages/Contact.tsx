import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
              <label htmlFor="name" className="block text-sm font-bold uppercase tracking-wide text-navy-950">Nom</label>
              <input
                id="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange("name")}
                className="mt-1 w-full border-2 border-navy-950 px-3 py-2 text-sm focus:border-cta-500 focus:outline-none focus:ring-2 focus:ring-cta-500/40"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wide text-navy-950">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange("email")}
                className="mt-1 w-full border-2 border-navy-950 px-3 py-2 text-sm focus:border-cta-500 focus:outline-none focus:ring-2 focus:ring-cta-500/40"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-bold uppercase tracking-wide text-navy-950">Sujet</label>
              <input
                id="subject"
                required
                minLength={2}
                value={form.subject}
                onChange={handleChange("subject")}
                className="mt-1 w-full border-2 border-navy-950 px-3 py-2 text-sm focus:border-cta-500 focus:outline-none focus:ring-2 focus:ring-cta-500/40"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-bold uppercase tracking-wide text-navy-950">Message</label>
              <textarea
                id="message"
                required
                minLength={10}
                rows={5}
                value={form.message}
                onChange={handleChange("message")}
                className="mt-1 w-full border-2 border-navy-950 px-3 py-2 text-sm focus:border-cta-500 focus:outline-none focus:ring-2 focus:ring-cta-500/40"
              />
            </div>

            <motion.button
              type="submit"
              disabled={sendContact.isPending}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="border-2 border-navy-950 bg-navy-950 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-hard transition-colors hover:bg-cta-500 hover:text-navy-950 disabled:opacity-50"
            >
              {sendContact.isPending ? "Envoi..." : "Envoyer le message"}
            </motion.button>

            <AnimatePresence mode="wait">
              {sendContact.isSuccess && (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium text-green-700"
                >
                  Merci, votre message a bien été envoyé.
                </motion.p>
              )}
              {sendContact.isError && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium text-red-700"
                >
                  {sendContact.error.message}
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          <div className="border-2 border-navy-950 bg-navy-50 p-6">
            <h3 className="font-display text-xl font-semibold text-navy-900">Coordonnées</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-navy-500">Adresse</dt>
                <dd className="text-navy-800">{club?.address}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-500">Email</dt>
                <dd className="text-navy-800">{club?.contactEmail}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-500">Téléphone</dt>
                <dd className="text-navy-800">{club?.contactPhone}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}
