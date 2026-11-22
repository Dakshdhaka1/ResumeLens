# ResumeLens: Design System

**Concept: an editorial career magazine meets a precision instrument.** The resume is a document
under a lens. Warm paper, sharp ink, and one confident colour (vermilion) that marks the thing the lens
is focused on. Everything else stays quiet so the accent has meaning.

## 1. Colour

All colours are CSS variables in `frontend/app/globals.css`; components never use raw hex.

### Light ("paper")
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F5F1E8` | page background |
| `--paper-2` | `#EDE7DA` | inset areas, input wells |
| `--card` | `#FBF8F2` | raised cards |
| `--ink` | `#14161A` | primary text, primary buttons |
| `--ink-2` | `#3A3B3F` | secondary text |
| `--muted` | `#5C5A55` | captions, metadata (6.0:1 on paper) |
| `--rule` | `#D9D1C0` | hairlines, borders, grid |
| `--accent` | `#FF4F1F` | vermilion: fills, the lens, focus ring, gauge |
| `--accent-ink` | `#B8330B` | accent used as **text** on paper (5.1:1) |
| `--on-accent` | `#14161A` | text on a vermilion fill (6.1:1) |

### Dark ("ink on charcoal")
Not an inversion. The page becomes a charcoal desk, cards become slightly lifted sheets, and text is
a warm off-white like printed paper, never pure white.
| Token | Hex |
|---|---|
| `--paper` | `#131416` |
| `--paper-2` | `#1A1B1E` |
| `--card` | `#1F2024` |
| `--ink` | `#EDE6D6` |
| `--ink-2` | `#C9C2B3` |
| `--muted` | `#A39D90` |
| `--rule` | `#33353A` |
| `--accent` | `#FF6A3D` |
| `--accent-ink` | `#FF8A63` |
| `--on-accent` | `#131416` |

### Priority (status) colours: used ONLY on gap badges, always with a text label
| Priority | Light text / bg | Dark text / bg |
|---|---|---|
| high | `#9E2318` / `#F4DAD3` | `#FF9C8C` / `#3A1D1A` |
| medium | `#7A5200` / `#F3E4C0` | `#E9BC62` / `#332918` |
| low | `#2D6236` / `#DCE9D6` | `#93CBA0` / `#1C2D21` |

### Chart series (validated with the dataviz palette checker: CVD ΔE ≥ 24, contrast ≥ 3:1)
| Series | Light | Dark |
|---|---|---|
| Gemini | `#E8461E` | `#E85A2A` |
| Groq (GPT-OSS) | `#1F5FB8` | `#4A86E0` |
| Claude (optional) | `#2E8A57` | `#3FA36C` |

Prompt versions v1, v2 and v3 are an x-axis category, never a colour. Charts always have a legend and direct value labels.

## 2. Typography
| Role | Font | Notes |
|---|---|---|
| Display / headings | **Fraunces** (variable, opsz + SOFT) | 600 weight, `letter-spacing: -0.035em`, `opsz 144` at hero sizes, italics for emphasis words |
| Body / UI | **Geist** | 400/500; 16px base, line-height 1.55 |
| Numbers, scores, JSON, labels | **JetBrains Mono** | tabular numbers; uppercase micro-labels at 11-12px with `letter-spacing: 0.08em` |

Type scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.5 · 3.5 · 5 · 7 (hero, clamp-based).

## 3. Spacing and layout
- 4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- 12-column editorial grid, max width 1280px, 24px gutters (16px on mobile).
- **Asymmetric:** headlines sit on columns 1–7 with the illustration on 8–12. Results put the gauge in a narrow left rail and the findings in a wide right column.
- Section numbers ("01 / Inputs") in mono, like magazine folios.
- Radius: 2px on inputs and badges, 6px on cards. Paper doesn't have pill-shaped corners. Badges are the only pills.
- Borders: 1px `--rule` hairlines instead of shadows. One soft shadow, used only on hover-lift.

## 4. Texture and background
- **Paper grain:** an inline SVG `feTurbulence` noise layer fixed over the page at 5% opacity (3.5% in dark), with `mix-blend-mode: multiply` (`soft-light` in dark).
- **Colour blobs:** two or three blurred circles in accent tones (vermilion, a warm amber `#FFB37A`) at 10–18% opacity, drifting slowly (40–60s loops) behind the hero.
- **Ruled lines:** the hero has a faint horizontal rule pattern (28px pitch, `--rule` at 50%) and a left margin line in accent at 25%, like a legal pad.

## 5. Illustration
Custom inline SVG only, drawn with 1.5px ink strokes and a single accent fill: a resume sheet with a sweeping lens (hero), a scanning skeleton (loader), four rubric icons (skills = interlocking tags, projects = stacked sheets, bullets = list with pen, formatting = ruler and margins), and an empty state (a blank sheet with the lens resting on it). No stock photos and no emoji.

## 6. Motion
| Token | Value | Use |
|---|---|---|
| `fast` | 150ms | hover, press |
| `base` | 300ms | toggles, panels |
| `reveal` | 600ms | entry of sections and cards |
| `count` | 1400ms | gauge and score count-up |
| ease | `cubic-bezier(0.22, 1, 0.36, 1)` | all tweens |
| spring | stiffness 420, damping 34 | `layoutId` indicators, magnetic buttons |
| stagger | 60ms (words), 80ms (cards) | lists |

Rules:
1. Motion explains state: content enters in reading order and never loops while you read. The background drift is the one exception, and it is slow.
2. Only animate `transform` and `opacity` (plus SVG `stroke-dashoffset`) to stay at 60fps.
3. `prefers-reduced-motion`: no translate, scale, sweep or drift. Elements fade in over 200ms or less, the gauge jumps to its value, and the lens sits still.

## 7. Accessibility
- WCAG AA contrast for all text. Accent text uses `--accent-ink`.
- Visible focus: a 2px `--accent` outline with a 2px offset on every interactive element.
- Segmented controls are radio groups with arrow-key support. The JSON panel is a `<details>` element.
- Priority is never shown by colour alone: the badge always says HIGH, MED or LOW.

## 8. Things we avoid
Purple-to-blue gradients, glassmorphism, emoji icons, robot or brain imagery, centred-everything
layouts, Inter-only typography, unstyled component-library defaults, and lorem ipsum.
