import { OseActorSheet } from "./actor-sheet";
import { OseCharacterModifiers } from "../dialog/character-modifiers";
import { OseCharacterGpCost } from "../dialog/character-gp-cost.js";
import { OseCharacterCreator } from "../dialog/character-creation";
import { OSE } from "../config";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OseActorSheetCharacter extends OseActorSheet {
  constructor(...args) {
    super(...args);
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ose", "sheet", "actor", "character"],
      template: `${OSE.systemPath()}/templates/actors/character-sheet.html`,
      width: 450,
      height: 530,
      resizable: true,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
      scrollY: [".inventory"],
    });
  }

  /**
   * Organize and classify Owned Items for Character sheets
   * @private
   */
  _prepareItems(data) {
    const actorItems = this.actor?.items || this.actor?.data?.items; //v9-compatibility
    const containerContents = {};
    // Partition items by category
    let [containers, treasures, items, weapons, armors, abilities, spells] =
      actorItems.reduce(
        (arr, item) => {
          const itemData = item?.system || item?.data?.data; //v9-compatibility
          // Classify items into types
          const containerId = itemData.containerId;
          if (containerId) {
            containerContents[containerId] = [
              ...(containerContents[containerId] || []),
              item,
            ];
          } else if (item.type === "container") arr[0].push(item);
          else if (item.type === "item" && itemData.treasure) arr[1].push(item);
          else if (item.type === "item") arr[2].push(item);
          else if (item.type === "weapon") arr[3].push(item);
          else if (item.type === "armor") arr[4].push(item);
          else if (item.type === "ability") arr[5].push(item);
          else if (item.type === "spell") arr[6].push(item);
          return arr;
        },
        [[], [], [], [], [], [], []]
      );
    // Sort spells by level
    var sortedSpells = {};
    var slots = {};
    for (var i = 0; i < spells.length; i++) {
      const lvl = isNewerVersion(game.version, "10.264")
        ? spells[i].system.lvl
        : spells[i].data.data.lvl;
      if (!sortedSpells[lvl]) sortedSpells[lvl] = [];
      if (!slots[lvl]) slots[lvl] = 0;
      slots[lvl] += isNewerVersion(game.version, "10.264")
        ? spells[i].system.memorized
        : spells[i].data.data.memorized;
      sortedSpells[lvl].push(spells[i]);
    }
    data.slots = {
      used: slots,
    };
    containers.map((container, key, arr) => {
      const arrayItemData = isNewerVersion(game.version, "10.264")
        ? arr[key]?.system
        : arr[key]?.data?.data; //v9-compatibility
      arrayItemData.itemIds = containerContents[container.id] || [];
      arrayItemData.totalWeight = containerContents[container.id]?.reduce(
        (acc, item) => {
          const containedItemData = isNewerVersion(game.version, "10.264")
            ? item?.system
            : item?.data?.data; // v9-compatibility
          return (
            acc +
            containedItemData.weight * (containedItemData.quantity?.value || 1)
          );
        },
        0
      );
      return arr;
    });

    // Assign and return
    data.owned = {
      items: items,
      armors: armors,
      weapons: weapons,
      treasures: treasures,
      containers: containers,
    };
    data.containers = containers;
    data.abilities = abilities;
    data.spells = sortedSpells;

    // Sort by sort order (see ActorSheet)
    [
      ...Object.values(data.owned),
      ...Object.values(data.spells),
      data.abilities,
    ].forEach((o) => o.sort((a, b) => (a.data.sort || 0) - (b.data.sort || 0)));
  }

  generateScores() {
    new OseCharacterCreator(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData() {
    const data = super.getData();
    // Prepare owned items
    this._prepareItems(data);

    if (isNewerVersion(game.version, "10.264")) {
      data.enrichedBiography = await TextEditor.enrichHTML(
        this.object.system.details.biography,
        { async: true }
      );
      data.enrichedNotes = await TextEditor.enrichHTML(
        this.object.system.details.notes,
        { async: true }
      );
    }
    return data;
  }

  async _chooseLang() {
    let choices = CONFIG.OSE.languages;

    let templateData = { choices: choices },
      dlg = await renderTemplate(
        `${OSE.systemPath()}/templates/actors/dialogs/lang-create.html`,
        templateData
      );
    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: "",
        content: dlg,
        buttons: {
          ok: {
            label: game.i18n.localize("OSE.Ok"),
            icon: '<i class="fas fa-check"></i>',
            callback: (html) => {
              resolve({
                choice: html.find('select[name="choice"]').val(),
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("OSE.Cancel"),
          },
        },
        default: "ok",
      }).render(true);
    });
  }

  _pushLang(table) {
    const data = this.actor.data.data;
    let update = data[table]; //V10 compatibility
    this._chooseLang().then((dialogInput) => {
      const name = CONFIG.OSE.languages[dialogInput.choice];
      if (update.value) {
        update.value.push(name);
      } else {
        update = { value: [name] };
      }

      let newData = {};
      newData[table] = update;
      return this.actor.update({ data: newData });
    });
  }

  _popLang(table, lang) {
    const data = this.actor.data.data;
    let update = data[table].value.filter((el) => el != lang);
    let newData = {};
    newData[table] = { value: update };
    return this.actor.update({ data: newData });
  }

  /* -------------------------------------------- */

  _onShowModifiers(event) {
    event.preventDefault();
    new OseCharacterModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  async _onShowGpCost(event, preparedData) {
    event.preventDefault();
    new OseCharacterGpCost(this.actor, preparedData, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  async _onShowItemTooltip(event) {
    let templateData = {},
      dlg = await renderTemplate(
        `${OSE.systemPath()}/templates/actors/partials/character-item-tooltip.html`,
        templateData
      );
    document.querySelector(".game").append(dlg);
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ability-score .attribute-name a").click((ev) => {
      let actorObject = this.actor;
      let element = ev.currentTarget;
      let score = element.parentElement.parentElement.dataset.score;
      let stat = element.parentElement.parentElement.dataset.stat;
      if (!score) {
        if (stat == "lr") {
          actorObject.rollLoyalty(score, { event: ev });
        }
      } else {
        actorObject.rollCheck(score, { event: ev });
      }
    });

    html.find(".exploration .attribute-name a").click((ev) => {
      let actorObject = this.actor;
      let element = ev.currentTarget;
      let expl = element.parentElement.parentElement.dataset.exploration;
      actorObject.rollExploration(expl, { event: ev });
    });

    html.find("a[data-action='modifiers']").click((ev) => {
      this._onShowModifiers(ev);
    });

    html.find("a[data-action='gp-cost']").click((ev) => {
      this._onShowGpCost(ev, this.getData());
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Language Management
    html.find(".item-push").click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const table = header.dataset.array;
      this._pushLang(table);
    });

    html.find(".item-pop").click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const table = header.dataset.array;
      this._popLang(table, $(ev.currentTarget).closest(".item").data("lang"));
    });

    //Toggle Equipment
    html.find(".item-toggle").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        data: {
          equipped: !item.data.data.equipped,
        },
      });
    });

    html.find("a[data-action='generate-scores']").click((ev) => {
      this.generateScores(ev);
    });
  }
}
