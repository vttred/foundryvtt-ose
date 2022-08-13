interface LenientGlobalVariableTypes {
  // Allowing game to be accessible as a typescript type regardless of whether or not the object has been initialized.
  // See documentation for LenientGlobalVariableTypes in @league-of-foundry-developers/foundry-vtt-types
  game: never;
  canvas: never;
}
