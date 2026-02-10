export type ActionTag = "BASE" | "PERSUASION" | "GOTV";

export type ActionTagGuide = {
  tag: ActionTag;
  maksud: string;
  bilaGuna: string[];
  contohAksi: string[];
};

export const actionTagGuides: Record<ActionTag, ActionTagGuide> = {
  BASE: {
    tag: "BASE",
    maksud: "Jaga dan aktifkan penyokong teras BN supaya kekal bersama kita.",
    bilaGuna: [
      "Bila kerusi BN nampak rapat dan ada risiko undi asas bocor.",
      "Bila data calon belum lengkap dan kita perlu kukuhkan jentera teras dulu.",
    ],
    contohAksi: ["Ziarah penyokong tegar ikut saluran.", "Aktifkan ketua PDM untuk semak komitmen penyokong asas."],
  },
  PERSUASION: {
    tag: "PERSUASION",
    maksud: "Pujuk pengundi atas pagar atau pengundi lembut supaya cenderung kepada BN.",
    bilaGuna: [
      "Bila BN belum menang dan jurang undi masih boleh dikejar.",
      "Bila mesej isu setempat boleh ubah keputusan di lokaliti sasaran.",
    ],
    contohAksi: ["Sesi kecil komuniti fokus isu tempatan.", "Kempen mesej bersegmen untuk pengundi atas pagar."],
  },
  GOTV: {
    tag: "GOTV",
    maksud: "Pastikan penyokong yang sudah cenderung benar-benar keluar mengundi.",
    bilaGuna: [
      "Bila turnout dijangka rendah atau trend keluar mengundi menurun.",
      "Bila hari mengundi hampir dan kita perlu tukar sokongan kepada undi sebenar.",
    ],
    contohAksi: ["Semak senarai belum hadir setiap jam.", "Sediakan pengangkutan/peringatan hari mengundi."],
  },
};

export const actionTagOrder: ActionTag[] = ["BASE", "PERSUASION", "GOTV"];

export const getActionTagsFromText = (text: string): ActionTag[] => {
  const upper = text.toUpperCase();
  return actionTagOrder.filter((tag) => upper.includes(tag));
};

