import { describe, it, expect } from "vite-plus/test";
import { parseKlText } from "./generate-library.mjs";

// Shortened real excerpt of pdftotext -layout output.
const SAMPLE = [
  "                            RİSK DEĞERLENDİRME KONTROL LİSTELERİ",
  "                     İŞ SAĞLIĞI VE GÜVENLİĞİ",
  "                OKUL ORTAK KULLANIM ALANLARI                                                                       KL - 01",
  "              GENEL KONTROL LİSTESİ (TÜM OKULLAR)                                  ..…/.…./ 2015",
  "S.NO                             TEHLİKE/PROBLEM                                   EVET      HAYIR               AÇIKLAMALAR",
  "                                                                                                      DEĞİL",
  "1,01      Havalandırmaya ihtiyaç olan yerlerde pencereler açılabiliyor",
  "          mu?",
  "1,2       Tırabzanlar standartlara uygun mu?",
  "      İş Güvenliği Uzmanı               Çalışan Temsilcisi",
  "                          RİSK DEĞERLENDİRME KONTROL LİSTELERİ",
  "1,25    Deprem veya sarsıntı gibi durumlarda devrilebilecek",
  "        ekipmanlar duvara sabitlenmiş mi?",
  "NOT:    Bu forma ekleme veya çıkarma yapılabilir.",
  "ÖNERİLER",
  "* Yeterli havalandırma teçhiz edin.",
  "                  İŞ SAĞLIĞI VE GÜVENLİĞİ                                         Tarih",
  "             ISLAK HACİMLER ( WC VE DUŞLAR )                                 ..…/..……./ 2015     Listesi",
  "                                                                                                              KL - 11",
  "              KONTROL LİSTESİ (TÜM OKULLAR)",
  "S.NO                           TEHLİKE/PROBLEM                                EVET      HAYIR               AÇIKLAMALAR",
  "11.01 Yeterli aydınlatma sağlanmış mı?",
].join("\n");

describe("parseKlText", () => {
  it("splits lists by the item number prefix", () => {
    expect(parseKlText(SAMPLE).map((l) => l.code)).toEqual(["KL-01", "KL-11"]);
  });

  it("takes the title without right-column noise", () => {
    const [kl1, kl11] = parseKlText(SAMPLE);
    expect(kl1.name).toBe("OKUL ORTAK KULLANIM ALANLARI GENEL KONTROL LİSTESİ (TÜM OKULLAR)");
    expect(kl11.name).toBe("ISLAK HACİMLER ( WC VE DUŞLAR ) KONTROL LİSTESİ (TÜM OKULLAR)");
  });

  it("joins multi-line items, continues across pages, drops recommendations", () => {
    const [kl1] = parseKlText(SAMPLE);
    expect(kl1.items).toEqual([
      { no: "1.01", text: "Havalandırmaya ihtiyaç olan yerlerde pencereler açılabiliyor mu?" },
      { no: "1.20", text: "Tırabzanlar standartlara uygun mu?" },
      {
        no: "1.25",
        text: "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?",
      },
    ]);
  });
});
