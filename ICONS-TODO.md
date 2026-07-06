# ICONS-TODO — Gerar ícones PNG para o PWA

O `manifest.json` já referencia `icon-192.png` e `icon-512.png`, mas os arquivos
ainda não existem. Sem eles o Chrome/Android não exibe o install prompt corretamente.

## Arquivos a criar

| Arquivo       | Tamanho  | Uso                                    |
|---------------|----------|----------------------------------------|
| `icon-192.png` | 192×192 | Ícone padrão Android / install prompt  |
| `icon-512.png` | 512×512 | Splash screen e app launcher           |

Ambos devem ser colocados na **raiz do projeto** (ao lado de `favicon.svg`).

## Como gerar a partir de `favicon.svg`

### Opção 1 — Inkscape (GUI)
1. Abrir `favicon.svg` no Inkscape
2. **Arquivo → Exportar PNG**
3. Definir largura/altura → Exportar como `icon-192.png`
4. Repetir para `icon-512.png`

### Opção 2 — CLI com `sharp-cli` (recomendado)
```bash
npm install -g sharp-cli
sharp -i favicon.svg -o icon-192.png resize 192 192
sharp -i favicon.svg -o icon-512.png resize 512 512
```

### Opção 3 — CLI com Inkscape headless
```bash
inkscape favicon.svg --export-type=png --export-filename=icon-192.png -w 192 -h 192
inkscape favicon.svg --export-type=png --export-filename=icon-512.png -w 512 -h 512
```

### Opção 4 — Online
- [svgtopng.com](https://svgtopng.com) ou [squoosh.app](https://squoosh.app)
- Faça upload do `favicon.svg`, exporte em 512×512, depois redimensione para 192×192

## Nota sobre "maskable"

Os ícones estão marcados como `"purpose": "any maskable"` no manifest.
Para `maskable` funcionar corretamente, o conteúdo visual do ícone deve estar
dentro da **zona segura** (círculo inscrito de ~80% do tamanho total).
Se o favicon.svg já tem padding suficiente, nenhum ajuste é necessário.
Verifique em: https://maskable.app
