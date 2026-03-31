# Design System — AR Academy Landing

## Tipografía

- **Font family**: `aktiv-grotesk, sans-serif` (Adobe Fonts kit `cbv1cvv`)
- **Pesos disponibles**: 300 (light), 400 (regular), 500 (medium/semibold)
- **Regla general**: todo el texto va en `text-transform: uppercase` salvo textos legales y notices
- **Letter-spacing**: siempre negativo, proporcional al tamaño:
  - 64px → `-3.2px`
  - 48px → `-2.4px`
  - 36px → `-1.8px`
  - 32px → `-0.32px`
  - 24px → `-0.24px`
  - 20px → `-0.4px`
  - 16px → `-0.32px`
  - 15px → `-0.15px`
  - 14px → `-0.14px`
  - 12px → `-0.12px` o `-0.24px`

## Colores

| Token              | Hex       | Uso                            |
| ------------------- | --------- | ------------------------------ |
| bg-white            | `#ffffff` | Fondo principal                |
| bg-dark             | `#161616` | Secciones oscuras, botones     |
| bg-light            | `#eeeeee` | Secciones gris claro           |
| accent-wine         | `#831a36` | Acentos, "Mentira", video btn  |
| accent-pink         | `#e3285a` | Precio tachado                 |
| accent-gold         | `#e3b25e` | Barra dorada                   |
| text-black          | `#000000` | Texto principal sobre blanco   |
| text-dark           | `#161616` | Texto secundario sobre blanco  |
| text-light          | `#eeeeee` | Texto sobre fondo oscuro       |
| text-muted          | `#868686` | Texto atenuado                 |
| text-muted-dark     | `#686868` | Info text                      |
| text-gray           | `#7b7b7b` | Stripe notices                 |
| stripe-purple       | `#635bff` | Stripe brand                   |

## Botón principal

Todos los botones CTA siguen este patrón exacto:

### Estilo

```scss
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 20px;
  background: #161616;
  color: #eeeeee;
  font-family: "aktiv-grotesk", sans-serif;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: -0.32px;
  line-height: 20.48px;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
}
```

### Flecha (SVG de Figma)

```svg
<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0.377313 12.6223L12.4654 0.534226M12.4654 0.534226L0.377314 0.534227M12.4654 0.534226L12.4654 12.6223" stroke="currentColor"/>
</svg>
```

### Componente React

```tsx
import ArrowIcon from "./ArrowIcon";

<button className={styles.submitBtn}>
  <span>TEXTO DEL BOTÓN</span>
  <ArrowIcon />
</button>
```

### Variante sobre fondo oscuro (invertido)

```scss
.btnLight {
  background: #eeeeee;
  color: #161616;
}
```

## Layout

- **Max width**: `1200px`
- **Breakpoint tablet**: `768px`
- **Breakpoint mobile**: `480px`
- **Padding lateral desktop**: `40px`
- **Padding lateral mobile**: `18px`
