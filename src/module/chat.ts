import { OseActor } from "./actor/entity";

/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 */
export const addChatMessageContextOptions = function (
  _: JQuery,
  options: ContextMenuEntry[]
) {
  let canApply: ContextMenuEntry["condition"] = (li) =>
    !!canvas.tokens?.controlled.length && !!li.find(".dice-roll").length;
  options.push(
    {
      name: game.i18n.localize("OSE.messages.applyDamage"),
      icon: '<i class="fas fa-user-minus"></i>',
      condition: canApply,
      callback: (li) => applyChatCardDamage(li, 1),
    },
    {
      name: game.i18n.localize("OSE.messages.applyHealing"),
      icon: '<i class="fas fa-user-plus"></i>',
      condition: canApply,
      callback: (li) => applyChatCardDamage(li, -1),
    }
  );
  return options;
};

/* -------------------------------------------- */

export const addChatMessageButtons = function (msg: ChatMessage, html: JQuery) {
  // Hide blind rolls
  let blindable = html.find(".blindable");
  if (
    msg?.blind &&
    msg?.data?.blind && //v9 compatibility
    !game.user?.isGM &&
    blindable &&
    blindable.data("blind") === true
  ) {
    blindable.replaceWith(
      "<div class='dice-roll'><div class='dice-result'><div class='dice-formula'>???</div></div></div>"
    );
  }
  // Buttons
  let roll = html.find(".damage-roll");
  if (roll.length > 0) {
    roll.append(
      $(
        `<div class="dice-damage"><button type="button" data-action="apply-damage"><i class="fas fa-tint"></i></button></div>`
      )
    );
    roll.find('button[data-action="apply-damage"]').on("click", (ev) => {
      ev.preventDefault();
      applyChatCardDamage(roll, 1);
    });
  }
};

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} roll    The chat entry which contains the roll data
 * @param {Number} multiplier   A damage multiplier to apply to the rolled damage.
 * @return {Promise}
 */
function applyChatCardDamage(roll: JQuery, multiplier: 1 | -1) {
  const amount = roll.find(".dice-total").last().text();
  const dmgTgt = game.settings.get(game.system.id, "applyDamageOption");
  if (dmgTgt === `targeted`) {
    game.user?.targets.forEach(async (t) => {
      if (game.user?.isGM && t.actor instanceof OseActor)
        await t.actor.applyDamage(amount, multiplier);
    });
  }
  if (dmgTgt === `selected`) {
    canvas.tokens?.controlled.forEach(async (t) => {
      if (game.user?.isGM && t.actor instanceof OseActor)
        await t.actor.applyDamage(amount, multiplier);
    });
  }
}

/* -------------------------------------------- */
