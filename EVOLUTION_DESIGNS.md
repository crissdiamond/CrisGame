# Phylogenetic Graph Database & Clade Architecture

This document outlines the core mathematical and data design for representing the tree of life in the EvoPlanet simulator as a **Directed Acyclic Graph (DAG)**. This architecture supports speciation branching, horizontal endosymbiotic mergers, and clade biodiversity indices across all three environmental solvents (Water, Ammonia, Methane).

---

## 1. Core Mathematical Model

Rather than tracking single-milestone binary toggles, each taxonomic node represents a distinct clade modeling:

1. **Total Biomass ($M$)**: Represents the total organic abundance of the clade. It grows logistically constrained by the planet's temperature, liquid solvent coverage, and atmospheric gas concentrations:
   $$\frac{dM}{dt} = r \cdot M \cdot \left(1 - \frac{M}{K}\right) - d \cdot M$$
   * Carrying capacity $K$ is dynamically throttled by biological dependencies (e.g. terrestrial herbivores are capped by land plants).
2. **Biodiversity / Species Count ($S$)**: Represents the number of distinct species within the clade.
   * **Speciation**: Spikes when biomass is abundant and stable over time:
     $$\Delta S = \mu \cdot M \cdot \Delta t$$
   * **Extinction**: Plummets during rapid temperature swings, radiation spikes, or depletion of solvent levels.
   * **Stagnation (Dead-Ends)**: Extinct or specialized extremophile clades (such as hydrothermal vent methanogens) have a low species count cap ($S_{\text{max}} \approx 100$) and lack the capacity to branch further.

---

## 2. Cladistic Graphs per Solvent Line

### A. The Water Line (Standard biochemistry)
Models Earth's biological history, capturing key endosymbiotic mergers:
* **Prebiotic Soup** ➔ **LUCA** ➔ splits into **Archaea** and **Bacteria**.
* **Bacteria** splits into **Chemotrophs**, **Anoxygenic Photosynthesizers**, **Alphaproteobacteria**, and oxygenic **Cyanobacteria**.
* **Merger 1 (Eukaryogenesis)**: Archaeal host + Alphaproteobacterium ➔ **Eukaryota** (Mitochondria).
* **Merger 2 (Plastid Endosymbiosis)**: Eukaryota + Cyanobacteria ➔ **Archaeplastida (Algae)**.
* **Metazoa Branches**: Eukaryotes ➔ Sponges ➔ Cnidarians ➔ Bilateria (Worms).
* **Invertebrate Line**: Bilateria ➔ Cambrian Invertebrates ➔ Land Insects.
* **Vertebrate Line**: Bilateria ➔ Jawless Agnatha ➔ Jawed Fish ➔ Lobe-finned Fish ➔ Amphibians ➔ Amniotes.
* **Amniote Divergence**: Amniotes ➔ Sauropsida (Dinosaurs/Birds) vs. Synapsida (Therapsids ➔ Mammals ➔ Primates ➔ Humans).
* **Terrestrial Plant Line**: Algae ➔ Mosses ➔ Ferns ➔ Gymnosperms ➔ Angiosperms.

### B. The Ammonia Line (Cryogenic polar worlds)
Models silicon-based and nitrogen-fueled biochemistry in cryogenic liquid ammonia oceans ($-78^\circ\text{C}$ to $-33^\circ\text{C}$):
* **Ammonic Soup** ➔ **Ammonic Prokaryotes**.
* **Prokaryote Split**:
  * **Ammonic Chemotrophs** (metabolizing dissolved sulfur).
  * **Ammonic Phototrophs** (silico-photosynthesis venting molecular nitrogen, $\text{N}_2$).
* **Merger 1**: Ammonic Archaeon + Aerobic Alpha-proteoid ➔ **Ammonic Eukaryotes**.
* **Merger 2 (Plastid Equivalent)**: Ammonic Eukaryotes + Ammonic Phototrophs ➔ **Silico-Flora** (silicon-chain plant analogues).
* **Animal equivalents (Ammonic Metazoa)**:
  * Ammonic Eukaryotes ➔ **Ammonic Sponges** ➔ **Cryo-Cnidaria** ➔ **Ammonic Bilateria**.
  * **Crystalline Collective branch**: Bilateria ➔ **Crystalline Swarms** (silicon-mineral invertebrates) ➔ **Quantum Lattices** (solid-state crystalline computing collectives).
  * **Fauna branch**: Bilateria ➔ **Ammonic Megafauna** ➔ **Glacier Swarm Hiveminds**.

### C. The Methane Line (Titan-like cryogenic worlds)
Models apolar lipidless biology in liquid hydrocarbon basins ($-183^\circ\text{C}$ to $-140^\circ\text{C}$):
* **Hydrocarbon Soup** ➔ **Cryo-Methanogen Prokaryotes**.
* **Prokaryote Split**:
  * **Cryo-Methanogens** (consume acetylene $\text{C}_2\text{H}_2$ and hydrogen $\text{H}_2$, venting methane $\text{CH}_4$).
  * **Tholin-based Phototrophs** (harvest UV to split hydrocarbon aerosols).
* **Merger 1**: Prokaryotic Host + Methanoid Respirator ➔ **Cryo-Eukaryotes**.
* **Merger 2**: Cryo-Eukaryotes + Tholin Phototrophs ➔ **Cryo-Polymer Networks** (photosynthetic equivalents).
* **Organismal Divergence**:
  * **Cyto-Beasts**: Multicellular organisms with azotosome (nitrogen-rich) apolar membranes.
  * **Thinking Methane Oceans**: Colloidal liquid-based computing matrices.
  * **Megastructure Cryo-Colloids**: Massive crystalline structures optimized for cold-active superconductivity.

---

## 3. UI Cladogram rendering (SVG DAG)

The Evolution tab will display an interactive visual cladogram using SVG bezier curves:
* **Generational Columns**: Nodes are positioned in columns representing their evolutionary depth.
* **Merger Anchors**: Solid lines from Archaea/Bacteria join at Eukaryotes, and Eukaryotes/Cyanobacteria join at Algae, providing visual clarity on endosymbiosis.
* **Nudge Interactive nodes**: Players can click clades to view active species count, biomass density, and spend Blue Mutagen tokens (🔹) to nudge mutation rates.
* **Extinction Shading**: Extinct nodes fade out; stagnant dead-ends are colored in steel-gray to highlight evolutionary traps.
