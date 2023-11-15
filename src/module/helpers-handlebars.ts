/**
 * @file A place to store Handlebars helpers for our templates
 */
import OSE, { InventoryItemTag } from "./config";

const registerHelpers = async () => {
  // Handlebars template helpers
  Handlebars.registerHelper("eq", (a, b) => a === b);

  Handlebars.registerHelper("mod", (val) => {
    if (val > 0) {
      return `+${val}`;
    }
    if (val < 0) {
      return `${val}`;
    }
    return "0";
  });

  Handlebars.registerHelper(
    "add",
    (lh, rh) => parseInt(lh, 10) + parseInt(rh, 10)
  );

  Handlebars.registerHelper(
    "subtract",
    (lh, rh) => parseInt(lh, 10) - parseInt(rh, 10)
  );

  Handlebars.registerHelper("divide", (lh, rh) =>
    Math.floor(parseFloat(lh) / parseFloat(rh))
  );

  Handlebars.registerHelper(
    "mult",
    (lh, rh) => Math.round(100 * parseFloat(lh) * parseFloat(rh)) / 100
  );

  Handlebars.registerHelper(
    "roundWeight",
    (weight) => Math.round(parseFloat(weight) / 100) / 10
  );

  Handlebars.registerHelper("getTagIcon", (tagValue: string) => {
    const tagKey = (Object.keys(CONFIG.OSE.tags) as InventoryItemTag[])
      // find key for the tag display name who's name matches the provided tag text.
      .find((findTagName) => CONFIG.OSE.tags[findTagName] === tagValue);
    // if that tag key is found, return the image for the tag key
    return tagKey ? CONFIG.OSE.tag_images[tagKey] : null;
  });

  Handlebars.registerHelper("counter", (status, value, max) =>
    status
      ? Math.clamped((100 * value) / max, 0, 100)
      : Math.clamped(100 - (100 * value) / max, 0, 100)
  );

  Handlebars.registerHelper("times", (n, block) => {
    let accum = "";
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < n; ++i) accum += block.fn(i);
    return accum;
  });

  Handlebars.registerHelper(
    "path",
    (relativePath) => `${OSE.systemPath()}${relativePath}`
  );

  Handlebars.registerHelper(
    "asset",
    (relativePath) => `${OSE.assetsPath}${relativePath}`
  );

  Handlebars.registerHelper("ordinalSuffix", (digit: number) => {
    const number = typeof digit === 'number' ? digit : parseInt(digit || '0', 10);
    if (!number) return "";
    const plurals = new Intl.PluralRules("en-US", { type: "ordinal" });
    const suffixes = new Map([
      ["one", "st"],
      ["two", "nd"],
      ["few", "rd"],
      ["other", "th"],
    ]);
    const rule = plurals.select(number);
    const suffix = suffixes.get(rule);
    return new Handlebars.SafeString(`<span>${number}</span><span class="ordinal-suffix">${suffix}</span>`);
  })
};

export default registerHelpers;
