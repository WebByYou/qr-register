export default defineEventHandler(async (event) => {
  try {
    const settings = await prisma.systemSetting.findMany();

    // Convert array of {key, value} to object
    const settingsObject = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    // Default settings
    const defaultSettings = {
      backgroundImage: "",
      qrPosition: JSON.stringify({ x: 300, y: 150 }),
      titlePosition: JSON.stringify({ x: 960, y: 540 }), // Default center
      subtitlePosition: JSON.stringify({ x: 960, y: 600 }), // Default below title
      countPosition: JSON.stringify({ x: 960, y: 660 }), // Default below subtitle
      titleStyle: JSON.stringify({ color: "#ffffff", size: 3.1 }),
      subtitleStyle: JSON.stringify({ color: "#ffffff", size: 1.5 }),
      countStyle: JSON.stringify({ color: "#ffffff", size: 1.25 }),
      qrSize: "300",
      title: "Lucky Draw",
      subtitle: "ลุ้นรับรางวัลใหญ่",
      showCount: "false",
      showTitle: "true",
      showSubtitle: "true",
    };

    // Merge defaults with stored settings
    const rawSettings = { ...defaultSettings, ...settingsObject };

    const finalSettings: any = { ...rawSettings };

    // Parse JSON fields
    const jsonFields = [
      "qrPosition",
      "titlePosition",
      "subtitlePosition",
      "countPosition",
      "titleStyle",
      "subtitleStyle",
      "countStyle",
    ];
    jsonFields.forEach((field) => {
      try {
        if (typeof finalSettings[field] === "string") {
          finalSettings[field] = JSON.parse(finalSettings[field]);
        }
      } catch (e) {
        // Fallback defaults if parse fails
        if (field === "qrPosition") finalSettings[field] = { x: 300, y: 150 };
        if (field === "titlePosition")
          finalSettings[field] = { x: 960, y: 540 };
        if (field === "subtitlePosition")
          finalSettings[field] = { x: 960, y: 600 };
        if (field === "countPosition")
          finalSettings[field] = { x: 960, y: 660 };
        if (field === "titleStyle")
          finalSettings[field] = { color: "#ffffff", size: 3.1 };
        if (field === "subtitleStyle")
          finalSettings[field] = { color: "#ffffff", size: 1.5 };
        if (field === "countStyle")
          finalSettings[field] = { color: "#ffffff", size: 1.25 };
      }
    });

    // Ensure qrSize is number
    finalSettings.qrSize = Number(finalSettings.qrSize);

    // Ensure showCount is boolean
    finalSettings.showCount = finalSettings.showCount === "true";
    finalSettings.showTitle = finalSettings.showTitle !== "false"; // Default true
    finalSettings.showSubtitle = finalSettings.showSubtitle !== "false"; // Default true

    return {
      success: true,
      data: finalSettings,
    };
  } catch (error) {
    console.error("Error reading QR display settings:", error);

    // Return default settings if error
    return {
      success: true,
      data: {
        backgroundImage: "",
        qrPosition: { x: 300, y: 150 },
        qrSize: 300,
        title: "Lucky Draw",
        subtitle: "ลุ้นรับรางวัลใหญ่",
        showCount: false,
      },
    };
  }
});
