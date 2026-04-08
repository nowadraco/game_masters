const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'latest.json');

if (!fs.existsSync(filePath)) {
    console.error(`Erro: O arquivo ${filePath} não foi encontrado.`);
    process.exit(1);
}

const rawData = fs.readFileSync(filePath);
const gameMaster = JSON.parse(rawData);

const templates = Array.isArray(gameMaster) ? gameMaster : (gameMaster.itemTemplates || []);

const pokemonData = [];
const movesData = [];

templates.forEach(item => {
    const templateId = item.templateId || item.template_id;
    const data = item.data || {};
    
    if (!templateId) return;

    const pSettings = data.pokemonSettings || data.pokemon_settings;
    
    if (templateId.startsWith('V') && templateId.includes('_POKEMON_') && pSettings) {
        pokemonData.push({
            templateId: templateId,
            pokemonId: pSettings.pokemonId || pSettings.pokemon_id,
            form: pSettings.form || "NORMAL",
            stats: pSettings.stats ? {
                baseStamina: pSettings.stats.baseStamina || pSettings.stats.base_stamina,
                baseAttack: pSettings.stats.baseAttack || pSettings.stats.base_attack,
                baseDefense: pSettings.stats.baseDefense || pSettings.stats.base_defense
            } : null,
            types: {
                type1: pSettings.type || pSettings.type_1,
                type2: pSettings.type2 || pSettings.type_2 || null
            },
            // Gênero (Puxa as configurações de probabilidade)
            gender: pSettings.gender || "GENDERLESS",
            // Tamanhos XXS/XXL
            sizeSettings: {
                pokedexHeightM: pSettings.pokedexHeightM || pSettings.pokedex_height_m,
                pokedexWeightKg: pSettings.pokedexWeightKg || pSettings.pokedex_weight_kg,
                heightStdDev: pSettings.heightStdDev || pSettings.height_std_dev,
                weightStdDev: pSettings.weightStdDev || pSettings.weight_std_dev
            },
            // EVOLUÇÕES
            evolutions: (pSettings.evolutionBranch || pSettings.evolution_branch || []).map(evo => ({
                evolution: evo.evolution,
                candyCost: evo.candyCost || evo.candy_cost,
                form: evo.form,
                questRequirement: evo.questDisplay || evo.quest_display || null
            })),
            // MEGA EVOLUÇÕES (Correção do erro de sintaxe aqui)
            megaEvolutions: (pSettings.tempEvoOverrides || pSettings.temp_evo_overrides || []).map(mega => ({
                tempEvoId: mega.tempEvoId || mega.temp_evo_id,
                stats: mega.stats,
                averageEnergyCost: mega.averageEnergyCost || mega.average_energy_cost,
                energyCost: mega.energyCost || mega.energy_cost,
                raidSpawn: mega.raidSpawn || mega.raid_spawn
            })),
            encounter: pSettings.encounter ? {
                baseCaptureRate: pSettings.encounter.baseCaptureRate || 0,
                baseFleeRate: pSettings.encounter.baseFleeRate || 0
            } : {},
            quickMoves: pSettings.quickMoves || pSettings.quick_moves || [],
            cinematicMoves: pSettings.cinematicMoves || pSettings.cinematic_moves || []
        });
    }
    
    // 2. Combate e Movimentos
    const mSettings = data.moveSettings || data.move_settings || data.combatMove || data.combat_move;
    if (templateId.includes('_MOVE_') && mSettings) {
        movesData.push({
            templateId: templateId,
            movementId: mSettings.movementId || mSettings.uniqueId,
            pokemonType: mSettings.pokemonType || mSettings.type,
            power: mSettings.power || 0,
            energyCost: mSettings.energyDelta || 0,
            durationMs: mSettings.durationMs || 0
        });
    }
});

fs.writeFileSync(path.join(__dirname, 'pokemon_stats_forms.json'), JSON.stringify(pokemonData, null, 2));
fs.writeFileSync(path.join(__dirname, 'combat_moves_animations.json'), JSON.stringify(movesData, null, 2));

console.log(`Sucesso! JSONs gerados com Evoluções, Megas e Tamanhos.`);
console.log(`- Pokémon encontrados: ${pokemonData.length}`);
console.log(`- Movimentos encontrados: ${movesData.length}`);