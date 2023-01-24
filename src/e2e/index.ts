import macroTests, {
  key as macroKey,
  options as macroOptions
} from '../module/__tests__/macros.test';

import characterItemMacroTests, {
  key as characterItemMacroKey,
  options as characterItemMacroOptions
} from './actor/createItemMacro.test';

import characterTests, {
  key as characterKey,
  options as characterOptions
} from './actor/character.e2e.test.js';

import dataModelCharacterACTests, {
  key as dataModelCharacterACKey,
  options as dataModelCharacterACOptions
} from '../module/actor/data-model-classes/__tests__/data-model-character-ac.test';

import dataModelCharacterScoresTests, {
  key as dataModelCharacterScoresKey,
  options as dataModelCharacterScoresOptions
} from '../module/actor/data-model-classes/__tests__/data-model-character-scores.test';

import dataModelCharacterSpellsTests, {
  key as dataModelCharacterSpellsKey,
  options as dataModelCharacterSpellsOptions
} from '../module/actor/data-model-classes/__tests__/data-model-character-spells.test';

import dataModelCharacterEncumbranceTests, {
  key as dataModelCharacterEncumbranceKey,
  options as dataModelCharacterEncumbranceOptions
} from '../module/actor/data-model-classes/__tests__/data-model-character-encumbrance.test';

import dataModelCharacterMoveTests, {
  key as dataModelCharacterMoveKey,
  options as dataModelCharacterMoveOptions
} from '../module/actor/data-model-classes/__tests__/data-model-character-move.test';

import dataModelCharacterTests, {
  key as dataModelCharacterKey,
  options as dataModelCharacterOptions
} from '../module/actor/data-model-character.test.js';

export type QuenchMethods = {
  [s: string]: any
}

type Quench = {
  registerBatch: (
    key: string,
    tests: Function,
    options: any
  ) => void;
}

Hooks.on('quenchReady', async (quench: Quench) => {
  quench.registerBatch(macroKey, macroTests, macroOptions);
  quench.registerBatch(characterItemMacroKey, characterItemMacroTests, characterItemMacroOptions);
  quench.registerBatch(characterKey, characterTests, characterOptions);
  // Character data model classes
  quench.registerBatch(dataModelCharacterACKey, dataModelCharacterACTests, dataModelCharacterACOptions);
  quench.registerBatch(dataModelCharacterScoresKey, dataModelCharacterScoresTests, dataModelCharacterScoresOptions);
  quench.registerBatch(dataModelCharacterSpellsKey, dataModelCharacterSpellsTests, dataModelCharacterSpellsOptions);
  quench.registerBatch(dataModelCharacterEncumbranceKey, dataModelCharacterEncumbranceTests, dataModelCharacterEncumbranceOptions);
  quench.registerBatch(dataModelCharacterMoveKey, dataModelCharacterMoveTests, dataModelCharacterMoveOptions);
  quench.registerBatch(dataModelCharacterKey, dataModelCharacterTests, dataModelCharacterOptions);
});

