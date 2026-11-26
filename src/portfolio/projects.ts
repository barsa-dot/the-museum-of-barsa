import { profile } from "../data/profile/profile";
import registry from "../../projects.json";

type Link = { label: string; url: string };

export type PortfolioProject = {
  id: string;
  name: string;
  category: string;
  summary: string;
  purpose: string;
  contribution: string;
  stack: string[];
  links: Link[];
};

const taskNest = registry.find(project => project.id === "tasknest")!;

export const projects: PortfolioProject[] = [
  {
    id: taskNest.id,
    name: taskNest.name,
    category: "Productivity",
    summary: "An offline-first planner for student life.",
    purpose: taskNest.problem,
    contribution: "I designed and built TaskNest end to end, from the offline task store and cross-device sync to the planner, focus timer and progress system.",
    stack: taskNest.stack,
    links: [{ label: "Open TaskNest", url: taskNest.liveUrl }],
  },
  {
    id: "authordna",
    name: "AuthorDNA",
    category: "Writing tools",
    summary: "An explainable profile of how you write.",
    purpose: "Help writers see recurring habits across samples and compare a new draft with their own writing profile.",
    contribution: "I worked on the rule-based analysis and the interface that explains measures such as sentence variation, vocabulary and punctuation.",
    stack: ["Python", "FastAPI", "textstat", "JavaScript", "IndexedDB"],
    links: [
      { label: "Open AuthorDNA", url: "https://authordna.onrender.com/" },
    ],
  },
  {
    id: "desi-zayka",
    name: "Desi Zayka",
    category: "Food & commerce",
    summary: "From browsing the menu to ordering on WhatsApp.",
    purpose: "Give customers of a Bengaluru cloud kitchen a way to discover dishes and start an order on WhatsApp.",
    contribution: "I worked on the menu browsing and ordering flow, connecting dish discovery to the conversation that starts an order.",
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Sanity"],
    links: [],
  },
  {
    id: "arcade",
    name: "Arcade2.0",
    category: "Game development",
    summary: "Four classic games in one playable hub.",
    purpose: "Explore 2D game programming through Snake, Pong, Breakout and Space Shooter.",
    contribution: "I helped build the playable games and the launcher that brings them together.",
    stack: ["Python", "Pygame"],
    links: [{ label: "Source on GitHub", url: "https://github.com/barsa-dot/Arcade2.0" }],
  },
];

export const github = profile.contact.github!;
export const portrait = profile.portrait.photo;
