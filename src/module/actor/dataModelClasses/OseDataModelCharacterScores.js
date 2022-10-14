/**
 * A class representing a character's ability scores
 */
export default class OseDataModelCharacterScores {
  static standardAttributeMods = {
    0: -3,
    3: -3,
    4: -2,
    6: -1,
    9: 0,
    13: 1,
    16: 2,
    18: 3,
  }
  static cappedAttributeMods = {
    0: -2,
    3: -2,
    4: -1,
    6: -1,
    9: 0,
    13: 1,
    16: 1,
    18: 2,
  };
  static openDoorMods = {
    0: 0,
    3: 1,
    9: 2,
    13: 3,
    16: 4,
    18: 5,
  };
  static literacyMods = {
    0: "",
    3: "OSE.Illiterate",
    6: "OSE.LiteracyBasic",
    9: "OSE.Literate",
  };
  static spokenMods = {
    0: "OSE.NativeBroken",
    3: "OSE.Native",
    13: "OSE.NativePlus1",
    16: "OSE.NativePlus2",
    18: "OSE.NativePlus3",
  };

  static valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  #str = {};
  #int = {};
  #wis = {};
  #dex = {};
  #con = {};
  #cha = {};

  /**
   * 
   * @param {object} scores An object containing the six primary ability scores.
   * @param {string} scores.str The character's strength 
   * @param {string} scores.int The character's intelligence 
   * @param {string} scores.wis The character's wisdom
   * @param {string} scores.dex The character's dexterity
   * @param {string} scores.con The character's constitution
   * @param {string} scores.cha The character's charisma
   */
  constructor({str, int, wis, dex, con, cha}) {
    this.#str = str;
    this.#int = int;
    this.#wis = wis;
    this.#dex = dex;
    this.#con = con;
    this.#cha = cha;
  }

  get str() {
    return {
      value: this.#str.value,
      bonus: this.#str.bonus,
      mod: this.#strMod,
      od: this.#strOpenDoorsMod
    }
  }
  set str(change) {
    this.#str = {
      ...this.#str,
      ...change
    }
  }

  get #strMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#str.value
    )
  }
  get #strOpenDoorsMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.openDoorMods,
      this.#str.value
    )
  }
  
  get int() {
    return {
      value: this.#int.value,
      bonus: this.#int.bonus,
      mod: this.#intMod,
      literacy: this.#intLiteracyMod,
      spoken: this.#intSpokenLanguagesMod
    }
  }
  set int(change) {
    this.#int = {
      ...this.#int,
      ...change
    }
  }
  get #intMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#int.value
    )
  }
  get #intLiteracyMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.literacyMods,
      this.#int.value
    )
  }
  get #intSpokenLanguagesMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.spokenMods,
      this.#int.value
    )
  }
  
  get wis() {
    return {
      value: this.#wis.value,
      bonus: this.#wis.bonus,
      mod: this.#wisMod
    }
  }
  set wis(change) {
    this.#wis = {
      ...this.#wis,
      ...change
    }
  }
  get #wisMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#wis.value
    )
  }

  get dex() {
    return {
      value: this.#dex.value,
      bonus: this.#dex.bonus,
      mod: this.#dexMod,
      init: this.#dexInitMod
    }
  }
  set dex(change) {
    this.#dex = {
      ...this.#dex,
      ...change
    }
  }
  get #dexMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#dex.value
    )
  }
  get #dexInitMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.cappedAttributeMods,
      this.#dex.value
    );
  }

  get con() {
    return {
      value: this.#con.value,
      bonus: this.#con.bonus,
      mod: this.#conMod
    }
  }
  set con(change) {
    this.#con = {
      ...this.#con,
      ...change
    }
  }
  get #conMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#con.value
    )
  }

  get cha() {
    return {
      value: this.#cha.value,
      bonus: this.#cha.bonus,
      mod: this.#chaMod,
      loyalty: this.#chaLoyaltyMod,
      retain: this.#chaRetainMod,
      npc: this.#chaReactionMod
    }
  }
  set cha(change) {
    this.#cha = {
      ...this.#cha,
      ...change
    }
  }
  get #chaMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.standardAttributeMods,
      this.#cha.value
    )
  }
  get #chaReactionMod() {
    return OseDataModelCharacterScores.valueFromTable(
      OseDataModelCharacterScores.cappedAttributeMods,
      this.#cha.value
    );
  }
  get #chaRetainMod() {
    return this.#chaMod + 4;
  }
  get #chaLoyaltyMod() {
    return this.#chaMod + 7;
  }
}

