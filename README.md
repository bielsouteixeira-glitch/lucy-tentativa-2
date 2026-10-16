# Lu Corrêa Animal Care — site institucional

Site institucional da **Lu Corrêa Animal Care** (clínica veterinária + estética animal),
construído em **Next.js 16 (App Router) + Tailwind CSS 4 + Framer Motion**, com
**exportação 100% estática** para publicação no Netlify.

Todos os assets (logotipo, fotografias e vídeos) estão **dentro do projeto**, em `public/assets/`.
Nada depende de links do Google Drive ou de sessões autenticadas.

---

## 1. Publicar no Netlify (upload manual — caminho mais simples)

1. Use o arquivo **`lu-correa-animal-care-netlify.zip`** (pacote de publicação já compilado).
2. Acesse o Netlify → *Sites* → **Add new site → Deploy manually** (ou a aba *Deploys* de um site existente).
3. Arraste o ZIP para a área de upload. Se o fluxo escolhido não aceitar ZIP,
   extraia o arquivo e arraste **o conteúdo da pasta** (o `index.html` precisa ficar na raiz).
4. Abra o endereço gerado e confira o site no computador e no celular.

> O ZIP de publicação já contém `index.html` na raiz, `404.html`, a pasta `_next/`,
> todos os assets e um `netlify.toml` com cabeçalhos de cache/segurança.
> **Não é necessário rodar `npm install` nem `npm run build` na sua máquina.**

## 2. Publicar via Git/CLI (build no Netlify)

Se preferir conectar o repositório, o `netlify.toml` da raiz já está configurado:

```toml
[build]
  command = "STATIC_EXPORT=1 npm run build"
  publish = "out"
```

Node 22 é definido em `[build.environment]`.

---

## 3. Rodar localmente

```bash
npm install
npm run dev                      # http://localhost:3000
```

### Builds

```bash
npm run build                    # build padrão (servidor Next.js)
STATIC_EXPORT=1 npm run build    # exportação estática -> pasta out/
node scripts/package.mjs         # build estático + validação + geração dos 2 ZIPs
```

Os ZIPs são gravados em `public/downloads/`:

| Arquivo | Finalidade |
| --- | --- |
| `lu-correa-animal-care-netlify.zip` | **Pacote de publicação** (arquivos compilados, upload direto no Netlify) |
| `lu-correa-animal-care-source.zip` | Código-fonte completo, para manutenção futura |

---

## 4. Estrutura dos assets

```
public/
├─ assets/
│  ├─ logo/
│  │  ├─ lu-correa-animal-care-logo.png   (recortado, fundo transparente — usado no site)
│  │  └─ logo-original.jpg                (arquivo original preservado)
│  ├─ images/
│  │  ├─ lucy-portrait.jpg | lucy-dog1.jpg | lucy-dog2.jpg | additional.jpg  (originais)
│  │  ├─ optimized/*.webp                 (versões otimizadas servidas por <picture>)
│  │  └─ og-image.jpg                     (Open Graph 1200x630)
│  ├─ posters/                            (pôsteres extraídos dos próprios vídeos)
│  └─ videos/
│     ├─ care.mp4                         (atendimento)
│     └─ vaccine.mp4                      (aplicação de vacina)
├─ icon.png · apple-icon.png · favicon-32.png   (gerados a partir do emblema da marca)
```

`scripts/process-assets.mjs` regenera logo recortado, ícones, WebP e pôsteres a partir
dos arquivos originais (requer `sharp` e `ffmpeg-static`, já declarados no projeto).

---

## 5. Dados do negócio usados no site

- **WhatsApp:** +55 11 91187-9750 — todos os botões abrem `api.whatsapp.com` em nova aba
  com mensagem pré-preenchida por serviço.
- **Instagram:** https://www.instagram.com/lucorrea_animalcare
- **Horários:** seg–sex 09:00–17:00 · sáb 09:00–15:00 · dom fechado.
- Nenhum endereço, preço, prazo, avaliação, depoimento ou credencial foi inventado.

---

## 6. Correção aplicada: fotos invisíveis no Netlify

**Sintoma:** o site abria normalmente, mas nenhuma fotografia nem vídeo aparecia.

**Causa raiz (não era caminho de arquivo):** as seções usavam `motion.*` do
Framer Motion com `initial={{ opacity: 0 }}`. O Next.js renderiza isso no HTML
estático como `style="opacity:0"`. O HTML publicado tinha **33 blocos com
`opacity:0`, contendo 13 das 14 mídias da página** — ou seja, todas as fotos e os
dois vídeos só ficariam visíveis **depois** que 816 KB de JavaScript baixassem e
hidratassem. Qualquer falha nesse caminho (chunk não enviado, erro de hidratação,
JS bloqueado, `IntersectionObserver` que não dispara) deixava as mídias
permanentemente invisíveis. O logotipo aparecia porque era a única imagem fora de
um wrapper animado — exatamente o sintoma relatado.

**Correção:**

1. Criado o componente `Reveal` (`src/components/Reveal.tsx`), que **não é client
   component** e marca o elemento apenas com `data-reveal`. O HTML sai com o
   conteúdo visível.
2. A ocultação inicial só existe sob a classe `js-anim`, aplicada ao `<html>` por
   um script inline (`src/lib/enhance.ts`) independente do bundle do Next.
   Sem JavaScript → sem `js-anim` → **nada é escondido**.
3. Redes de segurança: `try/catch`, revelação forçada após 2,5 s e no `load`.
4. O atributo usado é `data-shown` (e não uma classe), para que a hidratação do
   React nunca reverta a revelação.
5. Entradas convertidas para CSS em Hero, TrustStrip, Services, About, Gallery,
   Videos, Booking, Hours, Contact e no botão flutuante. O Framer Motion ficou
   apenas no menu mobile e no lightbox — overlays que, por natureza, só existem
   com JS e não escondem conteúdo.

**Correções adicionais encontradas na mesma auditoria:**

- `<picture>` **não faz fallback automático** quando o `<source>` WebP falha: o
  script de realce detecta o erro, remove os `<source>` e recarrega o JPEG.
- `<picture>` é `display:inline`, então `h-full` nas fotos não resolvia; passou a
  usar `display:contents`.

**Segunda rodada — arquitetura de arquivo único por foto:**

Para eliminar qualquer outro modo de falha, as fotos deixaram de usar
`<picture>` + `<source>` (WebP) e passaram a usar **uma única tag `<img>`
apontando para um único arquivo JPEG**. Motivos:

- `<picture>` **não faz fallback automático** se o `<source>` falhar — a imagem
  simplesmente não aparece;
- dois arquivos por foto = duas chances de erro no upload/deploy;
- JPEG é suportado por 100% dos navegadores, sem negociação de formato.

Os originais ficam preservados em `public/assets/images/original/`; os arquivos
servidos são JPEGs otimizados (1280 px, qualidade 82, progressivos).

**Vazamento dos ZIPs para o pacote:** `public/downloads/` era copiado pelo Next
para a pasta publicada, inflando o deploy a cada build (17 MB). O empacotador
agora remove `out/downloads` e **falha** se encontrar `.zip`, `.map` ou `.log`
dentro do pacote. Pacote final: 6,25 MB.

**Proteção contra regressão:** `scripts/package.mjs` falha o empacotamento se o
HTML tiver `opacity:0` inline, se alguma mídia ficar dentro de bloco oculto, se
existir regra CSS que esconda conteúdo sem JavaScript ativo ou se houver
artefatos indevidos.

**Verificação automatizada:**

```bash
node scripts/verify-render.mjs out     # confere cada <img>/<video> e a cascata CSS
node scripts/serve-static.mjs out      # serve o pacote em http://127.0.0.1:4321
```

`verify-render.mjs` reconstrói a cascata CSS compilada, calcula se cada elemento
ficaria invisível sem JavaScript, valida a assinatura binária e as dimensões
reais de cada arquivo e detecta capitalização divergente, caminhos absolutos e
URLs privadas.

**Verificação do pacote:** `node scripts/verify-render.mjs out` confere a
cascata CSS, cada `<img>`/`<video>`, assinaturas binárias e dimensões reais.

> **Nota sobre Vite:** este projeto é **Next.js 16**, não Vite. Portanto
> `vite-plugin-singlefile` não se aplica. Além disso, embutir tudo num único
> HTML seria contraproducente aqui: os dois vídeos somam ~3,6 MB e, em base64,
> inflariam ~33%, impedindo cache e streaming por range.

---

## 7. Terceira rodada — site publicado protegido e nomes alternativos

**Achado 1 — o site publicado está protegido por senha.**
`https://neon-pie-9b3fb8.netlify.app/` responde **HTTP 401** com a página
"Login Redirect" do Netlify (edge-access). Isso vale para **todos** os caminhos,
inclusive `/assets/images/*.jpg`. Consequência prática: não foi possível
inspecionar o site publicado de fora, e qualquer visitante não autenticado
também não acessa. Para abrir ao público:
**Netlify → Site configuration → Access & security → Visitor access → remover a proteção.**

**Achado 2 — nomes de arquivo divergentes.**
Os caminhos citados foram conferidos um a um contra o disco:

| Caminho citado | Situação |
| --- | --- |
| `public/assets/logo/logo-original.jpg` | existe |
| `public/assets/images/lucy-with-dog-01.jpg` | **não existia** — o nome canônico é `lucy-dog1.jpg` |
| `public/assets/images/` | existe |
| `public/assets/videos/` | existe |
| `public/assets/posters/` | existe |

Se o HTML publicado referencia `lucy-with-dog-01.jpg`, essa requisição retorna
404 e a foto não aparece — exatamente o sintoma relatado.

**Correção:** foram criados **aliases de compatibilidade**, que são cópias reais
das mesmas fotografias sob os nomes alternativos conhecidos (não são imagens
genéricas nem arquivos vazios):

```
lucy-with-dog-01.jpg  -> mesma foto de lucy-dog1.jpg
lucy-with-dog-02.jpg  -> mesma foto de lucy-dog2.jpg
lucy-correa.jpg       -> mesma foto de lucy-portrait.jpg
additional-photo.jpg  -> mesma foto de additional.jpg
logo.png              -> mesmo logotipo de lu-correa-animal-care-logo.png
optimized/*.webp      -> versões WebP (referenciadas por uma build anterior)
```

Assim, qualquer versão do HTML — a atual ou uma anterior — encontra as imagens.

**Página de autodiagnóstico:** o pacote inclui **`/diagnostico.html`**.
Abra `https://SEU-SITE.netlify.app/diagnostico.html` depois de publicar: ela
carrega cada arquivo de mídia e mostra ✅/❌ com dimensões e tamanho real,
sem precisar de ferramentas de desenvolvedor.

**`_headers`:** adicionado na raiz do pacote (formato nativo que o Netlify lê
também em deploy manual) com cache dos assets, `Accept-Ranges` para os vídeos e
cabeçalhos de segurança.

---

## 8. Observações técnicas

- A rota `/api/health` é estática (`force-static`) e é exportada como arquivo JSON,
  mantendo compatibilidade com hospedagem estática.
- O projeto **não precisa de banco de dados** em produção. As dependências de banco
  (`drizzle-orm`, `pg`) permanecem apenas no ambiente de desenvolvimento do template e
  não são usadas por nenhuma página do site.
- Acessibilidade: navegação por teclado, foco visível, `prefers-reduced-motion`,
  textos alternativos descritivos e controles nativos de vídeo.
- Nenhuma chave, token ou credencial está incluída nos pacotes (`.env` fica fora do ZIP).
