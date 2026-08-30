/**
 * Parse CompTIA ebook HTML into questions.json for the interactive quiz UI.
 * Usage: node scripts/parse-exam-ebook.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "content/exams/comptia-a-plus-core-1/index.html");
const outPath = path.join(root, "content/exams/comptia-a-plus-core-1/questions.json");

const html = readFileSync(htmlPath, "utf8");
const $ = cheerio.load(html);

const sections = [];
$("section.chapter").each((_, sectionEl) => {
  const $section = $(sectionEl);
  const sectionId = $section.attr("id") ?? "";
  const title = $section.find(".chapter-hero h2").first().text().trim();
  const subtitle = $section.find(".chapter-hero p").not(".kicker").first().text().trim();
  sections.push({ id: sectionId, title, subtitle });
});

const questions = [];
$("article.qcard").each((_, cardEl) => {
  const $card = $(cardEl);
  const id = $card.attr("id") ?? "";
  const answer = ($card.attr("data-answer") ?? "").trim().toUpperCase();
  const num = $card.find(".qnum").first().text().trim();
  const stem = $card.find(".qstem").first().text().trim();
  const explanation =
    $card.find(".ansbox .expl").first().text().trim() ||
    $card.find(".expl").first().text().trim() ||
    "";

  const choices = [];
  $card.find("li.opt").each((__, optEl) => {
    const $opt = $(optEl);
    const letter = ($opt.attr("data-letter") ?? $opt.find(".letter").text()).trim().toUpperCase();
    const clone = $opt.clone();
    clone.find(".letter").remove();
    const text = clone.text().trim();
    if (letter && text) choices.push({ letter, text });
  });

  const sectionEl = $card.closest("section.chapter");
  const sectionId = sectionEl.attr("id") ?? "";
  const sectionTitle = sectionEl.find(".chapter-hero h2").first().text().trim();

  if (!stem || choices.length < 2 || !answer) return;

  questions.push({
    id,
    num,
    stem,
    choices,
    answer,
    explanation: explanation.replace(/\s+/g, " ").trim(),
    sectionId,
    sectionTitle,
  });
});

const payload = {
  slug: "comptia-a-plus-core-1",
  examCode: "220-1101",
  title: "CompTIA A+ Core 1 — Banque de questions",
  subtitle: "Préparez l'examen CompTIA A+ Core 1 (220-1101) avec des questions interactives.",
  questionCount: questions.length,
  sections,
  questions,
};

writeFileSync(outPath, JSON.stringify(payload), "utf8");
console.log(`Wrote ${questions.length} questions → ${outPath}`);
