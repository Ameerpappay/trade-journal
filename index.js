async function renderTrades() {
  var trades = await window.api.getTrades();
  await renderEjsPartial("trades/list-trades/list-trades.ejs", "main-content", {
    trades,
  });
}

async function renderSettings() {
  var tags = await window.api.getTags();
  var strategies = await window.api.getStrategies();
  await renderEjsPartial("settings/settings.ejs", "main-content", {
    tags,
    strategies,
  });
}

async function renderEjsPartial(
  requestPath,
  containerElement = "main-content",
  data
) {
  debugger;
  let mainElement = document.getElementById(containerElement);
  try {
    const response = await fetch(requestPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    const templateString = await response.text();

    const renderedHtml = ejs.render(templateString, data);
    mainElement.removeChild(mainElement.firstChild);
    mainElement.append(renderedHtml);
    //mainElement.innerHTML = renderedHtml;
  } catch (error) {
    console.error(`Error rendering EJS partial from ${requestPath}:`, error);
    mainElement.innerHTML = `<p style="color: red;">Could not load content for ${requestPath}.</p>`;
  }
}
