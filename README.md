# Calendário dos gatos

Frontend em Next.js **16.2.12**, React e JavaScript, com App Router. Sem API, banco de dados ou serviços externos.

Requer Node.js 20.9 ou superior.

```sh
npm install
npm run dev
```

Abra http://localhost:3000. Para usar outra porta: `npm run dev -- --port 8000`.

```sh
npm run build
```

O build exporta o site estático para `out/`, pronto para qualquer hospedagem estática. Para conferir localmente: `python3 -m http.server 8000 --directory out`.

## Estrutura

- `app/layout.js`: documento, idioma, metadados e importação do CSS.
- `app/page.js`: calendário interativo com estado React e armazenamento local.
- `app/art.js`: ilustrações SVG e conteúdo estático.
- `app/globals.css`: estilos responsivos.
- `next.config.mjs`: exportação estática.

## Comportamentos locais

Navegação entre meses, temas claro/noturno, presentes com gatos ou mensagens, modo livre para resgatar qualquer data e limpeza dos resgates. Preferências e resgates usam as mesmas chaves de `localStorage` da versão anterior; sua recuperação depende de acessar a mesma origem (protocolo, domínio e porta).

Downloads de imagens SVG e figurinhas WebP estáticas de 512 × 512 são gerados no navegador. WebP requer suporte a Canvas/WebP e deve ser importado por um app de figurinhas para uso no WhatsApp. Resgates não sincronizam entre dispositivos. No modo padrão, a disponibilidade segue a data local do dispositivo.
