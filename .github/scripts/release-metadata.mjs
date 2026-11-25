import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const tag = process.env.RELEASE_TAG ?? "";
if (!/^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-(alpha|beta|rc)\.(0|[1-9][0-9]*))?$/.test(tag)) {
  throw new Error("Invalid SemVer release tag");
}

const version = tag.slice(1);
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
if (manifest.version !== version) {
  throw new Error("The package.json version does not match the release tag");
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const sections = [...changelog.matchAll(/^#{2,3} (?:\[([^\]]+)\](?:\([^\n)]*\))?|([0-9][^\s]*))(?:[^\n]*)$/gm)];
const matches = sections.filter((section) => (section[1] ?? section[2]) === version);
if (matches.length !== 1) {
  throw new Error("CHANGELOG.md must contain exactly one section for the release version");
}

const section = matches[0];
const next = sections[sections.indexOf(section) + 1];
const notes = changelog.slice(section.index + section[0].length, next?.index).trim();
if (!notes.replace(/^#{1,6} .*$/gm, "").replace(/<!--[\s\S]*?-->/g, "").trim()) {
  throw new Error("The CHANGELOG.md release section is empty");
}

writeFileSync(join(process.env.RUNNER_TEMP, "release-notes.md"), `${notes}\n`);
appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nis_prerelease=${version.includes("-")}\n`);
