/** Caminhos de arquivos em `public/`, respeitando o subcaminho do GitHub Pages. */
export const publicUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`;
export const goalPlaceholder = publicUrl('goal-placeholder.svg');
