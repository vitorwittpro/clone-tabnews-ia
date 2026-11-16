import './globals.css';

export const metadata = {
  title: 'Calendário dos gatos',
  description: 'Um gato para cada mês e um presente para cada dia.',
};

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
