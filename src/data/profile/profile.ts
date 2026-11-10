// The Museum of Barsa — the owner's profile.
//
// THE single source of profile facts. Both visual modes read from here.
// Do not add a fact unless the owner has supplied or confirmed it, and leave
// unknown details as `null` / `[]` rather than filling them in.
//
// "verified" = already published by the owner on the existing site.
// "unverified" = known starting point that still needs the owner's
// confirmation and details before it can be shown.

import type { Profile } from "./types";

export const profile: Profile = {
  person: {
    name: "Barsarani Sahoo",
    headline: null,
    introduction: null,
    interests: [],
    verification: "verified",
  },

  // Both made from the owner's own photograph by scripts/make-portraits.mjs
  // (npm run portraits). Files live in app/public/images/.
  portrait: {
    photo: {
      src: "images/portrait.webp",
      alt: "Portrait photograph of Barsarani Sahoo",
      width: 640,
      height: 800,
    },
    pixel: {
      src: "images/portrait-pixel.png",
      alt: "Pixel-art portrait of Barsarani Sahoo, made from her photograph",
      width: 768,
      height: 768,
    },
  },

  education: [
    {
      id: "reva-btech-cse",
      verification: "verified",
      institution: "REVA University",
      qualification: "B.Tech",
      field: "Computer Science and Engineering",
      dates: { start: null, end: null },
      description: null,
      presentation: { developer: { priority: 1, featured: true }, business: { priority: 2 } },
    },
    {
      id: "iimb-bba-dbe",
      verification: "verified",
      institution: "Indian Institute of Management Bangalore",
      qualification: "BBA",
      field: "Digital Business and Entrepreneurship",
      dates: { start: null, end: null },
      description: null,
      presentation: { developer: { priority: 2 }, business: { priority: 1, featured: true } },
    },
  ],

  achievements: [],

  experience: [
    {
      // Role, dates and description to be confirmed by the owner.
      id: "achivia-writing",
      verification: "unverified",
      kind: "writing",
      organisation: "ACHIVIA",
      role: null,
      dates: { start: null, end: null },
      description: null,
      links: [],
    },
  ],

  // Candidate skills from the project plan. Each must be confirmed by the
  // owner before it is published.
  skills: [
    { id: "c", verification: "unverified", name: "C", category: "language" },
    { id: "cpp", verification: "unverified", name: "C++", category: "language" },
    { id: "python", verification: "unverified", name: "Python", category: "language" },
    { id: "javascript", verification: "unverified", name: "JavaScript", category: "language" },
    { id: "typescript", verification: "unverified", name: "TypeScript", category: "language" },
    { id: "sql", verification: "unverified", name: "SQL", category: "data" },
    { id: "react", verification: "unverified", name: "React", category: "framework" },
    { id: "tailwind-css", verification: "unverified", name: "Tailwind CSS", category: "framework" },
    { id: "fastapi", verification: "unverified", name: "FastAPI", category: "framework" },
    { id: "git-github", verification: "unverified", name: "Git and GitHub", category: "tool" },
  ],

  contact: {
    email: null,
    github: { label: "github.com/barsa-dot", url: "https://github.com/barsa-dot" },
    linkedin: null,
    resume: null,
    other: [],
    verification: "verified",
  },
};
