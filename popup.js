chrome.storage.local.get("activity", (result) => {
  const log = result.activity || [];
  const container = document.getElementById("log");
  container.innerHTML = "";

  log.slice(0, 10).forEach(entry => {
    const li = document.createElement("li");
    const time = new Date(entry.timestamp).toLocaleString();
    const channelInfo = entry.channel ? `<br><strong>Channel:</strong> ${entry.channel}` : "";
    li.innerHTML = `
      <strong>Type:</strong> ${entry.type}
      <br><strong>Title:</strong> ${entry.title}
      <br><strong>URL:</strong> <a href="${entry.url}" target="_blank">${entry.url}</a>
      ${channelInfo}
      <br><strong>Time:</strong> ${time}
    `;
    container.appendChild(li);
  });
});
