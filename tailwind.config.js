/**
 * Tailwind v3 — mesma major do protótipo de onde o Design System foi extraído,
 * então escalas de sombra, raio e espaçamento continuam idênticas ao que está
 * documentado em /design-system.
 *
 * A paleta da marca não vive aqui: o DS remapeia a escala neutra do Tailwind
 * para o marrom/marfim da AUZA em src/styles/_ds-brand.scss, escopado sob
 * `.ds-root`.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
