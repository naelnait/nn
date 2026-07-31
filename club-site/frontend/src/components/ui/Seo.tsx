import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
}

export function Seo({ title, description }: SeoProps) {
  const fullTitle = `${title} | CCMB Chartres`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
    </Helmet>
  );
}
