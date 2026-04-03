// src/hooks/useSEO.js — centralised SEO helper
// Usage: useSEO({ title, description, image, url, type, jsonLd })
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'BW Car Culture';
const SITE_URL   = 'https://www.i3wcarculture.com';
const DEFAULT_IMG = `${SITE_URL}/bcc-logo.png`;

/**
 * Returns a fully-populated <Helmet> element.
 * Import and render this where you need per-page SEO.
 *
 * @param {object} opts
 * @param {string}  opts.title       — page title (will be appended with " | BW Car Culture")
 * @param {string}  opts.description — meta description (max ~160 chars)
 * @param {string}  [opts.image]     — absolute URL for OG image
 * @param {string}  [opts.url]       — canonical URL (defaults to current href)
 * @param {string}  [opts.type]      — OG type: "website" | "article" | "product"  (default: "website")
 * @param {object}  [opts.jsonLd]    — Schema.org JSON-LD object (will be stringified)
 */
export const buildHelmet = ({ title, description, image, url, type = 'website', jsonLd } = {}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Botswana's Car Marketplace`;
  const desc      = description || "Botswana's premier car marketplace — buy, sell and discover vehicles, find dealerships and workshops, explore EV charging, and read car news.";
  const img       = image || DEFAULT_IMG;
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export { SITE_URL, SITE_NAME, DEFAULT_IMG };
