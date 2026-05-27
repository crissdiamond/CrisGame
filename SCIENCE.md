# Scientific Foundations and Mathematical Models of EvoPlanet

This document describes the mathematical models currently used by the EvoPlanet simulation. It is an implementation reference, so constants below mirror the code in `js/planet.js`, `js/simulation.js`, `js/events.js`, and `js/game.js`.

---

## 1. Astrophysics and Stellar Physics

### 1.1 Stellar Luminosity Evolution

Host-star luminosity increases with simulated stellar age:

$$L(t) = (L_{\text{base}} S_{\text{star}}) (1 + t_{\text{star}} \cdot r_{\text{aging}})$$

Where:

* $L_{\text{base}} = 0.05$ for M-dwarfs, $1.0$ for G-dwarfs, and $10.0$ for blue giants.
* $S_{\text{star}}$ is the selected star-size scalar.
* $t_{\text{star}}$ is the star age in Myr.
* $r_{\text{aging}}$ is the stellar aging rate per Myr, based on stellar class:
  * M-dwarf: $r_{\text{aging}} = 10^{-6}$ (extremely slow main-sequence evolution, ~1% increase per 10 Gyr).
  * G-dwarf: $r_{\text{aging}} = 10^{-4}$ (standard solar main-sequence evolution, ~10% increase per 1 Gyr).
  * Blue Giant: $r_{\text{aging}} = 10^{-2}$ (rapid main-sequence evolution, ~10% increase per 10 Myr).

This models real stellar main-sequence evolution, ensuring M-dwarfs remain extremely stable over billions of years, while blue giants brighten rapidly during their short main-sequence lifetimes.

### 1.2 Cosmic Radiation and Surface Shielding

Raw stellar radiation follows an inverse-square orbit law:

$$R_{\text{target}} = \frac{R_{\text{base}}}{d^2}$$

Where $R_{\text{base}} = 4.5$ for M-dwarfs, $1.5$ for G-dwarfs, and $7.5$ for blue giants. If a dust veil is active:

$$R_{\text{target}} \leftarrow \max(0.05, 0.8 R_{\text{target}})$$

The current radiation value relaxes toward that target:

$$R_{t+1} = R_t + (R_{\text{target}} - R_t) \cdot 0.05 \cdot \Delta t$$

Effective biological surface radiation is:

$$R_{\text{surface}} = R \cdot S_{\text{mag}} \cdot (1 - 0.9 O_3)$$

$$S_{\text{mag}} =
\begin{cases}
0.25 & \text{if magnetosphere is active} \\
1.00 & \text{if magnetosphere is lost}
\end{cases}$$

Genetic radiation-defense upgrades further reduce biology-facing radiation:

$$R_{\text{bio}} = R_{\text{surface}} \cdot \max(0.2, 1 - 0.15 L_{\text{rad}})$$

### 1.3 Magnetic Core Decay and Lunar Tidal Preservation

Magnetic strength decays as the core cools:

$$M_{t+1} = \max(0, M_t - 0.07 C_{\text{size}} T_{\text{moon}} \Delta t)$$

$$C_{\text{size}} =
\begin{cases}
1.8 & \text{small planet} \\
1.0 & \text{medium planet} \\
0.4 & \text{large planet}
\end{cases}
\qquad
T_{\text{moon}} =
\begin{cases}
0.5 & \text{Moon present} \\
1.0 & \text{Moon absent}
\end{cases}$$

The magnetosphere is considered lost once $M \lt 20$.

---

## 2. Planetary Thermodynamics

### 2.1 Equilibrium Temperature

The no-atmosphere blackbody baseline is:

$$T_{\text{eq}} = 278 \left(\frac{L}{d^2}\right)^{0.25} - 273.15$$

### 2.2 Greenhouse Heating

Greenhouse heating combines greenhouse gases, pressure, and solvent-vapor feedback:

$$G = (0.6\text{CO}_2 + 1.2\text{CH}_4 + 0.4\text{H}_2) P_{\text{atm}} \cdot 0.45 + V_{\text{vapor}}$$

$$V_{\text{vapor}} =
\begin{cases}
8 \cdot \frac{W}{100} & \text{water active} \\
5 \cdot \frac{A}{100} & \text{ammonia active} \\
0 & \text{methane active}
\end{cases}$$

Where $W$ and $A$ are water and ammonia coverage percentages.

### 2.3 Dust, Orbit, Impact, and Ice-Albedo Terms

Active interventions and impact states add direct climate offsets:

$$\Delta T_{\text{orbit}} =
\begin{cases}
8 & \text{orbital perturbation active} \\
0 & \text{otherwise}
\end{cases}
\qquad
\Delta T_{\text{dust}} =
\begin{cases}
-15 & \text{dust veil active} \\
0 & \text{otherwise}
\end{cases}$$

Glaciation applies a fixed albedo cooling term:

$$\Delta T_{\text{albedo}} =
\begin{cases}
-35 & \text{glaciated} \\
0 & \text{otherwise}
\end{cases}$$

Water worlds glaciate below $-10^\circ\text{C}$ and melt above $5^\circ\text{C}$. Ammonia worlds glaciate below $-85^\circ\text{C}$ and melt above $-55^\circ\text{C}$.

### 2.4 Temperature Update

The target temperature is:

$$T_{\text{target}} = T_{\text{eq}} + G + \Delta T_{\text{orbit}} + \Delta T_{\text{dust}} + \Delta T_{\text{albedo}} + T_{\text{impact}}$$

The actual temperature approaches the target asymptotically:

$$T_{t+1} = T_t + (T_{\text{target}} - T_t) \cdot 0.05 \cdot \Delta t$$

At $T \gt 85^\circ\text{C}$, thermal outgassing adds carbon dioxide and consumes oxygen:

$$\text{CO}_2 \leftarrow \text{CO}_2 + 0.03\Delta t
\qquad
\text{O}_2 \leftarrow \max(0.1, \text{O}_2 - 0.02\Delta t)$$

### 2.5 Solvent Phase Coverage

Each solvent coverage relaxes toward its target only inside its liquid range. Otherwise it freezes out or boils away:

$$C_{t+1} =
\begin{cases}
\max(0, C_t - 2.5\Delta t) & T \lt T_{\text{freeze}} \\
\max(0, C_t - 3.5\Delta t) & T \gt T_{\text{boil}} \\
C_t + (C_{\text{target}} - C_t)0.05\Delta t & \text{liquid range}
\end{cases}$$

The modeled phase ranges are water $(0, 100)$, ammonia $(-78, -33)$, and methane $(-183, -140)$ in degrees Celsius.

---

## 3. Geochemical and Atmospheric Cycles

### 3.1 Prebiotic Soup Synthesis

Organic precursor synthesis uses solvent-specific temperature curves.

Water:

$$S_W = \max\left(0, 1 - \frac{|T - 50|}{45}\right) \min(2, 0.4R) \frac{W}{100} \cdot 8 \cdot B_{\text{tide}}$$

$$B_{\text{tide}} =
\begin{cases}
2.5 & \text{Moon present} \\
1.0 & \text{Moon absent}
\end{cases}$$

Ammonia:

$$S_A = \max\left(0, 1 - \frac{|T + 55|}{25}\right) \min(2, 0.5R) \frac{A}{100} \cdot 6$$

Methane:

$$S_M = \max\left(0, 1 - \frac{|T + 160|}{25}\right) \frac{M_{\text{cov}}}{100} \cdot 5$$

Coverage must exceed $10\%$ for active soup synthesis.

### 3.2 Photolysis and Atmospheric Escape

Water photolysis:

$$P_W = 0.005 R \frac{W}{100}\Delta t$$

$$W \leftarrow W - P_W,\qquad \text{O}_2 \leftarrow \text{O}_2 + 0.4P_W,\qquad \text{H}_2 \leftarrow \text{H}_2 + 0.8P_W$$

Methane photolysis:

$$P_M = 0.006 R \frac{\text{CH}_4}{100}\Delta t$$

$$\text{CH}_4 \leftarrow \text{CH}_4 - P_M,\qquad \text{H}_2 \leftarrow \text{H}_2 + 1.5P_M$$

Hydrogen escape:

$$\text{H}_2 \leftarrow \text{H}_2 - \text{H}_2 E\Delta t$$

$$E =
\begin{cases}
0.04 & \text{magnetosphere active} \\
0.25 & \text{magnetosphere lost}
\end{cases}$$

If the magnetosphere is lost, atmospheric pressure and solvent coverage are also stripped:

$$P_{\text{atm}} \leftarrow \max(0.1, P_{\text{atm}} - 0.003R\Delta t)$$

$$W \leftarrow W - 0.04\Delta t,\qquad A \leftarrow A - 0.05\Delta t,\qquad M_{\text{cov}} \leftarrow M_{\text{cov}} - 0.05\Delta t$$

### 3.3 Geological Outgassing and Weathering

Non-methane worlds receive tectonic volatile resupply:

$$\Delta \text{CO}_2 =
\begin{cases}
0.005\Delta t & M \gt 10 \\
0.001\Delta t & M \le 10
\end{cases}
\qquad
\Delta \text{N}_2 =
\begin{cases}
0.015\Delta t & M \gt 10 \\
0.004\Delta t & M \le 10
\end{cases}$$

Methane worlds receive:

$$\Delta \text{CH}_4 =
\begin{cases}
0.01\Delta t & M \gt 10 \\
0.003\Delta t & M \le 10
\end{cases}
\qquad
\Delta \text{N}_2 =
\begin{cases}
0.005\Delta t & M \gt 10 \\
0.001\Delta t & M \le 10
\end{cases}$$

Silicate weathering removes carbon dioxide:

$$W_{\text{sil}} =
\begin{cases}
0.004\text{CO}_2 \frac{W}{100}\max(0.1, 1 + \frac{T - 15}{30})\Delta t & \text{water} \\
0.003\text{CO}_2 \frac{A}{100}\max(0.1, 1 + \frac{T + 55}{20})\Delta t & \text{ammonia}
\end{cases}$$

$$\text{CO}_2 \leftarrow \max(0.001, \text{CO}_2 - W_{\text{sil}})$$

### 3.4 Oxygen Sinks and Ozone

Ozone forms once oxygen exceeds $2\%$:

$$O_{3,\text{target}} = \min(1, \frac{\text{O}_2}{21})$$

$$O_3 \leftarrow O_3 + (O_{3,\text{target}} - O_3)0.05\Delta t$$

Below $2\%$ oxygen, ozone decays:

$$O_3 \leftarrow \max(0, O_3 - 0.05\Delta t)$$

Excess oxygen is buffered by mineral oxidation:

$$X_{\text{ox}} = (\text{O}_2 - 21)0.008\Delta t$$

$$\text{O}_2 \leftarrow \max(21, \text{O}_2 - X_{\text{ox}})$$

---

## 4. Ecology and Biology Dynamics

### 4.1 Temperature Viability

Thermal resilience expands viable bounds by $2^\circ\text{C}$ per level:

$$\delta_T = 2L_{\text{thermal}}$$

$$T_{\min}' = T_{\min} - \delta_T,\qquad T_{\max}' = T_{\max} + \delta_T$$

$$V_T(T) =
\begin{cases}
0 & T \le T_{\min}' \text{ or } T \ge T_{\max}' \\
1 & T = T_{\text{opt}} \\
\frac{T - T_{\min}'}{T_{\text{opt}} - T_{\min}'} & T_{\min}' \lt T \lt T_{\text{opt}} \\
\frac{T_{\max}' - T}{T_{\max}' - T_{\text{opt}}} & T_{\text{opt}} \lt T \lt T_{\max}'
\end{cases}$$

### 4.2 Logistic Biomass Growth

Living clades use logistic biomass growth:

$$\Delta N = r N \left(1 - \frac{N}{K}\right)\Delta t$$

The implemented $r$ differs by clade, but generally follows:

$$r = r_{\text{base}} V_T V_{\text{resource}} V_{\text{radiation}} V_{\text{gas}} M_{\text{trait}} M_{\text{nudge}}$$

Trait and nudge modifiers include:

$$M_{\text{thermal}} = 1 + 0.1L_{\text{thermal}}$$

$$M_{\text{nudge}} =
\begin{cases}
3.0 & \text{matching nudge active} \\
1.0 & \text{otherwise}
\end{cases}$$

Metabolic efficiency reduces decay and soup consumption:

$$M_{\text{decay}} = \max(0.25, 1 - 0.15L_{\text{metabolic}})$$

### 4.3 Gas and Resource Viability

Anaerobic oxygen toxicity:

$$V_{\text{O2, anaerobe}} = \max\left(0.01, 1 - \frac{\text{O}_2}{25}\right)$$

Aerobic oxygen dependency:

$$V_{\text{O2, aerobic}} = \min\left(1, \frac{\text{O}_2}{\theta_{\text{O2}}}\right)$$

Photosynthetic carbon limitation:

$$V_{\text{CO2}} = \text{clamp}_{[0,1]}\left(\frac{\text{CO}_2}{2}\right)$$

Nitrogen limitation for water-world autotrophs:

$$V_{\text{N2}} = 0.5 + 0.5\text{clamp}_{[0,1]}\left(\frac{\text{N}_2}{40}\right)$$

### 4.4 Biological Atmospheric Feedbacks

Water-world oxygen production is carbon-limited:

$$O_{2,\text{raw}} = (0.06N_{\text{photo}} + 0.08N_{\text{algae}} + 0.12N_{\text{land}} + 0.15N_{\text{gaia}})V_{\text{CO2}}$$

Consumer respiration:

$$R_{\text{aero}} = 0.008N_{\text{sponges}} + 0.01N_{\text{meduses}} + 0.012N_{\text{worms}} + 0.025N_{\text{fish}} + 0.02N_{\text{cambrian}} + 0.05N_{\text{sauropsid}} + 0.06N_{\text{synapsid}} + 0.06N_{\text{cognitive}}$$

Decay flux:

$$D = 0.015N_{\text{living}}$$

Net oxygen and carbon feedback:

$$O_{2,\text{net}} = O_{2,\text{raw}} - R_{\text{aero}} - F_{\text{fire}} - X_{\text{soup}} - D\min(1, \frac{\text{O}_2}{2})$$

$$\text{CO}_{2,\text{prod}} = 0.02N_{\text{anaerobe}} + D + B_{\text{soup}} + C_{\text{fire}} + C_{\text{soup}}$$

Nitrogen cycling:

$$F_{\text{fix}} = (0.025N_{\text{photo}} + 0.06N_{\text{land}})\frac{\text{N}_2}{\text{N}_2 + 30}$$

$$F_{\text{denit}} = 0.04N_{\text{anaerobe}} + 1.5D$$

$$\frac{d\text{N}_2}{dt} = F_{\text{denit}} - F_{\text{fix}} - \min(1, 0.08R)$$

Ammonia-world production:

$$N_{2,\text{raw}} = 0.05N_{\text{ammonic-proto}} + 0.10N_{\text{silico-flora}} + 0.12N_{\text{cryo-hivemind}}$$

$$\text{CO}_{2,\text{cons}} = (0.08N_{\text{silico-flora}} + 0.01N_{\text{ammonic-proto}} + 0.02N_{\text{crystalline}} + 0.01N_{\text{quantum}} + 0.03N_{\text{cryo-hivemind}})V_{\text{CO2}} - D_A$$

Methane-world production:

$$V_{\text{H2}} = \min(1, \frac{\text{H}_2}{5})$$

$$\text{CH}_{4,\text{raw}} = 0.05N_{\text{methane-proto}} + 0.02N_{\text{cryo-organisms}} + 0.01N_{\text{polymer-network}} + 0.05N_{\text{cryo-colloid}} + 0.04N_{\text{thinking-ocean}}$$

$$\text{CH}_{4,\text{net}} = \text{CH}_{4,\text{raw}}V_{\text{H2}} - D_M\min(1, \frac{\text{CH}_4}{10})$$

### 4.5 Biodiversity Tracking

Each unlocked, monitorable clade tracks species count in `biodiversityMap`. If biomass falls below $0.05$, species decline:

$$S_{t+1} = \max\left(0, S_t - \max(1, \lfloor 0.25S_t\Delta t \rfloor)\right)$$

Otherwise species move toward a biomass-derived target:

$$S_{\text{target}} = \lfloor 1.5N \rfloor$$

$$S_{t+1} = \text{round}\left(S_t + (S_{\text{target}} - S_t)0.1M_{\text{nudge}}\Delta t\right)$$

Dead-end clades are capped at $100$ species.

### 4.6 Meiotic Sexual Reproduction

Once sexual reproduction evolves:

* Eukaryote growth gains a $1.25\times$ multiplier.
* Eukaryote carrying capacity increases from $120$ to $180$.
* Later breakthrough rolls gain a $1.30\times$ Poisson rate multiplier. Early origin events such as soup, abiogenesis, photosynthesis, nucleus, endosymbiosis, and sexual reproduction itself are excluded.

---

## 5. Stochastic Evolution Breakthroughs

Life-stage milestones use Poisson firing instead of deterministic threshold flips. A transition can fire only while its environmental and dependency gate is satisfied.

### 5.1 Poisson Roll

For each eligible transition:

$$\lambda = \lambda_{\text{tier}} F_{\text{solvent}} F_{\text{condition}} F_{\text{nudge}} F_{\text{sex}}$$

$$P(\text{fire in tick}) = 1 - e^{-\lambda\Delta t}$$

Where:

$$F_{\text{solvent}} =
\begin{cases}
1.0 & \text{water} \\
0.7 & \text{ammonia} \\
0.5 & \text{methane}
\end{cases}$$

$$F_{\text{nudge}} =
\begin{cases}
3.0 & \text{matching nudge active for 5 Myr} \\
1.0 & \text{otherwise}
\end{cases}$$

This form is time-step invariant: changing simulation speed changes wall-clock pacing, not the underlying per-Myr event probability.

### 5.2 Rarity Tiers and Rewards

Current rarity parameters are:

| Tier | Rate per Myr | Expected wait once gated | Award |
| --- | ---: | ---: | --- |
| COMMON | $10.0$ | $0.1$ Myr | $+25$ Blue |
| NOTABLE | $2.0$ | $0.5$ Myr | $+50$ Blue, $+5$ Silver |
| MAJOR | $0.7$ | $\sim 1.43$ Myr | $+15$ Silver, $+1$ Gold |
| SINGULAR | $0.3$ | $\sim 3.33$ Myr | $+30$ Silver, $+5$ Gold |

`simulation.js` stores a legacy scalar `award` on each tier, but `game.js` applies the multi-tier token payout above when milestone events are processed.

---

## 6. Token Economy and Interventions

### 6.1 Passive Blue-Token Accrual

Blue Mutagen tokens accrue from total biosphere complexity:

$$\Delta B = (0.2 + 0.15Q_{\text{biomass}})\Delta t$$

The biomass rating $Q_{\text{biomass}}$ is a weighted sum of active clade populations. Later and more complex clades have larger weights.

### 6.2 Currency Caps and Conversion

Token caps are:

$$B \le 900,\qquad S \le 200,\qquad G \le 50$$

Exchange rates:

$$50B \rightarrow 1S,\qquad 50S \rightarrow 1G$$

### 6.3 Spending

Blue tokens buy 5 Myr evolution nudges with a $3\times$ breakthrough-rate and growth/speciation multiplier.

Silver tokens buy environmental interventions and permanent trait upgrades. Trait upgrade cost is:

$$C_{\text{upgrade}} = \text{round}(5 \cdot 2.2^{L})$$

Gold tokens are awarded by Major and Singular breakthroughs and are displayed as deflection resources in the UI.
