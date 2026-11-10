// Contact form. The id comes from the Formspree dashboard (formspree.io/forms); it is public by design.
// Replies go to the address configured there. The build tests refuse the placeholder.
export const FORMSPREE_FORM_ID = "xljbrgkb";
export const formspreeEndpoint = `https://formspree.io/f/${FORMSPREE_FORM_ID}`;

// Direct support channel. One source for the floating button, the footer and the access section.
export const WHATSAPP_NUMBER = "56956039666";
export const WHATSAPP_DISPLAY = "+56 9 5603 9666";

export const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, tengo una consulta sobre Umbral.",
)}`;
