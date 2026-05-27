# Scientific Foundations and Mathematical Models of EvoPlanet

This document details the complete mathematical models, geochemical cycles, and astrobiological equations governing the **EvoPlanet** simulation. It covers the physical, chemical, and biological systems and links them to real-world scientific theories and planetary science models.

---

## 1. Astrophysics & Stellar Physics

### 1.1 Stellar Luminosity Evolution
The stellar luminosity $L(t)$ increases over time due to core helium accumulation, causing the stellar core to compress, heat up, and accelerate nuclear fusion rates (similar to the solar main-sequence evolution).

$$L(t) = \left(L_{\text{base}} \cdot S_{\text{star}}\right) \cdot \left(1.0 + \frac{t_{\text{star}}}{10.0} \times 0.005\right)$$

Where:
* $L_{\text{base}}$ is the base luminosity of the host star type ($0.05$ for $M\text{-dwarf}$, $1.0$ for $G\text{-dwarf}$, $10.0$ for $\text{Blue Giant}$).
* $S_{\text{star}}$ is the star size scalar ($0.5 \le S_{\text{star}} \le 2.0$).
* $t_{\text{star}}$ is the age of the star in million years ($\text{Myr}$).
* **Scientific Note:** The simulation model represents stellar aging at an accelerated rate ($0.5\%$ increase per $10\text{ Myr}$ or $50\%$ per $1\text{ Gyr}$) compared to real-world main-sequence stars (which increase by $\sim 10\%$ per $\text{Gyr}$), maintaining gameplay pacing.

### 1.2 Cosmic Radiation and Effective Surface Radiation
Cosmic and stellar ionizing radiation $R(t)$ follows the inverse-square law based on the orbit distance $d$:

$$R_{\text{cosmic}}(t) = \frac{R_{\text{base}}}{d^2}$$

Where $R_{\text{base}}$ is the stellar emission coefficient ($4.5$ for $M\text{-dwarf}$, $1.5$ for $G\text{-dwarf}$, $7.5$ for $\text{Blue Giant}$). 
Under the presence of an active aerosol **Dust Veil**, radiation is attenuated:

$$R_{\text{cosmic}}(t) \leftarrow R_{\text{cosmic}}(t) \cdot 0.8$$

The **Effective Surface Radiation** $R_{\text{surface}}$ represents the ionizing flux reaching the planetary surface, shielded by the planetary magnetosphere and the ozone layer:

$$R_{\text{surface}} = R_{\text{cosmic}} \cdot \text{Shield}_{\text{mag}} \cdot (1.0 - \text{O}_3 \cdot 0.9)$$

$$\text{Shield}_{\text{mag}} = \begin{cases} 0.25 & \text{if magnetosphere is active } (M \ge 20\%) \\ 1.0 & \text{if magnetosphere is lost } (M < 20\%) \end{cases}$$

### 1.3 Magnetic Core Decay and Lunar Tidal Flexing
The planetary magnetic strength $M(t)$ cools down and decays. If $M < 20\%$, the planet loses its magnetosphere. If a massive Moon is present, **gravitational tidal flexing** provides tidal heating to the planetary mantle/core, slowing thermal cooling by $50\%$:

$$\frac{dM}{dt} = -0.07 \cdot C_{\text{decay}} \cdot \text{Tide}_{\text{moon}}$$

$$\text{Tide}_{\text{moon}} = \begin{cases} 0.5 & \text{if Moon is present} \\ 1.0 & \text{if Moon is absent} \end{cases}$$

Where $C_{\text{decay}}$ is the size-dependent core cooling decay factor ($1.8$ for small, $1.0$ for medium, $0.4$ for large planets).

---

## 2. Planetary Thermodynamics

### 2.1 Stefan-Boltzmann Blackbody Equilibrium Temperature ($T_{\text{eq}}$)
The base blackbody equilibrium temperature $T_{\text{eq}}$ (in $^\circ\text{C}$) of the planet, assuming a default albedo without an atmosphere, is computed from starlight radiation balance:

$$T_{\text{eq}} = 278.0 \cdot \left(\frac{L_{\text{star}}}{d^2}\right)^{0.25} - 273.15$$

### 2.2 Greenhouse Heating ($G$)
The atmosphere traps outbound thermal infrared radiation. The warming contribution scales linearly with gas composition percentages (partial pressures), total atmospheric pressure ($P_{\text{atm}}$), and solvent vapor feedback:

$$G = \left(0.6 \cdot \text{CO}_2 + 1.2 \cdot \text{CH}_4 + 0.4 \cdot \text{H}_2\right) \cdot \left(\frac{P_{\text{atm}}}{1.0}\right) \cdot 0.45 + V_{\text{vapor}}$$

Where the greenhouse feedback $V_{\text{vapor}}$ of the gaseous solvent is:
* **Water Worlds ($T \ge 0^\circ\text{C}$):** $V_{\text{vapor}} = \frac{\text{waterCoverage}}{100.0} \times 8.0$
* **Ammonia Worlds ($-78^\circ\text{C} \le T \le -33^\circ\text{C}$):** $V_{\text{vapor}} = \frac{\text{ammoniaCoverage}}{100.0} \times 5.0$
* **Methane Worlds ($-183^\circ\text{C} \le T \le -140^\circ\text{C}$):** $V_{\text{vapor}} = 0.0$

### 2.3 Ice-Albedo Glaciation Feedback
Plunging below the freezing point of the active solvent triggers glaciation. Reflective ice sheets increase the planet's albedo, resulting in direct cooling:

$$\Delta T_{\text{albedo}} = \begin{cases} -35.0^\circ\text{C} & \text{if } \text{isGlaciated} = \text{true} \\ 0.0^\circ\text{C} & \text{otherwise} \end{cases}$$

Glaciation boundaries:
* **Water:** Triggers at $T < -10.0^\circ\text{C}$; melts at $T > 5.0^\circ\text{C}$.
* **Ammonia:** Triggers at $T < -85.0^\circ\text{C}$; melts at $T > -55.0^\circ\text{C}$.

### 2.4 Final Planetary Temperature Update
The actual planetary temperature $T_{\text{actual}}$ asymptotically approaches the target temperature:

$$T_{\text{target}} = T_{\text{eq}} + G + \Delta T_{\text{orbit}} + \Delta T_{\text{dust}} + \Delta T_{\text{albedo}} + T_{\text{impactOffset}}$$

$$\frac{dT_{\text{actual}}}{dt} = \left(T_{\text{target}} - T_{\text{actual}}\right) \cdot 0.05$$

> [!WARNING]
> **Greenhouse Positive Feedback Loop:**
> If temperature exceeds $85.0^\circ\text{C}$, the planet undergoes thermal outgassing:
> $$\frac{d\text{CO}_2}{dt} \leftarrow \frac{d\text{CO}_2}{dt} + 0.03$$
> This triggers a positive feedback loop: higher temperatures release $\text{CO}_2$, which drives up $G$, raising $T_{\text{target}}$, and evaporating the surface oceans.

---

## 3. Geochemical & Atmospheric Cycles

### 3.1 Prebiotic Soup Synthesis
Under ultraviolet starlight and radiation, simple atmospheric compounds are synthesized into organic compounds (prebiotic soup) in surface basins:

* **Water Worlds ($10^\circ\text{C} < T < 90^\circ\text{C}$):**
  $$\text{Rate}_{\text{synthesis}} = \max\left(0, 1 - \frac{|T - 50|}{45}\right) \cdot \min(2.0, R_{\text{cosmic}} \cdot 0.4) \cdot \frac{\text{waterCoverage}}{100} \cdot 8.0 \cdot \text{Tide}_{\text{boost}}$$
  $$\text{Tide}_{\text{boost}} = \begin{cases} 2.5 & \text{if Moon is present} \\ 1.0 & \text{otherwise} \end{cases}$$
* **Ammonia Worlds ($-80^\circ\text{C} < T < -30^\circ\text{C}$):**
  $$\text{Rate}_{\text{synthesis}} = \max\left(0, 1 - \frac{|T - (-55)|}{25}\right) \cdot \min(2.0, R_{\text{cosmic}} \cdot 0.5) \cdot \frac{\text{ammoniaCoverage}}{100} \cdot 6.0$$
* **Methane Worlds ($-185^\circ\text{C} < T < -135^\circ\text{C}$):**
  $$\text{Rate}_{\text{synthesis}} = \max\left(0, 1 - \frac{|T - (-160)|}{25}\right) \cdot \frac{\text{methaneCoverage}}{100} \cdot 5.0$$

### 3.2 Atmospheric Photolysis
Ionizing radiation photolyzes (splits) solvent vapors in the upper atmosphere:
* **Water Photolysis:** Solar ultraviolet splits gaseous water vapor:
  $$\Delta \text{Photolysis} = 0.005 \cdot R_{\text{cosmic}} \cdot \left(\frac{\text{waterCoverage}}{100.0}\right) \cdot dt$$
  $$\text{waterCoverage} \leftarrow \text{waterCoverage} - \Delta \text{Photolysis}$$
  $$\text{O}_2 \leftarrow \text{O}_2 + 0.4 \cdot \Delta \text{Photolysis}, \quad \text{H}_2 \leftarrow \text{H}_2 + 0.8 \cdot \Delta \text{Photolysis}$$
* **Methane Photolysis:**
  $$\Delta \text{Photolysis} = 0.006 \cdot R_{\text{cosmic}} \cdot \left(\frac{\text{CH}_4}{100.0}\right) \cdot dt$$
  $$\text{CH}_4 \leftarrow \text{CH}_4 - \Delta \text{Photolysis}, \quad \text{H}_2 \leftarrow \text{H}_2 + 1.5 \cdot \Delta \text{Photolysis}$$

### 3.3 Hydrodynamic Escape of Hydrogen
Because molecular hydrogen ($\text{H}_2$) is extremely light, it easily reaches escape velocity in the upper atmosphere and escapes into space. If the protective magnetosphere is lost, solar wind strips hydrogen $6\times$ faster:

$$\frac{d\text{H}_2}{dt} = -\text{H}_2 \cdot \text{EscapeRate}$$

$$\text{EscapeRate} = \begin{cases} 0.04 & \text{if magnetosphere is active} \\ 0.25 & \text{if magnetosphere is lost} \end{cases}$$

### 3.4 Carbonate-Silicate Weathering Thermostat (Walker Feedback)
On Water and Ammonia worlds, carbon dioxide dissolves in rainwater to form carbonic acid, weathering silicate rocks on land. This weathered material washing into oceans sequesters carbon into the crust, acting as a planetary thermostat:

$$\text{Weathering}_{\text{silicate}} = \begin{cases} 0.004 \cdot \text{CO}_2 \cdot \left(\frac{\text{waterCoverage}}{100.0}\right) \cdot \max\left(0.1, 1.0 + \frac{T - 15.0}{30.0}\right) & \text{(Water)} \\ 0.003 \cdot \text{CO}_2 \cdot \left(\frac{\text{ammoniaCoverage}}{100.0}\right) \cdot \max\left(0.1, 1.0 + \frac{T - (-55.0)}{20.0}\right) & \text{(Ammonia)} \end{cases}$$

$$\text{CO}_2 \leftarrow \max(0.001\%, \text{CO}_2 - \text{Weathering}_{\text{silicate}} \cdot dt)$$

### 3.5 Crustal Mineral Oxidation (Oxygen Sink)
When atmospheric oxygen exceeds Earth-like levels ($\text{O}_2 > 21\%$), it chemically reacts with exposed surface rocks (rusting of ferrous minerals), forming geological oxide buffers (representing Banded Iron Formations):

$$\text{Oxidation}_{\text{mineral}} = (\text{O}_2 - 21.0) \cdot 0.008$$

$$\text{O}_2 \leftarrow \max(21.0\%, \text{O}_2 - \text{Oxidation}_{\text{mineral}} \cdot dt)$$

---

## 4. Ecology & Biology Dynamics

### 4.1 Temperature Viability Curve ($V_{\text{temp}}$)
The cellular biochemical reaction rate relies on temperature. Survival rates are modeled as an asymmetric bell curve, broadened by the gene-tuned **Thermal Resilience** upgrade level ($L_{\text{res}}$):

$$\text{Range}_{\text{expansion}} = L_{\text{res}} \cdot 2.0^\circ\text{C}$$

$$T_{\text{min, adj}} = T_{\text{min}} - \text{Range}_{\text{expansion}}, \quad T_{\text{max, adj}} = T_{\text{max}} + \text{Range}_{\text{expansion}}$$

$$V_{\text{temp}}(T) = \begin{cases} 
0.0 & \text{if } T \le T_{\text{min, adj}} \text{ or } T \ge T_{\text{max, adj}} \\
1.0 & \text{if } T = T_{\text{optimal}} \\
\frac{T - T_{\text{min, adj}}}{T_{\text{optimal}} - T_{\text{min, adj}}} & \text{if } T_{\text{min, adj}} < T < T_{\text{optimal}} \\
\frac{T_{\text{max, adj}} - T}{T_{\text{max, adj}} - T_{\text{optimal}}} & \text{if } T_{\text{optimal}} < T < T_{\text{max, adj}}
\end{cases}$$

### 4.2 Logistic Population Growth Model (Verhulst Equation)
Population clades ($N$) grow logistically, constrained by environmental viability ($V_{\text{total}}$), nutrient coefficients ($F_{\text{nutrient}}$), and genetic modifications ($M_{\text{trait}}$):

$$\frac{dN}{dt} = r \cdot N \cdot \left(1 - \frac{N}{K}\right)$$

$$r = r_{\text{base}} \cdot V_{\text{total}} \cdot F_{\text{nutrient}} \cdot M_{\text{trait}} \cdot M_{\text{nudge}}$$

Where:
* $K$ is the carrying capacity cap of the clade.
* $V_{\text{total}} = V_{\text{temp}} \cdot V_{\text{oxygen}} \cdot V_{\text{radiation}} \cdot \left(\frac{\text{solventCoverage}}{100.0}\right)$.
  * **Oxygen Toxicity (Anaerobic):** $V_{\text{oxygen}} = \max\left(0.01, 1 - \frac{\text{O}_2}{25.0}\right)$
  * **Oxygen Dependency (Aerobic Eukaryotes/Fauna):** $V_{\text{oxygen}} = \min\left(1.0, \frac{\text{O}_2}{\text{threshold}}\right)$ *(threshold is $5.0$ to $18.0$ depending on complexity)*
  * **Radiation Viability (Prokaryotes):** $V_{\text{radiation}} = \max\left(0, 1 - \frac{R_{\text{surface}} \cdot (1 - R_{\text{res}})}{\text{threshold}}\right)$ *(threshold is $5.0$ or $6.0$)*
  * **Radiation Viability (Eukaryotes):** $V_{\text{radiation}} = \max\left(0, 1 - \frac{R_{\text{surface}}}{\text{threshold}}\right)$ *(threshold is $2.0$ to $4.0$)*
* $F_{\text{nutrient}}$ is the resource constraint factor (e.g., nitrogen limits plants, soup limits bacteria).
* $M_{\text{nudge}}$ is the **🔹 Blue Mutagen Token** multiplier ($3.0\times$ during active nudge periods).

### 4.3 Nitrogen Cycle Limitations
Nitrogen is key for building amino acids, DNA, and structural proteins. If nitrogen levels drop below $40.0\%$, autotrophic biological growth is penalized:

$$V_{\text{nitrogen}} = 0.5 + 0.5 \cdot \text{clamp01}\left(\frac{\text{N}_2}{40.0}\right)$$

In water-based ecosystems, nitrogen gas ($\text{N}_2$) is biologically fixed and returned via denitrifiers:
* **Biological Nitrogen Fixation:**
  $$\text{Fixation}_{\text{bio}} = \left(0.025 \cdot N_{\text{cyanobacteria}} + 0.06 \cdot N_{\text{landPlants}}\right) \cdot \frac{\text{N}_2}{\text{N}_2 + 30.0}$$
  *(modeled with Michaelis-Menten enzyme saturation kinetics)*
* **Biological Denitrification:**
  $$\text{Denitrification} = 0.04 \cdot N_{\text{anaerobes}} + 1.5 \cdot \text{DecayFlux}$$
* **Net Atmosphere Nitrogen Flux:**
  $$\frac{d\text{N}_2}{dt} = \text{Denitrification} - \text{Fixation}_{\text{bio}} - \text{Fixation}_{\text{atmospheric}}$$

### 4.4 Biodiversity & Speciation Model
Speciation and extinction rates are simulated using discrete difference updates per tick based on living biomass ($M$) and evolutionary speed modifiers:

* **Extinction Mode ($M < 0.05$):**
  $$\Delta S = -\max\left(1, \lfloor S_t \cdot 0.25 \cdot dt \rfloor\right)$$
  $$S_{t+1} = \max(0, S_t + \Delta S)$$
  *(represents exponential population decay and species extinction)*
* **Speciation Mode ($M \ge 0.05$):**
  $$S_{\text{target}} = \lfloor 1.5 \cdot M \rfloor$$
  $$\text{Rate}_{\text{speciation}} = 0.1 \cdot dt \cdot M_{\text{nudge}}$$
  $$S_{t+1} = \text{round}\left(S_t + (S_{\text{target}} - S_t) \cdot \text{Rate}_{\text{speciation}}\right)$$

Where $S$ is the species count of the clade. For evolutionary dead-ends (such as single-celled end-nodes), species count is capped at $S \le 100$.

### 4.5 Meiotic Sexual Reproduction Recombination Boost
Evolving **Sexual Reproduction** provides meiotic advantages:
* **Fisher-Muller / Red Queen Effect:** Eukaryotic carrying capacity cap $K$ is increased from $120$ to $180\text{ M/mL}$.
* **Evolution Speed Booster:** All subsequent complex biological transition rates (unlocks) are boosted by **$30\%$** due to rapid genetic recombination.
