/**
 * The dependencies allowed between the layers of src/. See docs/architecture/README.md#dependencies
 * @type {import('dependency-cruiser').IConfiguration}
 */
const layer = (name) => `^src/${name}/`;
const TEST_FILE = "\\.test\\.tsx?$";

module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-depends-on-nothing",
      comment: "The domain is plain TypeScript: it imports no other layer and no package.",
      severity: "error",
      from: { path: layer("domain"), pathNot: TEST_FILE },
      to: { pathNot: [layer("domain")] },
    },
    {
      name: "services-depend-only-on-the-domain",
      severity: "error",
      from: { path: layer("services"), pathNot: TEST_FILE },
      to: { pathNot: [layer("services"), layer("domain")] },
    },
    {
      name: "simulation-depends-only-on-services-and-domain",
      severity: "error",
      from: { path: layer("simulation"), pathNot: TEST_FILE },
      to: { pathNot: [layer("simulation"), layer("services"), layer("domain")] },
    },
    {
      name: "ui-knows-no-other-layer",
      comment: "The components are generic: they know nothing of users or short links.",
      severity: "error",
      from: { path: layer("ui"), pathNot: TEST_FILE },
      to: { path: "^src/", pathNot: [layer("ui")] },
    },
    {
      name: "pages-dont-know-the-simulation",
      comment:
        "Pages only know the services' interfaces, so replacing the simulation changes app/.",
      severity: "error",
      from: { path: layer("pages"), pathNot: TEST_FILE },
      to: { path: [layer("simulation"), layer("app")] },
    },
    {
      name: "src-doesnt-import-tests",
      severity: "error",
      from: { path: "^src/", pathNot: TEST_FILE },
      to: { path: ["^tests/", TEST_FILE] },
    },
    {
      name: "src-doesnt-import-dev-dependencies",
      severity: "error",
      from: { path: "^src/", pathNot: TEST_FILE },
      to: { dependencyTypes: ["npm-dev"] },
    },
    {
      name: "no-unresolvable",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.app.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
  },
};
