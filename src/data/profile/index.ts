import projectsJson from "../../../projects.json";
import { parseProjects } from "./project";

export * from "./types";
export * from "./project";
export * from "./selectors";
export * from "./presentation";
export { profile } from "./profile";

/** All projects from the registry, validated. */
export const projects = parseProjects(projectsJson);
