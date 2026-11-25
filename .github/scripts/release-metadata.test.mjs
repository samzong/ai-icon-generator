import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const script = new URL("./release-metadata.mjs", import.meta.url);

function runGate(tag, version, changelog) {
  const directory = mkdtempSync(join(tmpdir(), "release-metadata-"));
  try {
    const output = join(directory, "output");
    writeFileSync(join(directory, "package.json"), JSON.stringify({ version }));
    writeFileSync(join(directory, "CHANGELOG.md"), changelog);
    writeFileSync(output, "");
    const result = spawnSync(process.execPath, [script.pathname], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, RELEASE_TAG: tag, RUNNER_TEMP: directory, GITHUB_OUTPUT: output },
    });
    return {
      status: result.status,
      error: result.stderr,
      output: readFileSync(output, "utf8"),
      notes: result.status === 0 ? readFileSync(join(directory, "release-notes.md"), "utf8") : "",
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const version of ["0.1.2", "0.1.3-alpha.0", "0.1.3-beta.1", "0.1.3-rc.10"]) {
  test(`Accept ${version} with exact notes and release channel`, () => {
    const result = runGate(`v${version}`, version, `### [${version}](https://example.com/compare) (2026-11-25)\n\n### Features\n\n* Release content\n\n## 0.1.0 (2025-01-12)\n\n* Older content\n`);
    assert.equal(result.status, 0, result.error);
    assert.equal(result.output, `version=${version}\nis_prerelease=${version.includes("-")}\n`);
    assert.equal(result.notes, "### Features\n\n* Release content\n");
  });
}

test("Accept unlinked standard-version headings", () => {
  const result = runGate("v0.1.0", "0.1.0", "## 0.1.0 (2025-01-12)\n\n* Initial release\n");
  assert.equal(result.status, 0, result.error);
  assert.equal(result.notes, "* Initial release\n");
});

for (const tag of ["v0.1.0-fix.1", "v01.2.0", "v1.02.0", "v1.2.03", "v1.2.3-rc.01", "v1.2.3-beta1", "v1.2.3+build.1", "1.2.3"]) {
  test(`Reject invalid release tag ${tag}`, () => {
    const result = runGate(tag, tag.slice(1), "## 1.2.3\n\n* Content\n");
    assert.equal(result.status, 1);
    assert.match(result.error, /Invalid SemVer release tag/);
    assert.equal(result.output, "");
  });
}

test("Reject a manifest mismatch before emitting release metadata", () => {
  const result = runGate("v0.1.2", "0.1.1", "## 0.1.2\n\n* Content\n");
  assert.equal(result.status, 1);
  assert.match(result.error, /package.json version does not match/);
  assert.equal(result.output, "");
});

for (const changelog of ["## 0.1.1\n\n* Other version\n", "## 0.1.2\n\n### Features\n\n## 0.1.1\n\n* Older content\n", "## 0.1.2\n\n* First\n\n## 0.1.2\n\n* Duplicate\n"]) {
  test(`Reject absent, empty, or duplicate release notes: ${JSON.stringify(changelog)}`, () => {
    const result = runGate("v0.1.2", "0.1.2", changelog);
    assert.equal(result.status, 1);
    assert.match(result.error, /CHANGELOG.md/);
    assert.equal(result.output, "");
  });
}
