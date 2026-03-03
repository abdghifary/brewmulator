# Grinder Fines Fraction Reference

This document records the research behind each grinder's `defaultFinesFraction` value used in the simulator. Fines are defined as particles **<100μm** per Gagné 2023.

## Background

Coffee grinders produce a bimodal particle size distribution (PSD): a primary peak at the target grind size and a secondary "fines" peak at ~30–50μm. The fraction of coffee mass in the fines peak significantly affects extraction — fines extract almost instantly due to their high surface-area-to-volume ratio, contributing body and potential bitterness/astringency.

The fines fraction varies dramatically by grinder quality, burr geometry (flat vs conical), and burr alignment. This is the single most impactful grinder characteristic for extraction modeling.

### Key principle: Burr geometry matters more than price

Conical burrs inherently produce more fines than flat burrs at the same grind setting. A $700 conical grinder (Niche Zero, 17% fines) can produce *more* fines than a $350 flat burr grinder (Fellow Ode Gen 2, 11% fines). This is well-established in Gagné's 2023 analysis of 300 PSDs across 24 grinders.

## Grinder Profiles

### Comandante C40 (Standard & Red Clix)

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.11` |
| **Type** | Hand / Conical (Nitro Blade) |
| **Tier** | Premium |
| **Measured fines (<100μm)** | 10–13% at pour-over settings (22–28 clicks) |

The Comandante C40 is a "low-fines" benchmark among consumer hand grinders. Its Nitro Blade burr geometry produces a more unimodal (narrower) distribution than most conical grinders.

**Standard vs Red Clix**: Identical PSD and fines production. The Red Clix only changes adjustment resolution from ~30μm/click to ~15μm/click by modifying the thread pitch. Same burrs, same grind at the same micron target.

**Sources**:
- Gagné, J. (2023). "What I learned from analyzing 300 PSDs." *Coffee ad Astra*. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/ — C40 described as "more unimodal" with lower fines than competitors like Kinu M47 or Mazzer Omega.
- Mim Coffee Lab (2024). "Investigating the size distribution of coffee particles with the Comandante C40 grinder." https://mimcoffeelab.com/en/articles/investigating-the-size-distribution-of-coffee-particles-with-the-comandante-c40-grinder/ — Confirms reduction of fines peak relative to nominal peak as burr spacing increases.
- Hedrick, L. (2023). Laser diffraction dataset. https://www.youtube.com/watch?v=q5GghSxvJCM — Plots C40's stability in fines production compared to other hand grinders.

---

### Timemore Chestnut C2

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.20` |
| **Type** | Hand / Conical (38mm stainless steel) |
| **Tier** | Budget |
| **Measured fines (<100μm)** | 18.5–22% at pour-over settings |

The C2's 38mm stainless steel burrs are optimized for speed, producing higher "crushing" forces compared to "cutting" forces found in premium burr geometries. This leads to increased fines generation and explains the common V60 clogging/stalling issues reported by C2 users.

**Sources**:
- Gagné, J. (2023). 300 PSD analysis. *Coffee ad Astra*. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/
- Kaffeemacher (2023). Hand grinder test with Helos/BR laser diffraction. https://kaffeemacher.de/en/blogs/kaffeewissen/kaffee-handmuhlen-test — Entry-level conical burrs at 18–22% fines at filter settings.
- Brew Coffee Home. "Timemore C2 vs C3." https://www.brewcoffeehome.com/timemore-c2-vs-c3/ — Notes C3's S2C burrs reduce fines by ~3-5% vs C2.

---

### 1Zpresso JX-Pro

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.19` |
| **Type** | Hand / Conical |
| **Tier** | Mid-Premium (all-rounder) |
| **Measured fines (<100μm)** | 18–21% at pour-over settings (~700μm mean) |

The JX-Pro is a versatile "all-rounder" designed for Turkish through French Press. Its traditional burr geometry produces a broader distribution with a significant fines tail. Despite its higher price than the C2, the JX-Pro's strength is espresso versatility rather than low fines at filter settings.

**Sources**:
- Gagné, J. (2023). 300 PSD analysis. *Coffee ad Astra*. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/ — J-series has higher spread and more fines than K-series.
- Honest Coffee Guide. "1Zpresso JX-Pro grind settings." https://honestcoffeeguide.com/1zpresso-jx-pro-grind-settings/ — Notes consistency drops at upper range due to fines.

---

### 1Zpresso K-Ultra

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.13` |
| **Type** | Hand / Heptagonal (K-Burr) |
| **Tier** | Premium (filter-leaning) |
| **Measured fines (<100μm)** | 12–14% at pour-over settings (~700μm mean) |

The K-Ultra features 1Zpresso's heptagonal "K-Burr" geometry, specifically optimized for high clarity and a narrow PSD. It produces significantly fewer fines than the J-series, resulting in faster drawdown and higher clarity.

**Sources**:
- 1Zpresso. Official comparison: JX-Pro vs K-Pro vs K-Plus vs K-Max. https://1zpresso.coffee/jxpro-vs-kpro-vs-kplus-vs-kmax/ — K-series "generates fewer fine particles."
- Kaffeemacher / Gagné (2023). Laser diffraction data for K-series. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/ — K-Max/Ultra shows narrower main peak and lower fines % than J-series.

---

### Baratza Encore

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.19` |
| **Type** | Electric / Conical (40mm M3 burrs) |
| **Tier** | Budget |
| **Measured fines (<100μm)** | ~19% at pour-over settings |

The Baratza Encore is the entry-level electric grinder benchmark. Its 40mm conical M3 burrs produce moderate-high fines, leading to moderate body with some muddying of flavor notes in light-roast pour-overs.

**Sources**:
- Kaffeemacher (2023). Grinder comparison with Helos/BR laser diffraction. https://kaffeemacher.de/blogs/kaffeewissen/kaffee-partikelverteilung — Entry-level conical burrs (including Encore) at 18–22% fines at filter settings.
- Gagné, J. (2023). 300 PSD analysis. *Coffee ad Astra*. — Mid-range consumer grinders at 18–25% fines.

---

### Niche Zero

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.17` |
| **Type** | Electric / Conical (63mm Mazzer Kony burrs) |
| **Tier** | Premium (espresso-optimized) |
| **Measured fines (<100μm)** | ~17% at pour-over settings |

While marketed as a premium grinder, the Niche Zero is optimized for espresso. At filter settings, its 63mm conical Mazzer Kony burrs still produce a notable bimodal distribution. Gagné notes that traditional conical burrs like the Niche's produce significantly more fines than modern unimodal flat burrs, contributing to "thick body" but lower "flavor separation."

**Sources**:
- Gagné, J. (2023). 300 PSD analysis. *Coffee ad Astra*. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/ — Niche Zero sits at higher end of fines spectrum vs flat burr alternatives.
- Hedrick, L. (2023). Grinder comparison. https://www.youtube.com/watch?v=S0X2_5HnN9o — Conical grinders (including Niche) vs flat burrs in filter clarity tests.

---

### Fellow Ode (Gen 2)

| Property | Value |
|----------|-------|
| **defaultFinesFraction** | `0.11` |
| **Type** | Electric / Flat (64mm Gen 2 Brew Burrs) |
| **Tier** | Mid-Range (filter-focused) |
| **Measured fines (<100μm)** | ~10–12% at pour-over settings |

The Fellow Ode Gen 2 was specifically redesigned to address fines issues of the Gen 1. Its 64mm flat burr geometry produces a highly unimodal distribution with a sharp main peak and minimal fines — making it one of the cleanest-grinding consumer electric grinders for filter coffee.

**Sources**:
- Fellow Products. "Preliminary Performance of Ode Brew Grinder." https://fellowproducts.com/blogs/learn/preliminary-performance-of-ode-brew-grinder
- Hedrick, L. (2023). Grinder comparisons. https://www.youtube.com/watch?v=S0X2_5HnN9o — Gen 2 Brew Burrs at ~10-12% fines at 800μm target.

---

## Grinder Quality Tiers (General Classification)

Based on Gagné's research framework, grinders fall into these general tiers by fines production:

| Tier | Fines Fraction (<100μm) | Grinders in Simulator |
|------|------------------------|-----------------------|
| **Excellent** (≤5%) | Ultra-low fines, lab/commercial | — |
| **Premium** (6–12%) | Low fines, high clarity | Comandante C40, Fellow Ode Gen 2 |
| **Good** (13–20%) | Moderate fines, balanced | 1Zpresso K-Ultra, Niche Zero, 1Zpresso JX-Pro, Baratza Encore, Timemore C2 |
| **Budget** (21–30%) | High fines, heavy body | — |
| **Blade** (>30%) | Extreme fines, inconsistent | — |

### General tier mapping from Gagné 2023:

| Grinder Category | Typical Fines (<100μm) |
|-----------------|----------------------|
| Blade grinders | >35% |
| Entry-level burr (Hario Skerton, budget ceramic) | 25–35% |
| Mid-range consumer (Baratza Encore, Wilfa Svart) | 18–25% |
| Premium prosumer (Niche Zero, Baratza Forté) | 15–20% |
| Ultra-low fines / lab (EK43, Weber EG-1 w/ SSP ULF) | 8–12% |

**Sources**:
- Gagné, J. (2023). "What I learned from analyzing 300 PSDs." *Coffee ad Astra*. https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders/
- Gagné, J. (2021). *The Physics of Filter Coffee*. — Bimodal PSD model with fines defined at <100μm.
- Gagné, J. (2021). "Pulling low-fines espresso shots." *Coffee ad Astra*. https://coffeeadastra.com/2021/04/14/pulling-low-fines-espresso-shots/
- Gagné, J. (2019). "The dynamics of coffee extraction." *Coffee ad Astra*. https://coffeeadastra.com/2019/01/29/the-dynamics-of-coffee-extraction/ — Fines have very large surface-to-volume ratio, extract very fast.
- Rao, S. (2017). "Fines: fine for espresso, not so fine for filter." https://www.scottrao.com/blog/2017/8/27/fines-fine-for-espresso-not-so-fine-for-filter — Minimize fines in filter brewing for clarity.
