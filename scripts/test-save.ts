async function main() {
  try {
    const body = {
      qrSize: 555,
      title: "Test Title Saved",
      subtitle: "Test Subtitle Saved",
      showCount: true,
      qrPosition: { x: 100, y: 100 },
      titlePosition: { x: 200, y: 200 },
      subtitlePosition: { x: 300, y: 300 },
      countPosition: { x: 400, y: 400 },
      titleStyle: { color: "#ff0000", size: 5 },
      subtitleStyle: { color: "#00ff00", size: 4 },
      countStyle: { color: "#0000ff", size: 3 },
      backgroundImage: "",
    };

    console.log("Sending request to save settings...");
    const res = await fetch("http://localhost:3000/api/qr-display/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
