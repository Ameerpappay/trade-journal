document.getElementById("tag-form").onsubmit = async (e) => {
  debugger;
  e.preventDefault();
  const form = e.target;
  await window.api.addTag(form.tag.value);
  form.reset();
  renderSettings();
};

document.getElementById("strategy-form").onsubmit = async (e) => {
  debugger;
  e.preventDefault();
  const form = e.target;
  await window.api.addStrategy(form.strategy.value);
  form.reset();
  renderSettings();
};

console.log("Settings script loaded");
