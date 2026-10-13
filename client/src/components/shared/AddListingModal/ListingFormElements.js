import React, { useEffect, useRef } from 'react';
import { FileText, Settings, CheckSquare, Images, Banknote, Tags, MapPin, Search, Lock } from 'lucide-react';
import { LISTING_FORM_SECTIONS, listingErrorSection } from '../../../utils/adminListingForm.js';
import './AdminListingForm.css';

const icons = { basic: FileText, specs: Settings, features: CheckSquare, media: Images, pricing: Banknote, savings: Tags, location: MapPin, seo: Search, records: Lock };
export function ListingSectionIcon({ section }) { const Icon = icons[section]; return <Icon size={17} aria-hidden="true" />; }
export function ListingSectionHeading({ section }) {
  const current = LISTING_FORM_SECTIONS.find(item => item.id === section) || LISTING_FORM_SECTIONS[0];
  return <div className="listing-section-heading"><span>Section {LISTING_FORM_SECTIONS.indexOf(current) + 1} of {LISTING_FORM_SECTIONS.length}</span><h3>{current.label}</h3><p>{current.description}</p></div>;
}
export function focusListingError(field, changeSection, formRef) {
  changeSection(listingErrorSection(field));
  requestAnimationFrame(() => {
    const input = field === 'images' ? formRef.current?.querySelector('.image-upload-area') : (formRef.current?.querySelector(`[name="${field}"]`) || formRef.current?.querySelector(`#${field.split('.').pop()}`));
    input?.focus();input?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  });
}
export function ListingFormFeedback({ errors, changeSection, formRef }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return <div className="listing-error-summary" role="alert"><strong>Check these details before saving</strong><ul>{entries.map(([field, message]) => <li key={field}><button type="button" onClick={() => focusListingError(field, changeSection, formRef)}>{message}</button></li>)}</ul></div>;
}
export function useListingPreviews(images, isOpen) {
  const previews = useRef(new Set());
  useEffect(() => { images.forEach(image => { if (image.preview?.startsWith('blob:')) previews.current.add(image.preview); }); }, [images]);
  useEffect(() => { if (!isOpen) { previews.current.forEach(url => URL.revokeObjectURL?.(url)); previews.current.clear(); } }, [isOpen]);
  useEffect(() => () => { previews.current.forEach(url => URL.revokeObjectURL?.(url)); }, []);
}
export function useListingDialog(isOpen, isSubmitting, onClose, dialogRef) {
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow, previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';dialogRef.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [isOpen, dialogRef]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = event => {
      if (event.key === 'Escape' && !isSubmitting) { event.preventDefault();onClose(); }
      if (event.key === 'Tab') {
        const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || [])].filter(element => element.getClientRects().length);
        if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === dialogRef.current)) { event.preventDefault();controls.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault();controls[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, isSubmitting, onClose, dialogRef]);
}
