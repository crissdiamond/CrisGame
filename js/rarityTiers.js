export const RARITY = Object.freeze({
    COMMON:   { name: 'COMMON',   rate: 10.0, award: 25, awardBlue: 25, awardSilver: 0, awardGold: 0 },
    NOTABLE:  { name: 'NOTABLE',  rate: 2.0,  award: 50, awardBlue: 50, awardSilver: 5, awardGold: 0 },
    MAJOR:    { name: 'MAJOR',    rate: 0.7,  award: 15, awardBlue: 0,  awardSilver: 15, awardGold: 1 },
    SINGULAR: { name: 'SINGULAR', rate: 0.3,  award: 30, awardBlue: 0,  awardSilver: 30, awardGold: 5 }
});

export const SOLVENT_RATE_FACTOR = { water: 1.0, ammonia: 0.7, methane: 0.5 };
