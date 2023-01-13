import { OseDice } from "../dice";
import { OSE } from "../config";

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class OseItem extends Item {
  // Replacing default image */
  static get defaultIcons() {
    return {
      spell: `${OSE.assetsPath}/default/spell.png`,
      ability: `${OSE.assetsPath}/default/ability.png`,
      armor: `${OSE.assetsPath}/default/armor.png`,
      weapon: `${OSE.assetsPath}/default/weapon.png`,
      item: `${OSE.assetsPath}/default/item.png`,
      container: `${OSE.assetsPath}/default/bag.png`,
    };
  }

  static async create(data, context = {}) {
    if (data.img === undefined) {
      data.img = this.defaultIcons[data.type];
    }
    return super.create(data, context);
  }

  prepareData() {
    super.prepareData();
  }

  async prepareDerivedData() {
    // Rich text description
    this.system.enrichedDescription = await TextEditor.enrichHTML(
      this.system.details?.description || this.system.description,
      { async: true }
    );
  }

  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }

  async getChatData(htmlOptions) {
    const itemType = this.type;

    const itemData = this.system;

    // Item properties
    const props = [];

    if (itemType == "weapon") {
      itemData.tags.forEach((t) => props.push(t.value));
    }
    if (itemType == "spell") {
      props.push(
        `${itemData.class} ${itemData.lvl}`,
        itemData.range,
        itemData.duration
      );
    }
    if (itemData.hasOwnProperty("equipped")) {
      props.push(itemData.equipped ? "Equipped" : "Not Equipped");
    }

    // Filter properties and return
    itemData.properties = props.filter((p) => !!p);
    return itemData;
  }

  rollWeapon(options = {}) {
    let isNPC = this.actor.type != "character";
    const targets = 5;
    const itemData = this.system;

    let type = isNPC ? "attack" : "melee";
    const rollData = {
      item: this._source,
      actor: this.actor,
      roll: {
        save: itemData.save,
        target: null,
      },
    };

    if (itemData.missile && itemData.melee && !isNPC) {
      // Dialog
      new Dialog({
        title: "Choose Attack Range",
        content: "",
        buttons: {
          melee: {
            icon: '<i class="fas fa-fist-raised"></i>',
            label: "Melee",
            callback: () => {
              this.actor.targetAttack(rollData, "melee", options);
            },
          },
          missile: {
            icon: '<i class="fas fa-bullseye"></i>',
            label: "Missile",
            callback: () => {
              this.actor.targetAttack(rollData, "missile", options);
            },
          },
        },
        default: "melee",
      }).render(true);
      return true;
    } else if (itemData.missile && !isNPC) {
      type = "missile";
    }
    this.actor.targetAttack(rollData, type, options);
    return true;
  }

  async rollFormula(options = {}) {
    const data = this.system;

    if (!data.roll) {
      throw new Error("This Item does not have a formula to roll!");
    }

    const label = `${this.name}`;
    const rollParts = [data.roll];

    let type = data.rollType;

    const newData = {
      actor: this.actor,
      item: this._source,
      roll: {
        type: type,
        target: data.rollTarget,
        blindroll: data.blindroll,
      },
    };

    // Roll and return
    return OseDice.Roll({
      event: options.event,
      parts: rollParts,
      data: newData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OSE.roll.formula", { label: label }),
      title: game.i18n.format("OSE.roll.formula", { label: label }),
    });
  }

  spendSpell() {
    const itemData = this.system;
    this.update({
      data: {
        cast: itemData.cast - 1,
      },
    }).then(() => {
      this.show({ skipDialog: true });
    });
  }

  _getRollTag(data) {
    if (data.roll) {
      const roll = `${data.roll}${
        data.rollTarget ? CONFIG.OSE.roll_type[data.rollType] : ""
      }${data.rollTarget ? data.rollTarget : ""}`;
      return {
        label: `${game.i18n.localize("OSE.items.Roll")} ${roll}`,
      };
    } else {
      return;
    }
  }

  _getSaveTag(data) {
    if (data.save) {
      return {
        label: CONFIG.OSE.saves_long[data.save],
        icon: "fa-skull",
      };
    } else {
      return;
    }
  }

  getAutoTagList() {
    const tagList = [];
    const data = this.system;
    const itemType = this.type;

    switch (itemType) {
      case "container":
      case "item":
        break;
      case "weapon":
        tagList.push({ label: data.damage, icon: "fa-tint" });
        if (data.missile) {
          tagList.push({
            label: `${data.range.short}/${data.range.medium}/${data.range.long}`,
            icon: "fa-bullseye",
          });
        }

        // Push manual tags
        data.tags.forEach((t) => {
          tagList.push({ label: t.value });
        });
        break;
      case "armor":
        tagList.push({ label: CONFIG.OSE.armor[data.type], icon: "fa-tshirt" });
        break;
      case "spell":
        tagList.push(
          { label: data.class },
          { label: data.range },
          { label: data.duration }
        );
        break;
      case "ability":
        const reqs = data.requirements.split(",");
        reqs.forEach((req) => tagList.push({ label: req }));
        break;
    }

    const rollTag = this._getRollTag(data);
    if (rollTag) {
      tagList.push(rollTag);
    }

    const saveTag = this._getSaveTag(data);
    if (saveTag) {
      tagList.push(saveTag);
    }

    return tagList;
  }

  pushManualTag(values) {
    const data = this?.system;
    let update = [];
    if (data.tags) {
      update = data.tags;
    }
    let newData = {};
    var regExp = /\(([^)]+)\)/;
    if (update) {
      values.forEach((val) => {
        // Catch infos in brackets
        var matches = regExp.exec(val);
        let title = "";
        if (matches) {
          title = matches[1];
          val = val.substring(0, matches.index).trim();
        } else {
          val = val.trim();
          title = val;
        }
        // Auto fill checkboxes
        switch (val) {
          case CONFIG.OSE.tags.melee:
            newData.melee = true;
            break;
          case CONFIG.OSE.tags.slow:
            newData.slow = true;
            break;
          case CONFIG.OSE.tags.missile:
            newData.missile = true;
            break;
        }
        if (!newData.melee && !newData.slow && !newData.missile)
          update.push({ title: title, value: val, label: val });
      });
    } else {
      update = values;
    }
    newData.tags = update;
    return this.update({ system: newData });
  }

  popManualTag(value) {
    const itemData = this.system;

    const tags = itemData.tags;
    if (!tags) return;

    let update = tags.filter((el) => el.value != value);
    let newData = {
      tags: update,
    };
    return this.update({ data: newData });
  }

  roll(options = {}) {
    const itemData = this.system;
    switch (this.type) {
      case "weapon":
        this.rollWeapon(options);
        break;
      case "spell":
        this.spendSpell(options);
        break;
      case "ability":
        if (itemData.roll) {
          this.rollFormula();
        } else {
          this.show();
        }
        break;
      case "item":
      case "armor":
        this.show();
    }
  }

  /**
   * Show the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async show() {
    const itemType = this.type;
    // Basic template rendering data
    const token = this.actor.token; //v10: prototypeToken?
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token.parent.id}.${token.id}` : null,
      item: this._source,
      data: await this.getChatData(),
      labels: this.labels,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      isSpell: itemType === "spell",
      hasSave: this.hasSave,
      config: CONFIG.OSE,
    };
    templateData.data.properties = this.system.autoTags;

    // Render the chat card template
    const template = `${OSE.systemPath()}/templates/chat/item-card.html`;
    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    const chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      speaker: {
        actor: this.actor.id,
        token: this.actor.token,
        alias: this.actor.name,
      },
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Create the chat message
    return ChatMessage.create(chatData);
  }

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    if (content.style.display == "none") {
      $(content).slideDown(200);
    } else {
      $(content).slideUp(200);
    }
  }

  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;

    // Validate permission to proceed with the roll
    const isTargetted = action === "save";
    if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

    // Get the Actor from a synthetic Token
    const actor = this._getChatCardActor(card);
    if (!actor) return;

    // Get the Item
    const item = actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(
        game.i18n.format("OSE.error.itemNoLongerExistsOnActor", {
          actorName: actor.name,
          itemId: card.dataset.itemId,
        })
      );
    }

    // Get card targets
    let targets = [];
    if (isTargetted) {
      targets = this._getChatCardTargets(card);
    }

    // Attack and Damage Rolls
    if (action === "damage") await item.rollDamage({ event });
    else if (action === "formula") await item.rollFormula({ event });
    // Saving Throws for card targets
    else if (action == "save") {
      if (!targets.length) {
        ui.notifications.error(
          game.i18n.localize("OSE.error.noTokenControlled")
        );
        return (button.disabled = false);
      }
      for (let t of targets) {
        await t.rollSave(button.dataset.save, { event });
      }
    }

    // Re-enable the button
    button.disabled = false;
  }

  static _getChatCardActor(card) {
    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId;
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split(".");
      const scene = game.scenes.get(sceneId);
      if (!scene) return null;
      const tokenData = scene.getEmbeddedDocument("Token", tokenId);
      if (!tokenData) return null;
      const token = new Token(tokenData);
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  static _getChatCardTargets(card) {
    const character = game.user.character;
    const controlled = canvas.tokens.controlled;
    const targets = controlled.reduce(
      (arr, t) => (t.actor ? arr.concat([t.actor]) : arr),
      []
    );
    if (character && controlled.length === 0) targets.push(character);
    return targets;
  }
}
